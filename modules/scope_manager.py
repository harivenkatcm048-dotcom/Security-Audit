"""
Scope and Safety Manager Module
===============================
Enforces strict defensive boundaries, URL validation, Server-Side Request Forgery
(SSRF) prevention, IP address filtering, redirect safety, and credential redaction.
"""

from dataclasses import dataclass, field
import ipaddress
import re
import socket
from typing import List, Optional, Set, Tuple
from urllib.parse import urlparse, urljoin


class ScopeViolationError(Exception):
    """Raised when an operation or URL violates the defined audit scope or safety policy."""
    pass


class SSRFProtectionError(ScopeViolationError):
    """Raised when an address resolves to a loopback, private, link-local, or cloud metadata IP."""
    pass


@dataclass
class ScopePolicy:
    """Policy rules defining permissible audit targets and safety constraints."""
    target_url: str
    target_host: str
    authorized_hosts: Set[str] = field(default_factory=set)
    allow_subdomains: bool = False
    allow_local_test: bool = False
    block_private_ips: bool = True
    prohibited_cidrs: List[str] = field(default_factory=lambda: [
        "127.0.0.0/8",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "169.254.0.0/16",       # Link-local & Cloud Metadata (169.254.169.254)
        "100.64.0.0/10",       # Shared carrier address space
        "0.0.0.0/8",
        "::1/128",             # IPv6 loopback
        "fe80::/10",           # IPv6 link-local
        "fc00::/7",            # IPv6 unique local
        "::ffff:0:0/96",       # IPv4-mapped IPv6
    ])


class ScopeManager:
    """Defensive scope manager and SSRF firewall for all network requests."""

    # Redaction regex patterns
    SENSITIVE_PATTERNS = [
        re.compile(r"(?i)(bearer\s+)([A-Za-z0-9_\-\.]{12,})"),
        re.compile(r"(?i)(api[_-]?key[=:\s]+)([A-Za-z0-9_\-\.]{8,})"),
        re.compile(r"(?i)(token[=:\s]+)([A-Za-z0-9_\-\.]{8,})"),
        re.compile(r"(?i)(secret[=:\s]+)([A-Za-z0-9_\-\.]{8,})"),
        re.compile(r"(?i)(password[=:]\s*)([^&\s]{4,})"),
        re.compile(r"(?i)(access_key[=:\s]+)([A-Za-z0-9_\-\.]{8,})"),
        re.compile(r"(?i)(aws_session_token[=:\s]+)([A-Za-z0-9_\-\./+=]{16,})"),
    ]

    def __init__(self, target_url: str, allow_subdomains: bool = False,
                 allow_local_test: bool = False, authorized_confirmed: bool = False):
        self.authorized_confirmed = authorized_confirmed
        self.allow_local_test = allow_local_test
        
        parsed = self.validate_and_normalize_url(target_url)
        self.target_url = parsed.geturl()
        self.target_host = parsed.hostname.lower()
        self.scheme = parsed.scheme.lower()
        self.port = parsed.port or (443 if self.scheme == "https" else 80)
        
        # Build policy
        authorized_hosts = {self.target_host}
        self.policy = ScopePolicy(
            target_url=self.target_url,
            target_host=self.target_host,
            authorized_hosts=authorized_hosts,
            allow_subdomains=allow_subdomains,
            allow_local_test=allow_local_test
        )
        
        # Precompile network objects
        self._prohibited_networks = [
            ipaddress.ip_network(cidr) for cidr in self.policy.prohibited_cidrs
        ]

    @staticmethod
    def validate_and_normalize_url(url: str):
        """Validate URL scheme, structure, and hostname."""
        if not url or not isinstance(url, str) or not url.strip():
            raise ValueError("Target URL must be a non-empty string.")
        
        url = url.strip()
        # Ensure scheme is present
        if "://" not in url:
            url = f"https://{url}"
            
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Unsupported URL scheme '{parsed.scheme}'. Only 'http' and 'https' are permitted.")
        
        if not parsed.hostname:
            raise ValueError(f"Invalid URL '{url}': Missing valid hostname.")
        
        # Validate hostname characters (RFC 1123)
        hostname = parsed.hostname.lower()
        if len(hostname) > 253:
            raise ValueError("Hostname exceeds maximum allowable length of 253 characters.")
        
        return parsed

    def is_ip_prohibited(self, ip_str: str) -> Tuple[bool, str]:
        """Check whether an IP address belongs to loopback, private, or metadata ranges."""
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            return True, f"Invalid IP format: {ip_str}"

        # If testing explicitly against local mock target, allow loopback only
        if self.allow_local_test and ip_obj.is_loopback:
            return False, "Allowed for local mock testing"

        # Check standard properties
        if ip_obj.is_loopback:
            return True, "Loopback address (127.0.0.0/8, ::1) is strictly blocked"
        if ip_obj.is_private and not self.allow_local_test:
            return True, "Private RFC1918 / RFC4193 address is strictly blocked"
        if ip_obj.is_link_local:
            return True, "Link-local address (169.254.0.0/16, fe80::/10) is strictly blocked"
        if ip_obj.is_multicast:
            return True, "Multicast address is strictly blocked"
        if ip_obj.is_reserved:
            return True, "Reserved address space is strictly blocked"

        # Check explicit CIDR list (including cloud metadata: 169.254.169.254)
        for net in self._prohibited_networks:
            if ip_obj in net:
                if self.allow_local_test and ip_obj.is_loopback:
                    continue
                return True, f"Prohibited CIDR match ({net})"

        return False, "IP is public and in-scope"

    def resolve_and_validate_host(self, host: str) -> List[str]:
        """
        Resolve a hostname using DNS and verify that NONE of the resolved IPs
        violate SSRF / private network protection rules.
        """
        host = host.lower()
        resolved_ips: List[str] = []

        try:
            addr_info = socket.getaddrinfo(host, None)
            for item in addr_info:
                sockaddr = item[4]
                ip = sockaddr[0]
                if ip not in resolved_ips:
                    resolved_ips.append(ip)
        except socket.gaierror as e:
            raise ScopeViolationError(f"DNS resolution failure for host '{host}': {e}")

        if not resolved_ips:
            raise ScopeViolationError(f"No IP addresses resolved for host '{host}'.")

        # Validate all resolved IPs
        for ip in resolved_ips:
            prohibited, reason = self.is_ip_prohibited(ip)
            if prohibited:
                raise SSRFProtectionError(
                    f"SSRF Safety Violation: Host '{host}' resolved to restricted IP {ip} ({reason})."
                )

        return resolved_ips

    def is_url_in_scope(self, url: str) -> bool:
        """Check whether a URL's host is authorized under the current policy."""
        try:
            parsed = urlparse(url)
            if not parsed.hostname:
                return False
            host = parsed.hostname.lower()
            
            if host in self.policy.authorized_hosts:
                return True
            
            if self.policy.allow_subdomains:
                root = self.policy.target_host
                if host.endswith(f".{root}"):
                    return True
            
            return False
        except Exception:
            return False

    def validate_redirect(self, current_url: str, redirect_url: str) -> str:
        """
        Validate a proposed HTTP redirect. Ensures the target URL resolves safely
        and adheres to the cross-domain policy.
        """
        absolute_target = urljoin(current_url, redirect_url)
        parsed = self.validate_and_normalize_url(absolute_target)
        target_host = parsed.hostname.lower()

        # Check cross-domain scope
        if not self.is_url_in_scope(absolute_target):
            raise ScopeViolationError(
                f"Redirect to '{absolute_target}' rejected: Target host '{target_host}' is outside authorized scope."
            )

        # Validate target IP resolution for SSRF
        self.resolve_and_validate_host(target_host)
        return absolute_target

    @classmethod
    def redact_sensitive(cls, text: str) -> str:
        """Redact sensitive authorization headers, tokens, and passwords from logs/reports."""
        if not text or not isinstance(text, str):
            return text
        
        redacted = text
        for pattern in cls.SENSITIVE_PATTERNS:
            redacted = pattern.sub(r"\1[REDACTED_BY_DEFENSIVE_AUDIT]", redacted)
        return redacted

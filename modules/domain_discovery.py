"""
Domain and Subdomain Discovery Module
=====================================
Discovers publicly observable subdomains using passive Certificate Transparency (CT) logs
and authorized, rate-limited DNS queries against standard organizational prefixes.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import logging
import socket
import time
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.error import URLError, HTTPError
import urllib.request

logger = logging.getLogger("DefensiveAudit.DomainDiscovery")


class DomainDiscovery:
    """Discovers subdomains via passive CT logs and authorized DNS probes."""

    DEFAULT_PREFIXES = [
        "www", "mail", "api", "dev", "staging", "test", "admin", "portal",
        "cdn", "app", "blog", "remote", "vpn", "auth", "status", "docs",
        "shop", "beta", "m", "secure", "git", "cloud", "dashboard", "gateway"
    ]

    def __init__(self, target_host: str, prefixes: Optional[List[str]] = None,
                 use_crt_sh: bool = True, timeout: float = 5.0, max_workers: int = 4):
        self.target_host = target_host.lower().strip()
        self.domain = self._extract_root_domain(self.target_host)
        self.prefixes = prefixes or self.DEFAULT_PREFIXES
        self.use_crt_sh = use_crt_sh
        self.timeout = timeout
        self.max_workers = max_workers

    @staticmethod
    def _extract_root_domain(host: str) -> str:
        parts = host.split(".")
        if len(parts) >= 2:
            return ".".join(parts[-2:])
        return host

    def run_discovery(self) -> Dict[str, Any]:
        """Execute passive CT query and active authorized DNS probes."""
        discovered: Dict[str, Dict[str, Any]] = {}
        limitations: List[str] = []

        # 1. Passive Certificate Transparency (crt.sh)
        if self.use_crt_sh and "." in self.domain:
            ct_subdomains, ct_limitation = self._query_crt_sh()
            for sub in ct_subdomains:
                if sub not in discovered:
                    discovered[sub] = {
                        "hostname": sub,
                        "source": "Certificate Transparency (crt.sh)",
                        "resolved_ips": [],
                        "status": "PASSIVE_OBSERVED"
                    }
            if ct_limitation:
                limitations.append(ct_limitation)

        # 2. Add target_host and standard prefixes
        candidate_hosts: Set[str] = {self.target_host}
        for prefix in self.prefixes:
            candidate_hosts.add(f"{prefix}.{self.domain}")

        # Also resolve passive discoveries
        candidate_hosts.update(discovered.keys())

        # 3. Resolve candidates using safe, bounded threads
        logger.info(f"Resolving {len(candidate_hosts)} candidate hostnames for {self.domain}...")
        resolved_results = self._resolve_candidates(list(candidate_hosts))

        for host, ips in resolved_results.items():
            if ips:
                if host in discovered:
                    discovered[host]["resolved_ips"] = ips
                    discovered[host]["status"] = "ACTIVE_RESOLVED"
                else:
                    discovered[host] = {
                        "hostname": host,
                        "source": "Authorized DNS Probe",
                        "resolved_ips": ips,
                        "status": "ACTIVE_RESOLVED"
                    }

        # Format sorted list
        subdomain_list = sorted(discovered.values(), key=lambda x: x["hostname"])

        limitations.append(
            "Subdomain discovery is non-exhaustive. Only subdomains listed in public CT logs "
            "or matching queried prefixes are observable. Internal split-horizon or unindexed hosts are excluded."
        )

        return {
            "root_domain": self.domain,
            "target_host": self.target_host,
            "total_discovered": len(subdomain_list),
            "subdomains": subdomain_list,
            "limitations": limitations
        }

    def _query_crt_sh(self) -> Tuple[Set[str], Optional[str]]:
        """Query crt.sh Certificate Transparency API via HTTPS."""
        results: Set[str] = set()
        url = f"https://crt.sh/?q=%.{self.domain}&output=json"
        
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "DefensiveSecurityAudit/1.0 (+Authorized Audit Client)",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8", errors="replace"))
                    for entry in data:
                        name_val = entry.get("name_value", "")
                        # crt.sh may return multi-line entries
                        for line in name_val.split("\n"):
                            line = line.strip().lower()
                            # Clean wildcards
                            if line.startswith("*."):
                                line = line[2:]
                            if line.endswith(f".{self.domain}") or line == self.domain:
                                results.add(line)
                    return results, None
        except HTTPError as e:
            return results, f"crt.sh returned HTTP {e.code}; passive discovery omitted."
        except (URLError, TimeoutError):
            return results, "crt.sh query timed out or unreachable; passive discovery omitted."
        except Exception as e:
            return results, f"crt.sh query encountered: {type(e).__name__} ({str(e)})"

        return results, None

    def _resolve_candidates(self, candidates: List[str]) -> Dict[str, List[str]]:
        """Resolve candidate hostnames in parallel with safe thread count."""
        results: Dict[str, List[str]] = {}

        def _resolve(h: str) -> Tuple[str, List[str]]:
            ips: List[str] = []
            try:
                addr_info = socket.getaddrinfo(h, None)
                for item in addr_info:
                    ip = item[4][0]
                    if ip not in ips:
                        ips.append(ip)
            except Exception:
                pass
            return h, ips

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_host = {executor.submit(_resolve, h): h for h in candidates}
            for future in as_completed(future_to_host):
                h, ips = future.result()
                if ips:
                    results[h] = ips

        return results

"""
TLS / SSL Audit Module
======================
Evaluates certificate validity, expiration dates, Subject Alternative Names (SANs),
TLS protocol versions, negotiated cipher suites, and hostname matching.
"""

from datetime import datetime, timezone
import logging
import socket
import ssl
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.TLS")


class TlsAuditor:
    """Performs defensive TLS/SSL cryptographic configuration assessments."""

    WEAK_CIPHERS = ["RC4", "3DES", "DES", "MD5", "NULL", "EXPORT", "anon"]
    DEPRECATED_PROTOCOLS = ["SSLv2", "SSLv3", "TLSv1", "TLSv1.1"]

    def __init__(self, target_host: str, port: int = 443, timeout: float = 4.0):
        self.target_host = target_host
        self.port = port
        self.timeout = timeout

    def run_audit(self) -> Dict[str, Any]:
        """Perform non-intrusive TLS handshake and analyze certificate properties."""
        findings: List[Dict[str, Any]] = []
        limitations: List[str] = []
        cert_info: Dict[str, Any] = {}
        tls_connection: Dict[str, Any] = {}

        # Create safe SSL context
        context = ssl.create_default_context()
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED

        try:
            with socket.create_connection((self.target_host, self.port), timeout=self.timeout) as sock:
                with context.wrap_socket(sock, server_hostname=self.target_host) as ssock:
                    cert = ssock.getpeercert()
                    tls_version = ssock.version()
                    cipher_info = ssock.cipher()
                    
                    tls_connection = {
                        "protocol_version": tls_version,
                        "cipher_name": cipher_info[0] if cipher_info else "Unknown",
                        "cipher_version": cipher_info[1] if cipher_info else "Unknown",
                        "cipher_bits": cipher_info[2] if cipher_info else 0
                    }

                    # Parse certificate details
                    subject = dict(x[0] for x in cert.get("subject", ()))
                    issuer = dict(x[0] for x in cert.get("issuer", ()))
                    sans = [val for (tag, val) in cert.get("subjectAltName", ()) if tag == "DNS"]
                    
                    not_before_str = cert.get("notBefore", "")
                    not_after_str = cert.get("notAfter", "")
                    
                    # Convert dates (format: "May 26 12:00:00 2025 GMT")
                    date_format = "%b %d %H:%M:%S %Y %Z"
                    not_before = datetime.strptime(not_before_str, date_format).replace(tzinfo=timezone.utc)
                    not_after = datetime.strptime(not_after_str, date_format).replace(tzinfo=timezone.utc)
                    now = datetime.now(timezone.utc)
                    
                    days_remaining = (not_after - now).days
                    is_expired = now > not_after

                    cert_info = {
                        "subject": subject,
                        "issuer": issuer,
                        "sans": sans,
                        "valid_from": not_before.isoformat(),
                        "valid_to": not_after.isoformat(),
                        "days_remaining": days_remaining,
                        "is_expired": is_expired,
                        "serial_number": cert.get("serialNumber", "")
                    }

                    # Finding: Certificate Expiration
                    if is_expired:
                        findings.append({
                            "type": "TLS_CERT_EXPIRED",
                            "severity": "CRITICAL",
                            "confidence": "CONFIRMED",
                            "summary": "SSL/TLS Certificate is Expired",
                            "description": f"Certificate expired on {not_after.isoformat()} ({abs(days_remaining)} days ago). Browsers will display security warnings.",
                            "evidence": f"Certificate notAfter={not_after_str}",
                            "remediation": "Renew and deploy an active certificate from an authorized CA immediately."
                        })
                    elif days_remaining <= 14:
                        findings.append({
                            "type": "TLS_CERT_EXPIRING_SOON",
                            "severity": "HIGH",
                            "confidence": "CONFIRMED",
                            "summary": f"Certificate Expires in {days_remaining} Days",
                            "description": f"Certificate expires on {not_after.isoformat()}. Action required to prevent service disruption.",
                            "evidence": f"Certificate notAfter={not_after_str}, days_remaining={days_remaining}",
                            "remediation": "Trigger automated certificate renewal via ACME / Let's Encrypt or cloud certificate manager."
                        })
                    elif days_remaining <= 30:
                        findings.append({
                            "type": "TLS_CERT_EXPIRING_SOON",
                            "severity": "MEDIUM",
                            "confidence": "CONFIRMED",
                            "summary": f"Certificate Expires in {days_remaining} Days",
                            "description": f"Certificate will expire within 30 days ({not_after.isoformat()}).",
                            "evidence": f"Certificate notAfter={not_after_str}",
                            "remediation": "Verify that automated renewal pipelines are configured and scheduled."
                        })
                    else:
                        findings.append({
                            "type": "TLS_CERT_VALID",
                            "severity": "INFO",
                            "confidence": "CONFIRMED",
                            "summary": f"TLS Certificate Valid ({days_remaining} Days Remaining)",
                            "description": f"Certificate issued by '{issuer.get('organizationName', 'Unknown')}' is active until {not_after.isoformat()}.",
                            "evidence": f"Issuer: {issuer.get('organizationName', 'Unknown')}, SANs count: {len(sans)}",
                            "remediation": "Maintain automated monitoring of renewal status."
                        })

                    # Finding: Protocol Version
                    if tls_version in self.DEPRECATED_PROTOCOLS:
                        findings.append({
                            "type": "TLS_LEGACY_PROTOCOL",
                            "severity": "HIGH",
                            "confidence": "CONFIRMED",
                            "summary": f"Deprecated TLS Protocol Negotiated ({tls_version})",
                            "description": f"The server negotiated {tls_version}. Older SSL/TLS versions suffer from known cryptographic vulnerabilities (e.g., POODLE, BEAST).",
                            "evidence": f"Negotiated protocol: {tls_version}",
                            "remediation": "Disable TLSv1.0 and TLSv1.1 on the server/load balancer. Enforce TLSv1.2 or TLSv1.3 exclusively."
                        })
                    else:
                        findings.append({
                            "type": "TLS_MODERN_PROTOCOL",
                            "severity": "INFO",
                            "confidence": "CONFIRMED",
                            "summary": f"Modern TLS Protocol ({tls_version})",
                            "description": f"The connection securely negotiated modern protocol {tls_version}.",
                            "evidence": f"Protocol: {tls_version}, Cipher: {cipher_info[0]}",
                            "remediation": "No remediation required. Continue enforcing TLSv1.2+."
                        })

                    # Finding: Weak Ciphers Check
                    cipher_name = cipher_info[0] if cipher_info else ""
                    if any(w in cipher_name for w in self.WEAK_CIPHERS):
                        findings.append({
                            "type": "TLS_WEAK_CIPHER",
                            "severity": "HIGH",
                            "confidence": "CONFIRMED",
                            "summary": f"Potentially Weak Cipher Suite Negotiated ({cipher_name})",
                            "description": f"Negotiated cipher '{cipher_name}' matches known weak patterns.",
                            "evidence": f"Cipher: {cipher_name}, Bits: {cipher_info[2]}",
                            "remediation": "Configure modern AEAD cipher suites (e.g. ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256)."
                        })

        except ssl.SSLCertVerificationError as e:
            findings.append({
                "type": "TLS_CERT_VERIFICATION_FAILED",
                "severity": "CRITICAL",
                "confidence": "CONFIRMED",
                "summary": "SSL/TLS Certificate Verification Failed",
                "description": f"Certificate could not be verified by trust store: {e.strerror or str(e)}.",
                "evidence": str(e),
                "remediation": "Ensure the certificate chain contains all intermediate CA certificates and matches the requested hostname."
            })
        except ConnectionRefusedError:
            findings.append({
                "type": "TLS_CONNECTION_REFUSED",
                "severity": "LOW",
                "confidence": "CONFIRMED",
                "summary": f"Port {self.port} is Closed / Refusing TLS Connections",
                "description": f"No service accepted TLS connections on port {self.port}.",
                "evidence": f"ConnectionRefusedError on {self.target_host}:{self.port}",
                "remediation": "Ensure HTTPS services are active if web encryption is required."
            })
        except socket.timeout:
            limitations.append(f"TLS handshake timed out after {self.timeout}s on port {self.port}.")
        except Exception as e:
            limitations.append(f"TLS audit encounter error: {type(e).__name__} ({str(e)})")

        limitations.append(
            "Audit inspected the default negotiated cipher suite using client parameters. "
            "Exhaustive cipher enumeration across all legacy suites was skipped to adhere to safe, conservative connection limits."
        )

        for f in findings:
            if "owasp_category" not in f:
                f["owasp_category"] = "A02:2021-Cryptographic Failures"

        return {
            "target_host": self.target_host,
            "port": self.port,
            "certificate": cert_info,
            "connection": tls_connection,
            "findings": findings,
            "limitations": limitations
        }

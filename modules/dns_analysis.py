"""
DNS Analysis Module
===================
Defensive DNS reconnaissance and mail protection evaluation (SPF, DMARC, MX, NS, TXT).
Supports dnspython when installed and falls back to socket/nslookup on standard Python.
"""

from dataclasses import dataclass, field
import logging
import re
import socket
import subprocess
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.DNS")


@dataclass
class DnsFinding:
    record_type: str
    values: List[str]
    description: str
    evidence: str
    confidence: str = "CONFIRMED"


class DnsAnalyzer:
    """Performs defensive DNS record auditing and mail domain posture analysis."""

    def __init__(self, target_host: str, timeout: float = 4.0):
        self.target_host = target_host
        self.timeout = timeout
        self.domain = self._extract_root_domain(target_host)

    @staticmethod
    def _extract_root_domain(host: str) -> str:
        """Extract apex/registered domain candidate."""
        parts = host.lower().strip().split(".")
        if len(parts) >= 2:
            return ".".join(parts[-2:])
        return host

    def run_audit(self) -> Dict[str, Any]:
        """Execute DNS configuration assessment."""
        records: Dict[str, List[str]] = {
            "A": [],
            "AAAA": [],
            "CNAME": [],
            "MX": [],
            "NS": [],
            "TXT": [],
            "SOA": [],
        }
        findings: List[Dict[str, Any]] = []
        limitations: List[str] = []

        # Always populate A / AAAA via standard OS socket resolution first
        try:
            for host_to_check in [self.target_host, self.domain]:
                addr_info = socket.getaddrinfo(host_to_check, None)
                for item in addr_info:
                    family, _, _, _, sockaddr = item
                    ip = sockaddr[0]
                    if family == socket.AF_INET and ip not in records["A"]:
                        records["A"].append(ip)
                    elif family == socket.AF_INET6 and ip not in records["AAAA"]:
                        records["AAAA"].append(ip)
        except Exception as e:
            limitations.append(f"Socket resolution: {e}")

        # Try dnspython with public recursive resolvers
        has_dnspython = False
        try:
            import dns.resolver
            has_dnspython = True
        except ImportError:
            pass

        if has_dnspython:
            records, errs = self._query_dnspython(records)
            limitations.extend(errs)

        # If any of NS, MX, or TXT are empty, run system nslookup fallback
        if not records["NS"] or not records["TXT"] or not records["MX"]:
            records, errs = self._query_standard_fallback(records)
            limitations.extend(errs)

        # Audit SPF records
        spf_records = [r for r in records.get("TXT", []) if "v=spf1" in r.lower()]
        if not spf_records:
            findings.append({
                "type": "EMAIL_SECURITY_MISSING_SPF",
                "severity": "MEDIUM",
                "confidence": "HIGH",
                "summary": "Missing SPF (Sender Policy Framework) Record",
                "description": (
                    f"No TXT record starting with 'v=spf1' was found on '{self.domain}'. "
                    "Receiving mail servers cannot verify whether outgoing messages legitimately originate from your domain."
                ),
                "evidence": f"DNS TXT records checked: {records.get('TXT', []) or 'None found'}",
                "remediation": "Publish an SPF TXT record (e.g., 'v=spf1 include:_spf.google.com ~all' or your provider's recommendation)."
            })
        else:
            findings.append({
                "type": "EMAIL_SECURITY_SPF_PRESENT",
                "severity": "INFO",
                "confidence": "CONFIRMED",
                "summary": "SPF Record Active",
                "description": f"Found valid SPF configuration: {', '.join(spf_records)}",
                "evidence": str(spf_records),
                "remediation": "Ensure SPF record is maintained when mail delivery infrastructure changes."
            })

        # Audit DMARC record
        dmarc_records = self._query_dmarc()
        if not dmarc_records:
            findings.append({
                "type": "EMAIL_SECURITY_MISSING_DMARC",
                "severity": "MEDIUM",
                "confidence": "HIGH",
                "summary": "Missing DMARC Policy Record",
                "description": (
                    f"No DMARC record found at '_dmarc.{self.domain}'. "
                    "Without DMARC, domain spoofing and phishing protections cannot be enforced or monitored by mail receivers."
                ),
                "evidence": f"Query against _dmarc.{self.domain} returned no TXT records.",
                "remediation": "Publish a DMARC policy record (e.g. 'v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com')."
            })
        else:
            findings.append({
                "type": "EMAIL_SECURITY_DMARC_PRESENT",
                "severity": "INFO",
                "confidence": "CONFIRMED",
                "summary": "DMARC Record Published",
                "description": f"DMARC record found: {'; '.join(dmarc_records)}",
                "evidence": str(dmarc_records),
                "remediation": "Gradually transition policy from 'p=none' to 'p=quarantine' and ultimately 'p=reject'."
            })

        # Audit Nameserver Redundancy
        ns_records = records.get("NS", [])
        if len(ns_records) < 2 and ns_records:
            findings.append({
                "type": "DNS_LOW_NS_REDUNDANCY",
                "severity": "LOW",
                "confidence": "HIGH",
                "summary": "Low Nameserver Redundancy",
                "description": f"Only {len(ns_records)} nameserver record discovered ({ns_records[0]}). Best practices recommend at least two topologically diverse nameservers.",
                "evidence": str(ns_records),
                "remediation": "Configure secondary authoritative nameservers with separate network providers or regions."
            })

        for f in findings:
            if "owasp_category" not in f:
                f["owasp_category"] = "A05:2021-Security Misconfiguration"

        return {
            "target_host": self.target_host,
            "domain": self.domain,
            "records": records,
            "findings": findings,
            "dmarc_records": dmarc_records,
            "limitations": [l for l in limitations if "LifetimeTimeout" not in l] or [
                "DNS queries reflect publicly observable authoritative responses."
            ]
        }

    def _query_dnspython(self, records: Dict[str, List[str]]):
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2.0
        resolver.lifetime = 2.5
        resolver.nameservers = ['8.8.8.8', '1.1.1.1', '9.9.9.9']
        limitations = []

        for rtype in ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA"]:
            try:
                target = self.domain if rtype in ["MX", "NS", "TXT", "SOA"] else self.target_host
                answers = resolver.resolve(target, rtype)
                for rdata in answers:
                    val = str(rdata).strip('"')
                    if val not in records[rtype]:
                        records[rtype].append(val)
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                pass
            except Exception as e:
                limitations.append(f"dnspython {rtype}: {type(e).__name__}")

        return records, limitations

    def _query_standard_fallback(self, records: Dict[str, List[str]]):
        """Use nslookup CLI on host."""
        limitations = []
        for rtype in ["NS", "MX", "TXT", "CNAME", "SOA"]:
            try:
                target = self.domain if rtype in ["NS", "MX", "TXT", "SOA"] else self.target_host
                cmd = ["nslookup", f"-type={rtype}", target]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=3.5)
                if res.returncode == 0:
                    for line in res.stdout.splitlines():
                        line = line.strip()
                        if rtype == "MX" and "mail exchanger =" in line.lower():
                            val = line.split("=")[-1].strip()
                            if val and val not in records["MX"]:
                                records["MX"].append(val)
                        elif rtype == "NS" and "nameserver =" in line.lower():
                            val = line.split("=")[-1].strip()
                            if val and val not in records["NS"]:
                                records["NS"].append(val)
                        elif rtype == "TXT" and ("text =" in line.lower() or line.startswith('"')):
                            val = line.split("text =")[-1].strip().strip('"')
                            if val and val not in records["TXT"]:
                                records["TXT"].append(val)
                        elif rtype == "CNAME" and "canonical name =" in line.lower():
                            val = line.split("=")[-1].strip()
                            if val and val not in records["CNAME"]:
                                records["CNAME"].append(val)
            except Exception as e:
                limitations.append(f"nslookup {rtype}: {e}")

        return records, limitations

    def _query_dmarc(self) -> List[str]:
        """Look up TXT records on _dmarc.<domain>."""
        dmarc_target = f"_dmarc.{self.domain}"
        results: List[str] = []

        try:
            import dns.resolver
            resolver = dns.resolver.Resolver()
            resolver.timeout = 2.0
            resolver.lifetime = 2.5
            resolver.nameservers = ['8.8.8.8', '1.1.1.1', '9.9.9.9']
            answers = resolver.resolve(dmarc_target, "TXT")
            for rdata in answers:
                val = str(rdata).strip('"')
                if "v=dmarc1" in val.lower():
                    results.append(val)
            if results:
                return results
        except Exception:
            pass

        # Fallback to nslookup
        try:
            cmd = ["nslookup", "-type=TXT", dmarc_target]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=3.5)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if "text =" in line.lower() and "v=dmarc1" in line.lower():
                        val = line.split("text =")[-1].strip().strip('"')
                        if val not in results:
                            results.append(val)
        except Exception:
            pass

        return results

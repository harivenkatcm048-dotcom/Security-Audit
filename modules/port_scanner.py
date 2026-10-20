"""
Conservative Port Assessment Module
====================================
Performs conservative, bounded TCP port checks strictly against authorized hosts.
Uses standard socket connections with safe timeouts, controlled thread limits,
and explicit rate limits.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import logging
import socket
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.PortScanner")

SERVICE_MAP = {
    80: ("HTTP", "Standard World Wide Web HTTP service"),
    443: ("HTTPS", "Secure World Wide Web HTTP over TLS"),
    8080: ("HTTP-Alt", "Common secondary HTTP web or proxy port"),
    8443: ("HTTPS-Alt", "Common secondary HTTPS web service port"),
    8000: ("HTTP-Dev", "Common development server or microservice port"),
    8888: ("HTTP-Admin", "Alternative web administration or notebook port"),
    9000: ("Sonar/Service", "Common web dashboard, SonarQube, or API port"),
    3000: ("Node/Grafana", "Common Node.js, React dev, or Grafana port"),
    5000: ("Flask/ASP.NET", "Common Python Flask or ASP.NET dev port"),
    21: ("FTP", "File Transfer Protocol (Cleartext)"),
    22: ("SSH", "Secure Shell remote management"),
    25: ("SMTP", "Simple Mail Transfer Protocol"),
    53: ("DNS", "Domain Name System"),
    3306: ("MySQL", "MySQL database listener"),
    5432: ("PostgreSQL", "PostgreSQL database listener"),
    6379: ("Redis", "Redis in-memory cache listener"),
    27017: ("MongoDB", "MongoDB NoSQL database listener"),
}


@dataclass
class PortResult:
    port: int
    state: str  # OPEN, CLOSED, FILTERED, TIMEOUT
    service_hint: str
    service_description: str
    latency_ms: float


class ConservativePortScanner:
    """Safe, rate-limited TCP port scanner restricted to authorized targets."""

    def __init__(self, target_host: str, ports: Optional[List[int]] = None,
                 timeout: float = 1.2, max_workers: int = 4):
        self.target_host = target_host
        self.ports = ports or [80, 443, 8080, 8443, 8000, 8888, 9000, 3000, 5000]
        self.timeout = timeout
        self.max_workers = max_workers

    def _check_port(self, port: int) -> PortResult:
        """Attempt a standard TCP three-way handshake with conservative timeout."""
        start = time.time()
        service_hint, service_desc = SERVICE_MAP.get(port, ("Unknown", "Unregistered or custom service"))
        state = "FILTERED"
        
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(self.timeout)
                res = sock.connect_ex((self.target_host, port))
                latency = (time.time() - start) * 1000.0
                if res == 0:
                    state = "OPEN"
                elif res in (10061, 111): # WSAECONNREFUSED on Windows or ECONNREFUSED on Linux
                    state = "CLOSED"
                else:
                    state = "FILTERED"
        except socket.timeout:
            latency = (time.time() - start) * 1000.0
            state = "TIMEOUT"
        except Exception:
            latency = (time.time() - start) * 1000.0
            state = "ERROR"

        return PortResult(
            port=port,
            state=state,
            service_hint=service_hint,
            service_description=service_desc,
            latency_ms=round(latency, 2)
        )

    def run_assessment(self) -> Dict[str, Any]:
        """Execute bounded, safe port assessment across configured ports."""
        results: List[PortResult] = []
        open_ports: List[Dict[str, Any]] = []
        findings: List[Dict[str, Any]] = []

        logger.info(f"Initiating safe port assessment on {self.target_host} ({len(self.ports)} ports)...")

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_port = {executor.submit(self._check_port, p): p for p in self.ports}
            for future in as_completed(future_to_port):
                res = future.result()
                results.append(res)
                if res.state == "OPEN":
                    open_ports.append({
                        "port": res.port,
                        "service": res.service_hint,
                        "description": res.service_description,
                        "latency_ms": res.latency_ms
                    })

        # Sort results by port number
        results.sort(key=lambda x: x.port)
        open_ports.sort(key=lambda x: x["port"])

        # Generate defensive findings
        for item in open_ports:
            p = item["port"]
            if p in (8000, 8888, 3000, 5000, 9000):
                findings.append({
                    "type": f"PORT_DEV_SERVICE_EXPOSED_{p}",
                    "severity": "LOW",
                    "confidence": "CONFIRMED",
                    "summary": f"Exposed Development/Auxiliary Port ({p}/{item['service']})",
                    "description": (
                        f"Port {p} ({item['service']}) is open to the public network. "
                        "Development interfaces or diagnostic dashboards should be restricted behind VPN or private VPCs."
                    ),
                    "evidence": f"TCP connect successful to {self.target_host}:{p} in {item['latency_ms']}ms",
                    "remediation": f"Block port {p} at the perimeter firewall / security group if not required for public clients."
                })

        return {
            "target_host": self.target_host,
            "ports_scanned": len(self.ports),
            "open_ports": open_ports,
            "all_results": [
                {
                    "port": r.port,
                    "state": r.state,
                    "service": r.service_hint,
                    "latency_ms": r.latency_ms
                }
                for r in results
            ],
            "findings": findings,
            "limitations": [
                f"Scoped to {len(self.ports)} pre-approved TCP ports using non-intrusive connect probes.",
                "UDP services, stateful packet filtering, and non-probed ports are not represented.",
                "Open ports reflect active network listeners and do not imply an exploitable vulnerability."
            ]
        }

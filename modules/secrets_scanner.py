"""
Secrets and Sensitive Leaks Scanner Module
===========================================
Defensively scans client-side HTML, JavaScript bundles, and exposed configuration files
for leaked API keys, tokens, cloud credentials, private keys, and sensitive environment data.
"""

from dataclasses import dataclass
import logging
import re
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin

from .safe_client import SafeHttpClient

logger = logging.getLogger("DefensiveAudit.SecretsScanner")


@dataclass
class SecretFinding:
    secret_type: str
    severity: str
    confidence: str
    summary: str
    description: str
    masked_value: str
    source_url: str
    remediation: str


class SecretsScanner:
    """Scans response bodies and probes for exposed sensitive configuration files."""

    SECRET_PATTERNS = [
        (
            "AWS_ACCESS_KEY",
            "CRITICAL",
            "CONFIRMED",
            re.compile(r"\b(AKIA[0-9A-Z]{16})\b"),
            "Amazon Web Services (AWS) Access Key ID",
            "Revoke this access key immediately in AWS IAM and generate a new key restricted by least-privilege policies."
        ),
        (
            "GOOGLE_API_KEY",
            "HIGH",
            "CONFIRMED",
            re.compile(r"\b(AIza[0-9A-Za-z\-_]{35})\b"),
            "Google Cloud / Firebase API Key",
            "Apply HTTP referrer restrictions and API restrictions in Google Cloud Console."
        ),
        (
            "GITHUB_PAT",
            "CRITICAL",
            "CONFIRMED",
            re.compile(r"\b(ghp_[a-zA-Z0-9]{36})\b"),
            "GitHub Personal Access Token",
            "Revoke this personal access token in GitHub Settings > Developer Settings."
        ),
        (
            "SLACK_WEBHOOK",
            "HIGH",
            "CONFIRMED",
            re.compile(r"(https://hooks\.slack\.com/services/T[0-9A-Z]{8,}/B[0-9A-Z]{8,}/[0-9a-zA-Z]{20,})"),
            "Slack Incoming Webhook URL",
            "Invalidate the webhook in your Slack App management portal."
        ),
        (
            "STRIPE_SECRET_KEY",
            "CRITICAL",
            "CONFIRMED",
            re.compile(r"\b(sk_live_[0-9a-zA-Z]{24,32})\b"),
            "Stripe Live Secret Key",
            "Roll and revoke the secret key immediately in your Stripe Dashboard."
        ),
        (
            "PRIVATE_KEY_BLOCK",
            "CRITICAL",
            "CONFIRMED",
            re.compile(r"(-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----)"),
            "Cryptographic Private Key Block",
            "Remove private key from web distribution immediately and revoke corresponding public keys/certificates."
        ),
        (
            "DATABASE_CONNECTION_STRING",
            "CRITICAL",
            "HIGH",
            re.compile(r"\b((?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql)://[^:\s]+:[^@\s]+@[^/\s]+(?:/[^\s]*)?)\b"),
            "Database Connection URI with Credentials",
            "Rotate database password immediately and move connection strings to secure server-side environment variables."
        ),
        (
            "JWT_BEARER_TOKEN",
            "HIGH",
            "CONFIRMED",
            re.compile(r"\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b"),
            "Hardcoded JSON Web Token (JWT)",
            "Revoke this JWT token and avoid hardcoding active user or service tokens in client-side bundles."
        ),
        (
            "FIREBASE_DATABASE_URL",
            "MEDIUM",
            "CONFIRMED",
            re.compile(r"(https://[a-zA-Z0-9_\-]+\.firebaseio\.com)"),
            "Firebase Realtime Database Endpoint",
            "Ensure Firebase security rules (read/write) are locked down and not set to public open access."
        ),
        (
            "SENDGRID_API_KEY",
            "CRITICAL",
            "CONFIRMED",
            re.compile(r"\b(SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43})\b"),
            "SendGrid Mail API Key",
            "Revoke this API key in SendGrid settings immediately."
        ),
        (
            "TWILIO_ACCOUNT_SID",
            "HIGH",
            "CONFIRMED",
            re.compile(r"\b(AC[a-f0-9]{32})\b"),
            "Twilio Account SID",
            "Ensure Twilio auth tokens are kept strictly server-side and rotate compromised credentials."
        ),
        (
            "RAZORPAY_KEY",
            "HIGH",
            "CONFIRMED",
            re.compile(r"\b(rzp_(?:test|live)_[0-9a-zA-Z]{14})\b"),
            "Razorpay Payment Gateway Key",
            "Rotate key in Razorpay dashboard and ensure secret key is never embedded in frontend code."
        ),
        (
            "INTERNAL_IP_DISCLOSURE",
            "LOW",
            "HIGH",
            re.compile(r"\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b"),
            "Internal RFC 1918 Private IP Address Disclosure",
            "Remove references to private internal network IP addresses from public client assets."
        ),
    ]

    SENSITIVE_FILES = [
        ("/.env", "Environment File Exposure", "CRITICAL", "DB_PASSWORD=", "Exposed environment configuration file containing database credentials and secrets."),
        ("/.git/HEAD", "Git Repository Metadata Exposure", "CRITICAL", "ref: refs/", "Exposed .git repository directory allowing complete source code reconstruction."),
        ("/docker-compose.yml", "Docker Compose Config Exposure", "HIGH", "services:", "Exposed container orchestration configuration revealing internal service topology."),
        ("/package.json", "Node.js Manifest Exposure", "LOW", '"dependencies"', "Exposed package.json file detailing dependency versions and internal scripts.")
    ]

    def __init__(self, base_url: str, client: SafeHttpClient):
        self.base_url = base_url
        self.client = client

    @staticmethod
    def mask_secret(value: str) -> str:
        """Safely mask secret strings so sensitive data is never exposed in reports."""
        if len(value) <= 8:
            return "*" * len(value)
        return value[:4] + "*" * (len(value) - 8) + value[-4:]

    def scan_content(self, text: str, source_url: str, findings: List[Dict[str, Any]], seen_keys: Set[str]):
        """Scan a given HTML or JS text payload against secret signatures."""
        if not text:
            return

        for rule_type, sev, conf, regex, title, rem in self.SECRET_PATTERNS:
            matches = regex.findall(text)
            for m in matches:
                # Mask secret value
                masked = self.mask_secret(m)
                dedup_key = f"{rule_type}:{masked}"
                if dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)

                findings.append({
                    "type": f"LEAKED_SECRET_{rule_type}",
                    "severity": sev,
                    "confidence": conf,
                    "owasp_category": "A07:2021-Identification and Authentication Failures",
                    "summary": f"Exposed Secret Detected: {title}",
                    "description": (
                        f"A sensitive {title} was discovered publicly accessible in client-side code at '{source_url}'. "
                        "Publicly embedded credentials allow unauthorized actors to interact directly with internal APIs or databases."
                    ),
                    "evidence": f"Pattern: {title} | Masked: {masked} | Source: {source_url}",
                    "masked_secret": masked,
                    "source_url": source_url,
                    "remediation": rem
                })

    def probe_sensitive_files(self, findings: List[Dict[str, Any]], seen_keys: Set[str]):
        """Check for common exposed sensitive configuration files."""
        for path, title, sev, indicator, desc in self.SENSITIVE_FILES:
            target_url = urljoin(self.base_url, path)
            try:
                resp = self.client.get(target_url, allow_redirects=False)
                if resp.status_code == 200 and indicator in resp.body:
                    dedup_key = f"SENSITIVE_FILE:{path}"
                    if dedup_key not in seen_keys:
                        seen_keys.add(dedup_key)
                        findings.append({
                            "type": f"EXPOSED_FILE_{path.strip('/').upper().replace('.', '_').replace('-', '_')}",
                            "severity": sev,
                            "confidence": "CONFIRMED",
                            "owasp_category": "A05:2021-Security Misconfiguration",
                            "summary": f"Publicly Accessible Sensitive File: {title} ({path})",
                            "description": desc,
                            "evidence": f"HTTP 200 at {target_url} (Found signature: '{indicator}')",
                            "source_url": target_url,
                            "remediation": f"Block public web server access to '{path}' via web server configuration (Nginx/Apache) or delete it from the document root."
                        })
            except Exception as e:
                logger.debug(f"Sensitive file probe {path} error: {e}")

    def run_scan(self, crawled_pages: List[Any], script_urls: List[str]) -> Dict[str, Any]:
        """Execute secret scanning across all crawled HTML pages, scripts, and sensitive files."""
        findings: List[Dict[str, Any]] = []
        seen_keys: Set[str] = set()

        # 1. Probe sensitive config files (/.env, /.git/HEAD, etc.)
        self.probe_sensitive_files(findings, seen_keys)

        # 2. Scan crawled HTML pages
        for page in crawled_pages:
            html = getattr(page, "html_content", "") or ""
            url = getattr(page, "url", self.base_url)
            self.scan_content(html, url, findings, seen_keys)

        # 3. Scan JavaScript files
        for s_url in script_urls[:8]:
            try:
                resp = self.client.get(s_url)
                if resp.status_code == 200 and resp.body:
                    self.scan_content(resp.body, s_url, findings, seen_keys)
            except Exception as e:
                logger.debug(f"Script secret scan failed on {s_url}: {e}")

        return {
            "total_secrets_found": len(findings),
            "findings": findings,
            "limitations": [
                "Secret scanning inspects publicly accessible client-side scripts, HTML, and standard config paths.",
                "Values are cryptographically masked to prevent exposure in logs and reports."
            ]
        }

"""
Security Headers Audit Module
=============================
Evaluates HTTP response headers against OWASP defensive best practices,
grades security posture, identifies information disclosure, and produces remediation snippets.
"""

from dataclasses import dataclass, field
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.Headers")


@dataclass
class HeaderRule:
    header_name: str
    severity: str
    title: str
    description: str
    remediation: str
    recommended_value: str


class SecurityHeadersAuditor:
    """Audits HTTP defensive headers, cookie security flags, and server disclosures."""

    DEFENSIVE_RULES: List[HeaderRule] = [
        HeaderRule(
            header_name="Strict-Transport-Security",
            severity="HIGH",
            title="Missing HTTP Strict Transport Security (HSTS)",
            description=(
                "HSTS instructs browsers to exclusively communicate over HTTPS, "
                "preventing man-in-the-middle SSL-stripping attacks."
            ),
            remediation="Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' to all HTTPS responses.",
            recommended_value="max-age=31536000; includeSubDomains; preload"
        ),
        HeaderRule(
            header_name="Content-Security-Policy",
            severity="HIGH",
            title="Missing Content Security Policy (CSP)",
            description=(
                "Content Security Policy restricts the sources from which scripts, styles, "
                "images, and frames can load, mitigating Cross-Site Scripting (XSS) and data injection."
            ),
            remediation="Define a tailored CSP header starting with 'default-src \'self\'' and explicit source allowances.",
            recommended_value="default-src 'self'; script-src 'self'; object-src 'none';"
        ),
        HeaderRule(
            header_name="X-Frame-Options",
            severity="MEDIUM",
            title="Missing X-Frame-Options Header",
            description=(
                "X-Frame-Options prevents the web page from being rendered inside an iframe, "
                "guarding against clickjacking attacks."
            ),
            remediation="Set 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN'.",
            recommended_value="DENY"
        ),
        HeaderRule(
            header_name="X-Content-Type-Options",
            severity="MEDIUM",
            title="Missing X-Content-Type-Options Header",
            description=(
                "Without 'nosniff', legacy browsers may perform MIME-type sniffing, "
                "executing non-executable files as scripts or stylesheets."
            ),
            remediation="Add 'X-Content-Type-Options: nosniff'.",
            recommended_value="nosniff"
        ),
        HeaderRule(
            header_name="Referrer-Policy",
            severity="LOW",
            title="Missing Referrer-Policy Header",
            description=(
                "Controls how much referrer information (including potentially sensitive query parameters) "
                "is included with requests made from your site."
            ),
            remediation="Set 'Referrer-Policy: strict-origin-when-cross-origin'.",
            recommended_value="strict-origin-when-cross-origin"
        ),
        HeaderRule(
            header_name="Permissions-Policy",
            severity="LOW",
            title="Missing Permissions-Policy Header",
            description=(
                "Permissions-Policy allows site owners to enable or disable browser features "
                "such as camera, microphone, geolocation, and USB APIs."
            ),
            remediation="Add 'Permissions-Policy: geolocation=(), camera=(), microphone=()'.",
            recommended_value="geolocation=(), camera=(), microphone=()"
        ),
    ]

    DISCLOSURE_HEADERS = [
        ("Server", "Server Banner Disclosure", "Reveals web server software and potentially version information."),
        ("X-Powered-By", "Backend Technology Disclosure", "Reveals programming language or framework runtime."),
        ("X-AspNet-Version", "ASP.NET Version Disclosure", "Reveals exact Microsoft ASP.NET framework version."),
        ("X-Generator", "CMS Generator Disclosure", "Reveals CMS platform details."),
    ]

    def __init__(self, raw_headers: Dict[str, str], is_https: bool = True):
        # Case-insensitive header dictionary
        self.headers = {k.lower(): (k, v) for k, v in raw_headers.items()}
        self.is_https = is_https

    def run_audit(self) -> Dict[str, Any]:
        """Inspect headers and generate findings, grades, and remediation snippets."""
        findings: List[Dict[str, Any]] = []
        present_headers: Dict[str, str] = {}
        missing_headers: List[str] = []

        total_weight = 100
        score = 100

        # Check defensive headers
        for rule in self.DEFENSIVE_RULES:
            h_key = rule.header_name.lower()
            if h_key in self.headers:
                orig_key, val = self.headers[h_key]
                present_headers[orig_key] = val
                
                # Check specific quality of existing headers
                if h_key == "strict-transport-security":
                    if "max-age" in val.lower():
                        match = re.search(r"max-age=(\d+)", val.lower())
                        if match and int(match.group(1)) < 15552000: # less than 180 days
                            findings.append({
                                "type": "HEADER_HSTS_SHORT_MAX_AGE",
                                "severity": "LOW",
                                "confidence": "CONFIRMED",
                                "summary": "HSTS max-age is Under Recommended Duration",
                                "description": f"HSTS max-age is {match.group(1)}s. Recommended minimum is 31536000s (1 year).",
                                "evidence": f"Strict-Transport-Security: {val}",
                                "remediation": "Increase max-age to at least 31536000."
                            })
                            score -= 5
                elif h_key == "content-security-policy":
                    if "'unsafe-inline'" in val:
                        findings.append({
                            "type": "HEADER_CSP_UNSAFE_INLINE",
                            "severity": "MEDIUM",
                            "confidence": "CONFIRMED",
                            "summary": "CSP Contains 'unsafe-inline' Directive",
                            "description": "Allowing 'unsafe-inline' significantly weakens CSP defenses against Cross-Site Scripting (XSS).",
                            "evidence": f"Content-Security-Policy: {val[:120]}...",
                            "remediation": "Transition inline scripts to external files with cryptographic nonces or hashes."
                        })
                        score -= 10
            else:
                missing_headers.append(rule.header_name)
                # Deduct score according to severity
                deduction = 20 if rule.severity == "HIGH" else (10 if rule.severity == "MEDIUM" else 5)
                score -= deduction
                
                findings.append({
                    "type": f"HEADER_MISSING_{rule.header_name.upper().replace('-', '_')}",
                    "severity": rule.severity,
                    "confidence": "CONFIRMED",
                    "summary": rule.title,
                    "description": rule.description,
                    "evidence": f"Header '{rule.header_name}' was not present in the HTTP response.",
                    "remediation": rule.remediation
                })

        # Check information disclosure headers
        for d_name, d_title, d_desc in self.DISCLOSURE_HEADERS:
            d_key = d_name.lower()
            if d_key in self.headers:
                orig_key, val = self.headers[d_key]
                present_headers[orig_key] = val
                # Only flag as finding if version or detailed info is present
                has_version_number = any(char.isdigit() for char in val)
                sev = "LOW" if has_version_number else "INFO"
                findings.append({
                    "type": f"HEADER_DISCLOSURE_{d_name.upper().replace('-', '_')}",
                    "severity": sev,
                    "confidence": "CONFIRMED",
                    "summary": f"{d_title}: '{val}'",
                    "description": f"{d_desc} Attackers can use disclosed version numbers to target known CVEs.",
                    "evidence": f"{orig_key}: {val}",
                    "remediation": f"Disable or mask the '{orig_key}' header in server configuration."
                })
                if sev == "LOW":
                    score -= 5

        # Inspect Set-Cookie headers if present
        cookie_analysis = self._audit_cookies()
        if cookie_analysis["findings"]:
            findings.extend(cookie_analysis["findings"])
            score -= cookie_analysis["score_penalty"]

        # Calculate final letter grade
        score = max(0, min(100, score))
        if score >= 90:
            grade = "A"
        elif score >= 80:
            grade = "B"
        elif score >= 70:
            grade = "C"
        elif score >= 55:
            grade = "D"
        else:
            grade = "F"

        # Ensure OWASP category is assigned to all findings
        for f in findings:
            if "owasp_category" not in f:
                f["owasp_category"] = "A05:2021-Security Misconfiguration"

        return {
            "score": score,
            "grade": grade,
            "present_headers": present_headers,
            "missing_headers": missing_headers,
            "findings": findings,
            "remediation_snippets": self._generate_server_configs(missing_headers)
        }

    def _audit_cookies(self) -> Dict[str, Any]:
        """Inspect Set-Cookie headers for Secure, HttpOnly, and SameSite attributes."""
        findings = []
        score_penalty = 0

        # Look for set-cookie headers
        cookie_headers = []
        for k, (orig_k, val) in self.headers.items():
            if k == "set-cookie":
                cookie_headers.append(val)

        for cookie in cookie_headers:
            cookie_parts = [p.strip() for p in cookie.split(";")]
            cookie_name = cookie_parts[0].split("=")[0] if cookie_parts else "Unknown"
            lower_cookie = cookie.lower()

            is_secure = "secure" in lower_cookie
            is_httponly = "httponly" in lower_cookie
            has_samesite = "samesite" in lower_cookie

            if not is_secure and self.is_https:
                findings.append({
                    "type": "COOKIE_MISSING_SECURE",
                    "severity": "MEDIUM",
                    "confidence": "CONFIRMED",
                    "summary": f"Cookie '{cookie_name}' Missing 'Secure' Flag",
                    "description": "Cookies without the Secure flag can be transmitted in cleartext over unencrypted HTTP.",
                    "evidence": f"Set-Cookie: {cookie_parts[0]}...",
                    "remediation": f"Append '; Secure' to the '{cookie_name}' Set-Cookie definition."
                })
                score_penalty += 5

            if not is_httponly:
                findings.append({
                    "type": "COOKIE_MISSING_HTTPONLY",
                    "severity": "LOW",
                    "confidence": "CONFIRMED",
                    "summary": f"Cookie '{cookie_name}' Missing 'HttpOnly' Flag",
                    "description": "Cookies without HttpOnly can be accessed by client-side JavaScript, exposing them to XSS theft.",
                    "evidence": f"Set-Cookie: {cookie_parts[0]}...",
                    "remediation": f"Append '; HttpOnly' to the '{cookie_name}' Set-Cookie definition."
                })
                score_penalty += 3

        return {"findings": findings, "score_penalty": score_penalty}

    @staticmethod
    def _generate_server_configs(missing_headers: List[str]) -> Dict[str, str]:
        """Produce ready-to-use configuration blocks for popular web servers."""
        nginx_lines = []
        apache_lines = []
        caddy_lines = []

        if "Strict-Transport-Security" in missing_headers:
            nginx_lines.append('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;')
            apache_lines.append('Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"')
            caddy_lines.append('Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"')

        if "X-Frame-Options" in missing_headers:
            nginx_lines.append('add_header X-Frame-Options "DENY" always;')
            apache_lines.append('Header always set X-Frame-Options "DENY"')
            caddy_lines.append('X-Frame-Options "DENY"')

        if "X-Content-Type-Options" in missing_headers:
            nginx_lines.append('add_header X-Content-Type-Options "nosniff" always;')
            apache_lines.append('Header always set X-Content-Type-Options "nosniff"')
            caddy_lines.append('X-Content-Type-Options "nosniff"')

        if "Referrer-Policy" in missing_headers:
            nginx_lines.append('add_header Referrer-Policy "strict-origin-when-cross-origin" always;')
            apache_lines.append('Header always set Referrer-Policy "strict-origin-when-cross-origin"')
            caddy_lines.append('Referrer-Policy "strict-origin-when-cross-origin"')

        if "Content-Security-Policy" in missing_headers:
            nginx_lines.append('add_header Content-Security-Policy "default-src \'self\'; frame-ancestors \'none\';" always;')
            apache_lines.append('Header always set Content-Security-Policy "default-src \'self\'; frame-ancestors \'none\';"')
            caddy_lines.append('Content-Security-Policy "default-src \'self\'; frame-ancestors \'none\';"')

        return {
            "nginx": "\n".join(nginx_lines) or "# All audited defensive headers present in Nginx.",
            "apache": "\n".join(apache_lines) or "# All audited defensive headers present in Apache.",
            "caddy": "header {\n    " + "\n    ".join(caddy_lines) + "\n}" if caddy_lines else "# All headers present."
        }

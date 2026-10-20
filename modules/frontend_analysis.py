"""
Frontend Inventory and Analysis Module
======================================
Collects publicly referenced JavaScript, CSS stylesheets, HTML forms, input fields,
meta tags, and links. Evaluates subresource integrity and form transmission security.
"""

from dataclasses import dataclass, field
from html.parser import HTMLParser
import logging
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse

logger = logging.getLogger("DefensiveAudit.Frontend")


class SafeHtmlParser(HTMLParser):
    """Zero-dependency streaming HTML parser to extract frontend assets."""

    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.scripts: List[Dict[str, Any]] = []
        self.stylesheets: List[Dict[str, Any]] = []
        self.forms: List[Dict[str, Any]] = []
        self.links: List[Dict[str, Any]] = []
        self.meta_tags: Dict[str, str] = {}
        self.inline_script_count: int = 0
        self.current_form: Optional[Dict[str, Any]] = None
        self._in_script = False
        self.inline_script_buffer: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple]):
        attr_dict = {k.lower(): v for k, v in attrs if v is not None}

        # 1. Scripts (<script>)
        if tag == "script":
            src = attr_dict.get("src")
            if src:
                abs_url = urljoin(self.base_url, src)
                has_integrity = "integrity" in attr_dict
                self.scripts.append({
                    "src": abs_url,
                    "original_src": src,
                    "has_integrity": has_integrity,
                    "integrity": attr_dict.get("integrity", ""),
                    "is_async": "async" in attr_dict,
                    "is_defer": "defer" in attr_dict,
                    "type": attr_dict.get("type", "text/javascript")
                })
            else:
                self.inline_script_count += 1
                self._in_script = True

        # 2. Stylesheets and Modulepreload Scripts (<link>)
        elif tag == "link":
            rel = attr_dict.get("rel", "").lower()
            href = attr_dict.get("href", "")
            if not href:
                return

            abs_url = urljoin(self.base_url, href)

            if "stylesheet" in rel:
                self.stylesheets.append({
                    "href": abs_url,
                    "original_href": href,
                    "has_integrity": "integrity" in attr_dict,
                    "integrity": attr_dict.get("integrity", "")
                })
            elif "modulepreload" in rel or ("preload" in rel and attr_dict.get("as") in ("script", "module")) or href.endswith(".js"):
                has_integrity = "integrity" in attr_dict
                self.scripts.append({
                    "src": abs_url,
                    "original_src": href,
                    "has_integrity": has_integrity,
                    "integrity": attr_dict.get("integrity", ""),
                    "is_async": False,
                    "is_defer": False,
                    "type": "module"
                })

        # 3. Forms (<form>)
        elif tag == "form":
            action = attr_dict.get("action", "")
            abs_action = urljoin(self.base_url, action) if action else self.base_url
            self.current_form = {
                "action": abs_action,
                "original_action": action,
                "method": attr_dict.get("method", "GET").upper(),
                "inputs": [],
                "has_password": False,
                "has_csrf_token": False
            }
            self.forms.append(self.current_form)

        # 4. Form inputs (<input>, <button>, <select>)
        elif tag == "input" and self.current_form is not None:
            inp_type = attr_dict.get("type", "text").lower()
            inp_name = attr_dict.get("name", "")
            self.current_form["inputs"].append({
                "type": inp_type,
                "name": inp_name,
                "id": attr_dict.get("id", "")
            })
            if inp_type == "password":
                self.current_form["has_password"] = True
            if any(term in inp_name.lower() for term in ["csrf", "token", "_token", "nonce"]):
                self.current_form["has_csrf_token"] = True

        # 5. Meta tags (<meta>)
        elif tag == "meta":
            name = attr_dict.get("name") or attr_dict.get("property") or attr_dict.get("http-equiv")
            content = attr_dict.get("content")
            if name and content:
                self.meta_tags[name.lower()] = content

        # 6. Hyperlinks (<a>)
        elif tag == "a" and "href" in attr_dict:
            href = attr_dict["href"]
            if not href.startswith("javascript:") and not href.startswith("#"):
                abs_href = urljoin(self.base_url, href)
                self.links.append({
                    "href": abs_href,
                    "rel": attr_dict.get("rel", ""),
                    "target": attr_dict.get("target", "")
                })

    def handle_endtag(self, tag: str):
        if tag == "form":
            self.current_form = None
        elif tag == "script":
            self._in_script = False

    def handle_data(self, data: str):
        if self._in_script and len(self.inline_script_buffer) < 50:
            self.inline_script_buffer.append(data.strip())


class FrontendAnalyzer:
    """Analyzes frontend assets, forms, subresource integrity, and DOM posture."""

    def __init__(self, base_url: str, html_content: str):
        self.base_url = base_url
        self.html_content = html_content
        self.base_host = urlparse(base_url).hostname.lower() if urlparse(base_url).hostname else ""

    def run_analysis(self) -> Dict[str, Any]:
        """Parse HTML and generate asset inventory and defensive findings."""
        parser = SafeHtmlParser(self.base_url)
        try:
            parser.feed(self.html_content)
        except Exception as e:
            logger.warning(f"HTML parser encountered exception: {e}")

        findings: List[Dict[str, Any]] = []
        first_party_scripts = []
        third_party_scripts = []

        # Analyze scripts
        for s in parser.scripts:
            s_host = urlparse(s["src"]).hostname
            if s_host and s_host.lower() == self.base_host:
                first_party_scripts.append(s)
            else:
                third_party_scripts.append(s)
                # Check for Subresource Integrity (SRI) on CDN/third-party scripts
                if not s["has_integrity"] and s_host:
                    findings.append({
                        "type": "FRONTEND_MISSING_SRI",
                        "severity": "LOW",
                        "confidence": "CONFIRMED",
                        "summary": "Third-Party Script Missing Subresource Integrity (SRI)",
                        "description": (
                            f"Script '{s['src']}' is loaded from external domain '{s_host}' without an 'integrity' hash. "
                            "If the third-party provider or CDN is compromised, modified code could execute on your users' browsers."
                        ),
                        "evidence": f"script src='{s['src']}', integrity=None",
                        "remediation": "Add an 'integrity' attribute with sha384 or sha512 hash and 'crossorigin=\"anonymous\"'."
                    })

        # Analyze forms
        for form in parser.forms:
            action = form["action"]
            parsed_action = urlparse(action)
            
            # Check 1: Insecure HTTP transmission for password form
            if form["has_password"] and parsed_action.scheme == "http":
                findings.append({
                    "type": "FORM_PASSWORD_INSECURE_HTTP",
                    "severity": "CRITICAL",
                    "confidence": "CONFIRMED",
                    "summary": "Password Form Submits to Insecure HTTP Endpoint",
                    "description": f"Form containing password input fields targets unencrypted HTTP ({action}). Credentials would transmit in cleartext.",
                    "evidence": f"Form action={action}, method={form['method']}, inputs={[i['name'] for i in form['inputs']]}",
                    "remediation": "Update the form action to use secure HTTPS."
                })
            
            # Check 2: Form POST without observed CSRF token
            if form["method"] == "POST" and not form["has_csrf_token"]:
                findings.append({
                    "type": "FORM_POTENTIAL_MISSING_CSRF",
                    "severity": "LOW",
                    "confidence": "MEDIUM",
                    "summary": "POST Form Lacks Observable Anti-CSRF Token Input",
                    "description": (
                        f"Form submitting to '{action}' does not contain an obvious hidden CSRF token input field. "
                        "Unless protected via SameSite cookies or custom headers, state-changing requests may be susceptible to CSRF."
                    ),
                    "evidence": f"Inputs: {[i['name'] for i in form['inputs']]}",
                    "remediation": "Ensure state-changing forms include cryptographic anti-CSRF tokens or use SameSite=Strict cookies."
                })

        # Check tabnabbing on links
        tabnabbing_count = 0
        for l in parser.links:
            if l.get("target") == "_blank":
                rel = l.get("rel", "").lower()
                if "noopener" not in rel and "noreferrer" not in rel:
                    tabnabbing_count += 1

        if tabnabbing_count > 0:
            findings.append({
                "type": "FRONTEND_REVERSE_TABNABBING",
                "severity": "LOW",
                "confidence": "CONFIRMED",
                "summary": f"Reverse Tabnabbing Risk ({tabnabbing_count} Links with target='_blank')",
                "description": "External links opening in new tabs without 'rel=\"noopener\"' allow the target page to access window.opener.",
                "evidence": f"{tabnabbing_count} links detected with target='_blank' and missing rel='noopener'",
                "remediation": "Add rel=\"noopener noreferrer\" to all target=\"_blank\" hyperlinks."
            })

        return {
            "total_scripts": len(parser.scripts),
            "first_party_scripts": first_party_scripts,
            "third_party_scripts": third_party_scripts,
            "inline_script_count": parser.inline_script_count,
            "total_stylesheets": len(parser.stylesheets),
            "stylesheets": parser.stylesheets,
            "total_forms": len(parser.forms),
            "forms": parser.forms,
            "meta_tags": parser.meta_tags,
            "findings": findings,
            "limitations": [
                "Frontend analysis inspects server-rendered static HTML and markup.",
                "Dynamic single-page application (SPA) DOM hydration or client-side lazy-loaded components are not executed."
            ]
        }

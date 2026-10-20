"""
Technology Detection Module
===========================
Identifies web servers, backend frameworks, CMS engines, CDNs, and UI libraries
using publicly observable headers, cookies, HTML DOM fingerprints, and script signatures.
"""

from dataclasses import dataclass
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.TechDetection")


@dataclass
class DetectedTechnology:
    name: str
    category: str  # Web Server, Framework, CMS, CDN, UI Library, Language
    version: Optional[str]
    confidence: str  # CONFIRMED, HIGH, MEDIUM, LOW
    evidence: str


class TechnologyDetector:
    """Fingerprints technologies using defensible, multi-source evidence."""

    def __init__(self, headers: Dict[str, str], html_content: str, script_urls: List[str]):
        self.headers = {k.lower(): v for k, v in headers.items()}
        self.html_content = html_content
        self.script_urls = script_urls

    def detect_all(self) -> Dict[str, Any]:
        """Run all fingerprinting checks and compile evidence."""
        detected: Dict[str, DetectedTechnology] = {}

        self._check_headers(detected)
        self._check_cookies(detected)
        self._check_html_meta(detected)
        self._check_dom_indicators(detected)
        self._check_script_signatures(detected)

        tech_list = [
            {
                "name": t.name,
                "category": t.category,
                "version": t.version or "Not Disclosed",
                "confidence": t.confidence,
                "evidence": t.evidence
            }
            for t in detected.values()
        ]
        tech_list.sort(key=lambda x: (x["category"], x["name"]))

        return {
            "total_technologies": len(tech_list),
            "technologies": tech_list,
            "limitations": [
                "Technologies are identified through publicly observable headers, cookies, and DOM artifacts.",
                "Custom obfuscation, reverse proxies, and stripped headers can mask the underlying stack."
            ]
        }

    def _check_headers(self, detected: Dict[str, DetectedTechnology]):
        # Server header
        server_val = self.headers.get("server", "")
        if server_val:
            for s_name in ["nginx", "apache", "caddy", "cloudflare", "litespeed", "envoy", "iis"]:
                if s_name in server_val.lower():
                    # Extract version if present
                    v_match = re.search(r"[\w\-]+/([0-9\.]+)", server_val)
                    ver = v_match.group(1) if v_match else None
                    name_map = {
                        "nginx": "Nginx",
                        "apache": "Apache HTTP Server",
                        "caddy": "Caddy Web Server",
                        "cloudflare": "Cloudflare Server",
                        "litespeed": "LiteSpeed Web Server",
                        "envoy": "Envoy Proxy",
                        "iis": "Microsoft IIS"
                    }
                    t_name = name_map.get(s_name, s_name.capitalize())
                    detected[t_name] = DetectedTechnology(
                        name=t_name,
                        category="Web Server",
                        version=ver,
                        confidence="CONFIRMED" if ver else "HIGH",
                        evidence=f"Server: {server_val}"
                    )

        # X-Powered-By
        powered_val = self.headers.get("x-powered-by", "")
        if powered_val:
            lower = powered_val.lower()
            if "php" in lower:
                v_match = re.search(r"PHP/([0-9\.]+)", powered_val)
                detected["PHP"] = DetectedTechnology(
                    name="PHP",
                    category="Programming Language",
                    version=v_match.group(1) if v_match else None,
                    confidence="CONFIRMED",
                    evidence=f"X-Powered-By: {powered_val}"
                )
            if "express" in lower:
                detected["Express"] = DetectedTechnology(
                    name="Express.js",
                    category="Backend Framework",
                    version=None,
                    confidence="HIGH",
                    evidence=f"X-Powered-By: {powered_val}"
                )
            if "asp.net" in lower:
                detected["ASP.NET"] = DetectedTechnology(
                    name="ASP.NET",
                    category="Backend Framework",
                    version=None,
                    confidence="HIGH",
                    evidence=f"X-Powered-By: {powered_val}"
                )
            if "next.js" in lower:
                detected["Next.js"] = DetectedTechnology(
                    name="Next.js",
                    category="Full-Stack Framework",
                    version=None,
                    confidence="CONFIRMED",
                    evidence=f"X-Powered-By: {powered_val}"
                )

        # CDN via headers
        if "cf-ray" in self.headers or "cf-cache-status" in self.headers:
            detected["Cloudflare CDN"] = DetectedTechnology(
                name="Cloudflare",
                category="CDN / Security Proxy",
                version=None,
                confidence="CONFIRMED",
                evidence=f"Header cf-ray: {self.headers.get('cf-ray', 'Present')}"
            )

        if "x-amz-cf-id" in self.headers:
            detected["AWS CloudFront"] = DetectedTechnology(
                name="Amazon CloudFront",
                category="CDN",
                version=None,
                confidence="CONFIRMED",
                evidence=f"Header x-amz-cf-id: {self.headers['x-amz-cf-id']}"
            )

    def _check_cookies(self, detected: Dict[str, DetectedTechnology]):
        cookie_val = self.headers.get("set-cookie", "").lower()
        if not cookie_val:
            return

        if "phpsessid" in cookie_val and "PHP" not in detected:
            detected["PHP"] = DetectedTechnology(
                name="PHP",
                category="Programming Language",
                version=None,
                confidence="HIGH",
                evidence="Session cookie PHPSESSID observed"
            )
        if "jsessionid" in cookie_val:
            detected["Java / Servlet"] = DetectedTechnology(
                name="Java Servlet Engine",
                category="Application Server",
                version=None,
                confidence="HIGH",
                evidence="Session cookie JSESSIONID observed"
            )
        if "connect.sid" in cookie_val and "Express" not in detected:
            detected["Node.js Express"] = DetectedTechnology(
                name="Node.js (Express)",
                category="Backend Framework",
                version=None,
                confidence="HIGH",
                evidence="Session cookie connect.sid observed"
            )
        if "csrftoken" in cookie_val:
            detected["Django"] = DetectedTechnology(
                name="Django",
                category="Backend Framework",
                version=None,
                confidence="MEDIUM",
                evidence="Cookie 'csrftoken' typical of Django framework"
            )

    def _check_html_meta(self, detected: Dict[str, DetectedTechnology]):
        generator_match = re.search(r'''<meta[^>]*name=['"]generator['"][^>]*content=['"]([^'"]+)['"]''', self.html_content, re.IGNORECASE)
        if generator_match:
            gen_val = generator_match.group(1).strip()
            # Check WordPress
            if "wordpress" in gen_val.lower():
                v_match = re.search(r"WordPress\s*([0-9\.]+)", gen_val, re.IGNORECASE)
                detected["WordPress"] = DetectedTechnology(
                    name="WordPress",
                    category="Content Management System",
                    version=v_match.group(1) if v_match else None,
                    confidence="CONFIRMED",
                    evidence=f"Meta generator tag: '{gen_val}'"
                )
            elif "drupal" in gen_val.lower():
                detected["Drupal"] = DetectedTechnology(
                    name="Drupal",
                    category="Content Management System",
                    version=None,
                    confidence="CONFIRMED",
                    evidence=f"Meta generator tag: '{gen_val}'"
                )
            else:
                detected[gen_val] = DetectedTechnology(
                    name=gen_val,
                    category="Generator / CMS",
                    version=None,
                    confidence="HIGH",
                    evidence=f"Meta generator: {gen_val}"
                )

    def _check_dom_indicators(self, detected: Dict[str, DetectedTechnology]):
        # WordPress directory paths
        if "wp-content" in self.html_content or "wp-includes" in self.html_content:
            if "WordPress" not in detected:
                detected["WordPress"] = DetectedTechnology(
                    name="WordPress",
                    category="Content Management System",
                    version=None,
                    confidence="HIGH",
                    evidence="Assets loaded from wp-content or wp-includes"
                )

        # Next.js
        if "__NEXT_DATA__" in self.html_content:
            detected["Next.js"] = DetectedTechnology(
                name="Next.js",
                category="Full-Stack Framework",
                version=None,
                confidence="CONFIRMED",
                evidence="DOM element id '__NEXT_DATA__' present"
            )
            detected["React"] = DetectedTechnology(
                name="React",
                category="JavaScript UI Library",
                version=None,
                confidence="CONFIRMED",
                evidence="Included via Next.js hydration bundle"
            )

        # Nuxt.js
        if "__NUXT__" in self.html_content:
            detected["Nuxt.js"] = DetectedTechnology(
                name="Nuxt.js",
                category="Full-Stack Framework",
                version=None,
                confidence="CONFIRMED",
                evidence="DOM window.__NUXT__ context object observed"
            )
            detected["Vue.js"] = DetectedTechnology(
                name="Vue.js",
                category="JavaScript UI Library",
                version=None,
                confidence="CONFIRMED",
                evidence="Included via Nuxt.js runtime"
            )

        # React root container (<div id="root"> or data-reactroot)
        if ("<div id=\"root\"" in self.html_content or "data-reactroot" in self.html_content) and "React" not in detected:
            detected["React"] = DetectedTechnology(
                name="React",
                category="JavaScript UI Library",
                version=None,
                confidence="HIGH",
                evidence="Root mounting container id='root' observed in HTML DOM"
            )

        # Vite Frontend Build Tool
        if (re.search(r'''<script[^>]+type=['"]module['"][^>]+src=['"][^'"]*/assets/index-[a-zA-Z0-9_\-]+''', self.html_content) or 
            "/@vite/client" in self.html_content or "vite" in self.html_content.lower()):
            if "Vite" not in detected:
                detected["Vite"] = DetectedTechnology(
                    name="Vite",
                    category="Frontend Bundler",
                    version=None,
                    confidence="HIGH",
                    evidence="Vite ES module asset manifest and module script loader observed"
                )

        # Vue data-v attributes or app container
        if ("<div id=\"app\"" in self.html_content or re.search(r"data-v-[a-z0-9]+", self.html_content)) and "Vue.js" not in detected:
            detected["Vue.js"] = DetectedTechnology(
                name="Vue.js",
                category="JavaScript UI Library",
                version=None,
                confidence="HIGH",
                evidence="Scoped CSS attribute 'data-v-*' or app mounting container observed"
            )

    def _check_script_signatures(self, detected: Dict[str, DetectedTechnology]):
        all_scripts_str = " ".join(self.script_urls).lower()
        
        # jQuery
        if "jquery" in all_scripts_str and "jQuery" not in detected:
            v_match = re.search(r"jquery[.-]([0-9\.]+)", all_scripts_str)
            detected["jQuery"] = DetectedTechnology(
                name="jQuery",
                category="JavaScript Library",
                version=v_match.group(1) if v_match else None,
                confidence="HIGH",
                evidence=f"Referenced in script URL: {v_match.group(0) if v_match else 'jquery.js'}"
            )

        # Bootstrap
        if "bootstrap" in all_scripts_str or "bootstrap" in self.html_content.lower():
            if "Bootstrap" not in detected:
                detected["Bootstrap"] = DetectedTechnology(
                    name="Bootstrap",
                    category="UI Framework",
                    version=None,
                    confidence="MEDIUM",
                    evidence="Bootstrap CSS or JS reference detected"
                )

        # Tailwind CSS
        if "tailwind" in self.html_content.lower() or re.search(r'''class=['"][^'"]*(?:flex|grid|items-center|justify-between|bg-|text-|rounded-lg)[^'"]*['"]''', self.html_content):
            if "Tailwind CSS" not in detected:
                detected["Tailwind CSS"] = DetectedTechnology(
                    name="Tailwind CSS",
                    category="CSS Framework",
                    version=None,
                    confidence="HIGH",
                    evidence="Tailwind utility classes observed in DOM elements"
                )

        # Google Firebase
        if "firebase" in all_scripts_str or "firebase" in self.html_content.lower() or "identitytoolkit" in self.html_content.lower():
            if "Firebase" not in detected:
                detected["Firebase"] = DetectedTechnology(
                    name="Firebase",
                    category="Backend as a Service (BaaS)",
                    version=None,
                    confidence="HIGH",
                    evidence="Firebase client runtime or API endpoints referenced"
                )

"""
Endpoint Discovery Module
=========================
Discovers and catalogues observable web endpoints, internal links, navigational paths,
and asset references within the approved target scope.
"""

from dataclasses import dataclass, field
import logging
import re
from typing import Any, Dict, List, Set
from urllib.parse import urljoin, urlparse

from .scope_manager import ScopeManager

logger = logging.getLogger("DefensiveAudit.EndpointDiscovery")


@dataclass
class DiscoveredEndpoint:
    url: str
    path: str
    category: str  # PAGE, FORM_ACTION, ASSET, API_CANDIDATE
    source: str
    method: str = "GET"


class EndpointDiscovery:
    """Discovers and categorizes observable web application endpoints."""

    def __init__(self, base_url: str, scope_manager: ScopeManager):
        self.base_url = base_url
        self.scope_manager = scope_manager
        self.base_host = urlparse(base_url).hostname.lower() if urlparse(base_url).hostname else ""

    def extract_endpoints_from_html(self, html_content: str, source_label: str = "Root Page") -> Dict[str, Any]:
        """Extract links, forms, and relative paths from HTML source."""
        endpoints: Dict[str, DiscoveredEndpoint] = {}
        
        # 1. Hyperlinks (<a href="...">)
        href_matches = re.findall(r'''(?i)href\s*=\s*['"]([^'"#\s>]+)['"]''', html_content)
        for href in href_matches:
            if href.startswith("javascript:") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            abs_url = urljoin(self.base_url, href)
            parsed = urlparse(abs_url)
            if self.scope_manager.is_url_in_scope(abs_url):
                path = parsed.path or "/"
                cat = "PAGE"
                if any(ext in path.lower() for ext in [".js", ".css", ".png", ".jpg", ".svg", ".ico", ".woff"]):
                    cat = "ASSET"
                elif "/api/" in path.lower() or path.startswith("/v1/") or path.startswith("/v2/"):
                    cat = "API_CANDIDATE"

                endpoints[abs_url] = DiscoveredEndpoint(
                    url=abs_url,
                    path=path,
                    category=cat,
                    source=f"HTML href attribute in {source_label}"
                )

        # 2. Form actions (<form action="...">)
        form_matches = re.findall(r'''(?i)<form[^>]*action\s*=\s*['"]([^'"#\s>]+)['"][^>]*>''', html_content)
        for action in form_matches:
            abs_url = urljoin(self.base_url, action)
            if self.scope_manager.is_url_in_scope(abs_url):
                parsed = urlparse(abs_url)
                endpoints[abs_url] = DiscoveredEndpoint(
                    url=abs_url,
                    path=parsed.path or "/",
                    category="FORM_ACTION",
                    source=f"HTML form action in {source_label}"
                )

        # 3. Quoted relative API paths in inline script blocks
        relative_path_matches = re.findall(r'''['"](/api/[a-zA-Z0-9_\-\/]+|/v[1-9]/[a-zA-Z0-9_\-\/]+)['"]''', html_content)
        for rel_path in relative_path_matches:
            abs_url = urljoin(self.base_url, rel_path)
            if abs_url not in endpoints:
                endpoints[abs_url] = DiscoveredEndpoint(
                    url=abs_url,
                    path=rel_path,
                    category="API_CANDIDATE",
                    source=f"Inline script pattern in {source_label}"
                )

        # 4. Client-side SPA routes (React Router / Vue Router / Next.js)
        spa_patterns = [
            re.compile(r'''path:\s*['"](/[^'"\s\$\?#]{2,})['"]'''),
            re.compile(r'''path\s*=\s*['"](/[^'"\s\$\?#]{2,})['"]'''),
            re.compile(r'''navigate\s*\(\s*['"](/[^'"\s\$\?#]{2,})['"]\s*\)'''),
            re.compile(r'''router\.push\s*\(\s*['"](/[^'"\s\$\?#]{2,})['"]\s*\)'''),
            re.compile(r'''to:\s*['"](/[^'"\s\$\?#]{2,})['"]'''),
            re.compile(r'''to\s*=\s*['"](/[^'"\s\$\?#]{2,})['"]'''),
        ]
        for p in spa_patterns:
            for rpath in p.findall(html_content):
                if not any(rpath.lower().endswith(ext) for ext in [".js", ".css", ".png", ".jpg", ".svg", ".ico"]):
                    abs_url = urljoin(self.base_url, rpath)
                    if abs_url not in endpoints:
                        endpoints[abs_url] = DiscoveredEndpoint(
                            url=abs_url,
                            path=rpath,
                            category="SPA_ROUTE",
                            source=f"Client Router Definition in {source_label}"
                        )

        # Organize into lists
        pages = [e for e in endpoints.values() if e.category in ("PAGE", "SPA_ROUTE")]
        spa_routes = [e for e in endpoints.values() if e.category == "SPA_ROUTE"]
        form_actions = [e for e in endpoints.values() if e.category == "FORM_ACTION"]
        api_candidates = [e for e in endpoints.values() if e.category == "API_CANDIDATE"]
        assets = [e for e in endpoints.values() if e.category == "ASSET"]

        return {
            "total_discovered": len(endpoints),
            "pages": [{"url": e.url, "path": e.path, "source": e.source} for e in pages],
            "spa_routes": [{"url": e.url, "path": e.path, "source": e.source} for e in spa_routes],
            "form_actions": [{"url": e.url, "path": e.path, "source": e.source} for e in form_actions],
            "api_candidates": [{"url": e.url, "path": e.path, "source": e.source} for e in api_candidates],
            "assets": [{"url": e.url, "path": e.path, "source": e.source} for e in assets],
            "limitations": [
                "Endpoint discovery combines server HTML hyperlinks, form actions, and client-side SPA router definitions.",
                "Authenticated routes requiring session states are identified through public code artifacts."
            ]
        }

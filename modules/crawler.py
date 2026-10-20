"""
In-Scope Web Crawler Module
============================
Defensively crawls internal web pages within authorized domain scope up to a
configurable depth and page ceiling, discovering links, scripts, and endpoints.
"""

from collections import deque
from dataclasses import dataclass, field
import logging
import re
from typing import Any, Dict, List, Set, Tuple
from urllib.parse import urljoin, urlparse, urldefrag

from .safe_client import SafeHttpClient, HttpResponse
from .scope_manager import ScopeManager

logger = logging.getLogger("DefensiveAudit.Crawler")


@dataclass
class CrawledPage:
    url: str
    status_code: int
    content_type: str
    title: str
    links_found: int
    scripts_found: int
    forms_found: int
    html_content: str = ""
    error: str = ""


class InScopeCrawler:
    """Bounded, defensive web crawler strictly constrained to authorized scope."""

    SKIPPABLE_EXTENSIONS = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
        ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z", ".mp4", ".mp3", ".avi",
        ".woff", ".woff2", ".ttf", ".eot", ".css"
    )

    def __init__(self, start_url: str, client: SafeHttpClient, scope_manager: ScopeManager,
                 max_pages: int = 15, max_depth: int = 2):
        self.start_url = start_url
        self.client = client
        self.scope_manager = scope_manager
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.base_host = urlparse(start_url).hostname.lower() if urlparse(start_url).hostname else ""

    def run_crawl(self) -> Dict[str, Any]:
        """Crawl pages breadth-first within authorized scope."""
        visited_urls: Set[str] = set()
        crawled_pages: List[CrawledPage] = []
        all_discovered_scripts: Set[str] = set()
        all_discovered_links: Set[str] = set()

        # Queue: (url, depth)
        clean_start, _ = urldefrag(self.start_url)
        queue: deque = deque([(clean_start, 0)])
        visited_urls.add(clean_start)

        logger.info(f"Starting in-scope crawl from {clean_start} (max_pages={self.max_pages}, max_depth={self.max_depth})...")

        while queue and len(crawled_pages) < self.max_pages:
            current_url, depth = queue.popleft()

            # Skip asset extensions from crawling
            parsed_path = urlparse(current_url).path.lower()
            if any(parsed_path.endswith(ext) for ext in self.SKIPPABLE_EXTENSIONS):
                continue

            try:
                resp = self.client.get(current_url, allow_redirects=True)
            except Exception as e:
                logger.debug(f"Failed to crawl {current_url}: {e}")
                continue

            if resp.status_code == 0:
                continue

            # Extract title
            title_match = re.search(r"<title[^>]*>(.*?)</title>", resp.body, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else "Untitled"
            title = re.sub(r"\s+", " ", title)[:80]

            # Extract scripts (standard <script src="...">, modulepreload, as well as Next.js/Vite/Webpack chunks)
            script_srcs = re.findall(r'''<script[^>]+src=['"]([^'"]+)['"]''', resp.body, re.IGNORECASE)
            preload_srcs = re.findall(r'''<link[^>]+(?:modulepreload|preload)[^>]+href=['"]([^'"]+\.(?:js|mjs))['"]''', resp.body, re.IGNORECASE)
            chunk_matches = re.findall(r'''(?:/(?:_next/static/chunks|assets|static/js)/[a-zA-Z0-9_\-\./]+\.(?:js|mjs))''', resp.body)
            all_candidate_scripts = set(script_srcs) | set(preload_srcs) | set(chunk_matches)
            
            page_scripts = []
            for s in all_candidate_scripts:
                abs_s = urljoin(current_url, s)
                all_discovered_scripts.add(abs_s)
                page_scripts.append(abs_s)

            # Extract forms
            forms = re.findall(r'''<form[^>]*>''', resp.body, re.IGNORECASE)

            # Extract internal links (href, to, data-href)
            href_matches = re.findall(r'''(?:href|to|data-href|data-url)=['"]([^'"#\s>]+)['"]''', resp.body, re.IGNORECASE)
            page_links = []

            for href in href_matches:
                if href.startswith("javascript:") or href.startswith("mailto:") or href.startswith("tel:"):
                    continue
                abs_link = urljoin(current_url, href)
                abs_clean, _ = urldefrag(abs_link)

                # Scope check
                if self.scope_manager.is_url_in_scope(abs_clean):
                    all_discovered_links.add(abs_clean)
                    page_links.append(abs_clean)

                    if depth + 1 <= self.max_depth and abs_clean not in visited_urls:
                        visited_urls.add(abs_clean)
                        queue.append((abs_clean, depth + 1))

            crawled_pages.append(CrawledPage(
                url=current_url,
                status_code=resp.status_code,
                content_type=resp.headers.get("Content-Type", "text/html"),
                title=title,
                links_found=len(page_links),
                scripts_found=len(page_scripts),
                forms_found=len(forms),
                html_content=resp.body
            ))

        return {
            "total_pages_crawled": len(crawled_pages),
            "max_pages_limit": self.max_pages,
            "pages": [
                {
                    "url": p.url,
                    "status_code": p.status_code,
                    "title": p.title,
                    "links_found": p.links_found,
                    "scripts_found": p.scripts_found,
                    "forms_found": p.forms_found
                }
                for p in crawled_pages
            ],
            "raw_pages": crawled_pages,
            "discovered_scripts": list(all_discovered_scripts),
            "discovered_links": list(all_discovered_links)
        }

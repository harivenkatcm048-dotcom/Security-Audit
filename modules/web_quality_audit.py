"""
Frontend Web Quality, UI/UX, SEO, and Performance Audit Module (v2)
===================================================================
Performs a non-destructive, evidence-based evaluation of a web application frontend:

1. Performance   - TTFB, compression, caching, render-blocking, page weight, request count,
                   third parties, image hygiene and (when a browser is available) *measured*
                   Core Web Vitals (LCP, CLS, TBT, FCP) on desktop and throttled mobile.
2. SEO           - title/description, headings, canonical, robots/noindex, OpenGraph/Twitter,
                   structured data, alt text, robots.txt, sitemap.xml, soft-404 behaviour.
3. UI/UX & A11y  - viewport/zoom, language, landmarks, form labels, accessible names,
                   mobile overflow, tap targets, tiny text, colour contrast, runtime errors.
4. Page matrix   - per-page SEO/UX scores for every crawled / sitemap / rendered route.

Design rules
------------
* Every section is isolated: a failure in one never blanks the whole report.
* Values are labelled ``measured`` (real browser / real HTTP) or ``estimated`` (model).
  Only measured facts are penalised.
* JavaScript-rendered SPAs are detected. When a browser is available the *rendered* DOM is
  audited; when it is not, content checks are reported as ``INFO`` (not measurable) rather
  than falsely failing on an empty app shell.
"""

from html.parser import HTMLParser
import json
import logging
import re
import time
import zlib
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urldefrag, urljoin, urlparse

try:  # optional, never required
    from .browser_metrics import collect_browser_metrics
except Exception:  # pragma: no cover - import guard
    collect_browser_metrics = None  # type: ignore

logger = logging.getLogger("DefensiveAudit.WebQuality")

SCHEMA_VERSION = 2
SPA_ROOT_IDS = ("root", "app", "__next", "__nuxt", "___gatsby", "svelte")
NON_HTML_EXT = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif", ".pdf", ".zip",
                ".css", ".js", ".mjs", ".json", ".xml", ".txt", ".mp4", ".mp3", ".woff", ".woff2",
                ".ttf", ".map", ".gz")
VAGUE_LINK_TEXT = {"click here", "here", "read more", "more", "link", "learn more", "this", "details"}
LANDMARK_ROLES = {"main": "main", "navigation": "nav", "banner": "header", "contentinfo": "footer",
                  "complementary": "aside"}


# --------------------------------------------------------------------------------------
# HTML parsing
# --------------------------------------------------------------------------------------
class PageParser(HTMLParser):
    """Single-pass HTML analyser (SEO, a11y, performance hints)."""

    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.title_tag = ""
        self.in_title = False
        self.in_head = False
        self._raw: Optional[str] = None  # script/style/noscript/template currently open

        self.meta_description = ""
        self.meta_viewport = ""
        self.meta_robots = ""
        self.meta_theme_color = ""
        self.has_charset = False
        self.canonical_url = ""
        self.og_tags: Dict[str, str] = {}
        self.twitter_tags: Dict[str, str] = {}
        self.html_lang = ""
        self.hreflang_count = 0
        self.icon_links: List[str] = []
        self.manifest = ""
        self.preconnects: List[str] = []
        self.preloads: List[str] = []

        self.headings: Dict[str, List[str]] = {f"h{i}": [] for i in range(1, 7)}
        self.heading_sequence: List[Tuple[int, str]] = []
        self._h_tag: Optional[str] = None
        self._h_text: List[str] = []

        self.images: List[Dict[str, Any]] = []
        self.semantic_tags = {k: 0 for k in ("header", "nav", "main", "article", "section", "aside", "footer")}
        self.root_ids: List[str] = []

        self.form_inputs: List[Dict[str, Any]] = []
        self.label_for: set = set()
        self._label_depth = 0
        self.buttons: List[Dict[str, Any]] = []
        self._btn: Optional[Dict[str, Any]] = None
        self.links: List[Dict[str, Any]] = []
        self._a: Optional[Dict[str, Any]] = None
        self.iframes: List[Dict[str, Any]] = []
        self.positive_tabindex = 0
        self.has_skip_link = False
        self._seen_first_anchor = False

        self.scripts: List[Dict[str, Any]] = []
        self.stylesheets: List[Dict[str, Any]] = []
        self.inline_script_bytes = 0
        self.inline_style_bytes = 0
        self.ld_blocks: List[str] = []
        self._ld_buf: Optional[List[str]] = None
        self.itemscope = False
        self.word_count = 0

    # -- helpers -----------------------------------------------------------------
    def _abs(self, href: str) -> str:
        try:
            return urljoin(self.base_url, href)
        except Exception:
            return href

    # -- tag handlers ------------------------------------------------------------
    def handle_starttag(self, tag: str, attrs: List[tuple]):
        t = tag.lower()
        a = {(k or "").lower(): (v if v is not None else "") for k, v in attrs}

        if "id" in a and a["id"] in SPA_ROOT_IDS:
            self.root_ids.append(a["id"])
        if "itemscope" in a:
            self.itemscope = True
        try:
            if int(a.get("tabindex", "0")) > 0:
                self.positive_tabindex += 1
        except ValueError:
            pass
        role = a.get("role", "").lower()
        if role in LANDMARK_ROLES and LANDMARK_ROLES[role] in self.semantic_tags:
            self.semantic_tags[LANDMARK_ROLES[role]] += 1

        if t == "html":
            self.html_lang = a.get("lang", "")
        elif t == "head":
            self.in_head = True
        elif t == "body":
            self.in_head = False
        elif t == "title":
            self.in_title = True
        elif t == "meta":
            name = a.get("name", "").lower()
            prop = a.get("property", "").lower()
            content = a.get("content", "").strip()
            if "charset" in a or a.get("http-equiv", "").lower() == "content-type":
                self.has_charset = True
            if name == "description":
                self.meta_description = content
            elif name == "viewport":
                self.meta_viewport = content
            elif name in ("robots", "googlebot"):
                self.meta_robots = (self.meta_robots + "," + content).strip(",")
            elif name == "theme-color":
                self.meta_theme_color = content
            elif prop.startswith("og:"):
                self.og_tags[prop] = content
            elif name.startswith("twitter:"):
                self.twitter_tags[name] = content
        elif t == "link":
            rel = a.get("rel", "").lower()
            href = a.get("href", "")
            if not href:
                return
            if "canonical" in rel:
                self.canonical_url = self._abs(href)
            if "stylesheet" in rel:
                self.stylesheets.append({"href": self._abs(href), "media": a.get("media", "all").lower(),
                                         "in_head": self.in_head})
            if "icon" in rel:
                self.icon_links.append(self._abs(href))
            if "manifest" in rel:
                self.manifest = self._abs(href)
            if "preconnect" in rel or "dns-prefetch" in rel:
                self.preconnects.append(self._abs(href))
            if "preload" in rel:
                self.preloads.append(self._abs(href))
            if "alternate" in rel and a.get("hreflang"):
                self.hreflang_count += 1
        elif t == "script":
            stype = a.get("type", "").lower()
            if stype == "application/ld+json":
                self._ld_buf = []
            else:
                src = a.get("src")
                self.scripts.append({
                    "src": self._abs(src) if src else None,
                    "in_head": self.in_head,
                    "is_async": "async" in a,
                    "is_defer": "defer" in a,
                    "is_module": stype == "module",
                })
            self._raw = "script"
        elif t in ("style", "noscript", "template"):
            self._raw = t
        elif t in self.headings:
            self._h_tag = t
            self._h_text = []
        elif t == "img":
            src = a.get("src", "") or a.get("data-src", "")
            alt = a.get("alt")
            self.images.append({
                "src": self._abs(src) if src else "",
                "has_alt_attr": alt is not None,
                "alt_text": (alt or "").strip(),
                "decorative": alt is not None and alt.strip() == "" and (
                    role in ("presentation", "none") or a.get("aria-hidden") == "true"),
                "has_dimensions": bool(a.get("width") and a.get("height")),
                "is_lazy": a.get("loading", "").lower() == "lazy",
                "has_srcset": bool(a.get("srcset")),
            })
            if self._a is not None and alt:
                self._a["img_alt"] = alt.strip()
            if self._btn is not None and alt:
                self._btn["img_alt"] = alt.strip()
        elif t == "label":
            self._label_depth += 1
            if a.get("for"):
                self.label_for.add(a["for"])
        elif t in ("input", "select", "textarea"):
            itype = a.get("type", "text").lower() if t == "input" else t
            if itype in ("submit", "button", "reset", "image"):
                self.buttons.append({
                    "name": (a.get("aria-label") or a.get("value") or a.get("title") or "").strip()
                            or (a.get("aria-labelledby") or ""),
                })
            elif itype != "hidden":
                self.form_inputs.append({
                    "type": itype, "id": a.get("id", ""), "name": a.get("name", ""),
                    "aria": bool(a.get("aria-label") or a.get("aria-labelledby") or a.get("title")),
                    "in_label": self._label_depth > 0,
                    "placeholder": bool(a.get("placeholder")),
                })
        elif t == "button":
            self._btn = {
                "aria": (a.get("aria-label") or a.get("aria-labelledby") or a.get("title") or "").strip(),
                "text": [], "img_alt": "",
            }
        elif t == "a":
            href = a.get("href", "")
            self._a = {
                "href": href,
                "aria": (a.get("aria-label") or a.get("aria-labelledby") or a.get("title") or "").strip(),
                "text": [], "img_alt": "",
            }
            if not self._seen_first_anchor:
                self._seen_first_anchor = True
                if href.startswith("#") and len(href) > 1:
                    self.has_skip_link = True
        elif t == "iframe":
            self.iframes.append({"title": (a.get("title") or "").strip(), "src": a.get("src", "")})

        if t in self.semantic_tags:
            self.semantic_tags[t] += 1

    def handle_endtag(self, tag: str):
        t = tag.lower()
        if t == "head":
            self.in_head = False
        elif t == "title":
            self.in_title = False
        elif t == "script":
            if self._ld_buf is not None:
                blob = "".join(self._ld_buf).strip()
                if blob:
                    self.ld_blocks.append(blob)
                self._ld_buf = None
            self._raw = None
        elif t in ("style", "noscript", "template"):
            self._raw = None
        elif t in self.headings and self._h_tag == t:
            text = " ".join(self._h_text).strip()
            if text:
                self.headings[t].append(text)
                self.heading_sequence.append((int(t[1]), text))
            self._h_tag = None
            self._h_text = []
        elif t == "label":
            self._label_depth = max(0, self._label_depth - 1)
        elif t == "button" and self._btn is not None:
            b = self._btn
            name = b["aria"] or " ".join(b["text"]).strip() or b["img_alt"]
            self.buttons.append({"name": name})
            self._btn = None
        elif t == "a" and self._a is not None:
            an = self._a
            text = " ".join(an["text"]).strip()
            name = an["aria"] or text or an["img_alt"]
            self.links.append({"href": an["href"], "text": text, "name": name})
            self._a = None

    def handle_data(self, data: str):
        if self._raw == "script":
            if self._ld_buf is not None:
                self._ld_buf.append(data)
            else:
                self.inline_script_bytes += len(data.encode("utf-8", "ignore"))
            return
        if self._raw == "style":
            self.inline_style_bytes += len(data.encode("utf-8", "ignore"))
            return
        if self._raw:
            return
        s = data.strip()
        if not s:
            return
        if self.in_title:
            self.title_tag += " " + s
            return
        if self._h_tag:
            self._h_text.append(s)
        if self._a is not None:
            self._a["text"].append(s)
        if self._btn is not None:
            self._btn["text"].append(s)
        if not self.in_head:
            self.word_count += len(s.split())

    # -- derived -----------------------------------------------------------------
    def unlabeled_inputs(self) -> List[Dict[str, Any]]:
        return [i for i in self.form_inputs
                if not (i["aria"] or i["in_label"] or (i["id"] and i["id"] in self.label_for))]


def _parse(html: str, url: str) -> PageParser:
    p = PageParser(url)
    try:
        p.feed(html or "")
        p.close()
    except Exception as e:  # malformed markup should never stop the audit
        logger.debug(f"WebQuality parser note: {e}")
    return p


# --------------------------------------------------------------------------------------
# Check helpers
# --------------------------------------------------------------------------------------
def chk(cid: str, cat: str, label: str, ok: bool, detail: str, pen: int = 0, effort: str = "LOW",
        title: str = "", desc: str = "", code: str = "", severe: bool = False,
        info: bool = False, reliable: bool = True, impact: Optional[str] = None) -> Dict[str, Any]:
    """Create a normalised check record. Only WARN/FAIL checks carry a penalty."""
    if ok:
        status = "PASS"
    elif not reliable:
        status = "INFO"
        detail = detail + " (not measurable: page content is rendered by JavaScript)"
    elif info:
        status = "INFO"
    else:
        status = "FAIL" if severe else "WARN"
    penalty = pen if status in ("WARN", "FAIL") else 0
    if impact is None:
        impact = "HIGH" if penalty >= 10 else ("MEDIUM" if penalty >= 5 else ("LOW" if penalty > 0 else "NONE"))
    return {
        "id": cid, "category": cat, "label": label, "status": status, "detail": detail,
        "penalty": penalty, "impact": impact, "effort": effort,
        "fix": {"title": title or label, "description": desc or detail, "remediation": code},
    }


def _score(checks: List[Dict[str, Any]]) -> int:
    return int(max(0, min(100, 100 - sum(c.get("penalty", 0) for c in checks))))


def _grade(score: float) -> str:
    return "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "F"


def _rate(value: float, good: float, poor: float) -> str:
    return "GOOD" if value <= good else ("NEEDS_IMPROVEMENT" if value <= poor else "POOR")


def _kb(n: Optional[float]) -> float:
    return round((n or 0) / 1024, 1)


def _key(url: str) -> str:
    try:
        u = urldefrag(url)[0]
        p = urlparse(u)
        host = (p.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        return f"{host}{p.path.rstrip('/')}{('?' + p.query) if p.query else ''}"
    except Exception:
        return url


def _decode_body(raw: bytes, encoding: str) -> bytes:
    """Best-effort gzip/deflate decode; tolerant to truncated streams."""
    enc = (encoding or "").lower()
    try:
        if "gzip" in enc:
            return zlib.decompressobj(16 + zlib.MAX_WBITS).decompress(raw)
        if "deflate" in enc:
            try:
                return zlib.decompressobj().decompress(raw)
            except zlib.error:
                return zlib.decompressobj(-zlib.MAX_WBITS).decompress(raw)
    except Exception:
        pass
    return raw


# --------------------------------------------------------------------------------------
# Auditor
# --------------------------------------------------------------------------------------
class WebQualityAuditor:
    """Runs the full frontend quality assessment and returns a schema-v2 report."""

    MAX_ASSETS = 14
    MAX_EXTRA_PAGES = 10

    def __init__(self, base_url: str, client: Any, allow_local: bool = False):
        self.base_url = base_url
        self.client = client
        self.allow_local = allow_local
        self.parsed_base = urlparse(base_url)
        self.base_host = (self.parsed_base.hostname or "").lower()
        self.errors: List[str] = []

    # -- generic utilities -------------------------------------------------------
    def _guard(self, name: str, fn, default):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 - isolate every section
            logger.warning(f"WebQuality section '{name}' failed: {e}")
            self.errors.append(f"{name}: {str(e)[:160]}")
            return default

    def _same_site(self, url: str) -> bool:
        try:
            h = (urlparse(url).hostname or "").lower()
        except Exception:
            return False
        b = self.base_host
        return bool(h) and (h == b or h == "www." + b or b == "www." + h)

    def _origin(self) -> str:
        return f"{self.parsed_base.scheme}://{self.parsed_base.netloc}"

    def _probe(self, url: str, encodings: str = "gzip, deflate, br", decode: bool = False,
               accept: str = "*/*") -> Dict[str, Any]:
        """HTTP GET that records real transfer size, content-encoding, caching and latency."""
        t0 = time.time()
        try:
            r = self.client.request("GET", url, headers={"Accept-Encoding": encodings, "Accept": accept},
                                    allow_redirects=True)
        except Exception as e:  # noqa: BLE001
            return {"url": url, "status": 0, "error": str(e)[:140], "latency_ms": 0.0}
        hdrs = {str(k).lower(): str(v) for k, v in (getattr(r, "headers", {}) or {}).items()}
        raw = getattr(r, "raw_bytes", b"") or b""
        enc = hdrs.get("content-encoding", "").lower()
        transfer = len(raw)
        if not transfer:
            try:
                transfer = int(hdrs.get("content-length", "0"))
            except ValueError:
                transfer = 0
        text = getattr(r, "body", "") or ""
        decoded_len = len(raw) if not enc else None
        if raw and enc and ("gzip" in enc or "deflate" in enc):
            dec = _decode_body(raw, enc)
            decoded_len = len(dec)
            if decode:
                try:
                    text = dec.decode("utf-8", errors="replace")
                except Exception:
                    pass
        truncated = bool(raw) and len(raw) >= int(getattr(self.client, "max_response_bytes", 2097152) or 2097152)
        return {
            "url": url, "final_url": getattr(r, "url", url), "status": getattr(r, "status_code", 0),
            "headers": hdrs, "encoding": enc, "transfer_bytes": transfer, "decoded_bytes": decoded_len,
            "content_type": hdrs.get("content-type", ""), "cache_control": hdrs.get("cache-control", ""),
            "latency_ms": round((getattr(r, "elapsed_seconds", 0.0) or (time.time() - t0)) * 1000, 1),
            "text": text, "truncated": truncated, "error": getattr(r, "error", None),
        }

    # -- main entry --------------------------------------------------------------
    def run_full_audit(self, root_resp: Any, crawled_pages: Optional[List[Any]] = None) -> Dict[str, Any]:
        started = time.time()
        self.errors = []
        crawled = self._normalise_pages(crawled_pages or [])
        root_html = getattr(root_resp, "body", "") or ""
        root_url = getattr(root_resp, "url", "") or self.base_url
        root_headers = {str(k).lower(): str(v) for k, v in (getattr(root_resp, "headers", {}) or {}).items()}
        root_elapsed_ms = round((getattr(root_resp, "elapsed_seconds", 0.0) or 0.0) * 1000, 1)

        static_parser = _parse(root_html, root_url)

        # --- site-wide resources -------------------------------------------------
        robots = self._guard("robots.txt", self._check_robots, {"present": False, "valid": False})
        sitemap = self._guard("sitemap.xml", lambda: self._check_sitemap(robots), {"present": False, "valid": False, "urls": []})
        soft404 = self._guard("soft-404", lambda: self._check_soft_404(root_html), {"checked": False})

        # --- optional real-browser measurements ----------------------------------
        seed_urls = [c["url"] for c in crawled if c.get("url")] + list(sitemap.get("urls", []))[:12]
        browser = self._guard("browser", lambda: self._run_browser(root_url, seed_urls), {"available": False, "reason": "Browser audit failed"})
        rendered_html = browser.pop("_rendered_html", "") if isinstance(browser, dict) else ""
        browser_pages: Dict[str, Dict[str, Any]] = {}
        for p in (browser.get("extra_pages") or []) if isinstance(browser, dict) else []:
            browser_pages[_key(p.get("final_url") or p.get("url", ""))] = p
        b_ok = bool(browser.get("available"))
        desktop = browser.get("desktop") if b_ok and (browser.get("desktop") or {}).get("ok") else None
        mobile = browser.get("mobile") if b_ok and (browser.get("mobile") or {}).get("ok") else None

        # --- rendering mode ------------------------------------------------------
        rendering = self._detect_rendering(static_parser, desktop, rendered_html)
        content_parser = static_parser
        if rendering["mode"] != "SERVER_RENDERED" and rendered_html:
            content_parser = _parse(rendered_html, root_url)
        reliable = not (rendering["mode"] == "CLIENT_SIDE_SPA" and not rendered_html)

        # --- root document & asset probes ---------------------------------------
        root_probe = self._guard("root-probe", lambda: self._probe(root_url, "gzip, deflate, br"), {})
        assets = self._guard("assets", lambda: self._measure_assets(static_parser), [])

        # --- check collections ---------------------------------------------------
        perf_checks, perf_extra = self._guard(
            "performance", lambda: self._performance_checks(static_parser, root_probe, root_elapsed_ms,
                                                            root_headers, assets, desktop, mobile, rendering, root_html),
            ([], {}))
        seo_checks = self._guard(
            "seo", lambda: self._seo_checks(content_parser, static_parser, root_url, rendering, robots, sitemap,
                                            soft404, reliable, True), [])
        ux_checks = self._guard(
            "ui_ux", lambda: self._ux_checks(content_parser, static_parser, root_url, desktop, mobile, reliable,
                                             True, rendering), [])

        # --- multi-page matrix ---------------------------------------------------
        matrix = self._guard(
            "pages", lambda: self._build_matrix(root_url, root_html, root_probe, static_parser, content_parser,
                                                seo_checks, ux_checks, desktop, crawled, sitemap, browser_pages,
                                                reliable),
            [])
        # cross-page checks (duplicate titles, broken routes)
        seo_checks.extend(self._guard("cross-page", lambda: self._cross_page_checks(matrix), []))

        perf_score, seo_score, ux_score = _score(perf_checks), _score(seo_checks), _score(ux_checks)
        overall = round(perf_score * 0.35 + seo_score * 0.35 + ux_score * 0.30)

        all_checks = perf_checks + seo_checks + ux_checks
        optimizations = self._build_optimizations(all_checks, matrix)

        perf_section = self._guard(
            "performance-section",
            lambda: self._perf_section(perf_score, perf_checks, perf_extra, static_parser, root_probe,
                                       root_elapsed_ms, assets, desktop, mobile, rendering, optimizations),
            {"score": perf_score, "checks": perf_checks, "optimizations": [], "core_web_vitals": {}})
        seo_section = self._guard(
            "seo-section",
            lambda: self._seo_section(seo_score, seo_checks, content_parser, static_parser, robots, sitemap,
                                      soft404, optimizations),
            {"score": seo_score, "checks": seo_checks, "optimizations": []})
        ux_section = self._guard(
            "ux-section",
            lambda: self._ux_section(ux_score, ux_checks, content_parser, desktop, mobile, rendering, optimizations),
            {"score": ux_score, "checks": ux_checks, "optimizations": []})

        browser_public = self._public_browser(browser, desktop, mobile)
        measurement = {
            "method": "headless_browser" if b_ok else "static_analysis",
            "browser": browser.get("browser", "") if b_ok else "",
            "reason": "" if b_ok else (browser.get("reason") or ""),
            "duration_seconds": round(time.time() - started, 1),
            "notes": self._measurement_notes(b_ok, rendering, browser),
        }

        counts = {"PASS": 0, "WARN": 0, "FAIL": 0, "INFO": 0}
        for c in all_checks:
            counts[c["status"]] = counts.get(c["status"], 0) + 1

        return {
            "schema_version": SCHEMA_VERSION,
            "available": True,
            "measurement": measurement,
            "errors": self.errors,
            "summary": {
                "overall_web_health_score": overall,
                "performance_score": perf_score,
                "seo_score": seo_score,
                "ui_ux_score": ux_score,
                "grade": _grade(overall),
                "total_optimizations_found": len(optimizations),
                "pages_audited_count": len(matrix),
                "checks_total": len(all_checks),
                "checks_passed": counts["PASS"],
                "checks_warned": counts["WARN"],
                "checks_failed": counts["FAIL"],
                "checks_info": counts["INFO"],
                "high_impact_count": sum(1 for o in optimizations if o["impact"] == "HIGH"),
                "quick_wins_count": sum(1 for o in optimizations if o["effort"] == "LOW" and o["impact"] in ("HIGH", "MEDIUM")),
            },
            "rendering": rendering,
            "browser": browser_public,
            "performance": perf_section,
            "seo": seo_section,
            "ui_ux_accessibility": ux_section,
            "pages_matrix": matrix,
            "checklist": all_checks,
            "all_optimizations": optimizations,
        }

    # -- normalisation -----------------------------------------------------------
    def _normalise_pages(self, pages: List[Any]) -> List[Dict[str, Any]]:
        """Crawler returns CrawledPage dataclasses; accept dicts too."""
        out: List[Dict[str, Any]] = []
        for p in pages:
            try:
                d = p if isinstance(p, dict) else dict(vars(p))
            except Exception:
                continue
            if d.get("url"):
                out.append(d)
        return out

    # -- browser -----------------------------------------------------------------
    def _run_browser(self, url: str, seeds: List[str]) -> Dict[str, Any]:
        if collect_browser_metrics is None:
            return {"available": False, "reason": "Browser metrics module unavailable"}
        return collect_browser_metrics(url, allow_local=self.allow_local, seed_urls=seeds, max_extra_pages=4)

    def _public_browser(self, browser: Dict[str, Any], desktop: Optional[Dict], mobile: Optional[Dict]) -> Dict[str, Any]:
        def clean(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
            if not d:
                return None
            c = {k: v for k, v in d.items() if not k.startswith("_")}
            c["internal_links"] = (c.get("internal_links") or [])[:30]
            return c
        return {
            "available": bool(browser.get("available")),
            "reason": browser.get("reason", ""),
            "browser": browser.get("browser", ""),
            "desktop": clean(desktop),
            "mobile": clean(mobile),
        }

    def _measurement_notes(self, b_ok: bool, rendering: Dict[str, Any], browser: Dict[str, Any]) -> List[str]:
        notes: List[str] = []
        if b_ok:
            notes.append("Core Web Vitals were measured in a real headless browser (desktop 1366x768 and throttled "
                         "mobile 390x844 on ~5 Mbps / 2x CPU slowdown).")
        else:
            notes.append("Real-browser measurement was not available; Core Web Vitals are shown as estimates and "
                         "are not penalised. Install Playwright (`pip install playwright`) with Edge or Chrome "
                         "present to enable measured LCP/CLS/TBT, rendered-DOM and mobile-layout checks.")
        if rendering["mode"] == "CLIENT_SIDE_SPA" and not b_ok:
            notes.append("This site renders in the browser (SPA). Content-level checks (H1, alt text, landmarks, "
                         "labels) cannot be evaluated from static HTML and are reported as INFO.")
        return notes

    # -- rendering mode ----------------------------------------------------------
    def _detect_rendering(self, static_p: PageParser, desktop: Optional[Dict], rendered_html: str) -> Dict[str, Any]:
        static_words = static_p.word_count
        rendered_words = 0
        framework = ""
        if desktop:
            rendered_words = int((desktop.get("content") or {}).get("word_count", 0))
            framework = (desktop.get("content") or {}).get("framework_hint", "")
        if not framework and static_p.root_ids:
            framework = {"__next": "Next.js / React", "__nuxt": "Nuxt / Vue", "root": "React (SPA)",
                         "app": "Vue / SPA", "___gatsby": "Gatsby / React", "svelte": "Svelte"}.get(static_p.root_ids[0], "")
        spa_shell = bool(static_p.root_ids) and static_words < 60
        if spa_shell:
            mode = "CLIENT_SIDE_SPA"
        elif rendered_words and static_words < 150 and rendered_words > max(120, static_words * 2.5):
            mode = "HYBRID"
        else:
            mode = "SERVER_RENDERED"
        return {
            "mode": mode,
            "static_word_count": static_words,
            "rendered_word_count": rendered_words,
            "framework_hint": framework,
            "rendered_dom_audited": bool(rendered_html) and mode != "SERVER_RENDERED",
        }

    # -- site-wide resources -----------------------------------------------------
    def _check_robots(self) -> Dict[str, Any]:
        pr = self._probe(self._origin() + "/robots.txt", "gzip, deflate", decode=True, accept="text/plain,*/*")
        text = pr.get("text", "") or ""
        low = text.lower()
        is_html = "<html" in low[:400] or "<!doctype html" in low[:400]
        valid = pr.get("status") == 200 and ("user-agent" in low or "sitemap:" in low) and not is_html
        blocks_all = False
        sitemaps: List[str] = []
        if valid:
            agent_all = False
            for line in text.splitlines():
                ln = line.split("#")[0].strip()
                if not ln or ":" not in ln:
                    continue
                k, v = ln.split(":", 1)
                k, v = k.strip().lower(), v.strip()
                if k == "user-agent":
                    agent_all = v == "*"
                elif k == "disallow" and agent_all and v == "/":
                    blocks_all = True
                elif k == "sitemap" and v:
                    sitemaps.append(v)
        return {"present": pr.get("status") == 200 and not is_html, "valid": valid, "blocks_all": blocks_all,
                "sitemaps": sitemaps[:5], "status": pr.get("status", 0), "size_bytes": len(text)}

    def _check_sitemap(self, robots: Dict[str, Any]) -> Dict[str, Any]:
        candidates = list(robots.get("sitemaps", [])) or []
        default = self._origin() + "/sitemap.xml"
        if default not in candidates:
            candidates.append(default)
        for cand in candidates[:3]:
            if not self._same_site(cand):
                continue
            pr = self._probe(cand, "gzip, deflate", decode=True, accept="application/xml,text/xml,*/*")
            text = pr.get("text", "") or ""
            low = text.lower()
            if pr.get("status") != 200:
                continue
            if "<sitemapindex" in low:
                children = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", text, flags=re.I)
                urls: List[str] = []
                for child in children[:2]:
                    if not self._same_site(child):
                        continue
                    cp = self._probe(child, "gzip, deflate", decode=True, accept="application/xml,text/xml,*/*")
                    if cp.get("status") == 200 and "<urlset" in (cp.get("text", "") or "").lower():
                        urls += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", cp["text"], flags=re.I)
                return {"present": True, "valid": True, "url": cand, "type": "index",
                        "url_count": len(urls), "urls": [u for u in urls if self._same_site(u)][:25]}
            if "<urlset" in low:
                urls = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", text, flags=re.I)
                return {"present": True, "valid": True, "url": cand, "type": "urlset",
                        "url_count": len(urls), "urls": [u for u in urls if self._same_site(u)][:25]}
        return {"present": False, "valid": False, "url_count": 0, "urls": []}

    def _check_soft_404(self, root_html: str) -> Dict[str, Any]:
        probe_url = self._origin() + "/nexentra-404-probe-" + str(int(time.time()) % 100000)
        pr = self._probe(probe_url, "gzip, deflate", decode=True, accept="text/html,*/*")
        status = pr.get("status", 0)
        body = pr.get("text", "") or ""
        same_as_home = bool(body) and abs(len(body) - len(root_html)) <= max(64, int(len(root_html) * 0.02))
        return {"checked": True, "status": status, "returns_200_for_missing": status == 200,
                "serves_homepage_shell": status == 200 and same_as_home}

    # -- assets ------------------------------------------------------------------
    def _measure_assets(self, p: PageParser) -> List[Dict[str, Any]]:
        picks: List[Tuple[str, str]] = []
        seen = set()

        def add(u: str, kind: str, cap: int):
            if not u or u in seen or not u.lower().startswith(("http://", "https://")) or not self._same_site(u):
                return
            if sum(1 for _, k in picks if k == kind) >= cap:
                return
            seen.add(u)
            picks.append((u, kind))

        for s in p.stylesheets:
            add(s["href"], "css", 4)
        for s in p.scripts:
            add(s.get("src") or "", "js", 8)
        for im in p.images:
            add(im.get("src", ""), "image", 3)
        for pre in p.preloads:
            if re.search(r"\.(woff2?|ttf)(\?|$)", pre, re.I):
                add(pre, "font", 1)

        out: List[Dict[str, Any]] = []
        for url, kind in picks[: self.MAX_ASSETS]:
            pr = self._probe(url, "gzip, deflate, br")
            if pr.get("status") == 0 and pr.get("error"):
                continue
            out.append({
                "url": url, "type": kind, "status": pr.get("status", 0),
                "transfer_bytes": pr.get("transfer_bytes", 0), "decoded_bytes": pr.get("decoded_bytes"),
                "encoding": pr.get("encoding", "") or "none", "cache_control": pr.get("cache_control", "") or "none",
                "latency_ms": pr.get("latency_ms", 0.0), "truncated": pr.get("truncated", False),
            })
        return out

    # ---------------------------------------------------------------------------
    # PERFORMANCE
    # ---------------------------------------------------------------------------
    def _performance_checks(self, p: PageParser, root_probe: Dict[str, Any], root_elapsed_ms: float,
                            root_headers: Dict[str, str], assets: List[Dict[str, Any]],
                            desktop: Optional[Dict], mobile: Optional[Dict], rendering: Dict[str, Any],
                            root_html: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        C = "Performance"
        checks: List[Dict[str, Any]] = []
        primary = mobile or desktop
        extra: Dict[str, Any] = {}

        # TTFB
        if primary and (primary.get("timings") or {}).get("ttfb_ms"):
            ttfb = float(primary["timings"]["ttfb_ms"])
            ttfb_src = "measured (browser)"
        elif desktop and (desktop.get("timings") or {}).get("ttfb_ms"):
            ttfb = float(desktop["timings"]["ttfb_ms"])
            ttfb_src = "measured (browser)"
        else:
            ttfb = float(root_probe.get("latency_ms") or root_elapsed_ms or 0)
            ttfb_src = "measured (HTTP request time incl. TLS)"
        extra["ttfb_ms"] = round(ttfb, 1)
        extra["ttfb_source"] = ttfb_src
        checks.append(chk(
            "perf.ttfb", C, "Server response time (TTFB)", ttfb <= 600,
            f"{round(ttfb)} ms - {ttfb_src}. Target: under 600 ms (ideal under 200 ms).",
            15 if ttfb > 1200 else 8, "MEDIUM", severe=ttfb > 1200,
            title="Reduce server response time",
            desc=f"The first byte arrived after {round(ttfb)} ms. Slow TTFB delays every other metric.",
            code="Serve HTML from an edge CDN, enable full-page / micro caching, keep origin connections alive "
                 "and profile slow database queries."))

        # Compression (document)
        enc = root_probe.get("encoding", "") if root_probe else ""
        decoded = root_probe.get("decoded_bytes") or len(root_html.encode("utf-8", "ignore"))
        compressed = any(x in enc for x in ("gzip", "br", "deflate", "zstd"))
        extra["document_encoding"] = enc or "none"
        checks.append(chk(
            "perf.compression", C, "Text compression on the HTML document",
            compressed or decoded < 2048,
            f"Document served with content-encoding: {enc or 'none'} ({_kb(decoded)} KB decoded).",
            12, "LOW", severe=True,
            title="Enable Brotli / Gzip compression",
            desc="The HTML document is transferred uncompressed, wasting bandwidth on every visit.",
            code="# nginx\ngzip on;\ngzip_types text/plain text/css application/json application/javascript image/svg+xml;\n"
                 "# prefer Brotli where available: brotli on; brotli_types ..."))

        # Asset compression & caching
        text_assets = [a for a in assets if a["type"] in ("js", "css") and a.get("status") == 200]
        uncompressed = [a for a in text_assets if (a["encoding"] in ("none", "identity")) and a["transfer_bytes"] >= 4096]
        checks.append(chk(
            "perf.asset_compression", C, "Compression on JS / CSS assets", not uncompressed,
            f"{len(uncompressed)} of {len(text_assets)} sampled text assets are uncompressed."
            + (f" Example: {uncompressed[0]['url']}" if uncompressed else ""),
            min(10, 3 + 2 * len(uncompressed)), "LOW",
            title=f"Compress {len(uncompressed)} uncompressed asset(s)",
            desc="Scripts and stylesheets compress 70-90 %. Enable compression for application/javascript and text/css.",
            code="gzip_types application/javascript text/css application/json;"))

        def max_age(cc: str) -> int:
            m = re.search(r"(?:s-)?max-age=(\d+)", cc or "")
            return int(m.group(1)) if m else 0
        static_assets = [a for a in assets if a["type"] in ("js", "css", "font") and a.get("status") == 200]
        weak = [a for a in static_assets if max_age(a["cache_control"]) < 604800 and "immutable" not in a["cache_control"].lower()]
        checks.append(chk(
            "perf.caching", C, "Long-lived cache policy for static assets", not weak,
            f"{len(weak)} of {len(static_assets)} sampled static assets lack a long cache lifetime."
            + (f" Example: {weak[0]['url']} ({weak[0]['cache_control']})" if weak else ""),
            min(8, 2 + len(weak)), "LOW", info=not static_assets,
            title="Add long-lived Cache-Control to static assets",
            desc="Fingerprinted assets should be cached for a year so repeat visits load instantly.",
            code="Cache-Control: public, max-age=31536000, immutable"))

        # Render blocking
        head_scripts = [s for s in p.scripts if s.get("in_head") and s.get("src")]
        blocking = [s for s in head_scripts if not (s["is_async"] or s["is_defer"] or s["is_module"])]
        checks.append(chk(
            "perf.render_blocking_js", C, "Render-blocking scripts in <head>", not blocking,
            f"{len(blocking)} synchronous script(s) in <head>." + (f" Example: {blocking[0]['src']}" if blocking else ""),
            min(15, 6 * len(blocking)), "LOW",
            title=f"Defer {len(blocking)} render-blocking script(s)",
            desc="Synchronous scripts stop HTML parsing until they download and execute.",
            code='<script src="/app.js" defer></script>'))
        blocking_css = [s for s in p.stylesheets if s.get("media", "all") in ("all", "screen", "") and s.get("in_head")]
        checks.append(chk(
            "perf.render_blocking_css", C, "Render-blocking stylesheets", len(blocking_css) <= 3,
            f"{len(blocking_css)} blocking stylesheet(s) in <head>.", 4, "MEDIUM",
            title="Reduce render-blocking CSS",
            desc="Many separate blocking stylesheets delay first paint. Bundle them, inline critical CSS, load the rest asynchronously.",
            code='<link rel="preload" href="/rest.css" as="style" onload="this.rel=\'stylesheet\'">'))

        # Page weight & requests
        weight_src, total_bytes, js_bytes, req_count, third_hosts = "none", 0, 0, 0, []
        if desktop and (desktop.get("network") or {}).get("transfer_bytes") is not None:
            net = desktop["network"]
            total_bytes = int(net.get("transfer_bytes", 0))
            js_bytes = int((net.get("by_type", {}).get("script") or {}).get("bytes", 0))
            req_count = int(net.get("requests", 0))
            third_hosts = net.get("third_party_hosts", []) or []
            weight_src = "measured (browser)"
        else:
            total_bytes = int(root_probe.get("transfer_bytes", 0) or 0) + sum(a["transfer_bytes"] for a in assets)
            js_bytes = sum(a["transfer_bytes"] for a in assets if a["type"] == "js")
            req_count = 1 + len(p.scripts) + len(p.stylesheets) + len(p.images)
            third_hosts = sorted({urlparse(s["src"]).hostname for s in p.scripts
                                  if s.get("src") and not self._same_site(s["src"]) and urlparse(s["src"]).hostname})
            weight_src = "sampled (HTML + up to 14 assets)"
        extra.update({"total_transfer_bytes": total_bytes, "js_transfer_bytes": js_bytes,
                      "request_count": req_count, "third_party_hosts": third_hosts, "weight_source": weight_src})
        mb = total_bytes / 1048576
        checks.append(chk(
            "perf.page_weight", C, "Total page weight", mb <= 1.6,
            f"{mb:.2f} MB transferred - {weight_src}. Target: under 1.6 MB.", 12 if mb > 3 else 6, "MEDIUM",
            severe=mb > 3, title="Reduce total page weight",
            desc="Heavy pages load slowly on mobile data. Compress images, lazy-load below-the-fold media and remove unused code.",
            code="Use WebP/AVIF, loading=\"lazy\", code-splitting and tree-shaking."))
        checks.append(chk(
            "perf.js_weight", C, "JavaScript payload", js_bytes <= 500 * 1024,
            f"{_kb(js_bytes)} KB of JavaScript transferred. Target: under 500 KB.",
            10 if js_bytes > 1024 * 1024 else 6, "HIGH", severe=js_bytes > 1024 * 1024,
            title="Reduce JavaScript payload",
            desc="Large bundles increase parse/execute time and block interactivity (TBT / INP).",
            code="Route-level code splitting (React.lazy / dynamic import), drop unused dependencies, analyse with `vite build --report`."))
        checks.append(chk(
            "perf.requests", C, "Request count", req_count <= 80,
            f"{req_count} requests on first load. Target: under 80.", 5, "MEDIUM",
            title="Reduce number of requests", desc="Too many requests add latency, especially over HTTP/1.1.",
            code="Bundle small files, sprite or inline tiny icons, remove unused tags."))
        checks.append(chk(
            "perf.third_party", C, "Third-party hosts", len(third_hosts) <= 8,
            f"{len(third_hosts)} third-party host(s)" + (": " + ", ".join(third_hosts[:6]) if third_hosts else "") + ".",
            4, "MEDIUM", title="Audit third-party scripts",
            desc="Every third-party origin costs DNS, TLS and often main-thread time.",
            code="Remove unused tags, self-host critical libraries, load analytics after interaction."))

        # Images
        imgs = p.images
        no_dim = [i for i in imgs if not i["has_dimensions"] and i["src"]]
        checks.append(chk(
            "perf.image_dimensions", C, "Images declare width & height (CLS)", not no_dim,
            f"{len(no_dim)} of {len(imgs)} image(s) lack width/height." + (f" Example: {no_dim[0]['src']}" if no_dim else ""),
            min(8, 2 * len(no_dim)), "LOW",
            title=f"Add width/height to {len(no_dim)} image(s)",
            desc="Missing dimensions cause layout shifts as images load.",
            code='<img src="hero.webp" width="1200" height="630" alt="...">'))
        legacy = [i for i in imgs if re.search(r"\.(png|jpe?g|gif|bmp)(\?|$)", i["src"], re.I)]
        checks.append(chk(
            "perf.image_formats", C, "Modern image formats (WebP / AVIF)", len(legacy) < 3,
            f"{len(legacy)} image(s) use legacy formats.", 3, "LOW",
            title="Serve WebP / AVIF images", desc="Modern formats are typically 25-50 % smaller at equal quality.",
            code='<picture><source type="image/avif" srcset="a.avif"><img src="a.jpg" alt="..."></picture>'))
        lazy_missing = len(imgs) > 4 and not any(i["is_lazy"] for i in imgs)
        checks.append(chk(
            "perf.lazy_loading", C, "Below-the-fold images lazy-loaded", not lazy_missing,
            f"{len(imgs)} images, none use loading=\"lazy\".", 3, "LOW",
            title="Lazy-load offscreen images", desc="Deferring offscreen images saves bandwidth on first load.",
            code='<img loading="lazy" decoding="async" ...>'))
        if desktop:
            over = int((desktop.get("images") or {}).get("oversized", 0))
            checks.append(chk(
                "perf.image_oversized", C, "Images sized to their display size", over == 0,
                f"{over} image(s) are more than 2x larger than their rendered size.", min(8, 2 * over), "LOW",
                title=f"Resize {over} oversized image(s)", desc="Serve responsive images with srcset/sizes.",
                code='<img srcset="s.jpg 480w, m.jpg 960w, l.jpg 1600w" sizes="(max-width: 600px) 480px, 960px">'))

        # HTTP protocol
        if desktop:
            proto = (desktop.get("network") or {}).get("protocol", "")
            extra["protocol"] = proto
            checks.append(chk(
                "perf.http_protocol", C, "Modern HTTP protocol (h2 / h3)", proto != "http/1.1",
                f"Negotiated protocol: {proto or 'unknown'}.", 4, "LOW",
                title="Enable HTTP/2 or HTTP/3", desc="HTTP/1.1 limits parallel downloads.",
                code="listen 443 ssl http2;"))

        # Measured Core Web Vitals
        vitals: Dict[str, Any] = {}

        def vital_entry(key: str, unit: str, target: str, d_val, m_val, good, poor, pen_warn, pen_fail, label,
                        title, desc, code, scale=1.0):
            scored = m_val if m_val is not None else d_val
            entry = {"unit": unit, "target": target, "desktop": d_val, "mobile": m_val, "source": "measured" if scored is not None else "unavailable"}
            if scored is not None:
                entry["value"] = scored
                entry["rating"] = _rate(scored, good, poor)
                checks.append(chk(
                    f"perf.{key}", C, label, scored <= good,
                    f"{label}: {scored}{unit} on {'mobile (throttled)' if m_val is not None else 'desktop'}. Target: {target}.",
                    pen_fail if scored > poor else pen_warn, "HIGH" if key == "lcp" else "MEDIUM",
                    severe=scored > poor, title=title, desc=desc, code=code))
            else:
                entry["value"] = None
                entry["rating"] = "UNKNOWN"
            vitals[key] = entry

        def sec(v):
            return None if not v else round(v / 1000.0, 2)

        d_vit = (desktop or {}).get("vitals") or {}
        m_vit = (mobile or {}).get("vitals") or {}
        d_tim = (desktop or {}).get("timings") or {}
        m_tim = (mobile or {}).get("timings") or {}
        vital_entry("lcp", "s", "<= 2.5 s", sec(d_vit.get("lcp_ms")), sec(m_vit.get("lcp_ms")), 2.5, 4.0, 8, 14,
                    "Largest Contentful Paint (LCP)", "Improve Largest Contentful Paint",
                    "The main content takes too long to appear. Optimise the LCP element, reduce JS blocking rendering and preload the hero image.",
                    '<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">')
        vital_entry("fcp", "s", "<= 1.8 s", sec(d_tim.get("fcp_ms")), sec(m_tim.get("fcp_ms")), 1.8, 3.0, 4, 8,
                    "First Contentful Paint (FCP)", "Improve First Contentful Paint",
                    "Users see a blank screen for too long. Inline critical CSS and defer non-critical JavaScript.",
                    "Inline above-the-fold CSS; defer analytics and widgets.")
        d_cls = d_vit.get("cls") if desktop else None
        m_cls = m_vit.get("cls") if mobile else None
        vital_entry("cls", "", "<= 0.1", d_cls, m_cls, 0.1, 0.25, 6, 12,
                    "Cumulative Layout Shift (CLS)", "Eliminate layout shifts",
                    "Content jumps while loading. Reserve space for images, ads and embeds, and avoid injecting content above existing content.",
                    "img, video { aspect-ratio: attr(width) / attr(height); }")
        vital_entry("tbt", "ms", "<= 200 ms", d_vit.get("tbt_ms") if desktop else None,
                    m_vit.get("tbt_ms") if mobile else None, 200, 600, 6, 12,
                    "Total Blocking Time (TBT, INP proxy)", "Reduce main-thread blocking time",
                    "Long JavaScript tasks make the page unresponsive. Split bundles and defer heavy work.",
                    "Break long tasks with scheduler.yield() / requestIdleCallback; code-split routes.")

        if not (desktop or mobile):
            # Transparent model-based estimate, clearly labelled and NEVER penalised.
            crit = int(root_probe.get("transfer_bytes", 0) or 0) + sum(
                a["transfer_bytes"] for a in assets if a["type"] in ("css", "js"))
            est_lcp = round(ttfb / 1000.0 + 0.2 + crit / (640 * 1024.0) + 0.1 * min(6, len(blocking) + len(blocking_css)), 2)
            vitals["lcp"] = {"value": est_lcp, "unit": "s", "target": "<= 2.5 s", "desktop": None, "mobile": None,
                             "source": "estimated", "rating": _rate(est_lcp, 2.5, 4.0),
                             "note": "Network model (TTFB + critical bytes at ~5 Mbps). Not penalised."}
            vitals["ttfb"] = {"value": round(ttfb / 1000.0, 2), "unit": "s", "target": "<= 0.6 s", "desktop": None, "mobile": None,
                              "source": "measured", "rating": _rate(ttfb, 600, 1200)}
        if desktop or mobile:
            vitals["ttfb"] = {"value": round(ttfb / 1000.0, 2), "unit": "s", "target": "<= 0.6 s",
                              "desktop": sec(d_tim.get("ttfb_ms")), "mobile": sec(m_tim.get("ttfb_ms")),
                              "source": "measured", "rating": _rate(ttfb, 600, 1200)}
            nodes = int(((desktop or mobile) or {}).get("dom", {}).get("nodes", 0))
            extra["dom_nodes"] = nodes
            checks.append(chk(
                "perf.dom_size", C, "DOM size", nodes <= 1500,
                f"{nodes} DOM nodes. Target: under 1,500.", 8 if nodes > 3000 else 4, "MEDIUM",
                severe=nodes > 3000, title="Reduce DOM size",
                desc="Large DOMs slow style calculation, layout and memory use.",
                code="Virtualise long lists and lazy-render offscreen sections."))
        extra["vitals"] = vitals
        return checks, extra

    # ---------------------------------------------------------------------------
    # SEO
    # ---------------------------------------------------------------------------
    def _seo_page_checks(self, p: PageParser, url: str, reliable: bool, status_code: int = 200,
                         words: Optional[int] = None) -> List[Dict[str, Any]]:
        C = "SEO"
        checks: List[Dict[str, Any]] = []
        words = p.word_count if words is None else words
        title = p.title_tag.strip()
        tl = len(title)

        checks.append(chk(
            "seo.title", C, "Title tag", bool(title) and 30 <= tl <= 65,
            f"Title: \"{title[:80]}\" ({tl} chars)." if title else "No <title> tag found.",
            15 if not title else 5, "LOW", severe=not title,
            title="Write a unique, descriptive <title> (30-60 chars)",
            desc="Titles are the strongest on-page ranking signal and the headline of your search listing.",
            code="<title>Primary Keyword - Brand | Short Value Proposition</title>"))
        dl = len(p.meta_description.strip())
        checks.append(chk(
            "seo.description", C, "Meta description", 70 <= dl <= 170,
            f"Meta description is {dl} chars (ideal 120-160)." if dl else "No meta description found.",
            12 if dl == 0 else 4, "LOW", severe=dl == 0,
            title="Add a compelling meta description (120-160 chars)",
            desc="A good description raises click-through rate from search results.",
            code='<meta name="description" content="A clear 140-160 character summary with the main keyword and a call to action.">'))
        h1 = p.headings["h1"]
        checks.append(chk(
            "seo.h1", C, "Single <h1> heading", len(h1) == 1,
            f"{len(h1)} <h1> heading(s) found." + (f" \"{h1[0][:70]}\"" if h1 else ""),
            10 if not h1 else 4, "LOW", severe=not h1, reliable=reliable,
            title="Use exactly one <h1> per page", desc="The H1 states the main topic of the page to users and crawlers.",
            code="<h1>Primary topic of this page</h1>"))
        skipped = False
        prev = 0
        for lvl, _ in p.heading_sequence:
            if prev and lvl > prev + 1:
                skipped = True
                break
            prev = lvl
        checks.append(chk(
            "seo.heading_order", C, "Logical heading hierarchy", not skipped,
            "Heading levels are sequential." if not skipped else "Heading levels skip (e.g. h2 -> h4).",
            3, "LOW", reliable=reliable, title="Fix heading hierarchy",
            desc="Skipped levels confuse screen readers and weaken document structure.",
            code="Use h1 > h2 > h3 without skipping levels."))
        robots_meta = p.meta_robots.lower()
        noindex = "noindex" in robots_meta
        checks.append(chk(
            "seo.noindex", C, "Page is indexable", not noindex,
            f"robots meta: {p.meta_robots or 'not set (indexable)'}.", 20, "LOW", severe=True,
            title="Remove noindex from pages that should rank",
            desc="A noindex directive removes the page from search results.",
            code='<meta name="robots" content="index, follow">'))
        canon_ok = bool(p.canonical_url)
        checks.append(chk(
            "seo.canonical", C, "Canonical URL", canon_ok,
            f"Canonical: {p.canonical_url}" if canon_ok else "No canonical link found.", 6, "LOW",
            title="Declare a canonical URL", desc="Prevents duplicate-content dilution across URL variants.",
            code=f'<link rel="canonical" href="{url}">'))
        real_imgs = [i for i in p.images if i["src"]]
        missing_alt = [i for i in real_imgs if not i["has_alt_attr"]]
        checks.append(chk(
            "seo.image_alt", C, "Image alt text", not missing_alt,
            f"{len(missing_alt)} of {len(real_imgs)} image(s) have no alt attribute."
            + (f" Example: {missing_alt[0]['src']}" if missing_alt else ""),
            min(8, 2 * len(missing_alt)), "LOW", reliable=reliable,
            title=f"Add alt text to {len(missing_alt)} image(s)",
            desc="Alt text powers image search and is required for accessibility.",
            code='<img src="team.jpg" alt="Our security team reviewing an audit report">'))
        checks.append(chk(
            "seo.content_depth", C, "Sufficient page content", words >= 150,
            f"{words} visible words.", 5, "HIGH", reliable=reliable, title="Add substantive content",
            desc="Thin pages rarely rank. Aim for at least 300 words of useful, original content.",
            code="Expand copy with benefits, FAQs and supporting detail."))
        if status_code >= 400:
            checks.append(chk(
                "seo.http_status", C, "Page returns a healthy status", False,
                f"HTTP {status_code} returned.", 15 if status_code >= 500 else 10, "MEDIUM", severe=True,
                title="Fix broken page", desc="Broken pages waste crawl budget and frustrate users.",
                code="Repair the route or 301-redirect it to the closest equivalent page."))
        return checks

    def _seo_checks(self, p: PageParser, static_p: PageParser, url: str, rendering: Dict[str, Any],
                    robots: Dict[str, Any], sitemap: Dict[str, Any], soft404: Dict[str, Any],
                    reliable: bool, is_root: bool) -> List[Dict[str, Any]]:
        C = "SEO"
        checks = self._seo_page_checks(p, url, reliable, 200)
        # HTTPS
        https = url.lower().startswith("https://")
        checks.append(chk("seo.https", C, "Served over HTTPS", https, "Final URL scheme is " + url.split(":")[0] + ".",
                          10, "MEDIUM", severe=True, title="Serve the site over HTTPS",
                          desc="HTTPS is a ranking signal and required by modern browsers.",
                          code="Install a TLS certificate and 301-redirect all HTTP traffic to HTTPS."))
        # SPA / JS rendering
        if rendering["mode"] == "CLIENT_SIDE_SPA":
            checks.append(chk(
                "seo.js_rendering", C, "Content visible without JavaScript", False,
                f"The HTML shell contains {rendering['static_word_count']} words; content is created by JavaScript "
                f"({rendering.get('framework_hint') or 'SPA'}). Many crawlers and social bots do not execute JS.",
                6, "HIGH", title="Pre-render or server-render public pages",
                desc="Client-only rendering delays indexing and breaks social previews.",
                code="Use SSR/SSG (Next.js, Nuxt, Astro) or a pre-render service such as Prerender.io / vite-plugin-prerender."))
        # Social tags are judged on the *static* HTML because social crawlers do not run JS
        og = static_p.og_tags
        og_ok = bool(og.get("og:title") and og.get("og:description") and og.get("og:image"))
        rendered_only = (not og_ok) and bool(p.og_tags.get("og:title"))
        checks.append(chk(
            "seo.open_graph", C, "OpenGraph social tags (static HTML)", og_ok,
            ("OpenGraph tags exist only after JavaScript runs - social crawlers will not see them."
             if rendered_only else
             "Present: " + (", ".join(sorted(og)) or "none") + ". Needs og:title, og:description, og:image."),
            6, "LOW", title="Add OpenGraph tags to the static HTML",
            desc="Without them, links shared on LinkedIn, Slack, WhatsApp and X show no preview card.",
            code='<meta property="og:title" content="Page title">\n<meta property="og:description" content="Summary">\n'
                 '<meta property="og:image" content="https://example.com/social.png">\n<meta property="og:type" content="website">'))
        tw = static_p.twitter_tags
        checks.append(chk(
            "seo.twitter_card", C, "Twitter / X card", bool(tw.get("twitter:card")),
            "twitter:card is set." if tw.get("twitter:card") else "No twitter:card tag.", 3, "LOW",
            title="Add a Twitter card", desc="Controls how your page looks when shared on X.",
            code='<meta name="twitter:card" content="summary_large_image">'))
        # Structured data
        valid_ld, invalid_ld = 0, 0
        for blob in p.ld_blocks:
            try:
                json.loads(blob)
                valid_ld += 1
            except Exception:
                invalid_ld += 1
        has_schema = valid_ld > 0 or p.itemscope
        checks.append(chk(
            "seo.structured_data", C, "Structured data (JSON-LD)", has_schema and invalid_ld == 0,
            f"{valid_ld} valid JSON-LD block(s), {invalid_ld} invalid." if (valid_ld or invalid_ld)
            else "No schema.org structured data.",
            5 if invalid_ld else 3, "MEDIUM", severe=bool(invalid_ld),
            title="Add valid schema.org JSON-LD",
            desc="Structured data enables rich results (organisation, FAQ, breadcrumbs, products).",
            code='<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Organization",'
                 f'"name":"Your Brand","url":"{self._origin()}"}}\n</script>'))
        # robots / sitemap
        checks.append(chk(
            "seo.robots_txt", C, "robots.txt", bool(robots.get("valid")) and not robots.get("blocks_all"),
            ("robots.txt blocks all crawlers (Disallow: /)." if robots.get("blocks_all") else
             "Valid robots.txt found." if robots.get("valid") else "No valid robots.txt (missing or HTML fallback)."),
            20 if robots.get("blocks_all") else 4, "LOW", severe=bool(robots.get("blocks_all")),
            title="Publish a valid robots.txt",
            desc="robots.txt guides crawlers and advertises your sitemap.",
            code=f"User-agent: *\nAllow: /\nSitemap: {self._origin()}/sitemap.xml"))
        checks.append(chk(
            "seo.sitemap", C, "XML sitemap", bool(sitemap.get("valid")),
            f"Sitemap with {sitemap.get('url_count', 0)} URL(s) at {sitemap.get('url', '')}." if sitemap.get("valid")
            else "No valid sitemap.xml found.", 5, "LOW",
            title="Publish /sitemap.xml", desc="Sitemaps help search engines discover every route quickly.",
            code=f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>{self._origin()}/</loc></url>\n</urlset>'))
        if soft404.get("checked"):
            soft = bool(soft404.get("returns_200_for_missing"))
            checks.append(chk(
                "seo.soft_404", C, "Unknown URLs return 404", not soft,
                ("Unknown URLs return HTTP 200 with the homepage shell (soft-404)." if soft404.get("serves_homepage_shell")
                 else "Unknown URLs return HTTP 200.") if soft else f"Unknown URLs correctly return HTTP {soft404.get('status')}.",
                2, "MEDIUM", info=False, title="Return real 404 pages",
                desc="Soft-404s dilute crawl budget. For SPAs, add a server rule returning 404 for unknown routes.",
                code="# vercel.json: use a catch-all that returns your styled NotFound page with status 404"))
        return checks

    # ---------------------------------------------------------------------------
    # UI / UX / ACCESSIBILITY
    # ---------------------------------------------------------------------------
    def _ux_page_checks(self, p: PageParser, static_p: PageParser, reliable: bool,
                        bpage: Optional[Dict[str, Any]], mobile: Optional[Dict[str, Any]],
                        is_root: bool) -> List[Dict[str, Any]]:
        C = "UI/UX"
        checks: List[Dict[str, Any]] = []
        vp = (static_p.meta_viewport or p.meta_viewport or "").lower()
        checks.append(chk(
            "ux.viewport", C, "Responsive viewport meta", "width=device-width" in vp,
            f"viewport: {vp or 'missing'}.", 20, "LOW", severe=True,
            title="Add the responsive viewport meta tag",
            desc="Without it mobile browsers render a zoomed-out desktop layout.",
            code='<meta name="viewport" content="width=device-width, initial-scale=1">'))
        zoom_blocked = bool(re.search(r"user-scalable\s*=\s*(no|0)", vp)) or bool(
            re.search(r"maximum-scale\s*=\s*(0?\.\d+|1(\.0+)?)\b", vp))
        checks.append(chk(
            "ux.zoom", C, "Pinch-zoom is allowed (WCAG 1.4.4)", not zoom_blocked,
            "Zoom restrictions found in the viewport tag." if zoom_blocked else "Users can zoom.", 8, "LOW",
            title="Allow users to zoom", desc="Disabling zoom harms low-vision users.",
            code='<meta name="viewport" content="width=device-width, initial-scale=1">'))
        checks.append(chk(
            "ux.lang", C, "Document language (WCAG 3.1.1)", bool((static_p.html_lang or p.html_lang).strip()),
            f"html lang=\"{static_p.html_lang or p.html_lang or ''}\".", 8, "LOW",
            title='Set <html lang="en">', desc="Screen readers need the language to pronounce content correctly.",
            code='<html lang="en">'))
        st = p.semantic_tags
        checks.append(chk(
            "ux.main_landmark", C, "<main> landmark", st["main"] > 0,
            f"Landmarks: " + ", ".join(f"{k}={v}" for k, v in st.items() if v) if any(st.values()) else "No semantic landmarks.",
            5, "LOW", reliable=reliable, title="Wrap primary content in <main>",
            desc="Landmarks let assistive-technology users jump to content.",
            code="<header>…</header>\n<nav>…</nav>\n<main id=\"content\">…</main>\n<footer>…</footer>"))
        unl = p.unlabeled_inputs()
        checks.append(chk(
            "ux.form_labels", C, "Form fields have labels (WCAG 1.3.1)", not unl,
            f"{len(unl)} of {len(p.form_inputs)} field(s) have no accessible label.", min(12, 4 * len(unl)), "LOW",
            severe=len(unl) >= 3, reliable=reliable, title=f"Label {len(unl)} form field(s)",
            desc="Placeholders are not labels. Every control needs a visible <label> or aria-label.",
            code='<label for="email">Email</label>\n<input id="email" type="email" autocomplete="email">'))
        nameless_btn = [b for b in p.buttons if not b["name"]]
        checks.append(chk(
            "ux.button_names", C, "Buttons have accessible names (WCAG 4.1.2)", not nameless_btn,
            f"{len(nameless_btn)} of {len(p.buttons)} button(s) have no accessible name.",
            min(10, 3 * len(nameless_btn)), "LOW", severe=len(nameless_btn) >= 3, reliable=reliable,
            title=f"Name {len(nameless_btn)} icon button(s)",
            desc="Icon-only buttons are announced as just \"button\" to screen readers.",
            code='<button aria-label="Close dialog"><svg …/></button>'))
        real_links = [l for l in p.links if l["href"] and not l["href"].lower().startswith(("javascript:",))]
        nameless_links = [l for l in real_links if not l["name"]]
        checks.append(chk(
            "ux.link_names", C, "Links have discernible text (WCAG 2.4.4)", not nameless_links,
            f"{len(nameless_links)} of {len(real_links)} link(s) have no accessible name.",
            min(10, 3 * len(nameless_links)), "LOW", severe=len(nameless_links) >= 3, reliable=reliable,
            title=f"Name {len(nameless_links)} link(s)", desc="Image- or icon-only links need an aria-label.",
            code='<a href="/home" aria-label="Go to homepage"><img src="logo.svg" alt=""></a>'))
        vague = [l for l in real_links if l["text"].lower().strip(" .") in VAGUE_LINK_TEXT]
        checks.append(chk(
            "ux.vague_links", C, "Descriptive link text", not vague,
            f"{len(vague)} link(s) use vague text such as \"click here\" / \"read more\".", min(6, 2 * len(vague)), "LOW",
            reliable=reliable, title="Rewrite vague link text",
            desc="Link text should make sense out of context.",
            code='<a href="/pricing">View audit pricing plans</a>'))
        nameless_iframes = [f for f in p.iframes if not f["title"]]
        if p.iframes:
            checks.append(chk(
                "ux.iframe_title", C, "Iframes have titles", not nameless_iframes,
                f"{len(nameless_iframes)} of {len(p.iframes)} iframe(s) have no title.", 3, "LOW",
                title="Add title attributes to iframes", desc="Required for accessible embedded content.",
                code='<iframe title="Product demo video" src="…"></iframe>'))
        checks.append(chk(
            "ux.tabindex", C, "No positive tabindex", p.positive_tabindex == 0,
            f"{p.positive_tabindex} element(s) use tabindex > 0.", 2, "LOW",
            title="Remove positive tabindex values", desc="Positive tabindex breaks natural keyboard order.",
            code='tabindex="0" (or remove it)'))
        if is_root:
            has_icon = bool(static_p.icon_links)
            checks.append(chk(
                "ux.favicon", C, "Favicon declared", has_icon,
                "Favicon link found." if has_icon else "No <link rel=\"icon\"> found.", 2, "LOW",
                title="Add a favicon", desc="Favicons build trust and appear in tabs, bookmarks and search results.",
                code='<link rel="icon" href="/favicon.svg" type="image/svg+xml">'))
            checks.append(chk(
                "ux.skip_link", C, "Skip-to-content link", st["nav"] == 0 or p.has_skip_link or not reliable,
                "Keyboard users have a skip link." if p.has_skip_link else "No skip-to-content link.", 2, "LOW",
                title="Add a skip link", desc="Lets keyboard users bypass repeated navigation (WCAG 2.4.1).",
                code='<a class="skip-link" href="#content">Skip to main content</a>'))
            checks.append(chk(
                "ux.theme_color", C, "Mobile browser theme colour", bool(static_p.meta_theme_color) or bool(static_p.manifest),
                "theme-color / web manifest present." if (static_p.meta_theme_color or static_p.manifest) else
                "No theme-color meta or manifest.", 0, "LOW", info=True,
                title="Add theme-color and a web manifest", desc="Polishes the mobile browser chrome and enables installability.",
                code='<meta name="theme-color" content="#0b5fff">\n<link rel="manifest" href="/manifest.webmanifest">'))

        # Browser-measured checks
        src = bpage or None
        if src:
            lay = src.get("layout") or {}
            checks.append(chk(
                "ux.desktop_overflow", C, "No horizontal scroll (desktop)", not lay.get("horizontal_overflow"),
                f"Scroll width {lay.get('scroll_width')} px vs viewport {lay.get('viewport_width')} px.", 6, "MEDIUM",
                title="Fix horizontal overflow", desc="Content wider than the viewport forces sideways scrolling.",
                code="html, body { overflow-x: clip; } img, video { max-width: 100%; height: auto; }"))
            checks.extend(self._runtime_checks(src, C, "desktop"))
        if mobile and is_root:
            lay = mobile.get("layout") or {}
            checks.append(chk(
                "ux.mobile_overflow", C, "No horizontal scroll on mobile (390 px)", not lay.get("horizontal_overflow"),
                f"Scroll width {lay.get('scroll_width')} px vs viewport {lay.get('viewport_width')} px.", 12, "MEDIUM",
                severe=True, title="Fix mobile horizontal overflow",
                desc="The layout breaks on phones. Find elements wider than 100vw (fixed widths, wide tables, long words).",
                code="* { min-width: 0; } .container { width: min(100%, 1200px); } table { display: block; overflow-x: auto; }"))
            small = int(lay.get("small_tap_targets", 0))
            checks.append(chk(
                "ux.tap_targets", C, "Touch targets at least 24x24 px (WCAG 2.5.8)", small <= 3,
                f"{small} of {lay.get('interactive_elements', 0)} interactive element(s) are smaller than 24 px."
                + (f" e.g. {', '.join(lay.get('small_tap_target_samples', [])[:3])}" if small else ""),
                8 if small > 15 else 4, "LOW", severe=small > 15,
                title=f"Enlarge {small} small touch target(s)",
                desc="Small targets are hard to tap. Aim for 44x44 px.",
                code="button, a { min-height: 44px; min-width: 44px; padding: 10px 14px; }"))
            tiny = int(lay.get("tiny_text_elements", 0))
            checks.append(chk(
                "ux.tiny_text", C, "Readable text size (>= 12 px)", tiny <= 8,
                f"{tiny} text element(s) are smaller than 12 px.", 4, "LOW",
                title="Increase small text", desc="Text below 12 px is hard to read on mobile.",
                code="body { font-size: 16px; } small, .caption { font-size: 13px; }"))
            checks.extend(self._contrast_check(lay, C))
            checks.extend(self._runtime_checks(mobile, C, "mobile", skip_images=True))
        elif src:
            checks.extend(self._contrast_check(src.get("layout") or {}, C))
        return checks

    def _contrast_check(self, lay: Dict[str, Any], C: str) -> List[Dict[str, Any]]:
        n = int(lay.get("low_contrast_elements", 0))
        samples = lay.get("low_contrast_samples", [])
        return [chk(
            "ux.contrast", C, "Colour contrast (WCAG 1.4.3 AA)", n == 0,
            f"{n} text element(s) fail the 4.5:1 contrast minimum." + (f" e.g. {samples[0]}" if samples else ""),
            min(10, 2 + n // 3), "LOW", severe=n > 10,
            title=f"Fix {n} low-contrast text element(s)",
            desc="Insufficient contrast makes text unreadable for many users, especially outdoors.",
            code="/* aim for >= 4.5:1 (3:1 for large text) */\n.muted { color: #4b5563; } /* on #fff = 7.5:1 */")]

    def _runtime_checks(self, d: Dict[str, Any], C: str, label: str, skip_images: bool = False) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        ce = d.get("console_errors") or []
        pe = d.get("page_errors") or []
        fr = d.get("failed_requests") or []
        if label == "desktop":
            out.append(chk(
                "ux.console_errors", C, "No console errors", not ce,
                f"{len(ce)} console error(s)." + (f" First: {ce[0][:110]}" if ce else ""), min(6, 2 * len(ce)), "MEDIUM",
                title="Resolve console errors", desc="Runtime errors usually mean broken features for real users.",
                code="Open DevTools > Console and fix the listed errors."))
            out.append(chk(
                "ux.js_exceptions", C, "No uncaught exceptions", not pe,
                f"{len(pe)} uncaught exception(s)." + (f" First: {pe[0][:110]}" if pe else ""), 6, "MEDIUM", severe=True,
                title="Fix uncaught JavaScript exceptions", desc="Uncaught exceptions can break entire pages.",
                code="Wrap risky code in error boundaries / try-catch and monitor with Sentry."))
            out.append(chk(
                "ux.failed_requests", C, "No failed network requests", not fr,
                f"{len(fr)} request(s) failed." + (f" First: {fr[0][:110]}" if fr else ""), min(6, 2 * len(fr)), "MEDIUM",
                title="Fix failed requests", desc="Failed requests mean missing assets or API errors.",
                code="Check the Network tab for 4xx/5xx and CORS failures."))
            if not skip_images:
                broken = int((d.get("images") or {}).get("broken", 0))
                out.append(chk(
                    "ux.broken_images", C, "No broken images", broken == 0,
                    f"{broken} image(s) failed to load.", min(8, 3 * broken), "LOW",
                    title=f"Fix {broken} broken image(s)", desc="Broken images look unprofessional and hurt trust.",
                    code="Verify the image URLs and add an onerror fallback."))
        return out

    def _ux_checks(self, p: PageParser, static_p: PageParser, url: str, desktop: Optional[Dict],
                   mobile: Optional[Dict], reliable: bool, is_root: bool, rendering: Dict[str, Any]) -> List[Dict[str, Any]]:
        return self._ux_page_checks(p, static_p, reliable, desktop, mobile, is_root)

    # ---------------------------------------------------------------------------
    # PAGE MATRIX
    # ---------------------------------------------------------------------------
    def _build_matrix(self, root_url: str, root_html: str, root_probe: Dict[str, Any], static_p: PageParser,
                      content_p: PageParser, seo_checks: List[Dict[str, Any]], ux_checks: List[Dict[str, Any]],
                      desktop: Optional[Dict], crawled: List[Dict[str, Any]], sitemap: Dict[str, Any],
                      browser_pages: Dict[str, Dict[str, Any]], reliable: bool) -> List[Dict[str, Any]]:
        matrix: List[Dict[str, Any]] = []
        root_key = _key(root_url)

        def issues_of(checks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
            bad = [c for c in checks if c["status"] in ("WARN", "FAIL")]
            bad.sort(key=lambda c: -c["penalty"])
            return [{"id": c["id"], "label": c["label"], "status": c["status"], "impact": c["impact"],
                     "category": c["category"], "detail": c["detail"]} for c in bad[:12]]

        matrix.append({
            "url": root_url, "is_root": True,
            "title": content_p.title_tag.strip() or "Homepage",
            "status_code": (root_probe or {}).get("status") or 200,
            "latency_ms": (root_probe or {}).get("latency_ms", 0.0),
            "page_size_kb": _kb((root_probe or {}).get("transfer_bytes") or len(root_html.encode("utf-8", "ignore"))),
            "word_count": content_p.word_count, "h1": (content_p.headings["h1"] or [""])[0],
            "meta_description_length": len(content_p.meta_description.strip()),
            "canonical": content_p.canonical_url, "indexable": "noindex" not in content_p.meta_robots.lower(),
            "images_missing_alt": sum(1 for i in content_p.images if i["src"] and not i["has_alt_attr"]),
            "seo_score": _score(seo_checks), "ux_score": _score(ux_checks),
            "issues": issues_of(seo_checks + ux_checks),
            "render_mode": "rendered" if content_p is not static_p else "static",
            "lcp_ms": ((desktop or {}).get("vitals") or {}).get("lcp_ms"),
            "load_ms": ((desktop or {}).get("timings") or {}).get("load_ms"),
        })

        # candidate URLs (crawler first, then sitemap)
        seen = {root_key}
        cands: List[Tuple[str, Dict[str, Any]]] = []
        for c in crawled:
            u = urldefrag(c.get("url", ""))[0]
            if self._should_audit(u, seen):
                seen.add(_key(u))
                cands.append((u, c))
        for u in sitemap.get("urls", []):
            u = urldefrag(u)[0]
            if self._should_audit(u, seen):
                seen.add(_key(u))
                cands.append((u, {}))
        for bk, bp in browser_pages.items():
            u = bp.get("final_url") or bp.get("url", "")
            if bk not in seen and self._should_audit(u, seen):
                seen.add(bk)
                cands.append((u, {}))

        for u, crawl_info in cands[: self.MAX_EXTRA_PAGES]:
            try:
                matrix.append(self._audit_extra_page(u, crawl_info, browser_pages.get(_key(u)), reliable))
            except Exception as e:  # noqa: BLE001
                self.errors.append(f"page {u}: {str(e)[:120]}")
        return matrix

    def _should_audit(self, url: str, seen: set) -> bool:
        if not url or not url.lower().startswith(("http://", "https://")) or not self._same_site(url):
            return False
        if _key(url) in seen:
            return False
        return not urlparse(url).path.lower().endswith(NON_HTML_EXT)

    def _audit_extra_page(self, url: str, crawl_info: Dict[str, Any], bpage: Optional[Dict[str, Any]],
                          reliable: bool) -> Dict[str, Any]:
        pr = self._probe(url, "gzip, deflate", decode=True, accept="text/html,application/xhtml+xml,*/*")
        status = pr.get("status") or crawl_info.get("status_code") or 0
        html = (bpage or {}).get("_html") or pr.get("text") or crawl_info.get("html_content") or ""
        static_page = _parse(pr.get("text") or crawl_info.get("html_content") or "", url)
        page = _parse(html, url) if bpage else static_page
        page_reliable = True if bpage else not (static_page.root_ids and static_page.word_count < 60)
        seo = self._seo_page_checks(page, url, page_reliable, status or 200)
        ux = self._ux_page_checks(page, static_page, page_reliable, bpage, None, False)
        bad = sorted([c for c in seo + ux if c["status"] in ("WARN", "FAIL")], key=lambda c: -c["penalty"])
        return {
            "url": url, "is_root": False,
            "title": page.title_tag.strip() or crawl_info.get("title") or "Untitled page",
            "status_code": status,
            "latency_ms": pr.get("latency_ms", 0.0),
            "page_size_kb": _kb(pr.get("transfer_bytes", 0)),
            "word_count": page.word_count, "h1": (page.headings["h1"] or [""])[0],
            "meta_description_length": len(page.meta_description.strip()),
            "canonical": page.canonical_url, "indexable": "noindex" not in page.meta_robots.lower(),
            "images_missing_alt": sum(1 for i in page.images if i["src"] and not i["has_alt_attr"]),
            "seo_score": _score(seo), "ux_score": _score(ux),
            "issues": [{"id": c["id"], "label": c["label"], "status": c["status"], "impact": c["impact"],
                        "category": c["category"], "detail": c["detail"]} for c in bad[:12]],
            "render_mode": "rendered" if bpage else "static",
            "lcp_ms": ((bpage or {}).get("vitals") or {}).get("lcp_ms"),
            "load_ms": ((bpage or {}).get("timings") or {}).get("load_ms"),
        }

    def _cross_page_checks(self, matrix: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        titles: Dict[str, List[str]] = {}
        for pg in matrix:
            t = (pg.get("title") or "").strip().lower()
            if t and t not in ("untitled page", "homepage"):
                titles.setdefault(t, []).append(pg["url"])
        dups = {t: urls for t, urls in titles.items() if len(urls) > 1}
        out.append(chk(
            "seo.duplicate_titles", "SEO", "Unique titles across pages", not dups,
            f"{len(dups)} duplicated title(s) across {len(matrix)} pages."
            + (f" e.g. \"{next(iter(dups))[:60]}\"" if dups else ""),
            4, "LOW", title="Give every page a unique title",
            desc="Duplicate titles make pages compete with each other in search.",
            code="Generate titles per route, e.g. `${page} | ${brand}`."))
        broken = [pg for pg in matrix if (pg.get("status_code") or 0) >= 400 or pg.get("status_code") == 0]
        out.append(chk(
            "seo.broken_pages", "SEO", "No broken internal pages", not broken,
            f"{len(broken)} audited page(s) returned an error status." + (f" e.g. {broken[0]['url']}" if broken else ""),
            min(10, 4 * len(broken)), "MEDIUM", severe=bool(broken), title="Fix broken internal pages",
            desc="Broken links waste crawl budget and frustrate visitors.",
            code="Repair or 301-redirect the failing URLs; update internal links."))
        # strip helper field used during construction
        for pg in matrix:
            pg.pop("_checks", None)
        return out

    # ---------------------------------------------------------------------------
    # Optimisations (single prioritised backlog)
    # ---------------------------------------------------------------------------
    def _build_optimizations(self, checks: List[Dict[str, Any]], matrix: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        opts: List[Dict[str, Any]] = []
        issue_pages: Dict[str, List[str]] = {}
        for pg in matrix:
            if pg.get("is_root"):
                continue
            for i in pg.get("issues", []):
                issue_pages.setdefault(i["id"], []).append(pg["url"])
        for c in checks:
            if c["status"] not in ("WARN", "FAIL"):
                continue
            opts.append({
                "id": c["id"], "category": c["category"], "impact": c["impact"], "effort": c["effort"],
                "status": c["status"], "penalty": c["penalty"],
                "title": c["fix"]["title"], "description": c["fix"]["description"], "evidence": c["detail"],
                "remediation": c["fix"]["remediation"], "affected_pages": issue_pages.get(c["id"], [])[:8],
            })
        covered = {o["id"] for o in opts}
        label_map: Dict[str, Dict[str, Any]] = {}
        for pg in matrix:
            for i in pg.get("issues", []):
                label_map.setdefault(i["id"], i)
        for cid, urls in issue_pages.items():
            if cid in covered:
                continue
            i = label_map.get(cid, {})
            opts.append({
                "id": cid, "category": i.get("category", "SEO"), "impact": i.get("impact", "LOW"), "effort": "LOW",
                "status": i.get("status", "WARN"), "penalty": 0,
                "title": f"{i.get('label', cid)} (on {len(urls)} other page(s))",
                "description": i.get("detail", ""), "evidence": i.get("detail", ""),
                "remediation": "Apply the same fix used for the homepage to each affected route.",
                "affected_pages": urls[:8],
            })
        rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "NONE": 3}
        opts.sort(key=lambda o: (rank.get(o["impact"], 3), -o.get("penalty", 0)))
        return opts

    # ---------------------------------------------------------------------------
    # Section builders (keep legacy keys so older UI code keeps working)
    # ---------------------------------------------------------------------------
    def _perf_section(self, score, checks, extra, p, root_probe, root_elapsed_ms, assets, desktop, mobile,
                      rendering, optimizations) -> Dict[str, Any]:
        by_type: Dict[str, Dict[str, int]] = {}
        if desktop and (desktop.get("network") or {}).get("by_type"):
            by_type = {k: {"count": int(v.get("count", 0)), "bytes": int(v.get("bytes", 0))}
                       for k, v in desktop["network"]["by_type"].items()}
        else:
            for a in assets:
                t = by_type.setdefault(a["type"], {"count": 0, "bytes": 0})
                t["count"] += 1
                t["bytes"] += int(a.get("transfer_bytes", 0))
        enc = (root_probe or {}).get("encoding", "") or "none"
        return {
            "score": score,
            "ttfb_ms": extra.get("ttfb_ms", root_elapsed_ms),
            "ttfb_source": extra.get("ttfb_source", ""),
            "page_size_kb": _kb(extra.get("total_transfer_bytes", 0)),
            "document_size_kb": _kb((root_probe or {}).get("decoded_bytes") or (root_probe or {}).get("transfer_bytes")),
            "compression_enabled": any(x in enc for x in ("gzip", "br", "deflate", "zstd")),
            "compression_type": enc,
            "cache_control": (root_probe or {}).get("cache_control") or "not specified",
            "render_blocking_scripts_count": sum(1 for s in p.scripts if s.get("in_head") and s.get("src")
                                                 and not (s["is_async"] or s["is_defer"] or s["is_module"])),
            "asset_breakdown": {
                "html_bytes": (root_probe or {}).get("decoded_bytes") or 0,
                "scripts_count": len(p.scripts), "stylesheets_count": len(p.stylesheets), "images_count": len(p.images),
                "inline_script_kb": _kb(p.inline_script_bytes), "inline_style_kb": _kb(p.inline_style_bytes),
            },
            "core_web_vitals": extra.get("vitals", {}),
            "page_weight": {"total_bytes": extra.get("total_transfer_bytes", 0), "js_bytes": extra.get("js_transfer_bytes", 0),
                            "requests": extra.get("request_count", 0), "by_type": by_type,
                            "source": extra.get("weight_source", "")},
            "third_party": {"count": len(extra.get("third_party_hosts", [])), "hosts": extra.get("third_party_hosts", [])[:12]},
            "protocol": extra.get("protocol", ""),
            "dom_nodes": extra.get("dom_nodes"),
            "assets": assets,
            "checks": checks,
            "optimizations": [o for o in optimizations if o["category"] == "Performance"],
        }

    def _seo_section(self, score, checks, p: PageParser, static_p: PageParser, robots, sitemap, soft404,
                     optimizations) -> Dict[str, Any]:
        title = p.title_tag.strip()
        desc = p.meta_description.strip()
        og = static_p.og_tags
        real_imgs = [i for i in p.images if i["src"]]
        missing_alt = [i for i in real_imgs if not i["has_alt_attr"]]
        h1 = p.headings["h1"]

        def title_status():
            if not title:
                return "MISSING"
            return "TOO_SHORT" if len(title) < 30 else ("TOO_LONG" if len(title) > 65 else "OPTIMAL")

        def desc_status():
            if not desc:
                return "MISSING"
            return "TOO_SHORT" if len(desc) < 70 else ("TOO_LONG" if len(desc) > 170 else "OPTIMAL")
        valid_ld = 0
        for blob in p.ld_blocks:
            try:
                json.loads(blob)
                valid_ld += 1
            except Exception:
                pass
        return {
            "score": score,
            "title": {"text": title, "length": len(title), "status": title_status()},
            "meta_description": {"text": desc, "length": len(desc), "status": desc_status()},
            "canonical_url": {"url": p.canonical_url or "None", "present": bool(p.canonical_url)},
            "open_graph": {
                "has_og_title": bool(og.get("og:title")), "has_og_description": bool(og.get("og:description")),
                "has_og_image": bool(og.get("og:image")), "og_title": og.get("og:title", ""),
                "og_description": og.get("og:description", ""), "og_image": og.get("og:image", ""),
                "is_complete": bool(og.get("og:title") and og.get("og:description") and og.get("og:image")),
                "in_rendered_only": bool(p.og_tags.get("og:title")) and not og.get("og:title"),
            },
            "twitter": {"card": static_p.twitter_tags.get("twitter:card", ""), "tags": static_p.twitter_tags},
            "headings": {
                "h1_count": len(h1), "h2_count": len(p.headings["h2"]), "h3_count": len(p.headings["h3"]),
                "status": "MISSING_H1" if not h1 else ("MULTIPLE_H1" if len(h1) > 1 else "OPTIMAL"),
                "h1_text": h1[0] if h1 else "None",
                "outline": [{"level": l, "text": t[:90]} for l, t in p.heading_sequence[:30]],
            },
            "images_alt": {
                "total_images": len(real_imgs), "images_with_alt": len(real_imgs) - len(missing_alt),
                "images_missing_alt": len(missing_alt),
                "compliance_pct": round((len(real_imgs) - len(missing_alt)) / len(real_imgs) * 100, 1) if real_imgs else 100.0,
                "missing_samples": [i["src"] for i in missing_alt[:3]],
            },
            "structured_data": {"has_json_ld": valid_ld > 0, "blocks_count": len(p.ld_blocks), "valid_blocks": valid_ld},
            "robots_txt": robots,
            "sitemap": dict({k: v for k, v in sitemap.items() if k != "urls"}, sample_urls=sitemap.get("urls", [])[:6]),
            "soft_404": soft404,
            "robots_meta": p.meta_robots or "index, follow (default)",
            "word_count": p.word_count,
            "checks": checks,
            "optimizations": [o for o in optimizations if o["category"] == "SEO"],
        }

    def _ux_section(self, score, checks, p: PageParser, desktop, mobile, rendering, optimizations) -> Dict[str, Any]:
        vp = p.meta_viewport.lower()
        mob_lay = (mobile or {}).get("layout") or {}
        unl = p.unlabeled_inputs()
        vague = [l for l in p.links if l["text"].lower().strip(" .") in VAGUE_LINK_TEXT]
        return {
            "score": score,
            "mobile_viewport": {"present": bool(p.meta_viewport), "is_responsive": "width=device-width" in vp,
                                "content": p.meta_viewport or "None"},
            "html_lang": p.html_lang or "None",
            "semantic_structure": {"tags_breakdown": p.semantic_tags, "total_semantic_tags": sum(p.semantic_tags.values()),
                                   "has_landmarks": any(p.semantic_tags.values())},
            "accessibility_wcag": {
                "form_inputs_count": len(p.form_inputs), "unlabeled_inputs_count": len(unl),
                "vague_anchors_count": len(vague),
                "buttons_without_name": sum(1 for b in p.buttons if not b["name"]),
                "links_without_name": sum(1 for l in p.links if l["href"] and not l["name"]),
                "has_skip_link": p.has_skip_link,
            },
            "responsive": {
                "measured": bool(mobile),
                "mobile_horizontal_overflow": mob_lay.get("horizontal_overflow"),
                "small_tap_targets": mob_lay.get("small_tap_targets"),
                "interactive_elements": mob_lay.get("interactive_elements"),
                "tiny_text_elements": mob_lay.get("tiny_text_elements"),
                "low_contrast_elements": mob_lay.get("low_contrast_elements"),
                "low_contrast_samples": mob_lay.get("low_contrast_samples", []),
                "small_tap_target_samples": mob_lay.get("small_tap_target_samples", []),
            },
            "typography": {"estimated_word_count": p.word_count,
                           "readability_rating": "Optimal" if p.word_count > 250 else "Minimal Content"},
            "rendering": rendering,
            "checks": checks,
            "optimizations": [o for o in optimizations if o["category"] == "UI/UX"],
        }

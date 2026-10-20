"""
Headless Browser Metrics Collector (Optional, Real-User-Style Measurements)
===========================================================================
Uses Playwright (if installed) to drive a locally installed Chromium-based browser
(Microsoft Edge or Google Chrome -- no browser download required on Windows) and
collects *measured* frontend quality data instead of heuristics:

  * Core Web Vitals: LCP, CLS, FCP, TBT (INP proxy), TTFB, load timings
  * Network: request count, transferred bytes by type, HTTP protocol, third-party hosts
  * Rendered DOM (so JavaScript-rendered SPAs are audited correctly)
  * Mobile layout: horizontal overflow, tap-target size, tiny text, colour contrast
  * Runtime health: console errors, uncaught exceptions, failed requests, broken images
  * Extra internal pages (rendered) for the multi-page matrix

If Playwright or a browser is unavailable the collector returns
``{"available": False, "reason": ...}`` and the audit transparently falls back to
static analysis. Nothing in this module ever raises to the caller.

Install (one-time):   pip install playwright
Disable at runtime:   set NEXENTRA_BROWSER_AUDIT=0
"""

import ipaddress
import logging
import os
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urldefrag, urlparse

logger = logging.getLogger("DefensiveAudit.BrowserMetrics")

MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 DefensiveSecurityAudit/1.0"
)
DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 DefensiveSecurityAudit/1.0"
)

# Injected before any page script runs on every navigation.
INIT_SCRIPT = r"""
(() => {
  const w = window;
  w.__nx = { lcp: 0, cls: 0, longTasks: [], lcpTag: '' };
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        w.__nx.lcp = e.startTime;
        try { w.__nx.lcpTag = (e.element && e.element.tagName) || ''; } catch (_) {}
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) { if (!e.hadRecentInput) w.__nx.cls += e.value; }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) { w.__nx.longTasks.push(e.duration); }
    }).observe({ type: 'longtask', buffered: true });
  } catch (_) {}
})();
"""

# Evaluated once the page has settled. Returns a JSON-serialisable object.
COLLECT_SCRIPT = r"""
() => {
  const nx = window.__nx || { lcp: 0, cls: 0, longTasks: [] };
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = performance.getEntriesByType('paint');
  const fcpEntry = paints.find(p => p.name === 'first-contentful-paint');
  const resources = performance.getEntriesByType('resource');
  const pageHost = location.hostname;
  const root = pageHost.split('.').slice(-2).join('.');

  const byType = {};
  const thirdParty = {};
  let transfer = 0;
  for (const r of resources) {
    const t = r.initiatorType || 'other';
    byType[t] = byType[t] || { count: 0, bytes: 0 };
    byType[t].count += 1;
    byType[t].bytes += (r.transferSize || 0);
    transfer += (r.transferSize || 0);
    try {
      const h = new URL(r.name).hostname;
      if (h !== pageHost && !h.endsWith('.' + root)) {
        thirdParty[h] = (thirdParty[h] || 0) + 1;
      }
    } catch (_) {}
  }
  transfer += (nav.transferSize || 0);

  const tbt = (nx.longTasks || []).reduce((a, d) => a + Math.max(0, d - 50), 0);
  const vw = window.innerWidth;

  // --- Visible element helpers ---------------------------------------------
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity || '1') > 0.01;
  };
  const label = el => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') ||
               el.getAttribute('alt') || el.getAttribute('name') || '').trim().replace(/\s+/g, ' ');
    return el.tagName.toLowerCase() + (t ? ': ' + t.slice(0, 40) : '');
  };

  // --- Tap targets (WCAG 2.5.8 minimum 24x24 CSS px) -------------------------
  const interactive = Array.from(document.querySelectorAll(
    'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link]'));
  const smallTargets = [];
  let interactiveVisible = 0;
  for (const el of interactive) {
    if (!visible(el)) continue;
    interactiveVisible += 1;
    const r = el.getBoundingClientRect();
    if ((r.width < 24 || r.height < 24) && smallTargets.length < 400) {
      smallTargets.push(label(el));
    }
  }

  // --- Tiny text + colour contrast ------------------------------------------
  const parseColor = c => {
    const m = (c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(s => parseFloat(s));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const bgOf = el => {
    let e = el;
    while (e) {
      const c = parseColor(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0.6) return c;
      e = e.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  let tinyText = 0, sampled = 0, lowContrast = 0;
  const lowContrastSamples = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode() && sampled < 300) {
    const node = walker.currentNode;
    if (!node.nodeValue || node.nodeValue.trim().length < 3) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
    if (!visible(el)) continue;
    seen.add(el);
    sampled += 1;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    if (size < 12) tinyText += 1;
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) {
      lowContrast += 1;
      if (lowContrastSamples.length < 5) {
        lowContrastSamples.push(label(el) + ' (' + ratio.toFixed(2) + ':1)');
      }
    }
  }

  // --- Images ---------------------------------------------------------------
  const imgs = Array.from(document.images || []);
  let broken = 0, oversized = 0;
  const oversizedSamples = [];
  for (const im of imgs) {
    if (im.complete && im.naturalWidth === 0 && im.src) broken += 1;
    const cw = im.clientWidth || 0;
    if (cw > 0 && im.naturalWidth > cw * (window.devicePixelRatio || 1) * 2 && oversized < 50) {
      oversized += 1;
      if (oversizedSamples.length < 3) oversizedSamples.push((im.currentSrc || im.src || '').slice(0, 120));
    }
  }

  // --- Internal links (for rendered crawl) ----------------------------------
  const internal = [];
  const seenLinks = new Set();
  for (const a of Array.from(document.querySelectorAll('a[href]'))) {
    try {
      const u = new URL(a.href, location.href);
      if (u.hostname === pageHost && /^https?:$/.test(u.protocol)) {
        u.hash = '';
        const s = u.href;
        if (!seenLinks.has(s)) { seenLinks.add(s); internal.push(s); }
      }
    } catch (_) {}
    if (internal.length >= 60) break;
  }

  const text = (document.body && document.body.innerText) || '';
  let framework = '';
  if (window.__NEXT_DATA__ || document.getElementById('__next')) framework = 'Next.js / React';
  else if (window.__NUXT__ || document.getElementById('__nuxt')) framework = 'Nuxt / Vue';
  else if (document.querySelector('[ng-version]')) framework = 'Angular';
  else if (document.querySelector('[data-reactroot]') || document.getElementById('root')) framework = 'React (SPA)';
  else if (document.getElementById('app')) framework = 'Vue / SPA';
  else if (document.querySelector('[data-svelte-h], #svelte')) framework = 'Svelte';

  return {
    timings: {
      ttfb_ms: Math.round(nav.responseStart || 0),
      dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd || 0),
      load_ms: Math.round(nav.loadEventEnd || 0),
      fcp_ms: Math.round(fcpEntry ? fcpEntry.startTime : 0)
    },
    vitals: {
      lcp_ms: Math.round(nx.lcp || 0),
      lcp_element: nx.lcpTag || '',
      cls: Math.round((nx.cls || 0) * 1000) / 1000,
      tbt_ms: Math.round(tbt),
      long_tasks: (nx.longTasks || []).length
    },
    network: {
      protocol: nav.nextHopProtocol || '',
      requests: resources.length + 1,
      transfer_bytes: transfer,
      by_type: byType,
      third_party_hosts: Object.keys(thirdParty).sort(),
      third_party_requests: Object.values(thirdParty).reduce((a, b) => a + b, 0)
    },
    dom: {
      nodes: document.querySelectorAll('*').length,
      max_depth: (() => { let d = 0; const walk = (n, k) => { d = Math.max(d, k); for (const c of n.children) { if (k < 80) walk(c, k + 1); } }; walk(document.documentElement, 1); return d; })()
    },
    layout: {
      viewport_width: vw,
      horizontal_overflow: document.documentElement.scrollWidth > vw + 1,
      scroll_width: document.documentElement.scrollWidth,
      interactive_elements: interactiveVisible,
      small_tap_targets: smallTargets.length,
      small_tap_target_samples: smallTargets.slice(0, 6),
      tiny_text_elements: tinyText,
      text_elements_sampled: sampled,
      low_contrast_elements: lowContrast,
      low_contrast_samples: lowContrastSamples
    },
    images: {
      total: imgs.length,
      broken: broken,
      oversized: oversized,
      oversized_samples: oversizedSamples
    },
    content: {
      word_count: (text.match(/\S+/g) || []).length,
      title: document.title || '',
      h1: (document.querySelector('h1') && document.querySelector('h1').innerText.trim()) || '',
      framework_hint: framework
    },
    internal_links: internal
  };
}
"""


def _is_blocked_host(host: str, allow_local: bool) -> bool:
    """SSRF guard for browser sub-requests (never let the audit browser touch private networks)."""
    if allow_local:
        return False
    h = (host or "").lower().strip("[]")
    if not h:
        return True
    if h == "localhost" or h.endswith(".localhost") or h.endswith(".internal") or h.endswith(".local"):
        return True
    try:
        ip = ipaddress.ip_address(h)
        return bool(ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast)
    except ValueError:
        return False


def _same_site(url: str, base_host: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return host == base_host or host == "www." + base_host or base_host == "www." + host


def _run_page(browser: Any, url: str, profile: Dict[str, Any], allow_local: bool,
              timeout_ms: int, want_html: bool, throttle: bool) -> Dict[str, Any]:
    """Load a single URL in a fresh context and collect measurements."""
    context = None
    out: Dict[str, Any] = {"url": url, "ok": False}
    console_errors: List[str] = []
    page_errors: List[str] = []
    failed_requests: List[str] = []
    try:
        context = browser.new_context(ignore_https_errors=bool(allow_local), **profile)
        page = context.new_page()
        page.add_init_script(INIT_SCRIPT)

        def _router(route):
            try:
                host = urlparse(route.request.url).hostname or ""
                if _is_blocked_host(host, allow_local):
                    return route.abort()
                return route.continue_()
            except Exception:
                try:
                    route.continue_()
                except Exception:
                    pass

        page.route("**/*", _router)
        page.on("console", lambda m: console_errors.append(m.text[:200]) if m.type == "error" and len(console_errors) < 12 else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)[:200]) if len(page_errors) < 12 else None)
        page.on("requestfailed", lambda r: failed_requests.append(f"{r.url[:120]}") if len(failed_requests) < 12 else None)

        if throttle:
            try:
                cdp = context.new_cdp_session(page)
                cdp.send("Network.enable")
                cdp.send("Network.emulateNetworkConditions", {
                    "offline": False,
                    "latency": 80,
                    "downloadThroughput": int(5 * 1024 * 1024 / 8),  # ~5 Mbps
                    "uploadThroughput": int(2 * 1024 * 1024 / 8),
                })
                cdp.send("Emulation.setCPUThrottlingRate", {"rate": 2})
            except Exception as e:
                logger.debug(f"CDP throttling unavailable: {e}")

        started = time.time()
        response = page.goto(url, wait_until="load", timeout=timeout_ms)
        out["status_code"] = response.status if response else 0
        out["final_url"] = page.url
        out["navigation_seconds"] = round(time.time() - started, 2)

        # Let late content/CWV settle, trigger lazy-loaded content, then settle again.
        page.wait_for_timeout(1500)
        try:
            page.evaluate("window.scrollTo(0, document.body ? document.body.scrollHeight : 0)")
            page.wait_for_timeout(700)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(900)
        except Exception:
            pass

        data = page.evaluate(COLLECT_SCRIPT)
        out.update(data)
        out["console_errors"] = console_errors
        out["page_errors"] = page_errors
        out["failed_requests"] = failed_requests
        if want_html:
            html = page.content()
            out["_html"] = html[:1_500_000]
        out["ok"] = True
    except Exception as e:
        out["error"] = str(e)[:300]
    finally:
        try:
            if context:
                context.close()
        except Exception:
            pass
    return out


def collect_browser_metrics(url: str, allow_local: bool = False, seed_urls: Optional[List[str]] = None,
                            max_extra_pages: int = 4, timeout_ms: int = 30000) -> Dict[str, Any]:
    """
    Run desktop + emulated-mobile measurements for ``url`` and a handful of extra internal pages.
    Always returns a dict; never raises.
    """
    flag = os.environ.get("NEXENTRA_BROWSER_AUDIT", "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return {"available": False, "reason": "Browser audit disabled via NEXENTRA_BROWSER_AUDIT=0"}

    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except Exception:
        return {
            "available": False,
            "reason": "Playwright is not installed. Run `pip install playwright` to enable measured "
                      "Core Web Vitals, rendered-DOM auditing and mobile layout checks.",
        }

    started = time.time()
    try:
        with sync_playwright() as pw:
            browser = None
            used = ""
            last_err = ""
            for channel in ("msedge", "chrome", None):
                try:
                    kwargs: Dict[str, Any] = {"headless": True}
                    if channel:
                        kwargs["channel"] = channel
                    browser = pw.chromium.launch(**kwargs)
                    used = channel or "chromium"
                    break
                except Exception as e:  # noqa: BLE001
                    last_err = str(e)
            if browser is None:
                return {
                    "available": False,
                    "reason": "No Chromium-based browser could be launched "
                              f"(install Edge/Chrome or run `playwright install chromium`). {last_err[:140]}",
                }

            base_host = (urlparse(url).hostname or "").lower()
            desktop_profile = {
                "viewport": {"width": 1366, "height": 768},
                "device_scale_factor": 1,
                "is_mobile": False,
                "has_touch": False,
                "user_agent": DESKTOP_UA,
            }
            mobile_profile = {
                "viewport": {"width": 390, "height": 844},
                "device_scale_factor": 2,
                "is_mobile": True,
                "has_touch": True,
                "user_agent": MOBILE_UA,
            }

            desktop = _run_page(browser, url, desktop_profile, allow_local, timeout_ms, want_html=True, throttle=False)
            mobile = _run_page(browser, url, mobile_profile, allow_local, timeout_ms, want_html=False, throttle=True)

            # Rendered internal pages (SPA route discovery + per-page quality).
            candidates: List[str] = []
            seen = {urldefrag(url)[0].rstrip("/")}
            for u in list(seed_urls or []) + list(desktop.get("internal_links") or []):
                try:
                    clean = urldefrag(u)[0]
                    key = clean.rstrip("/")
                    path = urlparse(clean).path.lower()
                    if key in seen or not _same_site(clean, base_host):
                        continue
                    if path.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".pdf", ".zip",
                                      ".css", ".js", ".json", ".xml", ".txt", ".mp4", ".woff", ".woff2")):
                        continue
                    seen.add(key)
                    candidates.append(clean)
                except Exception:
                    continue
            extra_pages: List[Dict[str, Any]] = []
            for extra in candidates[:max(0, max_extra_pages)]:
                snap = _run_page(browser, extra, desktop_profile, allow_local, 20000, want_html=True, throttle=False)
                if snap.get("ok"):
                    extra_pages.append(snap)

            try:
                browser.close()
            except Exception:
                pass

        rendered_html = desktop.pop("_html", "") if isinstance(desktop, dict) else ""
        for p in extra_pages:
            # keep html for the auditor; it removes it before the report is written
            p["_html"] = p.get("_html", "")

        return {
            "available": bool(desktop.get("ok") or mobile.get("ok")),
            "reason": "" if (desktop.get("ok") or mobile.get("ok")) else (desktop.get("error") or mobile.get("error") or "Page load failed"),
            "browser": used,
            "duration_seconds": round(time.time() - started, 1),
            "desktop": desktop,
            "mobile": mobile,
            "extra_pages": extra_pages,
            "_rendered_html": rendered_html,
        }
    except Exception as e:  # noqa: BLE001
        logger.debug(f"Browser metrics failure: {e}")
        return {"available": False, "reason": f"Browser measurement failed: {str(e)[:200]}"}

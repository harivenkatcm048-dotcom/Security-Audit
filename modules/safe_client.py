"""
Safe HTTP Client Module
=======================
Implements a defensive, rate-limited, SSRF-guarded HTTP client built on Python's
standard library with optional requests integration. Restricts redirect chains,
enforces timeouts, caps response bodies, and prevents denial-of-service conditions.
"""

from dataclasses import dataclass, field
import io
import logging
import ssl
import time
from typing import Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
import urllib.request

from .scope_manager import ScopeManager, ScopeViolationError, SSRFProtectionError

logger = logging.getLogger("DefensiveAudit.Client")


@dataclass
class HttpResponse:
    """Structured container for defensive HTTP responses."""
    url: str
    status_code: int
    headers: Dict[str, str]
    body: str
    raw_bytes: bytes
    elapsed_seconds: float
    redirect_history: List[str] = field(default_factory=list)
    error: Optional[str] = None


class SafeHttpClient:
    """Safe, rate-limited HTTP client with strict SSRF & scope protection."""

    def __init__(self, scope_manager: ScopeManager, timeout_seconds: float = 5.0,
                 rate_limit_per_second: float = 5.0, max_response_bytes: int = 2097152,
                 user_agent: Optional[str] = None, max_redirects: int = 3,
                 auth_token: Optional[str] = None, cookie: Optional[str] = None):
        self.scope_manager = scope_manager
        self.timeout = timeout_seconds
        self.min_interval = 1.0 / max(1.0, rate_limit_per_second)
        self.max_response_bytes = max_response_bytes
        self.max_redirects = max_redirects
        self.auth_token = auth_token.strip() if auth_token else None
        self.cookie = cookie.strip() if cookie else None
        self.user_agent = user_agent or (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) DefensiveSecurityAudit/1.0 (+Authorized Assessment)"
        )
        self._last_request_time: float = 0.0

    def _apply_rate_limit(self):
        """Throttle requests to respect rate limit policy."""
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_request_time = time.time()

    def get(self, url: str, headers: Optional[Dict[str, str]] = None,
            allow_redirects: bool = True) -> HttpResponse:
        """Execute a defensive GET request with SSRF validation and rate limiting."""
        return self.request("GET", url, headers=headers, allow_redirects=allow_redirects)

    def options(self, url: str, headers: Optional[Dict[str, str]] = None) -> HttpResponse:
        """Execute a defensive OPTIONS request."""
        return self.request("OPTIONS", url, headers=headers, allow_redirects=False)

    def post(self, url: str, data: Optional[bytes] = None, headers: Optional[Dict[str, str]] = None,
             allow_redirects: bool = False) -> HttpResponse:
        """Execute a defensive POST request."""
        return self.request("POST", url, headers=headers, data=data, allow_redirects=allow_redirects)

    def head(self, url: str, headers: Optional[Dict[str, str]] = None) -> HttpResponse:
        """Execute a defensive HEAD request."""
        return self.request("HEAD", url, headers=headers, allow_redirects=True)

    def request(self, method: str, url: str, headers: Optional[Dict[str, str]] = None,
                data: Optional[bytes] = None, allow_redirects: bool = True) -> HttpResponse:
        """
        Execute a defensive HTTP request with SSRF validation, rate limiting,
        and controlled redirect verification.
        """
        redirect_history: List[str] = []
        current_url = url
        start_time = time.time()
        method_upper = method.upper()

        for redirect_count in range(self.max_redirects + 1):
            # 1. Rate limiting
            self._apply_rate_limit()

            # 2. Scope & SSRF verification before network transmission
            parsed = urlparse(current_url)
            host = parsed.hostname
            if not host:
                return HttpResponse(
                    url=current_url,
                    status_code=0,
                    headers={},
                    body="",
                    raw_bytes=b"",
                    elapsed_seconds=time.time() - start_time,
                    error=f"Invalid target URL '{current_url}'"
                )

            try:
                self.scope_manager.resolve_and_validate_host(host)
            except ScopeViolationError as e:
                return HttpResponse(
                    url=current_url,
                    status_code=0,
                    headers={},
                    body="",
                    raw_bytes=b"",
                    elapsed_seconds=time.time() - start_time,
                    redirect_history=redirect_history,
                    error=f"SSRF/Scope Gate Block: {str(e)}"
                )

            # 3. Assemble request
            req_headers = {
                "User-Agent": self.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Connection": "close"
            }
            if self.auth_token:
                # If bearer token is provided without 'Bearer ', prepend it
                auth_val = self.auth_token if self.auth_token.lower().startswith(("bearer ", "basic ", "token ")) else f"Bearer {self.auth_token}"
                req_headers["Authorization"] = auth_val
            if self.cookie:
                req_headers["Cookie"] = self.cookie
            if headers:
                for hk, hv in headers.items():
                    if hv is None or hv == "":
                        req_headers.pop(hk, None)
                    else:
                        req_headers[hk] = hv

            req = urllib.request.Request(current_url, data=data, headers=req_headers, method=method_upper)

            # Configure SSL context (disable unverified SSL bypass; require safe TLS)
            ssl_context = ssl.create_default_context()
            if self.scope_manager.allow_local_test:
                # In explicit local mock test mode only, allow self-signed mock certs
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE

            # 4. Dispatch request using standard library
            try:
                # Custom handler to prevent automatic unchecked redirects
                class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
                    def redirect_request(self, req, fp, code, msg, hdrs, newurl):
                        return None

                opener = urllib.request.build_opener(
                    urllib.request.HTTPSHandler(context=ssl_context),
                    NoRedirectHandler()
                )

                with opener.open(req, timeout=self.timeout) as resp:
                    status = resp.status
                    raw_hdrs = dict(resp.headers.items())
                    raw_data = resp.read(self.max_response_bytes)
                    
                    # Safe text decoding
                    content_type = raw_hdrs.get("Content-Type", "").lower()
                    charset = "utf-8"
                    if "charset=" in content_type:
                        charset = content_type.split("charset=")[-1].split(";")[0].strip()
                    
                    try:
                        text_body = raw_data.decode(charset, errors="replace")
                    except Exception:
                        text_body = raw_data.decode("utf-8", errors="replace")

                    return HttpResponse(
                        url=current_url,
                        status_code=status,
                        headers=raw_hdrs,
                        body=text_body,
                        raw_bytes=raw_data,
                        elapsed_seconds=time.time() - start_time,
                        redirect_history=redirect_history
                    )

            except HTTPError as e:
                # Handle HTTP redirects (301, 302, 303, 307, 308)
                if e.code in (301, 302, 303, 307, 308) and allow_redirects:
                    redirect_location = e.headers.get("Location")
                    if not redirect_location:
                        return HttpResponse(
                            url=current_url,
                            status_code=e.code,
                            headers=dict(e.headers.items()),
                            body="",
                            raw_bytes=b"",
                            elapsed_seconds=time.time() - start_time,
                            redirect_history=redirect_history,
                            error=f"Redirect {e.code} received without Location header"
                        )

                    try:
                        next_url = self.scope_manager.validate_redirect(current_url, redirect_location)
                        redirect_history.append(f"{current_url} -> {e.code} -> {next_url}")
                        current_url = next_url
                        continue
                    except ScopeViolationError as scope_err:
                        return HttpResponse(
                            url=current_url,
                            status_code=e.code,
                            headers=dict(e.headers.items()),
                            body="",
                            raw_bytes=b"",
                            elapsed_seconds=time.time() - start_time,
                            redirect_history=redirect_history,
                            error=f"Unsafe redirect blocked: {str(scope_err)}"
                        )

                # Non-redirect HTTP error (e.g. 403, 404, 500)
                error_body = ""
                try:
                    error_bytes = e.read(self.max_response_bytes)
                    error_body = error_bytes.decode("utf-8", errors="replace")
                except Exception:
                    pass

                return HttpResponse(
                    url=current_url,
                    status_code=e.code,
                    headers=dict(e.headers.items()),
                    body=error_body,
                    raw_bytes=b"",
                    elapsed_seconds=time.time() - start_time,
                    redirect_history=redirect_history,
                    error=f"HTTP {e.code}: {e.reason}"
                )

            except URLError as e:
                return HttpResponse(
                    url=current_url,
                    status_code=0,
                    headers={},
                    body="",
                    raw_bytes=b"",
                    elapsed_seconds=time.time() - start_time,
                    redirect_history=redirect_history,
                    error=f"Connection Error: {e.reason}"
                )
            except Exception as e:
                return HttpResponse(
                    url=current_url,
                    status_code=0,
                    headers={},
                    body="",
                    raw_bytes=b"",
                    elapsed_seconds=time.time() - start_time,
                    redirect_history=redirect_history,
                    error=f"Request failure: {str(e)}"
                )

        return HttpResponse(
            url=current_url,
            status_code=0,
            headers={},
            body="",
            raw_bytes=b"",
            elapsed_seconds=time.time() - start_time,
            redirect_history=redirect_history,
            error=f"Exceeded maximum redirect limit of {self.max_redirects}"
        )

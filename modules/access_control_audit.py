"""
Access Control and Admin Protection Audit Module
=================================================
Defensively assesses administrative and management interfaces to determine whether
they require authentication, redirect to login challenges, or are inadvertently exposed.
Also evaluates discovered backend API endpoints for authentication enforcement.
"""

from dataclasses import dataclass
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

from .safe_client import SafeHttpClient, HttpResponse

logger = logging.getLogger("DefensiveAudit.AccessControl")


@dataclass
class AdminRouteResult:
    path: str
    full_url: str
    status_code: int
    protection_state: str  # PROTECTED, REDIRECTED_TO_LOGIN, UNPROTECTED_EXPOSED, NOT_FOUND
    details: str
    evidence: str


@dataclass
class ApiAccessResult:
    endpoint_path: str
    full_url: str
    status_code: int
    access_state: str  # RESTRICTED_AUTH_REQUIRED, PUBLIC_ACCESSIBLE, METHOD_NOT_ALLOWED, INACTIVE
    content_type: str
    details: str


class AccessControlAuditor:
    """Audits admin route protection and backend API accessibility."""

    COMMON_ADMIN_PATHS = [
        "/admin",
        "/admin/",
        "/administrator",
        "/wp-admin",
        "/dashboard",
        "/manage",
        "/cpanel",
        "/console",
        "/admin/login",
        "/api/admin"
    ]

    def __init__(self, base_url: str, client: SafeHttpClient):
        self.base_url = base_url
        self.client = client

    def audit_admin_paths(self) -> Tuple[List[AdminRouteResult], List[Dict[str, Any]]]:
        """Check whether common admin interfaces are protected by authentication."""
        results: List[AdminRouteResult] = []
        findings: List[Dict[str, Any]] = []

        # Get root homepage to establish baseline for SPA catch-all detection
        root_html = ""
        root_len = 0
        try:
            root_resp = self.client.get(self.base_url, allow_redirects=True)
            if root_resp.status_code == 200:
                root_html = root_resp.body or ""
                root_len = len(root_html)
        except Exception:
            pass

        for path in self.COMMON_ADMIN_PATHS:
            target_url = urljoin(self.base_url, path)
            try:
                # Disallow auto-redirect to see 301/302 location header
                resp = self.client.get(target_url, allow_redirects=False)
                status = resp.status_code
                loc = resp.headers.get("Location", "")

                if status in (401, 403):
                    results.append(AdminRouteResult(
                        path=path,
                        full_url=target_url,
                        status_code=status,
                        protection_state="PROTECTED",
                        details=f"HTTP {status}: Access restricted. Authentication required.",
                        evidence=f"HTTP {status} Forbidden/Unauthorized"
                    ))
                elif status in (301, 302, 303, 307, 308):
                    is_login_redirect = any(term in loc.lower() for term in ["login", "auth", "signin", "sso"])
                    state = "REDIRECTED_TO_LOGIN" if is_login_redirect else "REDIRECTED"
                    results.append(AdminRouteResult(
                        path=path,
                        full_url=target_url,
                        status_code=status,
                        protection_state=state,
                        details=f"HTTP {status} redirects to '{loc}'.",
                        evidence=f"Location: {loc}"
                    ))
                elif status == 200:
                    resp_body = resp.body or ""
                    resp_len = len(resp_body)

                    # Check for Single Page Application (SPA) catch-all router (e.g. React/Vite/Next fallback)
                    is_spa_fallback = False
                    if root_len > 0 and (resp_body == root_html or abs(resp_len - root_len) < 40):
                        is_spa_fallback = True
                    elif root_len > 0 and ("<div id=\"root\">" in resp_body or "<div id=\"app\">" in resp_body) and abs(resp_len - root_len) < 150:
                        is_spa_fallback = True

                    # Soft 404 detection
                    is_soft_404 = bool(re.search(r"(?i)(<title>[^<]*(?:not found|404|error)[^<]*</title>|page not found|does not exist)", resp_body))

                    if is_spa_fallback:
                        results.append(AdminRouteResult(
                            path=path,
                            full_url=target_url,
                            status_code=200,
                            protection_state="SPA_CATCHALL",
                            details="HTTP 200: SPA catch-all client route (serves root index shell; interface not exposed).",
                            evidence=f"Response matches root SPA shell ({resp_len} bytes)."
                        ))
                    elif is_soft_404:
                        results.append(AdminRouteResult(
                            path=path,
                            full_url=target_url,
                            status_code=200,
                            protection_state="NOT_FOUND_SOFT",
                            details="HTTP 200: Soft 404 page indicates interface does not exist.",
                            evidence="Soft 404 indicator text present in HTML body."
                        ))
                    else:
                        # Check if the page is a login form vs an unauthenticated dashboard
                        has_login_form = re.search(r'''(?:type=['"]password['"]|login|sign in|authenticate)''', resp_body, re.IGNORECASE)
                        if has_login_form:
                            results.append(AdminRouteResult(
                                path=path,
                                full_url=target_url,
                                status_code=200,
                                protection_state="PROTECTED_LOGIN_PAGE",
                                details="HTTP 200: Presents login authentication challenge.",
                                evidence="Password input field or login challenge observed in HTML."
                            ))
                        else:
                            # Verify if real administrative markers are present before raising high severity finding
                            has_admin_content = bool(re.search(r"(?i)(admin\s*panel|dashboard|control\s*panel|user\s*management|system\s*settings|cpanel|phpmyadmin)", resp_body))
                            if has_admin_content:
                                results.append(AdminRouteResult(
                                    path=path,
                                    full_url=target_url,
                                    status_code=200,
                                    protection_state="UNPROTECTED_EXPOSED",
                                    details="HTTP 200: Administrative interface returned without observed authentication.",
                                    evidence=f"Administrative keywords observed in HTTP 200 response ({resp_len} bytes)."
                                ))
                                findings.append({
                                    "type": "ADMIN_INTERFACE_POTENTIALLY_EXPOSED",
                                    "severity": "HIGH",
                                    "confidence": "HIGH",
                                    "summary": f"Potential Unauthenticated Admin Route Discovered ({path})",
                                    "description": (
                                        f"The administrative path '{path}' returned HTTP 200 and displayed administrative management content without requiring login credentials. "
                                        "Sensitive administrative interfaces should be protected behind multi-factor authentication or restricted to VPN/internal networks."
                                    ),
                                    "evidence": f"GET {target_url} returned HTTP 200 with admin markers.",
                                    "remediation": f"Restrict access to '{path}' via IP whitelisting or enforce mandatory SSO/MFA authentication."
                                })
                            else:
                                results.append(AdminRouteResult(
                                    path=path,
                                    full_url=target_url,
                                    status_code=200,
                                    protection_state="PUBLIC_GENERIC",
                                    details="HTTP 200: Generic public response without administrative features.",
                                    evidence=f"HTTP 200 at {target_url} ({resp_len} bytes)"
                                ))
                elif status == 404:
                    results.append(AdminRouteResult(
                        path=path,
                        full_url=target_url,
                        status_code=404,
                        protection_state="NOT_FOUND",
                        details="HTTP 404: Path does not exist.",
                        evidence="HTTP 404 Not Found"
                    ))
                else:
                    results.append(AdminRouteResult(
                        path=path,
                        full_url=target_url,
                        status_code=status,
                        protection_state="STATUS_" + str(status),
                        details=f"HTTP {status} response received.",
                        evidence=f"Status code {status}"
                    ))
            except Exception as e:
                logger.debug(f"Admin probe on {path} error: {e}")

        return results, findings

    def audit_backend_apis(self, candidate_endpoints: List[Any]) -> Tuple[List[ApiAccessResult], List[Dict[str, Any]], Dict[str, str]]:
        """Check accessibility and authentication status on discovered backend API endpoints."""
        results: List[ApiAccessResult] = []
        findings: List[Dict[str, Any]] = []
        state_map: Dict[str, str] = {}
        tested = set()

        # Prioritize administrative and authentication endpoints first
        def _priority_score(item: Any) -> int:
            p = (item.get("path", "") if isinstance(item, dict) else str(item)).lower()
            if any(k in p for k in ["admin", "auth", "token", "session", "user", "secret", "payment"]):
                return 0
            if any(k in p for k in ["exam", "placement", "training", "feedback", "mou"]):
                return 1
            return 2

        sorted_candidates = sorted(candidate_endpoints, key=_priority_score)

        # Audit up to 20 endpoints safely within rate limits
        for item in sorted_candidates[:20]:
            ep = item.get("path") if isinstance(item, dict) else str(item)
            if not ep or ep in tested:
                continue
            tested.add(ep)

            target_url = urljoin(self.base_url, ep)
            try:
                # Phase 1: Probe unauthenticated baseline to test whether auth is enforced
                resp = self.client.get(target_url, headers={"Authorization": None, "Cookie": None}, allow_redirects=False)
                status = resp.status_code
                ctype = resp.headers.get("Content-Type", "")

                if status in (401, 403):
                    state = "RESTRICTED_AUTH_REQUIRED"
                    details = f"Properly restricted: Requires authorization header or API token (HTTP {status})."

                    # Phase 2: If credentials provided, dispatch second authenticated verification request
                    has_creds = bool(getattr(self.client, "auth_token", None) or getattr(self.client, "cookie", None))
                    if has_creds:
                        try:
                            auth_resp = self.client.get(target_url, allow_redirects=False)
                            if auth_resp.status_code == 200:
                                state = "RESTRICTED_VERIFIED_AUTH"
                                details = f"Properly restricted without credentials (HTTP {status}); successfully authenticated with provided credentials (HTTP 200)."
                            elif auth_resp.status_code in (401, 403):
                                details = f"Enforces authorization (HTTP {status}); supplied credentials did not grant access (HTTP {auth_resp.status_code})."
                        except Exception:
                            pass

                    state_map[ep] = state
                    results.append(ApiAccessResult(
                        endpoint_path=ep,
                        full_url=target_url,
                        status_code=status,
                        access_state=state,
                        content_type=ctype,
                        details=details
                    ))
                elif status == 200:
                    is_json = "application/json" in ctype.lower() or resp.body.strip().startswith(("{", "["))
                    state = "PUBLIC_ACCESSIBLE"
                    details = f"HTTP 200: Publicly accessible without authentication ({ctype})."
                    state_map[ep] = state

                    results.append(ApiAccessResult(
                        endpoint_path=ep,
                        full_url=target_url,
                        status_code=200,
                        access_state=state,
                        content_type=ctype,
                        details=details
                    ))

                    # 1. OWASP API: Excessive Data Exposure & Sensitive Identifiers
                    if is_json and any(term in resp.body.lower() for term in ["email", "password", "token", "ssn", "user_id", "admin", "secret", "private_key"]):
                        findings.append({
                            "type": "API_ENDPOINT_EXPOSES_SENSITIVE_JSON",
                            "severity": "HIGH",
                            "confidence": "HIGH",
                            "summary": f"Unauthenticated API Exposes Sensitive Data ({ep})",
                            "description": f"Endpoint '{ep}' returned HTTP 200 with JSON payload containing sensitive field names without requiring authentication.",
                            "evidence": f"GET {target_url} returned HTTP 200 with sensitive keys in JSON response.",
                            "remediation": f"Enforce authentication (e.g. Bearer JWT or API Key) on '{ep}'."
                        })

                    # 2. OWASP API: API Response Security Headers (nosniff and cache-control)
                    if is_json:
                        xcto = resp.headers.get("X-Content-Type-Options", "").lower()
                        cache_ctrl = resp.headers.get("Cache-Control", "").lower()
                        if "nosniff" not in xcto:
                            findings.append({
                                "type": "API_MISSING_NOSNIFF_HEADER",
                                "severity": "LOW",
                                "confidence": "HIGH",
                                "summary": f"API Missing X-Content-Type-Options: nosniff ({ep})",
                                "description": f"Endpoint '{ep}' returns JSON data without the 'X-Content-Type-Options: nosniff' defensive header, exposing clients to MIME-type sniffing.",
                                "evidence": f"Response headers for {target_url} omit 'X-Content-Type-Options: nosniff'.",
                                "remediation": "Configure the API gateway or backend framework to set 'X-Content-Type-Options: nosniff' on all API responses."
                            })
                        if not any(term in cache_ctrl for term in ["no-store", "no-cache", "private"]):
                            findings.append({
                                "type": "API_SENSITIVE_DATA_CACHEABLE",
                                "severity": "LOW",
                                "confidence": "MEDIUM",
                                "summary": f"API Responses Lack Cache-Control: no-store ({ep})",
                                "description": f"Endpoint '{ep}' does not explicitly prohibit caching via 'Cache-Control: no-store, no-cache'. Sensitive API data may be retained in intermediate caches.",
                                "evidence": f"Cache-Control header is '{cache_ctrl or 'None'}' on {target_url}.",
                                "remediation": "Add 'Cache-Control: no-store, max-age=0' to all dynamic backend API responses."
                            })

                    # 3. OWASP API: CORS Misconfiguration on API Endpoints
                    acao = resp.headers.get("Access-Control-Allow-Origin", "").strip()
                    acac = resp.headers.get("Access-Control-Allow-Credentials", "").strip().lower()
                    if acao == "*" and acac == "true":
                        findings.append({
                            "type": "API_PERMISSIVE_CORS_WITH_CREDENTIALS",
                            "severity": "HIGH",
                            "confidence": "HIGH",
                            "summary": f"Insecure CORS Wildcard with Credentials ({ep})",
                            "description": f"Endpoint '{ep}' pairs 'Access-Control-Allow-Origin: *' with 'Access-Control-Allow-Credentials: true', creating a cross-origin security vulnerability.",
                            "evidence": f"ACAO: *, ACAC: {acac} on {target_url}",
                            "remediation": "Specify explicit trusted origins in Access-Control-Allow-Origin when credentials are supported."
                        })
                elif status == 405:
                    state_map[ep] = "METHOD_NOT_ALLOWED"
                    results.append(ApiAccessResult(
                        endpoint_path=ep,
                        full_url=target_url,
                        status_code=405,
                        access_state="METHOD_NOT_ALLOWED",
                        content_type=ctype,
                        details="HTTP 405: GET not allowed (likely expects POST/PUT)."
                    ))
                else:
                    state_map[ep] = f"HTTP_{status}"
                    results.append(ApiAccessResult(
                        endpoint_path=ep,
                        full_url=target_url,
                        status_code=status,
                        access_state=f"HTTP_{status}",
                        content_type=ctype,
                        details=f"Endpoint returned HTTP {status}."
                    ))
            except Exception as e:
                logger.debug(f"API accessibility test failed on {ep}: {e}")

        return results, findings, state_map

    def run_audit(self, candidate_api_paths: List[Any]) -> Dict[str, Any]:
        """Execute admin route protection checks and backend API accessibility tests."""
        admin_results, admin_findings = self.audit_admin_paths()
        api_results, api_findings, state_map = self.audit_backend_apis(candidate_api_paths)

        all_findings = admin_findings + api_findings
        for f in all_findings:
            if "owasp_category" not in f:
                f["owasp_category"] = "A01:2021-Broken Access Control"

        return {
            "admin_routes_audited": len(admin_results),
            "admin_routes": [
                {
                    "path": r.path,
                    "full_url": r.full_url,
                    "status_code": r.status_code,
                    "protection_state": r.protection_state,
                    "details": r.details,
                    "evidence": r.evidence
                }
                for r in admin_results
            ],
            "api_endpoints_audited": len(api_results),
            "api_endpoints": [
                {
                    "endpoint_path": a.endpoint_path,
                    "full_url": a.full_url,
                    "status_code": a.status_code,
                    "access_state": a.access_state,
                    "content_type": a.content_type,
                    "details": a.details
                }
                for a in api_results
            ],
            "endpoint_states": state_map,
            "findings": all_findings,
            "limitations": [
                "Admin route testing uses safe, non-destructive GET probes to evaluate access control responses.",
                "No brute forcing or credential testing is attempted."
            ]
        }

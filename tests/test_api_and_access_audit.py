"""
Unit Tests: API Inventory Discovery & Dual-Phase Access Control Audit
======================================================================
Verifies:
- Strategy 1: Extended Perimeter Discovery (robots.txt, sitemaps, subdomain correlation, DOM forms/portals)
- Strategy 2: Dual-Phase Authenticated Auditing (RESTRICTED_VERIFIED_AUTH vs PUBLIC_ACCESSIBLE)
- Strategy 3: Spec & Traffic Ingestion (OpenAPI 2.0/3.0 + Postman Collection v2.1)
- Strategy 4: OWASP API Security Checks (Sensitive JSON, nosniff, cache-control, CORS credentials)
"""

import json
import unittest
from unittest.mock import MagicMock, patch

from modules.api_inventory import ApiInventoryAnalyzer, classify_endpoint_subgroup
from modules.access_control_audit import AccessControlAuditor
from modules.safe_client import SafeHttpClient, HttpResponse
from modules.scope_manager import ScopeManager


class TestApiInventoryAndAccessAudit(unittest.TestCase):
    """Test suite for API perimeter discovery and dual-phase access auditing."""

    def setUp(self):
        self.target_url = "https://example.com"
        self.scope = ScopeManager(self.target_url, allow_local_test=True, authorized_confirmed=True)
        self.mock_client = MagicMock(spec=SafeHttpClient)
        self.mock_client.user_agent = "NexentraSecurityAudit/2.0"
        self.mock_client.auth_token = None
        self.mock_client.cookie = None

    # -------------------------------------------------------------
    # STRATEGY 1: Extended Perimeter Discovery
    # -------------------------------------------------------------
    def test_strategy_1_robots_and_sitemap_extraction(self):
        """Verify robots.txt and sitemap.xml route extraction and origin tagging."""
        analyzer = ApiInventoryAnalyzer(self.target_url, self.mock_client)
        discovered = {}

        # Mock robots.txt response
        robots_body = """
        User-agent: *
        Disallow: /api/v1/internal/
        Disallow: /admin/
        Sitemap: https://example.com/custom_sitemap.xml
        """
        # Mock sitemap response
        sitemap_body = """<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/api/v1/catalog</loc></url>
          <url><loc>https://example.com/about</loc></url>
        </urlset>
        """

        def mock_get(url, **kwargs):
            if "robots.txt" in url:
                return HttpResponse(url=url, status_code=200, headers={}, body=robots_body, raw_bytes=robots_body.encode(), elapsed_seconds=0.01)
            elif "sitemap" in url:
                return HttpResponse(url=url, status_code=200, headers={}, body=sitemap_body, raw_bytes=sitemap_body.encode(), elapsed_seconds=0.01)
            return HttpResponse(url=url, status_code=404, headers={}, body="", raw_bytes=b"", elapsed_seconds=0.01)

        self.mock_client.get.side_effect = mock_get

        analyzer._fetch_and_parse_robots_and_sitemaps(discovered)

        # Disallow path tagged with robots.txt
        self.assertIn("/api/v1/internal/:API", discovered)
        self.assertEqual(discovered["/api/v1/internal/:API"].source, "robots.txt")

        # Sitemap path tagged with sitemap.xml
        self.assertIn("/api/v1/catalog:API", discovered)
        self.assertEqual(discovered["/api/v1/catalog:API"].source, "sitemap.xml")

    def test_strategy_1_subdomain_correlation_probing(self):
        """Verify active subdomain API and health checks are catalogued."""
        analyzer = ApiInventoryAnalyzer(self.target_url, self.mock_client)
        discovered = {}

        subdomains = [
            {"hostname": "api.example.com", "status": "ACTIVE_RESOLVED", "resolved_ips": ["93.184.216.34"]},
            {"hostname": "auth.example.com", "status": "ACTIVE_RESOLVED", "resolved_ips": ["93.184.216.35"]}
        ]

        def mock_get(url, **kwargs):
            if "/health" in url or "/openapi.json" in url:
                return HttpResponse(url=url, status_code=200, headers={}, body='{"status":"ok"}', raw_bytes=b'{"status":"ok"}', elapsed_seconds=0.02)
            return HttpResponse(url=url, status_code=404, headers={}, body="", raw_bytes=b"", elapsed_seconds=0.01)

        self.mock_client.get.side_effect = mock_get

        analyzer._correlate_subdomain_apis(subdomains, discovered)

        key = "api.example.com:/health"
        self.assertIn(key, discovered)
        self.assertTrue(discovered[key].source.startswith("Subdomain Correlation"))

    def test_strategy_1_html_dom_forms_and_portals(self):
        """Verify HTML form actions (POST /api/student-feedback) and external portal links are extracted."""
        analyzer = ApiInventoryAnalyzer(self.target_url, self.mock_client)
        discovered = {}

        html = """
        <html>
          <body>
            <a href="https://sves.org.in/ecap/default.aspx">ECAP Portal (College ERP)</a>
            <a href="http://117.213.202.136/lms/">Internal Campus LMS</a>
            <form action="/api/student-feedback" method="POST">
              <input name="roll_number" />
              <input name="feedback_text" />
            </form>
          </body>
        </html>
        """

        analyzer._extract_from_html_dom(html, discovered)

        # Form action extracted as POST
        self.assertIn("/api/student-feedback:POST", discovered)
        form_ep = discovered["/api/student-feedback:POST"]
        self.assertEqual(form_ep.methods, ["POST"])
        self.assertIn("roll_number", form_ep.parameters)
        self.assertEqual(form_ep.subgroup, "Feedback & Survey Forms")

        # External portals extracted
        ecap_found = any("sves.org.in/ecap" in ep.full_url for ep in discovered.values())
        self.assertTrue(ecap_found)

    # -------------------------------------------------------------
    # STRATEGY 2: Dual-Phase Authenticated / Session-Aware Auditing
    # -------------------------------------------------------------
    def test_strategy_2_dual_phase_authenticated_verification(self):
        """Verify unauthenticated 401 baseline followed by authenticated 200 yields RESTRICTED_VERIFIED_AUTH."""
        auditor = AccessControlAuditor(self.target_url, self.mock_client)
        self.mock_client.auth_token = "valid_test_bearer_token"

        def mock_get(url, headers=None, **kwargs):
            # Check if Authorization header was stripped (Phase 1) or sent (Phase 2)
            is_unauth = headers and headers.get("Authorization") is None
            if is_unauth:
                return HttpResponse(url=url, status_code=401, headers={"Content-Type": "application/json"}, body='{"error":"Unauthorized"}', raw_bytes=b'{"error":"Unauthorized"}', elapsed_seconds=0.01)
            else:
                return HttpResponse(url=url, status_code=200, headers={"Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"}, body='{"data":"authorized"}', raw_bytes=b'{"data":"authorized"}', elapsed_seconds=0.01)

        self.mock_client.get.side_effect = mock_get

        results, findings, state_map = auditor.audit_backend_apis(["/api/v1/protected-data"])

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].access_state, "RESTRICTED_VERIFIED_AUTH")
        self.assertEqual(state_map["/api/v1/protected-data"], "RESTRICTED_VERIFIED_AUTH")

    def test_strategy_2_unauthenticated_public_baseline(self):
        """Verify unauthenticated 200 yields PUBLIC_ACCESSIBLE."""
        auditor = AccessControlAuditor(self.target_url, self.mock_client)

        def mock_get(url, headers=None, **kwargs):
            return HttpResponse(url=url, status_code=200, headers={"Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"}, body='{"status":"online"}', raw_bytes=b'{"status":"online"}', elapsed_seconds=0.01)

        self.mock_client.get.side_effect = mock_get

        results, findings, state_map = auditor.audit_backend_apis(["/api/v1/public-status"])

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].access_state, "PUBLIC_ACCESSIBLE")
        self.assertEqual(state_map["/api/v1/public-status"], "PUBLIC_ACCESSIBLE")

    # -------------------------------------------------------------
    # STRATEGY 3: Spec & Traffic Ingestion
    # -------------------------------------------------------------
    def test_strategy_3_openapi_spec_ingestion(self):
        """Verify OpenAPI 3.0 specification parses paths, methods, and summaries."""
        analyzer = ApiInventoryAnalyzer(self.target_url, self.mock_client)
        discovered = {}

        openapi_spec = {
            "openapi": "3.0.0",
            "info": {"title": "Campus Management API", "version": "1.0"},
            "paths": {
                "/api/exam-section/noticeboard": {
                    "get": {
                        "summary": "Retrieves examination circulars and alerts",
                        "parameters": [{"name": "t"}]
                    }
                },
                "/api/admin/placement-statistics": {
                    "get": {"summary": "Placement statistics breakdown"},
                    "post": {"summary": "Add placement record"}
                }
            }
        }

        count = analyzer._parse_openapi_spec(openapi_spec, "User Ingested Spec", discovered)
        self.assertEqual(count, 2)

        # Check Noticeboard subcategory classification
        notice_key = "/api/exam-section/noticeboard:GET"
        self.assertIn(notice_key, discovered)
        self.assertEqual(discovered[notice_key].confidence, "CONFIRMED")
        self.assertEqual(discovered[notice_key].subgroup, "Noticeboard & Examination")
        self.assertIn("t", discovered[notice_key].parameters)

    def test_strategy_3_postman_collection_ingestion(self):
        """Verify Postman Collection v2.1 parses items recursively."""
        analyzer = ApiInventoryAnalyzer(self.target_url, self.mock_client)
        discovered = {}

        postman_spec = {
            "info": {"name": "Placement API", "_postman_id": "test-123"},
            "item": [
                {
                    "name": "Get Placements",
                    "request": {
                        "method": "GET",
                        "url": "https://example.com/api/placements"
                    }
                },
                {
                    "name": "Submit Student Feedback",
                    "request": {
                        "method": "POST",
                        "url": {"raw": "https://example.com/api/student-feedback"}
                    }
                }
            ]
        }

        count = analyzer._parse_postman_collection(postman_spec, "Postman Collection", discovered)
        self.assertEqual(count, 2)
        self.assertIn("/api/placements:GET", discovered)
        self.assertIn("/api/student-feedback:POST", discovered)

    # -------------------------------------------------------------
    # STRATEGY 4: OWASP API Security Checks
    # -------------------------------------------------------------
    def test_strategy_4_owasp_api_checks(self):
        """Verify OWASP checks: sensitive JSON leak, missing nosniff, cacheable sensitive data, and CORS wildcard."""
        auditor = AccessControlAuditor(self.target_url, self.mock_client)

        resp_body = json.dumps({
            "users": [
                {"email": "admin@example.com", "token": "jwt_secret_token_abc", "password": "hash_12345"}
            ]
        })

        def mock_get(url, **kwargs):
            return HttpResponse(
                url=url,
                status_code=200,
                headers={
                    "Content-Type": "application/json",
                    # Omit X-Content-Type-Options: nosniff
                    "Cache-Control": "public, max-age=3600",  # Cacheable sensitive data
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true"  # Insecure CORS wildcard with credentials
                },
                body=resp_body,
                raw_bytes=resp_body.encode(),
                elapsed_seconds=0.01
            )

        self.mock_client.get.side_effect = mock_get

        results, findings, state_map = auditor.audit_backend_apis(["/api/v1/users"])

        finding_types = [f["type"] for f in findings]

        # 1. Excessive Sensitive Data Exposure
        self.assertIn("API_ENDPOINT_EXPOSES_SENSITIVE_JSON", finding_types)

        # 2. Missing nosniff
        self.assertIn("API_MISSING_NOSNIFF_HEADER", finding_types)

        # 3. Sensitive Data Cacheable
        self.assertIn("API_SENSITIVE_DATA_CACHEABLE", finding_types)

        # 4. Insecure CORS with credentials
        self.assertIn("API_PERMISSIVE_CORS_WITH_CREDENTIALS", finding_types)


if __name__ == "__main__":
    unittest.main()

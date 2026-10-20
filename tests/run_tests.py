"""
Test Runner and Integration Test Harness
=========================================
Executes all unit tests and an end-to-end integration audit against the local mock server.

Usage:
    python tests/run_tests.py
    python -m unittest discover tests
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from tests.mock_server import start_mock_server_in_background
from modules.scope_manager import ScopeManager
from modules.safe_client import SafeHttpClient
from modules.security_headers import SecurityHeadersAuditor
from modules.frontend_analysis import FrontendAnalyzer
from modules.api_inventory import ApiInventoryAnalyzer
from modules.technology_detection import TechnologyDetector
from modules.crawler import InScopeCrawler
from modules.secrets_scanner import SecretsScanner
from modules.access_control_audit import AccessControlAuditor
from modules.report_generator import ReportGenerator


def run_unit_tests():
    """Discover and execute all test cases in the tests directory."""
    print("=" * 70)
    print("RUNNING UNIT TEST SUITE")
    print("=" * 70)
    loader = unittest.TestLoader()
    suite = loader.discover(str(PROJECT_ROOT / "tests"), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def run_mock_integration_audit():
    """Spin up local mock server and execute end-to-end defensive audit."""
    print("\n" + "=" * 70)
    print("RUNNING LOCAL MOCK SERVER INTEGRATION AUDIT")
    print("=" * 70)
    
    server, port = start_mock_server_in_background()
    target_url = f"http://127.0.0.1:{port}"
    print(f"[*] Mock test server running at {target_url}")

    try:
        # 1. Initialize scope with local test permitted
        scope = ScopeManager(target_url, allow_local_test=True, authorized_confirmed=True)
        client = SafeHttpClient(scope_manager=scope, timeout_seconds=3.0)

        # 2. Fetch mock root page
        resp = client.get(target_url)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"[+] Root page fetched: HTTP {resp.status_code} ({len(resp.body)} bytes)")

        # 3. Security headers audit
        headers_auditor = SecurityHeadersAuditor(resp.headers, is_https=False)
        headers_res = headers_auditor.run_audit()
        print(f"[+] Headers analyzed: Grade={headers_res['grade']}, Score={headers_res['score']}%")
        assert "Strict-Transport-Security" in headers_res["missing_headers"]

        # 4. Frontend asset analysis
        frontend_auditor = FrontendAnalyzer(base_url=target_url, html_content=resp.body)
        fe_res = frontend_auditor.run_analysis()
        print(f"[+] Frontend analyzed: {fe_res['total_scripts']} scripts, {fe_res['total_forms']} forms")
        assert fe_res["total_forms"] >= 1

        # 5. API Inventory (should discover /openapi.json and paths from scripts)
        script_urls = [s["src"] for s in fe_res["first_party_scripts"]]
        api_auditor = ApiInventoryAnalyzer(base_url=target_url, client=client)
        api_res = api_auditor.run_inventory(html_content=resp.body, script_urls=script_urls)
        print(f"[+] API inventory complete: {api_res['total_endpoints']} endpoints found")
        assert any("/api/v1/users" in ep["path"] for ep in api_res["endpoints"])

        # 6. Technology detection
        tech_auditor = TechnologyDetector(headers=resp.headers, html_content=resp.body, script_urls=script_urls)
        tech_res = tech_auditor.detect_all()
        detected_names = [t["name"] for t in tech_res["technologies"]]
        print(f"[+] Technologies detected: {detected_names}")
        assert "Nginx" in detected_names or "Next.js" in detected_names

        # 7. In-Scope Crawler
        crawler = InScopeCrawler(start_url=target_url, client=client, scope_manager=scope, max_pages=5, max_depth=2)
        crawl_res = crawler.run_crawl()
        print(f"[+] In-Scope Crawler complete: {crawl_res['total_pages_crawled']} pages crawled")
        assert crawl_res["total_pages_crawled"] >= 1

        # 8. Secrets & Sensitive Leaks Scanner
        secrets_scanner = SecretsScanner(base_url=target_url, client=client)
        secrets_res = secrets_scanner.run_scan(crawled_pages=crawl_res.get("raw_pages", []), script_urls=script_urls)
        print(f"[+] Secrets Scanner complete: {secrets_res['total_secrets_found']} secrets found")

        # 9. Administrative Access Control Audit
        candidate_api_paths = [ep["path"] for ep in api_res.get("endpoints", [])]
        access_auditor = AccessControlAuditor(base_url=target_url, client=client)
        access_res = access_auditor.run_audit(candidate_api_paths=candidate_api_paths)
        print(f"[+] Access Control complete: {access_res['admin_routes_audited']} admin paths checked")
        assert any(r["path"] == "/admin" for r in access_res["admin_routes"])

        # 10. Report generation
        out_dir = PROJECT_ROOT / "reports"
        reporter = ReportGenerator(
            target_url=target_url,
            audit_data={
                "target_host": f"127.0.0.1:{port}",
                "target_url": target_url,
                "operator_authorized": True,
                "security_headers": headers_res,
                "frontend_analysis": fe_res,
                "api_inventory": api_res,
                "technology_detection": tech_res,
                "secrets_scanner": secrets_res,
                "access_control_audit": access_res,
                "crawler": crawl_res,
                "all_findings": headers_res["findings"] + fe_res["findings"] + api_res["findings"] + secrets_res["findings"] + access_res["findings"],
                "dns_analysis": {"records": {}},
                "port_scanner": {"ports_scanned": 1, "open_ports": [{"port": port, "service": "HTTP-Mock", "latency_ms": 2.0}]},
                "cloud_indicators": {"cloud_indicators": []},
                "domain_discovery": {"total_discovered": 0, "subdomains": []}
            },
            output_dir=str(out_dir)
        )
        report_files = reporter.generate_all()
        assert Path(report_files["json"]).exists(), "JSON report file missing"
        assert Path(report_files["html"]).exists(), "HTML report file missing"
        print(f"[+] Test reports verified:\n    JSON: {report_files['json']}\n    HTML: {report_files['html']}")

        print("\n[+] INTEGRATION AUDIT PASSED SUCCESSFULLY.")
        return True
    finally:
        server.shutdown()


if __name__ == "__main__":
    unit_ok = run_unit_tests()
    if not unit_ok:
        print("\n[!] Unit tests failed.")
        sys.exit(1)

    integ_ok = run_mock_integration_audit()
    if not integ_ok:
        print("\n[!] Mock integration test failed.")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("ALL TESTS AND AUDIT VERIFICATIONS PASSED (100% GREEN)")
    print("=" * 70 + "\n")
    sys.exit(0)

"""
Unit Tests: Report Generation (HTML and JSON)
"""

import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest

from modules.report_generator import ReportGenerator


class TestReportGeneration(unittest.TestCase):
    """Test JSON and HTML report generation, serialization, and redaction."""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.mock_audit_data = {
            "target_host": "test-audit.local",
            "target_url": "https://test-audit.local",
            "operator_authorized": True,
            "security_headers": {
                "score": 85,
                "grade": "B",
                "present_headers": {"X-Content-Type-Options": "nosniff"},
                "missing_headers": ["Content-Security-Policy"],
                "remediation_snippets": {"nginx": 'add_header X-Frame-Options "DENY";', "apache": ""}
            },
            "all_findings": [
                {
                    "type": "HEADER_MISSING_CSP",
                    "severity": "HIGH",
                    "confidence": "CONFIRMED",
                    "summary": "Missing Content Security Policy (CSP)",
                    "description": "CSP restricts resource loading sources.",
                    "evidence": "Authorization: Bearer secret_test_token_12345",
                    "remediation": "Add CSP header."
                }
            ],
            "api_inventory": {"endpoints": [{"path": "/api/v1/users", "methods": ["GET"], "confidence": "CONFIRMED", "source": "test"}]},
            "frontend_analysis": {"total_scripts": 2, "total_stylesheets": 1, "total_forms": 1},
            "tls_audit": {"certificate": {"days_remaining": 90, "valid_from": "2026-01-01", "valid_to": "2027-01-01"}},
            "dns_analysis": {
                "records": {"A": ["93.184.216.34"], "TXT": ["v=spf1 include:_spf.example.com ~all"]},
                "dmarc_records": ["v=DMARC1; p=reject"]
            },
            "port_scanner": {"ports_scanned": 5, "open_ports": [{"port": 443, "service": "HTTPS", "latency_ms": 12.5}]},
            "technology_detection": {"technologies": [{"name": "Nginx", "category": "Web Server", "version": "1.24", "confidence": "CONFIRMED", "evidence": "Server: nginx"}]},
            "cloud_indicators": {"cloud_indicators": []},
            "domain_discovery": {"total_discovered": 1, "subdomains": []},
            "secrets_scanner": {
                "total_secrets_found": 1,
                "findings": [
                    {
                        "type": "EXPOSED_SECRET_AWS",
                        "severity": "CRITICAL",
                        "summary": "Exposed Secret: AWS Access Key",
                        "masked_secret": "AKIA****************",
                        "source_url": "https://test-audit.local/bundle.js",
                        "remediation": "Revoke IAM key."
                    }
                ]
            },
            "access_control_audit": {
                "admin_routes_audited": 1,
                "admin_routes": [
                    {
                        "path": "/admin",
                        "full_url": "https://test-audit.local/admin",
                        "status_code": 401,
                        "protection_state": "PROTECTED",
                        "details": "HTTP 401: Access restricted."
                    }
                ],
                "api_endpoints_audited": 0,
                "api_endpoints": []
            },
            "crawler": {
                "total_pages_crawled": 1,
                "max_pages_limit": 15,
                "pages": [
                    {
                        "url": "https://test-audit.local",
                        "status_code": 200,
                        "title": "Test App Home",
                        "links_found": 3,
                        "scripts_found": 2,
                        "forms_found": 1
                    }
                ],
                "discovered_scripts": ["https://test-audit.local/bundle.js"],
                "discovered_links": ["https://test-audit.local/about"]
            }
        }

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_json_report_generation(self):
        reporter = ReportGenerator(
            target_url="https://test-audit.local",
            audit_data=self.mock_audit_data,
            output_dir=self.temp_dir
        )
        json_path = reporter.generate_json()
        self.assertTrue(os.path.exists(json_path))

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data["metadata"]["target_host"], "test-audit.local")
        self.assertEqual(data["summary"]["overall_grade"], "B")
        self.assertEqual(len(data["findings"]), 1)
        self.assertIn("secrets_scanner", data["modules"])
        self.assertIn("access_control_audit", data["modules"])
        self.assertIn("crawler", data["modules"])

        # Check sensitive token redaction
        raw_text = json_path.read_text(encoding="utf-8")
        self.assertNotIn("secret_test_token_12345", raw_text)
        self.assertIn("[REDACTED_BY_DEFENSIVE_AUDIT]", raw_text)

    def test_html_report_generation(self):
        reporter = ReportGenerator(
            target_url="https://test-audit.local",
            audit_data=self.mock_audit_data,
            output_dir=self.temp_dir
        )
        html_path = reporter.generate_html()
        self.assertTrue(os.path.exists(html_path))

        content = html_path.read_text(encoding="utf-8")
        self.assertIn("<!DOCTYPE html>", content)
        self.assertIn("Defensive Security Audit Report", content)
        self.assertIn("test-audit.local", content)
        self.assertIn("Missing Content Security Policy", content)
        self.assertIn("Hardening Remediation", content)
        self.assertIn("Secrets & Sensitive Leaks Scanner", content)
        self.assertIn("Administrative Access Control & Protected Routes", content)
        self.assertIn("In-Scope Web Crawler & Site Topology", content)
        self.assertNotIn("secret_test_token_12345", content)


if __name__ == "__main__":
    unittest.main()

"""
Unit Tests: Security Headers and Cookie Attributes
"""

import unittest
from modules.security_headers import SecurityHeadersAuditor


class TestSecurityHeaders(unittest.TestCase):
    """Test header scoring, findings generation, and configuration output."""

    def test_ideal_hardened_headers_receive_a_grade(self):
        hardened_headers = {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=()",
        }
        auditor = SecurityHeadersAuditor(hardened_headers, is_https=True)
        res = auditor.run_audit()
        self.assertIn(res["grade"], ("A", "A+"))
        self.assertGreaterEqual(res["score"], 90)
        self.assertEqual(len(res["missing_headers"]), 0)

    def test_empty_headers_receive_f_grade(self):
        auditor = SecurityHeadersAuditor({}, is_https=True)
        res = auditor.run_audit()
        self.assertEqual(res["grade"], "F")
        self.assertLess(res["score"], 50)
        self.assertIn("Strict-Transport-Security", res["missing_headers"])
        self.assertIn("Content-Security-Policy", res["missing_headers"])

    def test_csp_unsafe_inline_triggers_finding(self):
        headers = {
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
            "X-Frame-Options": "SAMEORIGIN",
            "X-Content-Type-Options": "nosniff"
        }
        auditor = SecurityHeadersAuditor(headers, is_https=True)
        res = auditor.run_audit()
        types = [f["type"] for f in res["findings"]]
        self.assertIn("HEADER_CSP_UNSAFE_INLINE", types)

    def test_cookie_missing_secure_flag_on_https(self):
        headers = {
            "Set-Cookie": "session_id=12345; HttpOnly; Path=/"
        }
        auditor = SecurityHeadersAuditor(headers, is_https=True)
        res = auditor.run_audit()
        types = [f["type"] for f in res["findings"]]
        self.assertIn("COOKIE_MISSING_SECURE", types)

    def test_remediation_snippets_generated_for_missing_headers(self):
        headers = {}
        auditor = SecurityHeadersAuditor(headers, is_https=True)
        res = auditor.run_audit()
        snippets = res["remediation_snippets"]
        self.assertIn("add_header Strict-Transport-Security", snippets["nginx"])
        self.assertIn("Header always set X-Frame-Options", snippets["apache"])


if __name__ == "__main__":
    unittest.main()

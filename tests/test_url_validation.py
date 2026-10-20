"""
Unit Tests: URL Validation and Normalization
"""

import unittest
from modules.scope_manager import ScopeManager, ScopeViolationError


class TestUrlValidation(unittest.TestCase):
    """Test URL structure, schemes, and hostname formatting."""

    def test_valid_https_url(self):
        scope = ScopeManager("https://example.com/app", allow_local_test=False)
        self.assertEqual(scope.scheme, "https")
        self.assertEqual(scope.target_host, "example.com")
        self.assertEqual(scope.port, 443)

    def test_valid_http_url(self):
        scope = ScopeManager("http://example.com:8080/dashboard", allow_local_test=False)
        self.assertEqual(scope.scheme, "http")
        self.assertEqual(scope.target_host, "example.com")
        self.assertEqual(scope.port, 8080)

    def test_url_without_scheme_auto_prepends_https(self):
        scope = ScopeManager("example.com", allow_local_test=False)
        self.assertEqual(scope.scheme, "https")
        self.assertEqual(scope.target_host, "example.com")

    def test_prohibited_schemes_raise_value_error(self):
        prohibited = [
            "file:///etc/passwd",
            "gopher://example.com",
            "ftp://files.example.com",
            "javascript:alert(1)",
            "data:text/html,test"
        ]
        for url in prohibited:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    ScopeManager(url)

    def test_empty_or_malformed_urls_raise_value_error(self):
        bad_inputs = ["", "   ", "http://", "https://:8080"]
        for inp in bad_inputs:
            with self.subTest(inp=inp):
                with self.assertRaises(ValueError):
                    ScopeManager(inp)

    def test_hostname_case_insensitivity(self):
        scope = ScopeManager("https://ExAmPlE.CoM/Path", allow_local_test=False)
        self.assertEqual(scope.target_host, "example.com")


if __name__ == "__main__":
    unittest.main()

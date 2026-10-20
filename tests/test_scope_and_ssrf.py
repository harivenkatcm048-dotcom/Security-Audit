"""
Unit Tests: Scope Enforcement, SSRF Protection, and Redirect Safety
"""

import unittest
from modules.scope_manager import ScopeManager, ScopeViolationError, SSRFProtectionError


class TestScopeAndSSRF(unittest.TestCase):
    """Test firewalling against private IPs, cloud metadata, and unsafe redirects."""

    def setUp(self):
        self.scope = ScopeManager("https://example.com", allow_subdomains=False, allow_local_test=False)

    def test_ssrf_blocks_loopback_ips(self):
        loopback_ips = ["127.0.0.1", "127.0.1.5", "127.255.255.254"]
        for ip in loopback_ips:
            with self.subTest(ip=ip):
                blocked, reason = self.scope.is_ip_prohibited(ip)
                self.assertTrue(blocked, f"Expected {ip} to be blocked, but was allowed.")

    def test_ssrf_blocks_rfc1918_private_ips(self):
        private_ips = [
            "10.0.0.1", "10.254.1.1",
            "172.16.0.1", "172.31.255.254",
            "192.168.1.1", "192.168.100.254"
        ]
        for ip in private_ips:
            with self.subTest(ip=ip):
                blocked, reason = self.scope.is_ip_prohibited(ip)
                self.assertTrue(blocked, f"Expected private IP {ip} to be blocked.")

    def test_ssrf_blocks_cloud_metadata_link_local(self):
        metadata_ips = [
            "169.254.169.254",  # AWS/GCP/Azure instance metadata
            "169.254.1.1",      # IPv4 link-local
            "fe80::1",          # IPv6 link-local
        ]
        for ip in metadata_ips:
            with self.subTest(ip=ip):
                blocked, reason = self.scope.is_ip_prohibited(ip)
                self.assertTrue(blocked, f"Expected metadata IP {ip} to be blocked.")

    def test_ssrf_allows_legitimate_public_ips(self):
        public_ips = ["93.184.216.34", "8.8.8.8", "1.1.1.1"]
        for ip in public_ips:
            with self.subTest(ip=ip):
                blocked, reason = self.scope.is_ip_prohibited(ip)
                self.assertFalse(blocked, f"Expected public IP {ip} to be allowed, but was blocked: {reason}")

    def test_local_test_mode_permits_loopback(self):
        local_scope = ScopeManager("http://127.0.0.1:8080", allow_local_test=True)
        blocked, _ = local_scope.is_ip_prohibited("127.0.0.1")
        self.assertFalse(blocked, "Local test mode must allow loopback 127.0.0.1")

    def test_in_scope_hostname_check(self):
        self.assertTrue(self.scope.is_url_in_scope("https://example.com/login"))
        self.assertTrue(self.scope.is_url_in_scope("https://example.com:443/api/v1"))
        self.assertFalse(self.scope.is_url_in_scope("https://attacker.com/evil"))
        self.assertFalse(self.scope.is_url_in_scope("https://sub.example.com"))

    def test_subdomains_allowed_when_configured(self):
        sub_scope = ScopeManager("https://example.com", allow_subdomains=True)
        self.assertTrue(sub_scope.is_url_in_scope("https://api.example.com"))
        self.assertTrue(sub_scope.is_url_in_scope("https://auth.example.com/oauth"))
        self.assertFalse(sub_scope.is_url_in_scope("https://otherdomain.com"))

    def test_redirect_validation_blocks_cross_domain(self):
        with self.assertRaises(ScopeViolationError):
            self.scope.validate_redirect("https://example.com/login", "https://evil-phishing.com/harvest")

    def test_redact_sensitive_strings(self):
        sample_log = "User header Authorization: Bearer abcdef1234567890xyz and api_key=secretKey98765"
        redacted = ScopeManager.redact_sensitive(sample_log)
        self.assertNotIn("abcdef1234567890xyz", redacted)
        self.assertNotIn("secretKey98765", redacted)
        self.assertIn("[REDACTED_BY_DEFENSIVE_AUDIT]", redacted)


if __name__ == "__main__":
    unittest.main()

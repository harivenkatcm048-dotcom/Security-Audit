"""
Quick test verification runner
"""
import subprocess
import sys

if __name__ == "__main__":
    from tests.run_tests import run_unit_tests, run_mock_integration_audit
    u_ok = run_unit_tests()
    i_ok = run_mock_integration_audit()
    sys.exit(0 if (u_ok and i_ok) else 1)

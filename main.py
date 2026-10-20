"""
Defensive Website Security Audit Toolkit - Main Entry Point
============================================================
Coordinates defensive, non-destructive configuration assessments, asset inventories,
cryptographic validation, and report generation for authorized target websites.

Usage:
    python main.py https://example.com --authorized
    python main.py https://example.com --dry-run
    python main.py --test-target
"""

import argparse
from datetime import datetime, timezone
import logging
import os
from pathlib import Path
import sys
from typing import Any, Dict, List
from urllib.parse import urlparse

# Module imports
from modules.scope_manager import ScopeManager, ScopeViolationError, SSRFProtectionError
from modules.safe_client import SafeHttpClient, HttpResponse
from modules.domain_discovery import DomainDiscovery
from modules.dns_analysis import DnsAnalyzer
from modules.tls_audit import TlsAuditor
from modules.security_headers import SecurityHeadersAuditor
from modules.port_scanner import ConservativePortScanner
from modules.frontend_analysis import FrontendAnalyzer
from modules.endpoint_discovery import EndpointDiscovery
from modules.api_inventory import ApiInventoryAnalyzer
from modules.technology_detection import TechnologyDetector
from modules.cloud_indicators import CloudIndicatorAnalyzer
from modules.crawler import InScopeCrawler
from modules.secrets_scanner import SecretsScanner
from modules.access_control_audit import AccessControlAuditor
from modules.vulnerability_scanner import VulnerabilityScanner
from modules.web_quality_audit import WebQualityAuditor
from modules.report_generator import ReportGenerator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("DefensiveAudit")


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """Load YAML config if PyYAML is installed, else return standard default configuration."""
    cfg_file = Path(config_path)
    if cfg_file.exists():
        try:
            import yaml
            with open(cfg_file, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except ImportError:
            logger.debug("PyYAML not installed; using standard default configuration.")
        except Exception as e:
            logger.warning(f"Error reading {config_path}: {e}; using defaults.")

    # Standard default configuration
    return {
        "audit": {
            "timeout_seconds": 5.0,
            "rate_limit_per_second": 5.0,
            "max_workers": 4,
            "max_response_bytes": 2097152,
        },
        "safety": {
            "require_authorization_confirmation": True,
            "block_private_networks": True,
        },
        "modules": {
            "domain_discovery": {"enabled": True},
            "dns_analysis": {"enabled": True},
            "port_scanner": {"enabled": True},
            "tls_audit": {"enabled": True},
            "security_headers": {"enabled": True},
            "frontend_analysis": {"enabled": True},
            "api_inventory": {"enabled": True},
            "technology_detection": {"enabled": True},
            "cloud_indicators": {"enabled": True},
            "crawler": {"enabled": True, "max_pages": 15, "max_depth": 2},
            "secrets_scanner": {"enabled": True},
            "access_control_audit": {"enabled": True},
        },
        "reporting": {
            "output_dir": "reports"
        }
    }


def verify_authorization(target_host: str, cli_authorized: bool) -> bool:
    """Ensure explicit operator authorization confirmation before proceeding."""
    if cli_authorized:
        return True

    # Check environment variable
    if os.environ.get("DEFENSIVE_AUDIT_AUTHORIZED", "").lower() in ("1", "true", "yes"):
        return True

    # If running in an interactive terminal, prompt the operator
    if sys.stdin.isatty():
        print("\n" + "=" * 70)
        print("DEFENSIVE SECURITY AUDIT - AUTHORIZATION CONFIRMATION")
        print("=" * 70)
        print(f"Target: {target_host}")
        print("This tool is designed strictly for defensive assessment of assets you")
        print("own or have explicit, documented authorization to inspect.")
        print("Active probes (DNS, TLS, safe HTTP requests, port checks) will be sent.")
        print("-" * 70)
        try:
            resp = input("Do you confirm you are authorized to assess this target? [y/N]: ").strip().lower()
            return resp in ("y", "yes")
        except EOFError:
            return False

    return False


def run_audit(target_url: str, args: argparse.Namespace, config: Dict[str, Any]) -> int:
    """Coordinate full Nexentra Security Audit lifecycle."""
    print("\n" + "=" * 72)
    print("   NEXENTRA SECURITY AUDIT v2.0.0 (ENTERPRISE EDITION)")
    print("   Next-Gen Automated Web Vulnerability & Configuration Assessment Engine")
    print("=" * 72)

    # 1. Scope & URL Validation
    try:
        scope = ScopeManager(
            target_url=target_url,
            allow_subdomains=False,
            allow_local_test=getattr(args, "allow_local_mock", False),
            authorized_confirmed=getattr(args, "authorized", True)
        )
    except Exception as e:
        logger.error(f"URL Validation Failed: {e}")
        return 1

    target_host = scope.target_host
    print(f"[*] Target URL   : {scope.target_url}")
    print(f"[*] Target Host  : {target_host}")
    print(f"[*] Audit Scheme : {scope.scheme.upper()} (Default Port: {scope.port})")

    # 2. Authorization Verification
    if not verify_authorization(target_host, args.authorized):
        print("\n[!] ERROR: Authorization confirmation required.")
        print("    Pass '--authorized' on the command line to confirm explicit permission:")
        print(f"    python main.py {target_url} --authorized\n")
        return 1

    # 3. SSRF & DNS Resolution Pre-check
    print("[*] Validating network boundaries & SSRF firewall rules...")
    resolved_ips = []
    dns_failed = False
    try:
        resolved_ips = scope.resolve_and_validate_host(target_host)
        print(f"[+] Scope Verified: Host resolved to public IP(s): {', '.join(resolved_ips)}")
    except SSRFProtectionError as ssrf_err:
        print(f"\n[!] SAFETY HALT (SSRF Rule Violation): {ssrf_err}")
        print("    Audit terminated. Traffic to private, loopback, or metadata addresses is blocked.\n")
        return 2
    except ScopeViolationError as scope_err:
        dns_failed = True
        print(f"\n[!] Scope Resolution Warning: {scope_err}")
        print("    Target cannot be resolved via DNS. Generating diagnostic audit report...\n")

    # If DNS resolution failed, generate a diagnostic report immediately
    if dns_failed:
        out_dir = args.output_dir or config.get("reporting", {}).get("output_dir", "reports")
        failure_finding = {
            "type": "HOST_DNS_RESOLUTION_FAILURE",
            "severity": "CRITICAL",
            "confidence": "CONFIRMED",
            "summary": f"DNS Resolution Failure for '{target_host}'",
            "description": (
                f"Authoritative DNS resolvers could not resolve '{target_host}' to an active IP address. "
                f"The domain may be unregistered, expired, or lacking A/AAAA records. Details: {scope_err}"
            ),
            "evidence": f"getaddrinfo({target_host}) failed",
            "remediation": "Verify that the domain registration is active and configure valid A or AAAA records in your authoritative DNS zone."
        }
        diagnostic_data = {
            "target_url": scope.target_url,
            "target_host": target_host,
            "operator_authorized": True,
            "resolved_ips": [],
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "all_findings": [failure_finding],
            "security_headers": {
                "score": 0,
                "grade": "F",
                "present_headers": {},
                "missing_headers": ["All Defensive Headers (Host Unreachable)"],
                "remediation_snippets": {"nginx": "# Host unreachable via DNS", "apache": "# Host unreachable via DNS"}
            },
            "dns_analysis": {
                "records": {"A": [], "AAAA": [], "MX": [], "NS": [], "TXT": []},
                "dmarc_records": [],
                "domain": target_host
            },
            "port_scanner": {"ports_scanned": 0, "open_ports": [], "all_results": []},
            "tls_audit": {"certificate": None, "connection": None},
            "frontend_analysis": {"total_scripts": 0, "total_stylesheets": 0, "total_forms": 0},
            "api_inventory": {"total_endpoints": 0, "endpoints": []},
            "technology_detection": {"technologies": []},
            "cloud_indicators": {"cloud_indicators": []},
            "domain_discovery": {"total_discovered": 0, "subdomains": []}
        }
        reporter = ReportGenerator(target_url=scope.target_url, audit_data=diagnostic_data, output_dir=out_dir)
        report_paths = reporter.generate_all()
        print(f"[+] Diagnostic Report Generated:")
        print(f"    JSON: {report_paths['json']}")
        print(f"    HTML: {report_paths['html']}")
        return 0

    # 4. Handle Dry Run
    if args.dry_run:
        print("\n" + "-" * 72)
        print("DRY-RUN MODE ACTIVE: No active network requests will be dispatched.")
        print(f"Target Host       : {target_host}")
        print(f"Authorized IP(s)  : {', '.join(resolved_ips)}")
        print(f"Planned Modules   : Domain Discovery, DNS Analysis, TLS Audit,")
        print(f"                    Security Headers, Frontend Assets, API Inventory,")
        print(f"                    Tech Detection, Cloud Indicators, Port Check")
        print(f"Output Directory  : {args.output_dir}")
        print("-" * 72 + "\n")
        return 0

    # 5. Initialize Safe HTTP Client
    audit_cfg = config.get("audit", {})
    client = SafeHttpClient(
        scope_manager=scope,
        timeout_seconds=float(audit_cfg.get("timeout_seconds", 5.0)),
        rate_limit_per_second=float(audit_cfg.get("rate_limit_per_second", 5.0)),
        max_response_bytes=int(audit_cfg.get("max_response_bytes", 2097152)),
        auth_token=getattr(args, "auth_token", None),
        cookie=getattr(args, "cookie", None)
    )
    if getattr(args, "auth_token", None):
        print(f"[+] Authenticated Mode Active: Authorization credentials injected into client requests")

    # Ingest external OpenAPI or Postman specification if specified
    spec_data = None
    if getattr(args, "spec_file", None):
        spec_p = Path(args.spec_file)
        if spec_p.exists():
            try:
                import json
                with open(spec_p, "r", encoding="utf-8") as f:
                    spec_data = json.load(f)
                print(f"[+] Ingested user API specification from {spec_p.name}")
            except Exception as e:
                logger.warning(f"Could not load spec file {args.spec_file}: {e}")

    all_findings: List[Dict[str, Any]] = []
    audit_data: Dict[str, Any] = {
        "target_url": scope.target_url,
        "target_host": target_host,
        "operator_authorized": True,
        "resolved_ips": resolved_ips,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "all_findings": all_findings,
    }

    # 6. Fetch Target Web Page Safely
    print("\n[*] [1/9] Fetching target homepage and response headers...")
    try:
        root_resp = client.get(scope.target_url, allow_redirects=True)
        if root_resp.error:
            logger.warning(f"Initial request note: {root_resp.error} (Status: {root_resp.status_code})")
        else:
            print(f"[+] Initial response: HTTP {root_resp.status_code} ({len(root_resp.body)} bytes, {root_resp.elapsed_seconds:.2f}s)")
    except Exception as e:
        logger.warning(f"Fetch target failed: {e}")
        root_resp = HttpResponse(url=scope.target_url, status_code=0, headers={}, body="", raw_bytes=b"", elapsed_seconds=0.0, error=str(e))

    # 7. Module: Security Headers & Cookies
    try:
        print("[*] [2/9] Auditing HTTP defensive security headers...")
        is_https = scope.scheme == "https" or any("https://" in r for r in root_resp.redirect_history)
        header_auditor = SecurityHeadersAuditor(root_resp.headers, is_https=is_https)
        headers_result = header_auditor.run_audit()
        audit_data["security_headers"] = headers_result
        all_findings.extend(headers_result.get("findings", []))
        print(f"[+] Security Header Grade: {headers_result['grade']} (Score: {headers_result['score']}/100)")
    except Exception as e:
        logger.warning(f"Security headers audit error: {e}")
        headers_result = {"score": 50, "grade": "C", "present_headers": {}, "missing_headers": [], "findings": [], "remediation_snippets": {}}
        audit_data["security_headers"] = headers_result

    # 8. Module: TLS / SSL Audit
    try:
        print("[*] [3/9] Auditing SSL/TLS certificate & crypto parameters...")
        tls_auditor = TlsAuditor(target_host=target_host, port=443)
        tls_result = tls_auditor.run_audit()
        audit_data["tls_audit"] = tls_result
        all_findings.extend(tls_result.get("findings", []))
        if tls_result.get("certificate"):
            days = tls_result["certificate"].get("days_remaining", "N/A")
            print(f"[+] TLS Certificate: Valid ({days} days remaining, {tls_result.get('connection', {}).get('protocol_version', '')})")
        else:
            print("[-] TLS check note: No active TLS service identified on port 443.")
    except Exception as e:
        logger.warning(f"TLS audit error: {e}")
        audit_data["tls_audit"] = {"certificate": None, "connection": None, "findings": [], "limitations": [str(e)]}

    # 9. Module: DNS Records & Email Security (SPF/DMARC)
    try:
        print("[*] [4/9] Performing DNS analysis (A, AAAA, MX, NS, TXT, SPF, DMARC)...")
        dns_analyzer = DnsAnalyzer(target_host=target_host)
        dns_result = dns_analyzer.run_audit()
        audit_data["dns_analysis"] = dns_result
        all_findings.extend(dns_result.get("findings", []))
        print(f"[+] DNS Records gathered: A({len(dns_result['records']['A'])}), MX({len(dns_result['records']['MX'])}), NS({len(dns_result['records']['NS'])})")
    except Exception as e:
        logger.warning(f"DNS analysis error: {e}")
        dns_result = {"records": {"A": resolved_ips, "AAAA": [], "MX": [], "NS": [], "TXT": []}, "dmarc_records": [], "domain": target_host, "findings": []}
        audit_data["dns_analysis"] = dns_result

    # 10. Module: Passive Subdomain Discovery (Certificate Transparency & DNS)
    domain_result = {"total_discovered": 0, "subdomains": []}
    try:
        print("[*] [5/13] Collecting publicly observable subdomains (Certificate Transparency & DNS)...")
        domain_disco = DomainDiscovery(target_host=target_host, timeout=5.0)
        domain_result = domain_disco.run_discovery()
        audit_data["domain_discovery"] = domain_result
        print(f"[+] Subdomains Observed: {domain_result['total_discovered']} host(s)")
    except Exception as e:
        logger.warning(f"Subdomain discovery error: {e}")
        audit_data["domain_discovery"] = domain_result

    # 11. Module: In-Scope Web Crawler
    raw_crawled_pages = []
    crawled_scripts = []
    try:
        print("[*] [6/13] Crawling internal application pages (bounded in-scope BFS)...")
        crawler = InScopeCrawler(
            start_url=root_resp.url or scope.target_url,
            client=client,
            scope_manager=scope,
            max_pages=15,
            max_depth=2
        )
        crawl_result = crawler.run_crawl()
        raw_crawled_pages = crawl_result.get("raw_pages", [])
        crawled_scripts = crawl_result.get("discovered_scripts", [])
        audit_data["crawler"] = {
            "total_pages_crawled": crawl_result.get("total_pages_crawled", 0),
            "max_pages_limit": crawl_result.get("max_pages_limit", 15),
            "pages": crawl_result.get("pages", []),
            "discovered_scripts": crawled_scripts,
            "discovered_links": crawl_result.get("discovered_links", [])
        }
        print(f"[+] Crawler: Visited {crawl_result.get('total_pages_crawled', 0)} page(s), discovered {len(crawled_scripts)} script(s)")
    except Exception as e:
        logger.warning(f"In-scope crawler error: {e}")
        audit_data["crawler"] = {"total_pages_crawled": 1, "pages": [{"url": scope.target_url, "status_code": root_resp.status_code, "title": "Home", "links_found": 0, "scripts_found": 0, "forms_found": 0}], "discovered_scripts": [], "discovered_links": []}

    # 12. Module: Frontend Asset Inventory (Scripts, Styles, Forms)
    try:
        print("[*] [7/13] Inventorying frontend assets, scripts, stylesheets, and forms...")
        frontend_analyzer = FrontendAnalyzer(base_url=root_resp.url or scope.target_url, html_content=root_resp.body)
        frontend_result = frontend_analyzer.run_analysis()
        audit_data["frontend_analysis"] = frontend_result
        all_findings.extend(frontend_result.get("findings", []))
        print(f"[+] Frontend Assets: {frontend_result['total_scripts']} scripts, {frontend_result['total_stylesheets']} stylesheets, {frontend_result['total_forms']} forms")
    except Exception as e:
        logger.warning(f"Frontend analysis error: {e}")
        frontend_result = {"first_party_scripts": [], "third_party_scripts": [], "forms": [], "total_scripts": 0, "total_stylesheets": 0, "total_forms": 0, "findings": []}
        audit_data["frontend_analysis"] = frontend_result

    # 13. Module: Frontend Web Quality, UI/UX, SEO, and Performance Audit
    try:
        print("[*] [8/14] Auditing Frontend UI/UX, SEO Health, Page Speed, and Accessibility...")
        quality_auditor = WebQualityAuditor(
            base_url=root_resp.url or scope.target_url,
            client=client,
            allow_local=getattr(args, 'allow_local_mock', False)
        )
        quality_result = quality_auditor.run_full_audit(root_resp=root_resp, crawled_pages=raw_crawled_pages)
        audit_data["web_quality_audit"] = quality_result
        for opt in quality_result.get("all_optimizations", []):
            all_findings.append({
                "severity": "MEDIUM" if opt.get("impact") == "HIGH" else ("LOW" if opt.get("impact") == "MEDIUM" else "INFO"),
                "category": f"Web Quality ({opt.get('category', 'SEO')})",
                "owasp_category": "A05:2021-Security Misconfiguration",
                "summary": opt.get("title", ""),
                "description": opt.get("description", ""),
                "evidence": f"Frontend Assessment ({opt.get('category', 'General')})",
                "remediation": opt.get("remediation", "")
            })
        if quality_result.get("summary"):
            print(f"[+] Web Quality Engine: Performance: {quality_result['summary']['performance_score']}/100 | SEO: {quality_result['summary']['seo_score']}/100 | UI/UX: {quality_result['summary']['ui_ux_score']}/100")
    except Exception as e:
        logger.warning(f"Web Quality audit error: {e}")
        audit_data["web_quality_audit"] = {
            "schema_version": 2,
            "available": False,
            "error": str(e),
            "errors": [str(e)],
            "summary": {
                "overall_web_health_score": 0,
                "performance_score": 0,
                "seo_score": 0,
                "ui_ux_score": 0,
                "grade": "F",
                "total_optimizations_found": 0,
                "pages_audited_count": 0
            },
            "pages_matrix": [],
            "all_optimizations": []
        }

    # 14. Module: Endpoint Discovery & API Inventory (with robots, sitemaps, specs, subdomains)
    try:
        print("[*] [8/13] Extracting API routes, sitemaps, robots.txt, and cataloguing endpoints...")
        endpoint_disco = EndpointDiscovery(base_url=root_resp.url or scope.target_url, scope_manager=scope)
        endpoint_result = endpoint_disco.extract_endpoints_from_html(root_resp.body)
        audit_data["endpoint_discovery"] = endpoint_result

        all_script_urls = list(set([s["src"] for s in frontend_result.get("first_party_scripts", [])] + crawled_scripts))
        api_analyzer = ApiInventoryAnalyzer(base_url=root_resp.url or scope.target_url, client=client)
        api_result = api_analyzer.run_inventory(
            html_content=root_resp.body,
            script_urls=all_script_urls,
            subdomains=domain_result.get("subdomains", []),
            spec_data=spec_data
        )
        audit_data["api_inventory"] = api_result
        all_findings.extend(api_result.get("findings", []))
        print(f"[+] API Inventory: {api_result['total_endpoints']} route(s) discovered, {len(api_result['documentation_specs'])} doc spec(s)")
    except Exception as e:
        logger.warning(f"API inventory error: {e}")
        api_result = {"total_endpoints": 0, "endpoints": [], "findings": []}
        endpoint_result = {"total_discovered": 0, "pages": [], "form_actions": [], "api_candidates": [], "assets": []}
        audit_data["api_inventory"] = api_result
        audit_data["endpoint_discovery"] = endpoint_result

    # 13. Module: Secrets and Sensitive Credentials Scanner
    try:
        print("[*] [8/12] Scanning client-side code, scripts, and config files for leaked secrets...")
        secrets_scanner = SecretsScanner(base_url=root_resp.url or scope.target_url, client=client)
        all_candidate_scripts = list(set([s["src"] for s in frontend_result.get("first_party_scripts", [])] + crawled_scripts))
        secrets_result = secrets_scanner.run_scan(crawled_pages=raw_crawled_pages, script_urls=all_candidate_scripts)
        audit_data["secrets_scanner"] = secrets_result
        all_findings.extend(secrets_result.get("findings", []))
        print(f"[+] Secrets Scanner: {secrets_result['total_secrets_found']} sensitive leak finding(s)")
    except Exception as e:
        logger.warning(f"Secrets scanner error: {e}")
        audit_data["secrets_scanner"] = {"total_secrets_found": 0, "findings": []}

    # 14. Module: Administrative Access Control & Backend API Accessibility Audit
    try:
        print("[*] [9/12] Auditing administrative route protection & backend API accessibility...")
        access_auditor = AccessControlAuditor(base_url=root_resp.url or scope.target_url, client=client)
        candidate_api_paths = [ep["path"] for ep in api_result.get("endpoints", [])]
        candidate_api_paths += [ep["path"] for ep in endpoint_result.get("api_candidates", []) if "path" in ep]
        access_result = access_auditor.run_audit(candidate_api_paths=list(set(candidate_api_paths)))
        audit_data["access_control_audit"] = access_result
        all_findings.extend(access_result.get("findings", []))

        # Update discovered endpoints with real-time access audit verification states
        state_map = access_result.get("endpoint_states", {})
        for ep in api_result.get("endpoints", []):
            p = ep.get("path")
            if p in state_map:
                ep["access_state"] = state_map[p]
        audit_data["api_inventory"] = api_result

        unprot_admin = [r for r in access_result.get("admin_routes", []) if r.get("protection_state") == "UNPROTECTED_EXPOSED"]
        print(f"[+] Access Control: Audited {access_result.get('admin_routes_audited', 0)} admin path(s) ({len(unprot_admin)} unprotected), {access_result.get('api_endpoints_audited', 0)} API route(s)")
    except Exception as e:
        logger.warning(f"Access control audit error: {e}")
        audit_data["access_control_audit"] = {"admin_routes_audited": 0, "admin_routes": [], "api_endpoints_audited": 0, "api_endpoints": [], "findings": []}

    # 12. Module: Technology Identification
    try:
        print("[*] [7/9] Identifying technology stack and framework fingerprints...")
        all_scripts = [s["src"] for s in frontend_result.get("first_party_scripts", []) + frontend_result.get("third_party_scripts", [])]
        tech_detector = TechnologyDetector(headers=root_resp.headers, html_content=root_resp.body, script_urls=all_scripts)
        tech_result = tech_detector.detect_all()
        audit_data["technology_detection"] = tech_result
        tech_names = [t["name"] for t in tech_result["technologies"][:5]]
        print(f"[+] Technologies Detected: {', '.join(tech_names) or 'No unique fingerprints disclosed'}")
    except Exception as e:
        logger.warning(f"Tech detection error: {e}")
        audit_data["technology_detection"] = {"technologies": []}

    # 13. Module: Cloud Indicators & Reliable Region Assessment
    try:
        print("[*] [8/9] Assessing cloud infrastructure & regional hosting indicators...")
        dns_cnames = dns_result.get("records", {}).get("CNAME", [])
        cloud_analyzer = CloudIndicatorAnalyzer(headers=root_resp.headers, dns_cnames=dns_cnames, resolved_ips=resolved_ips)
        cloud_result = cloud_analyzer.run_analysis()
        audit_data["cloud_indicators"] = cloud_result
        for c in cloud_result["cloud_indicators"]:
            print(f"    - {c['provider']} ({c['service']}) -> Region: {c['region']} [{c['region_confidence']}]")
    except Exception as e:
        logger.warning(f"Cloud indicators error: {e}")
        audit_data["cloud_indicators"] = {"cloud_indicators": []}

    # 14. Module: Conservative TCP Port Assessment
    try:
        print("[*] [9/9] Performing conservative port assessment on authorized host...")
        port_scanner = ConservativePortScanner(target_host=target_host)
        port_result = port_scanner.run_assessment()
        audit_data["port_scanner"] = port_result
        all_findings.extend(port_result.get("findings", []))
        open_port_nums = [p["port"] for p in port_result["open_ports"]]
        print(f"[+] Port Assessment: {len(open_port_nums)} open listener(s) discovered: {open_port_nums}")
    except Exception as e:
        logger.warning(f"Port scan error: {e}")
        audit_data["port_scanner"] = {"ports_scanned": 0, "open_ports": [], "all_results": []}



    # 16. Module: Comprehensive Nexentra Vulnerability & Configuration Assessment
    try:
        print("[*] Auditing CORS policies, cookie protections, HTTP verbs, CSP, mixed content, and sensitive file exposures...")
        vuln_scanner = VulnerabilityScanner(base_url=root_resp.url or scope.target_url, client=client)
        all_scripts_list = [s["src"] for s in frontend_result.get("first_party_scripts", []) + frontend_result.get("third_party_scripts", [])]
        tp_scripts = frontend_result.get("third_party_scripts", [])
        forms_list = frontend_result.get("forms", [])
        ep_list = api_result.get("endpoints", [])
        vuln_result = vuln_scanner.run_all_checks(
            initial_headers=root_resp.headers,
            initial_body=root_resp.body,
            script_urls=all_scripts_list,
            third_party_scripts=tp_scripts,
            discovered_forms=forms_list,
            discovered_endpoints=ep_list
        )
        audit_data["vulnerability_scanner"] = vuln_result
        all_findings.extend(vuln_result.get("findings", []))
        print(f"[+] Nexentra Vulnerability Engine: {vuln_result.get('total_vulnerability_findings', 0)} security issue(s) identified")
    except Exception as e:
        logger.warning(f"Vulnerability scanner error: {e}")
        audit_data["vulnerability_scanner"] = {"findings": [], "total_vulnerability_findings": 0}

    # 17. Generate Reports
    print("\n[*] Generating Nexentra timestamped audit reports (HTML + JSON)...")
    out_dir = args.output_dir or config.get("reporting", {}).get("output_dir", "reports")
    reporter = ReportGenerator(target_url=scope.target_url, audit_data=audit_data, output_dir=out_dir)
    report_paths = reporter.generate_all()

    # 17. Executive Terminal Summary
    print("\n" + "=" * 72)
    print("                 NEXENTRA EXECUTIVE AUDIT SUMMARY")
    print("=" * 72)
    print(f"Target Host       : {target_host}")
    print(f"Security Grade    : {headers_result['grade']} (Score: {headers_result['score']}/100)")
    
    # Severity breakdown
    sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    for f in all_findings:
        s = f.get("severity", "INFO").upper()
        sev_counts[s] = sev_counts.get(s, 0) + 1

    print(f"Findings Total    : {len(all_findings)}")
    print(f"  - CRITICAL      : {sev_counts['CRITICAL']}")
    print(f"  - HIGH          : {sev_counts['HIGH']}")
    print(f"  - MEDIUM        : {sev_counts['MEDIUM']}")
    print(f"  - LOW           : {sev_counts['LOW']}")
    print(f"  - INFORMATIONAL : {sev_counts['INFO']}")

    # Highlight top 3 high/critical items
    top_findings = [f for f in all_findings if f.get("severity") in ("CRITICAL", "HIGH")]
    if top_findings:
        print("\nTop Priority Remediation Items:")
        for idx, tf in enumerate(top_findings[:3], 1):
            print(f"  {idx}. [{tf['severity']}] {tf['summary']}")
            print(f"     Action: {tf.get('remediation', 'N/A')}")

    print("\nGenerated Reports:")
    print(f"  [*] JSON Report : {report_paths['json']}")
    print(f"  [*] HTML Report : {report_paths['html']}")
    print("=" * 72 + "\n")

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Defensive Website Security Audit Toolkit - Authorized Configuration Assessment",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py https://example.com --authorized
  python main.py https://example.com --dry-run
  python main.py --test-target
        """
    )
    parser.add_argument("url", nargs="?", default="", help="Website URL to assess (e.g. https://example.com)")
    parser.add_argument("--authorized", "--confirm-authorized", action="store_true",
                        help="Confirm operator authorization to assess the target")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate scope and display planned checks without dispatching requests")
    parser.add_argument("--config", default="config.yaml", help="Path to config.yaml configuration file")
    parser.add_argument("--output-dir", default="reports", help="Directory where reports will be saved")
    parser.add_argument("--allow-local-mock", "--test-target", action="store_true",
                        help="Permit loopback testing against the local mock target")
    parser.add_argument("--auth-token", "--bearer-token", default=None,
                        help="Optional Bearer token or authorization secret for authenticated API scanning")
    parser.add_argument("--cookie", default=None,
                        help="Optional session Cookie header value for authenticated session-aware scanning")
    parser.add_argument("--spec-file", default=None,
                        help="Path to an OpenAPI/Swagger JSON/YAML or Postman Collection file for complete route ingestion")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose debug logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    config = load_config(args.config)

    # Handle local test target convenience option
    if getattr(args, "allow_local_mock", False) and not args.url:
        print("[*] Initializing local mock target test on http://127.0.0.1:8088 ...")
        # Run local test suite directly
        from tests.mock_server import start_mock_server_in_background
        server, port = start_mock_server_in_background()
        target_url = f"http://127.0.0.1:{port}"
        args.authorized = True
        args.allow_local_mock = True
        try:
            return run_audit(target_url, args, config)
        finally:
            server.shutdown()

    if not args.url:
        parser.print_help()
        sys.exit(1)

    code = run_audit(args.url, args, config)
    sys.exit(code)


if __name__ == "__main__":
    main()

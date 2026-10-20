"""
Report Generator Module
=======================
Generates comprehensive, timestamped defensive audit reports in JSON and interactive HTML.
Includes executive summaries, severity-graded findings, clear evidence chains,
confidence scores, and actionable remediation snippets.
"""

from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import re
from typing import Any, Dict, List

import socket
import urllib.request
try:
    import requests
except ImportError:
    requests = None

from .scope_manager import ScopeManager

logger = logging.getLogger("DefensiveAudit.ReportGenerator")


def fetch_domain_subdomains(target_url: str) -> list:
    """Discovers subdomains via Certificate Transparency (crt.sh) and resolves IPs."""
    clean_domain = target_url.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
    
    # Extract root domain (e.g. test.fipmoney.com -> fipmoney.com)
    domain_parts = clean_domain.split('.')
    if len(domain_parts) >= 2:
        root_domain = '.'.join(domain_parts[-2:])
    else:
        root_domain = clean_domain
    subdomains = {clean_domain}
    try:
        url = f"https://crt.sh/?q=%.{root_domain}&output=json"
        entries = None
        if requests is not None:
            try:
                resp = requests.get(url, timeout=12, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                if resp.status_code == 200:
                    entries = resp.json()
            except Exception:
                pass

        if entries is None:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    entries = json.loads(response.read().decode("utf-8", errors="replace"))

        if entries and isinstance(entries, list):
            for entry in entries:
                name_val = entry.get("name_value", "")
                for sub in name_val.split("\n"):
                    sub = sub.strip().lower()
                    if "*" not in sub and (sub.endswith(f".{root_domain}") or sub == root_domain):
                        subdomains.add(sub)
    except Exception as e:
        logger.debug(f"crt.sh query note: {e}")

    results = []
    for sub in sorted(subdomains):
        ip = "Unresolved"
        is_live = False
        try:
            ip = socket.gethostbyname(sub)
            is_live = True
        except Exception:
            pass
        results.append({
            "subdomain": sub,
            "hostname": sub,
            "ip_address": ip,
            "resolved_ips": [ip] if is_live else [],
            "status": "ACTIVE" if is_live else "INACTIVE",
            "source": "Certificate Transparency (crt.sh)"
        })
    return results


class ReportGenerator:
    """Generates structured defensive JSON and HTML audit reports."""

    def __init__(self, target_url: str, audit_data: Dict[str, Any], output_dir: str = "reports"):
        self.target_url = target_url
        self.audit_data = audit_data
        self.output_dir = Path(output_dir)
        self.timestamp = datetime.now(timezone.utc)
        self.timestamp_str = self.timestamp.strftime("%Y%m%d_%H%M%S")
        self.iso_timestamp = self.timestamp.isoformat()

        # Clean filename prefix
        safe_host = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", audit_data.get("target_host", "target"))
        self.filename_base = f"audit_report_{safe_host}_{self.timestamp_str}"

        # Clean & categorize API inventory
        apis_data = self.audit_data.get("api_inventory", {})
        if isinstance(apis_data, dict):
            all_api_endpoints = list(apis_data.get("endpoints", []))
        elif isinstance(apis_data, list):
            all_api_endpoints = list(apis_data)
        else:
            all_api_endpoints = []

        SPA_ROUTES = {'/about', '/contact', '/privacy', '/terms', '/login', '/register', '/signup', '/signin', '/home', '/dashboard', '/features', '/pricing', '/faq', '/help', '/support', '/status', '/settings', '/profile', '/explore', '/checkout'}
        for item in all_api_endpoints:
            path = item.get('path', '')
            clean = path.split('?')[0].lower()
            if not item.get('subgroup') or item.get('subgroup') == 'General Endpoints':
                if clean in SPA_ROUTES:
                    item['confidence'] = 'LOW'
                    if not item.get('summary'):
                        item['summary'] = 'Client-side SPA view route (Not a backend API)'
                    item['category'] = 'CLIENT_SPA_ROUTE'
                    item['subgroup'] = 'Client SPA Routes'
                elif any(clean.startswith(p) for p in ['/api', '/v1', '/v2', '/v3', '/graphql', '/rest', '/payment', '/payments', '/demo', '/auth', '/scheduler', '/security', '/push-notification', '/user', '/orders', '/webhook', '/data', '/search', '/utility', '/admin']):
                    if not item.get('confidence'):
                        item['confidence'] = 'HIGH'
                    if not item.get('summary'):
                        item['summary'] = 'Backend REST/Service API route'
                    item['category'] = 'API'
                    item['subgroup'] = 'General Backend APIs'

        if isinstance(apis_data, dict):
            apis_data["endpoints"] = all_api_endpoints
            apis_data["total_endpoints"] = len(all_api_endpoints)
            self.audit_data["api_inventory"] = apis_data
        else:
            self.audit_data["api_inventory"] = {"endpoints": all_api_endpoints, "total_endpoints": len(all_api_endpoints)}

        # Populate and standardize subdomains
        existing_subdomains = self.audit_data.get("subdomains") or self.audit_data.get("domain_discovery", {}).get("subdomains", [])
        if existing_subdomains:
            normalized_subs = []
            for s in existing_subdomains:
                sub_name = s.get("subdomain") or s.get("hostname", "")
                ips = s.get("resolved_ips", [])
                ip_val = s.get("ip_address") or (ips[0] if ips else "Unresolved")
                is_act = s.get("status") in ("ACTIVE", "ACTIVE_RESOLVED") or (ip_val not in ("Unresolved", "None"))
                normalized_subs.append({
                    "subdomain": sub_name,
                    "hostname": sub_name,
                    "ip_address": ip_val,
                    "resolved_ips": ips or ([ip_val] if is_act else []),
                    "status": "ACTIVE" if is_act else "INACTIVE",
                    "source": s.get("source", "Certificate Transparency (crt.sh)")
                })
            self.audit_data["subdomains"] = normalized_subs
        elif "domain_discovery" in self.audit_data or "subdomains" in self.audit_data:
            self.audit_data["subdomains"] = []
        else:
            self.audit_data["subdomains"] = fetch_domain_subdomains(self.target_url)

        # Sync to domain_discovery
        if "domain_discovery" not in self.audit_data or not isinstance(self.audit_data["domain_discovery"], dict):
            self.audit_data["domain_discovery"] = {}
        self.audit_data["domain_discovery"]["subdomains"] = self.audit_data["subdomains"]
        self.audit_data["domain_discovery"]["total_discovered"] = len(self.audit_data["subdomains"])

    def generate_all(self) -> Dict[str, str]:
        """Generate both JSON and HTML reports, returning their file paths."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        json_path = self.generate_json()
        html_path = self.generate_html()

        return {
            "json": str(json_path),
            "html": str(html_path)
        }

    def generate_json(self) -> Path:
        """Export raw audit findings and asset inventory to JSON."""
        file_path = self.output_dir / f"{self.filename_base}.json"
        
        posture = self._compute_overall_posture()

        # Build structured JSON payload
        payload = {
            "metadata": {
                "toolkit": "Nexentra Security Audit",
                "version": "2.0.0",
                "engine": "Nexentra Cyber Defense Engine",
                "target_url": self.target_url,
                "target_host": self.audit_data.get("target_host"),
                "audit_timestamp_utc": self.iso_timestamp,
                "operator_authorized": self.audit_data.get("operator_authorized", True),
                "scope_enforced": True,
            },
            "summary": {
                "overall_score": posture["score"],
                "overall_grade": posture["grade"],
                "total_findings": len(self.audit_data.get("all_findings", [])),
                "severity_breakdown": self._count_severities(),
                "posture_breakdown": posture["breakdown"]
            },
            "findings": self.audit_data.get("all_findings", []),
            "subdomains": self.audit_data.get("subdomains", []),
            "base_url_configuration": self.audit_data.get("api_inventory", {}).get("base_url_configuration", {}),
            "frontend_routes": self.audit_data.get("api_inventory", {}).get("frontend_routes", []),
            "api_inventory": self.audit_data.get("api_inventory", {}).get("endpoints", []),
            "web_quality_audit": self.audit_data.get("web_quality_audit", {}),
            "modules": {
                "web_quality_audit": self.audit_data.get("web_quality_audit", {}),
                "domain_discovery": self.audit_data.get("domain_discovery", {}),
                "dns_analysis": self.audit_data.get("dns_analysis", {}),
                "port_scanner": self.audit_data.get("port_scanner", {}),
                "tls_audit": self.audit_data.get("tls_audit", {}),
                "security_headers": self.audit_data.get("security_headers", {}),
                "frontend_analysis": self.audit_data.get("frontend_analysis", {}),
                "crawler": self.audit_data.get("crawler", {}),
                "secrets_scanner": self.audit_data.get("secrets_scanner", {}),
                "access_control_audit": self.audit_data.get("access_control_audit", {}),
                "vulnerability_scanner": self.audit_data.get("vulnerability_scanner", {}),
                "api_inventory": self.audit_data.get("api_inventory", {}),
                "endpoint_discovery": self.audit_data.get("endpoint_discovery", {}),
                "technology_detection": self.audit_data.get("technology_detection", {}),
                "cloud_indicators": self.audit_data.get("cloud_indicators", {}),
            },
            "limitations_and_disclaimer": [
                "Defensive, read-only configuration assessment conducted strictly within authorized scope.",
                "Observations are derived from non-intrusive network probing and publicly observable metadata.",
                "Non-discovery of an issue or endpoint does not guarantee its non-existence."
            ]
        }

        # Apply sensitive data redaction to payload object safely before JSON serialization
        def _redact_node(node):
            if hasattr(node, "__dict__"):
                return {k: _redact_node(v) for k, v in node.__dict__.items() if not k.startswith('_')}
            elif isinstance(node, str):
                return ScopeManager.redact_sensitive(node)
            elif isinstance(node, dict):
                return {k: _redact_node(v) for k, v in node.items()}
            elif isinstance(node, (list, tuple, set)):
                return [_redact_node(item) for item in node]
            return node

        safe_payload = _redact_node(payload)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(safe_payload, f, indent=2, ensure_ascii=False)

        logger.info(f"JSON audit report saved to {file_path}")
        return file_path

    def generate_html(self) -> Path:
        """Export polished, interactive defensive audit dashboard to HTML."""
        file_path = self.output_dir / f"{self.filename_base}.html"
        
        counts = self._count_severities()
        posture = self._compute_overall_posture()
        grade = posture["grade"]
        score = posture["score"]
        findings = self.audit_data.get("all_findings", [])
        
        # Color mapping for grade
        grade_colors = {
            "A": "#10b981",
            "B": "#3b82f6",
            "C": "#f59e0b",
            "D": "#f97316",
            "F": "#ef4444"
        }
        grade_color = grade_colors.get(grade, "#64748b")

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexentra Security Audit Report - {self.audit_data.get('target_host', 'Target')}</title>
  <style>
    :root {{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent-blue: #0284c7;
      --accent-green: #059669;
      --accent-yellow: #d97706;
      --accent-red: #dc2626;
      --accent-purple: #7c3aed;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: #334155;
      line-height: 1.6;
      padding: 24px;
    }}
    .container {{ max-width: 1300px; margin: 0 auto; }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}
    .brand h1 {{ font-size: 1.75rem; font-weight: 800; color: #0f172a; }}
    .brand p {{ color: var(--text-muted); font-size: 0.9rem; }}
    .badge {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }}
    .badge-authorized {{ background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }}
    .badge-critical {{ background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }}
    .badge-high {{ background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }}
    .badge-medium {{ background: #fefce8; color: #a16207; border: 1px solid #fef08a; }}
    .badge-low {{ background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }}
    .badge-info {{ background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }}

    /* Metrics Grid */
    .metrics-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }}
    .metric-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 20px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    .metric-title {{ font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }}
    .metric-value {{ font-size: 2rem; font-weight: 800; margin-top: 6px; color: #0f172a; }}
    .grade-badge {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      font-size: 1.8rem;
      font-weight: 900;
      color: #fff;
      background: {grade_color};
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }}

    /* Tabs Layout */
    .tabs {{
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 20px;
      overflow-x: auto;
    }}
    .tab-btn {{
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 10px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }}
    .tab-btn.active {{
      color: var(--accent-blue);
      border-bottom-color: var(--accent-blue);
    }}
    .tab-content {{ display: none; }}
    .tab-content.active {{ display: block; }}

    /* Cards & Tables */
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }}
    .card h2 {{ font-size: 1.25rem; margin-bottom: 16px; color: #0f172a; display: flex; align-items: center; justify-content: space-between; font-weight: 800; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin-top: 10px;
    }}
    th, td {{
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }}
    th {{ color: var(--text-muted); font-weight: 700; font-size: 0.78rem; text-transform: uppercase; background: #f8fafc; }}
    td {{ color: #0f172a; }}
    tr:hover {{ background: #f8fafc; }}
    
    .code-box {{
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: Consolas, Monaco, monospace;
      font-size: 0.85rem;
      color: #0f172a;
      overflow-x: auto;
      margin-top: 8px;
    }}
    .finding-item {{
      background: #ffffff;
      border: 1px solid var(--card-border);
      border-left: 4px solid #64748b;
      border-radius: 6px;
      padding: 18px;
      margin-bottom: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }}
    .finding-critical {{ border-left-color: var(--accent-red); }}
    .finding-high {{ border-left-color: #ea580c; }}
    .finding-medium {{ border-left-color: var(--accent-yellow); }}
    .finding-low {{ border-left-color: #2563eb; }}
    .finding-info {{ border-left-color: #64748b; }}

    .finding-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .finding-title {{ font-size: 1.05rem; font-weight: 700; color: #0f172a; }}
    .finding-desc {{ color: #334155; font-size: 0.92rem; margin-bottom: 10px; }}
    .finding-meta {{
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--card-border);
    }}
    .alert-box {{
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 14px 18px;
      border-radius: 6px;
      font-size: 0.88rem;
      color: #334155;
      margin-bottom: 20px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
          <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.25rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
            &#9670;
          </div>
          <div>
            <h1 style="font-size: 1.7rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1;">Nexentra Security Audit</h1>
            <div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-blue); font-weight: 700; margin-top: 2px;">
              Defensive Security Audit Report &bull; Enterprise Web Vulnerability &amp; Configuration Assessment
            </div>
          </div>
        </div>
        <p>Target: <strong>{self.target_url}</strong> &bull; Host: <code>{self.audit_data.get('target_host')}</code></p>
        <p>Assessed: {self.iso_timestamp} (UTC) &bull; Engine: Nexentra Enterprise v2.0</p>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge badge-authorized">&#10003; Nexentra Shield Verified</span>
        <button onclick="window.print()" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 7px 14px; border-radius: 6px; font-weight: 700; font-size: 0.82rem; cursor: pointer; color: #334155;">
          &#128438; Export PDF
        </button>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid">
      <div class="metric-card" style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="metric-title">Composite Security Posture</div>
          <div class="metric-value">{score}/100</div>
        </div>
        <div class="grade-badge">{grade}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Critical & High Findings</div>
        <div class="metric-value" style="color: {var_danger_col(counts['CRITICAL'] + counts['HIGH'])};">{counts['CRITICAL'] + counts['HIGH']}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Total Identified Assets</div>
        <div class="metric-value" style="color: var(--accent-blue);">{self._total_assets_count()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Discovered API Routes</div>
        <div class="metric-value" style="color: var(--accent-purple);">{len(self.audit_data.get('api_inventory', {}).get('endpoints', []))}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Sensitive Leaks Found</div>
        <div class="metric-value" style="color: {'var(--accent-red)' if len(self.audit_data.get('secrets_scanner', {}).get('findings', [])) > 0 else 'var(--accent-green)'};">{len(self.audit_data.get('secrets_scanner', {}).get('findings', []))}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Admin Routes Audited</div>
        <div class="metric-value" style="color: var(--accent-blue);">{self.audit_data.get('access_control_audit', {}).get('admin_routes_audited', 0)}</div>
      </div>
    </div>

    <!-- Legal & Methodological Disclaimer -->
    <div class="alert-box">
      <strong>Audit Scope & Safety Controls:</strong> This report represents a non-destructive configuration review conducted in strict adherence to defensive authorization guidelines.
      Evaluations are limited to publicly observable network indicators, DNS responses, TLS handshakes, HTTP response headers, and referenced client assets.
      Zero exploitation, fuzzing, credential attempts, or state alterations were performed.
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="openTab(event, 'tab-findings')">Findings & Remediation ({len(findings)})</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-vulnerabilities')">Vulnerabilities & CORS ({len(self.audit_data.get('vulnerability_scanner', {}).get('findings', []))})</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-headers')">Defensive Headers</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-secrets')">Secrets & Leaks ({len(self.audit_data.get('secrets_scanner', {}).get('findings', []))})</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-access')">Access Control & Admin ({self.audit_data.get('access_control_audit', {}).get('admin_routes_audited', 0)})</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-crawler')">Site Crawler ({self.audit_data.get('crawler', {}).get('total_pages_crawled', 0)})</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-tls')">TLS / SSL</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-dns')">DNS & Mail Auth</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-apis')">API Inventory</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-frontend')">Frontend Assets</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-ports')">Open Ports</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-tech')">Technology & Cloud</button>
      <button class="tab-btn" onclick="openTab(event, 'tab-subdomains')">Subdomains</button>
    </div>

    <!-- TAB 1: Findings -->
    <div id="tab-findings" class="tab-content active">
      <div class="card">
        <h2>Defensive Security Findings</h2>
        {self._render_findings_html(findings)}
      </div>
    </div>

    <!-- TAB 2: Vulnerabilities & CORS -->
    <div id="tab-vulnerabilities" class="tab-content">
      <div class="card">
        <h2>Defensive Vulnerabilities, CORS & Security Probes</h2>
        {self._render_vulnerabilities_html()}
      </div>
    </div>

    <!-- TAB 3: Headers -->
    <div id="tab-headers" class="tab-content">
      <div class="card">
        <h2>HTTP Security Headers Assessment (Grade: {grade} - Score: {score}%)</h2>
        <table>
          <thead>
            <tr>
              <th>Header</th>
              <th>Status</th>
              <th>Observed Value</th>
            </tr>
          </thead>
          <tbody>
            {self._render_headers_table()}
          </tbody>
        </table>
        
        <h3 style="margin-top: 24px; margin-bottom: 12px; color: #fff;">Server Hardening Remediation Snippets</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">Copy and paste into your web server configuration to implement missing defensive protections:</p>
        
        <h4 style="color: var(--accent-blue); font-size: 0.9rem; margin-top: 12px;">Nginx Configuration</h4>
        <div class="code-box">{self.audit_data.get('security_headers', {}).get('remediation_snippets', {}).get('nginx', 'N/A')}</div>

        <h4 style="color: var(--accent-blue); font-size: 0.9rem; margin-top: 12px;">Apache Configuration (.htaccess or VirtualHost)</h4>
        <div class="code-box">{self.audit_data.get('security_headers', {}).get('remediation_snippets', {}).get('apache', 'N/A')}</div>
      </div>
    </div>

    <!-- TAB 3: TLS -->
    <div id="tab-tls" class="tab-content">
      <div class="card">
        <h2>TLS / SSL Certificate & Cryptographic Configuration</h2>
        {self._render_tls_html()}
      </div>
    </div>

    <!-- TAB 4: DNS -->
    <div id="tab-dns" class="tab-content">
      <div class="card">
        <h2>DNS Records & Mail Anti-Spoofing (SPF, DMARC, MX)</h2>
        {self._render_dns_html()}
      </div>
    </div>

    <!-- TAB 5: API Inventory -->
    <div id="tab-apis" class="tab-content">
      <div class="card">
        <h2>Observable API Endpoints & Routes</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 14px;">
          Publicly referenced endpoints extracted from documentation specs, page markup, and client scripts.
        </p>
        {self._render_apis_html()}
      </div>
    </div>

    <!-- TAB 6: Frontend -->
    <div id="tab-frontend" class="tab-content">
      <div class="card">
        <h2>Frontend Asset Inventory (Scripts, Styles, Forms)</h2>
        {self._render_frontend_html()}
      </div>
    </div>

    <!-- TAB 7: Ports -->
    <div id="tab-ports" class="tab-content">
      <div class="card">
        <h2>Conservative Port Assessment</h2>
        {self._render_ports_html()}
      </div>
    </div>

    <!-- TAB 8: Tech & Cloud -->
    <div id="tab-tech" class="tab-content">
      <div class="card">
        <h2>Technology Identification & Cloud Indicators</h2>
        {self._render_tech_and_cloud_html()}
      </div>
    </div>

    <!-- TAB 9: Subdomains -->
    <div id="tab-subdomains" class="tab-content">
      <div class="card">
        <h2>Observable Subdomains</h2>
        {self._render_subdomains_html()}
      </div>
    </div>

    <!-- TAB 10: Secrets & Sensitive Leaks -->
    <div id="tab-secrets" class="tab-content">
      <div class="card">
        <h2>Secrets & Sensitive Leaks Scanner</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 14px;">
          Defensively scans client-side JavaScript bundles, HTML, and exposed configuration files (.env, .git, etc.) for leaked credentials.
        </p>
        {self._render_secrets_html()}
      </div>
    </div>

    <!-- TAB 11: Access Control & Admin Protection -->
    <div id="tab-access" class="tab-content">
      <div class="card">
        <h2>Administrative Access Control & Protected Routes</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 14px;">
          Evaluates whether management paths (/admin, /dashboard, etc.) enforce authentication or redirect to login challenges.
        </p>
        {self._render_access_control_html()}
      </div>
    </div>

    <!-- TAB 12: In-Scope Web Crawler -->
    <div id="tab-crawler" class="tab-content">
      <div class="card">
        <h2>In-Scope Web Crawler & Site Topology</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 14px;">
          Bounded breadth-first traversal of internal pages within authorized scope.
        </p>
        {self._render_crawler_html()}
      </div>
    </div>

    <footer style="margin-top: 40px; text-align: center; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid var(--card-border); padding-top: 20px;">
      Nexentra Security Audit v2.0.0 &bull; Enterprise Cyber Defense Assessment &bull; {self.timestamp.strftime("%Y-%m-%d %H:%M:%S")} UTC
    </footer>
  </div>

  <script>
    function openTab(evt, tabName) {{
      var i, tabcontent, tablinks;
      tabcontent = document.getElementsByClassName("tab-content");
      for (i = 0; i < tabcontent.length; i++) {{
        tabcontent[i].classList.remove("active");
      }}
      tablinks = document.getElementsByClassName("tab-btn");
      for (i = 0; i < tablinks.length; i++) {{
        tablinks[i].classList.remove("active");
      }}
      document.getElementById(tabName).classList.add("active");
      evt.currentTarget.classList.add("active");
    }}
  </script>
</body>
</html>"""

        # Redact sensitive patterns from HTML output
        redacted_html = ScopeManager.redact_sensitive(html)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(redacted_html)

        logger.info(f"HTML audit report saved to {file_path}")
        return file_path

    def _count_severities(self) -> Dict[str, int]:
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        for f in self.audit_data.get("all_findings", []):
            sev = f.get("severity", "INFO").upper()
            if sev in counts:
                counts[sev] += 1
            else:
                counts["INFO"] += 1
        return counts

    def _total_assets_count(self) -> int:
        fe = self.audit_data.get("frontend_analysis", {})
        scripts = fe.get("total_scripts", 0)
        styles = fe.get("total_stylesheets", 0)
        forms = fe.get("total_forms", 0)
        subdomains = self.audit_data.get("domain_discovery", {}).get("total_discovered", 0)
        return scripts + styles + forms + subdomains

    def _render_findings_html(self, findings: List[Dict[str, Any]]) -> str:
        if not findings:
            return "<p style='color: var(--text-muted);'>No security deficiencies discovered under the current ruleset.</p>"

        # Sort findings: CRITICAL > HIGH > MEDIUM > LOW > INFO
        order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        sorted_findings = sorted(findings, key=lambda x: order.get(x.get("severity", "INFO"), 5))

        items = []
        for f in sorted_findings:
            sev = f.get("severity", "INFO").upper()
            badge_class = f"badge-{sev.lower()}"
            conf = f.get("confidence", "CONFIRMED")
            items.append(f"""
            <div class="finding-item finding-{sev.lower()}">
              <div class="finding-header">
                <span class="finding-title">{f.get('summary', 'Finding')}</span>
                <div>
                  <span class="badge {badge_class}">{sev}</span>
                  <span class="badge badge-info" style="margin-left: 6px;">{conf}</span>
                  <span class="badge badge-low" style="margin-left: 6px; font-weight: 600;">{f.get('owasp_category', 'A05:2021-Security Misconfiguration')}</span>
                </div>
              </div>
              <div class="finding-desc">{f.get('description', '')}</div>
              <div style="font-size: 0.88rem; color: #94a3b8;">
                <strong>Evidence:</strong> <code>{f.get('evidence', 'N/A')}</code>
              </div>
              <div class="finding-meta">
                <strong style="color: var(--accent-blue);">&#10148; Remediation:</strong> {f.get('remediation', 'N/A')}
              </div>
            </div>
            """)
        return "".join(items)

    def _render_headers_table(self) -> str:
        sec = self.audit_data.get("security_headers", {})
        present = sec.get("present_headers", {})
        missing = sec.get("missing_headers", [])

        rows = []
        # Missing
        for m in missing:
            rows.append(f"""
            <tr>
              <td><code>{m}</code></td>
              <td><span class="badge badge-critical">MISSING</span></td>
              <td style="color: var(--text-muted);">None observed</td>
            </tr>
            """)
        # Present
        for h, v in present.items():
            rows.append(f"""
            <tr>
              <td><code>{h}</code></td>
              <td><span class="badge badge-authorized">PRESENT</span></td>
              <td><code>{v[:90] + ('...' if len(v) > 90 else '')}</code></td>
            </tr>
            """)
        return "".join(rows)

    def _render_tls_html(self) -> str:
        tls = self.audit_data.get("tls_audit", {})
        cert = tls.get("certificate", {})
        conn = tls.get("connection", {})

        if not cert and not conn:
            return "<p style='color: var(--text-muted);'>No TLS service available on port 443.</p>"

        subj = cert.get("subject", {})
        issuer = cert.get("issuer", {})
        sans = cert.get("sans", [])

        return f"""
        <table>
          <tbody>
            <tr><th>Subject Common Name</th><td><code>{subj.get('commonName', 'N/A')}</code></td></tr>
            <tr><th>Certificate Issuer</th><td><code>{issuer.get('organizationName', 'N/A')} ({issuer.get('commonName', '')})</code></td></tr>
            <tr><th>Validity Period</th><td>{cert.get('valid_from', 'N/A')} &rarr; {cert.get('valid_to', 'N/A')}</td></tr>
            <tr><th>Days Until Expiry</th><td><strong>{cert.get('days_remaining', 'N/A')} days</strong></td></tr>
            <tr><th>TLS Protocol</th><td><code>{conn.get('protocol_version', 'N/A')}</code></td></tr>
            <tr><th>Negotiated Cipher</th><td><code>{conn.get('cipher_name', 'N/A')} ({conn.get('cipher_bits', 0)} bits)</code></td></tr>
            <tr><th>SAN Hostnames ({len(sans)})</th><td style="font-size: 0.85rem;"><code>{', '.join(sans[:10])}{' ...' if len(sans) > 10 else ''}</code></td></tr>
          </tbody>
        </table>
        """

    def _render_dns_html(self) -> str:
        dns = self.audit_data.get("dns_analysis", {})
        records = dns.get("records", {})
        dmarc = dns.get("dmarc_records", [])

        rows = []
        for rtype, vals in records.items():
            val_str = "<br>".join([f"<code>{v}</code>" for v in vals]) if vals else "<span style='color: var(--text-muted);'>None discovered</span>"
            rows.append(f"<tr><th>{rtype} Records</th><td>{val_str}</td></tr>")

        dmarc_str = "<br>".join([f"<code>{d}</code>" for d in dmarc]) if dmarc else "<span style='color: var(--text-muted);'>None discovered</span>"
        rows.append(f"<tr><th>DMARC (_dmarc.{dns.get('domain', '')})</th><td>{dmarc_str}</td></tr>")

        return f"<table><tbody>{''.join(rows)}</tbody></table>"

    def _render_apis_html(self) -> str:
        api_data = self.audit_data.get("api_inventory", {})
        apis = api_data.get("endpoints", [])
        frontend_routes = api_data.get("frontend_routes", [])
        base_urls = api_data.get("base_url_configuration", {})

        if not apis and not frontend_routes:
            return "<p style='color: var(--text-muted);'>No public API routes were identified.</p>"

        sections = []

        # 1. Base URL Configuration
        envs = base_urls.get("environments", [])
        if envs:
            env_rows = []
            for e in envs:
                active_badge = "<span class='badge badge-authorized'>ACTIVE TARGET</span>" if e.get("active_for_target") else "<span class='badge badge-info'>STANDBY</span>"
                env_rows.append(f"""
                <tr>
                  <td><strong>{e.get('environment')}</strong></td>
                  <td><code>{e.get('base_url')}</code></td>
                  <td>{active_badge}</td>
                  <td style="color: var(--text-muted); font-size: 0.82rem;">{e.get('condition')}</td>
                </tr>
                """)
            sections.append(f"""
            <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 8px;">1. API Base URL & Runtime Environment Architecture</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
              Dynamic API base resolution identified across web, mobile, and preview deployment environments.
            </p>
            <table>
              <thead><tr><th>Target Environment</th><th>Resolved Base URL</th><th>Status</th><th>Condition / Context</th></tr></thead>
              <tbody>{''.join(env_rows)}</tbody>
            </table>
            """)

        # 2. Frontend Application Routes (Pages & Views)
        if frontend_routes:
            fe_groups: Dict[str, List[Dict[str, Any]]] = {}
            for r in frontend_routes:
                grp = r.get("subgroup") or "Client SPA Routes"
                if grp not in fe_groups:
                    fe_groups[grp] = []
                fe_groups[grp].append(r)

            fe_sections = []
            for grp_name, routes in fe_groups.items():
                r_rows = []
                for r in routes:
                    r_rows.append(f"""
                    <tr>
                      <td><code>{r.get('path')}</code></td>
                      <td><span class='badge badge-info'>VIEW</span></td>
                      <td><strong>{r.get('summary', 'Client View')}</strong></td>
                      <td style="color: var(--text-muted); font-size: 0.82rem;">{r.get('source', 'SPA Router')}</td>
                    </tr>
                    """)
                fe_sections.append(f"""
                <h4 style="color: var(--accent-blue); font-size: 0.95rem; margin-top: 14px; margin-bottom: 6px;">{grp_name} ({len(routes)})</h4>
                <table>
                  <thead><tr><th style="width: 280px;">Frontend Route</th><th style="width: 100px;">Type</th><th>Page Summary & Purpose</th><th>Source Origin</th></tr></thead>
                  <tbody>{''.join(r_rows)}</tbody>
                </table>
                """)

            sections.append(f"""
            <h3 style="color: #fff; font-size: 1.1rem; margin-top: 28px; margin-bottom: 8px;">2. Frontend Application Routes (Pages & Views) &mdash; {len(frontend_routes)} Routes</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
              Client-side Single Page Application (SPA) view routes extracted from client router topology and state switches.
            </p>
            {''.join(fe_sections)}
            """)

        # 3. Backend API Endpoints (Categorized by Domain)
        backend_apis = [ep for ep in apis if ep.get("category") != "CLIENT_SPA_ROUTE"]
        if not backend_apis:
            backend_apis = apis

        api_groups: Dict[str, List[Dict[str, Any]]] = {}
        for ep in backend_apis:
            grp = ep.get("subgroup") or "General Backend APIs"
            if grp not in api_groups:
                api_groups[grp] = []
            api_groups[grp].append(ep)

        api_sections = []
        for grp_name, group_eps in api_groups.items():
            ep_rows = []
            for ep in group_eps:
                methods_html = " ".join([
                    f"<span class='badge {'badge-critical' if 'DELETE' in m else 'badge-low' if 'GET' in m else 'badge-medium' if 'POST' in m else 'badge-info'}'>{m}</span>"
                    for m in ep.get("methods", ["GET"])
                ])
                params_str = ", ".join(ep.get("parameters", [])) if ep.get("parameters") else "<span style='color: var(--text-muted);'>None</span>"

                ep_rows.append(f"""
                <tr>
                  <td><code>{ep.get('path')}</code></td>
                  <td>{methods_html}</td>
                  <td><strong>{ep.get('summary') or 'Backend service endpoint'}</strong></td>
                  <td><code>{params_str}</code></td>
                  <td><span class='badge badge-info'>{ep.get('confidence', 'HIGH')}</span></td>
                  <td style="color: var(--text-muted); font-size: 0.8rem;">{ep.get('source')}</td>
                </tr>
                """)

            api_sections.append(f"""
            <h4 style="color: var(--accent-purple); font-size: 0.95rem; margin-top: 16px; margin-bottom: 6px;">{grp_name} ({len(group_eps)})</h4>
            <table>
              <thead>
                <tr>
                  <th style="width: 260px;">Endpoint Path</th>
                  <th style="width: 140px;">Method</th>
                  <th>Functional Description</th>
                  <th style="width: 140px;">Parameters</th>
                  <th style="width: 90px;">Confidence</th>
                  <th style="width: 160px;">Source</th>
                </tr>
              </thead>
              <tbody>{''.join(ep_rows)}</tbody>
            </table>
            """)

        sections.append(f"""
        <h3 style="color: #fff; font-size: 1.1rem; margin-top: 28px; margin-bottom: 8px;">3. Backend API Endpoints & Services &mdash; {len(backend_apis)} Endpoints</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Backend API endpoints categorized by functional subsystem with HTTP verbs, authentication requirements, and dynamic parameters.
        </p>
        {''.join(api_sections)}
        """)

        return "".join(sections)

    def _render_frontend_html(self) -> str:
        fe = self.audit_data.get("frontend_analysis", {})
        scripts = fe.get("first_party_scripts", []) + fe.get("third_party_scripts", [])
        forms = fe.get("forms", [])

        s_rows = []
        for s in scripts[:15]:
            s_rows.append(f"""
            <tr>
              <td><code>{s.get('src')}</code></td>
              <td>{'<span class="badge badge-authorized">YES</span>' if s.get('has_integrity') else '<span class="badge badge-medium">NO</span>'}</td>
              <td>{s.get('type', 'javascript')}</td>
            </tr>
            """)

        f_rows = []
        for f in forms:
            f_rows.append(f"""
            <tr>
              <td><code>{f.get('action')}</code></td>
              <td><span class="badge badge-low">{f.get('method')}</span></td>
              <td>{len(f.get('inputs', []))} inputs (Password: {f.get('has_password')})</td>
              <td>{'<span class="badge badge-authorized">YES</span>' if f.get('has_csrf_token') else '<span class="badge badge-medium">NO</span>'}</td>
            </tr>
            """)

        return f"""
        <h3 style="color: #fff; font-size: 1rem; margin-bottom: 8px;">Referenced JavaScript Scripts ({len(scripts)})</h3>
        <table>
          <thead><tr><th>Script URL</th><th>SRI Integrity</th><th>Type</th></tr></thead>
          <tbody>{''.join(s_rows) or '<tr><td colspan="3">None</td></tr>'}</tbody>
        </table>

        <h3 style="color: #fff; font-size: 1rem; margin-top: 24px; margin-bottom: 8px;">HTML Forms ({len(forms)})</h3>
        <table>
          <thead><tr><th>Form Action</th><th>Method</th><th>Inputs</th><th>Anti-CSRF Observable</th></tr></thead>
          <tbody>{''.join(f_rows) or '<tr><td colspan="4">No HTML forms observed on root page.</td></tr>'}</tbody>
        </table>
        """

    def _render_ports_html(self) -> str:
        ps = self.audit_data.get("port_scanner", {})
        open_ports = ps.get("open_ports", [])
        all_results = ps.get("all_results", [])

        rows = []
        for r in all_results:
            is_open = r.get("state") == "OPEN"
            badge = "<span class='badge badge-authorized'>OPEN</span>" if is_open else f"<span class='badge badge-info'>{r.get('state')}</span>"
            rows.append(f"""
            <tr>
              <td><strong>{r.get('port')}</strong></td>
              <td>{r.get('service')}</td>
              <td>{badge}</td>
              <td>{r.get('latency_ms', 0)} ms</td>
            </tr>
            """)
        return f"""
        <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.9rem;">
          Scoped assessment of {ps.get('ports_scanned', 0)} standard TCP service ports. Open ports indicate active listeners, not vulnerabilities.
        </p>
        <table>
          <thead><tr><th>Port</th><th>Service Hint</th><th>State</th><th>Latency</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
        """

    def _render_tech_and_cloud_html(self) -> str:
        tech = self.audit_data.get("technology_detection", {}).get("technologies", [])
        cloud = self.audit_data.get("cloud_indicators", {}).get("cloud_indicators", [])

        t_rows = []
        for t in tech:
            t_rows.append(f"""
            <tr>
              <td><strong>{t.get('name')}</strong></td>
              <td>{t.get('category')}</td>
              <td><code>{t.get('version')}</code></td>
              <td><span class="badge badge-info">{t.get('confidence')}</span></td>
              <td style="color: var(--text-muted); font-size: 0.82rem;">{t.get('evidence')}</td>
            </tr>
            """)

        c_rows = []
        for c in cloud:
            c_rows.append(f"""
            <tr>
              <td><strong>{c.get('provider')}</strong></td>
              <td>{c.get('service')}</td>
              <td><code>{c.get('region')}</code> ({c.get('region_confidence')})</td>
              <td style="color: var(--text-muted); font-size: 0.82rem;">{c.get('details')}</td>
            </tr>
            """)

        return f"""
        <h3 style="color: #fff; font-size: 1rem; margin-bottom: 8px;">Identified Technologies & Stacks ({len(tech)})</h3>
        <table>
          <thead><tr><th>Technology</th><th>Category</th><th>Version</th><th>Confidence</th><th>Evidence</th></tr></thead>
          <tbody>{''.join(t_rows) or '<tr><td colspan="5">No signature matches.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #fff; font-size: 1rem; margin-top: 24px; margin-bottom: 8px;">Cloud Infrastructure & Regional Indicators ({len(cloud)})</h3>
        <table>
          <thead><tr><th>Provider</th><th>Service</th><th>Region (Confidence)</th><th>Details</th></tr></thead>
          <tbody>{''.join(c_rows) or '<tr><td colspan="4">No cloud infrastructure signatures detected.</td></tr>'}</tbody>
        </table>
        """

    def _render_subdomains_html(self) -> str:
        subs = self.audit_data.get("subdomains") or self.audit_data.get("domain_discovery", {}).get("subdomains", [])
        if not subs:
            return "<p style='color: var(--text-muted);'>No subdomains were observed via public CT logs or DNS prefix probes.</p>"

        rows = []
        for s in subs:
            sub_name = s.get("subdomain") or s.get("hostname", "N/A")
            ips = s.get("resolved_ips", [])
            ip_str = s.get("ip_address") or (", ".join(ips) if ips else "Unresolved")
            is_active = s.get("status") in ("ACTIVE", "ACTIVE_RESOLVED") or (ip_str not in ("Unresolved", "None"))
            badge = "<span class='badge badge-authorized'>ACTIVE</span>" if is_active else "<span class='badge badge-info'>INACTIVE</span>"
            rows.append(f"""
            <tr>
              <td><code><a href="https://{sub_name}" target="_blank" rel="noreferrer" style="color: var(--accent-blue); text-decoration: none;">{sub_name}</a></code></td>
              <td>{badge}</td>
              <td><code>{ip_str}</code></td>
              <td style="color: var(--text-muted); font-size: 0.82rem;">{s.get('source', 'Certificate Transparency (crt.sh)')}</td>
            </tr>
            """)

        return f"""
        <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.9rem;">
          Publicly observable subdomains discovered via Certificate Transparency logs and authorized prefix resolution.
        </p>
        <table>
          <thead><tr><th>Subdomain Hostname</th><th>Status</th><th>Resolved IP</th><th>Discovery Source</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
        """

    def _render_secrets_html(self) -> str:
        secrets = self.audit_data.get("secrets_scanner", {}).get("findings", [])
        if not secrets:
            return "<p style='color: var(--accent-green); font-weight: bold;'>&#10004; No sensitive credential leaks, tokens, or exposed configuration files (.env, .git) were detected in scanned client resources.</p>"

        rows = []
        for s in secrets:
            sev = s.get("severity", "HIGH").upper()
            badge_class = f"badge-{sev.lower()}"
            rows.append(f"""
            <tr>
              <td><span class="badge {badge_class}">{sev}</span></td>
              <td><strong>{s.get('summary')}</strong></td>
              <td><code>{s.get('masked_secret', 'Redacted')}</code></td>
              <td style="font-size: 0.82rem;"><code>{s.get('source_url', 'N/A')}</code></td>
              <td style="color: var(--accent-blue); font-size: 0.85rem;">{s.get('remediation', 'Revoke and rotate immediately')}</td>
            </tr>
            """)

        return f"""
        <table>
          <thead><tr><th>Severity</th><th>Vulnerability Summary</th><th>Masked Secret</th><th>Discovered In</th><th>Remediation Action</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
        """

    def _render_access_control_html(self) -> str:
        access = self.audit_data.get("access_control_audit", {})
        admin_routes = access.get("admin_routes", [])
        api_endpoints = access.get("api_endpoints", [])

        if not admin_routes and not api_endpoints:
            return "<p style='color: var(--text-muted);'>No access control audits recorded.</p>"

        ar_rows = []
        for r in admin_routes:
            state = r.get("protection_state", "UNKNOWN")
            if state in ("PROTECTED", "REDIRECTED_TO_LOGIN"):
                badge = f"<span class='badge badge-authorized'>{state}</span>"
            elif state == "UNPROTECTED_EXPOSED":
                badge = f"<span class='badge badge-critical'>{state}</span>"
            else:
                badge = f"<span class='badge badge-info'>{state}</span>"

            ar_rows.append(f"""
            <tr>
              <td><code>{r.get('path')}</code></td>
              <td><strong>HTTP {r.get('status_code')}</strong></td>
              <td>{badge}</td>
              <td style="color: var(--text-muted); font-size: 0.84rem;">{r.get('details')}</td>
            </tr>
            """)

        api_rows = []
        for a in api_endpoints:
            state = a.get("access_state", "UNKNOWN")
            badge = "<span class='badge badge-authorized'>AUTH_REQUIRED</span>" if "RESTRICTED" in state or "AUTH" in state else f"<span class='badge badge-info'>{state}</span>"
            api_rows.append(f"""
            <tr>
              <td><code>{a.get('endpoint_path')}</code></td>
              <td><strong>HTTP {a.get('status_code')}</strong></td>
              <td>{badge}</td>
              <td style="color: var(--text-muted); font-size: 0.84rem;">{a.get('details')}</td>
            </tr>
            """)

        html = f"""
        <h3 style="color: #fff; font-size: 1rem; margin-bottom: 8px;">Administrative Interface Protection ({len(admin_routes)})</h3>
        <table>
          <thead><tr><th>Audited Path</th><th>Response Status</th><th>Protection State</th><th>Details</th></tr></thead>
          <tbody>{''.join(ar_rows) or '<tr><td colspan="4">No admin paths probed.</td></tr>'}</tbody>
        </table>
        """

        if api_rows:
            html += f"""
            <h3 style="color: #fff; font-size: 1rem; margin-top: 24px; margin-bottom: 8px;">Discovered Backend API Endpoint Access ({len(api_endpoints)})</h3>
            <table>
              <thead><tr><th>API Route</th><th>Response Status</th><th>Access State</th><th>Details</th></tr></thead>
              <tbody>{''.join(api_rows)}</tbody>
            </table>
            """
        return html

    def _render_crawler_html(self) -> str:
        crawler = self.audit_data.get("crawler", {})
        pages = crawler.get("pages", [])
        if not pages:
            return "<p style='color: var(--text-muted);'>No internal pages crawled.</p>"

        rows = []
        for p in pages:
            status = p.get("status_code", 200)
            status_badge = "<span class='badge badge-authorized'>HTTP 200</span>" if status == 200 else f"<span class='badge badge-info'>HTTP {status}</span>"
            rows.append(f"""
            <tr>
              <td><code>{p.get('url')}</code></td>
              <td>{status_badge}</td>
              <td><strong>{p.get('title', 'Untitled')}</strong></td>
              <td>{p.get('links_found', 0)} links</td>
              <td>{p.get('scripts_found', 0)} scripts</td>
              <td>{p.get('forms_found', 0)} forms</td>
            </tr>
            """)

        return f"""
        <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.9rem;">
          Bounded in-scope BFS crawl: visited {crawler.get('total_pages_crawled', 0)} pages (ceiling: {crawler.get('max_pages_limit', 15)}).
        </p>
        <table>
          <thead><tr><th>Page URL</th><th>Status</th><th>Page Title</th><th>Discovered Links</th><th>Discovered Scripts</th><th>Discovered Forms</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
        """

    def _compute_overall_posture(self) -> Dict[str, Any]:
        """Compute an accurate, weighted multi-pillar security score (0-100) and letter grade."""
        # 1. Header Security Posture (Weight: 25%)
        headers_score = self.audit_data.get("security_headers", {}).get("score", 70)
        
        # 2. TLS / SSL Crypto Posture (Weight: 20%)
        tls = self.audit_data.get("tls_audit", {})
        cert = tls.get("certificate", {})
        days_remaining = cert.get("days_remaining", 0)
        proto = tls.get("connection", {}).get("protocol_version", "")
        tls_score = 100
        if not cert:
            tls_score = 40
        else:
            if days_remaining <= 0:
                tls_score -= 50
            elif days_remaining < 15:
                tls_score -= 25
            elif days_remaining < 30:
                tls_score -= 10
            if "TLSv1.0" in proto or "TLSv1.1" in proto or "SSL" in proto:
                tls_score -= 40
        tls_score = max(0, min(100, tls_score))

        # 3. DNS & Mail Protection (Weight: 15%)
        dns = self.audit_data.get("dns_analysis", {})
        dns_score = 100
        dmarc = dns.get("dmarc_records", [])
        txt_records = dns.get("records", {}).get("TXT", [])
        has_spf = any("v=spf1" in t for t in txt_records)
        if not dmarc:
            dns_score -= 35
        if not has_spf:
            dns_score -= 35
        dns_score = max(0, min(100, dns_score))

        # 4. Access Control & Admin Protection (Weight: 20%)
        access = self.audit_data.get("access_control_audit", {})
        admin_routes = access.get("admin_routes", [])
        unprotected_admin = [r for r in admin_routes if r.get("protection_state") == "UNPROTECTED_EXPOSED"]
        access_score = 100
        if unprotected_admin:
            access_score -= min(80, len(unprotected_admin) * 40)
        access_score = max(0, min(100, access_score))

        # 5. Vulnerabilities, CORS & Secrets Leaks (Weight: 20%)
        vuln_score = 100
        secrets = self.audit_data.get("secrets_scanner", {}).get("findings", [])
        if secrets:
            vuln_score -= min(60, len(secrets) * 30)
        
        vulns = self.audit_data.get("vulnerability_scanner", {})
        exposed_files = vulns.get("sensitive_files", {}).get("exposed_files", [])
        if exposed_files:
            vuln_score -= min(50, len(exposed_files) * 25)

        cors_res = vulns.get("cors", {})
        if cors_res.get("is_vulnerable"):
            vuln_score -= 30

        # General Critical/High penalty
        sev_counts = self._count_severities()
        crit_high = sev_counts["CRITICAL"] * 15 + sev_counts["HIGH"] * 8
        vuln_score = max(0, min(100, vuln_score - crit_high))

        # Overall weighted composite
        composite_score = int(
            (headers_score * 0.25) +
            (tls_score * 0.20) +
            (dns_score * 0.15) +
            (access_score * 0.20) +
            (vuln_score * 0.20)
        )
        composite_score = max(0, min(100, composite_score))

        if composite_score >= 90:
            grade = "A"
        elif composite_score >= 80:
            grade = "B"
        elif composite_score >= 65:
            grade = "C"
        elif composite_score >= 50:
            grade = "D"
        else:
            grade = "F"

        return {
            "score": composite_score,
            "grade": grade,
            "breakdown": {
                "headers": {"score": headers_score, "weight": 25},
                "tls_crypto": {"score": tls_score, "weight": 20},
                "dns_email_auth": {"score": dns_score, "weight": 15},
                "access_control": {"score": access_score, "weight": 20},
                "vulnerabilities_and_secrets": {"score": vuln_score, "weight": 20}
            }
        }

    def _render_vulnerabilities_html(self) -> str:
        vuln = self.audit_data.get("vulnerability_scanner", {})
        cors = vuln.get("cors", {})
        cookies = vuln.get("cookies", {})
        methods = vuln.get("http_methods", {})
        sens_files = vuln.get("sensitive_files", {})
        robots = vuln.get("robots_sitemap", {})
        sec_txt = vuln.get("security_txt", {})
        err_h = vuln.get("error_handling", {})
        csp = vuln.get("csp_evaluation", {})
        mixed = vuln.get("mixed_content", {})
        sinks = vuln.get("client_sinks", {})
        redirs = vuln.get("open_redirects", {})
        sri = vuln.get("sri_audit", {})

        # CORS Table
        cors_rows = []
        for r in cors.get("results", []):
            ref_badge = "<span class='badge badge-critical'>REFLECTED</span>" if r.get("is_reflected") else "<span class='badge badge-authorized'>SECURE</span>"
            cors_rows.append(f"""
            <tr>
              <td><strong>{r.get('label')}</strong><br><code style='font-size: 0.8rem;'>{r.get('tested_origin')}</code></td>
              <td>HTTP {r.get('status_code', 'N/A')}</td>
              <td><code>{r.get('allow_origin') or 'None'}</code></td>
              <td><code>{r.get('allow_credentials') or 'None'}</code></td>
              <td>{ref_badge}</td>
            </tr>
            """)

        # Cookie Table
        cookie_rows = []
        for c in cookies.get("details", []):
            sec_b = "<span class='badge badge-authorized'>YES</span>" if c.get("secure") else "<span class='badge badge-critical'>NO</span>"
            http_b = "<span class='badge badge-authorized'>YES</span>" if c.get("httponly") else "<span class='badge badge-critical'>NO</span>"
            same_b = f"<span class='badge badge-info'>{c.get('samesite', 'None')}</span>" if c.get("samesite") else "<span class='badge badge-medium'>MISSING</span>"
            cookie_rows.append(f"""
            <tr>
              <td><code>{c.get('name')}</code></td>
              <td>{sec_b}</td>
              <td>{http_b}</td>
              <td>{same_b}</td>
              <td><code>{c.get('domain', 'N/A')}</code></td>
            </tr>
            """)

        # HTTP Verbs Table
        verb_rows = []
        for m in methods.get("methods_tested", []):
            stat = m.get("status_code", "N/A")
            is_trace = m.get("method") == "TRACE" and stat == 200
            badge = "<span class='badge badge-critical'>TRACE VULNERABLE</span>" if is_trace else f"<span class='badge badge-info'>HTTP {stat}</span>"
            verb_rows.append(f"""
            <tr>
              <td><strong>{m.get('method')}</strong></td>
              <td>{badge}</td>
              <td><code>{m.get('response_headers', 'N/A')}</code></td>
              <td style='color: var(--text-muted); font-size: 0.82rem;'>{m.get('notes', '')}</td>
            </tr>
            """)

        # Sensitive Files Probes
        file_rows = []
        for f in sens_files.get("all_probes", []):
            if f.get("is_exposed"):
                badge = f"<span class='badge badge-critical'>EXPOSED ({f.get('severity')})</span>"
            elif f.get("status_code") == 200:
                badge = "<span class='badge badge-authorized'>SPA 200 CATCH-ALL (SAFE)</span>"
            else:
                badge = f"<span class='badge badge-info'>HTTP {f.get('status_code')}</span>"

            file_rows.append(f"""
            <tr>
              <td><code>{f.get('path')}</code></td>
              <td>{f.get('title')}</td>
              <td>{badge}</td>
              <td style='color: var(--text-muted); font-size: 0.82rem;'>{f.get('details', '')}</td>
            </tr>
            """)

        # Mixed Content Rows
        mixed_rows = []
        for mr in mixed.get("mixed_resources", []):
            mixed_rows.append(f"""
            <tr>
              <td><code>{mr.get('url')}</code></td>
              <td><strong>{mr.get('type')}</strong></td>
              <td><span class="badge badge-{mr.get('severity', 'low').lower()}">{mr.get('severity')}</span></td>
            </tr>
            """)

        # Client Sinks Rows
        sink_rows = []
        for sk in sinks.get("sinks_found", []):
            sink_rows.append(f"""
            <tr>
              <td><strong>{sk.get('title')}</strong></td>
              <td><code>{sk.get('script_url')}</code></td>
              <td><span class="badge badge-{sk.get('severity', 'medium').lower()}">{sk.get('severity')}</span></td>
              <td><code>{sk.get('snippet')}</code></td>
            </tr>
            """)

        # Open Redirect Rows
        redir_rows = []
        for rd in redirs.get("details", []):
            loc = rd.get("location") or "None"
            is_vuln = "example.com" in loc
            badge = "<span class='badge badge-critical'>VULNERABLE REDIRECT</span>" if is_vuln else f"<span class='badge badge-info'>HTTP {rd.get('status')}</span>"
            redir_rows.append(f"""
            <tr>
              <td><code>{rd.get('path')}</code></td>
              <td>{badge}</td>
              <td><code>{loc}</code></td>
            </tr>
            """)

        # SRI Rows
        sri_rows = []
        for s_url in sri.get("scripts", []):
            sri_rows.append(f"""
            <tr>
              <td><code>{s_url}</code></td>
              <td><span class="badge badge-low">MISSING SRI</span></td>
              <td>Third-party script executed without cryptographic integrity hash</td>
            </tr>
            """)

        return f"""
        <h3 style="color: #0f172a; font-size: 1.1rem; margin-bottom: 8px;">1. Content Security Policy (CSP) Deep Evaluator & Bypass Analysis</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Audits CSP directives, script whitelists, 'unsafe-inline' bypasses, and object execution restrictions.
        </p>
        <table>
          <tbody>
            <tr>
              <th style="width: 260px;">CSP Enforcement State</th>
              <td><span class="badge {'badge-authorized' if csp.get('present') else 'badge-critical'}">{'ENFORCED' if csp.get('present') else 'MISSING'}</span> (Rating: <strong>{csp.get('rating', 'MISSING')}</strong> - Resilience Score: {csp.get('score', 0)}/100)</td>
            </tr>
            <tr>
              <th>Identified Weaknesses & Bypasses</th>
              <td><span style="color: {'var(--accent-red)' if csp.get('bypasses') else 'var(--accent-green)'};">{'<br>'.join(['&bull; ' + b for b in csp.get('bypasses', [])]) or 'None identified'}</span></td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">2. Cross-Origin Resource Sharing (CORS) Policy Probe</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Probing of CORS headers using arbitrary external and null origins with credentials validation.
        </p>
        <table>
          <thead><tr><th>Origin Scenario</th><th>Status</th><th>Access-Control-Allow-Origin</th><th>Allow-Credentials</th><th>Reflection Verdict</th></tr></thead>
          <tbody>{''.join(cors_rows) or '<tr><td colspan="5">No CORS headers responded.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">3. Cookie Security Flags & Attributes</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Evaluation of Secure, HttpOnly, and SameSite flags across all set-cookie headers to protect against session hijacking and CSRF.
        </p>
        <table>
          <thead><tr><th>Cookie Name</th><th>Secure</th><th>HttpOnly</th><th>SameSite</th><th>Domain</th></tr></thead>
          <tbody>{''.join(cookie_rows) or '<tr><td colspan="5">No Set-Cookie headers detected on target endpoint.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">4. HTTP Verbs & Methods Audit</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Safe probing of HTTP methods (OPTIONS, TRACE/XST, PUT, DELETE) to assess allowed verbs and cross-site tracing exposure.
        </p>
        <table>
          <thead><tr><th>HTTP Verb</th><th>Response</th><th>Allow / Public Headers</th><th>Analysis Notes</th></tr></thead>
          <tbody>{''.join(verb_rows) or '<tr><td colspan="4">No method probe records available.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">5. Sensitive File & Directory Exposure Probing ({sens_files.get('probed_count', 0)} files checked)</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Verification of exposed files (.env, .git/HEAD, docker-compose.yml, phpinfo.php, etc.) with binary/pattern validation to eliminate SPA 200 false positives.
        </p>
        <table>
          <thead><tr><th>Path Probed</th><th>Catalog Name</th><th>Audit Status</th><th>Evidence / Note</th></tr></thead>
          <tbody>{''.join(file_rows) or '<tr><td colspan="4">No sensitive file probes recorded.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">6. Mixed Content & Insecure Transport Resources</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Auditing for unencrypted HTTP scripts, stylesheets, iframes, and media resources on HTTPS targets.
        </p>
        <table>
          <thead><tr><th>Resource URL</th><th>Resource Type</th><th>Severity</th></tr></thead>
          <tbody>{''.join(mixed_rows) or '<tr><td colspan="3" style="color: var(--accent-green);">&#10004; Zero unencrypted mixed content resources detected.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">7. Client-Side DOM XSS, Prototype Pollution & Storage Sinks</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Static heuristic inspection of first-party scripts for innerHTML sinks, insecure postMessage handlers, and localStorage auth tokens.
        </p>
        <table>
          <thead><tr><th>Sink / Pattern Identified</th><th>Script Origin</th><th>Severity</th><th>Code Snippet</th></tr></thead>
          <tbody>{''.join(sink_rows) or '<tr><td colspan="4" style="color: var(--accent-green);">&#10004; No dangerous DOM sinks or unvalidated postMessage listeners discovered.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">8. Open URL Redirection Safe Probing</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Safe probing of discovered routing and redirect parameters to detect unvalidated external redirection vulnerabilities.
        </p>
        <table>
          <thead><tr><th>Probed Path / Parameter</th><th>HTTP Status</th><th>Observed Location Header</th></tr></thead>
          <tbody>{''.join(redir_rows) or '<tr><td colspan="3">No unvalidated open redirects confirmed.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">9. Subresource Integrity (SRI) on CDN Dependencies</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
          Verification of cryptographic hashes on third-party external scripts to prevent CDN supply chain tampering.
        </p>
        <table>
          <thead><tr><th>External Script URL</th><th>Integrity Status</th><th>Security Impact</th></tr></thead>
          <tbody>{''.join(sri_rows) or '<tr><td colspan="3" style="color: var(--accent-green);">&#10004; All external scripts enforce integrity or none are loaded from third parties.</td></tr>'}</tbody>
        </table>

        <h3 style="color: #0f172a; font-size: 1.1rem; margin-top: 26px; margin-bottom: 8px;">10. Policy & Information Disclosures</h3>
        <table>
          <tbody>
            <tr>
              <th style="width: 260px;">RFC 9116 security.txt</th>
              <td>{'<span class="badge badge-authorized">FOUND</span>' if sec_txt.get('present') else '<span class="badge badge-info">MISSING</span>'} - {sec_txt.get('contact') or 'No disclosure policy published'}</td>
            </tr>
            <tr>
              <th>Error Handling & Leaks</th>
              <td>{'<span class="badge badge-critical">STACK TRACE DISCLOSED</span>' if err_h.get('leak_detected') else '<span class="badge badge-authorized">CLEAN / GENERIC ERROR</span>'} - {err_h.get('evidence_snippet') or 'No internal paths or traces disclosed'}</td>
            </tr>
            <tr>
              <th>Disallowed Routes in robots.txt</th>
              <td><code>{len(robots.get('disallowed_paths', []))} disallowed path(s) identified</code></td>
            </tr>
            <tr>
              <th>Discovered Sitemap URLs</th>
              <td><code>{len(robots.get('sitemap_urls', []))} sitemap URL(s) harvested</code></td>
            </tr>
          </tbody>
        </table>
        """


def var_danger_col(count: int) -> str:
    if count == 0:
        return "var(--accent-green)"
    if count < 3:
        return "var(--accent-yellow)"
    return "var(--accent-red)"

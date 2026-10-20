# Nexentra Security Audit — Enterprise Web Vulnerability & Configuration Assessment Engine

A modular, enterprise-grade defensive security auditing and asset-inventory application designed for identifying security vulnerabilities, misconfigurations, and cryptographic deficiencies across websites, APIs, and modern Single Page Applications (SPAs).

The toolkit evaluates public cryptographic configurations, DNS mail protections, defensive HTTP response headers, frontend scripts and forms, exposed API routes, technology stacks, and cloud hosting indicators.

---

## Table of Contents

- [Core Principles & Safety Controls](#core-principles--safety-controls)
- [Module Architecture](#module-architecture)
- [System Requirements](#system-requirements)
- [Full-Stack Architecture (React + Node.js)](#full-stack-architecture-react--nodejs)
  - [Starting the Node.js Backend](#starting-the-nodejs-backend)
  - [Launching the React Dashboard](#launching-the-react-dashboard)
  - [Backend REST API Specifications](#backend-rest-api-specifications)
- [Windows Installation & Setup](#windows-installation--setup)
- [Execution & Usage Guide](#execution--usage-guide)
  - [1. Assessing an Authorized Website](#1-assessing-an-authorized-website)
  - [2. Dry-Run Mode](#2-dry-run-mode)
  - [3. Local Mock Test Target](#3-local-mock-test-target)
  - [4. Executing the Test Suite](#4-executing-the-test-suite)
- [Configuration Reference (`config.yaml`)](#configuration-reference-configyaml)
- [Distinction Between Observations and Hypotheses](#distinction-between-observations-and-hypotheses)
- [Audit Limitations & Non-Exhaustiveness Statement](#audit-limitations--non-exhaustiveness-statement)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Core Principles & Safety Controls

This toolkit is engineered **strictly for defensive posture evaluation**. It adheres to safety controls preventing harm to the target or network infrastructure:

1. **Explicit Authorization Gate:** The audit requires explicit confirmation (`--authorized` CLI argument or interactive prompt) confirming that the operator owns or possesses documented permission to assess the target.
2. **Strict SSRF Firewall:** Before any network request or connection is dispatched, target hostnames and redirect targets are resolved via DNS. All destination IP addresses are validated against:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private RFC 1918 / RFC 4193 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`)
   - Cloud Instance Metadata services (`169.254.169.254`, `metadata.google.internal`)
   - Link-local and Carrier-Grade NAT (`169.254.0.0/16`, `100.64.0.0/10`)
3. **No Exploitation or Control Evasion:** The application performs **no** authentication bypass attempts, fuzzing, brute force, injection payloads, or vulnerability exploitation.
4. **Rate Limiting & Conservative Timeouts:** HTTP requests and TCP connect checks operate under configurable rate limits (default: 5 requests/sec) and conservative socket timeouts (default: 1.2s - 5.0s) to prevent resource contention.
5. **Safe Redirect Tracking:** Prohibits unverified cross-domain redirects and rejects redirections targeting internal or cloud metadata endpoints.
6. **Data Redaction:** Sensitive bearer tokens, API keys, passwords, and authorization headers are automatically scrubbed from terminal outputs and generated reports.

---

## Module Architecture

The application is structured into modular components located in `modules/`:

| Module | Filename | Description |
|---|---|---|
| **Scope & SSRF** | `modules/scope_manager.py` | URL normalization, IP boundary validation, SSRF filtering, redirect checks, and redaction. |
| **Safe HTTP Client** | `modules/safe_client.py` | Rate-limited, response-capped, SSRF-guarded HTTP client built on Python standard library. |
| **Domain Discovery** | `modules/domain_discovery.py` | Passive Certificate Transparency (crt.sh) queries and authorized DNS prefix resolution. |
| **DNS Analysis** | `modules/dns_analysis.py` | Audits A, AAAA, CNAME, MX, NS, TXT, SOA, and mail defenses (SPF, DMARC, DKIM). |
| **Port Assessment** | `modules/port_scanner.py` | Conservative TCP connect checks for standard service ports (80, 443, 8080, 8443, etc.). |
| **TLS / SSL Audit** | `modules/tls_audit.py` | Inspects certificate expiration, issuer, SANs, negotiated TLS protocols, and cipher strength. |
| **Security Headers** | `modules/security_headers.py` | Grades HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and cookie flags. |
| **In-Scope Crawler** | `modules/crawler.py` | Bounded breadth-first traversal discovering internal pages, links, and forms. |
| **Frontend Inventory** | `modules/frontend_analysis.py` | Collects scripts, stylesheets, inline scripts, meta tags, forms, and evaluates Subresource Integrity (SRI). |
| **Endpoint Discovery** | `modules/endpoint_discovery.py` | Discovers links, form actions, asset URLs, and candidate API paths from HTML markup. |
| **API Inventory** | `modules/api_inventory.py` | Discovers OpenAPI/Swagger documentation (`/openapi.json`) and extracts endpoints from client scripts. |
| **Secrets Scanner** | `modules/secrets_scanner.py` | Scans client bundles and tests for exposed credentials, API keys, and sensitive files (.env, .git). |
| **Access Control Audit** | `modules/access_control_audit.py` | Audits administrative management paths (/admin, /dashboard, etc.) and tests backend API auth enforcement. |
| **Technology Detection**| `modules/technology_detection.py` | Fingerprints web servers, backend runtimes, CMS engines, and JS libraries from observable evidence. |
| **Cloud Indicators** | `modules/cloud_indicators.py` | Evaluates AWS (CloudFront, S3, ALB), Cloudflare, GCP, and Azure markers. Strictly bounds region claims. |
| **Report Generator** | `modules/report_generator.py` | Compiles findings into timestamped JSON and interactive HTML reports with server hardening snippets. |

---

## System Requirements

- **Operating System:** Windows 10/11, Windows Server 2019+, or Linux / macOS.
- **Python Runtime:** Python 3.10, 3.11, or 3.12+.
- **Zero Hard Dependencies:** The application is engineered to operate on Python's built-in standard library. Optional packages (`dnspython`, `PyYAML`, `requests`, `beautifulsoup4`) provide enhanced performance when installed.
- **Node.js (for Web Dashboard):** Node.js v18+ or v20+.

---

## Full-Stack Architecture (React + Node.js)

The project includes an enterprise-grade web application with a **React 18 Dashboard** and a **Node.js Backend**. The architecture uses **no external database (no MongoDB)**—all scans, metrics, and findings are stored and indexed directly via structured JSON reports in the `reports/` folder.

```
                    ┌────────────────────────┐
                    │   React 18 Dashboard   │
                    │   (Port 3000 / 5000)   │
                    └───────────┬────────────┘
                                │ HTTP / REST
                    ┌───────────▼────────────┐
                    │  Node.js API Backend   │
                    │      (Port 5000)       │
                    └───────────┬────────────┘
                                │ Process Spawn
                    ┌───────────▼────────────┐
                    │ Python Audit Core (CLI)│
                    │       (main.py)        │
                    └───────────┬────────────┘
                                │ Writes
                    ┌───────────▼────────────┐
                    │   reports/*.json/.html │
                    └────────────────────────┘
```

### Starting the Node.js Backend

From the project root (`e:\sample`):

```powershell
# Option 1: Zero-install launch (uses Node.js built-in modules)
node backend/server.js

# Option 2: Using npm inside backend/
cd backend
npm install
npm start
```
*The backend starts on `http://localhost:5000`.*

### Launching the React Dashboard

You have two convenient ways to access the dashboard:

#### Option A: Direct Browser Access (Instant, Zero Build Required)
Once the backend is running (`node backend/server.js`), simply open:
👉 **`http://localhost:5000`** in your browser!
The backend automatically compiles and serves the React dashboard directly.

#### Option B: Vite Dev Server (Fast Hot-Module Replacement)
```powershell
cd frontend
npm install
npm run dev
```
*Opens the Vite dev server at `http://localhost:3000` with live proxying to the Node.js backend.*

### Backend REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/audit` | Initiates an audit for `{ "domain": "example.com", "authorized": true }`. Spawns `main.py`, captures output, and returns the parsed report. |
| `GET` | `/api/reports` | Lists all historical scan reports stored in the `reports/` directory. |
| `GET` | `/api/reports/:filename` | Retrieves a specific scan report (JSON or HTML). |
| `GET` | `/api/health` | Returns backend service status and active scan count. |

---

## Windows Installation & Setup

Open **PowerShell** or **Command Prompt** in the project directory (`e:\sample`):

```powershell
# 1. Verify Python installation
python --version

# 2. (Recommended) Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# If script execution is restricted in PowerShell, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install optional performance libraries
pip install -r requirements.txt
```

---

## Execution & Usage Guide

### 1. Assessing an Authorized Website

To run a full defensive assessment against a target website:

```bash
python main.py https://example.com --authorized
```

What the tool executes:
1. Validates target URL scheme and domain.
2. Enforces SSRF and scope firewalling on resolved IPs.
3. Performs a non-intrusive HTTP handshake.
4. Audits TLS certificate validity, expiration, and cipher suites.
5. Evaluates defensive security headers and grades posture (A to F).
6. Queries DNS records, SPF, and DMARC mail policies.
7. Discovers referenced frontend assets, forms, and scripts.
8. Probes for public API documentation (OpenAPI/Swagger) and extracts routes.
9. Fingerprints technologies and cloud infrastructure indicators.
10. Checks standard TCP ports using conservative connection timeouts.
11. Generates timestamped HTML and JSON reports in `reports/`.

---

### 2. Dry-Run Mode

To inspect target scope resolution and planned audit actions without dispatching network probes:

```bash
python main.py https://example.com --dry-run
```

---

### 3. Local Mock Test Target

The toolkit includes an offline mock enterprise server with simulated assets, headers, forms, and OpenAPI specs:

```bash
python main.py --test-target
```

This launches the mock target on `http://127.0.0.1:<port>`, executes the defensive audit safely in loopback test mode, generates test reports, and cleans up automatically.

---

### 4. Executing the Test Suite

Run unit and integration tests:

```bash
# Option A: Run the integrated test harness
python tests/run_tests.py

# Option B: Run standard Python unittest discovery
python -m unittest discover tests -v
```

The test suite covers:
- URL validation, normalization, and protocol verification (`tests/test_url_validation.py`)
- SSRF firewalling, private IP blocks, cloud metadata protection, and redirect validation (`tests/test_scope_and_ssrf.py`)
- Defensive header scoring, cookie security flags, and server snippet generation (`tests/test_security_headers.py`)
- Report generation, JSON schema validation, and sensitive string redaction (`tests/test_report_generation.py`)
- End-to-end integration test against the local mock server (`tests/mock_server.py`)

---

## Configuration Reference (`config.yaml`)

Assessment parameters can be tuned in `config.yaml`:

```yaml
audit:
  timeout_seconds: 5.0          # Conservative socket timeout
  rate_limit_per_second: 5.0     # Maximum requests per second
  max_workers: 4                 # Thread pool ceiling
  max_response_bytes: 2097152    # 2MB response body inspection limit

safety:
  require_authorization_confirmation: true
  block_private_networks: true
  prohibited_ip_ranges:
    - "127.0.0.0/8"
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"
    - "169.254.0.0/16"          # Cloud instance metadata

modules:
  port_scanner:
    enabled: true
    ports: [80, 443, 8080, 8443, 8000, 8888, 9000, 3000, 5000]
    socket_timeout_seconds: 1.2
```

---

## Distinction Between Observations and Hypotheses

Every finding and catalogued item in reports is tagged with an explicit **confidence level**:

- **`CONFIRMED`**: Direct, verifiable technical fact. Examples:
  - An HTTP header explicitly returned by the server (e.g. `Server: nginx/1.24.0`).
  - TLS certificate expiration date extracted from the X.509 ASN.1 structure.
  - OpenAPI specification retrieved with HTTP 200 containing defined route paths.
- **`HIGH`**: Strong evidence corroborated by consistent indicators. Examples:
  - SPF or DMARC record verified via authoritative DNS TXT response.
  - WordPress CMS identified through multiple matching asset paths (`/wp-content/`).
- **`MEDIUM`**: Observable artifact with possible alternative explanations. Examples:
  - Form lacking an observable hidden CSRF input (form could be protected via SameSite cookies or custom JavaScript request headers).
  - Framework guessed from standard cookie name (e.g. `csrftoken` matching Django).
- **`HEURISTIC / EDGE-ONLY`**: Inferred observation requiring qualification. Examples:
  - CloudFront Edge POP airport code (`IAD`, `LHR`) identifies where the edge proxy terminated the client connection, **not** necessarily the origin server's geographical region.
- **`UNVERIFIED / INCONCLUSIVE`**: No reliable evidence exists to substantiate the attribute (e.g., origin cloud region behind Anycast CDN).

---

## Audit Limitations & Non-Exhaustiveness Statement

> [!IMPORTANT]
> **Defensive Scope & Non-Exhaustiveness Statement**
>
> 1. **Non-Exhaustive Subdomains:** Subdomain discovery relies on public Certificate Transparency logs (crt.sh) and a pre-defined list of common DNS prefixes. Split-horizon internal DNS, unindexed hosts, or non-public services will not be detected.
> 2. **Static Surface Analysis:** Frontend and API inventories are compiled from server-rendered HTML and client scripts. Client-side Single Page Application (SPA) runtime state, lazy-loaded components, and authenticated routes behind login walls are not catalogued.
> 3. **Non-Intrusive Port Scanning:** Port checks are strictly bounded to configured standard web and service ports. UDP services, non-standard high ports, and stateful firewall drop policies are not exhaustively probed.
> 4. **No Vulnerability Exploitation:** Open ports and missing headers indicate defensive posture deficiencies, not confirmed exploitable vulnerabilities.

---

## Troubleshooting & FAQ

### 1. `[!] ERROR: Authorization confirmation required`
- **Cause:** Active security audits require confirmed operator authorization.
- **Resolution:** Add `--authorized` to the command line: `python main.py https://example.com --authorized`.

### 2. `[!] SAFETY HALT (SSRF Rule Violation)`
- **Cause:** The target hostname resolved to a loopback (`127.0.0.1`), private RFC 1918 IP (`192.168.x.x`), or cloud metadata address.
- **Resolution:** For testing local environments, use the built-in mock flag `--test-target` or `--allow-local-mock`.

### 3. DNS queries return limited records
- **Cause:** Running in standard Python environment without `dnspython`.
- **Resolution:** Install the optional DNS parsing package: `pip install dnspython`. The tool will automatically use it for extended TXT/MX queries.

### 4. PowerShell script execution error
- **Cause:** PowerShell default execution policy blocks virtual environment activation script.
- **Resolution:** Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in your current PowerShell window before activating.

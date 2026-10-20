"""
Local Mock Server Module
========================
Provides a lightweight HTTP test target with realistic mock headers,
assets, forms, and API documentation for offline integration testing.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import socket
import threading
import time
from typing import Tuple


class MockWebsiteHandler(BaseHTTPRequestHandler):
    """Simulates an enterprise web application for defensive auditing."""

    def log_message(self, format, *args):
        # Suppress standard logging during tests
        pass

    def do_GET(self):
        # 1. Main Landing Page
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Server", "nginx/1.24.0 (Ubuntu)")
            self.send_header("X-Powered-By", "Next.js")
            # Intentionally omit HSTS and CSP to verify audit detection
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Set-Cookie", "session_id=mock_session_12345; HttpOnly") # Missing Secure flag
            self.end_headers()

            html = """<!DOCTYPE html>
<html>
<head>
  <title>Enterprise Portal</title>
  <meta name="generator" content="Next.js 14.2.0">
  <link rel="stylesheet" href="/static/style.css">
  <script src="/static/app.js"></script>
  <script src="https://cdn.example.com/external-lib.js"></script> <!-- Missing SRI -->
</head>
<body>
  <h1>Welcome to Enterprise Portal</h1>
  <div id="__NEXT_DATA__">{"page": "/home"}</div>
  
  <!-- Insecure cleartext form submission for testing -->
  <form action="http://auth.local/login" method="POST">
    <input type="text" name="username">
    <input type="password" name="password">
    <button type="submit">Login</button>
  </form>

  <a href="/about">About Us</a>
  <a href="/api/v1/users">Users API</a>
  <a href="https://external-partner.com" target="_blank">Partner Site</a> <!-- Missing noopener -->
</body>
</html>"""
            self.wfile.write(html.encode("utf-8"))

        # 2. Static JavaScript Bundle
        elif self.path == "/static/app.js":
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.end_headers()
            js = """
            console.log("App initialized");
            function fetchProfile() {
                fetch('/api/v1/profile').then(r => r.json());
                axios.post('/api/v2/orders', { id: 101 });
            }
            """
            self.wfile.write(js.encode("utf-8"))

        # 3. Static CSS
        elif self.path == "/static/style.css":
            self.send_response(200)
            self.send_header("Content-Type", "text/css")
            self.end_headers()
            self.wfile.write(b"body { font-family: sans-serif; }")

        # 4. Public OpenAPI Documentation
        elif self.path in ("/openapi.json", "/swagger.json"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            spec = {
                "openapi": "3.0.0",
                "info": {
                    "title": "Enterprise Mock API",
                    "version": "1.0.0"
                },
                "paths": {
                    "/api/v1/status": {
                        "get": {"summary": "Health check endpoint"}
                    },
                    "/api/v1/users": {
                        "get": {"summary": "List users", "parameters": [{"name": "limit"}]},
                        "post": {"summary": "Create user"}
                    }
                }
            }
            self.wfile.write(json.dumps(spec).encode("utf-8"))

        # 5. Safe Redirect
        elif self.path == "/safe-redirect":
            self.send_response(302)
            self.send_header("Location", "/index.html")
            self.end_headers()

        # 6. Unsafe SSRF Redirect (Targets Cloud Metadata)
        elif self.path == "/unsafe-redirect":
            self.send_response(302)
            self.send_header("Location", "http://169.254.169.254/latest/meta-data/")
            self.end_headers()

        # 7. Mock Admin route for access control audit
        elif self.path == "/admin":
            self.send_response(401)
            self.send_header("Content-Type", "text/plain")
            self.send_header("WWW-Authenticate", 'Basic realm="Admin Access"')
            self.end_headers()
            self.wfile.write(b"Unauthorized")

        # 8. Mock secondary internal page for crawler
        elif self.path == "/about":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"<!DOCTYPE html><html><head><title>About Us</title></head><body><h1>About Company</h1><a href='/'>Home</a></body></html>")

        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Not Found")


def get_free_port() -> int:
    """Find an available port on loopback."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_mock_server(port: int = 0) -> Tuple[HTTPServer, int]:
    """Start local mock HTTP server synchronously on specified or free port."""
    if port == 0:
        port = get_free_port()
    server = HTTPServer(("127.0.0.1", port), MockWebsiteHandler)
    return server, port


def start_mock_server_in_background(port: int = 0) -> Tuple[HTTPServer, int]:
    """Start local mock server in a daemonized background thread."""
    server, port = start_mock_server(port)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.1)  # Brief warm up
    return server, port


if __name__ == "__main__":
    server, port = start_mock_server_in_background(8088)
    print(f"Mock server listening on http://127.0.0.1:{port}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        server.shutdown()

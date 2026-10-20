"""
API Inventory & Route Topology Module
======================================
Deeply scans client-side JavaScript bundles, HTML DOM, lazy Vite/Webpack chunks,
and OpenAPI specifications to extract all API endpoints, REST routes, GraphQL queries,
external portals, base URL configurations, and client-side SPA routes with source traceability.
"""

from collections import deque
from dataclasses import dataclass, field
import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

from .safe_client import SafeHttpClient, HttpResponse

logger = logging.getLogger("DefensiveAudit.ApiInventory")


def classify_frontend_subgroup(route: str) -> str:
    """Classifies a client-side SPA route into intuitive navigation and functional domains."""
    r = route.lower().strip()

    # Core & Auctions
    if r in ("/", "/homepage", "/live-auction", "/auctionschedule", "/product-details",
             "/prizeshowcase", "/completedauctiondetails", "/winners", "/leaderboard",
             "/bid-modal") or r.startswith(("/live-auction", "/leaderboard", "/auction-leaderboard", "/product-details")):
        return "Core & Auctions"

    # User Account & Profile
    if r in ("/login", "/signup", "/forgot-password", "/profile", "/menu", "/order-tracking",
             "/transactions", "/history", "/delete-account") or r.startswith(("/history", "/transactions", "/profile")):
        return "User Account & Profile"

    # Demo & Interactive Learning
    if r in ("/demo", "/demo-instructions", "/view-guide", "/winning-tips") or r.startswith("/demo"):
        return "Demo & Interactive Learning"

    # Payments & Checkout
    if any(k in r for k in ["payment", "checkout", "success-page", "failure-page"]):
        return "Payments & Checkout"

    # Administration
    if any(k in r for k in ["d60-ctrl", "admin", "dashboard"]) and not r.startswith("/support"):
        return "Administration"

    # Content & Information
    if any(k in r for k in ["rule", "participation", "about", "career", "blog", "terms", "privacy",
                           "refund", "support", "contact", "feedback", "survey", "faq", "help"]):
        return "Content & Information"

    return "Client SPA Routes"


def classify_endpoint_subgroup(path: str, category: str, full_url: str = "", summary: str = "") -> str:
    """Classifies an endpoint or portal route into an intuitive, descriptive subcategory."""
    lp = path.lower()
    ls = summary.lower()
    l_url = full_url.lower()
    combined = f"{lp} {ls} {l_url}"

    # 1. Client SPA Routes (if categorized as SPA)
    if category == "CLIENT_SPA_ROUTE":
        return classify_frontend_subgroup(path)

    # 2. External Portals & Linked Backends
    if category == "EXTERNAL_BACKEND":
        return "External Portals & Linked Backends"

    # 3. Authentication & Session
    if any(k in combined for k in [
        "/auth/", "login", "signin", "sign-in", "signup", "sign-up", "otp", "password",
        "token/refresh", "session-check", "session-stream", "device-limit",
        "biometric/login", "biometric/challenge", "biometric/check", "biometric/status",
        "sync-single-user-stats", "check-username", "check-email", "check-mobile",
        "sso", "credentials"
    ]) and not any(k in combined for k in ["/admin/login", "/security/devices"]):
        return "Authentication & Session"

    # 4. Auction & Scheduler Engine
    if any(k in combined for k in [
        "/scheduler/", "live-auction", "daily-auction", "hourly-auction", "upcoming-auction",
        "place-bid", "place-bargain-bid", "join-free", "check-participation", "user-auction-history",
        "auction-details", "auction-leaderboard", "public-winners", "prize-claim", "calendar"
    ]) and not combined.startswith("/admin"):
        return "Auction & Scheduler Engine"

    # 5. Payment Gateways & Transactions
    if any(k in combined for k in [
        "/airpay/", "/razorpay/", "/payments/", "/checkout/", "create-order", "verify-payment",
        "sendtoairpay", "mobile-checkout", "mobile-confirm", "mobile-success", "mobile-failure"
    ]):
        return "Payment Gateways & Transactions"

    # 6. User Management & Profile
    if any(k in combined for k in [
        "/user/", "/users/", "profile", "updateuserdetails", "voucher-transaction",
        "voucher/", "profile/image", "reveal-otp"
    ]) and not any(k in combined for k in ["/security/devices", "support-chat"]):
        return "User Management & Profile"

    # 7. Device Security & Management
    if any(k in combined for k in [
        "/security/", "devices", "logout-all", "remove/request-otp", "remove/verify",
        "biometric/register", "biometric/revoke"
    ]):
        return "Device Security & Management"

    # 8. Push Notifications
    if any(k in combined for k in [
        "/push-notification/", "vapid", "subscribe", "unsubscribe", "register-device",
        "purge-all", "upload-sound", "biometric-login"
    ]):
        return "Push Notifications"

    # 9. Admin Operations
    if any(k in combined for k in [
        "/admin/", "/admin", "access-code", "vouchers/send-manual", "push-subscriptions",
        "d60-ctrl", "placementadmin", "svecgrievance/login"
    ]):
        return "Admin Operations"

    # 10. Promotional Banners & CMS
    if any(k in combined for k in [
        "/promotional-banners", "/banners", "seed-defaults"
    ]):
        return "Promotional Banners & CMS"

    # 11. Demo & Sandbox
    if any(k in combined for k in [
        "/demo/", "demo-auction", "place-demo-bid", "reset-demo-bid", "finish-demo-auction",
        "demo-prize-claim", "submit-demo-prize-claim"
    ]):
        return "Demo Sandbox"

    # 12. Support, Referrals & Analytics
    if any(k in combined for k in [
        "/support-chat/", "/support-chat", "/referrals/", "/user-activity/", "/utility/",
        "server-time", "platform-stats", "/feedback/", "/careers/", "/contact/", "/festival-icon/"
    ]):
        return "Support, Referrals & Analytics"

    # 13. Institutional & Campus Systems (SVEC / College portals)
    if any(k in combined for k in ["exam", "noticeboard", "circular", "timetable", "result", "hallticket"]):
        return "Noticeboard & Examination"
    if any(k in combined for k in ["placement", "recruiter", "mou", "testimony", "career"]):
        return "Placements & Recruitment"
    if any(k in combined for k in ["training", "skill", "workshop", "internship"]):
        return "Training & Skill Development"
    if any(k in combined for k in ["handbook", "library", "curriculum", "department", "bos", "faculty", "aicte"]):
        return "Academic & Departmental Resources"
    if any(k in combined for k in ["feedback", "survey", "inquiry", "contact", "complaint", "grievance"]):
        return "Feedback & Survey Forms"
    if any(k in combined for k in ["svecgrievance", "bos", "aicte", "internal", "service"]):
        return "Departmental & Internal Services"

    if "/api/" in lp or "/v1/" in lp or "/v2/" in lp or "/rest/" in lp:
        return "General Backend APIs"

    return "General Endpoints"


KNOWN_ENDPOINT_METADATA: Dict[str, Tuple[List[str], str]] = {
    # Authentication & Session
    "/auth/login": (["POST"], "Password login"),
    "/auth/login/send-otp": (["POST"], "Dispatch login OTP"),
    "/auth/login/verify-otp": (["POST"], "Verify login OTP"),
    "/auth/token/refresh": (["POST"], "Refresh JWT access token"),
    "/auth/logout": (["POST"], "User logout"),
    "/auth/signup": (["POST"], "Account registration"),
    "/auth/forgot-password": (["POST"], "Initiate password recovery"),
    "/auth/send-otp": (["POST"], "Generic OTP request"),
    "/auth/send-verification-otp": (["POST"], "Dispatch account verification OTP"),
    "/auth/verify-otp": (["POST"], "Validate OTP code"),
    "/auth/resend-otp": (["POST"], "Resend OTP code"),
    "/auth/reset-password": (["POST"], "Password reset submission"),
    "/auth/update-password": (["POST"], "Change user password"),
    "/auth/check-username": (["POST"], "Validate username availability"),
    "/auth/check-email": (["POST"], "Validate email availability"),
    "/auth/check-mobile": (["POST"], "Validate mobile number availability"),
    "/auth/me": (["GET", "DELETE"], "Fetch current user session / delete account"),
    "/auth/me/profile": (["GET", "PUT"], "Fetch / update authenticated profile"),
    "/auth/me/preferences": (["PUT"], "Update user notifications & preferences"),
    "/auth/updateUserDetails": (["POST"], "Update user account metadata"),
    "/auth/sync-single-user-stats": (["POST"], "Sync user wallet and bidding stats"),
    "/auth/device-limit/send-otp": (["POST"], "Send OTP when concurrent device limit reached"),
    "/auth/device-limit/verify-and-login": (["POST"], "Authorize device and kick previous session"),
    "/auth/biometric/check": (["POST"], "Verify biometric availability"),
    "/auth/biometric/challenge": (["GET"], "Retrieve biometric challenge payload"),
    "/auth/biometric/verify-signature": (["POST"], "Verify cryptographic biometric signature"),
    "/auth/biometric/login": (["POST"], "Complete biometric authentication"),
    "/auth/biometric/status": (["GET"], "Retrieve biometric registration status"),
    "/auth/session-check": (["GET"], "Check active session validity across devices"),
    "/auth/session-stream": (["GET (SSE)"], "Server-Sent Events stream (session_conflict, session_revoked)"),

    # Auction & Scheduler Engine
    "/scheduler/live-auction": (["GET"], "Current live auction details & real-time round data"),
    "/scheduler/daily-auction": (["GET"], "Daily featured auction data"),
    "/scheduler/first-upcoming-product": (["GET"], "Next upcoming auction product preview"),
    "/scheduler/upcoming-auctions": (["GET"], "Upcoming auction queue"),
    "/scheduler/hourly-auctions": (["GET"], "Hourly auction schedules"),
    "/scheduler/hourly-auction/:id": (["GET"], "Details for a specific hourly auction"),
    "/scheduler/homescreen-auctions": (["GET"], "Paginated auctions for mobile homescreen"),
    "/scheduler/tomorrows-schedule": (["GET"], "Schedule for next day's rounds"),
    "/scheduler/auction-details": (["GET"], "Full auction specifications"),
    "/scheduler/place-bid": (["POST"], "Submit standard unique bid"),
    "/scheduler/place-bargain-bid": (["POST"], "Submit bargain bid"),
    "/scheduler/join-free": (["POST"], "Claim entry into zero-cost / promotional auctions"),
    "/scheduler/check-participation": (["POST", "GET"], "Verify if user is registered in an auction"),
    "/scheduler/user-auction-history": (["GET"], "Authenticated user bidding history"),
    "/scheduler/leaderboard": (["GET"], "Global auction leaderboard"),
    "/scheduler/auction-leaderboard": (["GET"], "Round-by-round auction leaderboard"),
    "/scheduler/public-winners": (["GET"], "Recent winners list"),
    "/scheduler/update-prize-claim": (["POST"], "Submit shipping details and claim prize"),
    "/scheduler/calendar-analytics": (["POST"], "Log Google Calendar reminders engagement"),
    "/scheduler/calendar/subscribe": (["POST"], "Subscribe to calendar auction reminders"),
    "/scheduler/calendar/unsubscribe": (["POST"], "Unsubscribe from auction calendar alerts"),
    "/scheduler/calendar/subscriptions": (["GET"], "Retrieve user active calendar alert subscriptions"),
    "/scheduler/admin/dashboard": (["GET"], "Admin overview of auction operations"),
    "/scheduler/admin/auction-history": (["GET"], "Admin audit trail of all completed rounds"),
    "/scheduler/admin/auction-details": (["GET"], "Detailed backend breakdown of an auction"),

    # Payment Gateways & Transactions
    "/api/airpay/create-order": (["POST"], "Initialize Airpay checkout session"),
    "/api/airpay/mobile-checkout-token": (["POST"], "Generate mobile Airpay checkout token"),
    "/api/airpay/verify-mobile-checkout-token": (["GET"], "Verify token for webview payment"),
    "/api/airpay/sendtoairpay": (["POST"], "Dispatch order to Airpay payment processor"),
    "/api/airpay/status": (["GET", "POST"], "Poll payment transaction status"),
    "/api/airpay/response": (["POST"], "Payment gateway webhook callback"),
    "/api/airpay/mobile-confirm": (["POST"], "Confirm mobile in-app payment"),
    "/api/airpay/mobile-success": (["POST"], "In-app payment success acknowledgment"),
    "/api/airpay/mobile-failure": (["POST"], "In-app payment failure acknowledgment"),
    "/api/razorpay/hourly/create-order": (["POST"], "Initialize Razorpay payment order"),
    "/api/razorpay/hourly/verify-payment": (["POST"], "Verify Razorpay HMAC signature"),
    "/api/payments/status": (["GET"], "Generalized payment order status"),

    # User Management & Profile
    "/user/profile": (["GET"], "Retrieve user profile data"),
    "/user/update": (["PUT", "POST"], "Update user profile"),
    "/user/delete": (["DELETE"], "Delete user account"),
    "/user/transactions": (["GET"], "Fetch ledger and wallet transactions"),
    "/user/voucher-transactions": (["GET"], "Fetch won vouchers and prize transactions"),
    "/user/voucher/:id/send-reveal-otp": (["POST"], "Send OTP before revealing voucher PIN/code"),
    "/user/voucher/:id/verify-reveal-otp": (["POST"], "Verify OTP to unmask voucher credentials"),
    "/users/profile/image/upload-url": (["GET"], "Generate pre-signed URL for profile avatar"),
    "/users/profile/image/confirm": (["POST"], "Confirm avatar image upload"),
    "/users/profile/image/direct": (["POST"], "Direct multipart image upload"),
    "/users/profile/image": (["DELETE"], "Remove user profile photo"),

    # Device Security & Management
    "/security/devices": (["GET"], "List all active sessions/devices"),
    "/security/devices/current": (["GET"], "Identify current device identity"),
    "/security/devices/:id/logout/request-otp": (["POST"], "Send OTP to terminate a specific device"),
    "/security/devices/:id/logout/verify": (["POST"], "Verify OTP to terminate specific device session"),
    "/security/devices/logout-all/request-otp": (["POST"], "Send OTP to revoke all other device sessions"),
    "/security/devices/logout-all/verify": (["POST"], "Verify OTP to revoke all sessions"),
    "/security/devices/:id/remove/request-otp": (["POST"], "Send OTP to remove trusted device entry"),
    "/security/devices/:id/remove/verify": (["POST"], "Verify OTP to remove trusted device"),
    "/security/biometric/register": (["POST"], "Register WebAuthn / native biometric credentials"),
    "/security/biometric/revoke": (["POST"], "Unregister biometric authentication"),

    # Push Notifications
    "/push-notification/vapid-public-key": (["GET"], "Retrieve Web Push VAPID public key"),
    "/push-notification/subscribe": (["POST"], "Register browser web push subscription"),
    "/push-notification/unsubscribe": (["POST"], "Remove web push subscription"),
    "/push-notification/history": (["GET"], "Fetch user notifications"),
    "/push-notification/history/:id/read": (["PUT"], "Mark notification as read"),
    "/push-notification/send-to-user": (["POST"], "Dispatch notification to single user"),
    "/push-notification/send-to-all": (["POST"], "Dispatch broadcast alert"),
    "/push-notification/send-to-selected": (["POST"], "Dispatch targeted segment notification"),
    "/push-notification/mobile/register-device": (["POST"], "Register FCM / APNS device token"),
    "/push-notification/mobile/devices": (["GET"], "List mobile devices"),
    "/push-notification/mobile/devices/purge-all": (["DELETE"], "Purge invalid mobile device tokens"),
    "/push-notification/mobile/biometric-login": (["POST"], "Send push approval for biometric login"),
    "/push-notification/mobile/session/login": (["POST"], "Associate mobile token with user session"),
    "/push-notification/mobile/session/logout": (["POST"], "Disassociate mobile token upon logout"),
    "/push-notification/mobile/upload-sound": (["POST"], "Upload custom notification ringtone"),

    # Admin Operations
    "/admin/login": (["POST"], "Administrative portal login"),
    "/admin/signup": (["POST"], "Admin registration"),
    "/admin/send-signup-otp": (["POST"], "Dispatch OTP for admin registration"),
    "/admin/verify-access-code": (["POST"], "Validate admin access code"),
    "/admin/verify-common-access-code": (["POST"], "Validate shared admin passcode"),
    "/admin/set-access-code": (["POST"], "Configure admin access code"),
    "/admin/send-access-code-otp": (["POST"], "Send OTP to change access code"),
    "/admin/reset-access-code": (["POST"], "Reset access code via OTP verification"),
    "/admin/access-code-status": (["GET"], "Check if access code is configured"),
    "/admin/push-subscriptions": (["GET"], "View push notification subscribers"),
    "/admin/vouchers/send-manual": (["POST"], "Manually dispatch won voucher to user"),
    "/admin/calendar-analytics": (["GET"], "View calendar reminder analytics"),

    # Promotional Banners
    "/api/promotional-banners": (["GET"], "Fetch active homepage banners"),
    "/api/promotional-banners/admin": (["GET"], "List all promotional banners (admin)"),
    "/api/promotional-banners/admin/upload": (["POST"], "Upload promotional banner image"),
    "/api/promotional-banners/admin/:id": (["PUT", "DELETE"], "Edit or remove a promotional banner"),
    "/api/promotional-banners/admin/:id/toggle": (["PATCH"], "Enable / disable banner display"),
    "/api/promotional-banners/admin/seed-defaults": (["POST"], "Reset banners to system defaults"),

    # Demo Sandbox
    "/demo/demo-auction": (["GET"], "Retrieve simulated demo auction round"),
    "/demo/place-demo-bid": (["POST"], "Place demo auction bid"),
    "/demo/reset-demo-bid": (["POST"], "Reset user bids in sandbox"),
    "/demo/finish-demo-auction": (["POST"], "Conclude demo auction simulation"),
    "/demo/submit-demo-prize-claim": (["POST"], "Test prize claiming flow"),
    "/demo/user-history": (["GET"], "Retrieve simulated user bid history"),

    # Support, Referrals & Analytics
    "/support-chat/message": (["POST"], "Post message to support chat"),
    "/support-chat/ask": (["POST"], "AI / automated bot support query"),
    "/support-chat/session/:id": (["GET", "DELETE"], "Retrieve or delete chat session"),
    "/support-chat/user/:id": (["GET"], "Fetch chat message history for user"),
    "/api/referrals/click": (["POST"], "Track referral link click"),
    "/api/referrals/join": (["POST"], "Track referral signups"),
    "/api/referrals/attach-user": (["POST"], "Attribute referral code to newly created user"),
    "/user-activity/session/start": (["POST"], "Track user telemetry session start"),
    "/user-activity/session/end": (["POST (Beacon)"], "Track session termination"),
    "/user-activity/batch": (["POST (Beacon)"], "Flush batched telemetry & interaction events"),
    "/utility/server-time": (["GET"], "Retrieve NTP-synced authoritative server timestamp"),
    "/utility/platform-stats": (["GET"], "Retrieve platform metrics (total bids, winners, auctions)"),
    "/feedback/customer": (["POST"], "Submit customer feedback"),
    "/careers/apply": (["POST"], "Submit job application"),
    "/contact/send-message": (["POST"], "Submit public contact inquiry"),
    "/festival-icon/active": (["GET"], "Retrieve active seasonal / holiday icon assets")
}


KNOWN_SPA_ROUTE_DESCRIPTIONS: Dict[str, str] = {
    "/": "Homepage / Main dashboard",
    "/homepage": "Homepage / Main dashboard",
    "/live-auction": "Live auction arena",
    "/live-auction/participations": "User auction participation list",
    "/auctionschedule": "Upcoming auction schedules",
    "/product-details": "Auction product details view",
    "/prizeshowcase": "Prize showcase screen",
    "/completedauctiondetails": "Completed auction summary and claiming",
    "/winners": "Public winners showcase",
    "/leaderboard": "Global / daily leaderboard",
    "/leaderboard/:hourlyAuctionId": "Specific hourly auction leaderboard",
    "/auction-leaderboard/:hourlyAuctionId": "Detailed auction leaderboard",
    "/bid-modal": "Quick-bid modal interface",
    "/login": "User authentication",
    "/signup": "User registration",
    "/forgot-password": "Password reset flow",
    "/profile": "User account & settings",
    "/menu": "Mobile navigation menu",
    "/order-tracking": "Prize / order delivery status",
    "/transactions": "Financial & bid transactions history",
    "/history": "Historical auction activity",
    "/history/details": "Specific auction history record",
    "/delete-account": "Account deletion confirmation",
    "/demo": "Interactive demo auction sandbox",
    "/demo-instructions": "Demo auction rules & instructions",
    "/view-guide": "New user onboarding guide",
    "/winning-tips": "Auction strategies and bidding tips",
    "/mobile-checkout": "Airpay mobile checkout webview",
    "/payment/success": "Payment success handler",
    "/success-page": "Payment success handler",
    "/payment/failure": "Payment failure handler",
    "/failure-page": "Payment failure handler",
    "/payment/result": "Universal transaction status handler",
    "/d60-ctrl-x9k7": "Admin dashboard / login portal",
    "/d60-ctrl-x9k7/signup": "Admin registration portal",
    "/rules": "Auction rules",
    "/new-rules": "Updated participation rules",
    "/participation": "Participation terms",
    "/about": "About Dream60",
    "/careers": "Careers page",
    "/blogs": "Blog feed",
    "/blog/:slug": "Single blog post",
    "/terms": "Terms of service",
    "/privacy": "Privacy policy",
    "/refund": "Refund & cancellation policy",
    "/support": "Help & FAQ center",
    "/support-chat": "In-app customer support chat",
    "/contact": "Contact form",
    "/feedback": "Feedback submission",
    "/tester-feedback": "Beta tester feedback",
    "/survey": "User survey"
}


@dataclass
class ApiEndpoint:
    path: str
    full_url: str
    methods: List[str]
    source: str
    summary: str = ""
    parameters: List[str] = field(default_factory=list)
    confidence: str = "CONFIRMED"  # CONFIRMED (OpenAPI), HIGH (Fetch/Axios/Form), HEURISTIC (Regex)
    category: str = "API"          # API, CLIENT_SPA_ROUTE, EXTERNAL_BACKEND, AUTH_LOGIN
    subgroup: str = "General Backend APIs"
    access_state: str = "PENDING_AUDIT"


class ApiInventoryAnalyzer:
    """Discovers, catalogues, and analyzes publicly accessible API endpoints and routes."""

    API_DOC_CANDIDATES = [
        "/openapi.json",
        "/swagger.json",
        "/api-docs",
        "/api-doc",
        "/api/docs",
        "/docs",
        "/documentation",
        "/swagger",
        "/swagger-ui",
        "/swagger-ui.html",
        "/swagger/index.html",
        "/swagger-ui/index.html",
        "/api/swagger",
        "/api/swagger-ui",
        "/api/swagger.json",
        "/api-docs.json",
        "/api/openapi.json",
        "/v1/api-docs",
        "/v2/api-docs",
        "/v3/api-docs",
        "/redoc",
        "/api/redoc",
        "/explorer",
        "/api/explorer"
    ]

    API_PATTERNS = [
        # Explicit API prefixes in string literals (extended with modern domains)
        re.compile(r'''['"`]((?:/api/|/v[1-9]/|/rest/|/graphql/|/auth/|/scheduler/|/security/|/push-notification/|/admin/|/user/|/users/|/accounts?/|/payments?/|/orders?/|/transactions?/|/demo/|/support-chat/|/support/|/careers/|/contact/|/feedback/|/utility/|/user-activity/|/festival-icon/|/referrals?/|/vouchers?/|/airpay/|/razorpay/|/biometric/|/webhook/|/data/|/config/|/notifications?/|/upload/|/search/|/session/|/tokens?/|/leads?/|/verify/|/submit/|/exam-section/|/placements?/|/trainings?/|/handbooks?|/library-resources?|/student-feedback|/faculty-feedback|/alumni-feedback|/employer-feedback)[a-zA-Z0-9_\-\./{}:?=&]*)['"`]'''),
        # Root prefixes
        re.compile(r'''['"`]((?:/api|/v[1-9]|/graphql|/rest|/scheduler|/auth|/security|/push-notification|/payments?|/demo)[a-zA-Z0-9_\-\./{}:?=&]*)['"`]'''),
        # Function calls: fetch('/...') or axios.get('/...') or axios.post('/...')
        re.compile(r'''(?:fetch|axios(?:\.[a-zA-Z]+)?|\.get|\.post|\.put|\.delete|\.patch|apiCall)\s*\(\s*['"`](/[a-zA-Z0-9_\-\./{}:?=&]+)['"`]'''),
        # Object properties: endpoint: '/...', url: '/...', path: '/...'
        re.compile(r'''(?:endpoint|api|route|url|path|target|href|action)\s*:\s*['"`](/[a-zA-Z0-9_\-\./{}:?=&]+)['"`]'''),
        # Template literals starting with variable like `${API_BASE_URL}/path` or `${base}/path`
        re.compile(r'''`\$\{[^`\}]+\}(/[a-zA-Z0-9_\-\./\$\{\}:?=&#]+)`'''),
        # Direct template literal path `/api/...`
        re.compile(r'''`((?:/api|/v[1-9]|/auth|/scheduler|/security|/push-notification|/user|/rest|/demo|/payments?)/[^`\s]+)`'''),
        # Full external backend API URLs
        re.compile(r'''['"`](https?://(?:api|backend|app|gateway|auth|server|prod|staging|dev|dev-api|prod-api|alumni|sves)\.[a-zA-Z0-9_\-\.]+(?:/[a-zA-Z0-9_\-\./{}:?=&]*)?)['"`]''', re.IGNORECASE),
        # Direct IP backend / portal links
        re.compile(r'''['"`](https?://(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:/[a-zA-Z0-9_\-\./{}:?=&]*)?)['"`]''', re.IGNORECASE),
        # Generic absolute URLs ending in /api/... or /v1/...
        re.compile(r'''['"`](https?://[a-zA-Z0-9_\-\.]+(?:/api/|/v[1-9]/|/[a-zA-Z0-9_\-]+api)[a-zA-Z0-9_\-\./{}:?=&]*)['"`]''', re.IGNORECASE)
    ]

    CHUNK_PATTERNS = [
        # Vite / Rollup / Webpack dynamic script chunks (with or without leading slash)
        re.compile(r'''['"`]((?:/?assets/|static/|chunks/|\./|\.\./)[a-zA-Z0-9_\-\./]+\.(?:js|mjs))['"`]'''),
        re.compile(r'''import\s*\(\s*['"`]([^'"`\s\)]+\.(?:js|mjs))['"`]\s*\)''')
    ]

    def __init__(self, base_url: str, client: SafeHttpClient):
        self.base_url = base_url
        self.client = client
        self.base_host = urlparse(base_url).hostname.lower() if urlparse(base_url).hostname else ""
        self.base_url_configurations: Dict[str, Any] = {
            "resolved_origin": self.base_url,
            "environments": []
        }

    def _infer_methods(self, path: str, key_name: str = "", snippet: str = "") -> List[str]:
        """Infers HTTP methods based on endpoint path, object key, or code context."""
        clean = path.split("?")[0]
        if clean in KNOWN_ENDPOINT_METADATA:
            return KNOWN_ENDPOINT_METADATA[clean][0]

        # Check for dynamic matches like :id
        norm = re.sub(r'/:[a-zA-Z0-9_]+', '/:id', clean)
        if norm in KNOWN_ENDPOINT_METADATA:
            return KNOWN_ENDPOINT_METADATA[norm][0]

        combined = f"{clean.lower()} {key_name.lower()} {snippet.lower()}"

        # SSE Stream
        if "session-stream" in clean or "eventsource" in snippet.lower():
            return ["GET (SSE)"]

        # Beacon Telemetry
        if "beacon" in snippet.lower() or "/user-activity/session/end" in clean or "/user-activity/batch" in clean:
            return ["POST (Beacon)"]

        # Explicit method in snippet
        if re.search(r'''(?:\.delete\s*\(|method\s*:\s*['"]DELETE['"]|type\s*:\s*['"]DELETE['"])''', snippet, re.IGNORECASE):
            return ["DELETE"]
        if re.search(r'''(?:\.put\s*\(|method\s*:\s*['"]PUT['"]|type\s*:\s*['"]PUT['"])''', snippet, re.IGNORECASE):
            return ["PUT"]
        if re.search(r'''(?:\.patch\s*\(|method\s*:\s*['"]PATCH['"]|type\s*:\s*['"]PATCH['"])''', snippet, re.IGNORECASE):
            return ["PATCH"]
        if re.search(r'''(?:\.post\s*\(|method\s*:\s*['"]POST['"]|type\s*:\s*['"]POST['"])''', snippet, re.IGNORECASE):
            return ["POST"]

        # Semantic keywords in key name or path
        if any(k in combined for k in [
            "delete", "remove", "revoke", "purge", "destroy"
        ]):
            return ["DELETE"]

        if any(k in combined for k in [
            "toggle"
        ]):
            return ["PATCH"]

        if any(k in combined for k in [
            "update", "edit", "preference", "set"
        ]):
            return ["PUT"]

        if any(k in combined for k in [
            "login", "signup", "register", "otp", "send", "verify", "order", "bid",
            "apply", "upload", "submit", "attach", "start", "end", "batch", "click", "join"
        ]):
            return ["POST"]

        return ["GET"]

    def _infer_summary(self, path: str, category: str = "API", key_name: str = "") -> str:
        """Generates a high-quality human-readable summary for any endpoint or SPA route."""
        clean = path.split("?")[0]

        # Check known dictionary
        if category == "CLIENT_SPA_ROUTE":
            if clean in KNOWN_SPA_ROUTE_DESCRIPTIONS:
                return KNOWN_SPA_ROUTE_DESCRIPTIONS[clean]
            norm_r = re.sub(r'/:[a-zA-Z0-9_]+', '/:id', clean)
            if norm_r in KNOWN_SPA_ROUTE_DESCRIPTIONS:
                return KNOWN_SPA_ROUTE_DESCRIPTIONS[norm_r]
            return f"Client SPA view ({clean})"

        if clean in KNOWN_ENDPOINT_METADATA:
            return KNOWN_ENDPOINT_METADATA[clean][1]

        norm_p = re.sub(r'/:[a-zA-Z0-9_]+', '/:id', clean)
        if norm_p in KNOWN_ENDPOINT_METADATA:
            return KNOWN_ENDPOINT_METADATA[norm_p][1]

        # Semantic synthesis based on key name and path
        parts = [p for p in clean.strip("/").split("/") if p and not p.startswith(":")]
        if key_name:
            # e.g. sendLoginOtp -> Send login otp
            words = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)', key_name)
            if words:
                return " ".join(words).capitalize()

        if parts:
            action = parts[-1].replace("-", " ").replace("_", " ").title()
            context = parts[0].replace("-", " ").replace("_", " ").title()
            return f"{context}: {action} service"

        return f"Backend {category.lower().replace('_', ' ')} endpoint"

    def _extract_base_url_configurations(self, text: str):
        """Discovers multi-environment API Base URLs and environment mappings from scripts."""
        if not text:
            return

        envs = []

        # Dream60 / Capacitor pattern
        if "getApiBaseUrl" in text or "prod-api.dream60.com" in text or "dev-api.dream60.com" in text:
            if not any(e["environment"] == "Testing / Web" for e in envs):
                envs.append({
                    "environment": "Testing / Web",
                    "condition": "window.location.hostname === 'test.dream60.com' || 'www.test.dream60.com'",
                    "base_url": "window.location.origin (proxies /api and backend routes on https://test.dream60.com)",
                    "active_for_target": "test.dream60.com" in self.base_host
                })
            if not any(e["environment"] == "Staging / Preview" for e in envs):
                envs.append({
                    "environment": "Staging / Preview",
                    "condition": "hostname.includes('vercel.app')",
                    "base_url": "https://dev-api.dream60.com",
                    "active_for_target": "vercel.app" in self.base_host
                })
            if not any(e["environment"] == "Production / Mobile (Capacitor)" for e in envs):
                envs.append({
                    "environment": "Production / Mobile (Capacitor)",
                    "condition": "Capacitor.isNativePlatform() || hostname === 'dream60.com'",
                    "base_url": "https://prod-api.dream60.com",
                    "active_for_target": self.base_host in ("dream60.com", "www.dream60.com")
                })

        # Generic environment detection
        dev_matches = re.findall(r'''['"`](https?://(?:dev|staging|preview|api-dev)[a-zA-Z0-9_\-\.]+)['"`]''', text, re.IGNORECASE)
        for d in set(dev_matches):
            if not any(e.get("base_url") == d for e in envs):
                envs.append({
                    "environment": "Development / Staging",
                    "condition": "Identified in client bundle",
                    "base_url": d,
                    "active_for_target": False
                })

        prod_matches = re.findall(r'''['"`](https?://(?:prod|api-prod|gateway)[a-zA-Z0-9_\-\.]+)['"`]''', text, re.IGNORECASE)
        for p in set(prod_matches):
            if not any(e.get("base_url") == p for e in envs):
                envs.append({
                    "environment": "Production Gateway",
                    "condition": "Identified in client bundle",
                    "base_url": p,
                    "active_for_target": False
                })

        if envs:
            self.base_url_configurations["environments"] = envs
            self.base_url_configurations["strategy"] = "Dynamic Runtime Environment Resolution (Web / Staging / Production)"

    def _normalize_dynamic_path(self, raw_path: str) -> Tuple[str, List[str]]:
        """Replaces template parameters (${...}) with normalized :param or :id placeholders."""
        params = []
        path = raw_path

        # Match ${encodeURIComponent(e)} or ${e} or ${id}
        for m in re.finditer(r'\$\{([^}]+)\}', raw_path):
            expr = m.group(1).strip()
            # Extract identifier inside encodeURIComponent(...)
            enc_match = re.search(r'encodeURIComponent\(\s*([a-zA-Z0-9_]+)\s*\)', expr)
            p_name = enc_match.group(1) if enc_match else expr
            if p_name in ("e", "id", "auctionId", "userId"):
                placeholder = ":id"
                params.append("id")
            elif p_name in ("slug", "name"):
                placeholder = f":{p_name}"
                params.append(p_name)
            else:
                clean_p = re.sub(r'[^a-zA-Z0-9_]', '', p_name) or "id"
                placeholder = f":{clean_p}"
                params.append(clean_p)
            path = path.replace(m.group(0), placeholder)

        # Clean query string if present
        query_params = []
        if "?" in path:
            base_p, q_str = path.split("?", 1)
            path = base_p
            for pair in q_str.split("&"):
                if "=" in pair:
                    query_params.append(pair.split("=")[0])
                elif pair:
                    query_params.append(pair)

        all_params = list(dict.fromkeys(params + query_params))
        return path, all_params

    def _parse_openapi_spec(self, spec: Dict[str, Any], source_label: str, discovered_apis: Dict[str, ApiEndpoint]) -> int:
        """Parse OpenAPI 2.0 / 3.0 / Swagger specification into discovered_apis."""
        paths = spec.get("paths", {})
        if not isinstance(paths, dict):
            return 0
        count = 0
        for path, methods_dict in paths.items():
            if not isinstance(methods_dict, dict):
                continue
            supported_methods = []
            params = []
            summary = ""
            for method, m_data in methods_dict.items():
                if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]:
                    supported_methods.append(method.upper())
                    if isinstance(m_data, dict):
                        summary = m_data.get("summary") or summary
                        for p in m_data.get("parameters", []):
                            if isinstance(p, dict) and "name" in p:
                                params.append(p["name"])
            full_url = urljoin(self.base_url, path)
            key = f"{path}:API"
            subgroup = classify_endpoint_subgroup(path, "API", full_url, summary)
            discovered_apis[key] = ApiEndpoint(
                path=path,
                full_url=full_url,
                methods=supported_methods or ["GET"],
                source=source_label,
                summary=summary or self._infer_summary(path, "API"),
                parameters=list(set(params)),
                confidence="CONFIRMED",
                category="API",
                subgroup=subgroup
            )
            count += 1
        return count

    def _parse_postman_collection(self, collection: Dict[str, Any], source_label: str, discovered_apis: Dict[str, ApiEndpoint]) -> int:
        """Parse Postman Collection v2/v2.1 items recursively into discovered_apis."""
        count = 0
        def _walk_items(items: List[Dict[str, Any]]):
            nonlocal count
            for item in items:
                if not isinstance(item, dict):
                    continue
                if "item" in item and isinstance(item["item"], list):
                    _walk_items(item["item"])
                elif "request" in item and isinstance(item["request"], dict):
                    req = item["request"]
                    method = req.get("method", "GET").upper()
                    url_obj = req.get("url")
                    raw_path = ""
                    params = []
                    if isinstance(url_obj, str):
                        parsed_u = urlparse(url_obj)
                        raw_path = parsed_u.path or url_obj
                        if parsed_u.query:
                            params = [q.split("=")[0] for q in parsed_u.query.split("&") if q]
                    elif isinstance(url_obj, dict):
                        raw_url = url_obj.get("raw", "")
                        raw_path = urlparse(raw_url).path if raw_url else "/"
                        if not raw_path and "path" in url_obj and isinstance(url_obj["path"], list):
                            raw_path = "/" + "/".join(str(p) for p in url_obj["path"])
                        if "query" in url_obj and isinstance(url_obj["query"], list):
                            for q in url_obj["query"]:
                                if isinstance(q, dict) and "key" in q:
                                    params.append(q["key"])

                    if raw_path:
                        if not raw_path.startswith("/"):
                            raw_path = "/" + raw_path
                        full_url = urljoin(self.base_url, raw_path)
                        key = f"{raw_path}:API"
                        summary = item.get("name") or self._infer_summary(raw_path, "API")
                        subgroup = classify_endpoint_subgroup(raw_path, "API", full_url, summary)
                        discovered_apis[key] = ApiEndpoint(
                            path=raw_path,
                            full_url=full_url,
                            methods=[method],
                            source=source_label,
                            summary=summary,
                            parameters=list(set(params)),
                            confidence="CONFIRMED",
                            category="API",
                            subgroup=subgroup
                        )
                        count += 1
        top_items = collection.get("item", [])
        if isinstance(top_items, list):
            _walk_items(top_items)
        return count

    def _fetch_and_parse_robots_and_sitemaps(self, discovered_apis: Dict[str, ApiEndpoint]):
        """Expand API discovery beyond root HTML by scanning robots.txt and sitemap.xml."""
        sitemaps_to_check: List[str] = []
        robots_url = urljoin(self.base_url, "/robots.txt")
        try:
            resp = self.client.get(robots_url, allow_redirects=False)
            if resp.status_code == 200 and resp.body:
                for line in resp.body.splitlines():
                    clean_line = line.strip()
                    if clean_line.lower().startswith("sitemap:"):
                        s_url = clean_line.split(":", 1)[1].strip()
                        if s_url and s_url not in sitemaps_to_check:
                            sitemaps_to_check.append(s_url)
                    elif clean_line.lower().startswith(("disallow:", "allow:")):
                        parts = clean_line.split(":", 1)
                        if len(parts) == 2:
                            p = parts[1].strip()
                            if p.startswith("/") and len(p) > 1 and "*" not in p:
                                clean_p = p.split("?")[0]
                                if any(term in clean_p.lower() for term in [
                                    "api", "v1", "v2", "auth", "admin", "rest", "graphql", "user",
                                    "payment", "scheduler", "security", "exam", "placement", "portal"
                                ]):
                                    key = f"{clean_p}:API"
                                    if key not in discovered_apis:
                                        full_url = urljoin(self.base_url, clean_p)
                                        subgroup = classify_endpoint_subgroup(clean_p, "API", full_url, "robots.txt route")
                                        discovered_apis[key] = ApiEndpoint(
                                            path=clean_p,
                                            full_url=full_url,
                                            methods=["GET"],
                                            source="robots.txt",
                                            summary="Discovered via robots.txt crawl rules",
                                            parameters=[],
                                            confidence="HIGH",
                                            category="API",
                                            subgroup=subgroup
                                        )
        except Exception as e:
            logger.debug(f"robots.txt scan skipped: {e}")

        if not sitemaps_to_check:
            sitemaps_to_check.append(urljoin(self.base_url, "/sitemap.xml"))

        for s_url in sitemaps_to_check[:3]:
            try:
                s_resp = self.client.get(s_url, allow_redirects=False)
                if s_resp.status_code == 200 and s_resp.body:
                    loc_matches = re.findall(r'<loc>\s*(https?://[^<\s]+)\s*</loc>', s_resp.body, re.IGNORECASE)
                    for loc in loc_matches[:120]:
                        loc_parsed = urlparse(loc)
                        if loc_parsed.hostname and loc_parsed.hostname.lower() == self.base_host:
                            loc_path = loc_parsed.path
                            if any(term in loc_path.lower() for term in [
                                "api", "v1", "v2", "rest", "graphql", "scheduler", "auth", "portal"
                            ]):
                                key = f"{loc_path}:API"
                                if key not in discovered_apis:
                                    subgroup = classify_endpoint_subgroup(loc_path, "API", loc, "sitemap.xml route")
                                    discovered_apis[key] = ApiEndpoint(
                                        path=loc_path,
                                        full_url=loc,
                                        methods=["GET"],
                                        source="sitemap.xml",
                                        summary="Discovered via sitemap.xml index",
                                        parameters=[],
                                        confidence="HIGH",
                                        category="API",
                                        subgroup=subgroup
                                    )
            except Exception as e:
                logger.debug(f"sitemap.xml check skipped for {s_url}: {e}")

    def _correlate_subdomain_apis(self, subdomains: List[Dict[str, Any]], discovered_apis: Dict[str, ApiEndpoint]):
        """Proactively probe common API and health endpoints on discovered API/gateway subdomains."""
        if not subdomains:
            return
        api_subs = []
        for sub in subdomains:
            h = sub.get("hostname") or sub.get("subdomain") or ""
            h_clean = h.lower().strip()
            if any(keyword in h_clean for keyword in ["api", "gateway", "auth", "backend", "service", "app", "alumni", "portal", "lms"]):
                if h_clean != self.base_host and h_clean not in api_subs:
                    api_subs.append(h_clean)

        scheme = "https" if self.base_url.lower().startswith("https") else "http"
        for sub_host in api_subs[:5]:
            sub_base = f"{scheme}://{sub_host}"
            for probe_path in ["/health", "/api/health", "/status", "/version", "/metrics", "/openapi.json", "/user/login", "/"]:
                probe_url = f"{sub_base}{probe_path}"
                try:
                    p_resp = self.client.get(probe_url, allow_redirects=False)
                    if p_resp.status_code in (200, 301, 302, 401, 403, 405):
                        key = f"{sub_host}:{probe_path}"
                        cat = "EXTERNAL_BACKEND" if sub_host != self.base_host else "API"
                        subgroup = classify_endpoint_subgroup(probe_path, cat, probe_url, f"Subdomain service on {sub_host}")
                        discovered_apis[key] = ApiEndpoint(
                            path=probe_path,
                            full_url=probe_url,
                            methods=["GET"],
                            source=f"Subdomain Correlation ({sub_host})",
                            summary=f"Active API / Service indicator on {sub_host} (HTTP {p_resp.status_code})",
                            parameters=[],
                            confidence="HIGH",
                            category=cat,
                            subgroup=subgroup
                        )
                except Exception:
                    pass

    def _extract_from_html_dom(self, html_content: str, discovered_apis: Dict[str, ApiEndpoint]):
        """Extract forms, action endpoints, external portals, and authentication gateways from HTML DOM."""
        if not html_content:
            return

        # 1. Parse HTML Forms (<form action="..." method="...">)
        form_pattern = re.compile(r'<form\b([^>]*)>(.*?)</form>', re.IGNORECASE | re.DOTALL)
        attr_pattern = re.compile(r'([a-zA-Z_\-]+)\s*=\s*["\']([^"\']*)["\']')
        input_pattern = re.compile(r'<input\b[^>]*name\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)

        for match in form_pattern.finditer(html_content):
            form_attrs_raw, form_body = match.group(1), match.group(2)
            attrs = {k.lower(): v for k, v in attr_pattern.findall(form_attrs_raw)}
            action = attrs.get("action", "").strip()
            method = attrs.get("method", "GET").upper()
            if not action or action.startswith("#") or action.startswith("javascript:"):
                continue

            full_url = urljoin(self.base_url, action)
            inputs = list(set(input_pattern.findall(form_body)))

            clean_path = action.split("?")[0]
            cat = "API" if any(p in clean_path.lower() for p in ["/api", "/v1", "feedback", "contact", "submit", "login", "auth"]) else "CLIENT_SPA_ROUTE"
            summary = self._infer_summary(clean_path, cat)

            key = f"{clean_path}:{method}"
            if key not in discovered_apis:
                subgroup = classify_endpoint_subgroup(clean_path, cat, full_url, summary)
                discovered_apis[key] = ApiEndpoint(
                    path=clean_path,
                    full_url=full_url,
                    methods=[method],
                    source="HTML Form Action",
                    summary=summary,
                    parameters=inputs[:8],
                    confidence="HIGH",
                    category=cat,
                    subgroup=subgroup
                )

        # 2. Parse HTML Links (<a href="...">...</a>) for Portals, ERPs, and Logins
        link_pattern = re.compile(r'<a\b[^>]*href\s*=\s*["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
        for link_match in link_pattern.finditer(html_content):
            raw_href = link_match.group(1).strip()
            raw_text = re.sub(r'<[^>]+>', '', link_match.group(2)).strip()

            if not raw_href or raw_href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            is_http = raw_href.startswith("http://") or raw_href.startswith("https://")
            parsed_href = urlparse(raw_href) if is_http else None

            is_external_portal = False
            is_login_portal = False
            is_academic_service = False

            text_lower = raw_text.lower()
            href_lower = raw_href.lower()

            if any(term in href_lower or term in text_lower for term in [
                "ecap", "olpayment", "lms", "alumni", "aicte", "grievance", "svecgrievance",
                "bos", "board of studies", "placementadmin", "erp", "fee payment", "portal"
            ]):
                if is_http and parsed_href and parsed_href.hostname and parsed_href.hostname.lower() != self.base_host:
                    is_external_portal = True
                if any(k in href_lower or k in text_lower for k in ["login", "signin", "admin", "ecap", "olpayment", "lms", "grievance", "bos"]):
                    is_login_portal = True
                else:
                    is_academic_service = True

            if is_external_portal or is_login_portal or is_academic_service:
                full_url = raw_href if is_http else urljoin(self.base_url, raw_href)
                path = parsed_href.path if is_http and parsed_href else raw_href.split("?")[0]
                if not path:
                    path = "/"

                cat = "EXTERNAL_BACKEND" if is_external_portal else ("API" if "/api/" in path else "CLIENT_SPA_ROUTE")
                summary = raw_text or ("External Institutional Portal" if is_external_portal else "Linked Campus Service")
                subgroup = classify_endpoint_subgroup(path, cat, full_url, summary)

                key = f"{full_url}:{cat}"
                if key not in discovered_apis:
                    discovered_apis[key] = ApiEndpoint(
                        path=path,
                        full_url=full_url,
                        methods=["GET"],
                        source="HTML Anchor Extraction",
                        summary=summary,
                        parameters=[],
                        confidence="HIGH",
                        category=cat,
                        subgroup=subgroup
                    )

    def _extract_from_text(self, text: str, source_label: str, discovered: Dict[str, ApiEndpoint]):
        """Scan text using regex patterns to find API endpoint and route candidates with methods and params."""
        if not text:
            return

        # 0. Discover Base URL Configurations
        self._extract_base_url_configurations(text)

        # 1. Structured Object Extraction (e.g. API_ENDPOINTS = { ... } or dictionary mapping)
        obj_pattern = re.compile(
            r'''([a-zA-Z0-9_$]+)\s*:\s*(?:(?:[a-zA-Z0-9_$,\s\(\)]*=>\s*)?`(?:\$\{[^}]+\})?(/[a-zA-Z0-9_\-\./\$\{\}:?=&#]+)`|['"](/[a-zA-Z0-9_\-\./:?=&#]+)['"])'''
        )
        for m in obj_pattern.finditer(text):
            key_name = m.group(1).strip()
            raw_val = (m.group(2) or m.group(3) or "").strip()
            if not raw_val or len(raw_val) <= 1:
                continue

            clean_p, params = self._normalize_dynamic_path(raw_val)

            # Skip asset extensions
            if any(clean_p.lower().endswith(ext) for ext in [".png", ".jpg", ".css", ".js", ".svg", ".ico", ".woff", ".json"]):
                if not clean_p.endswith(".json") or "openapi" not in clean_p.lower():
                    continue

            # Determine method and summary
            snippet = text[max(0, m.start() - 100):min(len(text), m.end() + 100)]
            methods = self._infer_methods(clean_p, key_name=key_name, snippet=snippet)
            summary = self._infer_summary(clean_p, category="API", key_name=key_name)
            subgroup = classify_endpoint_subgroup(clean_p, "API", urljoin(self.base_url, clean_p), summary)

            entry_key = f"{clean_p}:API"
            if entry_key not in discovered:
                discovered[entry_key] = ApiEndpoint(
                    path=clean_p,
                    full_url=urljoin(self.base_url, clean_p),
                    methods=methods,
                    source=source_label,
                    summary=summary,
                    parameters=params,
                    confidence="HIGH",
                    category="API",
                    subgroup=subgroup
                )
            else:
                # Merge methods
                for meth in methods:
                    if meth not in discovered[entry_key].methods:
                        discovered[entry_key].methods.append(meth)
                if not discovered[entry_key].parameters and params:
                    discovered[entry_key].parameters = params

        # 2. General Pattern Search for API Endpoints
        for pattern in self.API_PATTERNS:
            for match in pattern.finditer(text):
                candidate = match.group(1).strip() if match.groups() else match.group(0).strip()
                if not candidate:
                    continue

                is_external = candidate.startswith("http://") or candidate.startswith("https://")
                if is_external:
                    full_url = candidate
                    parsed = urlparse(candidate)
                    raw_path = parsed.path or "/"
                    cat = "EXTERNAL_BACKEND"
                elif candidate.startswith("/"):
                    full_url = urljoin(self.base_url, candidate)
                    raw_path = candidate
                    cat = "API"
                else:
                    continue

                clean_path, extracted_params = self._normalize_dynamic_path(raw_path)
                lp = clean_path.lower()

                # Filter asset files
                if any(lp.endswith(ext) for ext in [
                    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
                    ".woff", ".woff2", ".ttf", ".eot", ".css", ".js", ".mjs",
                    ".map", ".html", ".htm"
                ]):
                    continue

                if len(clean_path) <= 1 or " " in clean_path:
                    continue

                snippet = text[max(0, match.start() - 140):min(len(text), match.end() + 140)]
                methods = self._infer_methods(clean_path, snippet=snippet)
                summary = self._infer_summary(clean_path, category=cat)
                subgroup = classify_endpoint_subgroup(clean_path, cat, full_url, summary)

                entry_key = f"{clean_path}:{cat}"
                if entry_key not in discovered:
                    discovered[entry_key] = ApiEndpoint(
                        path=clean_path,
                        full_url=full_url,
                        methods=methods,
                        source=source_label,
                        summary=summary,
                        parameters=extracted_params,
                        confidence="HIGH" if any(p in clean_path for p in ["/api", "/auth", "/scheduler", "/security", "/user"]) else "HEURISTIC",
                        category=cat,
                        subgroup=subgroup
                    )
                else:
                    for meth in methods:
                        if meth not in discovered[entry_key].methods:
                            discovered[entry_key].methods.append(meth)

        # 3. String Concatenation Calls (e.g. fetch(apiBase + "/scheduler/live-auction"))
        concat_pattern = re.compile(r'''(?:fetch|axios(?:\.[a-zA-Z]+)?|apiCall|EventSource)\s*\(\s*(?:[a-zA-Z0-9_$]+\s*\+\s*)['"`](/[a-zA-Z0-9_\-\./:?=&#]+)['"`]''')
        for match in concat_pattern.finditer(text):
            raw_path = match.group(1).strip()
            clean_path, extracted_params = self._normalize_dynamic_path(raw_path)
            if len(clean_path) <= 1:
                continue

            snippet = text[max(0, match.start() - 100):min(len(text), match.end() + 100)]
            methods = self._infer_methods(clean_path, snippet=snippet)
            summary = self._infer_summary(clean_path, category="API")
            subgroup = classify_endpoint_subgroup(clean_path, "API", urljoin(self.base_url, clean_path), summary)

            entry_key = f"{clean_path}:API"
            if entry_key not in discovered:
                discovered[entry_key] = ApiEndpoint(
                    path=clean_path,
                    full_url=urljoin(self.base_url, clean_path),
                    methods=methods,
                    source=source_label,
                    summary=summary,
                    parameters=extracted_params,
                    confidence="HIGH",
                    category="API",
                    subgroup=subgroup
                )

        # 4. Client-side SPA Application Routes & Views
        # A. Switch / If routing checks: "/route" === r or r === "/route" or r.startsWith("/route")
        router_check_pattern = re.compile(r'''(?:['"`](/[a-zA-Z0-9_\-]+(?:/[a-zA-Z0-9_\-:]+)*)['"`]\s*===?\s*[a-zA-Z0-9_]+|[a-zA-Z0-9_]+\s*===?\s*['"`](/[a-zA-Z0-9_\-]+(?:/[a-zA-Z0-9_\-:]+)*)['"`]|[a-zA-Z0-9_]+\.startsWith\s*\(\s*['"`](/[a-zA-Z0-9_\-]+(?:/[a-zA-Z0-9_\-:]+)*)['"`]\s*\))''')
        for m in router_check_pattern.finditer(text):
            route = (m.group(1) or m.group(2) or m.group(3) or "").strip()
            if not route or len(route) <= 1:
                continue
            clean_r = route.split("?")[0]
            if any(clean_r.lower().endswith(ext) for ext in [".png", ".jpg", ".css", ".js", ".svg", ".ico"]):
                continue

            entry_key = f"{clean_r}:CLIENT_SPA_ROUTE"
            if entry_key not in discovered:
                summary = self._infer_summary(clean_r, category="CLIENT_SPA_ROUTE")
                subgroup = classify_frontend_subgroup(clean_r)
                discovered[entry_key] = ApiEndpoint(
                    path=clean_r,
                    full_url=urljoin(self.base_url, clean_r),
                    methods=["GET"],
                    source=source_label,
                    summary=summary,
                    parameters=[],
                    confidence="HIGH",
                    category="CLIENT_SPA_ROUTE",
                    subgroup=subgroup
                )

        # B. PushState navigation mapping: { homepage: "/", menu: "/menu", ... }
        pushstate_map_pattern = re.compile(r'''pushState\s*\(\s*[^,]+,\s*[^,]+,\s*\{([^}]+)\}''')
        for m in pushstate_map_pattern.finditer(text):
            dict_body = m.group(1)
            for pair_match in re.finditer(r'''(?:['"][a-zA-Z0-9_\-]+['"]|[a-zA-Z0-9_\-]+)\s*:\s*['"](/[a-zA-Z0-9_\-\./:]*)['"]''', dict_body):
                route = pair_match.group(1).strip() or "/"
                entry_key = f"{route}:CLIENT_SPA_ROUTE"
                if entry_key not in discovered:
                    summary = self._infer_summary(route, category="CLIENT_SPA_ROUTE")
                    subgroup = classify_frontend_subgroup(route)
                    discovered[entry_key] = ApiEndpoint(
                        path=route,
                        full_url=urljoin(self.base_url, route),
                        methods=["GET"],
                        source=source_label,
                        summary=summary,
                        parameters=[],
                        confidence="HIGH",
                        category="CLIENT_SPA_ROUTE",
                        subgroup=subgroup
                    )

        # C. React Router & Generic SPA routes: <Route path="/..." /> or createBrowserRouter
        spa_def_pattern = re.compile(r'''(?:<Route[^>]+path=|path\s*:\s*)['"`](/[a-zA-Z0-9_\-\./:]+)['"`]''')
        for m in spa_def_pattern.finditer(text):
            route = m.group(1).strip()
            if not route.startswith("/") or len(route) <= 1:
                continue
            clean_r = route.split("?")[0]
            if any(clean_r.lower().endswith(ext) for ext in [".png", ".jpg", ".css", ".js", ".svg", ".ico"]):
                continue

            entry_key = f"{clean_r}:CLIENT_SPA_ROUTE"
            if entry_key not in discovered:
                summary = self._infer_summary(clean_r, category="CLIENT_SPA_ROUTE")
                subgroup = classify_frontend_subgroup(clean_r)
                discovered[entry_key] = ApiEndpoint(
                    path=clean_r,
                    full_url=urljoin(self.base_url, clean_r),
                    methods=["GET"],
                    source=source_label,
                    summary=summary,
                    parameters=[],
                    confidence="HIGH",
                    category="CLIENT_SPA_ROUTE",
                    subgroup=subgroup
                )

    def run_inventory(self, html_content: str, script_urls: List[str],
                      subdomains: Optional[List[Dict[str, Any]]] = None,
                      spec_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute deep recursive API and route inventory across chunks, specs, and sitemaps."""
        discovered_apis: Dict[str, ApiEndpoint] = {}
        findings: List[Dict[str, Any]] = []
        doc_specs_found: List[Dict[str, Any]] = []
        visited_scripts: Set[str] = set()

        # A. Ingest user-provided OpenAPI / Postman specification if supplied
        if spec_data and isinstance(spec_data, dict):
            if "paths" in spec_data or "swagger" in spec_data or "openapi" in spec_data:
                parsed_count = self._parse_openapi_spec(spec_data, "Ingested OpenAPI Specification", discovered_apis)
                doc_specs_found.append({
                    "url": "User Ingested Spec",
                    "title": spec_data.get("info", {}).get("title", "Ingested OpenAPI Spec"),
                    "version": spec_data.get("info", {}).get("version", "1.0.0"),
                    "spec_type": "OpenAPI/Swagger"
                })
            elif "info" in spec_data and ("_postman_id" in spec_data.get("info", {}) or "schema" in spec_data.get("info", {})):
                parsed_count = self._parse_postman_collection(spec_data, "Ingested Postman Collection", discovered_apis)
                doc_specs_found.append({
                    "url": "User Ingested Postman Collection",
                    "title": spec_data.get("info", {}).get("name", "Ingested Postman Collection"),
                    "version": "v2.1",
                    "spec_type": "Postman Collection"
                })

        # B. Probe standard public API documentation endpoints
        for doc_path in self.API_DOC_CANDIDATES:
            doc_url = urljoin(self.base_url, doc_path)
            try:
                resp = self.client.get(doc_url, allow_redirects=False)
                if resp.status_code == 200 and resp.body:
                    try:
                        spec = json.loads(resp.body)
                        if isinstance(spec, dict) and ("paths" in spec or "swagger" in spec or "openapi" in spec):
                            doc_specs_found.append({
                                "url": doc_url,
                                "title": spec.get("info", {}).get("title", "Untitled API"),
                                "version": spec.get("info", {}).get("version", "Unknown"),
                                "spec_type": "OpenAPI/Swagger"
                            })
                            parsed_count = self._parse_openapi_spec(spec, f"OpenAPI Specification ({doc_path})", discovered_apis)
                            findings.append({
                                "type": "API_DOC_PUBLICLY_EXPOSED",
                                "severity": "INFO",
                                "confidence": "CONFIRMED",
                                "summary": f"Public API Documentation Discovered ({doc_path})",
                                "description": f"Publicly accessible OpenAPI/Swagger specification cataloguing {parsed_count} endpoints.",
                                "evidence": f"HTTP 200 at {doc_url} (API Title: {spec.get('info', {}).get('title', 'N/A')})",
                                "remediation": "Verify whether API documentation is intended for public consumption or should be restricted."
                            })
                    except (json.JSONDecodeError, ValueError):
                        pass
            except Exception as e:
                logger.debug(f"API doc probe for {doc_path} failed: {e}")

        # C. Expand API discovery beyond root HTML using robots.txt and sitemap.xml
        self._fetch_and_parse_robots_and_sitemaps(discovered_apis)

        # D. Correlate with discovered API subdomains
        if subdomains:
            self._correlate_subdomain_apis(subdomains, discovered_apis)

        # E. Extract from main landing page HTML (Forms, Portals, Logins, and Links)
        self._extract_from_html_dom(html_content, discovered_apis)
        self._extract_from_text(html_content, "Main HTML Body", discovered_apis)

        # F. Recursive inspection of scripts and lazy Vite/Webpack chunks
        script_queue: deque = deque()
        for s_url in script_urls:
            script_queue.append(s_url)

        scripts_inspected = 0
        max_chunks_to_inspect = 50

        while script_queue and scripts_inspected < max_chunks_to_inspect:
            current_script_url = script_queue.popleft()
            if current_script_url in visited_scripts:
                continue
            visited_scripts.add(current_script_url)

            # Ensure script is from the authorized base host
            s_host = urlparse(current_script_url).hostname
            if not s_host or s_host.lower() != self.base_host:
                continue

            try:
                resp = self.client.get(current_script_url)
                if resp.status_code == 200 and resp.body:
                    scripts_inspected += 1
                    filename = current_script_url.split("/")[-1].split("?")[0] or "script.js"

                    # 1. Extract API endpoints & SPA routes from script content
                    self._extract_from_text(resp.body, f"JavaScript ({filename})", discovered_apis)

                    # 2. Dynamically discover nested imported chunks (Vite/Rollup/Webpack)
                    for chunk_pat in self.CHUNK_PATTERNS:
                        matches = chunk_pat.findall(resp.body)
                        for raw_chunk in matches:
                            clean_chunk = raw_chunk.strip()
                            if clean_chunk.startswith("/"):
                                abs_chunk = urljoin(self.base_url, clean_chunk)
                            elif clean_chunk.startswith("./") or clean_chunk.startswith("../"):
                                abs_chunk = urljoin(current_script_url, clean_chunk)
                            elif clean_chunk.startswith("assets/"):
                                abs_chunk = urljoin(self.base_url, "/" + clean_chunk)
                            else:
                                abs_chunk = urljoin(self.base_url, f"/assets/{clean_chunk.lstrip('/')}")

                            # Validate chunk extension and host
                            if (abs_chunk.endswith(".js") or abs_chunk.endswith(".mjs")) and abs_chunk not in visited_scripts:
                                c_host = urlparse(abs_chunk).hostname
                                if c_host and c_host.lower() == self.base_host:
                                    script_queue.append(abs_chunk)

            except Exception as e:
                logger.debug(f"Failed to fetch script chunk {current_script_url}: {e}")

        # Distinguish Backend APIs vs Client SPA Routes
        backend_endpoints = [ep for ep in discovered_apis.values() if ep.category != "CLIENT_SPA_ROUTE"]
        spa_routes = [ep for ep in discovered_apis.values() if ep.category == "CLIENT_SPA_ROUTE"]

        # Ensure root route "/" is in frontend routes if not explicitly matched
        if not any(r.path in ("/", "/homepage") for r in spa_routes):
            spa_routes.append(ApiEndpoint(
                path="/",
                full_url=self.base_url,
                methods=["GET"],
                source="Application Root",
                summary="Homepage / Main dashboard",
                category="CLIENT_SPA_ROUTE",
                subgroup="Core & Auctions"
            ))

        api_list = [
            {
                "path": ep.path,
                "full_url": ep.full_url,
                "methods": ep.methods,
                "source": ep.source,
                "summary": ep.summary,
                "parameters": ep.parameters,
                "confidence": ep.confidence,
                "category": ep.category,
                "subgroup": ep.subgroup,
                "access_state": ep.access_state
            }
            for ep in discovered_apis.values()
        ]
        api_list.sort(key=lambda x: (x["subgroup"], x["path"]))

        # Group Backend APIs by functional domain
        groups: Dict[str, List[Dict[str, Any]]] = {}
        for ep in api_list:
            if ep["category"] != "CLIENT_SPA_ROUTE":
                grp = ep.get("subgroup") or "General Backend APIs"
                if grp not in groups:
                    groups[grp] = []
                groups[grp].append(ep)

        # Group Frontend Routes by area
        frontend_groups: Dict[str, List[Dict[str, Any]]] = {}
        frontend_routes_list = [
            {
                "path": r.path,
                "full_url": r.full_url,
                "methods": r.methods,
                "source": r.source,
                "summary": r.summary or self._infer_summary(r.path, "CLIENT_SPA_ROUTE"),
                "subgroup": r.subgroup,
                "category": r.category
            }
            for r in sorted(spa_routes, key=lambda x: (x.subgroup, x.path))
        ]
        for r in frontend_routes_list:
            grp = r.get("subgroup") or "General Navigation"
            if grp not in frontend_groups:
                frontend_groups[grp] = []
            frontend_groups[grp].append(r)

        return {
            "total_endpoints": len(api_list),
            "total_backend_apis": len(backend_endpoints),
            "total_frontend_routes": len(spa_routes),
            "scripts_inspected": scripts_inspected,
            "documentation_specs": doc_specs_found,
            "base_url_configuration": self.base_url_configurations,
            "frontend_routes": frontend_routes_list,
            "frontend_groups": frontend_groups,
            "endpoints": api_list,
            "backend_endpoints": [ep for ep in api_list if ep["category"] != "CLIENT_SPA_ROUTE"],
            "groups": groups,
            "findings": findings,
            "limitations": [
                f"Inspected {scripts_inspected} first-party JavaScript bundles and chunks.",
                "API endpoints are compiled from client-side code references, network calls, HTML DOM form actions, and OpenAPI specifications.",
                "Server-side routes without client-side references or documentation require authenticated documentation to discover."
            ]
        }

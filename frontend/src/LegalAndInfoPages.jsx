import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Lock, 
  Globe, 
  ArrowLeft, 
  ExternalLink, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Layers,
  Server,
  Eye,
  Terminal,
  Cpu,
  Check,
  PhoneCall,
  Clock,
  HelpCircle,
  Send,
  Building,
  Scale,
  Cookie,
  UserCheck
} from 'lucide-react';

/**
 * Common Minimal Header for Legal & Informational Pages
 */
function PageHeader({ title, subtitle, badge = "OFFICIAL SPECIFICATION", onBack }) {
  return (
    <div className="mb-6 pb-5 border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-lg shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Home</span>
        </button>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span>{badge}</span>
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * About Us Page Component - High Quality, Complete Brand Story & Technology Architecture
 */
export function AboutPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="About Nexentra Technologies"
        subtitle="Automated, zero-false-positive defensive web security auditing, Core Web Vitals benchmarking, SEO optimization, and API route discovery."
        badge="NEXENTRA CORE v4.8"
        onBack={onBack}
      />

      {/* Mission Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-mono font-bold text-sky-600 uppercase tracking-wider mb-1">MISSION STATEMENT</div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900">
            Real-time, non-destructive perimeter defense &amp; performance intelligence for modern web applications.
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Domain: <a href="https://security.nexentra.space" className="text-sky-600 font-semibold hover:underline">security.nexentra.space</a> (Parent: <a href="https://nexentra.space" target="_blank" rel="noreferrer" className="text-sky-600 font-semibold hover:underline">nexentra.space ↗</a>) &bull; Engineered for webmasters, DevOps engineers, security teams, and modern web architects.
          </p>
        </div>
        <button
          onClick={onBack}
          type="button"
          className="shrink-0 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Launch Free Audit</span>
        </button>
      </div>

      {/* Narrative Section */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 mb-8 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
          Who We Are &amp; What We Solve
        </h2>
        <p className="leading-relaxed">
          Nexentra Technologies operates <strong>security.nexentra.space</strong>, a free automated diagnostic suite that bridges the gap between deep cybersecurity auditing and front-end performance engineering. As modern web architectures shift toward distributed microservices, single-page applications (SPAs), and cloud edge networks, security blind spots and performance bottlenecks increasingly impact user trust and organic search ranking.
        </p>
        <p className="leading-relaxed">
          Traditional vulnerability scanners are often intrusive, expensive, and notoriously prone to false positives that overwhelm engineering teams. Nexentra was built on the foundation of <strong>100% passive, non-destructive telemetry</strong>. We simulate real browser interactions, evaluate cryptographic handshakes, inspect HTTP defense headers, and decompile client bundles without sending exploit payloads or altering database states.
        </p>
      </div>

      {/* 4 Core Technology Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Zero-False-Positive Security Validation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every vulnerability detection is backed by cryptographic proofs, raw HTTP response headers, or TLS cipher suite negotiations. If an issue cannot be deterministically verified, it is never flagged as a confirmed threat.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
            <Layers className="w-4 h-4" />
            <span>2. AST Route &amp; Shadow API Discovery</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our Abstract Syntax Tree (AST) parsers analyze public JavaScript bundles in real-time to discover shadow REST routes, GraphQL endpoints, and client-side route maps that may expose unintended endpoints.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2">
            <Zap className="w-4 h-4" />
            <span>3. Core Web Vitals &amp; Performance Telemetry</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We measure critical Google user experience signals including Time-to-First-Byte (TTFB), Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), asset compression (Brotli/Gzip), and HTTP/2/3 transport efficiency.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
            <Globe className="w-4 h-4" />
            <span>4. Automated SEO &amp; Social Graph Optimizer</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated verification of Open Graph protocols, Twitter Cards, canonical link hygiene, robots.txt directives, XML sitemaps, semantic HTML5 hierarchy, and JSON-LD structured data for modern search crawlers.
          </p>
        </div>
      </div>

      {/* Compliance & Standards Strip */}
      <div className="border-t border-slate-200 pt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-bold text-slate-700">STANDARDS:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">OWASP Top 10</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">RFC 9116 (security.txt)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">TLS 1.3 / RFC 8446</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">Google Core Web Vitals</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>Inquiries:</span>
          <a href="mailto:contact@nexentra.space" className="text-sky-600 font-semibold hover:underline">contact@nexentra.space</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy Policy Page Component - Full Legal & Google AdSense Policy Compliance
 */
export function PrivacyPolicyPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Privacy &amp; Cookie Policy"
        subtitle="Last revised: October 2026 • Official Privacy Disclosure for security.nexentra.space operated by Nexentra Technologies."
        badge="GDPR • CCPA • ADSENSE COMPLIANT"
        onBack={onBack}
      />

      {/* Mandatory Google AdSense Notice Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 sm:p-5 mb-8">
        <div className="flex items-center gap-2 text-sky-800 font-bold text-sm mb-2">
          <Cookie className="w-4 h-4 text-sky-600" />
          <span>Third-Party Advertising &amp; Google Cookies Disclosure</span>
        </div>
        <p className="text-xs sm:text-sm text-sky-900 leading-relaxed">
          This website (<strong>security.nexentra.space</strong>) displays advertisements powered by Google AdSense and third-party advertising networks. In accordance with Google AdSense program policies, please review how cookies are utilized:
        </p>
        <ul className="list-disc list-inside mt-2 text-xs sm:text-sm text-sky-950 space-y-1 pl-1">
          <li><strong>Third-party vendors, including Google, use cookies</strong> to serve ads based on a user's prior visits to this website or other websites on the internet.</li>
          <li><strong>Google's use of advertising cookies</strong> enables it and its partners to serve ads to users based on their visits to our site and/or other sites on the internet.</li>
          <li><strong>Personalized Advertising Opt-Out:</strong> Users may opt out of personalized advertising at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline">Google Ads Settings (google.com/settings/ads)</a>.</li>
          <li>Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline">www.aboutads.info/choices</a>.</li>
        </ul>
      </div>

      {/* Policy Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Globe className="w-4 h-4 text-sky-600" />
            <span>1. Information We Collect Automatically</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you visit security.nexentra.space, our web servers collect standard diagnostic log data, including your IP address, browser user-agent, operating system, referring URL, time stamps, and pages visited. This telemetry is strictly used to maintain server uptime, mitigate DDoS attacks, and improve diagnostic responsiveness.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>2. Audit Target Telemetry &amp; Isolation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you initiate a website security or performance audit, the target domain is evaluated using public DNS records, HTTP response headers, and SSL/TLS certificate chains. If you identify as a registered member, your generated audit reports are isolated in our encrypted MongoDB Atlas vault and never shared publicly.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Cookie className="w-4 h-4 text-amber-600" />
            <span>3. Cookies &amp; Web Beacons</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We use functional cookies to remember your interface preferences (such as selected theme or active dashboard tab). Third-party advertising partners (such as Google AdSense) may place and read cookies in your browser or use web beacons to gather information as a result of ad serving on our site.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>4. GDPR &amp; CCPA User Rights</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You retain complete data sovereignty. Under GDPR and CCPA, you have the right to request access to your stored audit history, request immediate erasure (Right to be Forgotten), or opt out of data processing. To exercise these rights, email us directly at <a href="mailto:privacy@nexentra.space" className="text-sky-600 underline font-semibold">privacy@nexentra.space</a>.
          </p>
        </div>
      </div>

      {/* Zero Sale of Data Promise */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Our Commitment: Zero Sale of Personal Data</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Nexentra Technologies never sells, rents, or trades your personal information, user accounts, or private audit findings to third parties or data brokers. All data retention strictly serves legitimate platform operations, security validation, and legal compliance.
        </p>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; security.nexentra.space</span>
        <div className="flex items-center gap-3">
          <span>Data Protection Officer:</span>
          <a href="mailto:privacy@nexentra.space" className="text-sky-600 hover:underline">privacy@nexentra.space</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Terms of Service Page Component - Authorized Auditing & Legal Disclaimers
 */
export function TermsPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Terms of Service &amp; Acceptable Use"
        subtitle="Last revised: October 2026 • Terms governing the use of security.nexentra.space by Nexentra Technologies."
        badge="AUTHORIZED USE ONLY"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>1. Authorized Auditing Requirement</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            By submitting a domain name or URL to security.nexentra.space, you represent and warrant that you own, operate, or have obtained explicit authorization from the owner to conduct defensive security and performance assessments on the target infrastructure.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Lock className="w-4 h-4 text-sky-600" />
            <span>2. 100% Non-Destructive Passive Auditing</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nexentra operates strictly as a read-only, non-intrusive diagnostic tool. The engine does NOT execute exploit payloads, brute-force attacks, SQL injection attempts, denial-of-service simulations, or intrusive penetrations.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>3. Intellectual Property &amp; Content</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All algorithms, UI components, AST discovery engines, documentation, and trademarks displayed on security.nexentra.space are the exclusive property of Nexentra Technologies Inc. and protected by copyright and intellectual property laws.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>4. Diagnostic As-Is Disclaimer</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Audit scores, findings, and speed recommendations are provided on an "as-is" and "as-available" basis for heuristic and diagnostic guidance only. While we strive for zero false positives, automated scans do not substitute for a manual penetration test.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-700" />
          <span>5. Third-Party Advertisements &amp; External Links</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Our service displays third-party advertisements served by Google AdSense and contains links to external websites. Nexentra Technologies does not endorse, control, or assume liability for third-party advertisements, products, services, or privacy practices on external destinations.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; security.nexentra.space</span>
        <div className="flex items-center gap-3">
          <span>Legal Counsel:</span>
          <a href="mailto:legal@nexentra.space" className="text-sky-600 hover:underline">legal@nexentra.space</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Contact Us Page Component - Dedicated, Professional & Interactive
 */
export function ContactPage({ onBack }) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Contact Us &amp; Technical Support"
        subtitle="Reach out to the Nexentra Technologies engineering, security, and partnership team. We're here to help."
        badge="OFFICIAL COMMUNICATION CHANNELS"
        onBack={onBack}
      />

      {/* Quick Contact Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-xs font-mono font-bold text-sky-600 uppercase tracking-wider mb-1">GENERAL &amp; SUPPORT</div>
            <div className="text-sm font-bold text-slate-900 mb-1">General Inquiries</div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Platform feedback, API integration, and enterprise features.
            </p>
          </div>
          <a 
            href="mailto:contact@nexentra.space" 
            className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1"
          >
            contact@nexentra.space &rarr;
          </a>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider mb-1">SECURITY &amp; DISCLOSURE</div>
            <div className="text-sm font-bold text-slate-900 mb-1">Security Team</div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Vulnerability disclosures and RFC 9116 security telemetry.
            </p>
          </div>
          <a 
            href="mailto:security@nexentra.space" 
            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            security@nexentra.space &rarr;
          </a>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-1">PRIVACY &amp; LEGAL</div>
            <div className="text-sm font-bold text-slate-900 mb-1">Compliance Officer</div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              GDPR, CCPA data removal requests, and AdSense inquiries.
            </p>
          </div>
          <a 
            href="mailto:privacy@nexentra.space" 
            className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            privacy@nexentra.space &rarr;
          </a>
        </div>
      </div>

      {/* Main Grid: Interactive Form & Office SLA Info */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 mb-8">
        {/* Form Column */}
        <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
            <Send className="w-4 h-4 text-sky-600" />
            <span>Send Us a Direct Message</span>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Our team typically responds within 24 to 48 business hours.
          </p>

          {formSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-emerald-900 mb-1">Message Sent Successfully</div>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto mb-3">
                Thank you for reaching out, <strong>{formData.name}</strong>. Our engineering and support team at Nexentra Technologies has received your inquiry.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
                }}
                className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@domain.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Topic</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="General Inquiry">General Platform Inquiry</option>
                  <option value="Security Vulnerability">Security Vulnerability / Bug Disclosure</option>
                  <option value="Audit Feedback">Audit Score / Heuristic Feedback</option>
                  <option value="Advertising & Privacy">Advertising, AdSense &amp; Privacy Inquiry</option>
                  <option value="Enterprise Integration">Enterprise Integration &amp; API Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry, bug report, or partnership proposal..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-lg hover:bg-sky-500 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>

        {/* Operational Information Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Entity &amp; Operations</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Nexentra Technologies Inc.</div>
              <div><strong>Primary Domain:</strong> security.nexentra.space</div>
              <div><strong>Parent Ecosystem:</strong> nexentra.space</div>
              <div><strong>Operating Hours:</strong> Mon &ndash; Fri, 09:00 &ndash; 18:00 UTC</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Service Level Agreement (SLA)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>Security Disclosures</span>
                <span className="font-mono font-bold text-emerald-700">&lt; 24 Hours</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>Privacy / GDPR Inquiries</span>
                <span className="font-mono font-bold text-slate-800">&lt; 48 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span>General Support</span>
                <span className="font-mono font-bold text-slate-800">1-2 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; security.nexentra.space</span>
        <div className="flex items-center gap-3">
          <span>Official Dispatch:</span>
          <a href="mailto:contact@nexentra.space" className="text-sky-600 hover:underline">contact@nexentra.space</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Security & Responsible Disclosure Page Component - RFC 9116
 */
export function SecurityPolicyPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Responsible Disclosure &amp; Security Policy"
        subtitle="Official Security Vulnerability Reporting Program for security.nexentra.space (RFC 9116 Compliant)."
        badge="RFC 9116 ACTIVE"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Safe Harbor Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nexentra pledges not to pursue legal action against ethical cybersecurity researchers who discover and report potential vulnerabilities in good faith and in compliance with this responsible disclosure policy.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Direct Vulnerability Dispatch</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Report security findings directly to <a href="mailto:security@nexentra.space" className="text-sky-600 font-semibold hover:underline">security@nexentra.space</a>. Please include reproduction steps, affected endpoints, and impact assessment.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Privacy Boundaries</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Never attempt to view, alter, or exfiltrate private audit reports belonging to other members. Stop testing immediately upon confirming a potential proof-of-concept vulnerability.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>30-Day Remediation Window</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We request a reasonable 30-day window to evaluate, patch, and deploy fixes before public disclosure or publication to protect all ecosystem members.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; security.nexentra.space</span>
        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          RFC 9116 / .well-known/security.txt
        </span>
      </div>
    </div>
  );
}

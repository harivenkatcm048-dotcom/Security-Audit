import React from 'react';
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
  Check
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
          <span>Back to Engine</span>
        </button>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span>{badge}</span>
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * About Us Page Component - Clean, Minimal Bento Grid
 */
export function AboutPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="About Nexentra Technologies"
        subtitle="Automated, zero-false-positive defensive web audits, API route discovery, and performance intelligence."
        badge="NEXENTRA CORE v4.8"
        onBack={onBack}
      />

      {/* Mission Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold text-sky-600 uppercase tracking-wider mb-1">MISSION STATEMENT</div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            Real-time, non-destructive perimeter defense for modern web applications.
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Portal: <a href="https://nexentra.space" target="_blank" rel="noreferrer" className="text-sky-600 font-semibold hover:underline">nexentra.space ↗</a> &bull; Engineered for DevOps, Security Teams, and Modern Web Architects.
          </p>
        </div>
        <button
          onClick={onBack}
          type="button"
          className="shrink-0 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Launch Audit</span>
        </button>
      </div>

      {/* 4 Pillars Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Zero-False-Positive Security</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every vulnerability alert is validated with cryptographic proofs, HTTP handshakes, or raw header evidence. Zero speculation.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1.5">
            <Layers className="w-4 h-4" />
            <span>2. AST Route &amp; API Discovery</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            AST parsers decompile compiled frontend bundles to uncover shadow REST endpoints, GraphQL schemas, and SPA route maps.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1.5">
            <Zap className="w-4 h-4" />
            <span>3. Real-World Speed &amp; Vitals</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Benchmarking Time to First Byte (TTFB), Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and compression efficiency.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1.5">
            <Lock className="w-4 h-4" />
            <span>4. Non-Destructive Passive Probing</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Strict read-only heuristics with automated SSRF firewalls and RFC 1918 private IP protection to ensure zero production risk.
          </p>
        </div>
      </div>

      {/* Compliance & Standards Strip */}
      <div className="border-t border-slate-200 pt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">STANDARDS:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">OWASP Top 10</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">RFC 9116 (security.txt)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">TLS 1.3 / RFC 8446</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">WCAG 2.1 AAA</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Inquiries:</span>
          <a href="mailto:contact@nexentra.space" className="text-sky-600 hover:underline">contact@nexentra.space</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy Policy Page Component - Clean, Minimal Bento Grid
 */
export function PrivacyPolicyPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Privacy &amp; Data Isolation Policy"
        subtitle="Last revised: October 2026 • Nexentra Technologies (nexentra.space)"
        badge="ZERO-DATA-LEAKAGE"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Target Data Processed</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Public domain names, URLs, DNS records, public SSL/TLS certificates, and HTTP response headers. All queries mirror standard web client behavior.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Member Scoped Isolation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Audit archives stored in MongoDB Atlas are strictly scoped to the initiating member's account. Reports are private and never indexed or shared.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Volatile Memory Credentials</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Optional session cookies or authorization tokens provided for authenticated scanning exist only in volatile RAM during execution and are never persisted.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Right to Erasure</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full data sovereignty: Export your audit history in JSON or CSV at any time, or request instant purge via <a href="mailto:privacy@nexentra.space" className="text-sky-600 hover:underline">privacy@nexentra.space</a>.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; nexentra.space</span>
        <a href="mailto:privacy@nexentra.space" className="text-sky-600 hover:underline">privacy@nexentra.space</a>
      </div>
    </div>
  );
}

/**
 * Terms of Service Page Component - Clean, Minimal Bento Grid
 */
export function TermsPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Terms of Service &amp; Usage"
        subtitle="Last revised: October 2026 • Nexentra Technologies (nexentra.space)"
        badge="AUTHORIZED USAGE ONLY"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>1. Authorized Auditing Only</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Users must own, operate, or hold explicit authorization to audit the submitted domain or infrastructure. Unauthorized reconnaissance is strictly prohibited.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Lock className="w-4 h-4 text-sky-600" />
            <span>2. 100% Non-Destructive Scanning</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nexentra conducts passive inspection only. The engine does NOT execute exploit payloads, SQL injections, brute-force attacks, or service disruptions.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>3. Legal Compliance</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You agree to abide by all local, national, and international cybersecurity regulations, including the Computer Fraud and Abuse Act (CFAA) and international counterparts.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>4. Diagnostic As-Is Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Assessments provide high-fidelity heuristic telemetry but do not replace comprehensive human penetration testing. Nexentra provides reports on an "as-is" basis.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; nexentra.space</span>
        <a href="mailto:legal@nexentra.space" className="text-sky-600 hover:underline">legal@nexentra.space</a>
      </div>
    </div>
  );
}

/**
 * Security & Responsible Disclosure Page Component - Clean, Minimal Bento Grid
 */
export function SecurityPolicyPage({ onBack }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm my-4">
      <PageHeader
        title="Responsible Disclosure &amp; Security"
        subtitle="Nexentra Technologies Security Vulnerability Reporting Program • nexentra.space"
        badge="RFC 9116 ACTIVE"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Safe Harbor Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We pledge not to pursue legal action against ethical researchers who discover and report potential vulnerabilities in good faith and in compliance with this policy.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Direct Vulnerability Contact</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Report security findings directly to <a href="mailto:security@nexentra.space" className="text-sky-600 font-semibold hover:underline">security@nexentra.space</a> with reproduction steps, affected endpoints, and impact assessment.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Privacy Boundaries</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Never attempt to view, alter, or exfiltrate private audit reports belonging to other members. Stop testing immediately upon confirming a potential vulnerability.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>30-Day Remediation Window</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We request a reasonable 30-day window to evaluate, patch, and deploy fixes before public disclosure or publication.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Nexentra Technologies &bull; nexentra.space</span>
        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          RFC 9116 / .well-known/security.txt
        </span>
      </div>
    </div>
  );
}

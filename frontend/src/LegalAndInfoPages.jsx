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
  Server
} from 'lucide-react';

/**
 * Common Header for Legal & Informational Pages
 */
function PageHeader({ title, subtitle, onBack }) {
  return (
    <div style={{ marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' }}>
      <button
        onClick={onBack}
        className="chip-btn"
        style={{ marginBottom: '18px', borderRadius: '0px', fontWeight: 700 }}
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        <span>Return to Security Engine</span>
      </button>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
        {title}
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '780px' }}>
        {subtitle}
      </p>
    </div>
  );
}

/**
 * About Us Page Component
 */
export function AboutPage({ onBack }) {
  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', margin: '0 0 60px', padding: '36px 40px', borderRadius: '0px', border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}>
      <PageHeader
        title="About Nexentra Technologies"
        subtitle="Empowering engineering teams, CISOs, and web operators with automated, zero-false-positive defensive web audits and full-spectrum perimeter discovery."
        onBack={onBack}
      />

      <div style={{ color: '#334155', fontSize: '0.96rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Our Mission & Origin
          </h2>
          <p style={{ marginBottom: '14px' }}>
            Nexentra Technologies (<a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>nexentra.space ↗</a>) was founded on a simple premise: modern web applications are too dynamic and distributed for conventional, slow, intrusive penetration testing to remain the sole line of defense.
          </p>
          <p>
            Between micro-frontends, single-page applications (SPAs), third-party CDN scripts, and proliferating REST API endpoints, organizations routinely expose sensitive routes, unauthenticated administrative portals, and critical configuration oversights without knowing it. Nexentra bridges this gap through real-time, non-destructive telemetry that executes in seconds.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            The Four Pillars of Nexentra Engine
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 800, marginBottom: '6px' }}>
                <ShieldCheck className="w-5 h-5" />
                <span>1. Zero-False-Positive Security</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Every vulnerability flag is verified with raw cryptographic, header, or HTTP handshake evidence. No speculative alerts.
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 800, marginBottom: '6px' }}>
                <Layers className="w-5 h-5" />
                <span>2. 100% Route & API Discovery</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Abstract syntax tree (AST) crawlers extract client-side SPA routes and backend REST APIs directly from compiled JavaScript bundles.
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 800, marginBottom: '6px' }}>
                <Zap className="w-5 h-5" />
                <span>3. Real-World Performance & UX</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Integrated Time to First Byte (TTFB), simulated Core Web Vitals (LCP, CLS, INP), and automated compression diagnostics.
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 800, marginBottom: '6px' }}>
                <Lock className="w-5 h-5" />
                <span>4. Safe & Non-Destructive</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Strict read-only heuristics with automated SSRF firewalls and RFC 1918 private IP protections to prevent any production disruption.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Corporate & Technical Standards
          </h2>
          <p style={{ marginBottom: '12px' }}>
            Nexentra Technologies operates in strict alignment with international open standards, including:
          </p>
          <ul style={{ paddingLeft: '22px', marginBottom: '16px' }}>
            <li><strong>OWASP Top 10:2021</strong>: Complete alignment with modern web vulnerability categories (A01 through A10).</li>
            <li><strong>W3C / WHATWG Standards</strong>: Full conformance to HTML5 semantics, Content Security Policy Level 3, and WCAG 2.1 AAA accessibility rules.</li>
            <li><strong>RFC 9116 / RFC 8446</strong>: Security.txt disclosure and TLS 1.3 cryptographic suites verification.</li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>Nexentra Technologies</div>
            <div style={{ color: '#64748b', fontSize: '0.88rem' }}>Portal: <a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>nexentra.space</a> &bull; Inquiries: <a href="mailto:contact@nexentra.space" style={{ color: '#0284c7' }}>contact@nexentra.space</a></div>
          </div>
          <button onClick={onBack} className="chip-btn" style={{ borderRadius: '0px', background: '#0284c7', color: '#ffffff', fontWeight: 800 }}>
            Launch an Audit Now &rarr;
          </button>
        </section>
      </div>
    </div>
  );
}

/**
 * Privacy Policy Page Component
 */
export function PrivacyPolicyPage({ onBack }) {
  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', margin: '0 0 60px', padding: '36px 40px', borderRadius: '0px', border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}>
      <PageHeader
        title="Privacy & Data Protection Policy"
        subtitle="Last revised: October 2026 • Nexentra Technologies (nexentra.space)"
        onBack={onBack}
      />

      <div style={{ color: '#334155', fontSize: '0.94rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            1. Overview & Commitment
          </h2>
          <p>
            Nexentra Technologies ("Nexentra", "we", "our") values the privacy of its users, corporate members, and the confidentiality of defensive audit findings. This Privacy Policy details how we handle audit target information, member session credentials, and generated security reports across our platform.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            2. Information We Process
          </h2>
          <ul style={{ paddingLeft: '22px' }}>
            <li><strong>Target Host Information</strong>: Domain names, URLs, public IP addresses, and DNS records submitted for analysis.</li>
            <li><strong>Member Account Data</strong>: Email address and username provided to isolate your historical audit archives in our encrypted MongoDB Atlas repository.</li>
            <li><strong>Audit Findings & Telemetry</strong>: HTTP response headers, SSL/TLS certificates, public Certificate Transparency records, and discovered client-side routes.</li>
            <li><strong>Authentication Secrets (Optional)</strong>: If you provide temporary session tokens or cookies to test protected routes, they are processed in volatile memory only and are never persisted or shared.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            3. Strict Non-Disclosure & Data Isolation
          </h2>
          <p>
            We adhere to a strict zero-leakage policy:
          </p>
          <ul style={{ paddingLeft: '22px' }}>
            <li>We <strong>never sell, trade, or publicly disclose</strong> your audit reports, target hosts, or identified vulnerability findings.</li>
            <li>Historical audits saved in MongoDB Atlas are member-scoped to the initiating auditor’s email address.</li>
            <li>All target traffic originates solely from our security audit engine and mimics standard read-only browser clients.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            4. Data Retention & Deletion
          </h2>
          <p>
            You retain full ownership of your audit history. You may download complete JSON and CSV archives of any assessment at any time. To request complete deletion of your account record and historical audit files from MongoDB Atlas, email <a href="mailto:privacy@nexentra.space" style={{ color: '#0284c7' }}>privacy@nexentra.space</a>.
          </p>
        </section>

        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Nexentra Technologies &bull; Powered by <a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>nexentra.space</a> &bull; Privacy Officer: <a href="mailto:privacy@nexentra.space" style={{ color: '#0284c7' }}>privacy@nexentra.space</a>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Terms of Service Page Component
 */
export function TermsPage({ onBack }) {
  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', margin: '0 0 60px', padding: '36px 40px', borderRadius: '0px', border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}>
      <PageHeader
        title="Terms of Service & Authorized Usage"
        subtitle="Last revised: October 2026 • Nexentra Technologies (nexentra.space)"
        onBack={onBack}
      />

      <div style={{ color: '#334155', fontSize: '0.94rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or executing defensive security assessments through the Nexentra Security Audit Engine, provided by Nexentra Technologies (nexentra.space), you agree to be legally bound by these Terms of Service. If you do not agree, do not utilize this platform.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            2. Authorization & Ethical Usage Mandate
          </h2>
          <p>
            The Nexentra Security Audit Engine is designed solely for defensive, ethical security configuration verification. You expressly warrant and agree that:
          </p>
          <ul style={{ paddingLeft: '22px' }}>
            <li>You own, operate, or possess explicit authorization from the legitimate owner to audit the submitted domain or web application.</li>
            <li>You will not utilize Nexentra for unauthorized vulnerability exploitation, malicious reconnaissance, denial-of-service, or harassment.</li>
            <li>You will abide by all local, state, federal, and international cyber legislation (e.g. CFAA, Computer Misuse Act).</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            3. Non-Destructive Scanning Guarantee
          </h2>
          <p>
            Nexentra conducts read-only HTTP/HTTPS requests, public DNS lookups, Certificate Transparency log parsing, and client bundle static analysis. The engine does NOT execute intrusive exploit payloads, database injection, or brute-force password attacks.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            4. Limitation of Liability
          </h2>
          <p>
            All assessments are provided on an "as-is" and "as-available" basis. While Nexentra employs zero-false-positive heuristics, we do not warrant that our automated scans constitute a guarantee against zero-day exploits or security breaches. Nexentra Technologies shall not be liable for any indirect, consequential, or punitive damages.
          </p>
        </section>

        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Nexentra Technologies &bull; Powered by <a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>nexentra.space</a> &bull; Legal Inquiries: <a href="mailto:legal@nexentra.space" style={{ color: '#0284c7' }}>legal@nexentra.space</a>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Security & Responsible Disclosure Page Component
 */
export function SecurityPolicyPage({ onBack }) {
  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', margin: '0 0 60px', padding: '36px 40px', borderRadius: '0px', border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}>
      <PageHeader
        title="Responsible Disclosure & Security Policy"
        subtitle="Nexentra Technologies Security Vulnerability Reporting Program • nexentra.space"
        onBack={onBack}
      />

      <div style={{ color: '#334155', fontSize: '0.94rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            1. Our Security Commitment
          </h2>
          <p>
            As a cybersecurity platform, the security and resilience of our systems and our users' data is our highest priority. We welcome responsible security researchers and ethical hackers to review our infrastructure and report potential issues.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            2. Safe Harbor for Security Researchers
          </h2>
          <p>
            Nexentra will not initiate legal action against security researchers who conduct good-faith research that conforms to this policy:
          </p>
          <ul style={{ paddingLeft: '22px' }}>
            <li>Promptly notify us at <a href="mailto:security@nexentra.space" style={{ color: '#0284c7' }}>security@nexentra.space</a> upon discovering a suspected vulnerability.</li>
            <li>Allow us a reasonable timeframe (typically 30–90 days) to remediate the issue before public disclosure.</li>
            <li>Do not view, alter, or exfiltrate private audit reports belonging to other members.</li>
            <li>Do not execute denial of service (DoS/DDoS) or degradation attacks against our services.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            3. Reporting a Vulnerability
          </h2>
          <div style={{ border: '1px solid #cbd5e1', padding: '18px 24px', background: '#f8fafc', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              Direct Contact: <a href="mailto:security@nexentra.space" style={{ color: '#0284c7' }}>security@nexentra.space</a>
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
              Please include: Proof of concept (PoC) steps, affected endpoint/component, and recommended remediation.
            </p>
          </div>
        </section>

        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Nexentra Technologies &bull; Powered by <a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>nexentra.space</a> &bull; RFC 9116 security.txt active
          </div>
        </section>
      </div>
    </div>
  );
}

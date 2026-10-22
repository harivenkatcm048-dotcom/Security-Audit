import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Globe, 
  Zap, 
  Layers, 
  Server, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  Cpu,
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function PublicKnowledgeBase({ onNavigateCapability = () => {}, onOpenScan = () => {} }) {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "Is running a website audit on security.nexentra.space 100% safe and legal?",
      a: "Yes, absolutely. Nexentra operates strictly as a passive, non-destructive telemetry engine in compliance with RFC 9116 and international cybersecurity norms. We do not inject exploit payloads, perform SQL injections, brute-force credentials, or disrupt server operations. Our scanners replicate standard, read-only browser HTTP/HTTPS requests and evaluate publicly accessible DNS, TLS certificates, HTTP headers, and frontend script bundles."
    },
    {
      q: "What is the zero-false-positive validation guarantee?",
      a: "Traditional automated security tools flood developers with speculative warnings that turn out to be false alarms. Nexentra enforces deterministic verification: every vulnerability alert or missing security header is corroborated with raw cryptographic handshakes, HTTP response header proofs, or direct bundle analysis. If a vulnerability cannot be deterministically proven, it is never reported as a confirmed defect."
    },
    {
      q: "How does the AST API discovery engine detect shadow routes?",
      a: "Modern web applications compile JavaScript into optimized bundles using tools like Vite, Webpack, or Rollup. Our Abstract Syntax Tree (AST) parser decompiles and traverses these public bundles to identify route declarations, Axios/Fetch API calls, REST endpoints, and GraphQL queries. This surfaces undocumented 'shadow APIs' that developers may have inadvertently exposed in client-side production builds."
    },
    {
      q: "Why are Google Core Web Vitals critical for both user experience and organic SEO?",
      a: "Google uses Core Web Vitals—specifically Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP)—as direct search ranking signals. Slow initial server response (TTFB > 600ms) or jumpy page layouts directly damage conversion rates and reduce organic search visibility. Nexentra benchmarks these vitals to help webmasters achieve sub-second load times."
    },
    {
      q: "How does Nexentra handle data privacy and MongoDB Atlas isolation?",
      a: "We adhere strictly to zero-data-leakage principles. All audits conducted by identified team members are cryptographically scoped and isolated in our secure MongoDB Atlas database. We never sell, index, or share your proprietary audit reports with third parties. You maintain full data sovereignty with one-click JSON/CSV export and instant data erasure under GDPR/CCPA."
    },
    {
      q: "What is RFC 9116 (security.txt) and why is it checked?",
      a: "RFC 9116 defines the standard location (/well-known/security.txt) where organizations post contact details for ethical cybersecurity researchers. When vulnerabilities are uncovered, security teams can report them directly to the site operators rather than disclosing them publicly. Nexentra checks for RFC 9116 compliance to verify security maturity."
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-10 space-y-12">
      {/* SECTION 1: 21-STAGE TELEMETRY FRAMEWORK */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Nexentra Atlas Telemetry Specification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              The 21-Stage Passive Diagnostic Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Every audit launched on <strong>security.nexentra.space</strong> executes an orchestrated 21-phase inspection across perimeter security, cryptographic hygiene, front-end performance, and SEO readiness.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenScan}
            className="shrink-0 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Audit a Domain Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Phase 1 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <Server className="w-3.5 h-3.5" />
              <span>Stages 1&ndash;4: Network &amp; DNS</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">DNSSEC &amp; BGP Routing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Validates authoritative name servers, IPv4/IPv6 dual-stack resolution, DNSSEC cryptographic signatures, and seamless HTTP to HTTPS 301/308 redirect enforcement.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>Stages 5&ndash;8: TLS 1.3 Cryptography</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">SSL Certificate &amp; Ciphers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates modern TLS 1.3/1.2 cipher suites, Forward Secrecy (ECDHE), OCSP stapling, certificate lifespan, and public key pinning parameters.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Stages 9&ndash;13: HTTP Defense Headers</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">CSP, HSTS &amp; Anti-Clickjacking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audits Strict-Transport-Security (with preload), Content-Security-Policy (CSP) script-src nonce hygiene, X-Content-Type-Options: nosniff, and Permissions-Policy.
            </p>
          </div>

          {/* Phase 4 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>Stages 14&ndash;16: AST Shadow Discovery</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Shadow REST &amp; GraphQL APIs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Decompiles client-side Webpack and Vite script chunks using Abstract Syntax Tree (AST) parsing to detect unmapped API routes, microservices, and internal administrative paths.
            </p>
          </div>

          {/* Phase 5 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Stages 17&ndash;19: Core Web Vitals</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">TTFB, LCP &amp; Compression</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Benchmarks Time-to-First-Byte (TTFB), Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Brotli/Gzip compression ratios, and HTTP/2 multiplexing.
            </p>
          </div>

          {/* Phase 6 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
              <Globe className="w-3.5 h-3.5" />
              <span>Stages 20&ndash;21: SEO &amp; Social Graph</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Meta, Schema &amp; Sitemaps</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifies Open Graph cards, Twitter metadata, canonical link targets, robots.txt crawl rules, XML sitemap accessibility, and JSON-LD structured schemas.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: EDUCATIONAL KNOWLEDGE BASE ARTICLES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-sky-600 uppercase tracking-wider mb-1">
              EDUCATIONAL KNOWLEDGE BASE
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Best Practices for Web Security &amp; Performance
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            PUBLISHED BY NEXENTRA LABS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Article 1 */}
          <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                <span>SECURITY ARCHITECTURE</span>
                <span>&bull;</span>
                <span>6 MIN READ</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Why Content Security Policy (CSP) is Your Primary Defense Against XSS
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Cross-Site Scripting (XSS) remains among the most prevalent OWASP Top 10 vulnerabilities in modern JavaScript frameworks. A robust Content Security Policy header restricts the sources from which scripts, styles, and frames can be loaded, neutralising inline script injection attacks even if an attacker discovers an input reflection vector.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-700 font-semibold">OWASP RECOMMENDED</span>
              <button 
                type="button" 
                onClick={() => onNavigateCapability('headers')} 
                className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Inspect Your CSP &rarr;
              </button>
            </div>
          </article>

          {/* Article 2 */}
          <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                <span>FRONTEND OPTIMIZATION</span>
                <span>&bull;</span>
                <span>5 MIN READ</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Google Core Web Vitals: Demystifying LCP, CLS, and TTFB
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Largest Contentful Paint (LCP) benchmarks the time it takes to render the largest visible content block on the screen, while Cumulative Layout Shift (CLS) measures visual stability. Websites with an LCP under 2.5 seconds and a CLS below 0.1 gain measurable algorithmic advantages in Google search rankings and customer retention.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-amber-700 font-semibold">SEARCH ALGORITHM SIGNAL</span>
              <button 
                type="button" 
                onClick={() => onNavigateCapability('performance')} 
                className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Benchmark Vitals &rarr;
              </button>
            </div>
          </article>

          {/* Article 3 */}
          <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                <span>API DEFENSE</span>
                <span>&bull;</span>
                <span>7 MIN READ</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Shadow APIs: Why Single-Page Apps Leak Back-End Routes
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                When developers build Single-Page Applications in React, Vue, or Angular, route tables and API endpoints are bundled into public static JavaScript chunks. Threat actors routinely extract these endpoints to find unprotected administrative routes or outdated microservices. Nexentra automatically maps this surface for defensive review.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-sky-700 font-semibold">ATTACK SURFACE INTEL</span>
              <button 
                type="button" 
                onClick={() => onNavigateCapability('apis')} 
                className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Discover Shadow APIs &rarr;
              </button>
            </div>
          </article>

          {/* Article 4 */}
          <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                <span>DEFENSIVE STANDARDS</span>
                <span>&bull;</span>
                <span>4 MIN READ</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Implementing RFC 9116 security.txt for Responsible Disclosure
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                RFC 9116 establishes a standardized machine-readable and human-readable text file hosted at /.well-known/security.txt. It allows security researchers who discover zero-day vulnerabilities in your application to contact your security team directly before any public exploitation occurs, keeping your users safe.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-700 font-semibold">IETF RFC 9116</span>
              <button 
                type="button" 
                onClick={() => onNavigateCapability('headers')} 
                className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Check security.txt &rarr;
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE PUBLIC FAQ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear answers regarding our testing methodology, compliance, privacy, and architecture.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-slate-200/90 rounded-xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full text-left px-4 sm:px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 py-3.5 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  Globe, 
  Zap, 
  Layers, 
  Lock,
  ArrowUpRight
} from 'lucide-react';

/**
 * SiteFooter Component
 * Modern, minimal, ultra-responsive footer for Nexentra Technologies (nexentra.space)
 */
export default function SiteFooter({ onNavigatePage = () => {} }) {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 mt-8 sm:mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Responsive Grid: Clean 1-col on mobile, 2-col on small tablet, 4-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 pb-8 border-b border-slate-100">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-7 h-7 shrink-0">
                <defs>
                  <linearGradient id="footer-logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F5FF" />
                    <stop offset="100%" stopColor="#7B61FF" />
                  </linearGradient>
                </defs>
                <path d="M25 25 L45 25 L75 75 L55 75 Z" fill="url(#footer-logo-glow)" />
                <path d="M25 25 L45 25 L25 75 L25 25 Z" fill="#00F5FF" opacity="0.85" />
                <path d="M75 25 L75 75 L55 75 L75 25 Z" fill="#7B61FF" opacity="0.85" />
                <circle cx="50" cy="50" r="45" stroke="url(#footer-logo-glow)" strokeWidth="2.5" fill="none" opacity="0.4" />
              </svg>
              <div>
                <span className="font-extrabold text-sm text-slate-900 tracking-tight block">Nexentra Technologies</span>
                <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">Cyber Defense Platform</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Automated defensive web posture, API discovery, and Core Web Vitals telemetry.
            </p>
            <a 
              href="https://nexentra.space" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors w-fit"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>nexentra.space</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          {/* Column 2: Audit Engine */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Audit Engine</span>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onNavigatePage('findings')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  OWASP Findings
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('headers')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Security Headers (CSP/HSTS)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('apis')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  API &amp; Route Discovery
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('tls_dns')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  TLS Crypto &amp; DNS
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Frontend Diagnostics */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Frontend Diagnostics</span>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onNavigatePage('performance')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Core Web Vitals &amp; TTFB
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('seo')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  SEO &amp; Social Graph
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('ui_ux')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  UI/UX &amp; Accessibility
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('pages_matrix')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Multi-Page Health Matrix
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Trust */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Company &amp; Legal</span>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onNavigatePage('about')} className="hover:text-sky-600 transition-colors text-left font-bold text-slate-800 cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('contact')} className="hover:text-sky-600 transition-colors text-left font-bold text-slate-800 cursor-pointer">
                  Contact Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('privacy')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Privacy Policy &amp; Cookies
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('terms')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('security_policy')} className="hover:text-slate-900 transition-colors text-left cursor-pointer">
                  Responsible Disclosure
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>&copy; {new Date().getFullYear()} Nexentra Technologies Inc.</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-emerald-600 font-semibold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>RFC 9116 Active</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-slate-400">
            <a href="mailto:contact@nexentra.space" className="hover:text-slate-700 transition-colors">
              contact@nexentra.space
            </a>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-slate-500 text-[11px] block sm:inline">100% Passive Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

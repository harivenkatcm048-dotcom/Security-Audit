import React from 'react';
import { 
  Shield, 
  ExternalLink, 
  Globe, 
  Lock, 
  Zap, 
  Layers, 
  Search, 
  ShieldCheck, 
  FileText,
  Mail,
  Heart
} from 'lucide-react';

/**
 * SiteFooter Component
 * Redesigned, professional, responsive footer powered by Nexentra Technologies (nexentra.space)
 */
export default function SiteFooter({ onNavigatePage = () => {} }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* Top 4-Column Grid */}
        <div className="footer-columns-grid">
          {/* Column 1: Brand & Nexentra Technologies */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="footer-brand-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="footer-nex-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F5FF" />
                      <stop offset="100%" stopColor="#7B61FF" />
                    </linearGradient>
                  </defs>
                  <path d="M25 25 L45 25 L75 75 L55 75 Z" fill="url(#footer-nex-glow)" />
                  <path d="M25 25 L45 25 L25 75 L25 25 Z" fill="#00F5FF" opacity="0.85" />
                  <path d="M75 25 L75 75 L55 75 L75 25 Z" fill="#7B61FF" opacity="0.85" />
                  <circle cx="50" cy="50" r="45" stroke="url(#footer-nex-glow)" strokeWidth="2.5" fill="none" opacity="0.4" />
                </svg>
              </div>
              <div>
                <div className="footer-brand-title">Nexentra Technologies</div>
                <div className="footer-brand-powered">Enterprise Cyber Defense Platform</div>
              </div>
            </div>

            <p className="footer-brand-desc">
              Automated defensive cybersecurity configuration audit platform. Provides zero-false-positive telemetry, API route discovery, Core Web Vitals, and OWASP compliance verification.
            </p>

            <div className="footer-portal-link-box">
              <a 
                href="https://nexentra.space" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-portal-link"
                title="Visit Nexentra Technologies official portal"
              >
                <Globe className="w-4 h-4 text-cyan-500 mr-2" />
                <span>nexentra.space</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Column 2: Audit Capabilities */}
          <div className="footer-col">
            <h4 className="footer-col-title">Audit Suite</h4>
            <ul className="footer-link-list">
              <li>
                <button type="button" onClick={() => onNavigatePage('apis')} className="footer-link-btn">
                  API & Route Inventory (195 Routes)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('headers')} className="footer-link-btn">
                  Defensive Security Headers (CSP, HSTS)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('vulnerabilities')} className="footer-link-btn">
                  Vulnerability & CORS Audit
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('tls_dns')} className="footer-link-btn">
                  Cryptographic TLS & DNS Posture
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('performance')} className="footer-link-btn">
                  Real-Time Core Web Vitals & TTFB
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('findings')} className="footer-link-btn">
                  OWASP Top 10:2021 Defense Scoring
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Information */}
          <div className="footer-col">
            <h4 className="footer-col-title">Nexentra Technologies</h4>
            <ul className="footer-link-list">
              <li>
                <button type="button" onClick={() => onNavigatePage('about')} className="footer-link-btn highlight">
                  About Us (nexentra.space)
                </button>
              </li>
              <li>
                <a href="https://nexentra.space" target="_blank" rel="noreferrer" className="footer-link">
                  Official Portal ↗
                </a>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('security_policy')} className="footer-link-btn">
                  Responsible Disclosure Policy
                </button>
              </li>
              <li>
                <a href="mailto:contact@nexentra.space" className="footer-link">
                  Engineering Inquiries
                </a>
              </li>
              <li>
                <span className="footer-static-note">RFC 9116 security.txt Active</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="footer-col">
            <h4 className="footer-col-title">Legal & Security</h4>
            <ul className="footer-link-list">
              <li>
                <button type="button" onClick={() => onNavigatePage('privacy')} className="footer-link-btn highlight">
                  Privacy & Data Protection Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('terms')} className="footer-link-btn highlight">
                  Terms of Service & Safe Usage
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePage('security_policy')} className="footer-link-btn">
                  Security Safe Harbor
                </button>
              </li>
              <li>
                <span className="footer-static-note">Zero-Payload Non-Destructive SLA</span>
              </li>
              <li>
                <span className="footer-static-note">MongoDB Atlas Isolated Vault</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stitch Compliance & Standards Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', margin: '20px 0 16px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="stitch-badge stitch-badge-secure">
              <span style={{ width: '6px', height: '6px', background: '#065f46', display: 'inline-block', marginRight: '4px' }} />
              DEFENSIVE ENGINE OPERATIONAL // 99.99% UPTIME
            </span>
            <span className="stitch-badge" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}>
              RFC 9116 ACTIVE
            </span>
            <span className="stitch-badge" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}>
              SOC 2 TYPE II AUDITED
            </span>
            <span className="stitch-badge" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}>
              ISO 27001 ALIGNED
            </span>
          </div>

          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#64748b' }}>
            NODE: US-EAST-VIRGINIA // CLUSTER-09
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} <strong>Nexentra Technologies Inc.</strong> &bull; Powered by{' '}
            <a href="https://nexentra.space" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>
              nexentra.space
            </a>
            . All telemetry audited & immutable.
          </div>

          <div className="footer-status-pill">
            <span className="footer-status-dot" />
            <span>SAFE HARBOR ASSURED &bull; 100% NON-DESTRUCTIVE</span>
          </div>

          <div className="footer-legal-quicklinks">
            <button type="button" onClick={() => onNavigatePage('about')} className="footer-quick-btn">About</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigatePage('privacy')} className="footer-quick-btn">Privacy</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigatePage('terms')} className="footer-quick-btn">Terms</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigatePage('security_policy')} className="footer-quick-btn">Security</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

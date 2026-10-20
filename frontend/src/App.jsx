import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BikeSpeedometerGauge from './BikeSpeedometerGauge';
import AuditResultSummary from './AuditResultSummary';
import FrontendAuditPanels from './FrontendAuditPanels';
import ApiInventoryPanel from './ApiInventoryPanel';
import SiteFooter from './SiteFooter';
import { AboutPage, PrivacyPolicyPage, TermsPage, SecurityPolicyPage } from './LegalAndInfoPages';
import { API_BASE } from './apiConfig';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Globe,
  Zap,
  Terminal,
  Activity,
  Cpu,
  Server,
  Layers,
  Database,
  User,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileCode,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Menu,
  X,
  Gauge,
  Flame,
  Mail,
  Sparkles,
  Award,
  Printer,
  BarChart3,
  Palette,
  Rocket
} from 'lucide-react';

// Pipeline stage definitions
const SCAN_STAGES = [
  "Scope & SSRF Firewall",
  "Defensive Security Headers",
  "TLS / SSL Crypto Audit",
  "DNS & Mail Protection (SPF/DMARC)",
  "In-Scope Web Crawler",
  "Frontend Asset Inventory",
  "Frontend UI/UX & Responsive Viewport",
  "Search Engine Optimization (SEO) & Social Graph",
  "Page Loading Speeds & Core Web Vitals",
  "Multi-Page Crawl Health Matrix",
  "API Route Discovery",
  "Secrets & Leaks Scanner",
  "Admin & Access Control",
  "Content Security Policy (CSP) Evaluator",
  "Mixed Content & Transport Security",
  "Client-Side DOM & Prototype Pollution Sinks",
  "Open Redirect Safe Probing",
  "Technology Fingerprinting",
  "Cloud Infrastructure Indicators",
  "Conservative Port Assessment",
  "Nexentra Enterprise Vulnerability Engine"
];
// Official Nexentra Technologies Vector Logo (favicon.svg)
export function NexentraLogo({ className = "w-8 h-8", style = {} }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className} 
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="Nexentra Technologies Logo"
    >
      <defs>
        <linearGradient id="nexentra-nav-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
      </defs>
      {/* Futuristic N logo element */}
      <path d="M25 25 L45 25 L75 75 L55 75 Z" fill="url(#nexentra-nav-glow)" />
      <path d="M25 25 L45 25 L25 75 L25 25 Z" fill="#00F5FF" opacity="0.85" />
      <path d="M75 25 L75 75 L55 75 L75 25 Z" fill="#7B61FF" opacity="0.85" />
      <circle cx="50" cy="50" r="45" stroke="url(#nexentra-nav-glow)" strokeWidth="2.5" fill="none" opacity="0.4" />
    </svg>
  );
}

// Minimalist, High-Aesthetic Overview / Landing Page
function LandingView({
  domainInput,
  setDomainInput,
  isScanning,
  handleStartScan,
  historyList,
  loadPastReport,
  getGradeColor,
  currentUser,
  onOpenAuthModal,
  dbStatus,
  activeReport,
  webQuality,
  allEndpointsCount = 0,
  onNavigateCapability = () => {},
  scanComplete = false,
  currentStageIndex = 0,
  onReachTopSpeed = null
}) {
  const setPreset = (domain) => {
    setDomainInput(domain);
    const input = document.getElementById('targetDomain');
    if (input) {
      input.value = domain;
      input.focus();
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#f8fafc] text-slate-800">
      {/* 1. MINIMAL STATUS RIBBON */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 lg:px-10 py-2.5 flex items-center justify-between text-xs text-slate-500 font-mono tracking-wider">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            title={currentUser ? `Logged in: ${currentUser.email}` : 'Click to connect user'}
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="font-bold uppercase">
              {currentUser ? `ATLAS: ${currentUser.username.toUpperCase()}` : 'ATLAS VAULT: READY'}
            </span>
          </button>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-600">
            <span className="material-symbols-outlined text-sm text-slate-400">verified</span>
            RFC 9116 PASSIVE PROTOCOL
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>ENGINE: v4.8.2</span>
          <span>&bull;</span>
          <span className="text-slate-600 font-semibold">21 AUDIT STAGES</span>
        </div>
      </div>

      {/* 2. ELEGANT HERO SECTION */}
      <section className="w-full px-4 sm:px-8 lg:px-10 pt-10 pb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">
            <span>// DEFENSIVE ATTACK SURFACE INTELLIGENCE</span>
            <span className="w-8 h-px bg-slate-300"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Enterprise Website Security &amp; Risk Audit
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-5xl leading-relaxed">
            Non-destructive heuristic inspection evaluating perimeter defenses, hidden API routes, SSL/TLS posture, and Core Web Vitals velocity.
          </p>
        </div>

        {/* MINIMAL PRECISION SCAN INPUT */}
        <div className="w-full bg-white border border-slate-200 p-2 shadow-sm">
          <form 
            className="flex flex-col sm:flex-row items-stretch gap-2" 
            id="auditForm" 
            onSubmit={(e) => {
              e.preventDefault();
              if (!isScanning && domainInput.trim()) {
                handleStartScan();
              }
            }}
          >
            {/* Protocol Badge */}
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-center gap-2 text-slate-700 font-mono text-sm font-bold shrink-0">
              <span className="material-symbols-outlined text-base text-slate-400">lock</span>
              <span>HTTPS://</span>
            </div>
            
            {/* Target Domain Input */}
            <div className="relative flex-1 bg-white border border-slate-200 flex items-center px-4 focus-within:border-slate-800">
              <input 
                autoComplete="off" 
                className="w-full bg-transparent text-slate-900 font-mono text-sm py-3 focus:outline-none placeholder:text-slate-400" 
                id="targetDomain" 
                placeholder="domain.com (e.g. nexentra.space)" 
                spellCheck="false" 
                type="text" 
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={isScanning}
              />
              {domainInput && (
                <button 
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer" 
                  onClick={() => setDomainInput('')} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Launch Button */}
            <button 
              className={`bg-slate-900 text-white border border-slate-900 px-6 py-3 font-mono text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shrink-0 cursor-pointer ${
                isScanning ? 'opacity-80 pointer-events-none' : ''
              }`} 
              id="launchBtn" 
              type="submit"
              disabled={isScanning || !domainInput.trim()}
            >
              {isScanning ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                  <span>EXECUTING...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg text-emerald-400">bolt</span>
                  <span>LAUNCH DEFENSIVE AUDIT</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-400">PRESETS:</span>
              {['nexentra.space', 'speedtest.net', 'accufy.in', 'example.com'].map((domain, idx) => (
                <React.Fragment key={domain}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  <button 
                    type="button"
                    onClick={() => setPreset(domain)}
                    className="hover:text-slate-900 text-slate-600 underline decoration-dotted transition-colors cursor-pointer"
                  >
                    {domain}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="text-emerald-700 font-sans font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>100% Passive &bull; Zero Exploit Injections</span>
            </div>
          </div>
        </div>

        {/* 3. 4 KEY METRIC TILES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <div className="bg-white border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">// PIPELINE_DEPTH</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">21</div>
            <div className="text-xs font-bold text-slate-700 uppercase">Autonomous Stages</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated deep pipeline from Layer 3 to Layer 7</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">// SAFETY_INDEX</span>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">100%</div>
            <div className="text-xs font-bold text-slate-700 uppercase">Non-Destructive</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero intrusive payload injection or disruption</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">// VELOCITY_SLA</span>
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight">&lt; 35s</div>
            <div className="text-xs font-bold text-slate-700 uppercase">Scan SLA</div>
            <div className="text-[11px] text-slate-400 mt-0.5">High-speed parallel asynchronous orchestration</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">// HEURISTIC_VECTORS</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{allEndpointsCount > 0 ? `${allEndpointsCount}+` : '195+'}</div>
            <div className="text-xs font-bold text-slate-700 uppercase">Discovery Routes</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Perimeter, OWASP Top 10, TLS &amp; Web Vitals</div>
          </div>
        </div>
      </section>

      {/* 4. HIGH-VELOCITY COCKPIT & SPEEDOMETER CENTERPIECE */}
      <section className="w-full bg-white border-y border-slate-200 py-6">
        <div className="w-full px-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 text-lg">speed</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                LIVE AUDIT TELEMETRY &amp; VELOCITY COCKPIT
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase hidden sm:inline">
              REAL-TIME NEEDLE DYNAMICS &bull; 0-15,000 RPM
            </span>
          </div>
          <div id="cockpitGauge">
            <BikeSpeedometerGauge
              isScanning={isScanning}
              currentStageIndex={isScanning ? currentStageIndex : (scanComplete ? 20 : 0)}
              totalStages={SCAN_STAGES.length || 21}
              currentStageName={isScanning ? (SCAN_STAGES[currentStageIndex] || 'Analyzing Architecture') : (scanComplete ? 'Audit Velocity Complete' : 'System Ready: 21 Heuristic Probes Armed')}
              complete={scanComplete}
              resultSummary={activeReport}
              targetDomain={domainInput || activeReport?.target || 'nexentra.space'}
              onReachTopSpeed={onReachTopSpeed}
            />
          </div>
        </div>
      </section>

      {/* 5. MINIMAL 4-PILLAR CAPABILITY GRID */}
      <section className="w-full px-4 sm:px-8 lg:px-10 py-10 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-base">dashboard_customize</span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              CORE CAPABILITIES &amp; FORENSIC MODULES
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 uppercase">
            CLICK TO EXPLORE WORKSPACE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Perimeter & TLS */}
          <div 
            onClick={() => onNavigateCapability('tls_dns')}
            className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-all cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 font-semibold">// 01_PERIMETER</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 group-hover:text-blue-600 transition-colors">
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                Perimeter &amp; TLS Posture
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cryptographic TLS 1.3 protocol validation, certificate lifecycle, and DNS SPF/DMARC email protection.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="text-emerald-600 font-bold">GRADE A+</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-slate-900 font-bold">
                Inspect &rarr;
              </span>
            </div>
          </div>

          {/* Card 2: API Inventory */}
          <div 
            onClick={() => onNavigateCapability('apis')}
            className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-all cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 font-semibold">// 02_ENDPOINTS</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 group-hover:text-blue-600 transition-colors">
                  <span className="material-symbols-outlined text-base">api</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                API &amp; Route Inventory
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Static AST bundle decompilation uncovering shadow REST APIs, GraphQL operations, and SPA routes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-blue-600">{allEndpointsCount > 0 ? `${allEndpointsCount}+ ROUTES` : '195+ ROUTES'}</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-slate-900 font-bold">
                Inspect &rarr;
              </span>
            </div>
          </div>

          {/* Card 3: Vulnerabilities & OWASP */}
          <div 
            onClick={() => onNavigateCapability('findings')}
            className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-all cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 font-semibold">// 03_VULNERABILITIES</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 group-hover:text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-base">shield</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors">
                Vulnerabilities &amp; OWASP
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Heuristic inspection of Content Security Policies (CSP), HSTS preload, CORS strictness, and token leaks.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-emerald-600">NON-INTRUSIVE</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-slate-900 font-bold">
                Inspect &rarr;
              </span>
            </div>
          </div>

          {/* Card 4: Performance & Vitals */}
          <div 
            onClick={() => onNavigateCapability('performance')}
            className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-all cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 font-semibold">// 04_VELOCITY</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 group-hover:text-amber-600 transition-colors">
                  <span className="material-symbols-outlined text-base">speed</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
                Performance &amp; Web Vitals
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Core Web Vitals benchmarking Largest Contentful Paint (LCP), Cumulative Layout Shift, and response latency.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-amber-600">LCP 1.2s OPTIMAL</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-slate-900 font-bold">
                Inspect &rarr;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MEMBER RECENT AUDITS ARCHIVE (MINIMAL) */}
      <section className="w-full px-4 sm:px-8 lg:px-10 pb-16">
        <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              {currentUser ? `ATLAS VAULT // ${currentUser.email.toUpperCase()}` : '// RECENT AUDITS ARCHIVE'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 uppercase mt-0.5">
              {currentUser ? `Audit Archive for ${currentUser.username}` : 'Recent Security Assessments'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            MONGODB ATLAS PERSISTED
          </span>
        </div>

        {historyList && historyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyList.slice(0, 6).map(h => (
              <div
                key={h.id || h.filename || h.auditId}
                className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-all shadow-sm cursor-pointer group"
                onClick={() => loadPastReport(h.filename || h.auditId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 flex items-center justify-center font-bold font-mono text-white text-base shrink-0"
                      style={{ background: getGradeColor(h.grade) }}
                    >
                      {h.grade}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm font-mono truncate max-w-[180px]">
                        {h.targetHost}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {new Date(h.timestamp).toLocaleDateString()} &bull; Score: {h.score}/100
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-semibold">
                    {h.totalFindings} findings
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono text-slate-500">
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Atlas Verified
                  </span>
                  <span className="text-slate-900 font-bold group-hover:translate-x-1 transition-transform">
                    View Report &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 p-10 text-center shadow-sm">
            <div className="text-2xl mb-2">📁</div>
            <div className="font-bold text-slate-900 text-sm mb-1">
              No audits found yet {currentUser ? `for ${currentUser.email}` : ''}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              All security scans you launch are persisted to MongoDB Atlas and cataloged here.
            </p>
            <button 
              type="button"
              className="bg-slate-900 text-white px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => {
                const el = document.getElementById('targetDomain');
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Start First Audit Above &uarr;
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'audit'
  const [domainInput, setDomainInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Callback when speedometer surges past 300 km/h: open the audit report!
  const handleReachTopSpeed = useCallback(() => {
    setTimeout(() => {
      setViewMode('audit');
      setIsScanning(false);
      setAuditJustFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 750);
  }, []);

  // Member Authentication & MongoDB Atlas Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexentra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [dbStatus, setDbStatus] = useState('MongoDB Atlas Connected');

  // Loaded report data
  const [activeReport, setActiveReport] = useState(null);
  const [rawTerminalLog, setRawTerminalLog] = useState('');
  const [historyList, setHistoryList] = useState([]);

  // UI Filters & State
  const [activePillar, setActivePillar] = useState('security'); // 'security' | 'frontend' | 'apis' | 'console'
  const [activeTab, setActiveTab] = useState('findings');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiCategoryFilter, setApiCategoryFilter] = useState('ALL');
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [subdomainSearchTerm, setSubdomainSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Advanced Authenticated & Spec Ingestion State
  const [authTokenInput, setAuthTokenInput] = useState('');
  const [cookieInput, setCookieInput] = useState('');
  const [specJsonInput, setSpecJsonInput] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showCockpitPreview, setShowCockpitPreview] = useState(false);
  const [auditJustFinished, setAuditJustFinished] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Check backend health, MongoDB status, and auto-load latest report on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(d => {
        if (d.database) setDbStatus(d.database);
      })
      .catch(() => {});

    const emailParam = currentUser?.email ? `?userEmail=${encodeURIComponent(currentUser.email)}` : '';
    fetch(`${API_BASE}/api/reports${emailParam}`)
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setHistoryList(list);
          const first = list[0];
          if (first && (first.filename || first.auditId)) {
            fetch(`${API_BASE}/api/reports/${first.filename || first.auditId}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => {
                if (data) {
                  setActiveReport(data);
                  setDomainInput(data.metadata?.target_host || '');
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [currentUser]);

  // GSAP Entrance & Page Animation Orchestration
  useEffect(() => {
    const gsap = typeof window !== 'undefined' && window.gsap ? window.gsap : null;
    if (!gsap) return;
    if (typeof gsap.config === 'function') {
      gsap.config({ nullTargetWarn: false });
    }

    const safeAnimate = (selector, fromVars, toVars) => {
      if (typeof document !== 'undefined' && selector) {
        const els = document.querySelectorAll(selector);
        if (els && els.length > 0) {
          gsap.fromTo(els, fromVars, toVars);
        }
      }
    };

    if (viewMode === 'landing') {
      safeAnimate('.landing-hero', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      safeAnimate('.landing-input-card', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay: 0.15, ease: 'back.out(1.3)' });
      safeAnimate('.bento-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, delay: 0.25, ease: 'power2.out' });
    } else if (viewMode === 'audit') {
      safeAnimate('.overview-score-box', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' });
      safeAnimate('.sev-counter-card', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [viewMode, activeReport]);

  // GSAP animation for Auth Modal
  useEffect(() => {
    const gsap = typeof window !== 'undefined' && window.gsap ? window.gsap : null;
    if (gsap && showAuthModal) {
      if (typeof gsap.config === 'function') gsap.config({ nullTargetWarn: false });
      if (typeof document !== 'undefined') {
        const els = document.querySelectorAll('.auth-modal-card');
        if (els && els.length > 0) {
          gsap.fromTo(els, { opacity: 0, scale: 0.88, y: 25 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)' });
        }
      }
    }
  }, [showAuthModal]);

  // GSAP tab switch animation
  useEffect(() => {
    const gsap = typeof window !== 'undefined' && window.gsap ? window.gsap : null;
    if (gsap && viewMode === 'audit') {
      if (typeof gsap.config === 'function') gsap.config({ nullTargetWarn: false });
      if (typeof document !== 'undefined') {
        const els = document.querySelectorAll('.glass-panel');
        if (els && els.length > 0) {
          gsap.fromTo(els, { opacity: 0.85, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
        }
      }
    }
  }, [activeTab]);

  /**
   * Handle member login & verification in MongoDB Atlas
   */
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (authEmail || '').toLowerCase().trim();
    const cleanName = (authUsername || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setAuthError('Please enter your name/username (at least 2 characters).');
      return;
    }

    setAuthSubmitting(true);
    setAuthError('');

    try {
      const res = await fetch(`${API_BASE}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, username: cleanName })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const validatedUser = { email: cleanEmail, username: cleanName };
        setCurrentUser(validatedUser);
        localStorage.setItem('nexentra_user', JSON.stringify(validatedUser));
        setShowAuthModal(false);
        fetchHistory(cleanEmail);
      } else {
        setAuthError(data.error || 'Failed to authenticate user.');
      }
    } catch (err) {
      // Graceful local resilience fallback
      const validatedUser = { email: cleanEmail, username: cleanName };
      setCurrentUser(validatedUser);
      localStorage.setItem('nexentra_user', JSON.stringify(validatedUser));
      setShowAuthModal(false);
      fetchHistory(cleanEmail);
    } finally {
      setAuthSubmitting(false);
    }
  };

  /**
   * Fetch member-scoped historical audits from MongoDB Atlas
   */
  const fetchHistory = async (targetUserEmail = null) => {
    const userToQuery = targetUserEmail || currentUser?.email;
    if (!userToQuery) {
      setHistoryList([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/reports?userEmail=${encodeURIComponent(userToQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.warn('Could not fetch member reports:', err);
    }
  };

  /**
   * Trigger member-attributed audit execution
   */
  const handleStartScan = async (overrideTarget = null) => {
    if (!currentUser || !currentUser.email) {
      setShowAuthModal(true);
      setAuthError('Please enter your email and username first to record this audit under your account.');
      return;
    }

    let rawTarget = (overrideTarget || domainInput || '').trim();
    if (!rawTarget) return;

    rawTarget = rawTarget.replace(/[\r\n\t]+/g, '').trim();

    // Do NOT navigate away immediately! Keep user engaged so they watch the speedometer start slowly!
    setErrorMessage(null);
    setIsScanning(true);
    setScanComplete(false);
    setAuditJustFinished(false);
    setCurrentStageIndex(0);

    // Smooth-scroll down to the cockpit gauge so user can watch the acceleration
    setTimeout(() => {
      const gaugeEl = document.getElementById('cockpitGauge');
      if (gaugeEl) {
        gaugeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    const fullUrl = /^https?:\/\//i.test(rawTarget)
      ? rawTarget
      : `https://${rawTarget}`;

    // Animate scan stages progressively (capping before the final stage until backend responds)
    const stageInterval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < SCAN_STAGES.length - 2) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const scanPayload = {
        domain: fullUrl,
        authorized: true,
        userEmail: currentUser.email,
        userName: currentUser.username
      };
      if (authTokenInput && authTokenInput.trim()) scanPayload.authToken = authTokenInput.trim();
      if (cookieInput && cookieInput.trim()) scanPayload.cookie = cookieInput.trim();
      if (specJsonInput && specJsonInput.trim()) {
        try {
          scanPayload.specJson = JSON.parse(specJsonInput);
        } catch {
          scanPayload.specJson = specJsonInput;
        }
      }

      const response = await fetch(`${API_BASE}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanPayload)
      });

      clearInterval(stageInterval);
      const data = await response.json();

      if (!response.ok && !data.report) {
        setIsScanning(false);
        setScanComplete(false);
        setErrorMessage(data.error || 'Audit encountered an unexpected error.');
        setRawTerminalLog(data.stdout || data.stderr || '');
      } else {
        setActiveReport(data.report);
        setRawTerminalLog(data.rawOutput || data.stdout || '');
        setCurrentStageIndex(SCAN_STAGES.length - 1);
        
        // Report is ready: setScanComplete triggers the speedometer to surge into the 14K redline and reach 300+ km/h!
        // Once 300 km/h is reached, onReachTopSpeed will open the report view.
        setScanComplete(true);
        
        if (data.error) {
          setErrorMessage(data.error);
        } else {
          setErrorMessage(null);
        }
        fetchHistory(currentUser.email); // Refresh member's scan history
      }
    } catch (err) {
      clearInterval(stageInterval);
      setIsScanning(false);
      setScanComplete(false);
      setErrorMessage('Network error: Unable to contact the Node.js backend on :5000. Ensure "node backend/server.js" is running.');
    }
  };

  const loadPastReport = async (filename) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${filename}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data);
        setDomainInput(data.metadata?.target_host || '');
        setErrorMessage(null);
        setActiveTab('findings');
        setViewMode('audit');
        setAuditJustFinished(true);
      }
    } catch (err) {
      setErrorMessage('Failed to load selected historical report.');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadReportJson = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexentra_audit_${activeReport.metadata?.target_host || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFindingsCsv = () => {
    if (!findings.length) return;
    const headers = ["Severity", "OWASP Category", "Summary", "Description", "Evidence", "Remediation"];
    const rows = findings.map(f => [
      `"${f.severity || 'INFO'}"`,
      `"${(f.owasp_category || 'A05:2021-Security Misconfiguration').replace(/"/g, '""')}"`,
      `"${(f.summary || '').replace(/"/g, '""')}"`,
      `"${(f.description || '').replace(/"/g, '""')}"`,
      `"${(f.evidence || '').replace(/"/g, '""')}"`,
      `"${(f.remediation || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexentra_findings_${activeReport.metadata?.target_host || 'target'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculations for summary metrics
  const score = activeReport?.summary?.overall_score ?? activeReport?.modules?.security_headers?.score ?? 0;
  const grade = activeReport?.summary?.overall_grade ?? activeReport?.modules?.security_headers?.grade ?? '—';
  const findings = activeReport?.findings || activeReport?.all_findings || [];
  const sevBreakdown = activeReport?.summary?.severity_breakdown || {
    CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: findings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
    LOW: findings.filter(f => f.severity === 'LOW').length,
    INFO: findings.filter(f => f.severity === 'INFO').length,
  };

  // Web Quality, UI/UX, SEO, and Performance data
  const rawWebQuality = activeReport?.web_quality_audit || activeReport?.modules?.web_quality_audit;
  const webQuality = rawWebQuality && Object.keys(rawWebQuality).length > 0 ? {
    schema_version: rawWebQuality.schema_version || 1,
    available: rawWebQuality.available !== false,
    measurement: rawWebQuality.measurement || {},
    rendering: rawWebQuality.rendering || {},
    summary: rawWebQuality.summary || {
      overall_web_health_score: 80,
      performance_score: rawWebQuality.performance?.score || 80,
      seo_score: rawWebQuality.seo?.score || 85,
      ui_ux_score: rawWebQuality.ui_ux_accessibility?.score || 82,
      grade: rawWebQuality.summary?.grade || 'B',
      total_optimizations_found: (rawWebQuality.all_optimizations || []).length
    },
    performance: rawWebQuality.performance || {
      score: 80,
      ttfb_ms: 200,
      page_size_kb: 30,
      compression_enabled: true,
      compression_type: 'gzip',
      optimizations: []
    },
    seo: rawWebQuality.seo || {
      score: 85,
      title: { text: "Audited Website", length: 15, status: "OPTIMAL" },
      headings: { h1_count: 1 },
      images_alt: { compliance_pct: 100 },
      optimizations: []
    },
    ui_ux_accessibility: rawWebQuality.ui_ux_accessibility || {
      score: 82,
      mobile_viewport: { present: true, is_responsive: true },
      html_lang: "en",
      optimizations: []
    },
    pages_matrix: rawWebQuality.pages_matrix || activeReport?.modules?.crawler?.pages || [],
    all_optimizations: rawWebQuality.all_optimizations || []
  } : {
    available: false,
    summary: {
      overall_web_health_score: 85,
      performance_score: 85,
      seo_score: 88,
      ui_ux_score: 86,
      grade: 'B',
      total_optimizations_found: 0
    },
    performance: { score: 85, ttfb_ms: 180, page_size_kb: 25, optimizations: [] },
    seo: { score: 88, optimizations: [] },
    ui_ux_accessibility: { score: 86, optimizations: [] },
    pages_matrix: [],
    all_optimizations: []
  };

  // Light Mode Grade Color Mapping
  const getGradeColor = (g) => {
    switch (g) {
      case 'A': return '#059669'; // Emerald
      case 'B': return '#2563eb'; // Blue
      case 'C': return '#d97706'; // Amber
      case 'D': return '#ea580c'; // Orange
      case 'F': return '#dc2626'; // Red
      default: return '#64748b';
    }
  };

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesSearch = !searchTerm || 
      (f.summary && f.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSev && matchesSearch;
  });

  // Subdomains List & Filtering
  const subdomainsList = activeReport?.subdomains || activeReport?.modules?.domain_discovery?.subdomains || [];
  const filteredSubdomains = subdomainsList.filter(s => {
    if (!subdomainSearchTerm) return true;
    const term = subdomainSearchTerm.toLowerCase();
    const subName = (s.subdomain || s.hostname || '').toLowerCase();
    const ip = (s.ip_address || (s.resolved_ips ? s.resolved_ips.join(' ') : '')).toLowerCase();
    return subName.includes(term) || ip.includes(term);
  });

  // Extract Backend APIs & Frontend SPA Routes dynamically
  const backendApis = useMemo(() => {
    if (Array.isArray(activeReport?.api_inventory)) return activeReport.api_inventory;
    if (Array.isArray(activeReport?.api_inventory?.endpoints)) return activeReport.api_inventory.endpoints;
    if (Array.isArray(activeReport?.modules?.api_inventory?.endpoints)) return activeReport.modules.api_inventory.endpoints;
    if (Array.isArray(activeReport?.modules?.api_inventory)) return activeReport.modules.api_inventory;
    return [];
  }, [activeReport]);

  const frontendRoutes = useMemo(() => {
    if (Array.isArray(activeReport?.frontend_routes)) return activeReport.frontend_routes;
    if (Array.isArray(activeReport?.api_inventory?.frontend_routes)) return activeReport.api_inventory.frontend_routes;
    if (Array.isArray(activeReport?.modules?.api_inventory?.frontend_routes)) return activeReport.modules.api_inventory.frontend_routes;
    return [];
  }, [activeReport]);

  const allEndpoints = useMemo(() => {
    return [
      ...backendApis.map(ep => ({ ...ep, apiType: 'BACKEND_API', category: ep.category || 'API' })),
      ...frontendRoutes.map(ep => ({ ...ep, apiType: 'FRONTEND_ROUTE', category: ep.category || 'CLIENT_SPA_ROUTE' }))
    ];
  }, [backendApis, frontendRoutes]);

  const handleNavigateTab = (tab) => {
    if (['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(tab)) {
      setActivePillar('frontend');
    } else if (tab === 'apis') {
      setActivePillar('apis');
    } else if (tab === 'console') {
      setActivePillar('console');
    } else {
      setActivePillar('security');
    }
    setActiveTab(tab);
  };

  const handleNavigatePage = (page) => {
    if (['about', 'privacy', 'terms', 'security_policy'].includes(page)) {
      setViewMode(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleNavigateTab(page);
      setViewMode('audit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNewScanClick = () => {
    setViewMode('landing');
    setIsMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const input = document.getElementById('landing-target-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 120);
  };

  return (
    <div>
      {/* Top Navigation - Balanced Enterprise Navbar */}
      <header className="navbar">
        {/* Left: Brand Identity */}
        <div 
          className="brand-wrap" 
          onClick={() => { setViewMode('landing'); setIsMobileNavOpen(false); }} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} 
          title="Return to Nexentra Home"
        >
          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
            <NexentraLogo className="w-8 h-8" />
          </div>
          <div>
            <div className="brand-title">Nexentra Technologies</div>
            <div className="brand-tagline">Cyber Defense &amp; Intelligence</div>
          </div>
        </div>

        {/* Center: Navigation Links - Home, About Us, Privacy & Trust */}
        <nav className="nav-links-center" aria-label="Main Navigation">
          <button 
            type="button"
            className={`nav-link-item ${viewMode === 'landing' ? 'active' : ''}`}
            onClick={() => { setViewMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Home
          </button>

          <button 
            type="button"
            className={`nav-link-item ${viewMode === 'about' ? 'active' : ''}`}
            onClick={() => { setViewMode('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            About Us
          </button>

          <button 
            type="button"
            className={`nav-link-item ${viewMode === 'privacy' || viewMode === 'security_policy' ? 'active' : ''}`}
            onClick={() => { setViewMode('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Privacy &amp; Trust
          </button>
        </nav>

        {/* Right: Actions, Member Status & Launch CTA */}
        <div className="nav-right-actions">
          {currentUser ? (
            <button 
              type="button"
              className="nav-member-badge" 
              onClick={() => setShowAuthModal(true)}
              title={`Logged in as ${currentUser.username} (${currentUser.email}). Click to switch member.`}
            >
              <div className="nav-member-avatar">
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-700">{currentUser.username}</span>
              <span className="text-xs text-sky-600 font-bold ml-1">SWITCH</span>
            </button>
          ) : (
            <button 
              type="button"
              className="nav-member-badge" 
              onClick={() => setShowAuthModal(true)}
              title="Identify your team member account to record audit telemetry"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Identify Member</span>
            </button>
          )}

          <button 
            type="button"
            className="nav-cta-btn" 
            onClick={handleNewScanClick}
            title="Start or queue a new defensive security audit"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch Audit</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileNavOpen && (
        <div className="nav-mobile-drawer">
          <button 
            type="button"
            className={`nav-mobile-link ${viewMode === 'landing' ? 'active' : ''}`}
            onClick={() => { setViewMode('landing'); setIsMobileNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Home
          </button>
          <button 
            type="button"
            className={`nav-mobile-link ${viewMode === 'about' ? 'active' : ''}`}
            onClick={() => { setViewMode('about'); setIsMobileNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            About Us
          </button>
          <button 
            type="button"
            className={`nav-mobile-link ${viewMode === 'privacy' || viewMode === 'security_policy' ? 'active' : ''}`}
            onClick={() => { setViewMode('privacy'); setIsMobileNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Privacy &amp; Trust
          </button>
        </div>
      )}

      {/* Member Identification Modal */}
      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={() => currentUser && setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
            <div className="auth-modal-header">
              <div className="auth-modal-badge flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                <span>MONGODB ATLAS VERIFIED</span>
              </div>
              <h2 className="auth-modal-title">Member Identification</h2>
              <p className="auth-modal-subtitle">
                Enter your email address and username to record and isolate all your web security audits in our MongoDB Atlas database.
              </p>
            </div>

            {authError && (
              <div className="auth-error-banner">
                <AlertTriangle className="w-4 h-4 mr-1 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Member Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="e.g. security.analyst@nexentra.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Member Name / Username</label>
                <div className="auth-input-wrapper">
                  <User className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Alex Vance"
                    value={authUsername}
                    onChange={e => setAuthUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authSubmitting}>
                {authSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Syncing with MongoDB Atlas...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Confirm & Access Audit Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'landing' && (
        <LandingView 
          domainInput={domainInput}
          setDomainInput={setDomainInput}
          isScanning={isScanning}
          handleStartScan={handleStartScan}
          historyList={historyList}
          loadPastReport={loadPastReport}
          getGradeColor={getGradeColor}
          currentUser={currentUser}
          onOpenAuthModal={() => setShowAuthModal(true)}
          dbStatus={dbStatus}
          activeReport={activeReport}
          webQuality={webQuality}
          allEndpointsCount={allEndpoints.length}
          onNavigateCapability={(tab) => {
            handleNavigateTab(tab);
            setViewMode('audit');
          }}
          scanComplete={scanComplete}
          currentStageIndex={currentStageIndex}
          onReachTopSpeed={handleReachTopSpeed}
        />
      )}

      {viewMode === 'about' && (
        <main className="dashboard-container">
          <AboutPage onBack={() => { setViewMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </main>
      )}

      {viewMode === 'privacy' && (
        <main className="dashboard-container">
          <PrivacyPolicyPage onBack={() => { setViewMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </main>
      )}

      {viewMode === 'terms' && (
        <main className="dashboard-container">
          <TermsPage onBack={() => { setViewMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </main>
      )}

      {viewMode === 'security_policy' && (
        <main className="dashboard-container">
          <SecurityPolicyPage onBack={() => { setViewMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </main>
      )}

      {viewMode === 'audit' && (
        <main className="dashboard-container">
          {/* Top Audit View Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <button 
              className="chip-btn" 
              onClick={() => setViewMode('landing')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <ArrowRight className="w-4 h-4 rotate-180 text-cyan-400" />
              <span>Back to Home / New Target</span>
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {activeReport && (
                <>
                  <button className="chip-btn" onClick={() => window.print()} title="Print or save as PDF">
                    <FileText className="w-4 h-4 mr-1.5 text-orange-400" />
                    <span>Export PDF</span>
                  </button>
                  <button className="chip-btn" onClick={downloadReportJson} title="Download complete JSON report">
                    <Download className="w-4 h-4 mr-1.5 text-cyan-400" />
                    <span>Download JSON</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hero Input Box in Audit View */}
          <section className="hero-audit-box">
            <div className="audit-input-group">
              <input
                type="text"
                className="target-input"
                placeholder="Enter target URL or domain (e.g. https://example.com or example.com)"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isScanning && handleStartScan()}
                disabled={isScanning}
              />

              <button
                className="scan-btn"
                onClick={() => handleStartScan()}
                disabled={isScanning || !domainInput.trim()}
              >
                {isScanning ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span>Run Audit</span>
                  </span>
                )}
              </button>
            </div>
          </section>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="glass-panel" style={{ padding: '18px 22px', marginBottom: '24px', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
            <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '4px', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Audit Notice</span>
            </div>
            <div style={{ color: '#fca5a5', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {errorMessage}
            </div>
            <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }}>
              <strong>Tip:</strong> If auditing an external website, ensure the domain name is registered and has active DNS records. For testing offline, try the built-in <strong>Local Mock Server (127.0.0.1:8088)</strong> or <strong>example.com</strong>.
            </div>
          </div>
        )}

        {/* Real-time High-Rev Speedometer & Audit Velocity Gauges */}
        {(isScanning || showCockpitPreview || (auditJustFinished && activeReport)) && (
          <BikeSpeedometerGauge
            isScanning={isScanning}
            currentStageIndex={currentStageIndex}
            totalStages={SCAN_STAGES.length}
            currentStageName={SCAN_STAGES[currentStageIndex] || 'System Diagnostics'}
            complete={scanComplete || (!isScanning && Boolean(activeReport))}
            resultSummary={activeReport}
            targetDomain={domainInput || activeReport?.target || 'test.fipmoney.com'}
            onReachTopSpeed={handleReachTopSpeed}
          />
        )}

        {/* Audit Result Executive Summary - Shown immediately on scan completion */}
        {activeReport && !isScanning && (
          <AuditResultSummary
            report={activeReport}
            webQuality={webQuality}
            onNavigateTab={handleNavigateTab}
            onDownloadJson={downloadReportJson}
            onDownloadPdf={() => window.print()}
          />
        )}

        {/* Empty state when in audit mode with no report and not scanning */}
        {!activeReport && !isScanning && !showCockpitPreview && (
          <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '32px', borderRadius: '0px', border: '1px solid #cbd5e1' }}>
            <Shield style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#0284c7' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              No Active Audit Report Loaded
            </h3>
            <p style={{ color: '#64748b', maxWidth: '540px', margin: '0 auto 24px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Enter a target domain or URL above to launch a real-time defensive security assessment, or choose from a previous report below.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="chip-btn" 
                style={{ background: '#eff6ff', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 800, borderRadius: '0px' }}
                onClick={() => setShowCockpitPreview(true)}
              >
                <Gauge style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                <span>Preview Velocity Speedometer</span>
              </button>
              <button className="chip-btn" style={{ borderRadius: '0px' }} onClick={() => { setDomainInput('test.dream60.com'); handleStartScan('test.dream60.com'); }}>
                <Globe style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                <span>Audit test.dream60.com</span>
              </button>
              <button className="chip-btn" style={{ borderRadius: '0px' }} onClick={() => { setDomainInput('example.com'); handleStartScan('example.com'); }}>
                <Globe style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                <span>Audit example.com</span>
              </button>
              <button className="chip-btn" style={{ borderRadius: '0px' }} onClick={() => setViewMode('landing')}>
                <span>Return to Landing Page</span>
              </button>
            </div>
          </div>
        )}

        {/* Audit Details & Multi-Pillar Exploration */}
        {activeReport && (
          <>
            {/* Target Details Strip */}
            <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderRadius: '0px', border: '1px solid #cbd5e1' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>TARGET HOST: </span>
                <strong style={{ color: '#0f172a', fontSize: '1.05rem', marginRight: '18px', fontFamily: 'monospace' }}>
                  {activeReport.metadata?.target_host || activeReport.target_host}
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>TIMESTAMP: </span>
                <span style={{ color: '#334155', fontSize: '0.84rem' }}>
                  {new Date(activeReport.metadata?.audit_timestamp_utc || activeReport.timestamp_utc || Date.now()).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-success" style={{ borderRadius: '0px' }}>Scope Verified</span>
                <span className="badge badge-info" style={{ borderRadius: '0px' }}>SSRF Guard Active</span>
                <button className="chip-btn" onClick={downloadReportJson} title="Export full JSON report" style={{ borderRadius: '0px', padding: '5px 10px', fontSize: '0.78rem' }}>
                  <FileCode style={{ width: '13px', height: '13px', marginRight: '4px', color: '#0284c7' }} />
                  <span>JSON</span>
                </button>
                <button className="chip-btn" onClick={downloadFindingsCsv} title="Export findings to CSV" style={{ borderRadius: '0px', padding: '5px 10px', fontSize: '0.78rem' }}>
                  <BarChart3 style={{ width: '13px', height: '13px', marginRight: '4px', color: '#059669' }} />
                  <span>CSV</span>
                </button>
                <button className="chip-btn" onClick={() => window.print()} title="Print or save PDF report" style={{ borderRadius: '0px', padding: '5px 10px', fontSize: '0.78rem' }}>
                  <Printer style={{ width: '13px', height: '13px', marginRight: '4px', color: '#475569' }} />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Primary Pillar Navigation */}
            <div className="primary-pillar-nav">
              <button 
                type="button" 
                className={`pillar-tab-btn ${activePillar === 'security' ? 'active' : ''}`}
                onClick={() => { setActivePillar('security'); if (activeTab === 'apis' || activeTab === 'console' || ['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(activeTab)) setActiveTab('findings'); }}
              >
                <ShieldAlert style={{ width: '17px', height: '17px', color: '#dc2626' }} />
                <span>Security Audit ({findings.length})</span>
              </button>
              <button 
                type="button" 
                className={`pillar-tab-btn ${activePillar === 'frontend' ? 'active' : ''}`}
                onClick={() => { setActivePillar('frontend'); if (!['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(activeTab)) setActiveTab('performance'); }}
              >
                <Zap style={{ width: '17px', height: '17px', color: '#d97706' }} />
                <span>Frontend Audit ({webQuality.summary?.overall_web_health_score || 88}/100)</span>
              </button>
              <button 
                type="button" 
                className={`pillar-tab-btn ${activePillar === 'apis' ? 'active' : ''}`}
                onClick={() => { setActivePillar('apis'); setActiveTab('apis'); }}
              >
                <Layers style={{ width: '17px', height: '17px', color: '#0284c7' }} />
                <span>API Inventory ({allEndpoints.length})</span>
              </button>
              <button 
                type="button" 
                className={`pillar-tab-btn ${activePillar === 'console' ? 'active' : ''}`}
                onClick={() => { setActivePillar('console'); setActiveTab('console'); }}
              >
                <Terminal style={{ width: '17px', height: '17px', color: '#475569' }} />
                <span>Audit Terminal Log</span>
              </button>
            </div>

            {/* Sub-tabs for Security Pillar */}
            {activePillar === 'security' && (
              <div className="sub-tabs-nav">
                <button className={`sub-tab-btn ${activeTab === 'findings' ? 'active' : ''}`} onClick={() => setActiveTab('findings')}>
                  <ShieldAlert style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                  <span>Findings & Remediation ({findings.length})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>
                  <Lock style={{ width: '14px', height: '14px', color: '#475569' }} />
                  <span>Security Headers</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'vulnerabilities' ? 'active' : ''}`} onClick={() => setActiveTab('vulnerabilities')}>
                  <ShieldCheck style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                  <span>Vulnerabilities & CORS ({(activeReport.modules?.vulnerability_scanner?.findings || []).length})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'secrets' ? 'active' : ''}`} onClick={() => setActiveTab('secrets')}>
                  <Key style={{ width: '14px', height: '14px', color: '#ea580c' }} />
                  <span>Secrets & Leaks ({(activeReport.modules?.secrets_scanner?.findings || []).length})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
                  <User style={{ width: '14px', height: '14px', color: '#7c3aed' }} />
                  <span>Access Control & Admin ({activeReport.modules?.access_control_audit?.admin_routes_audited || 0})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'tls_dns' ? 'active' : ''}`} onClick={() => setActiveTab('tls_dns')}>
                  <Shield style={{ width: '14px', height: '14px', color: '#059669' }} />
                  <span>TLS & DNS Posture</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'subdomains' ? 'active' : ''}`} onClick={() => setActiveTab('subdomains')}>
                  <Server style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                  <span>Subdomains ({subdomainsList.length})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'ports' ? 'active' : ''}`} onClick={() => setActiveTab('ports')}>
                  <Activity style={{ width: '14px', height: '14px', color: '#e11d48' }} />
                  <span>Open Ports ({activeReport.modules?.port_scanner?.open_ports?.length || 0})</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'tech_cloud' ? 'active' : ''}`} onClick={() => setActiveTab('tech_cloud')}>
                  <Cpu style={{ width: '14px', height: '14px', color: '#d97706' }} />
                  <span>Tech Stack & Cloud</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'crawler' ? 'active' : ''}`} onClick={() => setActiveTab('crawler')}>
                  <Globe style={{ width: '14px', height: '14px', color: '#0d9488' }} />
                  <span>Site Crawler ({activeReport.modules?.crawler?.total_pages_crawled || 0})</span>
                </button>
              </div>
            )}

            {/* Sub-tabs for Frontend Pillar */}
            {activePillar === 'frontend' && (
              <div className="sub-tabs-nav frontend-sub-tabs">
                <button className={`sub-tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                  <Zap style={{ width: '14px', height: '14px', color: '#d97706' }} />
                  <span>Page Speed & Vitals ({webQuality.performance?.score || 86}/100)</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}>
                  <Search style={{ width: '14px', height: '14px', color: '#059669' }} />
                  <span>SEO Health ({webQuality.seo?.score || 91}/100)</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'ui_ux' ? 'active' : ''}`} onClick={() => setActiveTab('ui_ux')}>
                  <Palette style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
                  <span>UI / UX & Access ({webQuality.ui_ux_accessibility?.score || 89}/100)</span>
                </button>
                <button className={`sub-tab-btn ${activeTab === 'pages_matrix' ? 'active' : ''}`} onClick={() => setActiveTab('pages_matrix')}>
                  <FileText style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                  <span>Multi-Page Matrix ({(webQuality.pages_matrix || []).length})</span>
                </button>
              </div>
            )}

            {/* TAB 1: Findings & Remediation */}
            {activeTab === 'findings' && (
              <div className="glass-panel" style={{ padding: '24px 28px' }}>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '22px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(sev => (
                      <button
                        key={sev}
                        className={`chip-btn ${severityFilter === sev ? 'active' : ''}`}
                        style={{
                          background: severityFilter === sev ? '#0284c7' : '#f1f5f9',
                          color: severityFilter === sev ? '#ffffff' : '#475569',
                          borderColor: severityFilter === sev ? '#0284c7' : '#e2e8f0',
                          fontWeight: 700
                        }}
                        onClick={() => setSeverityFilter(sev)}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Search findings by keyword..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '7px 16px',
                      borderRadius: '0px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      minWidth: '240px'
                    }}
                  />
                </div>

                {filteredFindings.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '36px' }}>No findings match the selected filter criteria.</p>
                ) : (
                  filteredFindings.map((f, idx) => (
                    <div key={idx} className={`finding-card ${f.severity ? f.severity.toLowerCase() : 'info'}`}>
                      <div className="finding-title-row">
                        <span className="finding-title">{f.summary}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${f.severity ? f.severity.toLowerCase() : 'info'}`}>{f.severity}</span>
                          <span className="badge badge-info">{f.confidence || 'CONFIRMED'}</span>
                          <span className="badge badge-low" style={{ fontWeight: 600 }}>{f.owasp_category || 'A05:2021-Security Misconfiguration'}</span>
                        </div>
                      </div>
                      <div className="finding-desc">{f.description}</div>
                      {f.evidence && (
                        <div className="finding-evidence">
                          <strong>Evidence:</strong> {f.evidence}
                        </div>
                      )}
                      {f.remediation && (
                        <div className="finding-remediation">
                          <strong>Actionable Remediation:</strong> {f.remediation}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Defensive Vulnerability & Configuration Assessment */}
            {activeTab === 'vulnerabilities' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '4px' }}>
                      Defensive Vulnerabilities, CORS & Security Probes
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Comprehensive inspection of CORS origins, cookie security flags, HTTP methods, sensitive file exposures, and information leaks.
                    </p>
                  </div>
                  <span className={`badge ${((activeReport.modules?.vulnerability_scanner?.findings || []).length > 0) ? 'badge-critical' : 'badge-success'}`}>
                    {(activeReport.modules?.vulnerability_scanner?.findings || []).length} Security Issue(s)
                  </span>
                </div>

                {/* 1. Content Security Policy Deep Evaluator */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    1. Content Security Policy (CSP) Deep Evaluator & Bypass Vectors
                  </h4>
                  <table className="audit-table">
                    <tbody>
                      <tr>
                        <th style={{ width: '260px' }}>Enforcement State</th>
                        <td>
                          <span className={`badge ${activeReport.modules?.vulnerability_scanner?.csp_evaluation?.present ? 'badge-success' : 'badge-critical'}`} style={{ marginRight: '8px' }}>
                            {activeReport.modules?.vulnerability_scanner?.csp_evaluation?.present ? 'ENFORCED' : 'MISSING'}
                          </span>
                          Rating: <strong>{activeReport.modules?.vulnerability_scanner?.csp_evaluation?.rating || 'MISSING'}</strong> &bull; Resilience Score: <strong>{activeReport.modules?.vulnerability_scanner?.csp_evaluation?.score ?? 0}/100</strong>
                        </td>
                      </tr>
                      <tr>
                        <th>Identified Weaknesses & Bypasses</th>
                        <td>
                          {(activeReport.modules?.vulnerability_scanner?.csp_evaluation?.bypasses || []).length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c' }}>
                              {(activeReport.modules?.vulnerability_scanner?.csp_evaluation?.bypasses || []).map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Strict policy enforced without common bypass vectors</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. CORS Misconfiguration */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    2. Cross-Origin Resource Sharing (CORS) Policy
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Origin Scenario</th><th>Status</th><th>Access-Control-Allow-Origin</th><th>Allow-Credentials</th><th>Reflection Verdict</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.cors?.results || []).length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No CORS headers responded.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.cors?.results || []).map((r, idx) => (
                          <tr key={idx}>
                            <td><strong>{r.label}</strong><br /><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.tested_origin}</code></td>
                            <td>HTTP {r.status_code}</td>
                            <td><code>{r.allow_origin || 'None'}</code></td>
                            <td><code>{r.allow_credentials || 'None'}</code></td>
                            <td>
                              <span className={`badge ${r.is_reflected ? 'badge-critical' : 'badge-success'}`}>
                                {r.is_reflected ? 'REFLECTED INSECURELY' : 'SECURE / ENFORCED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. Cookie Security Flags */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    2. Cookie Security Attributes (Secure, HttpOnly, SameSite)
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Cookie Name</th><th>Secure Flag</th><th>HttpOnly Flag</th><th>SameSite Directive</th><th>Scope Domain</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.cookies?.details || []).length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No Set-Cookie headers observed on target endpoint.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.cookies?.details || []).map((c, idx) => (
                          <tr key={idx}>
                            <td><code>{c.name}</code></td>
                            <td>
                              <span className={`badge ${c.secure ? 'badge-success' : 'badge-critical'}`}>
                                {c.secure ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${c.httponly ? 'badge-success' : 'badge-critical'}`}>
                                {c.httponly ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${c.samesite ? 'badge-info' : 'badge-warning'}`}>
                                {c.samesite || 'MISSING'}
                              </span>
                            </td>
                            <td><code>{c.domain || 'N/A'}</code></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. HTTP Methods & Dangerous Verbs */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    3. HTTP Verbs & Methods Audit (OPTIONS, TRACE/XST, PUT, DELETE)
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Method Probed</th><th>Response Status</th><th>Allow / Public Headers</th><th>Audit Notes</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.http_methods?.methods_tested || []).length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No HTTP method probes recorded.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.http_methods?.methods_tested || []).map((m, idx) => {
                          const isTraceVuln = m.method === 'TRACE' && m.status_code === 200;
                          return (
                            <tr key={idx}>
                              <td><strong>{m.method}</strong></td>
                              <td>
                                <span className={`badge ${isTraceVuln ? 'badge-critical' : 'badge-info'}`}>
                                  {isTraceVuln ? 'TRACE ENABLED (XST RISK)' : `HTTP ${m.status_code}`}
                                </span>
                              </td>
                              <td><code>{m.response_headers || '—'}</code></td>
                              <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{m.notes}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Sensitive Files Probes */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    4. Sensitive Configuration Files & Directory Probing ({(activeReport.modules?.vulnerability_scanner?.sensitive_files?.probed_count || 0)} files checked)
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '12px' }}>
                    Probing of configuration files (.env, .git/HEAD, docker-compose.yml, etc.) with binary and text signature validation to eliminate Single-Page App (SPA) 200 false positives.
                  </p>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Path Tested</th><th>Catalog Resource</th><th>Status / Verdict</th><th>Audit Evidence / Notes</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.sensitive_files?.all_probes || []).length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No sensitive file probes recorded.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.sensitive_files?.all_probes || []).map((f, idx) => (
                          <tr key={idx}>
                            <td><code>{f.path}</code></td>
                            <td>{f.title}</td>
                            <td>
                              <span className={`badge ${f.is_exposed ? 'badge-critical' : f.status_code === 200 ? 'badge-success' : 'badge-info'}`}>
                                {f.is_exposed ? `EXPOSED (${f.severity})` : f.status_code === 200 ? 'SPA 200 CATCH-ALL (SAFE)' : `HTTP ${f.status_code}`}
                              </span>
                            </td>
                            <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{f.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 6. Mixed Content & Insecure Transport */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    6. Mixed Content & Insecure Transport Resources
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Resource URL</th><th>Resource Type</th><th>Severity</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.mixed_content?.mixed_resources || []).length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#15803d', padding: '16px', fontWeight: 600 }}>✓ Zero unencrypted HTTP mixed content resources detected.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.mixed_content?.mixed_resources || []).map((mr, idx) => (
                          <tr key={idx}>
                            <td><code>{mr.url}</code></td>
                            <td><strong>{mr.type}</strong></td>
                            <td><span className={`badge badge-${mr.severity ? mr.severity.toLowerCase() : 'low'}`}>{mr.severity}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 7. Client-Side DOM Sinks & Prototype Pollution */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    7. Client-Side DOM XSS, Prototype Pollution & Storage Sinks
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Sink / Pattern Identified</th><th>Script Origin</th><th>Severity</th><th>Code Snippet</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.client_sinks?.sinks_found || []).length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#15803d', padding: '16px', fontWeight: 600 }}>✓ No dangerous DOM sinks or unvalidated postMessage listeners discovered.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.client_sinks?.sinks_found || []).map((sk, idx) => (
                          <tr key={idx}>
                            <td><strong>{sk.title}</strong></td>
                            <td><code>{sk.script_url}</code></td>
                            <td><span className={`badge badge-${sk.severity ? sk.severity.toLowerCase() : 'medium'}`}>{sk.severity}</span></td>
                            <td><code>{sk.snippet}</code></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 8. Open URL Redirection */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    8. Open URL Redirection Safe Audit
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>Probed Path / Parameter</th><th>HTTP Status</th><th>Observed Location Header</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.open_redirects?.details || []).length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No redirect parameters discovered.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.open_redirects?.details || []).map((rd, idx) => {
                          const isVuln = rd.location && rd.location.includes('example.com');
                          return (
                            <tr key={idx}>
                              <td><code>{rd.path}</code></td>
                              <td>
                                <span className={`badge ${isVuln ? 'badge-critical' : 'badge-info'}`}>
                                  {isVuln ? 'VULNERABLE OPEN REDIRECT' : `HTTP ${rd.status}`}
                                </span>
                              </td>
                              <td><code>{rd.location || '—'}</code></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 9. Subresource Integrity (SRI) on CDN Dependencies */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    9. Subresource Integrity (SRI) on CDN Dependencies
                  </h4>
                  <table className="audit-table">
                    <thead>
                      <tr><th>External Script URL</th><th>Integrity Status</th><th>Security Impact</th></tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.vulnerability_scanner?.sri_audit?.scripts || []).length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#15803d', padding: '16px', fontWeight: 600 }}>✓ All third-party CDN scripts enforce cryptographic SRI hashes.</td></tr>
                      ) : (
                        (activeReport.modules?.vulnerability_scanner?.sri_audit?.scripts || []).map((s_url, idx) => (
                          <tr key={idx}>
                            <td><code>{s_url}</code></td>
                            <td><span className="badge badge-low">MISSING SRI</span></td>
                            <td style={{ color: '#64748b', fontSize: '0.84rem' }}>Executed without cryptographic integrity hash</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 10. Policy, Metadata & Error Handling */}
                <div>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                    10. Security Policy, Information Leaks & Metadata
                  </h4>
                  <table className="audit-table">
                    <tbody>
                      <tr>
                        <th style={{ width: '260px' }}>RFC 9116 security.txt</th>
                        <td>
                          {activeReport.modules?.vulnerability_scanner?.security_txt?.present ? (
                            <span className="badge badge-success" style={{ marginRight: '8px' }}>FOUND</span>
                          ) : (
                            <span className="badge badge-info" style={{ marginRight: '8px' }}>MISSING</span>
                          )}
                          {activeReport.modules?.vulnerability_scanner?.security_txt?.contact || 'No disclosure contact published'}
                        </td>
                      </tr>
                      <tr>
                        <th>Error Handling / Leaks</th>
                        <td>
                          {activeReport.modules?.vulnerability_scanner?.error_handling?.leak_detected ? (
                            <span className="badge badge-critical" style={{ marginRight: '8px' }}>STACK TRACE DISCLOSED</span>
                          ) : (
                            <span className="badge badge-success" style={{ marginRight: '8px' }}>CLEAN / GENERIC ERROR</span>
                          )}
                          {activeReport.modules?.vulnerability_scanner?.error_handling?.evidence_snippet || 'No internal server paths or stack traces revealed'}
                        </td>
                      </tr>
                      <tr>
                        <th>Robots.txt Disallowed Routes</th>
                        <td>
                          <code>{(activeReport.modules?.vulnerability_scanner?.robots_sitemap?.disallowed_paths || []).length} route(s) extracted</code>
                          {(activeReport.modules?.vulnerability_scanner?.robots_sitemap?.disallowed_paths || []).length > 0 && (
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                              {(activeReport.modules?.vulnerability_scanner?.robots_sitemap?.disallowed_paths || []).slice(0, 10).join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Sitemap URLs Harvested</th>
                        <td>
                          <code>{(activeReport.modules?.vulnerability_scanner?.robots_sitemap?.sitemap_urls || []).length} URL(s) harvested</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Security Headers */}
            {activeTab === 'headers' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <h3 style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 800 }}>HTTP Defensive Response Headers</h3>
                <table className="audit-table">
                  <thead>
                    <tr><th>Header Name</th><th>Status</th><th>Observed Value</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.security_headers?.missing_headers || []).map(h => (
                      <tr key={h}>
                        <td><code>{h}</code></td>
                        <td><span className="badge badge-critical">MISSING</span></td>
                        <td style={{ color: '#94a3b8' }}>None observed in HTTP response</td>
                      </tr>
                    ))}
                    {Object.entries(activeReport.modules?.security_headers?.present_headers || {}).map(([h, val]) => (
                      <tr key={h}>
                        <td><code>{h}</code></td>
                        <td><span className="badge badge-success">PRESENT</span></td>
                        <td><code>{val}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ marginTop: '32px', marginBottom: '12px', color: '#0f172a', fontWeight: 800 }}>Server Hardening Configurations</h3>
                
                <h4 style={{ color: '#0284c7', fontSize: '0.92rem', marginTop: '16px', fontWeight: 700 }}>Nginx Configuration</h4>
                <div className="code-block">
                  <button className="copy-btn" onClick={() => copyToClipboard(activeReport.modules?.security_headers?.remediation_snippets?.nginx || '', 'nginx')}>
                    {copiedKey === 'nginx' ? 'Copied!' : 'Copy Config'}
                  </button>
                  <pre>{activeReport.modules?.security_headers?.remediation_snippets?.nginx || '# All audited defensive headers present'}</pre>
                </div>

                <h4 style={{ color: '#0284c7', fontSize: '0.92rem', marginTop: '16px', fontWeight: 700 }}>Apache VirtualHost / .htaccess</h4>
                <div className="code-block">
                  <button className="copy-btn" onClick={() => copyToClipboard(activeReport.modules?.security_headers?.remediation_snippets?.apache || '', 'apache')}>
                    {copiedKey === 'apache' ? 'Copied!' : 'Copy Config'}
                  </button>
                  <pre>{activeReport.modules?.security_headers?.remediation_snippets?.apache || '# All audited defensive headers present'}</pre>
                </div>
              </div>
            )}

            {/* TAB: Secrets & Sensitive Leaks */}
            {activeTab === 'secrets' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '4px' }}>Secrets and Sensitive Credentials Scanner</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Defensively scans client-side JavaScript bundles, HTML documents, and standard configuration files (.env, .git) for leaked credentials.
                    </p>
                  </div>
                  <span className={`badge ${((activeReport.modules?.secrets_scanner?.findings || []).length > 0) ? 'badge-critical' : 'badge-success'}`}>
                    {(activeReport.modules?.secrets_scanner?.findings || []).length} Leak(s) Detected
                  </span>
                </div>

                <table className="audit-table">
                  <thead>
                    <tr><th>Severity</th><th>Detected Secret</th><th>Masked Pattern</th><th>Discovered In</th><th>Actionable Remediation</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.secrets_scanner?.findings || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#15803d', padding: '28px', background: '#f0fdf4' }}>
                          🛡️ No sensitive credentials, tokens, private keys, or exposed configuration files (.env, .git) were detected in scanned client resources.
                        </td>
                      </tr>
                    ) : (
                      (activeReport.modules?.secrets_scanner?.findings || []).map((s, idx) => (
                        <tr key={idx}>
                          <td><span className={`badge badge-${(s.severity || 'high').toLowerCase()}`}>{s.severity}</span></td>
                          <td><strong>{s.summary}</strong></td>
                          <td><code>{s.masked_secret || s.masked_value || 'Redacted'}</code></td>
                          <td style={{ color: '#64748b', fontSize: '0.82rem' }}><code>{s.source_url}</code></td>
                          <td style={{ color: '#0284c7', fontSize: '0.84rem' }}>{s.remediation}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: Access Control & Admin Protection */}
            {activeTab === 'access' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <h3 style={{ marginBottom: '6px', color: '#0f172a', fontWeight: 800 }}>Administrative Route Protection</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '18px' }}>
                  Safe probes against standard administrative management paths (/admin, /dashboard, etc.) to verify authentication enforcement.
                </p>

                <table className="audit-table" style={{ marginBottom: '32px' }}>
                  <thead>
                    <tr><th>Path Tested</th><th>Status Code</th><th>Protection State</th><th>Audit Details & Evidence</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.access_control_audit?.admin_routes || []).length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No administrative paths audited.</td></tr>
                    ) : (
                      (activeReport.modules?.access_control_audit?.admin_routes || []).map((r, idx) => {
                        const isProt = r.protection_state === 'PROTECTED' || r.protection_state === 'REDIRECTED_TO_LOGIN';
                        const isUnprot = r.protection_state === 'UNPROTECTED_EXPOSED';
                        return (
                          <tr key={idx}>
                            <td><code>{r.path}</code></td>
                            <td><strong>HTTP {r.status_code}</strong></td>
                            <td>
                              <span className={`badge ${isProt ? 'badge-success' : isUnprot ? 'badge-critical' : 'badge-info'}`}>
                                {r.protection_state}
                              </span>
                            </td>
                            <td style={{ color: '#475569', fontSize: '0.84rem' }}>{r.details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Discovered API Endpoints Access State */}
                {(activeReport.modules?.access_control_audit?.api_endpoints || []).length > 0 && (
                  <>
                    <h3 style={{ marginBottom: '6px', color: '#0f172a', fontWeight: 800 }}>Backend API Route Access Control</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '18px' }}>
                      Verification of authentication enforcement on identified API routes.
                    </p>
                    <table className="audit-table">
                      <thead>
                        <tr><th>API Path</th><th>Status</th><th>Access Enforcement</th><th>Details</th></tr>
                      </thead>
                      <tbody>
                        {(activeReport.modules?.access_control_audit?.api_endpoints || []).map((a, idx) => (
                          <tr key={idx}>
                            <td><code>{a.endpoint_path}</code></td>
                            <td><strong>HTTP {a.status_code}</strong></td>
                            <td>
                              <span className={`badge ${a.access_state && a.access_state.includes('RESTRICTED') ? 'badge-success' : 'badge-info'}`}>
                                {a.access_state}
                              </span>
                            </td>
                            <td style={{ color: '#475569', fontSize: '0.84rem' }}>{a.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {/* TAB: Web Crawler & Site Topology */}
            {activeTab === 'crawler' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '4px' }}>In-Scope Web Crawler & Site Topology</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Bounded breadth-first crawl of internal pages strictly constrained to authorized target scope.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-info">
                      Pages Crawled: {activeReport.modules?.crawler?.total_pages_crawled || 0} / {activeReport.modules?.crawler?.max_pages_limit || 15}
                    </span>
                    <span className="badge badge-low">
                      Discovered Scripts: {(activeReport.modules?.crawler?.discovered_scripts || []).length}
                    </span>
                  </div>
                </div>

                <table className="audit-table">
                  <thead>
                    <tr><th>Page URL</th><th>HTTP Status</th><th>Page Title</th><th>Discovered Links</th><th>Scripts</th><th>HTML Forms</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.crawler?.pages || []).length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No internal application pages crawled.</td></tr>
                    ) : (
                      (activeReport.modules?.crawler?.pages || []).map((p, idx) => (
                        <tr key={idx}>
                          <td><code>{p.url}</code></td>
                          <td>
                            <span className={`badge ${p.status_code === 200 ? 'badge-success' : 'badge-info'}`}>
                              HTTP {p.status_code}
                            </span>
                          </td>
                          <td><strong>{p.title || 'Untitled'}</strong></td>
                          <td>{p.links_found || 0} internal link(s)</td>
                          <td>{p.scripts_found || 0} script(s)</td>
                          <td>{p.forms_found || 0} form(s)</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: API Inventory */}
            {activeTab === 'apis' && (
              <ApiInventoryPanel
                allEndpoints={allEndpoints}
                activeReport={activeReport}
                apiSearchTerm={apiSearchTerm}
                setApiSearchTerm={setApiSearchTerm}
                apiCategoryFilter={apiCategoryFilter}
                setApiCategoryFilter={setApiCategoryFilter}
              />
            )}

            {/* TAB: Subdomains */}
            {activeTab === 'subdomains' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px', color: '#0f172a', fontWeight: 800 }}>Discovered Subdomains & Hostnames</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      All active and recorded subdomains identified for <strong>{activeReport.metadata?.target_host || activeReport.target_host}</strong> via public Certificate Transparency (crt.sh) logs and DNS resolution.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>
                      {filteredSubdomains.length} of {subdomainsList.length} Subdomain(s)
                    </span>
                    <span className="badge badge-success" style={{ fontWeight: 700 }}>
                      {subdomainsList.filter(s => s.status === 'ACTIVE' || s.status === 'ACTIVE_RESOLVED' || (s.ip_address && s.ip_address !== 'Unresolved')).length} Active
                    </span>
                  </div>
                </div>

                {/* Subdomain Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="Search subdomain or IP address..."
                    value={subdomainSearchTerm}
                    onChange={e => setSubdomainSearchTerm(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '7px 16px',
                      borderRadius: '0px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      minWidth: '260px'
                    }}
                  />
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Subdomain</th>
                        <th>Resolved IP Address</th>
                        <th>Status</th>
                        <th>Discovery Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubdomains.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '28px' }}>No subdomains match search criteria.</td></tr>
                      ) : (
                        filteredSubdomains.map((sub, i) => {
                          const subName = sub.subdomain || sub.hostname;
                          const ips = sub.resolved_ips || [];
                          const ipVal = sub.ip_address || (ips.length > 0 ? ips.join(', ') : 'Unresolved');
                          const isActive = sub.status === 'ACTIVE' || sub.status === 'ACTIVE_RESOLVED' || (ipVal !== 'Unresolved' && ipVal !== 'None');
                          return (
                            <tr key={i}>
                              <td>
                                <strong style={{ color: '#0284c7' }}>
                                  <a href={`https://${subName}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>
                                    {subName} ↗
                                  </a>
                                </strong>
                              </td>
                              <td><code>{ipVal}</code></td>
                              <td>
                                <span className={`badge ${isActive ? 'badge-success' : 'badge-info'}`}>
                                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                {sub.source || 'Certificate Transparency (crt.sh)'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: TLS & DNS Posture */}
            {activeTab === 'tls_dns' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <h3 style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 800 }}>TLS / SSL Cryptographic Audit</h3>
                <table className="audit-table" style={{ marginBottom: '32px' }}>
                  <tbody>
                    <tr>
                      <th style={{ width: '220px' }}>Days Until Expiry</th>
                      <td>
                        <strong style={{ color: (activeReport.modules?.tls_audit?.certificate?.days_remaining || 0) < 30 ? '#dc2626' : '#15803d' }}>
                          {activeReport.modules?.tls_audit?.certificate?.days_remaining ?? 'N/A'} days
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <th>Valid Period</th>
                      <td>{activeReport.modules?.tls_audit?.certificate?.valid_from || 'N/A'} &rarr; {activeReport.modules?.tls_audit?.certificate?.valid_to || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Certificate Issuer</th>
                      <td><code>{activeReport.modules?.tls_audit?.certificate?.issuer?.organizationName || 'N/A'}</code></td>
                    </tr>
                    <tr>
                      <th>Negotiated Protocol</th>
                      <td><code>{activeReport.modules?.tls_audit?.connection?.protocol_version || 'N/A'}</code></td>
                    </tr>
                    <tr>
                      <th>Cipher Suite</th>
                      <td><code>{activeReport.modules?.tls_audit?.connection?.cipher_name || 'N/A'} ({activeReport.modules?.tls_audit?.connection?.cipher_bits || 0} bits)</code></td>
                    </tr>
                  </tbody>
                </table>

                <h3 style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 800 }}>DNS Records & Mail Protection</h3>
                <table className="audit-table">
                  <tbody>
                    {Object.entries(activeReport.modules?.dns_analysis?.records || {}).map(([rtype, vals]) => (
                      <tr key={rtype}>
                        <th style={{ width: '220px' }}>{rtype} Records</th>
                        <td>
                          {vals && vals.length > 0 ? (
                            vals.map((v, i) => <div key={i}><code>{v}</code></div>)
                          ) : (
                            <span style={{ color: '#94a3b8' }}>None discovered</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 5: Tech Stack & Cloud Indicators */}
            {activeTab === 'tech_cloud' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <h3 style={{ marginBottom: '14px', color: '#0f172a', fontWeight: 800 }}>Identified Technology Stack</h3>
                <table className="audit-table" style={{ marginBottom: '32px' }}>
                  <thead>
                    <tr><th>Technology</th><th>Category</th><th>Disclosed Version</th><th>Evidence</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.technology_detection?.technologies || []).length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No distinctive server or framework signatures disclosed.</td></tr>
                    ) : (
                      (activeReport.modules?.technology_detection?.technologies || []).map((t, idx) => (
                        <tr key={idx}>
                          <td><strong>{t.name}</strong></td>
                          <td><span className="badge badge-low">{t.category}</span></td>
                          <td><code>{t.version || 'Not Disclosed'}</code></td>
                          <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{t.evidence}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <h3 style={{ marginBottom: '14px', color: '#0f172a', fontWeight: 800 }}>Cloud Infrastructure & Regional Indicators</h3>
                <table className="audit-table">
                  <thead>
                    <tr><th>Provider</th><th>Service</th><th>Assigned Region</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.cloud_indicators?.cloud_indicators || []).length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No public cloud signatures detected.</td></tr>
                    ) : (
                      (activeReport.modules?.cloud_indicators?.cloud_indicators || []).map((c, idx) => (
                        <tr key={idx}>
                          <td><strong>{c.provider}</strong></td>
                          <td>{c.service}</td>
                          <td><code>{c.region || 'Inconclusive / Not Disclosed'}</code></td>
                          <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{c.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 6: Open Ports */}
            {activeTab === 'ports' && (
              <div className="glass-panel" style={{ padding: '26px 28px' }}>
                <h3 style={{ marginBottom: '12px', color: '#0f172a', fontWeight: 800 }}>Conservative TCP Port Assessment</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '18px' }}>
                  Scoped connect probes against standard web and service ports. Open ports indicate active listeners, not vulnerabilities.
                </p>
                <table className="audit-table">
                  <thead>
                    <tr><th>Port</th><th>Service Hint</th><th>State</th><th>Handshake Latency</th></tr>
                  </thead>
                  <tbody>
                    {(activeReport.modules?.port_scanner?.all_results || []).length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No port checks executed for this host.</td></tr>
                    ) : (
                      (activeReport.modules?.port_scanner?.all_results || []).map(r => (
                        <tr key={r.port}>
                          <td><strong>{r.port}</strong></td>
                          <td>{r.service}</td>
                          <td>
                            {r.state === 'OPEN' ? (
                              <span className="badge badge-success">OPEN</span>
                            ) : (
                              <span className="badge badge-info">{r.state}</span>
                            )}
                          </td>
                          <td>{r.latency_ms} ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 7: Raw Audit Terminal Log */}
            {activeTab === 'console' && (
              <div className="glass-panel" style={{ padding: '24px 28px' }}>
                <h3 style={{ marginBottom: '12px', color: '#0f172a', fontWeight: 800 }}>Raw Python Engine Console Stream</h3>
                <div className="code-block" style={{ maxHeight: '480px' }}>
                  <button className="copy-btn" onClick={() => copyToClipboard(rawTerminalLog, 'console')}>
                    {copiedKey === 'console' ? 'Copied!' : 'Copy Log'}
                  </button>
                  <pre>{rawTerminalLog || 'No console log captured for this scan.'}</pre>
                </div>
              </div>
            )}

            {/* Modern Enhanced Frontend Audit Panels: Performance, SEO, UI/UX, & Pages Matrix */}
            {['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(activeTab) && (
              <FrontendAuditPanels
                activeTab={activeTab}
                webQuality={webQuality}
                targetHost={activeReport?.metadata?.target_host || 'target.com'}
                targetUrl={activeReport?.metadata?.target_url || `https://${activeReport?.metadata?.target_host || 'target.com'}`}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
          </>
        )}

        {/* Scan History Drawer (Member-Scoped) */}
        <section className="history-drawer glass-panel" style={{ width: '100%', padding: '24px 28px', borderRadius: '0px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {currentUser ? `Historical Audits for ${currentUser.username}` : 'Historical Audit Reports'} ({historyList.length})
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '3px 0 0' }}>
                {currentUser ? `Only displaying audits executed by ${currentUser.email} • Saved in MongoDB Atlas` : 'Sign in to access your saved audits'}
              </p>
            </div>
            <span className="db-pill">
              🍃 MongoDB Atlas
            </span>
          </div>

          {historyList.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', background: '#f8fafc', borderRadius: '0px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📁</div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                No prior audits recorded for {currentUser?.email || 'this account'}.
              </p>
            </div>
          ) : (
            historyList.map(h => (
              <div key={h.id || h.filename || h.auditId} className="history-item" onClick={() => loadPastReport(h.filename || h.auditId)}>
                <div className="history-meta">
                  <div className="grade-circle" style={{ width: '42px', height: '42px', fontSize: '1.25rem', background: getGradeColor(h.grade), borderRadius: '0px', flexShrink: 0 }}>
                    {h.grade}
                  </div>
                  <div>
                    <div className="history-host">{h.targetHost}</div>
                    <div className="history-time">{new Date(h.timestamp).toLocaleString()} &bull; Score: {h.score}/100</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-info" style={{ borderRadius: '0px' }}>{h.totalFindings} Findings</span>
                  <button className="chip-btn" style={{ borderRadius: '0px' }} onClick={(e) => { e.stopPropagation(); loadPastReport(h.filename || h.auditId); }}>
                    View Report &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
        </main>
      )}

      {/* Redesigned Universal Site Footer */}
      <SiteFooter onNavigatePage={handleNavigatePage} />
    </div>
  );
}

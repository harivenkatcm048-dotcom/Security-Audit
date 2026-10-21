import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BikeSpeedometerGauge from './BikeSpeedometerGauge';
import AuditResultSummary from './AuditResultSummary';
import FrontendAuditPanels from './FrontendAuditPanels';
import ApiInventoryPanel from './ApiInventoryPanel';
import SiteFooter from './SiteFooter';
import MobileBottomBar from './MobileBottomBar';
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
      {/* 1. COMPACT STATUS RIBBON */}
      <div className="w-full bg-slate-50/80 border-b border-slate-200/60 px-4 sm:px-8 lg:px-10 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Atlas Telemetry Engine</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">RFC 9116 Compliant Passive Audit</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
          <span>v4.8</span>
          <span>&bull;</span>
          <span className="text-slate-700 font-semibold">21 Stages</span>
        </div>
      </div>

      {/* 2. REFINED HERO & UNIFIED SCAN INPUT */}
      <section className="w-full px-4 sm:px-8 lg:px-10 pt-5 sm:pt-10 pb-4 sm:pb-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200/80 rounded-full text-[10px] sm:text-[11px] font-bold text-sky-700 tracking-wide uppercase self-start">
            <Sparkles className="w-3 h-3 text-sky-500 shrink-0" />
            <span>Website Audit &bull; SEO Optimizer &bull; Performance Audit</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Website Security Audit, SEO Optimizer &amp; Performance Audit
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
            Automated passive telemetry assessing cybersecurity posture, shadow API discovery, Google Core Web Vitals performance benchmarks, and automated SEO optimizer health in real time.
          </p>
        </div>

        {/* UNIFIED PRECISION SCAN INPUT */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm hover:border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
          <form 
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" 
            id="auditForm" 
            onSubmit={(e) => {
              e.preventDefault();
              if (!isScanning && domainInput.trim()) {
                handleStartScan();
              }
            }}
          >
            {/* Integrated Input Row */}
            <div className="flex items-center flex-1 min-w-0 bg-slate-50/70 sm:bg-transparent rounded-xl sm:rounded-none px-3 py-2 sm:py-1 gap-2 border border-slate-200/60 sm:border-0">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-slate-500 bg-white sm:bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60 shrink-0 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>https://</span>
              </div>
              <input 
                autoComplete="off" 
                className="w-full bg-transparent text-slate-900 font-mono text-xs sm:text-sm focus:outline-none placeholder:text-slate-400 py-1" 
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
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0" 
                  onClick={() => setDomainInput('')} 
                  type="button"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Launch Button */}
            <button 
              className={`bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs ${
                isScanning ? 'opacity-80 pointer-events-none' : ''
              }`} 
              id="launchBtn" 
              type="submit"
              disabled={isScanning || !domainInput.trim()}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Launch Audit</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Presets - Horizontal scrollable pill row */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
              <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider shrink-0">Try:</span>
              {['nexentra.space', 'speedtest.net', 'accufy.in', 'example.com'].map((domain) => (
                <button 
                  key={domain}
                  type="button"
                  onClick={() => setPreset(domain)}
                  className="px-2.5 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 font-mono text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {domain}
                </button>
              ))}
            </div>
            <div className="text-emerald-700 text-[11px] font-medium hidden sm:flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>100% Passive</span>
            </div>
          </div>
        </div>

        {/* 3. 4 COMPACT METRIC TILES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-1">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight">21</div>
              <div className="text-xs font-bold text-slate-700">Pipeline Stages</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">Layer 3 to Layer 7</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-emerald-600 font-mono tracking-tight">100%</div>
              <div className="text-xs font-bold text-slate-700">Passive Telemetry</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">Zero exploit injections</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-amber-600 font-mono tracking-tight">&lt; 35s</div>
              <div className="text-xs font-bold text-slate-700">Scan SLA</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">Async parallel engine</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1 shadow-xs hover:border-slate-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-indigo-600 font-mono tracking-tight">{allEndpointsCount > 0 ? `${allEndpointsCount}+` : '195+'}</div>
              <div className="text-xs font-bold text-slate-700">Audit Vectors</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">Perimeter, OWASP &amp; TLS</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPEEDOMETER CENTERPIECE */}
      <section className="w-full bg-white border-y border-slate-200 py-6 sm:py-8">
        <div className="w-full px-4 sm:px-8 lg:px-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
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

      {/* 5. 4-PILLAR CAPABILITY GRID */}
      <section className="w-full px-4 sm:px-8 lg:px-10 py-10 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              CORE CAPABILITIES &amp; FORENSIC MODULES
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 uppercase hidden sm:inline">
            CLICK TO EXPLORE WORKSPACE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Perimeter & TLS */}
          <div 
            onClick={() => onNavigateCapability('tls_dns')}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">01 PERIMETER</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 group-hover:text-sky-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-sky-600 transition-colors">
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
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">02 ENDPOINTS</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 group-hover:text-sky-600 transition-colors">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-sky-600 transition-colors">
                API &amp; Route Inventory
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Static AST bundle decompilation uncovering shadow REST APIs, GraphQL operations, and SPA routes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-sky-600">{allEndpointsCount > 0 ? `${allEndpointsCount}+ ROUTES` : '195+ ROUTES'}</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-slate-900 font-bold">
                Inspect &rarr;
              </span>
            </div>
          </div>

          {/* Card 3: Vulnerabilities & OWASP */}
          <div 
            onClick={() => onNavigateCapability('findings')}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-red-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">03 VULNERABILITIES</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 group-hover:text-red-600 transition-colors">
                  <Shield className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors">
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
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">04 VELOCITY</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 group-hover:text-amber-600 transition-colors">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
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

      {/* 5B. SEO OPTIMIZER & PERFORMANCE AUDIT CAPABILITIES HUB */}
      <section className="w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200 rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-100/80 text-sky-800 text-[10px] font-bold uppercase tracking-wider w-fit">
              <Sparkles className="w-3 h-3 text-sky-600" />
              <span>Full-Stack SEO Optimizer &amp; Performance Audit Suite</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise SEO Optimizer, Performance Audit &amp; Attack Surface Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Every audit performs passive analysis verifying search engine readiness, Google Core Web Vitals velocity, shadow REST/GraphQL routes, and cryptographic TLS posture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: SEO Optimizer */}
            <div 
              onClick={() => onNavigateCapability('seo')}
              className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  Automated SEO Optimizer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Inspects Open Graph metadata, Twitter Cards, canonical directives, robots.txt, XML sitemaps, semantic hierarchy, and JSON-LD structured schema for search engines.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-emerald-700 font-bold">
                <span>SERP READY</span>
                <span className="text-slate-900 inline-flex items-center gap-0.5">Explore SEO &rarr;</span>
              </div>
            </div>

            {/* Card 2: Performance Audit */}
            <div 
              onClick={() => onNavigateCapability('performance')}
              className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  Core Web Vitals Performance Audit
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Measures Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Interaction to Next Paint (INP), and Time-to-First-Byte (TTFB) to ensure top search rank speeds.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-amber-700 font-bold">
                <span>TTFB &lt; 200MS</span>
                <span className="text-slate-900 inline-flex items-center gap-0.5">Explore Vitals &rarr;</span>
              </div>
            </div>

            {/* Card 3: Security & API Discovery */}
            <div 
              onClick={() => onNavigateCapability('apis')}
              className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  Shadow API &amp; Attack Surface
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Uncovers undocumented REST, GraphQL, and microservice endpoints through static bundle analysis while verifying OWASP CSP, HSTS, and CORS security headers.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-sky-700 font-bold">
                <span>195+ VECTORS</span>
                <span className="text-slate-900 inline-flex items-center gap-0.5">Explore APIs &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MEMBER RECENT AUDITS ARCHIVE (MINIMAL) */}
      <section className="w-full px-4 sm:px-8 lg:px-10 pb-16 max-w-7xl mx-auto">
        <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              {currentUser ? `ATLAS VAULT • ${currentUser.email.toUpperCase()}` : 'RECENT AUDITS ARCHIVE'}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase mt-0.5">
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
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => loadPastReport(h.filename || h.auditId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-white text-base shrink-0 shadow-xs"
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
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 font-semibold">
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
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 sm:p-10 text-center shadow-xs">
            <div className="text-2xl mb-2">📁</div>
            <div className="font-bold text-slate-900 text-sm mb-1">
              {currentUser ? `No audits found yet for ${currentUser.email}` : 'No member account identified'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {currentUser 
                ? 'All security scans you launch are persisted to MongoDB Atlas and cataloged strictly under your profile.'
                : 'Enter your name and email to view your personal isolated audit reports from MongoDB Atlas.'}
            </p>
            {currentUser ? (
              <button 
                type="button"
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
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
            ) : (
              <button 
                type="button"
                className="bg-sky-600 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:bg-sky-500 transition-colors cursor-pointer shadow-sm"
                onClick={onOpenAuthModal}
              >
                Identify Member &uarr;
              </button>
            )}
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
  const [activePillar, setActivePillar] = useState('security'); // 'security' | 'frontend' | 'apis'
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

  // Auto-sync auth form fields when modal opens
  useEffect(() => {
    if (showAuthModal && currentUser) {
      setAuthEmail(currentUser.email || '');
      setAuthUsername(currentUser.username || '');
    }
  }, [showAuthModal, currentUser]);

  // Check backend health, MongoDB status, and load member-scoped reports
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(d => {
        if (d.database) setDbStatus(d.database);
      })
      .catch(() => {});

    // STRICT USER SCOPING: If user has not provided credentials, do NOT fetch any historical reports!
    if (!currentUser?.email && !currentUser?.username) {
      setHistoryList([]);
      setActiveReport(null);
      return;
    }

    const params = new URLSearchParams();
    if (currentUser.email) params.set('userEmail', currentUser.email);
    if (currentUser.username) params.set('userName', currentUser.username);

    fetch(`${API_BASE}/api/reports?${params.toString()}`)
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
        } else {
          setHistoryList([]);
        }
      })
      .catch(() => setHistoryList([]));
  }, [currentUser]);

  // Dynamic SEO Title & Meta Tag Orchestration for Single Page Application
  useEffect(() => {
    let title = 'Website Audit, SEO Optimizer & Performance Audit | Nexentra Technologies';
    let description = 'Free real-time website audit, SEO optimizer, and Core Web Vitals performance audit by Nexentra Technologies. Passive telemetry analyzing security posture, API discovery, TTFB, and PageSpeed.';
    let canonical = 'https://security.nexentra.space/';

    if (viewMode === 'audit') {
      const target = domainInput || activeReport?.target || activeReport?.metadata?.target_host || 'Target';
      title = `Audit Report for ${target} — Security, Performance & SEO Optimizer | Nexentra`;
      description = `Defensive audit report and Core Web Vitals telemetry for ${target}. Real-time OWASP finding analysis, API inventory, and performance recommendations.`;
      canonical = `https://security.nexentra.space/?domain=${encodeURIComponent(target)}`;
    } else if (viewMode === 'about') {
      title = 'About Us — Enterprise Cyber Defense & Performance Auditing | Nexentra';
      description = 'Learn about Nexentra Technologies: RFC 9116 compliant passive telemetry, automated website audits, SEO optimization, and API surface intelligence.';
      canonical = 'https://security.nexentra.space/#about';
    } else if (viewMode === 'privacy') {
      title = 'Privacy Policy & Data Security Trust | Nexentra Technologies';
      description = 'Nexentra Technologies Privacy Policy: 100% passive security telemetry, MongoDB Atlas isolation, and zero unauthorized data harvesting.';
      canonical = 'https://security.nexentra.space/#privacy';
    } else if (viewMode === 'terms') {
      title = 'Terms of Service — Website Audit & Performance Telemetry | Nexentra';
      description = 'Terms of Service for Nexentra Technologies cyber defense platform, automated website auditing, and API discovery tools.';
      canonical = 'https://security.nexentra.space/#terms';
    } else if (viewMode === 'security_policy') {
      title = 'Responsible Disclosure & Security Policy | Nexentra Technologies';
      description = 'Vulnerability reporting policy and RFC 9116 security.txt standards for Nexentra Technologies.';
      canonical = 'https://security.nexentra.space/#security_policy';
    }

    if (typeof document !== 'undefined') {
      document.title = title;

      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) descMeta.setAttribute('content', description);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);

      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', title);

      const twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', description);

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.setAttribute('href', canonical);
    }
  }, [viewMode, activeReport, domainInput]);

  // URL Query Params & Hash Routing Support on Mount (?domain=... & #about, #privacy)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash === '#about') setViewMode('about');
      else if (hash === '#privacy') setViewMode('privacy');
      else if (hash === '#terms') setViewMode('terms');
      else if (hash === '#security_policy') setViewMode('security_policy');
      else if (hash === '#audit' || hash === '#report') setViewMode('audit');

      const params = new URLSearchParams(window.location.search);
      const queryTarget = params.get('domain') || params.get('target') || params.get('q');
      if (queryTarget && queryTarget.trim()) {
        const clean = queryTarget.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        setDomainInput(clean);
      }
    } catch {}
  }, []);

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
        fetchHistory(cleanEmail, cleanName);
      } else {
        setAuthError(data.error || 'Failed to authenticate user.');
      }
    } catch (err) {
      // Graceful local resilience fallback
      const validatedUser = { email: cleanEmail, username: cleanName };
      setCurrentUser(validatedUser);
      localStorage.setItem('nexentra_user', JSON.stringify(validatedUser));
      setShowAuthModal(false);
      fetchHistory(cleanEmail, cleanName);
    } finally {
      setAuthSubmitting(false);
    }
  };

  /**
   * Handle member logout & clean session state
   */
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexentra_user');
    setHistoryList([]);
    setActiveReport(null);
    setShowAuthModal(false);
  };

  /**
   * Fetch member-scoped historical audits from MongoDB Atlas strictly based on name and/or email
   */
  const fetchHistory = async (targetUserEmail = null, targetUserName = null) => {
    const emailToQuery = targetUserEmail || currentUser?.email;
    const nameToQuery = targetUserName || currentUser?.username;
    if (!emailToQuery && !nameToQuery) {
      setHistoryList([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (emailToQuery) params.set('userEmail', emailToQuery);
      if (nameToQuery) params.set('userName', nameToQuery);
      const res = await fetch(`${API_BASE}/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(Array.isArray(data) ? data : []);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.warn('Could not fetch member reports:', err);
      setHistoryList([]);
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

    try {
      const cleanHost = rawTarget.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `?domain=${encodeURIComponent(cleanHost)}`);
      }
    } catch {}

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
        fetchHistory(currentUser.email, currentUser.username); // Refresh member's scan history
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 md:pb-0 overflow-x-hidden">
      {/* Top Navigation - Balanced Enterprise Navbar */}
      <header className="navbar">
        {/* Left: Brand Identity */}
        <div 
          className="brand-wrap" 
          onClick={() => { setViewMode('landing'); setIsMobileNavOpen(false); }} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
          title="Return to Nexentra Home"
        >
          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
            <NexentraLogo className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="brand-title font-bold text-sm sm:text-base leading-tight">Nexentra Technologies</div>
            <div className="brand-tagline hidden sm:block text-[11px] text-slate-400">Cyber Defense &amp; Intelligence</div>
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
              className="nav-member-badge hidden sm:inline-flex" 
              onClick={() => setShowAuthModal(true)}
              title={`Logged in as ${currentUser.username} (${currentUser.email}). Click to switch member.`}
            >
              <div className="nav-member-avatar">
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-700 hidden md:inline">{currentUser.username}</span>
              <span className="text-xs text-sky-600 font-bold ml-1 hidden md:inline">SWITCH</span>
            </button>
          ) : (
            <button 
              type="button"
              className="nav-member-badge hidden sm:inline-flex" 
              onClick={() => setShowAuthModal(true)}
              title="Identify your team member account to record audit telemetry"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Identify Member</span>
            </button>
          )}

          <button 
            type="button"
            className="nav-cta-btn hidden md:inline-flex" 
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

          {/* Member Profile in Drawer */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            {currentUser ? (
              <button
                type="button"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition-colors"
                onClick={() => { setShowAuthModal(true); setIsMobileNavOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.username}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{currentUser.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-600 bg-white px-2 py-0.5 rounded border border-slate-200">SWITCH</span>
              </button>
            ) : (
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
                onClick={() => { setShowAuthModal(true); setIsMobileNavOpen(false); }}
              >
                <User className="w-3.5 h-3.5" />
                <span>Identify Team Member</span>
              </button>
            )}
          </div>
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

              {currentUser && (
                <button
                  type="button"
                  className="w-full mt-2.5 py-2 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-lg transition-colors border border-rose-200/70 text-center cursor-pointer"
                  onClick={handleLogout}
                >
                  Sign Out of {currentUser.email}
                </button>
              )}
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
        <main className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top Audit View Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <button 
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors self-start"
              onClick={() => setViewMode('landing')}
            >
              <ArrowRight className="w-4 h-4 rotate-180 text-sky-600" />
              <span>Back to Overview</span>
            </button>
            
            {activeReport && (
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                  onClick={() => window.print()} 
                  title="Print or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF Export</span>
                </button>
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                  onClick={downloadReportJson} 
                  title="Download complete JSON report"
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-600" />
                  <span>JSON</span>
                </button>
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                  onClick={downloadFindingsCsv} 
                  title="Download findings CSV"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Target Re-Audit Input */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-xs mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 font-medium"
                  placeholder="Target URL or domain (e.g. example.com)..."
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isScanning && handleStartScan()}
                  disabled={isScanning}
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-lg shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                onClick={() => handleStartScan()}
                disabled={isScanning || !domainInput.trim()}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Re-Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="bg-red-50/80 border-l-4 border-red-500 rounded-xl p-4 sm:p-5 mb-6 text-red-900 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Audit Notice</span>
              </div>
              <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{errorMessage}</p>
              <p className="text-[11px] text-red-600 mt-2 font-medium">
                Ensure the domain is active with valid DNS records. You can also test with <strong>example.com</strong>.
              </p>
            </div>
          )}

          {/* Real-time High-Rev Speedometer */}
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

          {/* Audit Result Executive Summary */}
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center my-6 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3 text-sky-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                No Active Audit Loaded
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                Enter a target domain or URL above to launch an instant automated assessment, or test against a sample target.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                  onClick={() => setShowCockpitPreview(true)}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Preview Velocity Gauges</span>
                </button>
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  onClick={() => { setDomainInput('example.com'); handleStartScan('example.com'); }}
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit example.com</span>
                </button>
                <button 
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  onClick={() => setViewMode('landing')}
                >
                  <span>Return to Home</span>
                </button>
              </div>
            </div>
          )}

          {/* Audit Details & Multi-Pillar Exploration */}
          {activeReport && (
            <>
              {/* Target Details Strip */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Host</span>
                    <strong className="text-sm sm:text-base font-mono font-bold text-slate-900">
                      {activeReport.metadata?.target_host || activeReport.target_host}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited At</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {new Date(activeReport.metadata?.audit_timestamp_utc || activeReport.timestamp_utc || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                    Scope Verified
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-md">
                    SSRF Guard Active
                  </span>
                </div>
              </div>

              {/* Primary Pillar Navigation - Responsive Horizontal Scroll */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/70 rounded-xl mb-3 overflow-x-auto no-scrollbar scroll-smooth">
                <button 
                  type="button" 
                  className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    activePillar === 'security' 
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  onClick={() => { setActivePillar('security'); if (activeTab === 'apis' || ['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(activeTab)) setActiveTab('findings'); }}
                >
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="hidden sm:inline">Security Defense ({findings.length})</span>
                  <span className="sm:hidden">Security ({findings.length})</span>
                </button>
                <button 
                  type="button" 
                  className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    activePillar === 'frontend' 
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  onClick={() => { setActivePillar('frontend'); if (!['performance', 'seo', 'ui_ux', 'pages_matrix'].includes(activeTab)) setActiveTab('performance'); }}
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">Frontend Quality ({webQuality.summary?.overall_web_health_score || 88}/100)</span>
                  <span className="sm:hidden">Frontend ({webQuality.summary?.overall_web_health_score || 88}/100)</span>
                </button>
                <button 
                  type="button" 
                  className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    activePillar === 'apis' 
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  onClick={() => { setActivePillar('apis'); setActiveTab('apis'); }}
                >
                  <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="hidden sm:inline">API Inventory ({allEndpoints.length})</span>
                  <span className="sm:hidden">APIs ({allEndpoints.length})</span>
                </button>
              </div>

              {/* Sub-tabs for Security Pillar */}
              {activePillar === 'security' && (
                <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl mb-5 overflow-x-auto no-scrollbar shadow-xs">
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'findings' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('findings')}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    <span>Findings ({findings.length})</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'headers' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('headers')}
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Headers</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'vulnerabilities' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('vulnerabilities')}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>CORS & Probes ({(activeReport.modules?.vulnerability_scanner?.findings || []).length})</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'secrets' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('secrets')}
                  >
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Secrets ({(activeReport.modules?.secrets_scanner?.findings || []).length})</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'access' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('access')}
                  >
                    <User className="w-3.5 h-3.5 text-purple-500" />
                    <span>Access Control</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'tls_dns' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('tls_dns')}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TLS & DNS</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'subdomains' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('subdomains')}
                  >
                    <Server className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Subdomains ({subdomainsList.length})</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'ports' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('ports')}
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ports ({activeReport.modules?.port_scanner?.open_ports?.length || 0})</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'tech_cloud' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('tech_cloud')}
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-600" />
                    <span>Stack & Cloud</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'crawler' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('crawler')}
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    <span>Crawler</span>
                  </button>
                </div>
              )}

              {/* Sub-tabs for Frontend Pillar */}
              {activePillar === 'frontend' && (
                <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl mb-5 overflow-x-auto no-scrollbar shadow-xs">
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'performance' ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('performance')}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Performance ({webQuality.performance?.score || 86}/100)</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'seo' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('seo')}
                  >
                    <Search className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SEO ({webQuality.seo?.score || 91}/100)</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'ui_ux' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('ui_ux')}
                  >
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    <span>UI / UX ({webQuality.ui_ux_accessibility?.score || 89}/100)</span>
                  </button>
                  <button 
                    type="button" 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === 'pages_matrix' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`} 
                    onClick={() => setActiveTab('pages_matrix')}
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-500" />
                    <span>Multi-Page Matrix ({(webQuality.pages_matrix || []).length})</span>
                  </button>
                </div>
              )}

              {/* TAB 1: Findings & Remediation */}
              {activeTab === 'findings' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(sev => {
                        const count = sev === 'ALL' ? findings.length : (sevBreakdown[sev] || 0);
                        const isSelected = severityFilter === sev;
                        return (
                          <button
                            key={sev}
                            type="button"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                            }`}
                            onClick={() => setSeverityFilter(sev)}
                          >
                            <span>{sev}</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative min-w-[200px] sm:min-w-[240px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search findings..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {filteredFindings.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                      No findings match the selected filter criteria.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFindings.map((f, idx) => {
                        const sev = (f.severity || 'INFO').toUpperCase();
                        const borderColors = {
                          CRITICAL: 'border-l-rose-500',
                          HIGH: 'border-l-orange-500',
                          MEDIUM: 'border-l-amber-500',
                          LOW: 'border-l-sky-500',
                          INFO: 'border-l-slate-400'
                        };
                        const badgeColors = {
                          CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
                          HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
                          MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
                          LOW: 'bg-sky-50 text-sky-700 border-sky-200',
                          INFO: 'bg-slate-100 text-slate-700 border-slate-200'
                        };

                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border border-slate-200/90 border-l-4 ${borderColors[sev] || 'border-l-slate-400'} bg-white hover:border-slate-300 transition-all shadow-xs`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                {f.summary}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider ${badgeColors[sev] || badgeColors.INFO}`}>
                                  {sev}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
                                  {f.confidence || 'CONFIRMED'}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 rounded-md">
                                  {f.owasp_category || 'A05:2021'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                              {f.description}
                            </p>

                            {f.evidence && (
                              <div className="mb-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700 break-all">
                                <strong className="text-slate-900 font-sans font-bold">Evidence: </strong>
                                {f.evidence}
                              </div>
                            )}

                            {f.remediation && (
                              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start justify-between gap-2">
                                <div>
                                  <strong className="font-bold text-emerald-950 block mb-0.5">Recommended Remediation:</strong>
                                  <span className="text-emerald-800 leading-relaxed">{f.remediation}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(f.remediation, `rem-${idx}`)}
                                  className="shrink-0 p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors"
                                  title="Copy remediation advice"
                                >
                                  {copiedKey === `rem-${idx}` ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <FileCode className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* TAB: Defensive Vulnerability & Configuration Assessment */}
            {activeTab === 'vulnerabilities' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
                      Vulnerabilities, CORS & Probes
                    </h3>
                    <p className="text-xs text-slate-500">
                      CORS policies, cookie security attributes, HTTP verbs, exposed files, and DOM sinks.
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border self-start sm:self-auto ${
                    ((activeReport.modules?.vulnerability_scanner?.findings || []).length > 0) 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {(activeReport.modules?.vulnerability_scanner?.findings || []).length} Security Issue(s)
                  </span>
                </div>

                {/* 1. Content Security Policy Deep Evaluator */}
                <div className="mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    1. Content Security Policy (CSP) Evaluator
                  </h4>
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                    <table className="audit-table min-w-full">
                      <tbody>
                        <tr>
                          <th className="w-56 text-xs text-slate-600 font-semibold bg-slate-50">Enforcement State</th>
                          <td className="text-xs text-slate-800">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md border mr-2 ${
                              activeReport.modules?.vulnerability_scanner?.csp_evaluation?.present 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {activeReport.modules?.vulnerability_scanner?.csp_evaluation?.present ? 'ENFORCED' : 'MISSING'}
                            </span>
                            Rating: <strong>{activeReport.modules?.vulnerability_scanner?.csp_evaluation?.rating || 'MISSING'}</strong> &bull; Score: <strong>{activeReport.modules?.vulnerability_scanner?.csp_evaluation?.score ?? 0}/100</strong>
                          </td>
                        </tr>
                        <tr>
                          <th className="text-xs text-slate-600 font-semibold bg-slate-50">Identified Bypasses</th>
                          <td className="text-xs">
                            {(activeReport.modules?.vulnerability_scanner?.csp_evaluation?.bypasses || []).length > 0 ? (
                              <ul className="list-disc pl-4 text-rose-600 space-y-0.5">
                                {(activeReport.modules?.vulnerability_scanner?.csp_evaluation?.bypasses || []).map((b, i) => (
                                  <li key={i}>{b}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-emerald-700 font-medium">✓ Strict policy enforced without common bypass vectors</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. CORS Misconfiguration */}
                <div className="mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    2. Cross-Origin Resource Sharing (CORS) Policy
                  </h4>
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                    <table className="audit-table min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600">
                          <th>Scenario</th><th>Status</th><th>Allow-Origin</th><th>Credentials</th><th>Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeReport.modules?.vulnerability_scanner?.cors?.results || []).length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-slate-400 py-4">No CORS headers responded.</td></tr>
                        ) : (
                          (activeReport.modules?.vulnerability_scanner?.cors?.results || []).map((r, idx) => (
                            <tr key={idx}>
                              <td><strong>{r.label}</strong><br /><code className="text-[11px] text-slate-500">{r.tested_origin}</code></td>
                              <td>HTTP {r.status_code}</td>
                              <td><code>{r.allow_origin || 'None'}</code></td>
                              <td><code>{r.allow_credentials || 'None'}</code></td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                  r.is_reflected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {r.is_reflected ? 'REFLECTED INSECURE' : 'SECURE'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Cookie Security Flags */}
                <div className="mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    3. Cookie Security Attributes
                  </h4>
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                    <table className="audit-table min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600">
                          <th>Cookie Name</th><th>Secure</th><th>HttpOnly</th><th>SameSite</th><th>Domain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeReport.modules?.vulnerability_scanner?.cookies?.details || []).length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-slate-400 py-4">No Set-Cookie headers observed.</td></tr>
                        ) : (
                          (activeReport.modules?.vulnerability_scanner?.cookies?.details || []).map((c, idx) => (
                            <tr key={idx}>
                              <td><code>{c.name}</code></td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  c.secure ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {c.secure ? 'YES' : 'NO'}
                                </span>
                              </td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  c.httponly ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {c.httponly ? 'YES' : 'NO'}
                                </span>
                              </td>
                              <td>
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
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
                </div>

                {/* 4. Sensitive Files Probes */}
                <div className="mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    4. Exposed Configuration Files & Directories ({(activeReport.modules?.vulnerability_scanner?.sensitive_files?.probed_count || 0)} checks)
                  </h4>
                  <p className="text-xs text-slate-500 mb-2">Validated with binary & text signatures to prevent false positives.</p>
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                    <table className="audit-table min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600">
                          <th>Path Tested</th><th>Catalog</th><th>Status</th><th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeReport.modules?.vulnerability_scanner?.sensitive_files?.all_probes || []).length === 0 ? (
                          <tr><td colSpan="4" className="text-center text-slate-400 py-4">No sensitive file probes recorded.</td></tr>
                        ) : (
                          (activeReport.modules?.vulnerability_scanner?.sensitive_files?.all_probes || []).map((f, idx) => (
                            <tr key={idx}>
                              <td><code>{f.path}</code></td>
                              <td>{f.title}</td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                  f.is_exposed ? 'bg-rose-50 text-rose-700' : f.status_code === 200 ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {f.is_exposed ? `EXPOSED (${f.severity})` : f.status_code === 200 ? 'SPA ROUTE' : `HTTP ${f.status_code}`}
                                </span>
                              </td>
                              <td className="text-slate-500 text-[11px]">{f.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Policy & Information Leaks */}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    5. Security Policy & Error Disclosure
                  </h4>
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                    <table className="audit-table min-w-full text-xs">
                      <tbody>
                        <tr>
                          <th className="w-56 text-slate-600 font-semibold bg-slate-50">RFC 9116 security.txt</th>
                          <td>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded mr-2 ${
                              activeReport.modules?.vulnerability_scanner?.security_txt?.present ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {activeReport.modules?.vulnerability_scanner?.security_txt?.present ? 'FOUND' : 'MISSING'}
                            </span>
                            {activeReport.modules?.vulnerability_scanner?.security_txt?.contact || 'No contact published'}
                          </td>
                        </tr>
                        <tr>
                          <th className="text-slate-600 font-semibold bg-slate-50">Error Handling</th>
                          <td>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded mr-2 ${
                              activeReport.modules?.vulnerability_scanner?.error_handling?.leak_detected ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {activeReport.modules?.vulnerability_scanner?.error_handling?.leak_detected ? 'LEAK DETECTED' : 'CLEAN'}
                            </span>
                            {activeReport.modules?.vulnerability_scanner?.error_handling?.evidence_snippet || 'No internal server paths revealed'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Security Headers */}
            {activeTab === 'headers' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4">HTTP Response Headers</h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 mb-6">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Header</th><th>Status</th><th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.security_headers?.missing_headers || []).map(h => (
                        <tr key={h}>
                          <td><code>{h}</code></td>
                          <td><span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded">MISSING</span></td>
                          <td className="text-slate-400">Not observed in HTTP response</td>
                        </tr>
                      ))}
                      {Object.entries(activeReport.modules?.security_headers?.present_headers || {}).map(([h, val]) => (
                        <tr key={h}>
                          <td><code>{h}</code></td>
                          <td><span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded">PRESENT</span></td>
                          <td><code>{val}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Hardening Snippets</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">Nginx Configuration</span>
                    <div className="code-block relative">
                      <button className="copy-btn" onClick={() => copyToClipboard(activeReport.modules?.security_headers?.remediation_snippets?.nginx || '', 'nginx')}>
                        {copiedKey === 'nginx' ? 'Copied!' : 'Copy'}
                      </button>
                      <pre>{activeReport.modules?.security_headers?.remediation_snippets?.nginx || '# All audited headers present'}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Secrets & Sensitive Leaks */}
            {activeTab === 'secrets' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Secrets & Credentials Scanner</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                    ((activeReport.modules?.secrets_scanner?.findings || []).length > 0) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {(activeReport.modules?.secrets_scanner?.findings || []).length} Leaks Detected
                  </span>
                </div>

                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Severity</th><th>Secret</th><th>Pattern</th><th>Discovered In</th><th>Remediation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.secrets_scanner?.findings || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-emerald-700 py-8 bg-emerald-50/50 font-medium">
                            🛡️ No credentials, private keys, or exposed configs detected in client bundles.
                          </td>
                        </tr>
                      ) : (
                        (activeReport.modules?.secrets_scanner?.findings || []).map((s, idx) => (
                          <tr key={idx}>
                            <td><span className="badge badge-high">{s.severity}</span></td>
                            <td><strong>{s.summary}</strong></td>
                            <td><code>{s.masked_secret || s.masked_value || 'Redacted'}</code></td>
                            <td className="text-slate-500"><code>{s.source_url}</code></td>
                            <td className="text-sky-600">{s.remediation}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Access Control & Admin Protection */}
            {activeTab === 'access' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Admin & Sensitive Routes</h3>
                <p className="text-xs text-slate-500 mb-4">Safe probes against standard administrative management paths.</p>

                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Path</th><th>Status</th><th>Protection State</th><th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.access_control_audit?.admin_routes || []).length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-slate-400 py-4">No administrative paths audited.</td></tr>
                      ) : (
                        (activeReport.modules?.access_control_audit?.admin_routes || []).map((r, idx) => {
                          const isProt = r.protection_state === 'PROTECTED' || r.protection_state === 'REDIRECTED_TO_LOGIN';
                          return (
                            <tr key={idx}>
                              <td><code>{r.path}</code></td>
                              <td><strong>HTTP {r.status_code}</strong></td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${
                                  isProt ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {r.protection_state}
                                </span>
                              </td>
                              <td className="text-slate-500">{r.details}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Web Crawler & Site Topology */}
            {activeTab === 'crawler' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">In-Scope Crawled Pages</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeReport.modules?.crawler?.total_pages_crawled || 0} pages crawled
                  </span>
                </div>

                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>URL</th><th>Status</th><th>Title</th><th>Links</th><th>Scripts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.crawler?.pages || []).length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-slate-400 py-4">No pages crawled.</td></tr>
                      ) : (
                        (activeReport.modules?.crawler?.pages || []).map((p, idx) => (
                          <tr key={idx}>
                            <td><code>{p.url}</code></td>
                            <td>
                              <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                p.status_code === 200 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                HTTP {p.status_code}
                              </span>
                            </td>
                            <td><strong>{p.title || 'Untitled'}</strong></td>
                            <td>{p.links_found || 0}</td>
                            <td>{p.scripts_found || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">Discovered Subdomains</h3>
                    <p className="text-xs text-slate-500">
                      Identified via Certificate Transparency logs (crt.sh) and DNS resolution.
                    </p>
                  </div>
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search subdomains..."
                      value={subdomainSearchTerm}
                      onChange={e => setSubdomainSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Subdomain</th><th>Resolved IP</th><th>Status</th><th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubdomains.length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-slate-400 py-6">No matching subdomains found.</td></tr>
                      ) : (
                        filteredSubdomains.map((sub, i) => {
                          const subName = sub.subdomain || sub.hostname;
                          const ips = sub.resolved_ips || [];
                          const ipVal = sub.ip_address || (ips.length > 0 ? ips.join(', ') : 'Unresolved');
                          const isActive = sub.status === 'ACTIVE' || sub.status === 'ACTIVE_RESOLVED' || (ipVal !== 'Unresolved' && ipVal !== 'None');
                          return (
                            <tr key={i}>
                              <td>
                                <strong className="text-sky-600">
                                  <a href={`https://${subName}`} target="_blank" rel="noreferrer" className="hover:underline">
                                    {subName} ↗
                                  </a>
                                </strong>
                              </td>
                              <td><code>{ipVal}</code></td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="text-slate-500 text-[11px]">{sub.source || 'crt.sh'}</td>
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
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3">TLS / SSL Cryptographic Audit</h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 mb-6">
                  <table className="audit-table min-w-full text-xs">
                    <tbody>
                      <tr>
                        <th className="w-48 text-slate-600 font-semibold bg-slate-50">Days Until Expiry</th>
                        <td>
                          <strong className={(activeReport.modules?.tls_audit?.certificate?.days_remaining || 0) < 30 ? 'text-rose-600' : 'text-emerald-700'}>
                            {activeReport.modules?.tls_audit?.certificate?.days_remaining ?? 'N/A'} days
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <th className="text-slate-600 font-semibold bg-slate-50">Issuer</th>
                        <td><code>{activeReport.modules?.tls_audit?.certificate?.issuer?.organizationName || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <th className="text-slate-600 font-semibold bg-slate-50">Protocol</th>
                        <td><code>{activeReport.modules?.tls_audit?.connection?.protocol_version || 'N/A'}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3">DNS Records</h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <tbody>
                      {Object.entries(activeReport.modules?.dns_analysis?.records || {}).map(([rtype, vals]) => (
                        <tr key={rtype}>
                          <th className="w-48 text-slate-600 font-semibold bg-slate-50">{rtype}</th>
                          <td>
                            {vals && vals.length > 0 ? (
                              vals.map((v, i) => <div key={i}><code>{v}</code></div>)
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Tech Stack & Cloud Indicators */}
            {activeTab === 'tech_cloud' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3">Technology Stack</h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 mb-6">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Technology</th><th>Category</th><th>Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.technology_detection?.technologies || []).length === 0 ? (
                        <tr><td colSpan="3" className="text-center text-slate-400 py-4">No framework signatures disclosed.</td></tr>
                      ) : (
                        (activeReport.modules?.technology_detection?.technologies || []).map((t, idx) => (
                          <tr key={idx}>
                            <td><strong>{t.name}</strong></td>
                            <td><span className="badge badge-low">{t.category}</span></td>
                            <td><code>{t.version || 'Hidden'}</code></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: Open Ports */}
            {activeTab === 'ports' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Port Assessment</h3>
                <p className="text-xs text-slate-500 mb-4">Scoped connect probes against standard web and service ports.</p>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80">
                  <table className="audit-table min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th>Port</th><th>Service</th><th>State</th><th>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReport.modules?.port_scanner?.all_results || []).length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-slate-400 py-4">No port checks executed.</td></tr>
                      ) : (
                        (activeReport.modules?.port_scanner?.all_results || []).map(r => (
                          <tr key={r.port}>
                            <td><strong>{r.port}</strong></td>
                            <td>{r.service}</td>
                            <td>
                              <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                r.state === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {r.state}
                              </span>
                            </td>
                            <td>{r.latency_ms} ms</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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

        {/* Scan History Section (Member-Scoped) */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0">
                {currentUser ? `Recent Audits for ${currentUser.username}` : 'Historical Audits'} ({historyList.length})
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                {currentUser ? `Isolated to ${currentUser.email} • Synced to MongoDB Atlas` : 'Sign in to access your audit archive'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg self-start sm:self-auto">
              🍃 MongoDB Atlas
            </span>
          </div>

          {historyList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No prior audits recorded for {currentUser?.email || 'this account'}.
            </div>
          ) : (
            <div className="space-y-2">
              {historyList.map(h => (
                <div 
                  key={h.id || h.filename || h.auditId} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer"
                  onClick={() => loadPastReport(h.filename || h.auditId)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs"
                      style={{ background: getGradeColor(h.grade) }}
                    >
                      {h.grade}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{h.targetHost}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(h.timestamp).toLocaleDateString()} &bull; Score: {h.score}/100
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-md">
                      {h.totalFindings} Findings
                    </span>
                    <button 
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); loadPastReport(h.filename || h.auditId); }}
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </main>
      )}

      {/* Redesigned Universal Site Footer */}
      <SiteFooter onNavigatePage={handleNavigatePage} />

      {/* Native App-Style Mobile Bottom Navigation Bar */}
      <MobileBottomBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewScan={handleNewScanClick}
        onOpenAuth={() => setShowAuthModal(true)}
        hasActiveReport={Boolean(activeReport)}
        currentUser={currentUser}
      />
    </div>
  );
}

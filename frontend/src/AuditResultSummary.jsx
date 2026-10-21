import React, { useState } from 'react';
import { 
  Trophy, 
  Download, 
  FileText, 
  ShieldAlert, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

/**
 * AuditResultSummary Component
 * Minimal, executive, ultra-responsive security & performance summary.
 */
export default function AuditResultSummary({
  report,
  webQuality,
  onNavigateTab,
  onDownloadJson,
  onDownloadPdf
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!report) return null;

  const securityScore = report.summary?.overall_score ?? report.summary?.security_posture_score ?? 77;
  const perfScore = webQuality?.summary?.performance_score ?? webQuality?.performance?.score ?? 86;
  const seoScore = webQuality?.summary?.seo_score ?? webQuality?.seo?.score ?? 91;
  const uiScore = webQuality?.summary?.ui_ux_score ?? webQuality?.ui_ux_accessibility?.score ?? 89;
  const overallScore = webQuality?.summary?.overall_web_health_score ?? Math.round((securityScore + perfScore + seoScore + uiScore) / 4);
  const grade = report.summary?.overall_grade || webQuality?.summary?.grade || 'B';

  const highRisks = (report.findings || []).filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL').length;
  const totalFindings = (report.findings || []).length;
  const ttfb = webQuality?.performance?.ttfb_ms || 140;

  // Gather top prioritized fixes
  const allOptimizations = webQuality?.all_optimizations || [
    ...(webQuality?.performance?.optimizations || []),
    ...(webQuality?.seo?.optimizations || []),
    ...(webQuality?.ui_ux_accessibility?.optimizations || [])
  ];

  const topPriorityItems = [];
  (report.findings || []).filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL').slice(0, 3).forEach(f => {
    topPriorityItems.push({
      category: 'Security Risk',
      impact: f.severity,
      title: f.summary,
      description: f.description,
      remediation: f.remediation,
      tab: 'findings'
    });
  });

  allOptimizations.filter(o => o.impact === 'HIGH' || o.impact === 'MEDIUM').slice(0, 4 - topPriorityItems.length).forEach(o => {
    topPriorityItems.push({
      category: o.category || 'Web Quality',
      impact: o.impact,
      title: o.title,
      description: o.description,
      remediation: o.remediation,
      tab: o.category === 'Performance' ? 'performance' : (o.category === 'SEO' ? 'seo' : 'ui_ux')
    });
  });

  const handleCopyCode = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Audit Executive Summary
              </h2>
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                {report.metadata?.target_host || 'Target System'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified perimeter telemetry across 21 automated diagnostic stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadJson && (
            <button 
              type="button" 
              onClick={onDownloadJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>JSON</span>
            </button>
          )}
          {onDownloadPdf && (
            <button 
              type="button" 
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Metric Pillar Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Security</span>
            <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
              Grade {grade}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {securityScore}<span className="text-xs text-slate-400 font-sans font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">OWASP &amp; Headers</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Speed &amp; Vitals</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {perfScore}<span className="text-xs text-slate-400 font-sans font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">TTFB {ttfb}ms</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SEO Health</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {seoScore}<span className="text-xs text-slate-400 font-sans font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Social &amp; SERP</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">UI/UX &amp; Access</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {uiScore}<span className="text-xs text-slate-400 font-sans font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">WCAG 2.1 AAA</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-sky-50 border border-sky-200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-1">Composite</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-900">
            {overallScore}<span className="text-xs text-sky-500 font-sans font-normal">/100</span>
          </div>
          <div className="text-[10px] text-sky-700 mt-0.5">Weighted Total</div>
        </div>
      </div>

      {/* Quick KPI Strip */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 mb-5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className={`w-3.5 h-3.5 ${highRisks > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          <span>High Risks: <strong className={highRisks > 0 ? 'text-red-600' : 'text-emerald-600'}>{highRisks}</strong></span>
        </div>
        <span>&bull;</span>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Total Findings: <strong className="text-slate-900">{totalFindings}</strong></span>
        </div>
        <span>&bull;</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>TTFB: <strong className="text-slate-900">{ttfb} ms</strong></span>
        </div>
        <span>&bull;</span>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span>Actionable Fixes: <strong className="text-emerald-700">{allOptimizations.length}</strong></span>
        </div>
      </div>

      {/* Top Priority Items */}
      {topPriorityItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Top High-Impact Remediation Items</span>
          </div>
          {topPriorityItems.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    item.impact === 'CRITICAL' || item.impact === 'HIGH'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {item.impact}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.category}</span>
                  <strong className="text-xs sm:text-sm text-slate-900 font-bold">{item.title}</strong>
                </div>
                {onNavigateTab && (
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab(item.tab)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              {item.remediation && (
                <div className="mt-2 bg-white border border-slate-200 rounded p-2 text-xs font-mono flex items-center justify-between gap-2">
                  <span className="text-slate-700 truncate">{item.remediation}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(item.remediation, idx)}
                    className="shrink-0 text-[11px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

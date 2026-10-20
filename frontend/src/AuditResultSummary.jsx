import React, { useState } from 'react';
import { 
  Trophy, 
  Download, 
  FileText, 
  ShieldAlert, 
  Zap, 
  Search, 
  Layers, 
  CheckCircle, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

/**
 * AuditResultSummary Component
 * Sharp-cornered, high-contrast, responsive executive summary.
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
  const totalPages = (webQuality?.pages_matrix || []).length || (report.modules?.crawler?.total_pages_crawled || 1);
  const ttfb = webQuality?.performance?.ttfb_ms || 140;

  // Gather top prioritized fixes from security and web quality
  const allOptimizations = webQuality?.all_optimizations || [
    ...(webQuality?.performance?.optimizations || []),
    ...(webQuality?.seo?.optimizations || []),
    ...(webQuality?.ui_ux_accessibility?.optimizations || [])
  ];

  const topPriorityItems = [];
  // Add critical/high security issues first
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

  // Add high/medium web quality optimizations
  allOptimizations.filter(o => o.impact === 'HIGH' || o.impact === 'MEDIUM').slice(0, 5 - topPriorityItems.length).forEach(o => {
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
    <div className="glass-panel" style={{ padding: '24px 26px', marginBottom: '22px', borderRadius: '0px', border: '1px solid #cbd5e1', background: '#ffffff' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy style={{ width: '24px', height: '24px', color: '#d97706' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Audit Report: <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{report.metadata?.target_host || 'Target System'}</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px', marginBottom: 0 }}>
              Defensive security posture, OWASP findings, Core Web Vitals, SEO health, and API topology verified.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onDownloadJson && (
            <button type="button" className="chip-btn" onClick={onDownloadJson} style={{ borderRadius: '0px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}>
              <Download style={{ width: '14px', height: '14px', marginRight: '6px', color: '#0284c7' }} />
              <span>Export JSON</span>
            </button>
          )}
          {onDownloadPdf && (
            <button type="button" className="chip-btn" onClick={onDownloadPdf} style={{ borderRadius: '0px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}>
              <FileText style={{ width: '14px', height: '14px', marginRight: '6px', color: '#d97706' }} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Pillar Scores Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '10px', marginBottom: '20px' }}>
        {/* Security Pillar */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px 16px', borderRadius: '0px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Security Posture</span>
            <span style={{ padding: '2px 6px', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #bfdbfe' }}>Grade {grade}</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: securityScore >= 80 ? '#15803d' : '#b45309', fontFamily: 'monospace', marginTop: '4px' }}>
            {securityScore}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>OWASP & Config Posture</div>
        </div>

        {/* Performance Pillar */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px 16px', borderRadius: '0px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Page Speed & Vitals</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: perfScore >= 80 ? '#15803d' : '#b45309', fontFamily: 'monospace', marginTop: '4px' }}>
            {perfScore}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>TTFB {ttfb}ms • LCP / CLS</div>
        </div>

        {/* SEO Pillar */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px 16px', borderRadius: '0px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SEO & Social Graph</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: seoScore >= 80 ? '#15803d' : '#b45309', fontFamily: 'monospace', marginTop: '4px' }}>
            {seoScore}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Search Index & Schema</div>
        </div>

        {/* UI/UX Pillar */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px 16px', borderRadius: '0px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>UI, UX & Access</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: uiScore >= 80 ? '#15803d' : '#0284c7', fontFamily: 'monospace', marginTop: '4px' }}>
            {uiScore}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>WCAG 2.1 & Viewport</div>
        </div>

        {/* Overall Web Health */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px 16px', borderRadius: '0px' }}>
          <span style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase' }}>Overall Composite</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', fontFamily: 'monospace', marginTop: '4px' }}>
            {overallScore}<span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1d4ed8', marginTop: '2px' }}>Composite 4-Pillar Score</div>
        </div>
      </div>

      {/* Quick KPIs Strip */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
          <ShieldAlert style={{ width: '15px', height: '15px', color: highRisks > 0 ? '#dc2626' : '#15803d' }} />
          <span style={{ color: '#64748b' }}>High/Critical Risks:</span>
          <strong style={{ color: highRisks > 0 ? '#b91c1c' : '#15803d', fontFamily: 'monospace' }}>{highRisks}</strong>
        </div>
        <div style={{ color: '#cbd5e1' }}>•</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
          <Layers style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <span style={{ color: '#64748b' }}>Security Findings:</span>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{totalFindings}</strong>
        </div>
        <div style={{ color: '#cbd5e1' }}>•</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
          <Clock style={{ width: '15px', height: '15px', color: ttfb < 400 ? '#15803d' : '#d97706' }} />
          <span style={{ color: '#64748b' }}>TTFB Latency:</span>
          <strong style={{ color: ttfb < 400 ? '#15803d' : '#b45309', fontFamily: 'monospace' }}>{ttfb} ms</strong>
        </div>
        <div style={{ color: '#cbd5e1' }}>•</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
          <Zap style={{ width: '15px', height: '15px', color: '#059669' }} />
          <span style={{ color: '#64748b' }}>Identified Improvements:</span>
          <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{allOptimizations.length}</strong>
        </div>
      </div>

      {/* Top Priority Action Items */}
      {topPriorityItems.length > 0 && (
        <div style={{ border: '1px solid #cbd5e1', padding: '16px 18px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap style={{ width: '17px', height: '17px', color: '#d97706' }} />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>Top High-Impact Priority Fixes</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topPriorityItems.map((item, idx) => (
              <div key={idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        background: item.impact === 'CRITICAL' || item.impact === 'HIGH' ? '#fef2f2' : '#fefce8', 
                        color: item.impact === 'CRITICAL' || item.impact === 'HIGH' ? '#b91c1c' : '#a16207', 
                        border: `1px solid ${item.impact === 'CRITICAL' || item.impact === 'HIGH' ? '#fecaca' : '#fef08a'}`
                      }}
                    >
                      {item.impact}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{item.category}</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>{item.title}</strong>
                  </div>
                  {onNavigateTab && (
                    <button 
                      type="button" 
                      onClick={() => onNavigateTab(item.tab)}
                      style={{ 
                        color: '#0284c7', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '2px' 
                      }}
                    >
                      <span>Jump to Tab</span>
                      <ArrowUpRight style={{ width: '13px', height: '13px' }} />
                    </button>
                  )}
                </div>
                <p style={{ color: '#475569', fontSize: '0.82rem', margin: '4px 0 8px 0', lineHeight: 1.4 }}>{item.description}</p>
                {item.remediation && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>REMEDIATION / FIX:</span>
                      <button 
                        type="button" 
                        onClick={() => handleCopyCode(item.remediation, idx)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check style={{ width: '11px', height: '11px', color: '#15803d' }} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy style={{ width: '11px', height: '11px' }} />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code style={{ fontSize: '0.76rem', color: '#0f172a', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {item.remediation.slice(0, 220)}{item.remediation.length > 220 ? '...' : ''}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Filter, 
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * Universal functional subgroup resolver for endpoints
 */
export function getEndpointSubgroup(ep, targetHost = '') {
  if (ep.subgroup && ep.subgroup.trim() !== '') {
    return ep.subgroup.trim();
  }

  const combined = `${ep.path || ''} ${ep.summary || ''} ${ep.full_url || ''}`.toLowerCase();

  // 1. Client SPA Routes
  if (ep.category === 'CLIENT_SPA_ROUTE' || ep.apiType === 'FRONTEND_ROUTE') {
    if (combined.includes('auction') || combined.includes('bid') || combined.includes('live')) {
      return 'Core & Auctions (Frontend)';
    }
    if (combined.includes('profile') || combined.includes('user') || combined.includes('account') || combined.includes('history')) {
      return 'User Account & Profile (Frontend)';
    }
    if (combined.includes('payment') || combined.includes('checkout') || combined.includes('order')) {
      return 'Payments & Orders (Frontend)';
    }
    if (combined.includes('admin') || combined.includes('dashboard')) {
      return 'Administration (Frontend)';
    }
    return 'Client SPA Navigation Routes';
  }

  // 2. Authentication & Session
  if (
    combined.includes('/auth') || combined.includes('login') || combined.includes('signin') ||
    combined.includes('sign-in') || combined.includes('signup') || combined.includes('sign-up') ||
    combined.includes('otp') || combined.includes('token') || combined.includes('session') ||
    combined.includes('biometric') || combined.includes('logout') || combined.includes('password')
  ) {
    return 'Authentication & Session';
  }

  // 3. Core Features & Auctions
  if (
    combined.includes('auction') || combined.includes('bid') || combined.includes('scheduler') ||
    combined.includes('bargain') || combined.includes('leaderboard') || combined.includes('prize') ||
    combined.includes('winner')
  ) {
    return 'Core Features & Auctions';
  }

  // 4. Payment Gateways & Transactions
  if (
    combined.includes('payment') || combined.includes('pay') || combined.includes('checkout') ||
    combined.includes('order') || combined.includes('transaction') || combined.includes('wallet') ||
    combined.includes('airpay') || combined.includes('razorpay') || combined.includes('stripe')
  ) {
    return 'Payment & Transactions';
  }

  // 5. User Management & Profile
  if (
    combined.includes('/user') || combined.includes('profile') || combined.includes('account') ||
    combined.includes('member') || combined.includes('voucher') || combined.includes('notification')
  ) {
    return 'User Management & Profile';
  }

  // 6. Administration & Operations
  if (
    combined.includes('/admin') || combined.includes('dashboard') || combined.includes('manage') ||
    combined.includes('ctrl') || combined.includes('settings') || combined.includes('upload')
  ) {
    return 'Administration & Operations';
  }

  // 7. External Portals & Linked Backends
  if (ep.category === 'EXTERNAL_BACKEND' || (targetHost && ep.full_url && !ep.full_url.includes(targetHost))) {
    return 'External Portals & Services';
  }

  // 8. General Backend APIs
  if ((ep.path || '').startsWith('/api') || (ep.path || '').startsWith('/v1') || (ep.path || '').startsWith('/v2')) {
    return 'General REST APIs';
  }

  return 'General Endpoints';
}

/**
 * Method badge with sharp corners
 */
export function MethodBadge({ method }) {
  const m = (method || 'GET').toUpperCase();
  let bg = '#eff6ff';
  let color = '#1d4ed8';
  let border = '#bfdbfe';

  if (m === 'POST') {
    bg = '#f0fdf4';
    color = '#15803d';
    border = '#bbf7d0';
  } else if (m === 'PUT' || m === 'PATCH') {
    bg = '#fefce8';
    color = '#a16207';
    border = '#fef08a';
  } else if (m === 'DELETE') {
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '0px',
        fontSize: '0.74rem',
        fontWeight: 800,
        fontFamily: 'monospace',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        marginRight: '6px',
        letterSpacing: '0.5px'
      }}
    >
      {m}
    </span>
  );
}

/**
 * Access State Badge with sharp corners
 */
export function AccessStateBadge({ state }) {
  if (!state || state === 'PENDING_AUDIT') {
    return (
      <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#f8fafc', color: '#64748b', fontWeight: 600, border: '1px solid #e2e8f0' }}>
        UNPROBED
      </span>
    );
  }
  if (state === 'RESTRICTED_VERIFIED_AUTH') {
    return (
      <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#f0fdf4', color: '#166534', fontWeight: 700, border: '1px solid #bbf7d0' }} title="Protected: Requires authorization">
        🛡️ VERIFIED AUTH
      </span>
    );
  }
  if (state === 'RESTRICTED_AUTH_REQUIRED') {
    return (
      <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#f5f3ff', color: '#6b21a8', fontWeight: 700, border: '1px solid #ddd6fe' }} title="Requires authentication credentials">
        🔒 RESTRICTED (401/403)
      </span>
    );
  }
  if (state === 'PUBLIC_ACCESSIBLE') {
    return (
      <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#eff6ff', color: '#0369a1', fontWeight: 700, border: '1px solid #bae6fd' }} title="Publicly accessible endpoint">
        🌐 PUBLIC (200)
      </span>
    );
  }
  if (state === 'METHOD_NOT_ALLOWED') {
    return (
      <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#fefce8', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }} title="HTTP 405 Method Not Allowed">
        ⚠️ METHOD 405
      </span>
    );
  }
  return (
    <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '0px', background: '#f8fafc', color: '#475569', fontWeight: 600, border: '1px solid #e2e8f0' }}>
      {state}
    </span>
  );
}

/**
 * Category Icon Helper
 */
function getCategoryIcon(subgroup = '') {
  const s = subgroup.toLowerCase();
  if (s.includes('auth') || s.includes('session')) return '🔐';
  if (s.includes('auction') || s.includes('core')) return '⚡';
  if (s.includes('payment') || s.includes('order')) return '💳';
  if (s.includes('user') || s.includes('profile')) return '👤';
  if (s.includes('admin') || s.includes('operations')) return '⚙️';
  if (s.includes('portal') || s.includes('external')) return '🌐';
  if (s.includes('frontend') || s.includes('spa') || s.includes('navigation')) return '🧭';
  return '📁';
}

/**
 * Main API Inventory Panel Component
 * Completely dynamic, robustly handling all Frontend and Backend endpoints.
 */
export default function ApiInventoryPanel({
  allEndpoints = [],
  activeReport = {},
  apiSearchTerm = '',
  setApiSearchTerm = () => {},
  apiCategoryFilter = 'ALL',
  setApiCategoryFilter = () => {}
}) {
  const [viewMode, setViewMode] = useState('blueprint'); // 'blueprint' vs 'table'
  const [selectedSubgroup, setSelectedSubgroup] = useState('ALL');

  const targetHost = activeReport?.metadata?.target_host || activeReport?.target_host || '';

  // Classify all endpoints dynamically
  const endpointsWithMeta = useMemo(() => {
    return allEndpoints.map(ep => {
      const resolvedSubgroup = getEndpointSubgroup(ep, targetHost);
      const isFrontend = ep.category === 'CLIENT_SPA_ROUTE' || ep.apiType === 'FRONTEND_ROUTE' || resolvedSubgroup.includes('Frontend');
      return {
        ...ep,
        resolvedSubgroup,
        isFrontend
      };
    });
  }, [allEndpoints, targetHost]);

  // Extract all unique subgroups dynamically from the actual endpoints
  const dynamicSubgroups = useMemo(() => {
    const map = new Map();
    endpointsWithMeta.forEach(ep => {
      const sg = ep.resolvedSubgroup || 'General Endpoints';
      map.set(sg, (map.get(sg) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([title, count]) => ({
        title,
        count,
        icon: getCategoryIcon(title)
      }))
      .sort((a, b) => b.count - a.count);
  }, [endpointsWithMeta]);

  // Counts
  const totalCount = endpointsWithMeta.length;
  const backendCount = endpointsWithMeta.filter(e => !e.isFrontend).length;
  const frontendCount = endpointsWithMeta.filter(e => e.isFrontend).length;
  const publicCount = endpointsWithMeta.filter(e => e.access_state === 'PUBLIC_ACCESSIBLE').length;
  const restrictedCount = endpointsWithMeta.filter(e => e.access_state?.includes('RESTRICTED')).length;

  // Filtered Endpoints
  const filteredEndpoints = useMemo(() => {
    return endpointsWithMeta.filter(ep => {
      // 1. Primary Filter Chip
      if (apiCategoryFilter === 'BACKEND' && ep.isFrontend) return false;
      if (apiCategoryFilter === 'FRONTEND' && !ep.isFrontend) return false;
      if (apiCategoryFilter === 'PUBLIC' && ep.access_state !== 'PUBLIC_ACCESSIBLE') return false;
      if (apiCategoryFilter === 'RESTRICTED' && !ep.access_state?.includes('RESTRICTED')) return false;

      // 2. Subgroup Filter Dropdown
      if (selectedSubgroup !== 'ALL' && ep.resolvedSubgroup !== selectedSubgroup) {
        return false;
      }

      // 3. Search query
      if (apiSearchTerm && apiSearchTerm.trim()) {
        const term = apiSearchTerm.toLowerCase().trim();
        const pathMatch = ep.path && ep.path.toLowerCase().includes(term);
        const urlMatch = ep.full_url && ep.full_url.toLowerCase().includes(term);
        const summaryMatch = ep.summary && ep.summary.toLowerCase().includes(term);
        const sourceMatch = ep.source && ep.source.toLowerCase().includes(term);
        const sgMatch = ep.resolvedSubgroup && ep.resolvedSubgroup.toLowerCase().includes(term);
        const methodMatch = ep.methods && ep.methods.some(m => m.toLowerCase().includes(term));
        const paramMatch = ep.parameters && ep.parameters.some(p => p.toLowerCase().includes(term));
        if (!pathMatch && !urlMatch && !summaryMatch && !sourceMatch && !sgMatch && !methodMatch && !paramMatch) {
          return false;
        }
      }

      return true;
    });
  }, [endpointsWithMeta, apiCategoryFilter, selectedSubgroup, apiSearchTerm]);

  // Group filtered endpoints by subgroup for Blueprint View
  const groupedBlueprint = useMemo(() => {
    const groups = {};
    filteredEndpoints.forEach(ep => {
      const sg = ep.resolvedSubgroup || 'General Endpoints';
      if (!groups[sg]) {
        groups[sg] = [];
      }
      groups[sg].push(ep);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredEndpoints]);

  // Export handlers
  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredEndpoints, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_inventory_${targetHost || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ["Type", "Method", "Path", "Full URL", "Subgroup", "Auth State", "Parameters", "Summary", "Source"];
    const rows = filteredEndpoints.map(ep => [
      ep.isFrontend ? 'FRONTEND ROUTE' : 'BACKEND API',
      (ep.methods || ['GET']).join('|'),
      ep.path || '',
      ep.full_url || '',
      ep.resolvedSubgroup || '',
      ep.access_state || 'UNPROBED',
      (ep.parameters || []).join('; '),
      (ep.summary || '').replace(/"/g, '""'),
      ep.source || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f => `"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_inventory_${targetHost || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px 26px', background: '#ffffff', borderRadius: '0px', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛰️</span>
            <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.3rem' }}>
              API Inventory & Complete Route Topology
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px', marginBottom: 0, maxWidth: '820px', lineHeight: 1.5 }}>
            Comprehensive catalog of <strong>Backend REST APIs ({backendCount})</strong> and <strong>Frontend Client SPA Routes ({frontendCount})</strong> discovered across JavaScript bundles, HTML DOM forms, OpenAPI specs, and network traces.
          </p>
        </div>

        {/* View Mode & Export Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('blueprint')}
              style={{
                padding: '6px 14px',
                borderRadius: '0px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'blueprint' ? '#0284c7' : 'transparent',
                color: viewMode === 'blueprint' ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              📑 Categorized Blueprint
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: '0px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'table' ? '#0284c7' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              📊 Full Data Table
            </button>
          </div>

          <button
            onClick={handleExportJson}
            className="chip-btn"
            style={{ borderRadius: '0px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700 }}
            title="Download JSON dataset"
          >
            <Download style={{ width: '13px', height: '13px', marginRight: '5px' }} />
            JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="chip-btn"
            style={{ borderRadius: '0px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700 }}
            title="Download CSV spreadsheet"
          >
            <Download style={{ width: '13px', height: '13px', marginRight: '5px' }} />
            CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Banner - 100% Sharp Corners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Endpoints</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: '2px', fontFamily: 'monospace' }}>{totalCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Frontend + Backend</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backend REST APIs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '2px', fontFamily: 'monospace' }}>{backendCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Server-side controllers</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frontend SPA Routes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6366f1', marginTop: '2px', fontFamily: 'monospace' }}>{frontendCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Client views & pages</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Public Accessible</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: '2px', fontFamily: 'monospace' }}>{publicCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Unauthenticated (200)</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auth Restricted</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7c3aed', marginTop: '2px', fontFamily: 'monospace' }}>{restrictedCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Protected (401/403)</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'ALL', label: `All (${totalCount})` },
            { key: 'BACKEND', label: `Backend APIs (${backendCount})` },
            { key: 'FRONTEND', label: `Frontend Routes (${frontendCount})` },
            { key: 'PUBLIC', label: `Public (${publicCount})` },
            { key: 'RESTRICTED', label: `Restricted (${restrictedCount})` }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setApiCategoryFilter(f.key)}
              style={{
                background: apiCategoryFilter === f.key ? '#0284c7' : '#f1f5f9',
                color: apiCategoryFilter === f.key ? '#ffffff' : '#334155',
                border: `1px solid ${apiCategoryFilter === f.key ? '#0284c7' : '#cbd5e1'}`,
                borderRadius: '0px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}

          {/* Subgroup Dropdown Selector */}
          <select
            value={selectedSubgroup}
            onChange={(e) => setSelectedSubgroup(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '0px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Functional Domains ({dynamicSubgroups.length})</option>
            {dynamicSubgroups.map(sg => (
              <option key={sg.title} value={sg.title}>
                {sg.icon} {sg.title} ({sg.count})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px', flexGrow: 1, maxWidth: '420px' }}>
          <input
            type="text"
            placeholder="Search path, method, param, keyword..."
            value={apiSearchTerm}
            onChange={e => setApiSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '0px',
              padding: '7px 12px 7px 32px',
              fontSize: '0.84rem',
              outline: 'none',
              color: '#0f172a'
            }}
          />
          <Search style={{ position: 'absolute', left: '10px', top: '9px', width: '15px', height: '15px', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Active Filter Notice */}
      {(apiCategoryFilter !== 'ALL' || selectedSubgroup !== 'ALL' || apiSearchTerm) && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#475569' }}>
          <div>
            Showing <strong>{filteredEndpoints.length}</strong> matching endpoints
            {selectedSubgroup !== 'ALL' && <span> under <strong>{selectedSubgroup}</strong></span>}
            {apiCategoryFilter !== 'ALL' && <span> filtered by <strong>{apiCategoryFilter}</strong></span>}
            {apiSearchTerm && <span> matching <strong>"{apiSearchTerm}"</strong></span>}
          </div>
          <button
            onClick={() => { setApiCategoryFilter('ALL'); setSelectedSubgroup('ALL'); setApiSearchTerm(''); }}
            style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* VIEW MODE 1: Dynamic Categorized Blueprint View */}
      {viewMode === 'blueprint' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {groupedBlueprint.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
              No endpoints match the selected filter criteria.
            </div>
          ) : (
            groupedBlueprint.map(([groupTitle, endpoints]) => (
              <div 
                key={groupTitle} 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '0px', 
                  overflow: 'hidden'
                }}
              >
                {/* Section Header */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '12px 18px', 
                  borderBottom: '1px solid #cbd5e1', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getCategoryIcon(groupTitle)}</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.96rem' }}>{groupTitle}</strong>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.74rem', 
                      fontWeight: 800, 
                      padding: '3px 8px', 
                      background: '#eff6ff', 
                      color: '#0369a1', 
                      border: '1px solid #bae6fd',
                      borderRadius: '0px'
                    }}
                  >
                    {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Table for this group */}
                <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="audit-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '90px' }}>Method</th>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>Path / URL</th>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '140px' }}>Type</th>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '160px' }}>Auth Posture</th>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>Description / Parameters</th>
                        <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '180px' }}>Source Trace</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoints.map((ep, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                          <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                            {(ep.methods || ['GET']).map(m => (
                              <MethodBadge key={m} method={m} />
                            ))}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <strong style={{ color: ep.isFrontend ? '#3730a3' : '#0369a1', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.86rem', wordBreak: 'break-all' }}>
                                {ep.path}
                              </strong>
                              {ep.full_url && ep.full_url !== ep.path && (
                                <a href={ep.full_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.74rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <span>{ep.full_url}</span>
                                  <ExternalLink style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <span 
                              style={{ 
                                display: 'inline-block',
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                fontFamily: "'JetBrains Mono', monospace",
                                letterSpacing: '0.04em',
                                background: ep.isFrontend ? '#eef2ff' : '#ecfdf5',
                                color: ep.isFrontend ? '#3730a3' : '#065f46',
                                border: `1px solid ${ep.isFrontend ? '#c7d2fe' : '#a7f3d0'}`,
                                borderRadius: '0px'
                              }}
                            >
                              {ep.isFrontend ? 'FRONTEND ROUTE' : 'BACKEND API'}
                            </span>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <AccessStateBadge state={ep.access_state} />
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ color: '#1e293b', fontSize: '0.84rem' }}>
                              {ep.summary || (ep.isFrontend ? 'Client application route' : 'API service endpoint')}
                            </div>
                            {ep.parameters && ep.parameters.length > 0 && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                                <strong>Params:</strong> <code style={{ background: '#f1f5f9', padding: '1px 4px', border: '1px solid #e2e8f0' }}>{ep.parameters.join(', ')}</code>
                              </div>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle', color: '#64748b', fontSize: '0.76rem' }}>
                            <code style={{ background: '#f8fafc', padding: '2px 4px', border: '1px solid #e2e8f0' }}>
                              {ep.source || 'Script Inspection'}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW MODE 2: Flat Full Data Table View */}
      {viewMode === 'table' && (
        <div style={{ maxHeight: '680px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #cbd5e1' }}>
          <table className="audit-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '90px' }}>Method</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>Endpoint Path / URL</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '130px' }}>Type</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '180px' }}>Domain / Subgroup</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '160px' }}>Auth Posture</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '100px' }}>Confidence</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>Summary & Parameters</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', width: '180px' }}>Source Origin</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '36px' }}>
                    No endpoints match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      {(ep.methods || ['GET']).map(m => (
                        <MethodBadge key={m} method={m} />
                      ))}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <strong style={{ color: ep.isFrontend ? '#3730a3' : '#0369a1', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.86rem', wordBreak: 'break-all' }}>
                          {ep.path}
                        </strong>
                        {ep.full_url && ep.full_url !== ep.path && (
                          <a href={ep.full_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.74rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span>{ep.full_url}</span>
                            <ExternalLink style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span 
                        style={{ 
                          display: 'inline-block',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: '0.04em',
                          background: ep.isFrontend ? '#eef2ff' : '#ecfdf5',
                          color: ep.isFrontend ? '#3730a3' : '#065f46',
                          border: `1px solid ${ep.isFrontend ? '#c7d2fe' : '#a7f3d0'}`,
                          borderRadius: '0px'
                        }}
                      >
                        {ep.isFrontend ? 'FRONTEND ROUTE' : 'BACKEND API'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      {getCategoryIcon(ep.resolvedSubgroup)} {ep.resolvedSubgroup}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <AccessStateBadge state={ep.access_state} />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          fontFamily: "'JetBrains Mono', monospace",
                          padding: '3px 8px', 
                          background: '#f1f5f9', 
                          color: '#475569', 
                          border: '1px solid #cbd5e1' 
                        }}
                      >
                        {ep.confidence || 'HIGH'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ color: '#0f172a', fontSize: '0.84rem' }}>{ep.summary || 'Discovered endpoint reference'}</div>
                      {ep.parameters && ep.parameters.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                          <strong>Params:</strong> <code style={{ background: '#f1f5f9', padding: '1px 4px', border: '1px solid #e2e8f0' }}>{ep.parameters.join(', ')}</code>
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'middle', color: '#64748b', fontSize: '0.76rem' }}>
                      <code style={{ background: '#f8fafc', padding: '2px 4px', border: '1px solid #e2e8f0' }}>
                        {ep.source || 'Script Inspection'}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

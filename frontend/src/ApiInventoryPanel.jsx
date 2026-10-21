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
 * Method badge with clean styling
 */
export function MethodBadge({ method }) {
  const m = (method || 'GET').toUpperCase();
  let cls = 'bg-sky-50 text-sky-700 border-sky-200';

  if (m === 'POST') {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (m === 'PUT' || m === 'PATCH') {
    cls = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (m === 'DELETE') {
    cls = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border mr-1.5 ${cls}`}>
      {m}
    </span>
  );
}

/**
 * Access State Badge
 */
export function AccessStateBadge({ state }) {
  if (!state || state === 'PENDING_AUDIT') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-50 text-slate-500 border border-slate-200">
        UNPROBED
      </span>
    );
  }
  if (state === 'RESTRICTED_VERIFIED_AUTH') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Protected: Requires authorization">
        🛡️ VERIFIED AUTH
      </span>
    );
  }
  if (state === 'RESTRICTED_AUTH_REQUIRED') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Requires authentication credentials">
        🔒 RESTRICTED (401/403)
      </span>
    );
  }
  if (state === 'PUBLIC_ACCESSIBLE') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200" title="Publicly accessible endpoint">
        🌐 PUBLIC (200)
      </span>
    );
  }
  if (state === 'METHOD_NOT_ALLOWED') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200" title="HTTP 405 Method Not Allowed">
        ⚠️ METHOD 405
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-50 text-slate-600 border border-slate-200">
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

  // Extract all unique subgroups dynamically
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
      if (apiCategoryFilter === 'BACKEND' && ep.isFrontend) return false;
      if (apiCategoryFilter === 'FRONTEND' && !ep.isFrontend) return false;
      if (apiCategoryFilter === 'PUBLIC' && ep.access_state !== 'PUBLIC_ACCESSIBLE') return false;
      if (apiCategoryFilter === 'RESTRICTED' && !ep.access_state?.includes('RESTRICTED')) return false;

      if (selectedSubgroup !== 'ALL' && ep.resolvedSubgroup !== selectedSubgroup) {
        return false;
      }

      if (apiSearchTerm && apiSearchTerm.trim()) {
        const term = apiSearchTerm.toLowerCase().trim();
        const pathMatch = ep.path && ep.path.toLowerCase().includes(term);
        const urlMatch = ep.full_url && ep.full_url.toLowerCase().includes(term);
        const summaryMatch = ep.summary && ep.summary.toLowerCase().includes(term);
        const sgMatch = ep.resolvedSubgroup && ep.resolvedSubgroup.toLowerCase().includes(term);
        const methodMatch = ep.methods && ep.methods.some(m => m.toLowerCase().includes(term));
        if (!pathMatch && !urlMatch && !summaryMatch && !sgMatch && !methodMatch) {
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛰️</span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              API Inventory &amp; Route Topology
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discovered <strong>{backendCount} Backend APIs</strong> and <strong>{frontendCount} Client SPA Routes</strong> across JavaScript bundles.
          </p>
        </div>

        {/* View Mode & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('blueprint')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                viewMode === 'blueprint' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>JSON</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Total Endpoints</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-700 mt-0.5">{totalCount}</div>
          <span className="text-[10px] text-slate-400 block">Frontend + Backend</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Backend APIs</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-0.5">{backendCount}</div>
          <span className="text-[10px] text-slate-400 block">REST &amp; RPC services</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">SPA Routes</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700 mt-0.5">{frontendCount}</div>
          <span className="text-[10px] text-slate-400 block">Client navigation</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Public (200)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-600 mt-0.5">{publicCount}</div>
          <span className="text-[10px] text-slate-400 block">Unauthenticated</span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Auth Restricted</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-700 mt-0.5">{restrictedCount}</div>
          <span className="text-[10px] text-slate-400 block">Protected (401/403)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {[
            { key: 'ALL', label: `All (${totalCount})` },
            { key: 'BACKEND', label: `Backend (${backendCount})` },
            { key: 'FRONTEND', label: `Frontend (${frontendCount})` },
            { key: 'PUBLIC', label: `Public (${publicCount})` },
            { key: 'RESTRICTED', label: `Auth (${restrictedCount})` }
          ].map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setApiCategoryFilter(chip.key)}
              className={`px-2.5 py-1 rounded font-mono font-bold transition-colors cursor-pointer ${
                apiCategoryFilter === chip.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search endpoint path..."
            value={apiSearchTerm}
            onChange={e => setApiSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* VIEW MODE 1: Blueprint Accordion / Groups */}
      {viewMode === 'blueprint' && (
        <div className="space-y-4">
          {groupedBlueprint.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              No endpoints matching your filter criteria.
            </div>
          ) : (
            groupedBlueprint.map(([subgroupName, items]) => (
              <div key={subgroupName} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(subgroupName)}</span>
                    <strong className="text-xs sm:text-sm text-slate-900">{subgroupName}</strong>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Mobile-Optimized List Layout */}
                <div className="block sm:hidden divide-y divide-slate-100 font-mono">
                  {items.map((ep, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(ep.methods || ['GET']).map(m => (
                            <MethodBadge key={m} method={m} />
                          ))}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            ep.isFrontend ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {ep.isFrontend ? 'FRONTEND' : 'BACKEND'}
                          </span>
                        </div>
                        <AccessStateBadge state={ep.access_state} />
                      </div>
                      <div className="text-xs font-semibold text-slate-900 break-words select-all font-mono leading-relaxed">
                        {ep.path}
                      </div>
                      {ep.summary && (
                        <div className="text-[11px] font-sans text-slate-500 mt-1">{ep.summary}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.map((ep, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 w-20">
                            {(ep.methods || ['GET']).map(m => (
                              <MethodBadge key={m} method={m} />
                            ))}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 break-all">{ep.path}</span>
                            {ep.summary && (
                              <div className="text-[11px] font-sans text-slate-500 mt-0.5">{ep.summary}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 w-32">
                            <AccessStateBadge state={ep.access_state} />
                          </td>
                          <td className="py-2.5 px-3 w-28 text-right">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              ep.isFrontend ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {ep.isFrontend ? 'FRONTEND' : 'BACKEND'}
                            </span>
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

      {/* VIEW MODE 2: Full Data Table */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Path</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Subgroup</th>
                <th className="py-2.5 px-3">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No endpoints match filter.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3">
                      {(ep.methods || ['GET']).map(m => (
                        <MethodBadge key={m} method={m} />
                      ))}
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-bold truncate max-w-xs">{ep.path}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.isFrontend ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {ep.isFrontend ? 'FRONTEND' : 'BACKEND'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600">{ep.resolvedSubgroup}</td>
                    <td className="py-2 px-3">
                      <AccessStateBadge state={ep.access_state} />
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

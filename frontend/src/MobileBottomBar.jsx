import React from 'react';
import { 
  Home, 
  Zap, 
  Gauge, 
  FileText, 
  User, 
  Layers
} from 'lucide-react';

/**
 * MobileBottomBar Component
 * Sleek, native-app-style sticky bottom navigation for mobile & tablet viewports.
 * Only visible on screens <= 768px.
 */
export default function MobileBottomBar({
  viewMode = 'landing',
  setViewMode = () => {},
  onNewScan = () => {},
  onOpenAuth = () => {},
  hasActiveReport = false,
  currentUser = null
}) {
  const handleCockpitScroll = () => {
    if (viewMode !== 'landing') {
      setViewMode('landing');
    }
    setTimeout(() => {
      const el = document.getElementById('cockpitGauge');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleHistoryScroll = () => {
    if (viewMode !== 'audit') {
      setViewMode('audit');
    }
    setTimeout(() => {
      const el = document.querySelector('.history-drawer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <nav 
      className="mobile-bottom-bar"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="mobile-bottom-inner">
        {/* Tab 1: Home */}
        <button
          type="button"
          className={`mobile-tab-item ${viewMode === 'landing' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Home"
        >
          <Home className="w-5 h-5 mobile-tab-icon" />
          <span className="mobile-tab-label">Home</span>
          {viewMode === 'landing' && <span className="mobile-tab-indicator" />}
        </button>

        {/* Tab 2: Cockpit Speedometer */}
        <button
          type="button"
          className="mobile-tab-item"
          onClick={handleCockpitScroll}
          aria-label="Velocity Cockpit"
        >
          <Gauge className="w-5 h-5 mobile-tab-icon" />
          <span className="mobile-tab-label">Cockpit</span>
        </button>

        {/* Tab 3: Center Primary Action (Launch Audit) */}
        <div className="mobile-tab-center-wrap">
          <button
            type="button"
            className="mobile-fab-btn"
            onClick={onNewScan}
            title="Launch a new defensive audit"
            aria-label="Launch Audit"
          >
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </button>
          <span className="mobile-fab-label">Audit</span>
        </div>

        {/* Tab 4: Results / History */}
        <button
          type="button"
          className={`mobile-tab-item ${viewMode === 'audit' ? 'active' : ''}`}
          onClick={() => {
            if (hasActiveReport) {
              setViewMode('audit');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              handleHistoryScroll();
            }
          }}
          aria-label="Audit Results"
        >
          {hasActiveReport ? (
            <FileText className="w-5 h-5 mobile-tab-icon text-sky-600" />
          ) : (
            <Layers className="w-5 h-5 mobile-tab-icon" />
          )}
          <span className="mobile-tab-label">{hasActiveReport ? 'Report' : 'History'}</span>
          {viewMode === 'audit' && <span className="mobile-tab-indicator" />}
        </button>

        {/* Tab 5: Account / Member Profile */}
        <button
          type="button"
          className="mobile-tab-item"
          onClick={onOpenAuth}
          aria-label="Member Account"
        >
          {currentUser ? (
            <div className="w-5 h-5 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center rounded-full shadow-2xs">
              {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
          ) : (
            <User className="w-5 h-5 mobile-tab-icon" />
          )}
          <span className="mobile-tab-label">Account</span>
          {currentUser && <span className="mobile-tab-dot-online" />}
        </button>
      </div>
    </nav>
  );
}

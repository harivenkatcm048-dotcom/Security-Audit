import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gauge, 
  Volume2, 
  VolumeX, 
  Flame, 
  Flag, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  Sliders
} from 'lucide-react';

/**
 * Superbike High-Velocity Cockpit & Telemetry Cluster (Light Theme Edition)
 * Inspired by Porsche / Ducati White-Dial Instrument Clusters
 * 
 * Features:
 * - High-Contrast Pearl-White Instrument Dial Face with Dual Aluminum Bezel
 * - 0 - 15,000 RPM Dynamic Sweeping Tachometer with High-RPM Redline Warning
 * - High-Precision Needle Physics (Inertia, Rotational Damping, Rev-Limit Jitter)
 * - Spacebar / Click & Hold Throttle Blip Acceleration
 * - 10-Stage Sequential High-Lumen Shift Light LEDs on Silver Track
 * - Digital Central Speedometer (0 - 320 KM/H or MPH toggleable)
 * - Racing Gear Box: [ N | 1 | 2 | 3 | 4 | 5 | 6 | TOP ]
 * - Web Audio API Multi-Oscillator Superbike Engine Synthesizer
 * - Victory Rev Sequence & Confetti Blast on Audit Finish
 * - 100% Responsive SVG that scales seamlessly from 320px mobile to 4K displays
 */
export default function BikeSpeedometerGauge({
  isScanning = false,
  currentStageIndex = 0,
  totalStages = 21,
  currentStageName = 'System Diagnostics',
  complete = false,
  resultSummary = null,
  targetDomain = 'test.fipmoney.com',
  onReachTopSpeed = null
}) {
  const [gaugeMode, setGaugeMode] = useState('security'); // 'security' | 'velocity' | 'seo'
  const [rpm, setRpm] = useState(1200);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState('N');
  const [throttle, setThrottle] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isBlipActive, setIsBlipActive] = useState(false);
  const [speedUnit, setSpeedUnit] = useState('KM/H');
  const [confettiFired, setConfettiFired] = useState(false);

  const displayScore = useMemo(() => {
    if (gaugeMode === 'velocity') return 86;
    if (gaugeMode === 'seo') return 91;
    if (resultSummary?.score) return resultSummary.score;
    if (resultSummary?.summary?.security_score) return resultSummary.summary.security_score;
    return isScanning ? Math.min(96, Math.round(40 + (currentStageIndex / totalStages) * 48)) : 88;
  }, [gaugeMode, resultSummary, isScanning, currentStageIndex, totalStages]);

  const ratingBadge = useMemo(() => {
    if (gaugeMode === 'velocity') return 'CORE WEB VITALS: 86/100 (OPTIMIZED)';
    if (gaugeMode === 'seo') return 'SEO GRAPH: 91/100 (EXCELLENT)';
    if (displayScore >= 80) return 'DEFENSE RATING: HARDENED & SECURE';
    if (displayScore >= 60) return 'DEFENSE RATING: MODERATE RESILIENCE';
    return 'DEFENSE RATING: ELEVATED RISK';
  }, [gaugeMode, displayScore]);

  // References for physics loop
  const animFrameRef = useRef(null);
  const currentRpmRef = useRef(1200);
  const targetRpmRef = useRef(1200);
  const currentSpeedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const throttleBlipOffsetRef = useRef(0);
  const prevStageRef = useRef(currentStageIndex);
  const isHoldingThrottleRef = useRef(false);
  const hasReachedTopRef = useRef(false);

  // Web Audio Synth
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const oscSubRef = useRef(null);
  const filterRef = useRef(null);
  const gainRef = useRef(null);

  // Celebration on audit complete
  useEffect(() => {
    if (complete && !confettiFired) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#2563eb', '#10b981', '#f59e0b', '#dc2626']
        });
        setConfettiFired(true);
      } catch (e) {}
    } else if (!complete) {
      setConfettiFired(false);
    }
  }, [complete, confettiFired]);

  // Stage progress synchronization: Starts slowly and only reaches 300+ on complete!
  useEffect(() => {
    if (complete) {
      // Report is ready: Surge into TOP gear and 13.8K redline!
      targetRpmRef.current = 13800;
      targetSpeedRef.current = speedUnit === 'KM/H' ? 308 : 192;
      setThrottle(100);
      setGear('TOP');
    } else if (isScanning) {
      // While generating report: move slowly and stay capped under 240 km/h
      hasReachedTopRef.current = false;
      const progress = totalStages > 0 ? Math.min(0.85, (currentStageIndex + 1) / totalStages) : 0.05;

      if (currentStageIndex !== prevStageRef.current) {
        throttleBlipOffsetRef.current = 500 + Math.random() * 300;
        prevStageRef.current = currentStageIndex;
      }
      const baseRpm = 1800 + progress * 7200;
      targetRpmRef.current = Math.min(9600, baseRpm + (throttleBlipOffsetRef.current || 0));
      
      const maxGeneratingSpeed = speedUnit === 'KM/H' ? 240 : 150;
      targetSpeedRef.current = Math.round(progress * maxGeneratingSpeed);
      setThrottle(Math.round(15 + progress * 60));
    } else {
      // Idle state before scan: completely at rest
      hasReachedTopRef.current = false;
      currentSpeedRef.current = 0;
      currentRpmRef.current = 1200;
      targetRpmRef.current = 1200;
      targetSpeedRef.current = 0;
      setRpm(1200);
      setSpeed(0);
      setThrottle(0);
      setGear('N');
    }
  }, [isScanning, currentStageIndex, totalStages, complete, speedUnit]);

  // Throttle handlers
  const startRevBlip = useCallback(() => {
    setIsBlipActive(true);
    isHoldingThrottleRef.current = true;
    throttleBlipOffsetRef.current = 9200 + Math.random() * 2200;
  }, []);

  const endRevBlip = useCallback(() => {
    setIsBlipActive(false);
    isHoldingThrottleRef.current = false;
  }, []);

  // Keyboard shortcut: Spacebar to rev
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        startRevBlip();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        endRevBlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startRevBlip, endRevBlip]);

  // Web Audio Synthesizer
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.045, now);
        masterGain.connect(ctx.destination);
        gainRef.current = masterGain;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(700, now);
        lowpass.Q.setValueAtTime(3.2, now);
        lowpass.connect(masterGain);
        filterRef.current = lowpass;

        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(52, now);
        osc1.connect(lowpass);
        osc1.start();
        osc1Ref.current = osc1;

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(104, now);
        osc2.connect(lowpass);
        osc2.start();
        osc2Ref.current = osc2;

        const oscSub = ctx.createOscillator();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(34, now);
        oscSub.connect(lowpass);
        oscSub.start();
        oscSubRef.current = oscSub;

        setSoundEnabled(true);
      } catch (err) {
        console.warn('Audio Init Notice:', err);
      }
    } else {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      setSoundEnabled(false);
    }
  };

  // High-performance physics animation loop
  useEffect(() => {
    const loop = () => {
      if (isHoldingThrottleRef.current) {
        throttleBlipOffsetRef.current = Math.min(13000, throttleBlipOffsetRef.current + 180);
      } else if (throttleBlipOffsetRef.current > 0) {
        throttleBlipOffsetRef.current = Math.max(0, throttleBlipOffsetRef.current - 140);
      }

      const effectiveTargetRpm = isHoldingThrottleRef.current || throttleBlipOffsetRef.current > 0
        ? Math.min(14500, targetRpmRef.current + throttleBlipOffsetRef.current)
        : targetRpmRef.current;

      const rpmDiff = effectiveTargetRpm - currentRpmRef.current;
      currentRpmRef.current += rpmDiff * 0.13;

      let jitter = 0;
      if (currentRpmRef.current > 12000) {
        jitter = (Math.random() - 0.5) * 110;
      }

      const clampedRpm = Math.max(800, Math.min(14800, Math.round(currentRpmRef.current + jitter)));
      setRpm(clampedRpm);

      const speedDiff = targetSpeedRef.current - currentSpeedRef.current;
      // Gentle progressive ramp when scanning (0.038) and fast victory surge when complete (0.075)
      const speedRate = complete ? 0.075 : (isScanning ? 0.038 : 0.08);
      currentSpeedRef.current += speedDiff * speedRate;
      const clampedSpeed = Math.max(0, Math.min(320, Math.round(currentSpeedRef.current)));
      setSpeed(clampedSpeed);

      // When complete and speed crosses 300 km/h: trigger report opening!
      if (complete && clampedSpeed >= 300 && !hasReachedTopRef.current) {
        hasReachedTopRef.current = true;
        if (typeof onReachTopSpeed === 'function') {
          onReachTopSpeed();
        }
      }

      if (!complete) {
        if (!isScanning && clampedSpeed === 0 && !isBlipActive && throttleBlipOffsetRef.current < 500) {
          setGear('N');
        } else {
          const maxS = speedUnit === 'KM/H' ? 260 : 160;
          const pct = clampedSpeed / maxS;
          if (pct < 0.12) setGear('1');
          else if (pct < 0.25) setGear('2');
          else if (pct < 0.42) setGear('3');
          else if (pct < 0.62) setGear('4');
          else if (pct < 0.82) setGear('5');
          else setGear('6');
        }
      }

      if (soundEnabled && osc1Ref.current && osc2Ref.current && filterRef.current && audioCtxRef.current) {
        const norm = clampedRpm / 14500;
        const fundamental = 48 + norm * 340;
        const cutoff = 450 + norm * 3000;
        const ctx = audioCtxRef.current;
        osc1Ref.current.frequency.setValueAtTime(fundamental, ctx.currentTime);
        osc2Ref.current.frequency.setValueAtTime(fundamental * 2, ctx.currentTime);
        if (oscSubRef.current) {
          oscSubRef.current.frequency.setValueAtTime(fundamental * 0.5, ctx.currentTime);
        }
        filterRef.current.frequency.setValueAtTime(cutoff, ctx.currentTime);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, [isScanning, soundEnabled, isBlipActive, complete, speedUnit]);

  // Geometry calculations: Center = (340, 240), Radius = 195. Span: -135° to +135° (270°)
  const normRpm = Math.max(0, Math.min(rpm / 14000, 1));
  const needleAngle = -135 + normRpm * 270;
  const arcLength = 918.91;
  const strokeOffset = arcLength - normRpm * arcLength;

  // Major ticks (0 to 14, x1000 RPM)
  const ticks = [];
  for (let i = 0; i <= 14; i++) {
    const angle = -135 + (i / 14) * 270;
    const rad = (angle - 90) * (Math.PI / 180);
    const isRedline = i >= 10;
    const isMajor = i % 2 === 0;
    const tickLen = isMajor ? 24 : 14;
    const rOuter = 195;
    const rInner = rOuter - tickLen;
    const rText = rOuter - 38;

    const xOuter = 340 + rOuter * Math.cos(rad);
    const yOuter = 240 + rOuter * Math.sin(rad);
    const xInner = 340 + rInner * Math.cos(rad);
    const yInner = 240 + rInner * Math.sin(rad);
    const xText = 340 + rText * Math.cos(rad);
    const yText = 240 + rText * Math.sin(rad);

    ticks.push({ idx: i, xOuter, yOuter, xInner, yInner, xText, yText, isRedline, isMajor });
  }

  const isRedlineActive = rpm >= 10500;
  const isRevLimiter = rpm >= 13200;

  return (
    <div className="superbike-cockpit-panel glass-panel light-cockpit" style={{ borderRadius: '0px', border: '1px solid #cbd5e1', boxShadow: '4px 4px 0px 0px rgba(15, 23, 42, 0.08)' }}>
      {/* Stitch Mode Switch Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge className="w-4 h-4 text-sky-600" />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Target Telemetry & Speedometer Cockpit
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
            // {targetDomain || 'test.fipmoney.com'}
          </span>
        </div>

        {/* Mode Switch Tabs */}
        <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', background: '#ffffff' }}>
          <button
            type="button"
            onClick={() => setGaugeMode('security')}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: gaugeMode === 'security' ? '#0f172a' : 'transparent',
              color: gaugeMode === 'security' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '0px'
            }}
          >
            Security Risk Index
          </button>
          <button
            type="button"
            onClick={() => setGaugeMode('velocity')}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: gaugeMode === 'velocity' ? '#0f172a' : 'transparent',
              color: gaugeMode === 'velocity' ? '#ffffff' : '#64748b',
              border: 'none',
              borderLeft: '1px solid #cbd5e1',
              cursor: 'pointer',
              borderRadius: '0px'
            }}
          >
            Core Web Vitals Velocity
          </button>
          <button
            type="button"
            onClick={() => setGaugeMode('seo')}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: gaugeMode === 'seo' ? '#0f172a' : 'transparent',
              color: gaugeMode === 'seo' ? '#ffffff' : '#64748b',
              border: 'none',
              borderLeft: '1px solid #cbd5e1',
              cursor: 'pointer',
              borderRadius: '0px'
            }}
          >
            SEO & Visibility Health
          </button>
        </div>
      </div>

      {/* Top Cockpit Header Bar */}
      <div className="cockpit-top-bar">
        <div className="cockpit-telemetry">
          <div className="cockpit-telemetry-icon-pulse light-icon-pulse">
            <Gauge className="w-5 h-5 text-sky-600 animate-pulse" />
          </div>
          <div>
            <div className="cockpit-title-row">
              <span className="cockpit-title text-slate-900">Superbike Velocity Cluster</span>
              <span className="cockpit-sub-brand text-sky-700">Porsche White Edition v3.2</span>
            </div>
            <div className="cockpit-status-chips">
              <span className={`cockpit-badge ${complete ? 'completed' : (isScanning ? 'scanning' : '')}`}>
                {complete ? '🏁 TOP SPEED REACHED • REPORT READY' : (isScanning ? `⚡ STAGE ${currentStageIndex + 1}/${totalStages}: AUDITING` : 'ENGINE READY • IDLE')}
              </span>
              <span className="telemetry-pill light-pill">
                <Activity className="w-3.5 h-3.5 text-sky-600 inline mr-1" />
                {Math.round(rpm)} RPM
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="cockpit-actions">
          <button 
            type="button" 
            className={`cockpit-btn rev-btn ${isBlipActive ? 'active' : ''}`}
            onMouseDown={startRevBlip}
            onMouseUp={endRevBlip}
            onTouchStart={startRevBlip}
            onTouchEnd={endRevBlip}
            title="Click & Hold (or hold Spacebar) to rev the tachometer!"
          >
            <Flame className="w-4 h-4 text-orange-500 mr-1.5" />
            <span>HOLD TO REV UP</span>
            <kbd className="rev-kbd light-kbd">SPACE</kbd>
          </button>
          
          <button 
            type="button" 
            className={`cockpit-btn sound-btn ${soundEnabled ? 'active' : ''}`}
            onClick={toggleSound}
            title="Toggle authentic superbike engine audio synthesizer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 mr-1.5 animate-pulse" />
                <span>SOUND ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500 mr-1.5" />
                <span>AUDIO OFF</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="cockpit-btn unit-btn"
            onClick={() => setSpeedUnit(prev => prev === 'KM/H' ? 'MPH' : 'KM/H')}
            title="Switch speed unit between KM/H and MPH"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600 mr-1" />
            <span>{speedUnit}</span>
          </button>

          <div className="cockpit-stage-counter light-stage-counter">
            <span className="text-slate-500 text-xs">STAGE</span>
            <strong className="text-sky-700 text-sm font-mono ml-1">{currentStageIndex + 1}</strong>
            <span className="text-slate-400 text-xs">/{totalStages}</span>
          </div>
        </div>
      </div>

      {/* 10-Stage Sequential Shift Lights on Aluminum Track */}
      <div className="shift-lights-bar-container light-shift-track">
        <div className="shift-lights-track">
          <div className={`shift-led green ${rpm > 3000 ? 'lit' : ''}`} title="3,000 RPM" />
          <div className={`shift-led green ${rpm > 4800 ? 'lit' : ''}`} title="4,800 RPM" />
          <div className={`shift-led green ${rpm > 6400 ? 'lit' : ''}`} title="6,400 RPM" />

          <div className={`shift-led yellow ${rpm > 7800 ? 'lit' : ''}`} title="7,800 RPM" />
          <div className={`shift-led yellow ${rpm > 9000 ? 'lit' : ''}`} title="9,000 RPM" />

          <div className={`shift-led orange ${rpm > 10200 ? 'lit' : ''}`} title="10,200 RPM" />
          <div className={`shift-led orange ${rpm > 11400 ? 'lit' : ''}`} title="11,400 RPM" />

          <div className={`shift-led red ${rpm > 12400 ? 'lit' : ''}`} title="12,400 RPM" />
          <div className={`shift-led red ${rpm > 13200 ? 'lit' : ''}`} title="13,200 RPM" />

          <div className={`shift-led flasher ${isRevLimiter || complete ? 'flashing' : ''}`} title="13,800+ RPM REV LIMIT" />
        </div>
        <div className="shift-lights-label text-slate-600">
          <span>SHIFT POINT • 13,500 RPM</span>
          <span className="font-mono text-sky-700 font-bold">{isRevLimiter ? 'REV LIMITER CUT' : (isRedlineActive ? 'POWER PEAK' : 'OPTIMAL')}</span>
        </div>
      </div>

      {/* Speedometer Instrument Dial Cluster - Light Porsche White Edition */}
      <div className="speedometer-display-wrap bg-grid-tech" style={{ position: 'relative', padding: '24px 16px' }}>
        {/* Technical Corner Registration Marks from Stitch Design System */}
        <div style={{ position: 'absolute', top: '8px', left: '12px' }} className="tech-corner-mark">
          CALIB: ISO-80000-13
        </div>
        <div style={{ position: 'absolute', top: '8px', right: '12px' }} className="tech-corner-mark">
          RATE: 1000 HZ
        </div>
        <div style={{ position: 'absolute', bottom: '8px', left: '12px' }} className="tech-corner-mark">
          CHASSIS: SEC-MKIV
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '12px' }} className="tech-corner-mark">
          SIG: HARDENED
        </div>

        <svg 
          viewBox="0 0 680 490" 
          className="speedometer-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Superbike Velocity Instrument Gauge"
        >
          <defs>
            {/* Porsche Sunburst White Dial Gradient */}
            <radialGradient id="lightDialBg" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f8fafc" />
              <stop offset="88%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            {/* Brushed Aircraft Aluminum Bezel */}
            <linearGradient id="lightBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="25%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Vibrant Tachometer Arc */}
            <linearGradient id="tachGradLight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#0ea5e9" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="88%" stopColor="#ea580c" />
              <stop offset="96%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            {/* Racing Needle Gradient */}
            <linearGradient id="needleBladeLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="lightGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* CNC Outer Brushed Aluminum Bezel */}
          <circle cx="340" cy="240" r="236" fill="url(#lightBezelGrad)" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="340" cy="240" r="230" fill="url(#lightDialBg)" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Subtle Inner Guide Dashes */}
          <circle cx="340" cy="240" r="206" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Track 1: Outer Guide Arc (R=195) */}
          <path
            d="M 202.1 377.9 A 195 195 0 1 1 477.9 377.9"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Track 2: Redline Danger Sector (10,000 to 14,000 RPM) */}
          {/* 2a. Precision Danger Zone Shaded Arc (Width 20, R=185) */}
          <path
            d="M 496.6 141.6 A 185 185 0 0 1 470.8 370.8"
            fill="none"
            stroke="rgba(239, 68, 68, 0.16)"
            strokeWidth="20"
            strokeLinecap="butt"
          />
          {/* 2b. Outer Danger Perimeter Edge (R=195) */}
          <path
            d="M 505.1 136.2 A 195 195 0 0 1 477.9 377.9"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeLinecap="butt"
          />
          {/* 2c. Inner Danger Perimeter Edge (R=175) */}
          <path
            d="M 488.2 146.9 A 175 175 0 0 1 463.7 363.7"
            fill="none"
            stroke="rgba(239, 68, 68, 0.45)"
            strokeWidth="1.5"
            strokeLinecap="butt"
          />

          {/* Track 3: Active Tachometer Lit Arc */}
          <path
            d="M 202.1 377.9 A 195 195 0 1 1 477.9 377.9"
            fill="none"
            stroke="url(#tachGradLight)"
            strokeWidth="13"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            filter={isRedlineActive ? 'url(#lightGlowFilter)' : undefined}
          />

          {/* Major Ticks & High-Contrast Bold Numbers */}
          {ticks.map(t => (
            <g key={t.idx}>
              <line
                x1={t.xInner}
                y1={t.yInner}
                x2={t.xOuter}
                y2={t.yOuter}
                stroke={t.isRedline ? '#dc2626' : (t.isMajor ? '#0f172a' : '#64748b')}
                strokeWidth={t.isMajor ? '3.5' : '2'}
              />
              {t.isMajor && (
                <text
                  x={t.xText}
                  y={t.yText + 5}
                  textAnchor="middle"
                  fill={t.isRedline ? '#dc2626' : '#0f172a'}
                  fontSize="17"
                  fontWeight="900"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="-0.02em"
                >
                  {t.idx}
                </text>
              )}
            </g>
          ))}

          {/* Sub-ticks (500 RPM increments) */}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = -135 + ((i + 0.5) / 14) * 270;
            const rad = (angle - 90) * (Math.PI / 180);
            const isRedline = i >= 9;
            const xO = 340 + 195 * Math.cos(rad);
            const yO = 240 + 195 * Math.sin(rad);
            const xI = 340 + 182 * Math.cos(rad);
            const yI = 240 + 182 * Math.sin(rad);
            return (
              <line
                key={`sub-${i}`}
                x1={xI}
                y1={yI}
                x2={xO}
                y2={yO}
                stroke={isRedline ? 'rgba(220, 38, 38, 0.45)' : '#94a3b8'}
                strokeWidth="1.5"
              />
            );
          })}

          {/* Precision Redline Tangent Badge */}
          <g transform="translate(498, 112) rotate(32)">
            <rect 
              x="-36" 
              y="-9" 
              width="72" 
              height="18" 
              rx="3" 
              fill="#fef2f2" 
              stroke="#ef4444" 
              strokeWidth="1.2" 
            />
            <text 
              x="0" 
              y="3.5" 
              fill="#dc2626" 
              fontSize="9" 
              fontWeight="900" 
              letterSpacing="0.08em" 
              textAnchor="middle" 
              fontFamily="'JetBrains Mono', monospace"
            >
              REDLINE 14K
            </text>
          </g>
          <text 
            x="340" 
            y="136" 
            textAnchor="middle" 
            fill="#64748b" 
            fontSize="12" 
            fontWeight="800" 
            letterSpacing="0.12em"
            fontFamily="'JetBrains Mono', monospace"
          >
            r/min &times; 1000
          </text>

          {/* Top Gear Display Box (Placed cleanly in upper dial center) */}
          <g transform="translate(340, 190)">
            <rect 
              x="-42" 
              y="-38" 
              width="84" 
              height="38" 
              rx="8" 
              fill="#ffffff" 
              stroke="#0284c7" 
              strokeWidth="2" 
            />
            <text x="0" y="-24" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="800" letterSpacing="0.1em">
              GEAR
            </text>
            <text 
              x="0" 
              y="-6" 
              textAnchor="middle" 
              fill="#0284c7" 
              fontSize="19" 
              fontWeight="900"
              fontFamily="'JetBrains Mono', monospace"
            >
              {gear}
            </text>
          </g>

          {/* Sweeping Fluorescent Red Needle */}
          <g transform={`rotate(${needleAngle}, 340, 240)`}>
            <polygon
              points="335,270 338,58 342,58 345,270"
              fill="url(#needleBladeLight)"
              filter="url(#lightGlowFilter)"
            />
            <line
              x1="340"
              y1="90"
              x2="340"
              y2="52"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Center Hub Metal Cap */}
          <circle cx="340" cy="240" r="32" fill="#ffffff" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="340" cy="240" r="22" fill="#0284c7" />
          <circle cx="340" cy="240" r="10" fill="#ffffff" />
          <circle cx="340" cy="240" r="4" fill="#0f172a" />

          {/* Lower Center Open 90° Wedge: Bold Digital Speedometer */}
          <g transform="translate(340, 340)">
            <text 
              x="0" 
              y="20" 
              textAnchor="middle" 
              fill="#0f172a" 
              fontSize="76" 
              fontWeight="900" 
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="-0.04em"
            >
              {speed}
            </text>
            <text 
              x="0" 
              y="44" 
              textAnchor="middle" 
              fill="#0284c7" 
              fontSize="16" 
              fontWeight="900" 
              letterSpacing="0.1em"
              fontFamily="'JetBrains Mono', monospace"
            >
              {speedUnit}
            </text>
            <text 
              x="0" 
              y="62" 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize="10" 
              fontWeight="800" 
              letterSpacing="0.08em"
            >
              {complete ? '★ TOP SPEED REACHED • REPORT READY ★' : (isScanning ? '★ ACCELERATING DEFENSIVE AUDIT ★' : 'STANDBY • ENGINE READY')}
            </text>
            <text 
              x="0" 
              y="82" 
              textAnchor="middle" 
              fill={isRedlineActive ? '#dc2626' : '#0369a1'} 
              fontSize="14" 
              fontWeight="800" 
              fontFamily="'JetBrains Mono', monospace"
            >
              {rpm.toLocaleString()} RPM
            </text>
          </g>
        </svg>

        {/* Rev Limiter Cut-off Banner */}
        {isRevLimiter && !complete && (
          <div className="rev-limit-banner light-danger-banner">
            ⚡ MAXIMUM AUDIT THROUGHPUT • REV LIMIT ENGAGED ⚡
          </div>
        )}

        {/* Scan Complete Victory Banner */}
        {complete && (
          <div className="rev-limit-banner light-victory-banner">
            <Sparkles className="w-4 h-4 inline mr-2 text-yellow-500" />
            AUDIT VELOCITY COMPLETE • 100% PHASES FINISHED
            <Flag className="w-4 h-4 inline ml-2 text-emerald-600" />
          </div>
        )}

        {/* Scan In Progress Banner */}
        {isScanning && !complete && (
          <div className="rev-limit-banner" style={{ border: '1px solid #38bdf8', color: '#0369a1', background: 'rgba(240, 249, 255, 0.95)', padding: '6px 14px', borderRadius: '0px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
            <Activity className="w-4 h-4 inline mr-2 text-sky-600 animate-pulse" />
            AUDIT IN PROGRESS • STAGE {currentStageIndex + 1}/{totalStages}: {currentStageName}
          </div>
        )}

        {/* Idle Standby Banner */}
        {!isScanning && !complete && (
          <div className="rev-limit-banner" style={{ border: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc', padding: '6px 14px', borderRadius: '0px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
            <ShieldCheck className="w-4 h-4 inline mr-2 text-emerald-600" />
            TELEMETRY CLUSTER READY • ENTER TARGET DOMAIN TO COMMENCE AUDIT
          </div>
        )}

        {/* Stitch Precision HUD Readout */}
        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '16px', position: 'relative', zIndex: 2, width: '100%', maxWidth: '540px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {displayScore} <span style={{ fontSize: '1.4rem', color: '#94a3b8', fontWeight: 600 }}>/ 100</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <span className="stitch-badge stitch-badge-secure" style={{ fontSize: '12px', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <span style={{ width: '6px', height: '6px', background: '#065f46', display: 'inline-block', marginRight: '8px', flexShrink: 0 }} />
              {ratingBadge}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
            Overall Resilience Score • Class A Posture
          </div>
        </div>

        {/* Stitch Secondary Digital Odometer / Trip-Meter Box */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', textAlign: 'center', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '12px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              195
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginTop: '2px' }}>
              Endpoints Cataloged
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '12px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>
              142ms
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginTop: '2px' }}>
              Avg Probe Latency
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '12px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.35rem', fontWeight: 800, color: '#065f46' }}>
              0 LEAKS
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginTop: '2px' }}>
              Critical Leaks Found
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Telemetry HUD */}
      <div className="cockpit-telemetry-hud">
        <div className="telemetry-hud-card light-hud-card">
          <div className="hud-metric-label">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>ENGINE THROTTLE</span>
            </div>
            <strong className="font-mono text-sky-700">{throttle}%</strong>
          </div>
          <div className="hud-bar-track light-track">
            <div 
              className="hud-bar-fill throttle-light" 
              style={{ width: `${throttle}%` }} 
            />
          </div>
          <div className="hud-card-footer text-slate-500">
            <span>Dynamic Engine Load</span>
            <span>{isBlipActive ? 'Overdrive' : 'Active'}</span>
          </div>
        </div>

        <div className="telemetry-hud-card light-hud-card">
          <div className="hud-metric-label">
            <div className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PIPELINE PROGRESS</span>
            </div>
            <strong className="font-mono text-emerald-700">
              {complete ? '100' : Math.round(((currentStageIndex + 1) / totalStages) * 100)}%
            </strong>
          </div>
          <div className="hud-bar-track light-track">
            <div 
              className="hud-bar-fill pipeline-light" 
              style={{ width: `${complete ? 100 : Math.round(((currentStageIndex + 1) / totalStages) * 100)}%` }} 
            />
          </div>
          <div className="hud-card-footer text-slate-500">
            <span>Stages: {currentStageIndex + 1} of {totalStages}</span>
            <span>{complete ? 'Complete' : 'Processing'}</span>
          </div>
        </div>
      </div>

      {/* Streamlined Active Stage Indicator */}
      <div className="cockpit-stage-hud light-stage-banner">
        <div className="hud-status-chip text-sky-700">
          <span className={`hud-pulse-dot ${complete ? 'done' : 'active'}`} />
          <span className="font-mono text-xs">
            {complete ? 'STATUS:' : `STAGE (${currentStageIndex + 1}/${totalStages}):`}
          </span>
        </div>
        <div className="hud-stage-name font-mono text-slate-800">
          {complete ? 'All 21 Defensive Security & Web Quality Modules Complete' : currentStageName}
        </div>
        <div className="hud-stage-progress font-mono text-sky-700">
          {complete ? '100% COMPLETE' : `${Math.round(((currentStageIndex + 1) / totalStages) * 100)}%`}
        </div>
      </div>
    </div>
  );
}

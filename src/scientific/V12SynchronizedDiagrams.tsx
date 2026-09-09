import React, { useState, useMemo } from 'react';
import { useEngineTelemetry, computeValveLifts, computeCylinderPressure, computePistonKinematics } from './EngineKinematicsBus';
import { Activity, Gauge, Cpu, Zap, Flame, Wind, ArrowRight } from 'lucide-react';

export type ChartViewTab = 'PV' | 'VALVES' | 'KINEMATICS';

interface V12SynchronizedDiagramsProps {
  cylinderOverride?: number;
  initialTab?: ChartViewTab;
  compact?: boolean;
}

export function V12SynchronizedDiagrams({
  cylinderOverride,
  initialTab = 'PV',
  compact = false
}: V12SynchronizedDiagramsProps) {
  const telemetry = useEngineTelemetry();
  const [activeTab, setActiveTab] = useState<ChartViewTab>(initialTab);

  const activeCylIdx = cylinderOverride ?? telemetry.focusedCylinder;
  const cylinderData = telemetry.cylinders.find(c => c.cylinderIndex === activeCylIdx) || telemetry.focusedTelemetry;
  const cycleDeg = cylinderData.cycleAngleDeg;

  // Precompute curve paths for static SVG polylines
  const { pvPolyline, intakePolyline, exhaustPolyline, dispPolyline, velPolyline } = useMemo(() => {
    const pvPts: string[] = [];
    const intakePts: string[] = [];
    const exhaustPts: string[] = [];
    const dispPts: string[] = [];
    const velPts: string[] = [];

    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * 720;
      const aRad = (a * Math.PI) / 180;

      // 1. PV curve
      const kin = computePistonKinematics(aRad, (600 * Math.PI * 2) / 60);
      const vNorm = 0.1 + (kin.positionMm / 76.4) * 0.88;
      const { pressureBar } = computeCylinderPressure(a);
      const pvX = 35 + ((vNorm - 0.1) / 0.9) * 225;
      const pvY = 122 - (Math.min(78, pressureBar) / 80) * 105;
      pvPts.push(`${pvX.toFixed(1)},${pvY.toFixed(1)}`);

      // 2. Valve curves (x: 30 to 260)
      const vX = 30 + (a / 720) * 230;
      const lifts = computeValveLifts(a);
      const inY = 120 - (lifts.intakeLiftMm / 12) * 98;
      const exY = 120 - (lifts.exhaustLiftMm / 12) * 98;
      intakePts.push(`${vX.toFixed(1)},${inY.toFixed(1)}`);
      exhaustPts.push(`${vX.toFixed(1)},${exY.toFixed(1)}`);

      // 3. Kinematic curves
      const dispY = 22 + (kin.positionMm / 76.4) * 98;
      dispPts.push(`${vX.toFixed(1)},${dispY.toFixed(1)}`);

      const normVel = (kin.velocityMs / 32); // -1 to 1
      const velY = 70 - normVel * 48;
      velPts.push(`${vX.toFixed(1)},${velY.toFixed(1)}`);
    }

    return {
      pvPolyline: pvPts.join(' '),
      intakePolyline: intakePts.join(' '),
      exhaustPolyline: exhaustPts.join(' '),
      dispPolyline: dispPts.join(' '),
      velPolyline: velPts.join(' ')
    };
  }, []);

  // Live cursor coordinates
  // PV Live Cursor
  const currentVNorm = 0.1 + (cylinderData.pistonPositionMm / 76.4) * 0.88;
  const livePvX = 35 + ((currentVNorm - 0.1) / 0.9) * 225;
  const livePvY = Math.max(16, Math.min(122, 122 - (Math.min(78, cylinderData.cylinderPressureBar) / 80) * 105));

  // Crank Timeline Cursor (for Valve Timing and Kinematics)
  const liveCrankX = 30 + (cycleDeg / 720) * 230;
  const liveIntakeY = 120 - (cylinderData.intakeLiftMm / 12) * 98;
  const liveExhaustY = 120 - (cylinderData.exhaustLiftMm / 12) * 98;
  const liveDispY = 22 + (cylinderData.pistonPositionMm / 76.4) * 98;
  const liveVelY = 70 - (cylinderData.pistonVelocityMs / 32) * 48;

  // Stroke Phase Badge Color
  const strokeColor = {
    INTAKE: '#38bdf8',       // Sky Blue
    COMPRESSION: '#eab308',  // Amber Yellow
    POWER: '#ef4444',        // Fiery Red
    EXHAUST: '#f97316'       // Orange
  }[cylinderData.stroke];

  return (
    <div className={`flex flex-col bg-slate-950/90 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-3 text-xs shadow-[0_0_35px_rgba(6,182,212,0.15)] font-mono select-none ${compact ? 'w-full' : 'w-80 md:w-88'}`}>
      
      {/* 1. Header & Cylinder Status */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
            C{activeCylIdx}
            <span className="absolute -top-1 -right-1 text-[7px] px-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
              {cylinderData.bank}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white tracking-wide">
              <span>CYLINDER {activeCylIdx}</span>
              <span className="text-[9px] text-cyan-400/70">({cylinderData.bank === 'L' ? 'Bank 1' : 'Bank 2'})</span>
            </div>
            <div className="text-[9px] text-cyan-400/60">
              Offset: {cylinderData.firingOffsetDeg}° | Cycle: {cycleDeg.toFixed(0)}°
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1"
            style={{
              backgroundColor: `${strokeColor}20`,
              borderColor: `${strokeColor}60`,
              color: strokeColor
            }}
          >
            {cylinderData.isFiring && <Zap size={10} className="text-amber-400 animate-pulse" />}
            <span>{cylinderData.stroke}</span>
          </div>
          <span className="text-[9px] text-cyan-300/70 mt-0.5 font-semibold">
            {telemetry.rpm.toFixed(0)} RPM
          </span>
        </div>
      </div>

      {/* 2. Chart View Tab Switcher */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-lg border border-cyan-500/20 mb-2 text-[9px] font-bold uppercase">
        <button
          onClick={() => setActiveTab('PV')}
          className={`py-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'PV'
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'text-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          <Activity size={11} />
          <span>P-V Indicator</span>
        </button>

        <button
          onClick={() => setActiveTab('VALVES')}
          className={`py-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'VALVES'
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'text-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          <Wind size={11} />
          <span>Valve Timing</span>
        </button>

        <button
          onClick={() => setActiveTab('KINEMATICS')}
          className={`py-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'KINEMATICS'
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'text-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          <Gauge size={11} />
          <span>Kinematics</span>
        </button>
      </div>

      {/* 3. Live SVG Chart Area */}
      <div className="relative bg-slate-950/90 rounded-lg p-2 border border-slate-800 shadow-inner">
        {/* TAB 1: P-V Indicator Diagram */}
        {activeTab === 'PV' && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Otto Cycle P-V Indicator</span>
              <span className="text-amber-400 font-bold">{cylinderData.cylinderPressureBar.toFixed(1)} bar</span>
            </div>
            <svg viewBox="0 0 280 140" className="w-full h-32 overflow-visible">
              {/* Axes and Grids */}
              <line x1="35" y1="122" x2="260" y2="122" stroke="#334155" strokeWidth="1" />
              <line x1="35" y1="18" x2="35" y2="122" stroke="#334155" strokeWidth="1" />
              <line x1="35" y1="70" x2="260" y2="70" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />
              <line x1="147" y1="18" x2="147" y2="122" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />

              <text x="260" y="134" fill="#64748b" fontSize="8" textAnchor="end">Vol (V)</text>
              <text x="32" y="24" fill="#64748b" fontSize="8" textAnchor="end">P (bar)</text>
              <text x="35" y="133" fill="#475569" fontSize="7">TDC</text>
              <text x="245" y="133" fill="#475569" fontSize="7">BDC</text>
              <text x="32" y="73" fill="#475569" fontSize="7" textAnchor="end">40</text>
              <text x="32" y="22" fill="#475569" fontSize="7" textAnchor="end">80</text>

              {/* Loop polyline */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.45"
                points={pvPolyline}
              />

              {/* Live Tracking Crosshair */}
              <line x1="35" y1={livePvY} x2={livePvX} y2={livePvY} stroke="#06b6d4" strokeDasharray="2,2" strokeWidth="1" opacity="0.6" />
              <line x1={livePvX} y1={livePvY} x2={livePvX} y2="122" stroke="#06b6d4" strokeDasharray="2,2" strokeWidth="1" opacity="0.6" />

              {/* Live Point */}
              <circle
                cx={livePvX}
                cy={livePvY}
                r={cylinderData.isFiring ? 6 : 4.5}
                fill={cylinderData.isFiring ? '#f59e0b' : '#22d3ee'}
                stroke="#ffffff"
                strokeWidth="1.5"
                className={cylinderData.isFiring ? 'animate-pulse' : ''}
              />
            </svg>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
              <span>Swept Volume: 541 cc</span>
              <span>Clearance: 50 cc</span>
              <span className="text-cyan-300 font-semibold">Cr: 11.8:1</span>
            </div>
          </div>
        )}

        {/* TAB 2: Valve Timing Diagram */}
        {activeTab === 'VALVES' && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-sky-300">Intake ({cylinderData.intakeLiftMm.toFixed(1)} mm)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-300">Exhaust ({cylinderData.exhaustLiftMm.toFixed(1)} mm)</span>
              </span>
            </div>

            <svg viewBox="0 0 280 140" className="w-full h-32 overflow-visible">
              {/* Strokes Background Bands */}
              <rect x="30" y="20" width="57.5" height="100" fill="#38bdf8" opacity="0.04" />
              <rect x="87.5" y="20" width="57.5" height="100" fill="#eab308" opacity="0.04" />
              <rect x="145" y="20" width="57.5" height="100" fill="#ef4444" opacity="0.04" />
              <rect x="202.5" y="20" width="57.5" height="100" fill="#f97316" opacity="0.04" />

              {/* Overlap Window Highlight around 0° / 720° */}
              <rect x="28" y="20" width="8" height="100" fill="#10b981" opacity="0.12" />
              <rect x="254" y="20" width="6" height="100" fill="#10b981" opacity="0.12" />

              {/* Stroke Labels */}
              <text x="58" y="32" fill="#38bdf8" opacity="0.6" fontSize="7" textAnchor="middle">INTAKE</text>
              <text x="116" y="32" fill="#eab308" opacity="0.6" fontSize="7" textAnchor="middle">COMP</text>
              <text x="173" y="32" fill="#ef4444" opacity="0.6" fontSize="7" textAnchor="middle">POWER</text>
              <text x="231" y="32" fill="#f97316" opacity="0.6" fontSize="7" textAnchor="middle">EXHAUST</text>

              {/* Axes */}
              <line x1="30" y1="120" x2="260" y2="120" stroke="#334155" strokeWidth="1" />
              <line x1="30" y1="20" x2="30" y2="120" stroke="#334155" strokeWidth="1" />
              <text x="30" y="132" fill="#475569" fontSize="7">0°</text>
              <text x="87.5" y="132" fill="#475569" fontSize="7" textAnchor="middle">180°</text>
              <text x="145" y="132" fill="#475569" fontSize="7" textAnchor="middle">360°</text>
              <text x="202.5" y="132" fill="#475569" fontSize="7" textAnchor="middle">540°</text>
              <text x="260" y="132" fill="#475569" fontSize="7" textAnchor="middle">720°</text>
              <text x="28" y="24" fill="#64748b" fontSize="7" textAnchor="end">12mm</text>

              {/* Curves */}
              <polyline fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" points={intakePolyline} />
              <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" points={exhaustPolyline} />

              {/* Live Scrub Cursor */}
              <line x1={liveCrankX} y1="20" x2={liveCrankX} y2="120" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              {cylinderData.intakeLiftMm > 0.1 && (
                <circle cx={liveCrankX} cy={liveIntakeY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              )}
              {cylinderData.exhaustLiftMm > 0.1 && (
                <circle cx={liveCrankX} cy={liveExhaustY} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
              )}
            </svg>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
              <span>Max Lift: 11.2 mm</span>
              <span className="text-emerald-400">Overlap: 25° Crank</span>
              <span>DOHC 4-Valves/Cyl</span>
            </div>
          </div>
        )}

        {/* TAB 3: Slider-Crank Kinematics Diagram */}
        {activeTab === 'KINEMATICS' && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-300">Stroke: {cylinderData.pistonPositionMm.toFixed(1)} mm</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-purple-300">Vel: {cylinderData.pistonVelocityMs.toFixed(1)} m/s</span>
              </span>
            </div>

            <svg viewBox="0 0 280 140" className="w-full h-32 overflow-visible">
              {/* Axes */}
              <line x1="30" y1="70" x2="260" y2="70" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="1" />
              <line x1="30" y1="120" x2="260" y2="120" stroke="#334155" strokeWidth="1" />
              <line x1="30" y1="20" x2="30" y2="120" stroke="#334155" strokeWidth="1" />

              <text x="28" y="24" fill="#475569" fontSize="7" textAnchor="end">TDC</text>
              <text x="28" y="73" fill="#475569" fontSize="7" textAnchor="end">0m/s</text>
              <text x="28" y="122" fill="#475569" fontSize="7" textAnchor="end">BDC</text>

              {/* Displacement Curve (Cyan) */}
              <polyline fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" points={dispPolyline} />

              {/* Velocity Curve (Purple) */}
              <polyline fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3,2" strokeLinejoin="round" points={velPolyline} />

              {/* Live Scrub Cursor */}
              <line x1={liveCrankX} y1="20" x2={liveCrankX} y2="120" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              <circle cx={liveCrankX} cy={liveDispY} r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
              <circle cx={liveCrankX} cy={liveVelY} r="3" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
            </svg>

            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
              <span>Bore: 95mm | Stroke: 76.4mm</span>
              <span className="text-amber-400 font-semibold">Accel: {Math.abs(cylinderData.pistonAccelerationG).toFixed(0)} G</span>
              <span>Rod: 145mm</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Telemetry Bar */}
      <div className="grid grid-cols-3 gap-1.5 mt-2 text-[9px]">
        <div className="bg-slate-900/60 p-1.5 rounded border border-cyan-500/15">
          <div className="text-cyan-400/70 truncate">Crank Angle</div>
          <div className="text-cyan-200 font-bold">{telemetry.crankAngleDeg.toFixed(0)}° / 720°</div>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-cyan-500/15">
          <div className="text-cyan-400/70 truncate">Mean Piston Spd</div>
          <div className="text-cyan-200 font-bold">{telemetry.meanPistonSpeedMs.toFixed(1)} m/s</div>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-cyan-500/15">
          <div className="text-cyan-400/70 truncate">Total Output</div>
          <div className="text-amber-300 font-bold">{telemetry.brakePowerHp.toFixed(0)} HP</div>
        </div>
      </div>
    </div>
  );
}

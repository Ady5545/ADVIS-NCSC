import React, { useState, useEffect } from 'react';
import {
  CameraPreset,
  CutawayMode,
  V12_CAMERA_PRESETS,
  V12_INSPECTION_CONFIG
} from '../../scientific/V12ScientificConfig';
import {
  EngineKinematicsBus,
  useEngineTelemetry,
  V12_FIRING_ORDER,
  V12_BANK_MAP
} from '../../scientific/EngineKinematicsBus';
import { V12SynchronizedDiagrams } from '../../scientific/V12SynchronizedDiagrams';
import {
  Camera,
  Layers,
  Gauge,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Flame,
  Wind,
  Compass,
  Tag,
  Crosshair
} from 'lucide-react';

export interface V12EngineControllerProps {
  // Camera
  onApplyCameraPreset: (preset: CameraPreset) => void;
  activeCameraPresetId?: string;

  // Cutaway
  xrayEnabled: boolean;
  blueprintEnabled: boolean;
  onSetCutawayMode: (mode: CutawayMode) => void;

  // Kinematics & Playback
  v12Rpm: number;
  onChangeRpm: (rpm: number) => void;
  isKinematicPlaying: boolean;
  onTogglePlaying: () => void;
  kinematicSpeed: number;
  onChangeSpeed: (speed: number) => void;
  kinematicAngleDeg: number;
  onScrubAngle?: (angleDeg: number) => void;

  // Selection & Cylinder
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  focusedCylinder: number;
  onSelectCylinder: (cylNum: number) => void;

  // Overlays
  showLabels: boolean;
  onToggleLabels: () => void;
  chargeFlowEnabled: boolean;
  onToggleChargeFlow: () => void;
  vectorsEnabled: boolean;
  onToggleVectors: () => void;
  isolatedComponentId: string | null;
  onToggleIsolate: (id: string | null) => void;

  // Sound / Audio
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function V12EngineController({
  onApplyCameraPreset,
  activeCameraPresetId = 'HERO',
  xrayEnabled,
  blueprintEnabled,
  onSetCutawayMode,
  v12Rpm,
  onChangeRpm,
  isKinematicPlaying,
  onTogglePlaying,
  kinematicSpeed,
  onChangeSpeed,
  kinematicAngleDeg,
  onScrubAngle,
  selectedComponentId,
  onSelectComponent,
  focusedCylinder,
  onSelectCylinder,
  showLabels,
  onToggleLabels,
  chargeFlowEnabled,
  onToggleChargeFlow,
  vectorsEnabled,
  onToggleVectors,
  isolatedComponentId,
  onToggleIsolate,
  soundEnabled,
  onToggleSound
}: V12EngineControllerProps) {
  const telemetry = useEngineTelemetry();
  const [showCharts, setShowCharts] = useState(true);
  const [isChartsMinimized, setIsChartsMinimized] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(activeCameraPresetId);

  // Derive cutaway mode
  const currentCutawayMode: CutawayMode = (() => {
    if (blueprintEnabled) return 'SECTION';
    if (xrayEnabled) return 'GLASS';
    return 'SOLID';
  })();

  const handleCameraPresetClick = (preset: CameraPreset) => {
    setActivePreset(preset.id);
    onApplyCameraPreset(preset);
  };

  const handleCylinderClick = (cylNum: number) => {
    onSelectCylinder(cylNum);
    // Also highlight corresponding component in 3D scene if available
    const bank = V12_BANK_MAP[cylNum];
    const compId = `piston_bank_${bank === 'L' ? '1' : '2'}_cyl_${((cylNum - 1) % 6) + 1}`;
    onSelectComponent(compId);
  };

  return (
    <div className="pointer-events-none select-none font-mono text-cyan-400">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP CENTER: CAMERA PRESETS & CUTAWAY CONTROL BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-40 flex flex-wrap items-center justify-center gap-2 max-w-4xl px-3">
        
        {/* Camera Presets Bar */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-2.5 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center gap-1">
          <div className="flex items-center gap-1.5 pr-2 border-r border-cyan-500/20 text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
            <Camera size={12} className="text-cyan-400" />
            <span className="hidden sm:inline">Camera:</span>
          </div>

          <div className="flex items-center gap-1">
            {V12_CAMERA_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleCameraPresetClick(preset)}
                  title={preset.description}
                  className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'border border-transparent bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-400/70 hover:text-cyan-200'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cutaway Mode Panel (Solid / Glass / Section) */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-2.5 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center gap-1">
          <div className="flex items-center gap-1.5 pr-2 border-r border-cyan-500/20 text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
            <Layers size={12} className="text-cyan-400" />
            <span className="hidden sm:inline">Cutaway:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetCutawayMode('SOLID')}
              title="Full PBR alloy, carbon fiber, and titanium exterior solid assembly"
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                currentCutawayMode === 'SOLID'
                  ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'border border-transparent bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-400/70 hover:text-cyan-200'
              }`}
            >
              Solid
            </button>

            <button
              onClick={() => onSetCutawayMode('GLASS')}
              title="Translucent acrylic cutaway revealing reciprocating pistons, conrods, and crankshaft"
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                currentCutawayMode === 'GLASS'
                  ? 'bg-sky-500/30 border border-sky-400 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                  : 'border border-transparent bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-400/70 hover:text-cyan-200'
              }`}
            >
              Glass
            </button>

            <button
              onClick={() => onSetCutawayMode('SECTION')}
              title="Technical blueprint schematic section with internal geometry paths"
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                currentCutawayMode === 'SECTION'
                  ? 'bg-purple-500/30 border border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'border border-transparent bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-400/70 hover:text-cyan-200'
              }`}
            >
              Section
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING RIGHT DOCK: SYNCHRONIZED REAL-TIME CHARTS
         ───────────────────────────────────────────────────────────── */}
      {showCharts && (
        <div className="absolute top-20 right-4 md:right-6 pointer-events-auto z-40 flex flex-col items-end transition-all">
          <div className="flex items-center justify-between bg-slate-950/90 border border-cyan-500/40 rounded-t-xl px-3 py-1.5 w-80 md:w-88 shadow-lg">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              <Activity size={12} className="text-cyan-400 animate-pulse" />
              <span>SYNCHRONIZED TELEMETRY</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsChartsMinimized(!isChartsMinimized)}
                className="text-cyan-400/60 hover:text-white p-1 transition-colors cursor-pointer"
                title={isChartsMinimized ? 'Expand diagram' : 'Minimize diagram'}
              >
                {isChartsMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              <button
                onClick={() => setShowCharts(false)}
                className="text-cyan-400/60 hover:text-rose-400 p-1 transition-colors cursor-pointer text-xs"
                title="Close diagram"
              >
                ✕
              </button>
            </div>
          </div>

          {!isChartsMinimized && (
            <div className="w-80 md:w-88 rounded-b-xl overflow-hidden border-x border-b border-cyan-500/30 shadow-2xl">
              <V12SynchronizedDiagrams cylinderOverride={focusedCylinder} compact />
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM COMMAND & KINEMATICS PLAYBACK CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-40 flex flex-col items-center gap-2 w-full max-w-2xl px-3">
        
        {/* A. FIRING ORDER TRACK (1 - 12 - 4 - 9 - 2 - 11 - 6 - 7 - 3 - 10 - 5 - 8) */}
        <div className="w-full bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px] text-cyan-400/70 border-b border-cyan-500/15 pb-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-300">
              <Zap size={11} className="text-amber-400" />
              <span>60° V12 FIRING ORDER TRACK (6.5L NA)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Bank 1 (L: 1-6)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Bank 2 (R: 7-12)</span>
              </span>
            </div>
          </div>

          {/* 12 Clickable Cylinder Chips */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
            {V12_FIRING_ORDER.map((cylNum, stepIdx) => {
              const cylData = telemetry.cylinders.find(c => c.cylinderIndex === cylNum);
              const isSelected = focusedCylinder === cylNum;
              const isFiring = cylData?.isFiring;
              const bank = V12_BANK_MAP[cylNum];
              const stroke = cylData?.stroke || 'INTAKE';

              return (
                <button
                  key={cylNum}
                  onClick={() => handleCylinderClick(cylNum)}
                  title={`Cylinder ${cylNum} (Bank ${bank}) - Stroke: ${stroke} - Click to focus chart & model`}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border transition-all cursor-pointer ${
                    isFiring
                      ? 'bg-amber-500/40 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse scale-105'
                      : isSelected
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/60 border-cyan-500/20 hover:bg-cyan-950/40 text-cyan-400/80 hover:text-cyan-200'
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-tight">
                    C{cylNum}
                  </div>
                  <div className="flex items-center gap-0.5 text-[7px] opacity-70">
                    <span>{bank}</span>
                    <span>•</span>
                    <span>{stroke.slice(0, 3)}</span>
                  </div>

                  {isFiring && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* B. RPM / PLAYBACK CONTROLLER & CYCLE SCRUBBER */}
        <div className="w-full bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2.5 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Play/Pause & Speed Mult */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTogglePlaying}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                  isKinematicPlaying
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                }`}
                title={isKinematicPlaying ? 'Pause engine rotation' : 'Start engine rotation'}
              >
                {isKinematicPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded-lg border border-cyan-500/20 text-[9px] font-bold">
                {[0.25, 0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onChangeSpeed(spd)}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer ${
                      kinematicSpeed === spd
                        ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                        : 'text-cyan-400/60 hover:text-cyan-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* RPM Slider & Presets */}
            <div className="flex-1 flex items-center gap-2.5 min-w-[220px]">
              <div className="text-[10px] text-cyan-300 font-bold tracking-wider min-w-[75px] text-right">
                {v12Rpm.toFixed(0)} <span className="text-[8px] text-cyan-400/60">RPM</span>
              </div>

              <input
                type="range"
                min="0"
                max="9000"
                step="50"
                value={v12Rpm}
                onChange={(e) => onChangeRpm(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer appearance-none"
              />

              {/* RPM Quick Presets */}
              <div className="hidden sm:flex items-center gap-1 text-[8px] font-bold">
                <button
                  onClick={() => onChangeRpm(600)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 cursor-pointer"
                  title="Idle speed (600 RPM)"
                >
                  Idle
                </button>
                <button
                  onClick={() => onChangeRpm(3000)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 cursor-pointer"
                  title="Cruising speed (3,000 RPM)"
                >
                  3K
                </button>
                <button
                  onClick={() => onChangeRpm(6750)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20 hover:border-cyan-400 text-amber-300 cursor-pointer"
                  title="Peak torque (6,750 RPM)"
                >
                  Peak
                </button>
                <button
                  onClick={() => onChangeRpm(8500)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-rose-500/40 hover:border-rose-400 text-rose-300 cursor-pointer"
                  title="Maximum power (8,500 RPM)"
                >
                  Redline
                </button>
              </div>
            </div>

            {/* Sound Toggle (if prop provided) */}
            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-cyan-500/20 text-cyan-400/50 hover:text-cyan-300'
                }`}
                title="Engine Acoustic Feedback"
              >
                <Volume2 size={13} />
              </button>
            )}
          </div>

          {/* Crank Cycle Scrubber (0° to 720°) */}
          {onScrubAngle && (
            <div className="flex items-center gap-2 pt-1 border-t border-cyan-500/10 text-[8px] text-cyan-400/70">
              <span className="min-w-[55px] font-bold">CRANK: {((kinematicAngleDeg % 720 + 720) % 720).toFixed(0)}°</span>
              <input
                type="range"
                min="0"
                max="720"
                step="1"
                value={((kinematicAngleDeg % 720 + 720) % 720)}
                onChange={(e) => onScrubAngle(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400 h-1 bg-slate-900 rounded cursor-pointer appearance-none"
              />
              <span className="text-cyan-400/50">4-STROKE 720°</span>
            </div>
          )}
        </div>

        {/* C. OVERLAY TOGGLE PANEL (Callouts, Charge, Arrows, Isolate, Charts) */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-center gap-1.5 text-[9px] font-bold uppercase">
          <span className="text-cyan-400/60 mr-1 text-[8px] tracking-wider">OVERLAYS:</span>

          {/* 1. Callouts (showLabels) */}
          <button
            onClick={onToggleLabels}
            className={`px-2 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${
              showLabels
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
            title="Toggle holographic 3D component callouts"
          >
            <Tag size={11} />
            <span>Callouts</span>
          </button>

          {/* 2. Charge Flow */}
          <button
            onClick={onToggleChargeFlow}
            className={`px-2 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${
              chargeFlowEnabled
                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
            title="Toggle air/fuel charge flow and combustion flame effects"
          >
            <Flame size={11} />
            <span>Charge</span>
          </button>

          {/* 3. Force / Kinematic Arrows */}
          <button
            onClick={onToggleVectors}
            className={`px-2 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${
              vectorsEnabled
                ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
            title="Toggle piston thrust and crankshaft torque force vectors"
          >
            <Compass size={11} />
            <span>Arrows</span>
          </button>

          {/* 4. Isolate Component */}
          <button
            onClick={() => onToggleIsolate(isolatedComponentId ? null : (selectedComponentId || 'crankshaft'))}
            className={`px-2 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${
              isolatedComponentId
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
            title="Isolate active component or crankshaft from surrounding block"
          >
            <Crosshair size={11} />
            <span>Isolate</span>
          </button>

          {/* 5. Synchronized Charts Panel */}
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`px-2 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${
              showCharts
                ? 'bg-sky-500/30 border-sky-400 text-sky-100 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
            title="Toggle real-time synchronized telemetry and thermodynamic charts"
          >
            <Activity size={11} />
            <span>Charts</span>
          </button>
        </div>
      </div>
    </div>
  );
}

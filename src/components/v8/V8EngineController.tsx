import React, { useMemo } from 'react';
import {
  Camera, Layers, Play, Pause, Volume2, VolumeX, Zap, Tag, Wind, Activity, RotateCcw
} from 'lucide-react';
import type { CameraPreset, CutawayMode } from '../scientific/V12ScientificConfig';

export interface V8EngineControllerProps {
  onApplyCameraPreset: (preset: CameraPreset) => void;
  xrayEnabled: boolean;
  blueprintEnabled: boolean;
  onSetCutawayMode: (mode: CutawayMode) => void;
  rpm: number;
  onChangeRpm: (rpm: number) => void;
  isKinematicPlaying: boolean;
  onTogglePlaying: () => void;
  kinematicSpeed: number;
  onChangeSpeed: (speed: number) => void;
  kinematicAngleDeg: number;
  onScrubAngle: (angleDeg: number) => void;
  focusedCylinder: number;
  onSelectCylinder: (cylinder: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  chargeFlowEnabled: boolean;
  onToggleChargeFlow: () => void;
  vectorsEnabled: boolean;
  onToggleVectors: () => void;
  isolatedComponentId: string | null;
  onToggleIsolate: (id: string | null) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const V8_CAMERA_PRESETS: CameraPreset[] = [
  { id: 'HERO', name: 'Hero 3/4', subtitle: 'Full engine assembly', description: 'Three-quarter view of the complete OHV V8, accessories, intake valley and headers.', theta: 0.78, phi: 1.02, radius: 8.4, target: [0, 0.04, 0] },
  { id: 'FRONT', name: 'Front Drive', subtitle: 'Belt & timing', description: 'View the crank damper, serpentine belt, alternator, water pump and timing cover.', theta: 0, phi: Math.PI / 2, radius: 8.0, target: [0, 0, -0.72] },
  { id: 'SIDE', name: 'Side Flank', subtitle: 'Ports & block skirt', description: 'Side profile showing the four-cylinder bank, OHV head, deep skirt and exhaust header.', theta: Math.PI / 2, phi: Math.PI / 2, radius: 9.0, target: [0, 0, 0] },
  { id: 'VALLEY', name: '90° Valley', subtitle: 'Intake manifold', description: 'High view into the 90-degree bank valley and central intake manifold.', theta: 0.05, phi: 0.38, radius: 7.2, target: [0, 0.34, 0] },
  { id: 'CYL', name: 'Cylinder Focus', subtitle: 'Piston & valve train', description: 'Close inspection view of an individual cylinder, piston, valves and rocker gear.', theta: 0.92, phi: 0.98, radius: 5.6, target: [-0.22, 0.2, 0.1] }
];

const FIRING_ORDER = [1, 8, 4, 3, 6, 5, 7, 2];
// Representative GM-style numbering map for the educational cross-plane V8 layout.
const CYLINDER_BANK: Record<number, 'L' | 'R'> = { 1: 'L', 2: 'R', 3: 'L', 4: 'R', 5: 'L', 6: 'R', 7: 'L', 8: 'R' };
const SPEEDS = [0.25, 0.5, 1, 2] as const;
const cyanButton = 'rounded-md border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all';
const inactiveButton = 'border-cyan-500/20 bg-slate-900/70 text-cyan-400/70 hover:border-cyan-400/50 hover:text-cyan-100';

function angleDistance(a: number, b: number) {
  const raw = Math.abs(((a - b) % 720 + 720) % 720);
  return Math.min(raw, 720 - raw);
}

export function V8EngineController(props: V8EngineControllerProps) {
  const {
    onApplyCameraPreset, xrayEnabled, blueprintEnabled, onSetCutawayMode,
    rpm, onChangeRpm, isKinematicPlaying, onTogglePlaying, kinematicSpeed, onChangeSpeed,
    kinematicAngleDeg, onScrubAngle, focusedCylinder, onSelectCylinder,
    showLabels, onToggleLabels, chargeFlowEnabled, onToggleChargeFlow,
    vectorsEnabled, onToggleVectors, isolatedComponentId, onToggleIsolate,
    selectedComponentId, onSelectComponent, soundEnabled, onToggleSound
  } = props;

  const currentCutawayMode: CutawayMode = blueprintEnabled ? 'SECTION' : xrayEnabled ? 'GLASS' : 'SOLID';
  const activeAngle = ((kinematicAngleDeg % 720) + 720) % 720;
  const activeFiringIndex = Math.round(activeAngle / 90) % 8;
  const activeFiringCylinder = FIRING_ORDER[activeFiringIndex];
  const cycleByCylinder = useMemo(() => {
    const data: Record<number, { stroke: string; isFiring: boolean; offset: number }> = {};
    FIRING_ORDER.forEach((cylinder, step) => {
      const offset = step * 90;
      const localCycle = ((activeAngle - offset) % 720 + 720) % 720;
      const stroke = localCycle < 180 ? 'PWR' : localCycle < 360 ? 'EXH' : localCycle < 540 ? 'INT' : 'CMP';
      data[cylinder] = { stroke, isFiring: isKinematicPlaying && angleDistance(activeAngle, offset) < 7, offset };
    });
    return data;
  }, [activeAngle, isKinematicPlaying]);

  const cutaway = (mode: CutawayMode) => onSetCutawayMode(mode);
  const toggleIsolate = () => {
    if (isolatedComponentId || selectedComponentId) {
      onToggleIsolate(null);
    } else if (selectedComponentId) {
      onToggleIsolate(selectedComponentId);
    }
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none font-mono text-cyan-100">
      {/* Camera presets use the same event bridge as the V12, but use V8-specific positions. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto max-w-[calc(100vw-24px)] overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-cyan-500/30 bg-slate-950/90 p-2 shadow-[0_0_22px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <span className="flex items-center gap-1.5 border-r border-cyan-500/20 pr-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400"><Camera size={12} /> Camera:</span>
          {V8_CAMERA_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => onApplyCameraPreset(preset)} title={preset.description} className={`${cyanButton} ${inactiveButton} hover:bg-cyan-950/60`}>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-[4.3rem] left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-slate-950/90 p-2 shadow-lg backdrop-blur-xl">
          <span className="flex items-center gap-1.5 border-r border-cyan-500/20 pr-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400"><Layers size={12} /> Cutaway:</span>
          {(['SOLID', 'GLASS', 'SECTION'] as const).map((mode) => (
            <button key={mode} onClick={() => cutaway(mode)} className={`${cyanButton} ${currentCutawayMode === mode ? 'border-cyan-400 bg-cyan-500/25 text-white shadow-[0_0_10px_rgba(6,182,212,0.25)]' : inactiveButton}`}>
              {mode === 'SECTION' ? 'Section' : mode === 'GLASS' ? 'Glass' : 'Solid'}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto flex w-full max-w-3xl flex-col items-center gap-2 px-3">
        {/* Eight-cylinder sequence; it is deliberately distinct from the twelve-cylinder telemetry. */}
        <div className="w-full rounded-xl border border-cyan-500/30 bg-slate-950/90 p-2 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-cyan-500/15 pb-1 text-[9px] text-cyan-400/75">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-300"><Zap size={11} className="text-amber-400" /><span>90° Cross-Plane V8 · Example Firing Sequence</span></div>
            <span className="hidden sm:inline">1–8–4–3–6–5–7–2 · 720° cycle</span>
          </div>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
            {FIRING_ORDER.map((cylinder) => {
              const phase = cycleByCylinder[cylinder];
              const chosen = focusedCylinder === cylinder;
              return (
                <button key={cylinder} onClick={() => onSelectCylinder(cylinder)} title={`Cylinder ${cylinder} · Bank ${CYLINDER_BANK[cylinder]} · ${phase.stroke} · Select cylinder`} className={`relative flex flex-col items-center justify-center rounded-lg border px-1 py-1.5 transition-all ${phase.isFiring ? 'scale-105 border-amber-400 bg-amber-500/35 text-white shadow-[0_0_14px_rgba(245,158,11,0.45)]' : chosen ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100' : 'border-cyan-500/20 bg-slate-900/70 text-cyan-400/80 hover:border-cyan-400/50'}`}>
                  <span className="text-[10px] font-bold">C{cylinder}</span>
                  <span className="flex items-center gap-1 text-[7px] opacity-80"><span>{CYLINDER_BANK[cylinder]}</span><span>·</span><span>{phase.stroke}</span></span>
                  {phase.isFiring && <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 rounded-xl border border-cyan-500/30 bg-slate-950/90 p-2.5 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button onClick={onTogglePlaying} title={isKinematicPlaying ? 'Pause V8 kinematics' : 'Start V8 kinematics'} className={`rounded-lg border p-2 transition-all ${isKinematicPlaying ? 'border-amber-400/60 bg-amber-500/20 text-amber-300' : 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'}`}>
                {isKinematicPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">Speed:</span>
              {SPEEDS.map((speed) => (
                <button key={speed} onClick={() => onChangeSpeed(speed)} className={`rounded-md border px-2 py-1 text-[9px] font-bold ${kinematicSpeed === speed ? 'border-cyan-400 bg-cyan-400/25 text-white' : 'border-cyan-500/20 text-cyan-400/75 hover:bg-cyan-950/50'}`}>{speed}x</button>
              ))}
            </div>

            <div className="flex min-w-[230px] flex-1 items-center gap-2 sm:max-w-[390px]">
              <label htmlFor="v8-rpm" className="whitespace-nowrap text-[10px] font-bold text-cyan-300">{Math.round(rpm).toLocaleString()} RPM</label>
              <input id="v8-rpm" aria-label="V8 engine RPM" type="range" min="600" max="7000" step="100" value={rpm} onChange={(event) => onChangeRpm(Number(event.currentTarget.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-cyan-400" />
              <span className="text-[8px] text-cyan-500/70">ILLUSTRATIVE</span>
            </div>

            <button onClick={onToggleSound} title={soundEnabled ? 'Mute V8 synthesized engine audio' : 'Enable V8 synthesized engine audio'} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[9px] font-bold uppercase ${soundEnabled ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />} {soundEnabled ? 'Audio on' : 'Audio off'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[8px] text-cyan-500/70">CRANK: {Math.round(activeAngle)}°</span>
            <input aria-label="V8 crank angle across a four-stroke 720 degree cycle" type="range" min="0" max="720" step="1" value={Math.round(activeAngle)} onChange={(event) => onScrubAngle(Number(event.currentTarget.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-amber-400" />
            <span className="whitespace-nowrap text-[8px] text-cyan-500/70">4-STROKE 720°</span>
            <button title="Reset crank angle to zero" onClick={() => onScrubAngle(0)} className="rounded border border-cyan-500/30 px-1.5 py-1 text-[8px] text-cyan-300 hover:bg-cyan-950/60"><RotateCcw size={10} /></button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-cyan-500/15 pt-2">
            <span className="mr-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyan-500/75"><Activity size={11} /> Overlays:</span>
            <button onClick={onToggleLabels} className={`rounded-md border px-2 py-1 text-[9px] font-bold ${showLabels ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-cyan-500/20 text-cyan-400/65'}`}><Tag size={10} className="mr-1 inline" />Callouts</button>
            <button onClick={onToggleChargeFlow} className={`rounded-md border px-2 py-1 text-[9px] font-bold ${chargeFlowEnabled ? 'border-amber-400/70 bg-amber-500/15 text-amber-200' : 'border-cyan-500/20 text-cyan-400/65'}`}><Wind size={10} className="mr-1 inline" />Charge flow</button>
            <button onClick={onToggleVectors} className={`rounded-md border px-2 py-1 text-[9px] font-bold ${vectorsEnabled ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-cyan-500/20 text-cyan-400/65'}`}>↗ Kinematic vectors</button>
            <button onClick={toggleIsolate} className={`rounded-md border px-2 py-1 text-[9px] font-bold ${isolatedComponentId ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-cyan-500/20 text-cyan-400/65'}`}>{isolatedComponentId ? 'Exit isolate' : 'Isolate selected'}</button>
            <span className="ml-auto hidden items-center gap-1 text-[8px] text-cyan-500/60 lg:flex">Active firing phase: C{activeFiringCylinder}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

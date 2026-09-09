import React, { useMemo } from 'react';
import { CyclePhase } from './ScientificSchema';
import { V12SynchronizedDiagrams } from './V12SynchronizedDiagrams';

export { V12SynchronizedDiagrams };

export interface DiagramContext {
  currentPhase?: CyclePhase;
  variables: Record<string, number>;
  parameters: Record<string, number>;
  modelId: string;
}

export type DiagramRenderer = (context: DiagramContext) => React.ReactNode;

class ScientificDiagramRegistryClass {
  private renderers: Map<string, DiagramRenderer> = new Map();

  constructor() {
    this.registerMechanicalOttoCycle();
    this.registerCardiovascularWiggers();
    this.registerV12Diagrams();
  }

  public register(key: string, renderer: DiagramRenderer) {
    this.renderers.set(key, renderer);
  }

  public get(key: string): DiagramRenderer | undefined {
    return this.renderers.get(key);
  }

  private registerMechanicalOttoCycle() {
    const renderOttoCycle: DiagramRenderer = ({ currentPhase, variables, parameters }) => {
      const crankAngle = variables['crankAngle'] ?? variables['cycleAngle'] ?? 0;
      const normalizedAngle = ((crankAngle % 720) + 720) % 720;
      const cylinderPressure = variables['cylinderPressure'] ?? 1.0;
      const intakeLift = variables['intakeValveLift'] ?? 0;
      const exhaustLift = variables['exhaustValveLift'] ?? 0;
      const pistonHeight = variables['pistonHeight_cyl1'] ?? 0;
      const sparkFiring = variables['sparkFiring'] === 1;

      // Normalized cylinder volume: 0.1 (TDC) to 1.0 (BDC)
      const norm = 0.55 - (pistonHeight / 0.88) * 0.45;
      const normalizedVolume = Math.max(0.12, Math.min(0.98, norm));

      // SVG indicator points for 720-degree loop
      const pvPoints: string[] = [];
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * 720;
        const v = 0.55 - Math.cos((a * Math.PI) / 180) * 0.42;
        let p = 1.0;

        if (a < 180) {
          p = 1.0;
        } else if (a < 360) {
          const cp = (a - 180) / 180;
          p = 1.0 + 23.0 * Math.pow(cp, 1.4);
        } else if (a < 540) {
          const pp = (a - 360) / 180;
          if (pp < 0.15) {
            p = 24.0 + 44.0 * Math.sin((pp / 0.15) * (Math.PI / 2));
          } else {
            p = 68.0 * Math.pow(1 - ((pp - 0.15) / 0.85) * 0.82, 2.5);
          }
        } else {
          const ep = (a - 540) / 180;
          p = 3.5 * Math.exp(-ep * 3) + 1.1;
        }

        const x = 30 + (v - 0.1) * (190 / 0.9);
        const y = 125 - (p / 75) * 110;
        pvPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const pvPointsStr = pvPoints.join(' ');

      const liveCursorX = 30 + (normalizedVolume - 0.1) * (190 / 0.9);
      const liveCursorY = Math.max(15, Math.min(125, 125 - (cylinderPressure / 75) * 110));

      return (
        <div className="flex flex-col gap-3.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-4 text-xs shadow-2xl w-80 pointer-events-auto select-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono font-semibold tracking-wider text-slate-200 uppercase">
                Thermodynamic Telemetry
              </span>
            </div>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              {parameters['rpm'] || 1800} RPM
            </span>
          </div>

          {/* Cycle Phase Banner */}
          {currentPhase && (
            <div
              className="rounded-lg p-2.5 border transition-colors duration-300"
              style={{
                backgroundColor: `${currentPhase.color}15`,
                borderColor: `${currentPhase.color}50`
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono font-bold uppercase tracking-wider text-[11px]"
                  style={{ color: currentPhase.color }}
                >
                  {currentPhase.name}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {normalizedAngle.toFixed(0)}° / 720°
                </span>
              </div>
              <p className="text-slate-300 text-[10px] leading-tight line-clamp-2">
                {currentPhase.description}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-700/40 pt-1">
                <span>{currentPhase.thermoState}</span>
                {sparkFiring && (
                  <span className="text-amber-400 font-bold animate-pulse">⚡ SPARK IGNITION</span>
                )}
              </div>
            </div>
          )}

          {/* Synchronized P-V Indicator Chart */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>P-V Indicator Diagram</span>
              <span className="text-cyan-400 font-bold">{cylinderPressure.toFixed(1)} bar</span>
            </div>
            <div className="relative bg-slate-950 rounded-lg p-1.5 border border-slate-800">
              <svg viewBox="0 0 240 140" className="w-full h-28 overflow-visible">
                <line x1="30" y1="125" x2="225" y2="125" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="15" x2="30" y2="125" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="70" x2="225" y2="70" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="127" y1="15" x2="127" y2="125" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />

                <text x="225" y="137" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">Vol (V)</text>
                <text x="26" y="22" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">P (bar)</text>
                <text x="30" y="135" fill="#475569" fontSize="7" fontFamily="monospace">TDC</text>
                <text x="205" y="135" fill="#475569" fontSize="7" fontFamily="monospace">BDC</text>

                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity="0.4"
                  points={pvPointsStr}
                />

                <circle
                  cx={liveCursorX}
                  cy={liveCursorY}
                  r="4.5"
                  fill={sparkFiring ? '#f59e0b' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <line
                  x1="30"
                  y1={liveCursorY}
                  x2={liveCursorX}
                  y2={liveCursorY}
                  stroke="#38bdf8"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <line
                  x1={liveCursorX}
                  y1={liveCursorY}
                  x2={liveCursorX}
                  y2="125"
                  stroke="#38bdf8"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>

          {/* Valvetrain Timing & Lift Bars */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Intake Lift</span>
                <span className="text-sky-400 font-bold">{intakeLift.toFixed(1)} mm</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-400 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (intakeLift / 11.2) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Exhaust Lift</span>
                <span className="text-amber-500 font-bold">{exhaustLift.toFixed(1)} mm</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (exhaustLift / 11.2) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };

    this.register('four_stroke_engine_v1', renderOttoCycle);
    this.register('v8_engine_scientific', renderOttoCycle);
    this.register('PV_DIAGRAM', renderOttoCycle);
  }

  private registerV12Diagrams() {
    const renderV12: DiagramRenderer = () => {
      return <V12SynchronizedDiagrams />;
    };

    this.register('v12_engine', renderV12);
    this.register('V12_DIAGRAM', renderV12);
    this.register('v12_powertrain', renderV12);
  }

  private registerCardiovascularWiggers() {
    const renderWiggers: DiagramRenderer = ({ currentPhase, variables, parameters }) => {
      const heartRate = parameters['heartRate'] || parameters['bpm'] || 72;
      const ventricularPressure = variables['ventricularPressure'] ?? 80;
      const aorticPressure = variables['aorticPressure'] ?? 100;
      const cardiacPhaseAngle = variables['cardiacPhaseAngle'] ?? variables['cycleAngle'] ?? 0;

      return (
        <div className="flex flex-col gap-3.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-4 text-xs shadow-2xl w-80 pointer-events-auto select-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono font-semibold tracking-wider text-slate-200 uppercase">
                Hemodynamic Telemetry
              </span>
            </div>
            <span className="font-mono text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
              {heartRate} BPM
            </span>
          </div>

          {/* Cardiac Phase Banner */}
          {currentPhase ? (
            <div
              className="rounded-lg p-2.5 border transition-colors duration-300"
              style={{
                backgroundColor: `${currentPhase.color}15`,
                borderColor: `${currentPhase.color}50`
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono font-bold uppercase tracking-wider text-[11px]"
                  style={{ color: currentPhase.color }}
                >
                  {currentPhase.name}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {cardiacPhaseAngle.toFixed(0)}° / 360°
                </span>
              </div>
              <p className="text-slate-300 text-[10px] leading-tight line-clamp-2">
                {currentPhase.description}
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">Ventricular Systole / Diastole Cycle</span>
            </div>
          )}

          {/* Pressures Comparison */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>LV Pressure</span>
                <span className="text-rose-400 font-bold">{ventricularPressure.toFixed(0)} mmHg</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (ventricularPressure / 140) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Aortic Pressure</span>
                <span className="text-red-400 font-bold">{aorticPressure.toFixed(0)} mmHg</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-400 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (aorticPressure / 140) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };

    this.register('human_cardiovascular_atlas', renderWiggers);
    this.register('human_anatomy_scientific', renderWiggers);
    this.register('WIGGERS_DIAGRAM', renderWiggers);
  }
}

export const ScientificDiagramRegistry = new ScientificDiagramRegistryClass();

interface SynchronizedDiagramsProps {
  currentPhase?: CyclePhase;
  variables: Record<string, number>;
  parameters: Record<string, number>;
  modelId: string;
}

export function SynchronizedDiagrams({
  currentPhase,
  variables,
  parameters,
  modelId
}: SynchronizedDiagramsProps) {
  // 1. Look up model-specific diagram renderer
  const customRenderer = ScientificDiagramRegistry.get(modelId);
  if (customRenderer) {
    return <>{customRenderer({ currentPhase, variables, parameters, modelId })}</>;
  }

  // 2. Generic fallback telemetry dashboard
  const varKeys = Object.keys(variables).slice(0, 6);
  const paramKeys = Object.keys(parameters);

  return (
    <div className="flex flex-col gap-3.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-4 text-xs shadow-2xl w-80 pointer-events-auto select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-semibold tracking-wider text-slate-200 uppercase">
            Scientific Telemetry
          </span>
        </div>
        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          LIVE
        </span>
      </div>

      {currentPhase && (
        <div
          className="rounded-lg p-2.5 border transition-colors duration-300"
          style={{
            backgroundColor: `${currentPhase.color}15`,
            borderColor: `${currentPhase.color}50`
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="font-mono font-bold uppercase tracking-wider text-[11px]"
              style={{ color: currentPhase.color }}
            >
              {currentPhase.name}
            </span>
          </div>
          <p className="text-slate-300 text-[10px] leading-tight line-clamp-2">
            {currentPhase.description}
          </p>
        </div>
      )}

      {varKeys.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Dynamic State Variables</span>
          <div className="grid grid-cols-2 gap-1.5">
            {varKeys.map((k) => (
              <div key={k} className="bg-slate-950/70 border border-slate-800 rounded p-1.5 font-mono text-[10px]">
                <div className="text-slate-400 truncate text-[9px]">{k}</div>
                <div className="text-cyan-300 font-bold">{typeof variables[k] === 'number' ? variables[k].toFixed(2) : String(variables[k])}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paramKeys.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Parameters</span>
          <div className="flex flex-wrap gap-1">
            {paramKeys.map((p) => (
              <span key={p} className="bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded text-[9px] font-mono">
                {p}: {parameters[p]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

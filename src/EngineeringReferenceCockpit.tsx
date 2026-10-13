import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronDown, Maximize2, Play, Ruler, Sparkles, X, Layers3 } from 'lucide-react';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { resolveObjectFidelity } from './cad/GeometryFidelity';
import { V12_CAMERA_PRESETS, V12_INSPECTION_CONFIG } from './scientific/V12ScientificConfig';
import { V12SynchronizedDiagrams } from './scientific/V12SynchronizedDiagrams';
import { useEngineTelemetry } from './scientific/EngineKinematicsBus';
import { VisualInspectionModal } from './VisualInspectionModal';
import { LearningStepPanel } from './learning/LearningStepPanel';
import { V8_FOUR_STROKE_LESSON } from './learning/V8FourStrokeLesson';
import { buildComponentHierarchy } from './scientific/AssemblyHierarchy';

export interface EngineeringReferenceCockpitProps {
  onClose: () => void;
  activeObject?: string | string[] | null;
  selectedComponentId?: string | null;
  componentTransforms?: Record<string, { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>;
  onUpdateComponentTransform?: (id: string, transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void;
  onSelectComponent?: (id: string | null) => void;
  explodedFactor?: number;
  onUpdateExplodedFactor?: (factor: number) => void;
  xrayEnabled?: boolean;
  onToggleXray?: () => void;
  blueprintEnabled?: boolean;
  onToggleBlueprint?: () => void;
  highlightedComponentId?: string | null;
  onHighlightComponent?: (id: string | null) => void;
  measurementMode?: boolean;
  onToggleMeasurement?: () => void;
  v12Rpm?: number;
  onUpdateV12Rpm?: (rpm: number) => void;
  v12Direction?: number;
  onToggleV12Direction?: () => void;
  isMagnifierFocused?: boolean;
  onToggleMagnifier?: () => void;
  lodTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  onUpdateLodTier?: (tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA') => void;
}

const phaseLegend = [
  ['AIR & FUEL', '#3b82f6'],
  ['COMPRESSED', '#94a3b8'],
  ['COMBUSTION', '#ef4444'],
  ['EXHAUST', '#64748b'],
] as const;

export function EngineeringReferenceCockpit({
  onClose,
  activeObject,
  selectedComponentId,
  onSelectComponent,
  explodedFactor = 0,
  onUpdateExplodedFactor,
  xrayEnabled = false,
  onToggleXray,
  blueprintEnabled = false,
  onToggleBlueprint,
  highlightedComponentId,
  onHighlightComponent,
  measurementMode = false,
  onToggleMeasurement,
  v12Rpm = 600,
  onUpdateV12Rpm,
  v12Direction = 1,
  onToggleV12Direction,
  isMagnifierFocused = false,
  onToggleMagnifier,
  lodTier = 'HIGH',
  onUpdateLodTier,
}: EngineeringReferenceCockpitProps) {
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showParts, setShowParts] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('HERO');
  const [showLearning, setShowLearning] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');

  const telemetry = useEngineTelemetry();
  const objectKey = Array.isArray(activeObject) ? activeObject[0] : activeObject;
  const objectMeta = objectKey ? SPATIAL_LIBRARY[objectKey] : null;
  const components = objectMeta?.components || [];
  const fidelity = objectMeta ? resolveObjectFidelity(objectMeta) : null;
  const isV12 = objectKey === 'v12_engine';
  const isV8 = Boolean(objectKey?.startsWith('v8_engine') || objectKey === 'v8_engine');

  const activeCylinder = telemetry.focusedCylinder || 1;
  const activeTelemetry =
    telemetry.cylinders.find((c) => c.cylinderIndex === activeCylinder) ||
    telemetry.focusedTelemetry;
  const stroke = activeTelemetry?.stroke || 'INTAKE';
  const pressure = activeTelemetry?.cylinderPressureBar ?? 0;
  const qualityLabel =
    fidelity?.authority === 'CAD_BREP'
      ? 'CAD CHECKS RECORDED'
      : fidelity?.authority === 'CAD_SOURCE_UNVERIFIED'
        ? 'CAD SOURCE · UNVERIFIED'
        : fidelity?.authority === 'GLTF_ASSET'
          ? 'GLTF / GLB'
          : 'EDUCATIONAL GEOMETRY';

  const componentHierarchy = useMemo(() => buildComponentHierarchy(components), [components]);
  const componentRows = useMemo(() => {
    const rows: Array<{ component: typeof components[number]; depth: number }> = [];
    const append = (nodes: typeof componentHierarchy.roots, depth: number) => {
      for (const node of nodes) {
        rows.push({ component: node.component, depth });
        append(node.children, depth + 1);
      }
    };
    append(componentHierarchy.roots, 0);
    return rows;
  }, [componentHierarchy, components]);
  const visibleComponents = useMemo(() => {
    const query = componentSearch.trim().toLowerCase();
    if (!query) return componentRows;
    return componentRows.filter(({ component }) =>
      [component.id, component.name, component.description, component.category || '']
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [componentRows, componentSearch]);
  const selectedComponent = components.find((component) => component.id === selectedComponentId);

  const applyPreset = (presetId: string) => {
    const preset = V12_CAMERA_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    setActivePreset(preset.id);
    window.dispatchEvent(new CustomEvent('advis-camera-preset', { detail: preset }));
  };

  useEffect(() => {
    const preset = V12_CAMERA_PRESETS.find((entry) => entry.id === 'HERO');
    if (!preset) return;
    window.dispatchEvent(new CustomEvent('advis-camera-preset', { detail: preset }));
  }, [objectKey]);

  const modeLabel = xrayEnabled ? 'GLASS' : blueprintEnabled ? 'BLUEPRINT' : 'SOLID';

  return (
    <>
      <div className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden font-mono text-slate-800">
        <div className="absolute inset-0 bg-[#f4f5f6]/86 backdrop-blur-[1px]" />

        {/* Header */}
        <div className="absolute top-4 left-5 right-5 flex items-start justify-between gap-4">
          <div className="pointer-events-auto min-w-[250px]">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.20em] uppercase text-slate-500 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              ADVIS / ENGINEERING STUDY
            </div>
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">{objectMeta?.name || 'Spatial Engineering Model'}</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mt-1">
              {objectMeta?.category || 'SPATIAL SYSTEM'} · {qualityLabel}
            </div>
          </div>

          <div className="flex items-start gap-8">
            <div className="hidden md:flex flex-col items-end pt-1">
              <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                {phaseLegend.map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto w-9 h-9 rounded-full border border-slate-300 bg-white/90 text-slate-600 hover:text-slate-900 hover:border-slate-500 transition-all flex items-center justify-center shadow-sm"
              aria-label="Exit engineering study"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Left diagnostics */}
        <div className="absolute left-5 top-24 w-[210px] hidden md:flex flex-col gap-3 pointer-events-auto">
          <div className="bg-white/88 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.08)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.16em] text-slate-400">Live speed / rev min</div>
            {isV12 ? (
              <div className="text-4xl leading-none font-semibold text-slate-900 mt-1">{Math.round(v12Rpm)}</div>
            ) : (
              <div className="text-3xl leading-none font-semibold text-slate-900 mt-1">ONLINE</div>
            )}
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-slate-400">
              <span>{isV12 ? 'REV / MIN' : 'OBJECT STATE'}</span>
              <span>{qualityLabel}</span>
            </div>
          </div>

          {isV12 ? (
            <>
              <div className="bg-white/88 border border-slate-300 shadow-sm p-3">
                <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-2">Slider · Crank</div>
                <div className="h-[72px] relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-slate-300" />
                  <div className="absolute left-[47px] top-[36px] w-11 h-px bg-slate-900 origin-left" style={{ transform: 'rotate(-27deg)' }} />
                  <div className="absolute left-[28px] top-[22px] w-2 h-2 rounded-full border-2 border-rose-500 bg-white" />
                  <div className="absolute left-[89px] top-[9px] h-9 w-px bg-slate-400" />
                  <div className="absolute left-[85px] top-[44px] w-16 h-px bg-slate-300" />
                  <div className="absolute right-0 top-2 text-[8px] text-slate-400 uppercase">after TDC</div>
                  <div className="absolute right-0 bottom-2 text-[8px] text-slate-400 uppercase">stroke</div>
                </div>
              </div>

              <div className="bg-white/88 border border-slate-300 shadow-sm p-3">
                <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-2">Cross-plane crank</div>
                <div className="grid grid-cols-3 gap-1.5 place-items-center">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full border ${i === 3 ? 'border-rose-500 bg-rose-100' : 'border-slate-400 bg-white'}`} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/88 border border-slate-300 shadow-sm p-3">
              <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Assembly profile</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div><div className="text-slate-400">PARTS</div><div className="text-slate-900 font-semibold">{components.length}</div></div>
                <div><div className="text-slate-400">STATUS</div><div className="text-emerald-600 font-semibold">{objectMeta?.modelStatus || 'READY'}</div></div>
                <div><div className="text-slate-400">MODE</div><div className="text-slate-900 font-semibold">{modeLabel}</div></div>
                <div><div className="text-slate-400">LOD</div><div className="text-slate-900 font-semibold">{lodTier}</div></div>
              </div>
            </div>
          )}
        </div>

        {/* Right telemetry */}
        <div className="absolute top-24 right-5 w-[290px] md:w-[325px] max-h-[66vh] pointer-events-auto overflow-y-auto flex flex-col gap-2">
          <div className="bg-white/92 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
            <button
              onClick={() => setShowTelemetry((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-200"
            >
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-rose-500" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Active telemetry</span>
              </div>
              <ChevronDown size={14} className={showTelemetry ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {showTelemetry && (
              <div className="p-3">
                {isV12 ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Cylinder {activeCylinder} · Bank {activeTelemetry?.bank || 'L'}</div>
                        <div className="text-xl font-semibold text-slate-900">{stroke}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-[0.12em] text-slate-400">CRANK</div>
                        <div className="text-lg font-semibold text-slate-900">{Math.round(activeTelemetry?.cycleAngleDeg || 0)}°</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-[10px]">
                      <div><div className="text-slate-400 uppercase">Chamber pressure</div><div className="font-semibold text-slate-900">{pressure.toFixed(1)} bar</div></div>
                      <div><div className="text-slate-400 uppercase">Piston position</div><div className="font-semibold text-slate-900">{activeTelemetry?.pistonPositionMm?.toFixed(1)} mm</div></div>
                      <div><div className="text-slate-400 uppercase">Intake lift</div><div className="font-semibold text-slate-900">{activeTelemetry?.intakeLiftMm?.toFixed(1)} mm</div></div>
                      <div><div className="text-slate-400 uppercase">Exhaust lift</div><div className="font-semibold text-slate-900">{activeTelemetry?.exhaustLiftMm?.toFixed(1)} mm</div></div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div><div className="text-slate-400 uppercase">Parts</div><div className="text-lg font-semibold">{components.length}</div></div>
                    <div><div className="text-slate-400 uppercase">Authority</div><div className="text-lg font-semibold">{qualityLabel}</div></div>
                    <div><div className="text-slate-400 uppercase">Scale</div><div className="text-lg font-semibold">{objectMeta?.defaultScale?.toFixed(2) || '1.00'}</div></div>
                    <div><div className="text-slate-400 uppercase">Selection</div><div className="text-lg font-semibold">{selectedComponentId ? '1' : '0'}</div></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isV12 && showCharts && (
            <div className="bg-white/92 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-700">Synchronized diagrams</div>
                <button onClick={() => setShowCharts(false)} className="text-slate-400 hover:text-slate-900"><X size={13} /></button>
              </div>
              <div className="max-h-[290px] overflow-y-auto">
                <V12SynchronizedDiagrams cylinderOverride={activeCylinder} compact />
              </div>
            </div>
          )}

          {showLearning && isV8 && (
            <LearningStepPanel
              lesson={V8_FOUR_STROKE_LESSON}
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={onSelectComponent}
              onHighlightComponent={onHighlightComponent}
            />
          )}
        </div>

        {/* Parts drawer */}
        {showParts && (
          <div className="absolute left-5 top-[24%] w-[250px] max-h-[50vh] bg-white/95 border border-slate-300 shadow-xl pointer-events-auto overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"><Layers3 size={13} /> Components</div>
              <button onClick={() => setShowParts(false)}><X size={13} /></button>
            </div>
            <div className="p-2 border-b border-slate-200">
              <input
                type="search"
                value={componentSearch}
                onChange={(event) => setComponentSearch(event.target.value)}
                placeholder="Search name, function, or ID…"
                aria-label="Search model components"
                className="w-full border border-slate-300 px-2 py-1.5 text-[10px] outline-none focus:border-rose-500"
              />
            </div>
            {componentHierarchy.issues.length > 0 && (
              <div role="status" className="px-3 py-2 text-[9px] leading-relaxed text-amber-800 bg-amber-50 border-b border-amber-200">
                Component hierarchy metadata needs review ({componentHierarchy.issues.length} issue{componentHierarchy.issues.length === 1 ? '' : 's'}). The listed parts remain available.
              </div>
            )}
            <div className="p-2 max-h-[33vh] overflow-y-auto space-y-1">
              {visibleComponents.length === 0 && <p className="px-2 py-3 text-[10px] text-slate-500">No components match this search.</p>}
              {visibleComponents.map(({ component, depth }) => {
                const active = selectedComponentId === component.id;
                return (
                  <button
                    key={component.id}
                    onClick={() => {
                      onSelectComponent?.(component.id);
                      onHighlightComponent?.(component.id);
                    }}
                    style={{ paddingLeft: `${8 + depth * 12}px` }}
                    aria-pressed={active}
                    className={`w-full text-left px-2 py-1.5 border transition-all ${active ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold truncate">{component.name}</span>
                      <span className="text-[8px] text-slate-400">{component.shape}</span>
                    </div>
                    <div className="text-[8px] text-slate-400 truncate mt-0.5">{component.description}</div>
                  </button>
                );
              })}
            </div>
            {selectedComponent && (
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500 mb-1">Selected component</div>
                <div className="text-[11px] font-semibold">{selectedComponent.name}</div>
                <p className="text-[10px] leading-relaxed mt-1">{selectedComponent.description || 'No description supplied.'}</p>
                <dl className="mt-2 space-y-1 text-[9px]">
                  <div className="flex gap-2"><dt className="text-slate-500">Material</dt><dd>{selectedComponent.engineeringDetails?.material || 'Not specified'}</dd></div>
                  <div className="flex gap-2"><dt className="text-slate-500">Weight</dt><dd>{selectedComponent.engineeringDetails?.weight || 'Not specified'}</dd></div>
                  <div className="flex gap-2"><dt className="text-slate-500">Dimensions</dt><dd>Not specified with authoritative units</dd></div>
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Bottom-left playback */}
        <div className="absolute left-5 bottom-5 w-[240px] bg-white/94 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.10)] pointer-events-auto">
          <div className="flex items-center justify-between px-3 pt-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400">{isV12 ? 'Engine speed' : 'Model playback'}</div>
            <div className="text-[10px] font-semibold text-slate-900">{isV12 ? Math.round(v12Rpm) + ' RPM' : 'READY'}</div>
          </div>
          <div className="px-3 pt-2 flex items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('advis-toggle-kinematics'))}
              className="w-8 h-8 border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center"
              title="Toggle playback"
            >
              <Play size={13} />
            </button>
            {[0.25, 0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => window.dispatchEvent(new CustomEvent('advis-kinematic-speed', { detail: speed }))}
                className="px-2 py-1.5 border border-slate-200 text-[9px] text-slate-500 hover:text-slate-900 hover:border-slate-400"
              >
                {speed}x
              </button>
            ))}
          </div>
          {isV12 && onUpdateV12Rpm && (
            <>
              <div className="px-3 pt-2 pb-1">
                <input type="range" min={0} max={9000} step={50} value={v12Rpm} onChange={(e) => onUpdateV12Rpm(Number(e.target.value))} className="w-full accent-rose-500" />
              </div>
              <div className="flex items-center gap-1 px-3 pb-3 text-[8px]">
                {[600, 3000, 6750, 8500].map((rpm) => (
                  <button key={rpm} onClick={() => onUpdateV12Rpm(rpm)} className="px-1.5 py-0.5 border border-slate-200 hover:border-rose-400">
                    {rpm === 600 ? 'IDLE' : rpm >= 8000 ? 'REDLINE' : rpm / 1000 + 'K'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom center firing track */}
        {isV12 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-5 w-[min(560px,50vw)] bg-white/92 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.10)] pointer-events-auto">
            <div className="px-3 pt-2 text-[9px] uppercase tracking-[0.16em] text-slate-400">720° firing order · click to track</div>
            <div className="px-3 py-2 grid grid-cols-12 gap-1">
              {V12_INSPECTION_CONFIG.firingTrack?.sequence.map((cylinder) => {
                const active = cylinder === activeCylinder;
                const firing = telemetry.cylinders.find((c) => c.cylinderIndex === cylinder)?.isFiring;
                return (
                  <button
                    key={cylinder}
                    onClick={() => window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum: cylinder } }))}
                    className={`h-8 border text-[9px] font-semibold transition-all ${firing ? 'bg-rose-50 border-rose-500 text-rose-700' : active ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-400 text-slate-500'}`}
                  >
                    {cylinder}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom-right interaction deck */}
        <div className="absolute right-5 bottom-5 w-[330px] pointer-events-auto">
          <div className="bg-white/94 border border-slate-300 shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
            <div className="px-3 pt-2 text-[9px] uppercase tracking-[0.15em] text-slate-400">Camera</div>
            <div className="grid grid-cols-5 gap-1 p-2">
              {(isV12 ? V12_CAMERA_PRESETS : V12_CAMERA_PRESETS.slice(0, 3)).map((preset) => (
                <button key={preset.id} onClick={() => applyPreset(preset.id)} className={`px-1.5 py-1.5 border text-[8px] uppercase tracking-[0.10em] ${activePreset === preset.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'}`}>
                  {preset.id}
                </button>
              ))}
            </div>

            <div className="px-3 text-[9px] uppercase tracking-[0.15em] text-slate-400">Surface view</div>
            <div className="grid grid-cols-3 gap-1 p-2">
              <button onClick={() => { if (xrayEnabled) onToggleXray?.(); if (blueprintEnabled) onToggleBlueprint?.(); }} className={`py-1.5 border text-[9px] ${modeLabel === 'SOLID' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>SOLID</button>
              <button onClick={() => { if (!xrayEnabled) onToggleXray?.(); if (blueprintEnabled) onToggleBlueprint?.(); }} className={`py-1.5 border text-[9px] ${modeLabel === 'GLASS' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>GLASS</button>
              <button onClick={() => { if (!blueprintEnabled) onToggleBlueprint?.(); if (xrayEnabled) onToggleXray?.(); }} className={`py-1.5 border text-[9px] ${modeLabel === 'BLUEPRINT' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`} title="Wireframe blueprint view; this is not a geometric section plane">BLUEPRINT</button>
            </div>

            <div className="px-3 text-[9px] uppercase tracking-[0.15em] text-slate-400">Overlays</div>
            <div className="grid grid-cols-5 gap-1 p-2">
              <button onClick={() => setShowParts((v) => !v)} className="py-1.5 border border-slate-200 hover:border-slate-400 text-[8px] uppercase">Parts</button>
              <button onClick={() => setShowCharts((v) => !v)} className="py-1.5 border border-slate-200 hover:border-slate-400 text-[8px] uppercase">Charts</button>
              <button onClick={() => onHighlightComponent?.(highlightedComponentId ? null : selectedComponentId || components[0]?.id || null)} className="py-1.5 border border-slate-200 hover:border-slate-400 text-[8px] uppercase">Callout</button>
              <button onClick={() => onToggleMagnifier?.()} className={`py-1.5 border text-[8px] uppercase ${isMagnifierFocused ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>Isolate</button>
              {isV8 && <button onClick={() => setShowLearning((value) => !value)} aria-pressed={showLearning} className={`py-1.5 border text-[8px] uppercase ${showLearning ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>Learn</button>}
            </div>
            <div className="px-2 pb-2 grid grid-cols-5 gap-1">
              <button onClick={() => onToggleMeasurement?.()} className={`py-1.5 border text-[8px] ${measurementMode ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}><Ruler size={11} className="mx-auto" /></button>
              <button onClick={() => onUpdateLodTier?.('ULTRA')} className={`py-1.5 border text-[8px] ${lodTier === 'ULTRA' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}><Sparkles size={11} className="mx-auto" /></button>
              <button onClick={() => onUpdateExplodedFactor?.(explodedFactor > 0.05 ? 0 : 1)} className={`py-1.5 border text-[8px] ${explodedFactor > 0.05 ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`} title="Toggle assembled/exploded layout" aria-label={explodedFactor > 0.05 ? 'Reassemble model' : 'Explode model'}><Maximize2 size={11} className="mx-auto" /></button>
              <button onClick={onToggleV12Direction} className="py-1.5 border border-slate-200 text-[8px]">DIR</button>
              <button onClick={() => setInspectionOpen(true)} className="py-1.5 border border-slate-200 text-[8px]">REPORT</button>
            </div>
            <div className="px-3 pb-3 border-t border-slate-200">
              <div className="flex items-center justify-between pt-2 text-[9px] uppercase tracking-[0.12em] text-slate-500">
                <label htmlFor="advis-explosion-factor">Exploded assembly</label>
                <span className="font-semibold text-slate-900">{Math.round(Math.max(0, Math.min(1, Number.isFinite(explodedFactor) ? explodedFactor : 0)) * 100)}%</span>
              </div>
              <input
                id="advis-explosion-factor"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={Math.max(0, Math.min(1, Number.isFinite(explodedFactor) ? explodedFactor : 0))}
                onChange={(event) => onUpdateExplodedFactor?.(Number(event.target.value))}
                aria-label="Exploded assembly factor"
                className="w-full accent-rose-500 mt-1"
              />
              <div className="grid grid-cols-4 gap-1 mt-1">
                <button onClick={() => onUpdateExplodedFactor?.(0)} className="border border-slate-200 py-1 text-[8px] hover:border-rose-400">Reassemble</button>
                <button onClick={() => onUpdateExplodedFactor?.(Math.max(0, Math.round((explodedFactor - 0.1) * 100) / 100))} className="border border-slate-200 py-1 text-[8px] hover:border-rose-400" aria-label="Step explosion backward">−10%</button>
                <button onClick={() => onUpdateExplodedFactor?.(Math.min(1, Math.round((explodedFactor + 0.1) * 100) / 100))} className="border border-slate-200 py-1 text-[8px] hover:border-rose-400" aria-label="Step explosion forward">+10%</button>
                <button onClick={() => onUpdateExplodedFactor?.(1)} className="border border-slate-200 py-1 text-[8px] hover:border-rose-400">Explode</button>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[8px] text-right uppercase tracking-[0.14em] text-slate-400">
            scroll to zoom · drag to orbit · {modeLabel.toLowerCase()} inspection
          </div>
        </div>

        {/* Mobile */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 md:hidden pointer-events-auto w-[92vw]">
          <div className="bg-white/95 border border-slate-300 shadow-lg p-2 grid grid-cols-5 gap-1">
            {V12_CAMERA_PRESETS.map((preset) => (
              <button key={preset.id} onClick={() => applyPreset(preset.id)} className="py-2 border border-slate-200 text-[9px]">
                {preset.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VisualInspectionModal
        isOpen={inspectionOpen}
        onClose={() => setInspectionOpen(false)}
        activeObjectKey={objectKey || null}
      />
    </>
  );
}

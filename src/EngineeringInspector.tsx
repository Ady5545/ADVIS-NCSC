import React, { useState } from 'react';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { Cpu, Shield, Layers, Wrench, FileText, CheckCircle, AlertTriangle, Zap, Database } from 'lucide-react';

interface EngineeringInspectorProps {
  activeObject?: string | string[] | null;
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
  componentTransforms?: Record<string, { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }>;
  onUpdateComponentTransform?: (id: string, transform: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) => void;
}

export const EngineeringInspector: React.FC<EngineeringInspectorProps> = ({ 
  activeObject, 
  selectedComponentId: externalSelectedId, 
  onSelectComponent,
  componentTransforms,
  onUpdateComponentTransform
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'components' | 'limits' | 'maintenance'>('metadata');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const selectedComponentId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const setSelectedComponentId = (id: string | null) => {
    if (onSelectComponent) {
      onSelectComponent(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  const objectKey = Array.isArray(activeObject) ? activeObject[0] : activeObject;
  const objectMeta = objectKey ? SPATIAL_LIBRARY[objectKey] : null;
  const engMeta = objectMeta?.engineeringMetadata;
  const components = objectMeta?.components || [];

  const selectedComp = components.find(c => c.id === selectedComponentId) || components[0];

  if (!objectMeta) {
    return (
      <div className="bg-slate-950/80 border border-cyan-500/30 p-6 rounded-xl backdrop-blur-md text-cyan-400 font-mono flex flex-col items-center justify-center gap-3">
        <Database className="w-8 h-8 text-cyan-500/50 animate-pulse" />
        <div className="text-sm font-bold tracking-wider">NO ENGINEERING OBJECT LOADED</div>
        <p className="text-xs text-cyan-400/60 text-center max-w-sm">
          Select an engineering model from the spatial library or voice command to initialize telemetry and component inspection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl backdrop-blur-xl p-4 md:p-6 text-cyan-300 font-mono shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col gap-4 max-h-[75vh] w-full max-w-4xl pointer-events-auto overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-300">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-cyan-500/70 tracking-widest uppercase">Engineering Inspector // {objectKey}</div>
            <h2 className="text-base font-bold text-cyan-100 tracking-wide">{objectMeta.name}</h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-cyan-500/30 text-xs">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'metadata' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-500/60 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-cyan-400/70 hover:text-cyan-200'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'components' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-500/60 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-cyan-400/70 hover:text-cyan-200'}`}
          >
            Components
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'limits' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-500/60 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-cyan-400/70 hover:text-cyan-200'}`}
          >
            Limits
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'maintenance' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-500/60 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-cyan-400/70 hover:text-cyan-200'}`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="overflow-y-auto pr-2 flex-1 space-y-4 max-h-[50vh]">
        {activeTab === 'metadata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Architectural Summary
              </div>
              <p className="text-xs text-cyan-300/80 leading-relaxed">{objectMeta.description}</p>
              {engMeta && (
                <div className="pt-2 border-t border-cyan-500/20 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-400/60">Assembly Type:</span>
                    <span className="font-bold text-cyan-200">{engMeta.assemblyType || 'Standard Assembly'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-400/60">Total Weight:</span>
                    <span className="font-bold text-cyan-200">{engMeta.totalWeight || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-400/60">Design Standard:</span>
                    <span className="font-bold text-cyan-200">{engMeta.designStandard || 'ISO Compliant'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Design Purpose & Intent
              </div>
              <p className="text-xs text-cyan-300/80 leading-relaxed">
                {engMeta?.designPurpose || objectMeta.educationalInformation?.overview || 'No additional engineering design statement provided.'}
              </p>
              <div className="pt-2 border-t border-cyan-500/20">
                <div className="text-[10px] text-cyan-400/60 uppercase tracking-wider mb-1">Key Subsystem Features:</div>
                <div className="flex flex-wrap gap-1.5">
                  {objectMeta.educationalInformation?.keyFeatures?.map((feat, idx) => (
                    <span key={idx} className="bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] text-cyan-300">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Component Selector List */}
            <div className="bg-slate-900/60 border border-cyan-500/20 p-3 rounded-xl space-y-2 flex flex-col">
              <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold">Subassemblies & Parts ({components.length})</div>
              <div className="space-y-1.5 overflow-y-auto max-h-48">
                {components.map((comp) => {
                  const isSelected = selectedComp?.id === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComponentId(comp.id)}
                      className={`w-full text-left px-3 py-2 rounded text-xs transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-cyan-500/30 border border-cyan-500/60 text-cyan-100 font-bold' : 'bg-slate-950/40 border border-cyan-500/10 text-cyan-400/80 hover:bg-cyan-950/80'}`}
                    >
                      <span className="truncate">{comp.name}</span>
                      <Layers className="w-3 h-3 text-cyan-400/60 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Component Detail View */}
            <div className="md:col-span-2 bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
              {selectedComp ? (
                <>
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <div>
                      <div className="text-[10px] text-cyan-500/70 uppercase">Part ID: {selectedComp.id}</div>
                      <h3 className="text-sm font-bold text-cyan-100">{selectedComp.name}</h3>
                    </div>
                    <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                      STATUS: NOMINAL
                    </span>
                  </div>

                  <p className="text-xs text-cyan-300/80">{selectedComp.description}</p>

                  {selectedComp.engineeringDetails ? (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950/50 p-2 rounded border border-cyan-500/10">
                          <span className="text-[10px] text-cyan-400/60 block">Material Composition:</span>
                          <span className="font-bold text-cyan-200">{selectedComp.engineeringDetails.material || 'Standard Alloy'}</span>
                        </div>
                        <div className="bg-slate-950/50 p-2 rounded border border-cyan-500/10">
                          <span className="text-[10px] text-cyan-400/60 block">Component Weight:</span>
                          <span className="font-bold text-cyan-200">{selectedComp.engineeringDetails.weight || 'N/A'}</span>
                        </div>
                        <div className="bg-slate-950/50 p-2 rounded border border-cyan-500/10">
                          <span className="text-[10px] text-cyan-400/60 block">Manufacturing Tolerance:</span>
                          <span className="font-bold text-cyan-200">{selectedComp.engineeringDetails.tolerances || '±0.1mm'}</span>
                        </div>
                        <div className="bg-slate-950/50 p-2 rounded border border-cyan-500/10">
                          <span className="text-[10px] text-cyan-400/60 block">Max Stress Threshold:</span>
                          <span className="font-bold text-cyan-200">{selectedComp.engineeringDetails.stressThreshold || 'N/A'}</span>
                        </div>
                      </div>

                      {selectedComp.engineeringDetails.pinout && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold">Electrical Pinout / Connections:</div>
                          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-cyan-500/20 grid grid-cols-2 gap-2 text-[11px]">
                            {Object.entries(selectedComp.engineeringDetails.pinout).map(([pin, desc], idx) => (
                              <div key={idx} className="flex justify-between border-b border-cyan-500/10 pb-1">
                                <span className="text-cyan-300 font-semibold">{pin}:</span>
                                <span className="text-cyan-400/70">{String(desc)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-cyan-400/50 italic py-4 text-center">
                      Detailed engineering specs for this sub-component are standard.
                    </div>
                  )}

                  {/* Component Transform Controls (Phase 1E) */}
                  <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-xl space-y-2 mt-3">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                      <span>⚙️ Component Transform Controls</span>
                      <button
                        onClick={() => {
                          if (onUpdateComponentTransform) {
                            onUpdateComponentTransform(selectedComp.id, {
                              position: selectedComp.position as [number, number, number],
                              rotation: (selectedComp.rotation || [0, 0, 0]) as [number, number, number],
                              scale: [1, 1, 1]
                            });
                          }
                        }}
                        className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>

                    {(() => {
                      const currentTransform = componentTransforms?.[selectedComp.id] || {
                        position: selectedComp.position as [number, number, number],
                        rotation: (selectedComp.rotation || [0, 0, 0]) as [number, number, number],
                        scale: [1, 1, 1]
                      };

                      const updateVal = (type: 'position' | 'rotation' | 'scale', axisIdx: number, val: number) => {
                        if (!onUpdateComponentTransform) return;
                        const next = { ...currentTransform };
                        const nextArr = [...next[type]] as [number, number, number];
                        nextArr[axisIdx] = val;
                        next[type] = nextArr;
                        onUpdateComponentTransform(selectedComp.id, next);
                      };

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          {/* Position */}
                          <div className="bg-slate-900/60 p-2 rounded border border-cyan-500/25 space-y-1">
                            <span className="text-[10px] text-cyan-400/70 font-bold">Position [X, Y, Z]</span>
                            <div className="flex gap-1">
                              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                                <div key={axis} className="flex-1 flex flex-col">
                                  <span className="text-[9px] text-cyan-400/50">{axis}</span>
                                  <input
                                    type="number"
                                    step="0.05"
                                    value={Number(currentTransform.position[i]).toFixed(2)}
                                    onChange={(e) => updateVal('position', i, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-cyan-500/40 rounded px-1 text-center text-cyan-200 text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rotation */}
                          <div className="bg-slate-900/60 p-2 rounded border border-cyan-500/25 space-y-1">
                            <span className="text-[10px] text-cyan-400/70 font-bold">Rotation [Rad]</span>
                            <div className="flex gap-1">
                              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                                <div key={axis} className="flex-1 flex flex-col">
                                  <span className="text-[9px] text-cyan-400/50">{axis}</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={Number(currentTransform.rotation[i]).toFixed(2)}
                                    onChange={(e) => updateVal('rotation', i, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-cyan-500/40 rounded px-1 text-center text-cyan-200 text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Scale */}
                          <div className="bg-slate-900/60 p-2 rounded border border-cyan-500/25 space-y-1">
                            <span className="text-[10px] text-cyan-400/70 font-bold">Scale [X, Y, Z]</span>
                            <div className="flex gap-1">
                              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                                <div key={axis} className="flex-1 flex flex-col">
                                  <span className="text-[9px] text-cyan-400/50">{axis}</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="5.0"
                                    value={Number(currentTransform.scale[i]).toFixed(2)}
                                    onChange={(e) => updateVal('scale', i, parseFloat(e.target.value) || 1)}
                                    className="w-full bg-slate-950 border border-cyan-500/40 rounded px-1 text-center text-cyan-200 text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="text-xs text-cyan-400/50 py-8 text-center">Select a component to view engineering details.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" /> Operational Limits & Thresholds
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {engMeta?.operationalLimits ? (
                  Object.entries(engMeta.operationalLimits).map(([key, val], idx) => (
                    <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-cyan-500/20 flex flex-col gap-1">
                      <span className="text-[10px] text-cyan-400/60 uppercase">{key}</span>
                      <span className="text-sm font-bold text-cyan-200">{String(val)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-cyan-400/60 col-span-full">No explicit operational limits recorded.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl space-y-3">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" /> Maintenance & Inspection Protocols
            </div>
            <div className="space-y-2">
              {engMeta?.maintenanceNotes && engMeta.maintenanceNotes.length > 0 ? (
                engMeta.maintenanceNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-cyan-500/20 text-xs text-cyan-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-lg border border-cyan-500/20 text-xs text-cyan-400/70">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Standard operating protocols apply. No specialized maintenance schedule registered.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

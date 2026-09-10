import React, { useState } from 'react';
import {
  ScientificSystemModel,
  ScientificComponent,
  Subsystem
} from './ScientificSchema';
import { RelationshipGraph } from './RelationshipGraph';
import {
  Play,
  Pause,
  RotateCw,
  Layers,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
  GitFork,
  CheckCircle2
} from 'lucide-react';

interface ScientificExplorationHUDProps {
  model: ScientificSystemModel;
  graph: RelationshipGraph;
  selectedComponent: ScientificComponent | null;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  isolatedSubsystemId: string | null;
  onIsolateSubsystem: (subsystemId: string | null) => void;
  explosionFactor: number;
  onSetExplosionFactor: (factor: number) => void;
  simulationRunning: boolean;
  onToggleSimulation: () => void;
  rpm: number;
  onSetRpm: (rpm: number) => void;
  crankAngle: number;
  onScrubAngle: (angle: number) => void;
  simulationSpeed: number;
  onSetSimulationSpeed: (speed: number) => void;
}

export function ScientificExplorationHUD({
  model,
  graph,
  selectedComponent,
  selectedComponentId,
  onSelectComponent,
  isolatedSubsystemId,
  onIsolateSubsystem,
  explosionFactor,
  onSetExplosionFactor,
  simulationRunning,
  onToggleSimulation,
  rpm,
  onSetRpm,
  crankAngle,
  onScrubAngle,
  simulationSpeed,
  onSetSimulationSpeed
}: ScientificExplorationHUDProps) {
  const [activeTab, setActiveTab] = useState<'INSPECT' | 'HIERARCHY' | 'RELATIONSHIPS'>('INSPECT');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Relationships of selected component
  const rels = selectedComponentId ? graph.getDirectRelationships(selectedComponentId) : null;

  return (
    <div className="absolute left-6 top-20 bottom-8 z-20 flex flex-col pointer-events-none select-none max-w-sm w-full">
      {/* Container Panel */}
      <div className="bg-slate-950/95 border-2 border-cyan-400/80 backdrop-blur-2xl rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.25),0_10px_40px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto overflow-hidden h-full">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
                {model.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {model.domain.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono">
              <button
                onClick={() => setActiveTab('INSPECT')}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'INSPECT'
                    ? 'border-cyan-400 text-cyan-400 font-semibold bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>
              <button
                onClick={() => setActiveTab('HIERARCHY')}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'HIERARCHY'
                    ? 'border-cyan-400 text-cyan-400 font-semibold bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Systems</span>
              </button>
              <button
                onClick={() => setActiveTab('RELATIONSHIPS')}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'RELATIONSHIPS'
                    ? 'border-cyan-400 text-cyan-400 font-semibold bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Graph</span>
              </button>
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 text-slate-300 space-y-4 font-sans text-xs scrollbar-thin scrollbar-thumb-slate-700">
              {/* TAB 1: COMPONENT INSPECTION */}
              {activeTab === 'INSPECT' && (
                selectedComponent ? (
                  <div className="space-y-3.5">
                    {/* Component Title & Taxonomy */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {selectedComponent.category}
                        </span>
                        {selectedComponent.subsystemId && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {model.subsystems.find(s => s.id === selectedComponent.subsystemId)?.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-100 mt-1">
                        {selectedComponent.name}
                      </h3>
                      <p className="text-[11px] font-mono text-cyan-300/80 italic">
                        {selectedComponent.scientificName}
                      </p>
                    </div>

                    {/* Educational Definition & Function */}
                    <div className="space-y-2 bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Scientific Function
                        </span>
                        <p className="text-slate-200 text-xs mt-0.5 leading-relaxed">
                          {selectedComponent.education.function}
                        </p>
                      </div>
                      <div className="border-t border-slate-800/80 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Engineering Significance
                        </span>
                        <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                          {selectedComponent.education.importance}
                        </p>
                      </div>
                    </div>

                    {/* Governing Equations */}
                    {selectedComponent.education.governingEquations && selectedComponent.education.governingEquations.length > 0 && (
                      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                          Governing Physical Law
                        </span>
                        {selectedComponent.education.governingEquations.map((eq, idx) => (
                          <div key={idx} className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                            <div className="font-mono text-xs font-bold text-cyan-300">
                              {eq.formula}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {eq.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scientific Properties Table */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Physical Specifications
                      </span>
                      <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800 divide-y divide-slate-800/60 font-mono text-[11px]">
                        {Object.entries(selectedComponent.scientificProperties).map(([key, val]) => (
                          <div key={key} className="py-1.5 px-1 flex items-center justify-between">
                            <span className="text-slate-400">{key}</span>
                            <span className="text-slate-200 font-semibold">
                              {val.value} {val.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 text-slate-400 space-y-3">
                    <Activity className="w-8 h-8 mx-auto text-cyan-400/50 animate-pulse" />
                    <div>
                      <p className="font-semibold text-slate-300">Select Any Component</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Click directly on a 3D component or select from the Systems hierarchy to inspect its physics, relationships, and governing equations.
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* TAB 2: SYSTEMS & SUBSYSTEMS HIERARCHY */}
              {activeTab === 'HIERARCHY' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Subsystem Isolation</span>
                    {isolatedSubsystemId && (
                      <button
                        onClick={() => onIsolateSubsystem(null)}
                        className="text-cyan-400 hover:underline"
                      >
                        Reset All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {model.subsystems.map(sub => {
                      const isIsolated = isolatedSubsystemId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => onIsolateSubsystem(isIsolated ? null : sub.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isIsolated
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span className="font-mono font-semibold text-slate-200 text-xs">
                                {sub.name}
                              </span>
                            </div>
                            {isIsolated && (
                              <span className="text-[9px] font-mono bg-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded">
                                ISOLATED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {sub.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: RELATIONSHIP GRAPH */}
              {activeTab === 'RELATIONSHIPS' && (
                selectedComponent && rels ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono text-slate-400">
                      Kinematic & Functional Links for <span className="text-cyan-400 font-bold">{selectedComponent.name}</span>
                    </div>

                    {/* Drivers (Upstream) */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        Driven By (Upstream Force)
                      </span>
                      {rels.drivers.length > 0 ? (
                        <div className="space-y-1.5 mt-1">
                          {rels.drivers.map(({ component, relationship }, idx) => (
                            <div
                              key={idx}
                              onClick={() => onSelectComponent(component.id)}
                              className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/60 hover:border-emerald-500 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 font-mono">
                                <span>{component.name}</span>
                                <span className="text-[9px] text-emerald-400 uppercase">{relationship.type}</span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-0.5">
                                {relationship.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic mt-1">None (Primary Power Source / Static Frame)</p>
                      )}
                    </div>

                    {/* Driven (Downstream) */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                        Drives (Downstream Work)
                      </span>
                      {rels.driven.length > 0 ? (
                        <div className="space-y-1.5 mt-1">
                          {rels.driven.map(({ component, relationship }, idx) => (
                            <div
                              key={idx}
                              onClick={() => onSelectComponent(component.id)}
                              className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/60 hover:border-cyan-500 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-cyan-200 font-mono">
                                <span>{component.name}</span>
                                <span className="text-[9px] text-cyan-400 uppercase">{relationship.type}</span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-0.5">
                                {relationship.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic mt-1">None (Terminal Kinematic Output)</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 text-slate-400">
                    <GitFork className="w-8 h-8 mx-auto text-cyan-400/50 mb-2" />
                    <p className="font-semibold text-slate-300">Select an Entity</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Choose any component to reveal its complete upstream driving forces and downstream mechanical connections.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Bottom Controls: Simulation, RPM, Angle & Explosion Sliders */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 space-y-3 font-mono text-[11px]">
              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleSimulation}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      simulationRunning
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30'
                    }`}
                  >
                    {simulationRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Simulate</span>
                      </>
                    )}
                  </button>

                  {/* Speed buttons */}
                  {[0.5, 1.0, 2.0].map(s => (
                    <button
                      key={s}
                      onClick={() => onSetSimulationSpeed(s)}
                      className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                        simulationSpeed === s
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <span className="text-cyan-400 font-bold">
                  {rpm} RPM
                </span>
              </div>

              {/* RPM Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Engine Speed</span>
                  <span>{rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="7500"
                  step="100"
                  value={rpm}
                  onChange={(e) => onSetRpm(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Exploded View Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Assembly Disassembly (Explosion)</span>
                  <span className="text-cyan-400 font-semibold">{Math.round(explosionFactor * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explosionFactor}
                  onChange={(e) => onSetExplosionFactor(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

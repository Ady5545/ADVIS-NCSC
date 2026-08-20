import React, { useState } from 'react';
import { Cpu, Activity, Shield, Layers, Radio, Zap, X, Terminal, Compass, Eye, Box, Wrench, Search } from 'lucide-react';
import { EngineeringInspector } from './EngineeringInspector';
import { SPATIAL_LIBRARY } from './SpatialLibrary';

interface EngineeringHUDProps {
  onClose: () => void;
  activeObject?: string | string[] | null;
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
  componentTransforms?: Record<string, { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }>;
  onUpdateComponentTransform?: (id: string, transform: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) => void;
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
}

export const EngineeringHUD: React.FC<EngineeringHUDProps> = ({ 
  onClose, 
  activeObject, 
  selectedComponentId, 
  onSelectComponent,
  componentTransforms,
  onUpdateComponentTransform,
  explodedFactor,
  onUpdateExplodedFactor,
  xrayEnabled,
  onToggleXray,
  blueprintEnabled,
  onToggleBlueprint,
  highlightedComponentId,
  onHighlightComponent,
  measurementMode,
  onToggleMeasurement
}) => {
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [showExplorer, setShowExplorer] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const objectKey = Array.isArray(activeObject) ? activeObject[0] : activeObject;
  const objectMeta = objectKey ? SPATIAL_LIBRARY[objectKey] : null;
  const components = objectMeta?.components || [];

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 md:p-6 font-mono text-cyan-400 select-none bg-cyan-950/10 backdrop-blur-[2px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pointer-events-auto bg-slate-950/90 border border-cyan-500/40 px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/50">
            <Cpu className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-cyan-200">ADVIS // ENGINEERING WORKSTATION</span>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-cyan-400/80">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              CAD KERNEL: ACTIVE
            </span>
            <span>|</span>
            <span>ASSET: {objectMeta?.name || 'V12 ENGINE TWIN'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${showExplorer ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50'}`}
          >
            <Layers className="w-4 h-4" />
            <span>{showExplorer ? 'HIDE EXPLORER' : 'SHOW EXPLORER'}</span>
          </button>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${showInspector ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50'}`}
          >
            <Eye className="w-4 h-4" />
            <span>{showInspector ? 'HIDE INSPECTOR' : 'SHOW INSPECTOR'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-cyan-400/70 border-r border-cyan-500/30 pr-4">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>60 FPS</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
          >
            <X className="w-4 h-4" />
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Middle Workstation Area: Left Project Explorer & Right Inspector */}
      <div className="flex-1 relative flex justify-between items-start pointer-events-none my-4 overflow-hidden">
        {/* Left-Side: Engineering Project Explorer */}
        {showExplorer && (
          <div className="absolute left-4 top-0 bottom-0 w-80 pointer-events-none flex flex-col z-40">
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl backdrop-blur-xl p-4 text-cyan-300 font-mono shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3 h-full pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">Project Explorer</span>
                </div>
                <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-300">
                  {components.length} Parts
                </span>
              </div>

              {/* Component Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-cyan-500/60 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Hierarchical Tree */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] text-cyan-400/80 uppercase tracking-wider font-bold px-1 flex items-center justify-between">
                    <span>▼ {objectMeta?.name || 'V12 Assembly'}</span>
                  </div>

                  <div className="pl-2 space-y-1 border-l border-cyan-500/20 ml-1 mt-1">
                    {filteredComponents.map(comp => {
                      const isSelected = selectedComponentId === comp.id;
                      return (
                        <button
                          key={comp.id}
                          onClick={() => onSelectComponent?.(comp.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-all cursor-pointer flex items-center justify-between border ${
                            isSelected 
                              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                              : 'bg-slate-900/50 border-cyan-500/10 text-cyan-300/80 hover:bg-cyan-950/70 hover:border-cyan-500/30'
                          }`}
                        >
                          <span className="truncate">↳ {comp.name}</span>
                          <span className="text-[9px] text-cyan-400/60">CAD</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-cyan-500/20 pt-2 text-[10px] text-cyan-400/60 flex justify-between items-center">
                <span>STATUS: LOADED</span>
                <span>TOLERANCE: ±0.01mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Right-Side: Engineering Inspector */}
        {showInspector && (
          <div className="absolute right-4 top-0 bottom-0 w-full max-w-xl pointer-events-none flex flex-col items-end z-40 overflow-y-auto pr-1">
            <EngineeringInspector 
              activeObject={activeObject} 
              selectedComponentId={selectedComponentId}
              onSelectComponent={onSelectComponent}
              componentTransforms={componentTransforms}
              onUpdateComponentTransform={onUpdateComponentTransform}
              explodedFactor={explodedFactor}
              onUpdateExplodedFactor={onUpdateExplodedFactor}
              xrayEnabled={xrayEnabled}
              onToggleXray={onToggleXray}
              blueprintEnabled={blueprintEnabled}
              onToggleBlueprint={onToggleBlueprint}
              highlightedComponentId={highlightedComponentId}
              onHighlightComponent={onHighlightComponent}
              measurementMode={measurementMode}
              onToggleMeasurement={onToggleMeasurement}
            />
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto z-30">
        <div className="bg-slate-950/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1 shadow-lg">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400" /> System Voltage
          </div>
          <div className="text-sm font-bold text-cyan-200">24.2V DC <span className="text-[10px] text-emerald-400 font-normal">(NOMINAL)</span></div>
        </div>

        <div className="bg-slate-950/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1 shadow-lg">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-cyan-400" /> Thermal State
          </div>
          <div className="text-sm font-bold text-cyan-200">38.4°C <span className="text-[10px] text-cyan-400/80 font-normal">STABLE</span></div>
        </div>

        <div className="bg-slate-950/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1 shadow-lg">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-cyan-400" /> Safety Interlock
          </div>
          <div className="text-sm font-bold text-emerald-400">SECURE [ARMED]</div>
        </div>

        <div className="bg-slate-950/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1 shadow-lg">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-cyan-400" /> Kernel Mode
          </div>
          <div className="text-sm font-bold text-cyan-300">ENG-MODE // 2.A</div>
        </div>
      </div>
    </div>
  );
};


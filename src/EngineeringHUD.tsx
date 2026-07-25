import React, { useState } from 'react';
import { Cpu, Activity, Shield, Layers, Radio, Zap, X, Terminal, Compass, Eye } from 'lucide-react';
import { EngineeringInspector } from './EngineeringInspector';

interface EngineeringHUDProps {
  onClose: () => void;
  activeObject?: string | string[] | null;
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
  componentTransforms?: Record<string, { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }>;
  onUpdateComponentTransform?: (id: string, transform: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) => void;
}

export const EngineeringHUD: React.FC<EngineeringHUDProps> = ({ 
  onClose, 
  activeObject, 
  selectedComponentId, 
  onSelectComponent,
  componentTransforms,
  onUpdateComponentTransform
}) => {
  const [showInspector, setShowInspector] = useState<boolean>(true);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 md:p-8 font-mono text-cyan-400 select-none bg-cyan-950/10 backdrop-blur-[2px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pointer-events-auto bg-slate-950/80 border border-cyan-500/40 px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/50">
            <Cpu className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-cyan-200">ADVIS // ENGINEERING MODE</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[10px] text-cyan-400/80">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              CORE KERNEL: ONLINE
            </span>
            <span>|</span>
            <span>DIAGNOSTIC SUBSYSTEM: ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Center / Inspector Overlay */}
      <div className="self-center my-auto w-full flex justify-center items-center pointer-events-auto">
        {showInspector ? (
          <EngineeringInspector 
            activeObject={activeObject} 
            selectedComponentId={selectedComponentId}
            onSelectComponent={onSelectComponent}
            componentTransforms={componentTransforms}
            onUpdateComponentTransform={onUpdateComponentTransform}
          />
        ) : (
          <div className="bg-slate-950/70 border border-cyan-500/30 px-6 py-4 rounded-xl backdrop-blur-md shadow-2xl flex flex-col items-center gap-2 max-w-md text-center pointer-events-auto">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Spatial Engineering Grid Initialized</span>
            </div>
            <p className="text-[11px] text-cyan-400/70 leading-relaxed">
              Engineering telemetry active. Click "Show Inspector" above to inspect structural metadata, component pinouts, and operational limits.
            </p>
            <div className="text-[9px] text-cyan-500/60 font-semibold mt-1">
              ACTIVE MODEL: {Array.isArray(activeObject) ? activeObject.join(', ') : (activeObject || 'NONE LOADED')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto">
        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400" /> System Voltage
          </div>
          <div className="text-sm font-bold text-cyan-200">24.2V DC <span className="text-[10px] text-emerald-400 font-normal">(NOMINAL)</span></div>
        </div>

        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-cyan-400" /> Thermal State
          </div>
          <div className="text-sm font-bold text-cyan-200">38.4°C <span className="text-[10px] text-cyan-400/80 font-normal">STABLE</span></div>
        </div>

        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-cyan-400" /> Safety Interlock
          </div>
          <div className="text-sm font-bold text-emerald-400">SECURE [ARMED]</div>
        </div>

        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md flex flex-col gap-1">
          <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-cyan-400" /> Kernel Mode
          </div>
          <div className="text-sm font-bold text-cyan-300">ENG-MODE // 1.C</div>
        </div>
      </div>
    </div>
  );
};


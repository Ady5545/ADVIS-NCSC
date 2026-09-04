import React from 'react';
import { Atom, Cpu, ArrowRight, GitCompare, PlayCircle } from 'lucide-react';

interface ScientificLaunchpadProps {
  onOpenView: (view: 'molecules' | 'engineering' | 'learning' | 'compare' | 'demonstration') => void;
  onSelectMolecule: (formulaOrKey: string) => void;
  onSelectSpatialObject: (objectId: string) => void;
}

export function ScientificLaunchpad({
  onOpenView,
  onSelectMolecule,
  onSelectSpatialObject
}: ScientificLaunchpadProps) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4 z-20 pointer-events-auto select-none font-mono">
      {/* Minimal clean workstation navigation bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-3">
        {/* Molecular Structures */}
        <button
          onClick={() => onOpenView('molecules')}
          className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <div className="flex items-center justify-between mb-2">
            <Atom size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              VSEPR / 3D
            </span>
          </div>
          <div className="text-xs font-bold text-white group-hover:text-cyan-200">
            MOLECULAR LIBRARY
          </div>
          <div className="text-[10px] text-cyan-400/60 font-sans mt-0.5">
            18 Verified Molecules
          </div>
        </button>

        {/* Engineering Catalog */}
        <button
          onClick={() => onOpenView('engineering')}
          className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <div className="flex items-center justify-between mb-2">
            <Cpu size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              CAD / KINEMATICS
            </span>
          </div>
          <div className="text-xs font-bold text-white group-hover:text-cyan-200">
            ENGINEERING CATALOG
          </div>
          <div className="text-[10px] text-cyan-400/60 font-sans mt-0.5">
            14 Mechanical Systems
          </div>
        </button>

        {/* Scientific Comparison Mode */}
        <button
          onClick={() => onOpenView('compare')}
          className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <div className="flex items-center justify-between mb-2">
            <GitCompare size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              COMPARE
            </span>
          </div>
          <div className="text-xs font-bold text-white group-hover:text-cyan-200">
            SCIENTIFIC COMPARATOR
          </div>
          <div className="text-[10px] text-cyan-400/60 font-sans mt-0.5">
            Side-by-side Analysis
          </div>
        </button>

        {/* Scientific Demonstrations */}
        <button
          onClick={() => onOpenView('demonstration')}
          className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <div className="flex items-center justify-between mb-2">
            <PlayCircle size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              ANIMATE
            </span>
          </div>
          <div className="text-xs font-bold text-white group-hover:text-cyan-200">
            DEMONSTRATION MODE
          </div>
          <div className="text-[10px] text-cyan-400/60 font-sans mt-0.5">
            4-Stroke, Tracking, VSEPR
          </div>
        </button>
      </div>

      {/* Direct Quick Projections */}
      <div className="w-full bg-slate-950/80 border border-cyan-500/20 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[10px] font-bold text-cyan-400/70 tracking-widest uppercase">
          Direct 3D Projections:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'H₂O', id: 'H2O', type: 'mol' },
            { label: 'CO₂', id: 'CO2', type: 'mol' },
            { label: 'CH₄', id: 'CH4', type: 'mol' },
            { label: 'BF₃', id: 'BF3', type: 'mol' },
            { label: 'V12 Engine', id: 'v12_engine', type: 'eng' },
            { label: 'Servo Motor', id: 'servo_motor', type: 'eng' },
            { label: 'Solar Tracker', id: 'heliomotion', type: 'eng' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.type === 'mol') onSelectMolecule(item.id);
                else onSelectSpatialObject(item.id);
              }}
              className="px-2.5 py-1 rounded bg-slate-900/90 hover:bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-[11px] transition-all cursor-pointer font-bold"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

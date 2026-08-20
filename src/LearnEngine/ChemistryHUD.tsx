import React from 'react';
import { Hexagon } from 'lucide-react';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';

export function formatFormula(formula: string) {
  return formula.replace(/\d+/g, match => {
    const subscripts: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
    return match.split('').map(char => subscripts[char] || char).join('');
  });
}

export interface ChemistryHUDProps {
  entityName: string;
  currentPhase: string;
}

export function ChemistryHUD({ entityName, currentPhase }: ChemistryHUDProps) {
  const entity = Object.keys(CHEMISTRY_DATABASE).find(k => k.toLowerCase() === entityName.toLowerCase());
  const data = entity ? CHEMISTRY_DATABASE[entity] : null;

  if (!data) return null;

  const bondCount = data.ligands?.reduce((acc, l) => acc + l.count, 0) || 0;
  const domains = bondCount + (data.lonePairs || 0);

  // Dynamic Highlighting Logic
  const hl = (keyword: string) => {
    if (currentPhase.includes('valence') && keyword === 'valence') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('hybrid') && keyword === 'hybridization') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('bond') && keyword === 'bonds') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('summary') && keyword === 'geometry') return 'text-amber-400 bg-amber-900/30 font-bold';
    return 'text-cyan-100';
  };

  const getAngle = () => {
    if (data.geometry === 'Bent') return '104.5°';
    if (data.geometry === 'Linear') return '180°';
    if (data.geometry === 'Tetrahedral') return '109.5°';
    if (data.geometry === 'Trigonal Planar') return '120°';
    if (data.geometry === 'Trigonal Pyramidal') return '107°';
    return 'N/A';
  };

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.05)] font-mono text-[11px]">
      <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-2">
         <Hexagon size={14} className="text-cyan-400" />
         <div className="tracking-[0.2em] text-cyan-400 font-bold uppercase">Molecular Analysis</div>
      </div>
      <div className="grid grid-cols-2 gap-y-2">
        <div className="text-cyan-500/70">Formula</div>
        <div className="text-cyan-100">{formatFormula(data.formula)}</div>
        
        {data.centralAtom && (
           <>
            <div className="text-cyan-500/70">Central Atom</div>
            <div className="text-cyan-100">{data.centralAtom}</div>
           </>
        )}

        <div className="text-cyan-500/70">Valence e⁻</div>
        <div className={`transition-colors duration-300 px-1 -mx-1 rounded ${hl('valence')}`}>{data.valenceElectrons}</div>

        <div className="text-cyan-500/70">Bonding Pairs</div>
        <div className={`transition-colors duration-300 px-1 -mx-1 rounded ${hl('bonds')}`}>{bondCount}</div>

        {data.lonePairs !== undefined && (
          <>
            <div className="text-cyan-500/70">Lone Pairs</div>
            <div className="text-cyan-100">{data.lonePairs}</div>
          </>
        )}

        <div className="text-cyan-500/70">Domains</div>
        <div className="text-cyan-100">{domains}</div>

        {data.hybridization && (
          <>
            <div className="text-cyan-500/70 mt-2">Hybridization</div>
            <div className={`transition-colors duration-300 px-1 -mx-1 rounded mt-2 ${hl('hybridization')}`}>{data.hybridization}</div>
          </>
        )}

        <div className="text-cyan-500/70">Geometry</div>
        <div className={`transition-colors duration-300 px-1 -mx-1 rounded ${hl('geometry')}`}>{data.geometry}</div>

        {data.bondType === 'COVALENT' && (
          <>
            <div className="text-cyan-500/70">Bond Angle</div>
            <div className={`transition-colors duration-300 px-1 -mx-1 rounded ${hl('geometry')}`}>{getAngle()}</div>
          </>
        )}

        <div className="text-cyan-500/70">Bond Type</div>
        <div className={`transition-colors duration-300 px-1 -mx-1 rounded ${hl('bonds')}`}>{data.bondType}</div>
      </div>
    </div>
  );
}

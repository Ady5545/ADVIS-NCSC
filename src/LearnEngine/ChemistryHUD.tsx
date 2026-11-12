import React from 'react';
import { Hexagon } from 'lucide-react';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';
import { CHEMISTRY_UI, formatMolecularFormula } from './ChemistryWorkspaceUI';

export const formatFormula = formatMolecularFormula;

export interface ChemistryHUDProps {
  entityName: string;
  currentPhase: string;
}

export function ChemistryHUD({ entityName, currentPhase }: ChemistryHUDProps) {
  const entity = Object.keys(CHEMISTRY_DATABASE).find(k => k.toLowerCase() === entityName.toLowerCase());
  const data = entity ? CHEMISTRY_DATABASE[entity] : null;

  if (!data) return null;

  const bondCount = data.ligands?.reduce((acc, ligand) => acc + ligand.count, 0) || 0;
  const domains = bondCount + (data.lonePairs || 0);

  const highlight = (keyword: string) => {
    if (currentPhase.includes('valence') && keyword === 'valence') return 'bg-amber-50 text-amber-800 font-bold';
    if (currentPhase.includes('hybrid') && keyword === 'hybridization') return 'bg-amber-50 text-amber-800 font-bold';
    if (currentPhase.includes('bond') && keyword === 'bonds') return 'bg-amber-50 text-amber-800 font-bold';
    if (currentPhase.includes('summary') && keyword === 'geometry') return 'bg-amber-50 text-amber-800 font-bold';
    return 'text-slate-800';
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
    <div className={`${CHEMISTRY_UI.panel} p-4 font-mono text-[11px]`}>
      <div className={`${CHEMISTRY_UI.panelHeader} mb-3`}>
        <div className="flex items-center gap-2">
          <Hexagon size={14} className="text-blue-700" />
          <div className={CHEMISTRY_UI.eyebrow}>Molecular Analysis</div>
        </div>
        <span className="text-[9px] font-mono text-slate-400">GUIDED</span>
      </div>

      <div className="grid grid-cols-2 gap-y-2">
        <div className={CHEMISTRY_UI.label}>Formula</div>
        <div className="font-mono text-blue-800">{formatMolecularFormula(data.formula)}</div>

        {data.centralAtom && (
          <>
            <div className={CHEMISTRY_UI.label}>Central Atom</div>
            <div className="text-slate-800">{data.centralAtom}</div>
          </>
        )}

        <div className={CHEMISTRY_UI.label}>Valence e⁻</div>
        <div className={`rounded px-1 -mx-1 transition-colors ${highlight('valence')}`}>{data.valenceElectrons}</div>

        <div className={CHEMISTRY_UI.label}>Bonding Pairs</div>
        <div className={`rounded px-1 -mx-1 transition-colors ${highlight('bonds')}`}>{bondCount}</div>

        {data.lonePairs !== undefined && (
          <>
            <div className={CHEMISTRY_UI.label}>Lone Pairs</div>
            <div className="text-slate-800">{data.lonePairs}</div>
          </>
        )}

        <div className={CHEMISTRY_UI.label}>Domains</div>
        <div className="text-slate-800">{domains}</div>

        {data.hybridization && (
          <>
            <div className={CHEMISTRY_UI.label}>Hybridization</div>
            <div className={`rounded px-1 -mx-1 transition-colors ${highlight('hybridization')}`}>{data.hybridization}</div>
          </>
        )}

        <div className={CHEMISTRY_UI.label}>Geometry</div>
        <div className={`rounded px-1 -mx-1 transition-colors ${highlight('geometry')}`}>{data.geometry}</div>

        {data.bondType === 'COVALENT' && (
          <>
            <div className={CHEMISTRY_UI.label}>Bond Angle</div>
            <div className={`rounded px-1 -mx-1 transition-colors ${highlight('geometry')}`}>{getAngle()}</div>
          </>
        )}

        <div className={CHEMISTRY_UI.label}>Bond Type</div>
        <div className="text-slate-800">{data.bondType}</div>
      </div>
    </div>
  );
}

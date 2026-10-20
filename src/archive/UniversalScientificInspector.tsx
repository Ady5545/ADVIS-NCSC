import { DigitalTwinInspector } from "./DigitalTwinInspector";
import React, { useState } from 'react';
import { 
  Atom, 
  Cpu, 
  Layers, 
  Activity, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Maximize2,
  Trash2,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { MoleculeData, AtomData, BondData } from './LearnEngine/MolecularEngine';
import { MolecularAnalysisResult } from './LearnEngine/ValenceValidator';
import { ObjectMetadata, ComponentMetadata, SPATIAL_LIBRARY } from './SpatialLibrary';
import { CHEMISTRY_DATABASE, ChemicalEntity } from './LearnEngine/ChemistryDatabase';

interface UniversalScientificInspectorProps {
  // Chemistry State
  molecule: MoleculeData | null;
  selectedAtomId: string | null;
  selectedBondId: string | null;
  analysis: MolecularAnalysisResult | null;
  onSelectAtom?: (id: string | null) => void;
  onSelectBond?: (id: string | null) => void;
  onRemoveAtom?: (id?: string) => void;
  onChangeBondOrder?: (target: { bondId?: string; atomA?: string; atomB?: string; allBonds?: boolean }, order: number) => void;
  onAddAtom?: (element: string, parentAtomId?: string, bondOrder?: number) => void;

  // Engineering State
  activeSpatialObject: string | string[] | null;
  selectedComponentId: string | null;
  onSelectComponent?: (id: string | null) => void;
  spatialMode?: string;
  onChangeSpatialMode?: (mode: any) => void;

  // UI state
  onClose?: () => void;
}

  const ProvenanceBadge = ({ source }: { source: 'LIT' | 'DERIVED' | 'LIVE' }) => {
    let color = 'bg-slate-900 text-slate-300 border-slate-500';
    if (source === 'LIT') color = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (source === 'DERIVED') color = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (source === 'LIVE') color = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
    return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${color} ml-1 uppercase tracking-widest`} title="Data Provenance">{source}</span>;
  };

export const UniversalScientificInspector: React.FC<UniversalScientificInspectorProps> = ({
  molecule,
  selectedAtomId,
  selectedBondId,
  analysis,
  onSelectAtom,
  onSelectBond,
  onRemoveAtom,
  onChangeBondOrder,
  onAddAtom,
  activeSpatialObject,
  selectedComponentId,
  onSelectComponent,
  spatialMode,
  onChangeSpatialMode,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'entity' | 'selection' | 'analysis'>('selection');

  const isChemistry = !!molecule;
  const isEngineering = !isChemistry && !!activeSpatialObject;

  // Engineering Object Metadata
  const primaryEngId = Array.isArray(activeSpatialObject) ? activeSpatialObject[0] : activeSpatialObject;
  const engineeringMeta: ObjectMetadata | null = primaryEngId ? (SPATIAL_LIBRARY[primaryEngId] || null) : null;
  const selectedComp: ComponentMetadata | null = (engineeringMeta && selectedComponentId)
    ? (engineeringMeta.components.find(c => c.id === selectedComponentId) || null)
    : null;

  // Chemistry Selected Atom / Bond
  const selectedAtom: AtomData | null = (molecule && selectedAtomId)
    ? (molecule.atoms.find(a => a.id === selectedAtomId) || null)
    : null;
  const selectedBond: BondData | null = (molecule && selectedBondId)
    ? (molecule.bonds.find(b => b.id === selectedBondId) || null)
    : null;

  // Connected atoms for selected atom
  const connectedBonds = molecule && selectedAtom
    ? molecule.bonds.filter(b => b.atomA === selectedAtom.id || b.atomB === selectedAtom.id)
    : [];

  const connectedAtomIds = connectedBonds.map(b => (b.atomA === selectedAtom?.id ? b.atomB : b.atomA));
  const connectedAtoms = molecule
    ? molecule.atoms.filter(a => connectedAtomIds.includes(a.id))
    : [];

  // If no object is active and no component/atom is selected, show minimal standby
  if (!isChemistry && !isEngineering) {
    return null;
  }

  return (
    <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-3.5 md:p-4 text-cyan-300 font-mono shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col gap-3 w-full max-w-sm pointer-events-auto select-none animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
        <div className="flex items-center gap-2">
          {isChemistry ? (
            <Atom size={16} className="text-cyan-400 animate-spin-slow" />
          ) : (
            <Cpu size={16} className="text-cyan-400 animate-pulse" />
          )}
          <span className="text-xs font-bold tracking-widest text-cyan-200 uppercase">
            {isChemistry ? 'MOLECULAR INSPECTOR' : 'ENGINEERING INSPECTOR'}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Mode Pill */}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 uppercase">
            {isChemistry ? (molecule?.geometry || '3D Session') : (spatialMode || 'INSPECT')}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-cyan-400/60 hover:text-cyan-200 p-1 rounded hover:bg-cyan-950/50 transition-colors cursor-pointer"
              title="Close inspector"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isEngineering && (
      <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-lg border border-cyan-500/20 text-[10px] font-bold">
        <button
          onClick={() => setActiveTab('selection')}
          className={`py-1 rounded transition-all text-center cursor-pointer ${
            activeTab === 'selection'
              ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          {selectedAtom ? 'Atom' : selectedBond ? 'Bond' : selectedComp ? 'Module' : 'Focused'}
        </button>
        <button
          onClick={() => setActiveTab('entity')}
          className={`py-1 rounded transition-all text-center cursor-pointer ${
            activeTab === 'entity'
              ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          Assembly
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`py-1 rounded transition-all text-center cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          Analysis
        </button>
      </div>
      )}

      {isEngineering && primaryEngId && (
        <DigitalTwinInspector 
          objectId={primaryEngId as string} 
          selectedComponentId={selectedComponentId} 
          onSelectComponent={onSelectComponent} 
        />
      )}
      {!isEngineering && (
        <>
      {/* TAB 1: SELECTION FOCUS (Atom, Bond, or Component) */}
      {activeTab === 'selection' && (
        <div className="space-y-2.5 text-xs">
          {/* Chemistry: Selected Atom */}
          {isChemistry && selectedAtom && (
            <div className="space-y-2">
              <div className="flex justify-between items-baseline bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                <span className="text-sm font-bold text-white">
                  Atom: {selectedAtom.element} <span className="text-[10px] text-cyan-400/60 font-normal">({selectedAtom.id})</span>
                </span>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  {analysis?.atomAnalyses?.[selectedAtom.id]?.hybridization || selectedAtom.hybridization || 'sp³'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-cyan-500/10">
                <span className="text-cyan-400/70 flex items-center">Valence e⁻ <ProvenanceBadge source="LIT" /></span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.atomAnalyses?.[selectedAtom.id]?.valenceElectrons ?? '?'}</span>

                <span className="text-cyan-400/70 flex items-center">Formal Charge <ProvenanceBadge source="DERIVED" /></span>
                <span className="text-cyan-200 font-bold text-right">
                  {analysis?.atomAnalyses?.[selectedAtom.id]?.formalCharge !== undefined
                    ? (analysis.atomAnalyses[selectedAtom.id].formalCharge > 0 ? `+${analysis.atomAnalyses[selectedAtom.id].formalCharge}` : analysis.atomAnalyses[selectedAtom.id].formalCharge)
                    : (analysis?.atomAnalyses?.[selectedAtom.id]?.formalCharge !== undefined
                      ? (analysis.atomAnalyses[selectedAtom.id]?.formalCharge > 0 ? `+${analysis.atomAnalyses[selectedAtom.id]?.formalCharge}` : analysis.atomAnalyses[selectedAtom.id]?.formalCharge)
                      : '0')}
                </span>

                <span className="text-cyan-400/70">Coordination:</span>
                <span className="text-cyan-200 font-bold text-right">{connectedAtoms.length} bonds</span>

                <span className="text-cyan-400/70">Total Bond Order:</span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.atomAnalyses?.[selectedAtom.id]?.totalBondOrder ?? '?'}</span>

                <span className="text-cyan-400/70 flex items-center">Local Geometry <ProvenanceBadge source="DERIVED" /></span>
                <span className="text-cyan-200 font-bold text-right">
                  {analysis?.atomAnalyses?.[selectedAtom.id]?.hybridization || 'Tetrahedral'}
                </span>

                <span className="text-cyan-400/70 flex items-center">Coordinates <ProvenanceBadge source="LIVE" /></span>
                <span className="text-cyan-200 font-bold text-right truncate">
                  [{selectedAtom.position.x.toFixed(1)}, {selectedAtom.position.y.toFixed(1)}, {selectedAtom.position.z.toFixed(1)}]
                </span>
              </div>
              
              {analysis?.atomAnalyses?.[selectedAtom.id]?.notes && analysis.atomAnalyses[selectedAtom.id].notes.length > 0 && (
                <div className="space-y-1 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20 text-[10px] text-cyan-200/80">
                  {analysis.atomAnalyses[selectedAtom.id].notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions for Selected Atom */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-cyan-400/60 font-bold uppercase">Actions for {selectedAtom.element}:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onAddAtom && onAddAtom('H', selectedAtom.id, 1)}
                    className="py-1 px-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-[10px] font-bold transition-all text-center cursor-pointer truncate"
                  >
                    + Hydrogen
                  </button>
                  <button
                    onClick={() => onAddAtom && onAddAtom('O', selectedAtom.id, 1)}
                    className="py-1 px-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-[10px] font-bold transition-all text-center cursor-pointer truncate"
                  >
                    + Oxygen
                  </button>
                  <button
                    onClick={() => onRemoveAtom && onRemoveAtom(selectedAtom.id)}
                    className="py-1 px-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 text-red-300 text-[10px] font-bold transition-all text-center cursor-pointer truncate"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chemistry: Selected Bond */}
          {isChemistry && selectedBond && (
            <div className="space-y-2">
              <div className="flex justify-between items-baseline bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                <span className="text-sm font-bold text-white">
                  Bond: {selectedBond.atomA} ↔ {selectedBond.atomB}
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase">
                  {selectedBond.order === 1 ? 'Single (σ)' : selectedBond.order === 2 ? 'Double (σ+π)' : 'Triple (σ+2π)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-cyan-500/10">
                <span className="text-cyan-400/70">Bond Order:</span>
                <span className="text-cyan-200 font-bold text-right">{selectedBond.order}</span>

                <span className="text-cyan-400/70 flex items-center">Classification <ProvenanceBadge source="DERIVED" /></span>
                <span className="text-cyan-200 font-bold text-right uppercase">{selectedBond.type}</span>

                <span className="text-cyan-400/70 flex items-center">Est. Bond Length <ProvenanceBadge source="LIVE" /></span>
                <span className="text-cyan-200 font-bold text-right">{selectedBond.length.toFixed(2)} Å</span>
              </div>

              {/* Modify Bond Order */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-cyan-400/60 font-bold uppercase">Change Bond Order:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onChangeBondOrder && onChangeBondOrder({ bondId: selectedBond.id }, 1)}
                    className={`py-1 rounded border text-[10px] font-bold transition-all text-center cursor-pointer ${
                      selectedBond.order === 1
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                        : 'bg-slate-900/60 hover:bg-cyan-950/60 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    Single (1)
                  </button>
                  <button
                    onClick={() => onChangeBondOrder && onChangeBondOrder({ bondId: selectedBond.id }, 2)}
                    className={`py-1 rounded border text-[10px] font-bold transition-all text-center cursor-pointer ${
                      selectedBond.order === 2
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                        : 'bg-slate-900/60 hover:bg-cyan-950/60 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    Double (2)
                  </button>
                  <button
                    onClick={() => onChangeBondOrder && onChangeBondOrder({ bondId: selectedBond.id }, 3)}
                    className={`py-1 rounded border text-[10px] font-bold transition-all text-center cursor-pointer ${
                      selectedBond.order === 3
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                        : 'bg-slate-900/60 hover:bg-cyan-950/60 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    Triple (3)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chemistry: No atom/bond selected */}
          {isChemistry && !selectedAtom && !selectedBond && (
            <div className="text-center py-4 text-cyan-400/60 text-[11px] font-sans">
              Click any atom or bond in the 3D workspace to inspect local orbital geometry, formal charge, and bonding state.
            </div>
          )}
        </div>
      )}
      {/* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW */}
      {activeTab === 'entity' && (
        <div className="space-y-2 text-xs">
          {isChemistry && molecule && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-cyan-500/10">
                <span className="text-cyan-400/70">Formula:</span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.formula || 'Custom'}</span>
                <span className="text-cyan-400/70 flex items-center">Geometry <ProvenanceBadge source="LIT" /></span>
                <span className="text-cyan-200 font-bold text-right">{molecule.geometry || analysis?.estimatedGeometry || 'Dynamic'}</span>
                <span className="text-cyan-400/70">Atom Count:</span>
                <span className="text-cyan-200 font-bold text-right">{molecule.atoms.length} atoms</span>
                <span className="text-cyan-400/70">Bond Count:</span>
                <span className="text-cyan-200 font-bold text-right">{molecule.bonds.length} bonds</span>
                <span className="text-cyan-400/70 flex items-center">Total Valence e⁻ <ProvenanceBadge source="DERIVED" /></span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.totalValenceElectrons || 0} e⁻</span>
                <span className="text-cyan-400/70 flex items-center">Net Formal Charge <ProvenanceBadge source="DERIVED" /></span>
                <span className="text-cyan-200 font-bold text-right">
                  {analysis?.totalFormalCharge !== undefined ? (analysis.totalFormalCharge > 0 ? `+${analysis.totalFormalCharge}` : analysis.totalFormalCharge) : 0}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB 3: SCIENTIFIC ANALYSIS & VALIDATION */}
      {activeTab === 'analysis' && (
        <div className="space-y-2 text-xs">
          {isChemistry && analysis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                <span className="text-[11px] text-cyan-400/70">Structure Validity:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  (analysis.warnings.length === 0)
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}>
                  {(analysis.warnings.length === 0) ? '✓ STABLE OCTET' : '⚠ VALENCE WARNING'}
                </span>
              </div>
              {analysis.warnings.length > 0 ? (
                <div className="space-y-1 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20 text-[10px] text-amber-200">
                  {analysis.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-cyan-200/80 font-sans font-light leading-relaxed">
                  All valence electron counts and formal charges satisfy thermodynamic equilibrium.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
};

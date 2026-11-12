import React from 'react';
import { useSessionMolecule } from './SessionMoleculeContext';
import { 
  Atom, 
  FlaskConical, 
  RotateCcw, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Search, 
  Sparkles,
  Layers,
  ChevronRight,
  Ruler
} from 'lucide-react';

export interface MolecularBuilderHUDProps {
  measurementMode?: boolean;
  onToggleMeasurement?: () => void;
}

export function MolecularBuilderHUD({ measurementMode, onToggleMeasurement }: MolecularBuilderHUDProps) {
  const {
    molecule,
    selectedAtomId,
    lastAddedAtomId,
    source,
    canonicalOriginFormula,
    analysis,
    isSessionActive,
    moleculeLoadStatus,
    moleculeLoadError,
    addAtom,
    removeAtom,
    changeBondOrder,
    restoreLastRemoved,
    lastRemovedAtom,
    clearBuilder,
    selectAtom
  } = useSessionMolecule();

  if (moleculeLoadStatus === 'LOADING') {
    return (
      <aside className="absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-blue-200 bg-white/95 p-4 text-slate-800 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 text-blue-700 font-mono text-xs font-semibold tracking-wider">
          <FlaskConical className="h-4 w-4" /> RESOLVING MOLECULE
        </div>
        <p className="mt-2 text-xs text-slate-600">Retrieving the compound identity, molecular graph, and available 3D conformer from PubChem…</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full w-2/3 rounded-full bg-blue-600 animate-pulse" /></div>
      </aside>
    );
  }

  if (moleculeLoadStatus === 'ERROR') {
    return (
      <aside className="absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-amber-200 bg-white/95 p-4 text-slate-800 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 text-amber-700 font-mono text-xs font-semibold tracking-wider">
          <AlertTriangle className="h-4 w-4" /> STRUCTURE NOT VERIFIED
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{moleculeLoadError || 'No verified 3D structure is currently available for this input.'}</p>
        <p className="mt-2 text-[10px] text-slate-500">Try a more specific compound name, an exact SMILES string prefixed with SMILES:, or a returned CID.</p>
      </aside>
    );
  }

  if (!isSessionActive || !molecule || molecule.atoms.length === 0) return null;

  const selectedAtom = molecule.atoms.find(a => a.id === selectedAtomId) || null;
  const currentAtomId = selectedAtomId || lastAddedAtomId;

  return (
    <aside 
      id="molecular-builder-hud"
      aria-label="Interactive Molecular Builder HUD"
      className="absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-blue-200/30 bg-white/85 backdrop-blur-md p-4 text-slate-800 shadow-2xl transition-all duration-300 pointer-events-auto"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-blue-200/20 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/70 border border-blue-200/40 text-blue-700">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-blue-700 font-mono uppercase">
              Molecular Builder
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              {source === 'REMOTE_REFERENCE'
                ? 'PubChem 3D conformer'
                : source === 'LIBRARY_DERIVATIVE'
                  ? `Derivative of ${canonicalOriginFormula || 'Canonical'}`
                  : source === 'CUSTOM_BUILDER'
                    ? 'Interactive Session Graph'
                    : 'Canonical Library'}
            </p>
          </div>
        </div>

        <button
          id="close-molecular-builder-btn"
          onClick={() => clearBuilder()}
          aria-label="Close builder"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          title="Reset / Close Workspace"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Primary Structure Identification */}
      <section className="mt-3 rounded-lg bg-white/80 border border-slate-200 p-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-blue-700 tracking-wide">
              {analysis?.formula || 'C'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({molecule.atoms.length} {molecule.atoms.length === 1 ? 'atom' : 'atoms'}, {molecule.bonds.length} {molecule.bonds.length === 1 ? 'bond' : 'bonds'})
            </span>
          </div>

          <span className="rounded bg-blue-50/60 border border-blue-200/30 px-2 py-0.5 text-[10px] font-mono text-blue-700">
            {analysis?.estimatedGeometry || 'Single Atom'}
          </span>
        </div>

        {/* Geometry & Hybridization Meta */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded bg-white/60 p-1.5 border border-slate-200/80">
            <span className="text-slate-500 block text-[9px]">HYBRIDIZATION</span>
            <span className="text-blue-700 font-semibold">{analysis?.estimatedHybridization || 'sp³'}</span>
          </div>
          <div className="rounded bg-white/60 p-1.5 border border-slate-200/80">
            <span className="text-slate-500 block text-[9px]">NET CHARGE</span>
            <span className={`font-semibold ${(analysis?.totalFormalCharge ?? 0) === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {analysis ? ((analysis?.totalFormalCharge ?? 0) > 0 ? `+${(analysis?.totalFormalCharge ?? 0)}` : (analysis?.totalFormalCharge ?? 0)) : '0'}
            </span>
          </div>
        </div>
      </section>

      {/* Selected Atom or Active Node Info */}
      <section className="mt-3 rounded-lg bg-white/60 border border-slate-200/80 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
            <Atom className="h-3 w-3 text-blue-700" /> Active Focus:
          </span>
          <span className="font-mono text-blue-700 font-medium">
            {selectedAtom ? `${selectedAtom.element} (${selectedAtom.id})` : (lastAddedAtomId ? `Last: ${lastAddedAtomId}` : 'None')}
          </span>
        </div>

        {/* Atom Selection Pills */}
        <div className="mt-2 flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
          {molecule.atoms.map((a, idx) => {
            const isSel = selectedAtomId === a.id;
            return (
              <button
                key={a.id}
                id={`select-atom-${a.id}`}
                onClick={() => selectAtom(isSel ? null : a.id)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                  isSel
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-50/90 text-slate-600 hover:bg-slate-700'
                }`}
              >
                {a.element}<sub>{idx + 1}</sub>
              </button>
            );
          })}
        </div>
      </section>

      {/* Educational Valence Warnings */}
      {analysis && analysis.warnings.length > 0 && (
        <section className="mt-3 rounded-lg bg-amber-950/30 border border-amber-500/30 p-2.5 text-[11px] text-amber-200 font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Educational Valence Notes</span>
          </div>
          <ul className="space-y-1 text-[10px] text-amber-200/90 list-disc list-inside">
            {analysis.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis && analysis.warnings.length === 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-2 text-[10px] text-emerald-300 font-mono">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <span>Valence & octet satisfied with 0 net formal charge.</span>
        </div>
      )}

      {/* Quick Interactive Construction Actions */}
      <footer className="mt-3 pt-2 border-t border-slate-200">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
          Interactive Direct Commands
        </span>
        
        {/* Row 1: Add Elements */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            id="builder-add-o-btn"
            onClick={() => addAtom('O', currentAtomId || undefined, 1)}
            className="flex items-center justify-center gap-1 rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 p-1.5 text-[10px] font-mono text-slate-700 transition-colors"
          >
            <Plus className="h-3 w-3 text-blue-700" /> O
          </button>
          <button
            id="builder-add-h-btn"
            onClick={() => addAtom('H', currentAtomId || undefined, 1)}
            className="flex items-center justify-center gap-1 rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 p-1.5 text-[10px] font-mono text-slate-700 transition-colors"
          >
            <Plus className="h-3 w-3 text-blue-700" /> H
          </button>
          <button
            id="builder-add-c-btn"
            onClick={() => addAtom('C', currentAtomId || undefined, 1)}
            className="flex items-center justify-center gap-1 rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 p-1.5 text-[10px] font-mono text-slate-700 transition-colors"
          >
            <Plus className="h-3 w-3 text-blue-700" /> C
          </button>
          <button
            id="builder-add-n-btn"
            onClick={() => addAtom('N', currentAtomId || undefined, 1)}
            className="flex items-center justify-center gap-1 rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 p-1.5 text-[10px] font-mono text-slate-700 transition-colors"
          >
            <Plus className="h-3 w-3 text-blue-700" /> N
          </button>
        </div>

        {/* Row 2: Bond Orders & Edits */}
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          <button
            id="builder-double-bonds-btn"
            onClick={() => changeBondOrder({ allBonds: true }, 2)}
            className="rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 py-1 text-[10px] font-mono text-slate-700 transition-colors"
            title="Set double bonds"
          >
            Double (=)
          </button>
          <button
            id="builder-triple-bonds-btn"
            onClick={() => changeBondOrder({ allBonds: true }, 3)}
            className="rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 py-1 text-[10px] font-mono text-slate-700 transition-colors"
            title="Set triple bonds"
          >
            Triple (≡)
          </button>
          <button
            id="builder-single-bonds-btn"
            onClick={() => changeBondOrder({ allBonds: true }, 1)}
            className="rounded bg-white border border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 py-1 text-[10px] font-mono text-slate-700 transition-colors"
            title="Set single bonds"
          >
            Single (-)
          </button>
        </div>

        {/* Row 3: Graph Mutation Utilities */}
        <div className="mt-1.5 flex gap-1.5">
          <button
            id="builder-remove-atom-btn"
            onClick={() => removeAtom()}
            className="flex-1 flex items-center justify-center gap-1 rounded bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 py-1 text-[10px] font-mono text-red-300 transition-colors"
            title="Remove active atom"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
          <button
            onClick={() => onToggleMeasurement && onToggleMeasurement()}
            className={`flex-1 flex items-center justify-center gap-1 rounded border py-1 text-[10px] font-mono transition-colors ${
              measurementMode 
                ? 'bg-green-500/30 border-green-400 text-green-200 shadow-[0_0_10px_rgba(74,222,128,0.2)]'
                : 'bg-white/60 border-slate-200 hover:border-blue-200/50 hover:bg-blue-50/40 text-slate-600'
            }`}
            title="Toggle Measurement Mode"
          >
            <Ruler className="h-3 w-3" /> Measure
          </button>

          {lastRemovedAtom && (
            <button
              id="builder-restore-atom-btn"
              onClick={() => restoreLastRemoved()}
              className="flex-1 flex items-center justify-center gap-1 rounded bg-blue-50/40 border border-blue-200/30 hover:bg-blue-50/50 py-1 text-[10px] font-mono text-blue-700 transition-colors"
              title="Restore last removed atom"
            >
              <RotateCcw className="h-3 w-3" /> Restore ({lastRemovedAtom.atom.element})
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}

import React from 'react';
import { useSessionMolecule } from './SessionMoleculeContext';
import { CHEMISTRY_UI, ChemistryStatusPill, formatMolecularFormula } from './ChemistryWorkspaceUI';
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
  visible?: boolean;
}

export function MolecularBuilderHUD({ measurementMode, onToggleMeasurement, visible = true }: MolecularBuilderHUDProps) {
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

  if (!visible) return null;

  if (moleculeLoadStatus === 'LOADING') {
    return (
      <aside className={`absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] ${CHEMISTRY_UI.panel} p-4 pointer-events-auto`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-2 ${CHEMISTRY_UI.eyebrow}`}><FlaskConical className="h-4 w-4" /> Resolving molecule</div>
          <ChemistryStatusPill status="LOADING" />
        </div>
        <p className="mt-2 text-xs text-slate-600">Checking the ADVIS local chemistry library and PubChem for compound identity, molecular graph, and available coordinates…</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full w-2/3 rounded-full bg-blue-600 animate-pulse" /></div>
      </aside>
    );
  }

  if (moleculeLoadStatus === 'ERROR') {
    return (
      <aside className={`absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] ${CHEMISTRY_UI.panel} p-4 pointer-events-auto`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-2 ${CHEMISTRY_UI.eyebrow}`}><AlertTriangle className="h-4 w-4" /> Structure status</div>
          <ChemistryStatusPill status="ERROR" label="NOT VERIFIED" />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{moleculeLoadError || 'No verified 3D structure is currently available for this input.'}</p>
        <p className="mt-2 text-[10px] text-slate-500">Try a more specific compound name, an exact SMILES string prefixed with SMILES:, or a returned CID.</p>
      </aside>
    );
  }

  if (!isSessionActive || !molecule || molecule.atoms.length === 0) return null;

  const selectedAtom = molecule.atoms.find(a => a.id === selectedAtomId) || null;
  const currentAtomId = selectedAtomId || lastAddedAtomId;
  const structureResult = molecule.metadata?.structureResult;
  const coordinateKind = structureResult?.coordinates?.kind;
  const coordinateLabel = coordinateKind === 'source_3d'
    ? 'SOURCE-SUPPLIED 3D CONFORMER'
    : coordinateKind === 'generated_3d'
      ? 'GENERATED 3D CONFORMER'
      : coordinateKind === 'local_library_3d'
        ? 'LOCAL LIBRARY COORDINATES · NOT SOURCE-SUPPLIED'
        : coordinateKind === 'source_2d'
          ? 'SOURCE-SUPPLIED 2D COORDINATES'
          : null;
  const provenance = structureResult?.provenance;
  const validation = structureResult?.validation;
  const graphNetCharge = molecule.atoms.reduce(
    (total, atom) => total + (Number.isInteger(atom.charge) ? Number(atom.charge) : 0),
    0
  );

  return (
    <aside 
      id="molecular-builder-hud"
      aria-label="Interactive Molecular Builder HUD"
      className={`absolute top-20 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] ${CHEMISTRY_UI.panel} p-4 transition-all duration-300 pointer-events-auto`}
    >
      {/* Header */}
      <header className={CHEMISTRY_UI.panelHeader}>
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/70 border border-blue-200/40 text-blue-700">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h2 className={CHEMISTRY_UI.eyebrow}>
              Molecular Builder
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              {coordinateLabel || (source === 'REMOTE_REFERENCE'
                ? 'PubChem reference'
                : source === 'LIBRARY_DERIVATIVE'
                  ? `ADVIS library · ${canonicalOriginFormula || 'Canonical'}`
                  : source === 'CUSTOM_BUILDER'
                    ? 'Interactive Session Graph'
                    : 'Canonical Library')}
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
      <section className="mt-3 rounded-lg border border-blue-100 bg-white/75 p-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-blue-700 tracking-wide">
              {formatMolecularFormula(structureResult?.identity?.formula || molecule.metadata?.formula || analysis?.formula || 'Not available')}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({molecule.atoms.length} {molecule.atoms.length === 1 ? 'atom' : 'atoms'}, {molecule.bonds.length} {molecule.bonds.length === 1 ? 'bond' : 'bonds'})
            </span>
          </div>

          <span className="rounded bg-blue-50/60 border border-blue-200/30 px-2 py-0.5 text-[10px] font-mono text-blue-700">
            {analysis?.estimatedGeometry || 'Geometry not assessed'}
          </span>
        </div>

        {/* Geometry & Hybridization Meta */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded bg-white/60 p-1.5 border border-slate-200/80">
            <span className={`block ${CHEMISTRY_UI.label}`}>HYBRIDIZATION (EST.)</span>
            <span className="font-semibold text-blue-800">{analysis?.estimatedHybridization || 'Not assessed'}</span>
          </div>
          <div className="rounded bg-white/60 p-1.5 border border-slate-200/80">
            <span className="text-slate-500 block text-[9px]">NET CHARGE</span>
            <span className={`font-semibold ${graphNetCharge === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {graphNetCharge > 0 ? `+${graphNetCharge}` : graphNetCharge}
            </span>
          </div>
        </div>
        {structureResult && (
          <div className="mt-2 border-t border-slate-200 pt-2 space-y-1 text-[9px] font-mono text-slate-500">
            <div className="flex items-start justify-between gap-2">
              <span>PROVIDER</span>
              <span className="text-right text-slate-600">{provenance?.providerLabel || provenance?.provider || 'Unspecified'}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span>COORDINATE ORIGIN</span>
              <span className="text-right text-slate-600">{coordinateLabel || 'Not classified'}</span>
            </div>
            {provenance?.sourceUrl ? (
              <div className="flex items-center justify-between gap-2">
                <span>SOURCE RECORD</span>
                <a href={provenance.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline underline-offset-2">
                  {provenance.provider === 'pubchem' ? `PubChem CID ${structureResult.identity?.cid}` : 'Open source'}
                </a>
              </div>
            ) : provenance?.evidence === 'local_library' ? (
              <div className="text-slate-500">LOCAL TEACHING LIBRARY · NOT AN EXTERNAL SOURCE CONFORMER</div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <span>GRAPH VALIDATION</span>
              <span className={validation?.valid ? 'text-emerald-700' : 'text-amber-700'}>
                {validation?.valid ? (validation?.warnings?.length ? `PASSED · ${validation.warnings.length} WARNING(S)` : 'PASSED') : 'NOT VERIFIED'}
              </span>
            </div>
            {coordinateKind === 'generated_3d' && (
              <div className="text-amber-700">
                {provenance?.provider === 'pubchem'
                  ? 'COMPUTED BY PUBCHEM · NOT AN EXPERIMENTAL OR DEPOSITED SOURCE CONFORMER'
                  : 'GENERATED COORDINATES · NOT SOURCE-SUPPLIED CONFORMER DATA'}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Selected Atom or Active Node Info */}
      <section className="mt-3 rounded-lg border border-blue-100 bg-blue-50/30 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className={`flex items-center gap-1 ${CHEMISTRY_UI.label}`}>
            <Atom className="h-3 w-3 text-blue-700" /> Active Focus:
          </span>
          <span className="font-mono text-blue-800 font-medium">
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
        <section className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] font-mono text-amber-900">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Educational Valence Notes</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-[10px] text-amber-900/90">
            {analysis.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis && analysis.warnings.length === 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 p-2 font-mono text-[10px] text-blue-800">
          <Info className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
          <span>No warnings from the educational valence analyzer.</span>
        </div>
      )}

      {/* Quick Interactive Construction Actions */}
      <footer className={`mt-3 border-t pt-2 ${CHEMISTRY_UI.divider}`}>
        <span className={`mb-1.5 block ${CHEMISTRY_UI.label}`}>
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

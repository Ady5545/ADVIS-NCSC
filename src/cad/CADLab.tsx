import React, { useCallback, useState } from 'react';
import { Upload, Cuboid, Ruler, Database, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { CadModelCanvas } from './CadModelCanvas';
import { importCadFile } from './CadKernelService';
import type { CadImportProgress, CadModelData } from './CadTypes';

export function CADLab() {
  const [model, setModel] = useState<CadModelData | null>(null);
  const [progress, setProgress] = useState<CadImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linearDeflection, setLinearDeflection] = useState(0.05);
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const [sectionOffset, setSectionOffset] = useState(0);

  const load = useCallback(async (file?: File, deflection = linearDeflection) => {
    if (!file) return;
    setError(null);
    setModel(null);
    try {
      const data = await importCadFile(file, setProgress, { linearDeflection: deflection, angularDeflection: 0.22 });
      setModel(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CAD import failed.');
      setProgress(null);
    }
  }, [linearDeflection]);

  const reloadAtAccuracy = () => {
    const fileName = model?.name;
    if (!fileName || !model) return;
    setError('Resolution controls are applied when the source CAD file is imported again; the source file is intentionally not retained by this viewer.');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-3">
        <div>
          <h3 className="text-cyan-300 font-bold tracking-wider text-base flex items-center gap-2">
            <Cuboid size={19} />
            CAD REFERENCE LAB
          </h3>
          <p className="text-xs text-cyan-400/65 font-mono mt-1">
            Import real STEP/BREP geometry locally, inspect its physical bounds, and use the result as the geometry-authoritative reference.
          </p>
        </div>
        <label className="shrink-0 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 text-xs font-mono">
          <Upload size={14} />
          IMPORT CAD
          <input
            type="file"
            accept=".step,.stp,.brep,.brp"
            className="hidden"
            onChange={(event) => load(event.target.files?.[0])}
          />
        </label>
      </div>

      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/60 p-3 text-[10px] font-mono text-cyan-400/80">
        <div className="flex items-center gap-2">
          {progress && progress.progress < 1 ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
          <span>{progress?.detail || 'No CAD asset loaded.'}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {model && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 flex-1 min-h-0">
          <div className="flex flex-col gap-3 min-h-0">
            <CadModelCanvas
              model={model}
              sectionEnabled={sectionEnabled}
              sectionOffset={sectionOffset}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="rounded-lg border border-cyan-500/15 bg-slate-950/80 p-2">
                <div className="text-cyan-400/55 uppercase">Surface accuracy</div>
                <div className="text-cyan-100 font-bold mt-1">{linearDeflection.toFixed(2)} mm</div>
                <input
                  aria-label="CAD surface accuracy"
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={linearDeflection}
                  onChange={(event) => setLinearDeflection(Number(event.target.value))}
                  className="w-full accent-cyan-400 mt-1"
                />
                <button
                  type="button"
                  onClick={reloadAtAccuracy}
                  className="mt-2 w-full rounded border border-cyan-500/30 bg-cyan-500/10 py-1 text-cyan-200"
                >
                  APPLY TO NEXT IMPORT
                </button>
              </div>
              <label className="rounded-lg border border-amber-500/20 bg-slate-950/80 p-2 cursor-pointer">
                <div className="flex items-center justify-between text-amber-200 uppercase">
                  <span>Section plane</span>
                  <input
                    type="checkbox"
                    checked={sectionEnabled}
                    onChange={(event) => setSectionEnabled(event.target.checked)}
                  />
                </div>
                <div className="text-amber-200/60 mt-2">Move the cut through the imported mesh to inspect enclosed regions.</div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.01"
                  value={sectionOffset}
                  onChange={(event) => setSectionOffset(Number(event.target.value))}
                  className="w-full accent-amber-400 mt-2"
                  disabled={!sectionEnabled}
                />
              </label>
              <div className="rounded-lg border border-emerald-500/15 bg-slate-950/80 p-2">
                <div className="text-emerald-300/70 uppercase">Mesh generated</div>
                <div className="text-emerald-100 font-bold mt-1">
                  {model.mesh.vertexCount ?? Math.round(model.mesh.positions.length / 3)} vertices
                </div>
                <div className="text-emerald-100/70 mt-0.5">
                  {model.mesh.triangleCount ?? Math.round(model.mesh.indices.length / 3)} triangles
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-slate-950/75 p-4 font-mono space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <CheckCircle2 size={14} />
              CAD GEOMETRY LOADED
            </div>
            <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Source</div>
            <div className="text-xs text-cyan-100 break-all">{model.name}</div>
            <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Format</div>
            <div className="text-xs text-cyan-200">{model.format}</div>
            <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Volume</div>
            <div className="text-xs text-cyan-200">{model.volume !== null ? `${model.volume.toFixed(2)} mm³` : 'Unavailable'}</div>
            <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider flex items-center gap-1">
              <Ruler size={11} /> Bounding Size
            </div>
            <div className="text-xs text-cyan-200">
              {model.bounds ? model.bounds.size.map((v) => v.toFixed(2)).join(' × ') + ' mm' : 'Unavailable'}
            </div>
            <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Inspection depth</div>
            <div className="text-xs text-cyan-200">
              {sectionEnabled ? 'SECTION PLANE ACTIVE' : 'EXTERIOR / ASSEMBLY VIEW'}
            </div>
            <div className="pt-2 border-t border-cyan-500/10 text-[10px] leading-relaxed text-cyan-400/65">
              The display mesh is tessellated from exact CAD/B-rep geometry; changing tessellation density only changes presentation resolution, not the source topology.
            </div>
          </div>
        </div>
      )}

      {!model && !error && (
        <label
          className="flex-1 min-h-[320px] rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/20 transition-colors cursor-pointer flex flex-col items-center justify-center text-center p-8"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void load(event.dataTransfer.files?.[0]);
          }}
        >
          <Upload size={32} className="text-cyan-400/70 mb-4" />
          <div className="text-sm text-cyan-200 font-bold">Drop a CAD part here</div>
          <div className="text-xs text-cyan-400/60 mt-2 max-w-md">
            STEP/STP and BREP are the preferred geometry-authoritative formats for ADVIS. Files stay in the browser during this import path.
          </div>
          <input
            type="file"
            accept=".step,.stp,.brep,.brp,.iges,.igs"
            className="hidden"
            onChange={(event) => void load(event.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}

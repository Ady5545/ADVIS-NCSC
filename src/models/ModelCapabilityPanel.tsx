import React, { useMemo, useState } from 'react';
import { Download, Search, X } from 'lucide-react';
import { SPATIAL_LIBRARY } from '../SpatialLibrary';
import { LEARNING_LESSONS } from '../learning/LessonCatalog';
import { buildModelCapabilityMatrix, validateModelCapabilityMatrix, type CapabilityStatus } from './ModelCapabilityMatrix';

export interface ModelCapabilityPanelProps {
  activeModelId?: string | null;
  onClose: () => void;
}

function statusLabel(value: CapabilityStatus): string {
  return value === 'SUPPORTED' ? 'Supported' : value === 'UNSUPPORTED' ? 'Not supported' : 'Not verified';
}

function statusClass(value: CapabilityStatus): string {
  return value === 'SUPPORTED'
    ? 'text-emerald-300'
    : value === 'UNSUPPORTED'
      ? 'text-slate-500'
      : 'text-amber-300';
}

export function ModelCapabilityPanel({ activeModelId, onClose }: ModelCapabilityPanelProps) {
  const matrix = useMemo(
    () => buildModelCapabilityMatrix(SPATIAL_LIBRARY, LEARNING_LESSONS),
    [],
  );
  const issues = useMemo(
    () => validateModelCapabilityMatrix(SPATIAL_LIBRARY, LEARNING_LESSONS),
    [],
  );
  const [query, setQuery] = useState('');
  const [showIssues, setShowIssues] = useState(false);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matrix.filter((row) => {
      if (showIssues && row.limitations.length === 0) return false;
      if (!needle) return true;
      return [row.name, row.id, row.domain, row.geometrySource, row.simulationStatus]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [matrix, query, showIssues]);

  const downloadMatrix = () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        notice: 'This matrix reports declared capabilities and the app’s generic visual workspace. UNKNOWN means no capability claim was confirmed; it does not mean a feature is impossible.',
        models: matrix,
        validationIssues: issues,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'advis-model-capability-matrix.json';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Matrix remains visible even when file downloads are unavailable.
    }
  };

  return (
    <div className="fixed inset-0 z-[119] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="model-capability-title">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-2xl">
        <header className="flex items-start gap-3 border-b border-cyan-500/20 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-400">Model registry · capability contract</div>
            <h2 id="model-capability-title" className="mt-1 text-lg font-semibold">Model capability matrix</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Supported means the application has a defined path for the feature; Not verified means the catalog has not established it. A detailed mesh is not proof of CAD or validated simulation.</p>
          </div>
          <button type="button" onClick={downloadMatrix} className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 text-[10px] hover:bg-slate-900" aria-label="Download model capability matrix"><Download size={13} /> Export</button>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-900" aria-label="Close capability matrix"><X size={15} /></button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 p-3 sm:p-4">
          <label className="flex min-w-[190px] flex-1 items-center gap-2 rounded-lg border border-slate-700 px-3">
            <Search size={13} className="text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} aria-label="Search model capability matrix" placeholder="Search model, domain or source…" className="w-full bg-transparent py-2 text-xs outline-none placeholder:text-slate-500" />
          </label>
          <button type="button" aria-pressed={showIssues} onClick={() => setShowIssues((current) => !current)} className={`rounded-lg border px-3 py-2 text-[10px] ${showIssues ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200' : 'border-slate-700 text-slate-300 hover:bg-slate-900'}`}>Show limitations</button>
          <span className="text-[10px] text-slate-500">{filtered.length} of {matrix.length} models</span>
        </div>

        <div className="grid grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {filtered.map((row) => (
            <article key={row.id} className={`rounded-xl border p-3 ${row.id === activeModelId ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-semibold" title={row.name}>{row.name}</h3>
                  <p className="mt-1 break-all text-[9px] text-slate-500">{row.id}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{row.domain} · {row.componentCount} components</p>
                </div>
                {row.id === activeModelId && <span className="shrink-0 rounded border border-cyan-600/30 px-1.5 py-1 text-[8px] text-cyan-200">ACTIVE</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[9px]">
                <div><div className="text-slate-500">Geometry source</div><div className="break-words text-slate-200">{row.geometrySource}</div></div>
                <div><div className="text-slate-500">Dimensions</div><div className="text-slate-200">{row.dimensionsStatus}</div></div>
                <div><div className="text-slate-500">Simulation</div><div className="text-slate-200">{row.simulationStatus}</div></div>
                <div><div className="text-slate-500">Guided lesson</div><div className={row.hasLesson ? 'text-emerald-300' : 'text-slate-500'}>{row.hasLesson ? 'Available' : 'No lesson registered'}</div></div>
              </div>
              <div className="mt-3 border-t border-slate-800 pt-2">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Declared model capabilities</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {(['inspect', 'componentHierarchy', 'hideShow', 'isolate', 'explode', 'sectionPlane', 'measure', 'kinematics', 'validatedSimulation', 'parameterEditing', 'saveProject', 'exportGlb', 'exportStep', 'deepZoom', 'interiorGeometry'] as const).map((capability) => (
                    <div key={capability} className="flex items-start justify-between gap-1 text-[9px]">
                      <span className="break-words text-slate-400">{capability.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`shrink-0 ${statusClass(row.capabilities[capability])}`}>{statusLabel(row.capabilities[capability])}</span>
                    </div>
                  ))}
                </div>
              </div>
              {row.limitations.length > 0 && (
                <details className="mt-3 border-t border-slate-800 pt-2">
                  <summary className="cursor-pointer text-[9px] text-amber-300">Evidence and limitations ({row.limitations.length})</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[9px] leading-relaxed text-slate-400">
                    {row.limitations.slice(0, 6).map((limitation, index) => <li key={index}>{limitation}</li>)}
                  </ul>
                </details>
              )}
            </article>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-xs text-slate-500">No models match this filter.</p>}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-[9px] text-slate-500 sm:px-6">
          <span>{issues.filter((issue) => issue.severity === 'ERROR').length} validation errors · {issues.filter((issue) => issue.severity === 'WARNING').length} warnings</span>
          <span>Generic visual project tools do not imply source CAD, physical measurement or manufacturing approval.</span>
        </footer>
      </section>
    </div>
  );
}

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Download, FileUp, RotateCcw, Save, Undo2, Redo2, X, Copy, AlertTriangle, Box } from 'lucide-react';
import { SPATIAL_LIBRARY, type ObjectMetadata } from '../SpatialLibrary';
import {
  applyWorkshopTransform,
  createWorkshopProjectFromSource,
  deleteWorkshopProject,
  exportWorkshopProject,
  importWorkshopProject,
  loadWorkshopProjects,
  redoWorkshopProject,
  resetWorkshopProjectToSource,
  saveWorkshopProject,
  undoWorkshopProject,
} from './WorkshopStore';
import type { ComponentTransform, WorkshopProject } from './WorkshopSchema';

interface InnovationWorkshopProps {
  open: boolean;
  onClose: () => void;
  object: ObjectMetadata | null;
  selectedComponentId?: string | null;
  componentTransforms?: Record<string, ComponentTransform>;
  onSelectComponent?: (componentId: string | null) => void;
  onUpdateComponentTransform?: (componentId: string, transform: ComponentTransform) => void;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalTransform(object: ObjectMetadata, componentId: string): ComponentTransform | null {
  const component = object.components.find((item) => item.id === componentId);
  if (!component) return null;
  return {
    position: [...component.position] as [number, number, number],
    rotation: [...(component.rotation || [0, 0, 0])] as [number, number, number],
    scale: [1, 1, 1],
  };
}

function changedComponents(project: WorkshopProject, object: ObjectMetadata): string[] {
  return object.components.filter((component) => {
    const canonical = canonicalTransform(object, component.id);
    const current = project.componentTransforms[component.id] || canonical;
    return Boolean(canonical && current && JSON.stringify(canonical) !== JSON.stringify(current));
  }).map((component) => component.id);
}

export function InnovationWorkshop({
  open,
  onClose,
  object,
  selectedComponentId,
  componentTransforms = {},
  onSelectComponent,
  onUpdateComponentTransform,
}: InnovationWorkshopProps) {
  const [projects, setProjects] = useState<WorkshopProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [componentId, setComponentId] = useState(selectedComponentId || '');
  const [draft, setDraft] = useState<ComponentTransform | null>(null);
  const [projectName, setProjectName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [importInputKey, setImportInputKey] = useState(0);

  const modelProjects = useMemo(
    () => projects.filter((project) => project.sourceModelId === object?.id),
    [projects, object?.id],
  );
  const activeProject = modelProjects.find((project) => project.id === activeProjectId) || null;
  const selectedComponent = object?.components.find((component) => component.id === componentId) || null;
  const dirtyComponents = activeProject && object ? changedComponents(activeProject, object) : [];
  const canUndo = Boolean(activeProject && activeProject.cursor > 0);
  const canRedo = Boolean(activeProject && activeProject.cursor < activeProject.commands.length);

  useEffect(() => {
    if (!open || !object) return;
    setProjects(loadWorkshopProjects(SPATIAL_LIBRARY));
    setComponentId((current) => object.components.some((item) => item.id === current)
      ? current
      : (selectedComponentId && object.components.some((item) => item.id === selectedComponentId)
        ? selectedComponentId
        : object.components[0]?.id || ''));
    setActiveProjectId('');
    setDraft(null);
    setError('');
    setStatus('');
  }, [open, object?.id]);

  useEffect(() => {
    if (!open || !object || !componentId) {
      setDraft(null);
      return;
    }
    const transform = activeProject?.componentTransforms[componentId] ||
      componentTransforms[componentId] ||
      canonicalTransform(object, componentId);
    setDraft(transform ? clone(transform) : null);
  }, [open, object?.id, componentId, activeProjectId, activeProject?.revision]);

  const refreshProjects = () => setProjects(loadWorkshopProjects(SPATIAL_LIBRARY));

  const persistProject = (next: WorkshopProject) => {
    const saved = saveWorkshopProject(next, SPATIAL_LIBRARY);
    if (!saved) {
      setError('Could not save locally. Browser storage may be unavailable or full; export a JSON copy before leaving.');
    } else {
      setError('');
      setStatus('Saved on this device only.');
    }
    refreshProjects();
    setProjects((current) => [next, ...current.filter((project) => project.id !== next.id)].slice(0, 24));
    setActiveProjectId(next.id);
  };

  const applyProjectToScene = (project: WorkshopProject) => {
    if (!object || project.sourceModelId !== object.id) return;
    for (const component of object.components) {
      const next = project.componentTransforms[component.id] || canonicalTransform(object, component.id);
      if (next) onUpdateComponentTransform?.(component.id, clone(next));
    }
  };

  const createCopy = () => {
    if (!object) return;
    const next = createWorkshopProjectFromSource(object, componentTransforms);
    if (projectName.trim()) next.name = projectName.trim().slice(0, 120);
    persistProject(next);
    applyProjectToScene(next);
    setDraft(next.componentTransforms[componentId] ? clone(next.componentTransforms[componentId]) : null);
    setStatus('Editable copy created. The catalog entry remains unchanged.');
  };

  const selectSavedProject = (nextId: string) => {
    setActiveProjectId(nextId);
    const next = modelProjects.find((item) => item.id === nextId);
    if (next) {
      applyProjectToScene(next);
      setStatus('Loaded local project copy.');
      setError('');
    }
  };

  const commitDraft = () => {
    if (!object || !activeProject || !componentId || !draft) return;
    const next = applyWorkshopTransform(activeProject, object, componentId, draft);
    if (next === activeProject) {
      setStatus('No valid transform change to apply.');
      return;
    }
    onUpdateComponentTransform?.(componentId, clone(next.componentTransforms[componentId]));
    persistProject(next);
  };

  const undo = () => {
    if (!activeProject) return;
    const next = undoWorkshopProject(activeProject);
    if (next === activeProject) return;
    persistProject(next);
    applyProjectToScene(next);
    setStatus('Undid the last transform command.');
  };

  const redo = () => {
    if (!activeProject) return;
    const next = redoWorkshopProject(activeProject);
    if (next === activeProject) return;
    persistProject(next);
    applyProjectToScene(next);
    setStatus('Redid the last transform command.');
  };

  const resetToSource = () => {
    if (!activeProject || !object) return;
    const next = resetWorkshopProjectToSource(activeProject, object);
    persistProject(next);
    applyProjectToScene(next);
    setDraft(canonicalTransform(object, componentId));
    setStatus('Copy reset to the source model transforms. Catalog metadata was not modified.');
  };

  const downloadProject = () => {
    if (!activeProject || typeof document === 'undefined') return;
    const blob = new Blob([exportWorkshopProject(activeProject)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeProject.name.replace(/[^a-z0-9-_]+/gi, '-').slice(0, 70) || 'advis-workshop-project'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus('JSON transform project exported. This is not STEP/CAD geometry.');
  };

  const importProjectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) {
        setError('Project file exceeds the 2 MB limit.');
        return;
      }
      const result = importWorkshopProject(await file.text(), SPATIAL_LIBRARY, object?.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!saveWorkshopProject(result.project, SPATIAL_LIBRARY)) {
        setError('Project validated, but browser storage is unavailable. Exporting after applying is still possible.');
      }
      setProjects((current) => [result.project, ...current.filter((project) => project.id !== result.project.id)].slice(0, 24));
      setActiveProjectId(result.project.id);
      applyProjectToScene(result.project);
      setError('');
      setStatus('Project schema and component IDs validated before loading.');
    } catch {
      setError('Could not read this file. The active project was not changed.');
    } finally {
      setImportInputKey((key) => key + 1);
    }
  };

  const removeActiveProject = () => {
    if (!activeProject) return;
    deleteWorkshopProject(activeProject.id, SPATIAL_LIBRARY);
    setProjects((current) => current.filter((project) => project.id !== activeProject.id));
    setActiveProjectId('');
    setDraft(null);
    setStatus('Local project copy deleted. The catalog source remains available.');
  };

  const updateTuple = (key: 'position' | 'rotation' | 'scale', index: number, raw: string) => {
    const number = Number(raw);
    if (!draft || !Number.isFinite(number)) return;
    const tuple = [...draft[key]] as [number, number, number];
    tuple[index] = number;
    setDraft({ ...draft, [key]: tuple });
  };

  if (!open || !object) return null;

  const tupleField = (key: 'position' | 'rotation' | 'scale', title: string, helper: string) => (
    <fieldset className="rounded-xl border border-slate-700 p-3">
      <legend className="px-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{title}</legend>
      <div className="grid grid-cols-3 gap-2">
        {(['X', 'Y', 'Z'] as const).map((axis, index) => (
          <label key={axis} className="min-w-0 text-[10px] text-slate-400">
            {axis}
            <input
              aria-label={`${title} ${axis}`}
              type="number"
              step={key === 'scale' ? 0.1 : 0.01}
              min={key === 'scale' ? 0.0001 : -10000}
              max={key === 'scale' ? 100 : 10000}
              value={draft?.[key][index] ?? 0}
              onChange={(event) => updateTuple(key, index, event.currentTarget.value)}
              className="mt-1 block w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-500">{helper}</p>
    </fieldset>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="advis-workshop-title">
      <section className="flex max-h-[95dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950 text-slate-100 shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-800 p-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300"><Box size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">Innovation workshop · local first</div>
            <h2 id="advis-workshop-title" className="mt-1 text-lg font-semibold sm:text-xl">Create a design copy</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{object.name} · {object.modelKind || 'Catalog model'} · edits are visual transform edits, not CAD feature edits.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close innovation workshop" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400"><X size={16} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400" htmlFor="advis-workshop-name">Copy name</label>
                <input id="advis-workshop-name" value={projectName} onChange={(event) => setProjectName(event.currentTarget.value)} maxLength={120} placeholder={`${object.name} — My copy`} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-cyan-400" />
                <button type="button" onClick={createCopy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"><Copy size={14} /> Create my copy</button>
              </div>

              <div className="rounded-xl border border-slate-800 p-3">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400" htmlFor="advis-workshop-saved">Saved copies for this model</label>
                <select id="advis-workshop-saved" value={activeProjectId} onChange={(event) => selectSavedProject(event.currentTarget.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-cyan-400">
                  <option value="">Select a saved copy…</option>
                  {modelProjects.map((project) => <option key={project.id} value={project.id}>{project.name} · r{project.revision}</option>)}
                </select>
                {activeProject && (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-slate-900 p-2"><div className="text-slate-500">CHANGED PARTS</div><div className="mt-1 text-base font-semibold">{dirtyComponents.length}</div></div>
                      <div className="rounded-lg bg-slate-900 p-2"><div className="text-slate-500">HISTORY</div><div className="mt-1 text-base font-semibold">{activeProject.cursor}/{activeProject.commands.length}</div></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={undo} disabled={!canUndo} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px] disabled:opacity-40"><Undo2 size={12} /> Undo</button>
                      <button type="button" onClick={redo} disabled={!canRedo} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px] disabled:opacity-40"><Redo2 size={12} /> Redo</button>
                      <button type="button" onClick={resetToSource} className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 px-2 py-1.5 text-[10px] text-amber-200"><RotateCcw size={12} /> Reset to source</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => { if (activeProject) { saveWorkshopProject(activeProject, SPATIAL_LIBRARY); setStatus('Saved on this device only.'); } }} className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 px-2 py-1.5 text-[10px] text-emerald-200"><Save size={12} /> Save</button>
                      <button type="button" onClick={downloadProject} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px]"><Download size={12} /> Export JSON</button>
                      <button type="button" onClick={removeActiveProject} className="rounded-md border border-rose-400/30 px-2 py-1.5 text-[10px] text-rose-200">Delete copy</button>
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-[10px] text-slate-300 hover:border-cyan-400">
                      <FileUp size={13} /> Import JSON project
                      <input key={importInputKey} type="file" accept="application/json,.json" onChange={importProjectFile} className="sr-only" aria-label="Import JSON workshop project" />
                    </label>
                  </>
                )}
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 p-3 text-[10px] leading-relaxed text-amber-100/80">
                <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200"><AlertTriangle size={13} /> Fidelity boundary</div>
                The original catalog entry is read-only. This workshop edits only a saved copy's component transforms. JSON exports preserve model identity, transform values, notes, and undo/redo history; they are not GLB, STEP, validated B-REP, or manufacturing CAD.
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 p-3">
                <label htmlFor="advis-workshop-component" className="block text-[10px] uppercase tracking-wider text-slate-400">Component to edit</label>
                <select id="advis-workshop-component" value={componentId} onChange={(event) => { setComponentId(event.currentTarget.value); onSelectComponent?.(event.currentTarget.value); }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-cyan-400">
                  {object.components.map((component) => <option key={component.id} value={component.id}>{component.name}</option>)}
                </select>
                {selectedComponent && <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedComponent.description}</p>}
              </div>
              {activeProject ? (
                <div className="space-y-3">
                  {tupleField('position', 'Position', 'Relative to the model origin; scene units because authoritative dimensions are not declared.')}
                  {tupleField('rotation', 'Rotation', 'Euler rotation values in radians.')}
                  {tupleField('scale', 'Scale', 'Positive, bounded visual scale; this does not regenerate a parametric CAD model.')}
                  <button type="button" disabled={!draft || !componentId} onClick={commitDraft} className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cyan-400">Apply transform to this copy</button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                  <Box size={24} className="mx-auto text-slate-500" />
                  <h3 className="mt-3 text-sm font-semibold">Create a copy to enable editing</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">Changes are disabled until a separate project copy is created or loaded.</p>
                </div>
              )}
            </div>
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-xs text-rose-200">{error}</p>}
          {status && <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3 text-xs text-emerald-200">{status}</p>}
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileUp, RotateCcw, Save, Undo2, Redo2, X, Copy, ArrowLeftRight } from 'lucide-react';
import type { ObjectMetadata, ComponentMetadata } from '../SpatialLibrary';
import {
  canRedoWorkshopProject,
  canUndoWorkshopProject,
  createProjectCopy,
  loadWorkshopProject,
  parseWorkshopProject,
  resetComponentTransform,
  saveWorkshopProject,
  serializeWorkshopProject,
  setComponentTransform,
  undoWorkshopProject,
  redoWorkshopProject,
  type ComponentTransform,
  type WorkshopProject,
} from './WorkshopProject';

type TransformRecord = Record<string, ComponentTransform>;

interface InnovationWorkshopPanelProps {
  model: ObjectMetadata;
  selectedComponentId: string | null;
  componentTransforms: TransformRecord;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponentTransform: (id: string, transform: ComponentTransform) => void;
  onClose: () => void;
}

function canonicalTransform(component: ComponentMetadata): ComponentTransform {
  return {
    position: [...component.position] as [number, number, number],
    rotation: [...(component.rotation || [0, 0, 0])] as [number, number, number],
    scale: [1, 1, 1],
  };
}

function cloneTransform(value: ComponentTransform): ComponentTransform {
  return {
    position: [...value.position] as [number, number, number],
    rotation: [...value.rotation] as [number, number, number],
    scale: [...value.scale] as [number, number, number],
  };
}

export function InnovationWorkshopPanel({
  model,
  selectedComponentId,
  componentTransforms,
  onSelectComponent,
  onUpdateComponentTransform,
  onClose,
}: InnovationWorkshopPanelProps) {
  const source = useMemo(() => ({
    id: model.id,
    name: model.name,
    version: model.modelVersion || 'unversioned',
    components: model.components.map((component) => ({
      id: component.id,
      position: component.position,
      rotation: component.rotation,
      assetScale: component.assetScale,
    })),
  }), [model]);
  const allowedIds = useMemo(() => new Set(source.components.map((component) => component.id)), [source]);
  const [project, setProject] = useState<WorkshopProject>(() => {
    try {
      if (typeof window !== 'undefined') return loadWorkshopProject(window.localStorage, source) || createProjectCopy(source);
    } catch {
      // Private browsing and storage policies may make localStorage unavailable.
    }
    return createProjectCopy(source);
  });
  const updateTransformRef = useRef(onUpdateComponentTransform);
  useEffect(() => { updateTransformRef.current = onUpdateComponentTransform; }, [onUpdateComponentTransform]);
  const [compareToSource, setCompareToSource] = useState(false);
  const [status, setStatus] = useState('');
  const [importKey, setImportKey] = useState(0);

  useEffect(() => {
    let next: WorkshopProject | null = null;
    try {
      if (typeof window !== 'undefined') next = loadWorkshopProject(window.localStorage, source);
    } catch {
      // Continue with a fresh in-memory copy when browser storage is blocked.
    }
    const initial = next || createProjectCopy(source);
    setProject(initial);
    setCompareToSource(false);
    setStatus('');
    setImportKey((value) => value + 1);
    // Re-apply saved copy transforms when the source model changes.
    for (const componentId of Object.keys(initial.transforms)) {
      const transform = initial.transforms[componentId];
      if (allowedIds.has(componentId)) updateTransformRef.current(componentId, cloneTransform(transform));
    }
  }, [source.id, source.version, allowedIds]);

  const selectedComponent = model.components.find((component) => component.id === selectedComponentId) || null;
  const projectTransform = selectedComponent ? project.transforms[selectedComponent.id] : undefined;
  const liveTransform = selectedComponent
    ? (compareToSource ? canonicalTransform(selectedComponent) : componentTransforms[selectedComponent.id] || projectTransform || canonicalTransform(selectedComponent))
    : null;

  const persist = (next: WorkshopProject) => {
    setProject(next);
    if (typeof window !== 'undefined') {
      setStatus(saveWorkshopProject(window.localStorage, next)
        ? 'Saved locally on this device.'
        : 'Local browser storage is unavailable; export the project JSON to keep a copy.');
    } else {
      setStatus('Browser storage is unavailable in this environment.');
    }
  };

  const applyTransformToScene = (next: WorkshopProject) => {
    const affected = new Set([...Object.keys(project.transforms), ...Object.keys(next.transforms)]);
    for (const componentId of affected) {
      const component = model.components.find((candidate) => candidate.id === componentId);
      if (!component) continue;
      const transform = next.transforms[componentId] || canonicalTransform(component);
      onUpdateComponentTransform(componentId, cloneTransform(transform));
    }
  };

  const updateAxis = (kind: keyof ComponentTransform, axis: number, value: number) => {
    if (!selectedComponent || !Number.isFinite(value)) return;
    const current = project.transforms[selectedComponent.id]
      || (compareToSource ? canonicalTransform(selectedComponent) : componentTransforms[selectedComponent.id] || canonicalTransform(selectedComponent));
    const nextTransform = cloneTransform(current);
    nextTransform[kind][axis] = value;
    const result = setComponentTransform(project, selectedComponent.id, nextTransform, allowedIds);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setCompareToSource(false);
    persist(result.project);
    onUpdateComponentTransform(selectedComponent.id, nextTransform);
  };

  const resetSelected = () => {
    if (!selectedComponent) return;
    const result = resetComponentTransform(project, selectedComponent.id, allowedIds);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    persist(result.project);
    onUpdateComponentTransform(selectedComponent.id, canonicalTransform(selectedComponent));
    setCompareToSource(false);
  };

  const doUndo = () => {
    const next = undoWorkshopProject(project);
    if (next === project) return;
    applyTransformToScene(next);
    persist(next);
    setCompareToSource(false);
  };

  const doRedo = () => {
    const next = redoWorkshopProject(project);
    if (next === project) return;
    applyTransformToScene(next);
    persist(next);
    setCompareToSource(false);
  };

  const createFreshCopy = () => {
    const next = createProjectCopy(source, {
      id: `workshop-${source.id}-${Date.now()}`,
      title: `My ${source.name} design`,
    });
    applyTransformToScene(next);
    persist(next);
    setCompareToSource(false);
    setStatus('New visual-edit copy created. The source catalog model remains unchanged.');
  };

  const downloadProject = () => {
    try {
      const blob = new Blob([serializeWorkshopProject(project)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${project.id}.advis-project.json`;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Project JSON exported. This format preserves component transforms and source revision, not mesh/CAD geometry.');
    } catch {
      setStatus('Export failed. Try saving locally or check browser download permissions.');
    }
  };

  const importProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const result = parseWorkshopProject(await file.text(), source);
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      applyTransformToScene(result.project);
      persist(result.project);
      setCompareToSource(false);
      setStatus('Project imported and validated against this model ID and revision.');
    } catch {
      setStatus('Could not read this project file.');
    } finally {
      event.currentTarget.value = '';
      setImportKey((value) => value + 1);
    }
  };

  const toggleCompare = () => {
    if (!selectedComponent) {
      setStatus('Select a component before comparing to source.');
      return;
    }
    const next = !compareToSource;
    setCompareToSource(next);
    onUpdateComponentTransform(
      selectedComponent.id,
      next ? canonicalTransform(selectedComponent) : (project.transforms[selectedComponent.id] || canonicalTransform(selectedComponent)),
    );
    setStatus(next
      ? 'Previewing the source transform. Your editable-copy transform remains saved.'
      : 'Restored this copy’s transform.');
  };

  const fields: Array<{ key: keyof ComponentTransform; label: string; unit: string }> = [
    { key: 'position', label: 'Position', unit: 'scene units' },
    { key: 'rotation', label: 'Rotation', unit: 'radians' },
    { key: 'scale', label: 'Scale', unit: '×' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Innovation workshop">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-2xl">
        <header className="flex items-start gap-3 border-b border-cyan-500/20 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-400">Innovation workshop · local project</div>
            <h2 className="mt-1 text-lg font-semibold">Edit a copy, preserve the reference</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{model.name} · source revision {source.version}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close innovation workshop" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800"><X size={16} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-slate-800 p-3 md:border-b-0 md:border-r">
            <label className="block text-[9px] uppercase tracking-wider text-slate-500" htmlFor="workshop-component">Component</label>
            <select id="workshop-component" value={selectedComponentId || ''} onChange={(event) => onSelectComponent(event.currentTarget.value || null)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-cyan-50">
              <option value="">Select a component…</option>
              {model.components.map((component) => <option key={component.id} value={component.id}>{component.name}</option>)}
            </select>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={createFreshCopy} className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-2 text-xs hover:bg-cyan-950/50"><Copy size={13} /> Create my copy</button>
              <button type="button" onClick={() => { if (typeof window !== 'undefined' && saveWorkshopProject(window.localStorage, project)) setStatus('Saved locally on this device.'); else setStatus('Local save unavailable; export project JSON instead.'); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"><Save size={13} /> Save locally</button>
              <button type="button" onClick={downloadProject} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"><Download size={13} /> Export project JSON</button>
              <label htmlFor="workshop-import" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"><FileUp size={13} /> Import project JSON</label>
              <input key={importKey} id="workshop-import" type="file" accept=".json,.advis-project.json,application/json" className="sr-only" onChange={importProject} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={doUndo} disabled={!canUndoWorkshopProject(project)} className="flex items-center justify-center gap-1 rounded border border-slate-700 px-2 py-2 text-[10px] disabled:opacity-35"><Undo2 size={12} /> Undo</button>
              <button type="button" onClick={doRedo} disabled={!canRedoWorkshopProject(project)} className="flex items-center justify-center gap-1 rounded border border-slate-700 px-2 py-2 text-[10px] disabled:opacity-35"><Redo2 size={12} /> Redo</button>
            </div>
            <button type="button" onClick={toggleCompare} disabled={!selectedComponent} className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-slate-700 px-2 py-2 text-[10px] disabled:opacity-35"><ArrowLeftRight size={12} /> {compareToSource ? 'Return to my copy' : 'Compare to source'}</button>
          </aside>

          <main className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{selectedComponent?.name || 'Select a component'}</h3>
                <p className="mt-1 text-[10px] text-slate-500">{selectedComponent ? selectedComponent.description : 'Choose a part in this panel or the 3D scene.'}</p>
              </div>
              <button type="button" onClick={resetSelected} disabled={!selectedComponent || !project.transforms[selectedComponent.id]} className="flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1.5 text-[10px] disabled:opacity-35"><RotateCcw size={11} /> Reset selected</button>
            </div>

            {selectedComponent && liveTransform && (
              <div className="mt-5 space-y-4">
                {fields.map((field) => (
                  <fieldset key={field.key} className="rounded-xl border border-slate-800 p-3">
                    <legend className="px-1 text-xs font-semibold">{field.label} <span className="ml-1 text-[9px] font-normal text-slate-500">({field.unit})</span></legend>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((axis) => (
                        <label key={axis} className="text-[9px] text-slate-500">
                          <span className="mb-1 block">{['X', 'Y', 'Z'][axis]}</span>
                          <input
                            type="number"
                            step={field.key === 'scale' ? 0.1 : field.key === 'rotation' ? 0.1 : 0.05}
                            min={field.key === 'scale' ? 0.01 : undefined}
                            max={field.key === 'scale' ? 100 : undefined}
                            value={Number(liveTransform[field.key][axis].toFixed(4))}
                            disabled={compareToSource}
                            onChange={(event) => updateAxis(field.key, axis, Number(event.currentTarget.value))}
                            aria-label={`${selectedComponent.name} ${field.label} ${['X', 'Y', 'Z'][axis]}`}
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-cyan-50 outline-none focus:border-cyan-400 disabled:opacity-50"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <p className="text-[10px] leading-relaxed text-amber-200/80">Visual transform editing only. It does not change the underlying mesh, regenerate CAD features, create assembly constraints or validate physical fit.</p>
              </div>
            )}

            {status && <p className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-100" role="status">{status}</p>}
            <div className="mt-5 border-t border-slate-800 pt-4 text-[10px] leading-relaxed text-slate-500">{project.notice}</div>
          </main>
        </div>
      </section>
    </div>
  );
}

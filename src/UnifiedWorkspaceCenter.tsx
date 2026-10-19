import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Atom,
  Box,
  ChevronRight,
  Command,
  CornerDownLeft,
  FolderOpen,
  GraduationCap,
  MessageSquare,
  Search,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { menuItems } from './Sidebar';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { CHEMISTRY_DATABASE } from './LearnEngine/ChemistryDatabase';
import { LEARNING_LESSONS } from './learning/LessonCatalog';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage, SystemState } from './App';
import {
  deleteWorkspace,
  readSavedWorkspaces,
  saveWorkspace,
  type SavedWorkspace,
  type WorkspaceSnapshotData,
} from './workspace/WorkspaceSessionStore';

type CommandKind = 'view' | 'model' | 'component' | 'molecule' | 'lesson' | 'assistant' | 'save' | 'saved';

interface WorkspaceCommand {
  key: string;
  kind: CommandKind;
  title: string;
  detail: string;
  keywords: string[];
  icon: LucideIcon;
  targetId?: string;
  componentId?: string;
  formula?: string;
}

interface WorkspaceCommandCenterProps {
  currentView: string;
  systemState: SystemState;
  isSpatial: boolean;
  activeContextLabel: string;
  selectedComponentLabel: string | null;
  currentSpatialObject: string | string[] | null;
  selectedComponentId: string | null;
  messages: ChatMessage[];
  audioLevel: number;
  snapshot: WorkspaceSnapshotData;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  saveOpen: boolean;
  setSaveOpen: (open: boolean) => void;
  savedOpen: boolean;
  setSavedOpen: (open: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  onNavigate: (viewId: string) => void;
  onSelectSpatialObject: (objectId: string) => void;
  onSelectComponent: (modelId: string, componentId: string) => void;
  onSelectMolecule: (formula: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onRestoreWorkspace: (snapshot: WorkspaceSnapshotData) => void;
  onAskAssistant: () => void;
  onSendMessage: (message: string) => void;
  onSavedCountChange?: (count: number) => void;
}

const kindLabels: Record<CommandKind, string> = {
  view: 'DESTINATION',
  model: 'MODEL',
  component: 'COMPONENT',
  molecule: 'MOLECULE',
  lesson: 'LESSON',
  assistant: 'ADVIS',
  save: 'WORKSPACE',
  saved: 'WORKSPACE',
};

const viewName = (viewId: string) => menuItems.find((item) => item.id === viewId)?.label || 'Workspace';

const commandText = (command: WorkspaceCommand) =>
  [command.title, command.detail, ...command.keywords].join(' ').toLowerCase();

function buildCommands(activeContextLabel: string, hasSelection: boolean): WorkspaceCommand[] {
  const destinations: WorkspaceCommand[] = menuItems.map((item) => ({
    key: `view:${item.id}`,
    kind: 'view',
    title: item.label,
    detail: `${item.section} · Navigate to destination`,
    keywords: [item.id, item.section, 'navigate', 'open'],
    icon: item.icon,
    targetId: item.id,
  }));

  const modelCommands: WorkspaceCommand[] = Object.values(SPATIAL_LIBRARY)
    .filter((model) => model.modelStatus !== 'UNAVAILABLE' && model.modelStatus !== 'AWAITING_ASSET')
    .map((model) => ({
      key: `model:${model.id}`,
      kind: 'model',
      title: model.name,
      detail: `${model.category} · Open in spatial workspace`,
      keywords: [model.id, model.category, model.description, ...(model.educationalInformation?.keyFeatures || [])],
      icon: Box,
      targetId: model.id,
    }));

  const componentCommands: WorkspaceCommand[] = Object.values(SPATIAL_LIBRARY)
    .filter((model) => model.modelStatus !== 'UNAVAILABLE' && model.modelStatus !== 'AWAITING_ASSET')
    .flatMap((model) => (model.components || []).map((component) => ({
      key: `component:${model.id}:${component.id}`,
      kind: 'component' as const,
      title: component.name,
      detail: `${model.name} · Component`,
      keywords: [component.id, component.description, component.category || '', model.name, model.category],
      icon: Box,
      targetId: model.id,
      componentId: component.id,
    })));

  const moleculeCommands: WorkspaceCommand[] = Object.entries(CHEMISTRY_DATABASE).map(([key, molecule]) => ({
    key: `molecule:${key}`,
    kind: 'molecule',
    title: `${molecule.name} · ${molecule.formula}`,
    detail: `${molecule.geometry} · Molecular library`,
    keywords: [key, molecule.formula, molecule.geometry, molecule.molecularGeometry, molecule.hybridization, molecule.description || '', molecule.iupacName || ''],
    icon: Atom,
    formula: key,
  }));

  const lessonCommands: WorkspaceCommand[] = LEARNING_LESSONS.map((lesson) => ({
    key: `lesson:${lesson.id}`,
    kind: 'lesson',
    title: lesson.title,
    detail: `${lesson.domain.replace(/_/g, ' ')} · ${lesson.estimatedMinutes} min`,
    keywords: [lesson.id, lesson.summary, ...lesson.learningObjectives, lesson.modelId, lesson.learnerLevel],
    icon: GraduationCap,
    targetId: lesson.id,
  }));

  const actions: WorkspaceCommand[] = [
    {
      key: 'action:assistant-context',
      kind: 'assistant',
      title: hasSelection ? 'Ask ADVIS about the current selection' : 'Ask ADVIS about this workspace',
      detail: activeContextLabel,
      keywords: ['assistant', 'explain', 'context', 'help', 'selected component', 'how does it work'],
      icon: MessageSquare,
    },
    {
      key: 'action:save',
      kind: 'save',
      title: 'Save current workspace',
      detail: 'Remember this destination, selected context and control state',
      keywords: ['save', 'bookmark', 'session', 'remember', 'snapshot'],
      icon: Save,
    },
    {
      key: 'action:saved',
      kind: 'saved',
      title: 'Open saved workspaces',
      detail: 'Resume a workspace saved on this device',
      keywords: ['load', 'restore', 'resume', 'saved', 'workspace'],
      icon: FolderOpen,
    },
  ];

  return [...destinations, ...modelCommands, ...componentCommands, ...moleculeCommands, ...lessonCommands, ...actions];
}

interface WorkspaceAssistantDockProps {
  contextLabel: string;
  systemState: SystemState;
  messages: ChatMessage[];
  audioLevel: number;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

function WorkspaceAssistantDock({
  contextLabel,
  systemState,
  messages,
  audioLevel,
  onClose,
  onSendMessage,
}: WorkspaceAssistantDockProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const message = draft.trim();
    if (!message || ['THINKING', 'SEARCHING', 'ANALYZING'].includes(systemState)) return;
    onSendMessage(message);
    setDraft('');
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="ADVIS assistant workspace"
      className="fixed inset-x-3 bottom-3 top-20 z-[101] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0c0c0f]/[0.97] text-[#f3f3f5] shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-4 sm:w-[min(420px,calc(100vw-2rem))] pointer-events-auto"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e20246]/40 bg-[#e20246]/10 text-[#ff7194]">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide">ADVIS Assistant</div>
            <div className="truncate text-xs text-white/55" title={contextLabel}>{contextLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/60 sm:inline-flex">{systemState.replace(/_/g, ' ')}</span>
          <button type="button" aria-label="Close ADVIS Assistant" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-offset-2">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-3 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
            <MessageSquare size={26} className="text-[#ff527b]" aria-hidden="true" />
            <p className="text-sm font-medium">Ask about the workspace you're exploring</p>
            <p className="max-w-xs text-xs leading-relaxed text-white/55">ADVIS can use the active model and selected component context already attached to your session.</p>
          </div>
        ) : (
          <ChatPanel messages={messages} systemState={systemState} audioLevel={audioLevel} />
        )}
      </div>

      <form
        className="shrink-0 border-t border-white/10 bg-black/25 p-3 sm:p-4"
        onSubmit={(event) => { event.preventDefault(); submit(); }}
      >
        <label htmlFor="advis-workspace-assistant-input" className="sr-only">Message ADVIS</label>
        <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-white/[0.04] p-2 focus-within:border-[#e20246]/70">
          <textarea
            id="advis-workspace-assistant-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Ask about the selected component…"
            className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={!draft.trim() || ['THINKING', 'SEARCHING', 'ANALYZING'].includes(systemState)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e20246] text-white transition hover:bg-[#ff315f] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message to ADVIS"
          >
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10px] text-white/40">
          <span>Enter to send · Shift+Enter for a new line</span>
          <span>Context-aware</span>
        </div>
      </form>
    </aside>
  );
}

export function WorkspaceCommandCenter(props: WorkspaceCommandCenterProps) {
  const {
    currentView,
    systemState,
    isSpatial,
    activeContextLabel,
    selectedComponentLabel,
    currentSpatialObject,
    selectedComponentId,
    messages,
    audioLevel,
    snapshot,
    commandOpen,
    setCommandOpen,
    saveOpen,
    setSaveOpen,
    savedOpen,
    setSavedOpen,
    assistantOpen,
    setAssistantOpen,
    onNavigate,
    onSelectSpatialObject,
    onSelectComponent,
    onSelectMolecule,
    onOpenLesson,
    onRestoreWorkspace,
    onAskAssistant,
    onSendMessage,
    onSavedCountChange,
  } = props;

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveName, setSaveName] = useState('');
  const [savedWorkspaces, setSavedWorkspaces] = useState<SavedWorkspace[]>(() => readSavedWorkspaces());
  const [notice, setNotice] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSavedCountChange?.(savedWorkspaces.length);
  }, [savedWorkspaces.length, onSavedCountChange]);

  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [commandOpen]);

  useEffect(() => {
    if (saveOpen) {
      const defaultName = activeContextLabel === 'Home workspace'
        ? `Workspace · ${viewName(currentView)}`
        : `${activeContextLabel} workspace`;
      setSaveName(defaultName.slice(0, 80));
      requestAnimationFrame(() => saveInputRef.current?.focus());
    }
  }, [saveOpen, activeContextLabel, currentView]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(!commandOpen);
        setSavedOpen(false);
        setSaveOpen(false);
      } else if (event.key === 'Escape') {
        if (commandOpen) setCommandOpen(false);
        else if (saveOpen) setSaveOpen(false);
        else if (savedOpen) setSavedOpen(false);
        else if (assistantOpen) setAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [commandOpen, saveOpen, savedOpen, assistantOpen, setCommandOpen, setSaveOpen, setSavedOpen, setAssistantOpen]);

  const commands = useMemo(
    () => buildCommands(activeContextLabel, Boolean(selectedComponentId || currentSpatialObject)),
    [activeContextLabel, selectedComponentId, currentSpatialObject],
  );
  const filteredCommands = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return commands.filter((command) => command.kind === 'view' || command.kind === 'assistant' || command.kind === 'save' || command.kind === 'saved').slice(0, 16);
    }
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    return commands
      .filter((command) => tokens.every((token) => commandText(command).includes(token)))
      .slice(0, 30);
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, filteredCommands.length - 1)));
  }, [filteredCommands.length]);

  const activeSpatialId = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
  const activeModel = activeSpatialId ? SPATIAL_LIBRARY[activeSpatialId] : null;
  const activeViewName = viewName(currentView);

  const executeCommand = useCallback((command: WorkspaceCommand) => {
    setCommandOpen(false);
    setNotice('');
    switch (command.kind) {
      case 'view':
        if (command.targetId) onNavigate(command.targetId);
        break;
      case 'model':
        if (command.targetId) onSelectSpatialObject(command.targetId);
        break;
      case 'component':
        if (command.targetId && command.componentId) onSelectComponent(command.targetId, command.componentId);
        break;
      case 'molecule':
        if (command.formula) onSelectMolecule(command.formula);
        break;
      case 'lesson':
        if (command.targetId) onOpenLesson(command.targetId);
        break;
      case 'assistant':
        setAssistantOpen(true);
        onAskAssistant();
        break;
      case 'save':
        setSaveOpen(true);
        break;
      case 'saved':
        setSavedOpen(true);
        break;
    }
  }, [onNavigate, onSelectSpatialObject, onSelectComponent, onSelectMolecule, onOpenLesson, setAssistantOpen, onAskAssistant, setSaveOpen, setSavedOpen, setCommandOpen]);

  const submitSave = (event: React.FormEvent) => {
    event.preventDefault();
    const result = saveWorkspace(saveName, snapshot);
    setSavedWorkspaces(result.workspaces);
    setSaveOpen(false);
    setNotice(result.ok ? `Saved “${saveName.trim()}”. This snapshot stores workspace context and controls, not model geometry.` : 'Could not save this workspace on this device. Your current session is unchanged.');
    window.setTimeout(() => setNotice(''), 4500);
  };

  const handleLoad = (workspace: SavedWorkspace) => {
    onRestoreWorkspace(workspace);
    setSavedOpen(false);
    setNotice(`Restored “${workspace.name}”.`);
    window.setTimeout(() => setNotice(''), 4500);
  };

  const handleDelete = (id: string) => {
    setSavedWorkspaces(deleteWorkspace(id));
  };

  const displayContext = selectedComponentLabel
    ? `${activeModel?.name || activeContextLabel} / ${selectedComponentLabel}`
    : activeModel?.name || activeContextLabel;

  return (
    <>
      <header className="pointer-events-auto relative z-40 mx-3 mt-3 mb-1 hidden shrink-0 items-center justify-between gap-4 rounded-2xl border border-white/[0.10] bg-[#101014]/[0.92] px-4 py-2.5 text-[#f3f3f5] shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => onNavigate('home')} aria-label="Return to ADVIS workspace home" className="group flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 text-left focus-visible:outline-offset-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[#e20246]/45 bg-[#e20246]/10 text-[#ff527b]">
              <Sparkles size={16} aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#e20246] shadow-[0_0_10px_rgba(226,2,70,0.8)]" />
            </span>
            <span>
              <span className="block text-[11px] font-bold tracking-[0.2em]">A.D.V.I.S.</span>
              <span className="block text-[9px] uppercase tracking-[0.16em] text-white/45">Unified workspace</span>
            </span>
          </button>
          <span className="h-7 w-px shrink-0 bg-white/10" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/45">
              <span>WORKSPACE</span><ChevronRight size={12} aria-hidden="true" /><span className="truncate text-white/75">{activeViewName}</span>
            </div>
            <div className="max-w-[min(36vw,440px)] truncate text-xs font-medium text-white/90" title={displayContext}>{displayContext}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-white/60">
            <span className={`h-1.5 w-1.5 rounded-full ${systemState === 'ERROR' || systemState === 'OFFLINE' ? 'bg-rose-500' : systemState === 'THINKING' || systemState === 'SEARCHING' || systemState === 'ANALYZING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {systemState.replace(/_/g, ' ')}
          </span>
          <button type="button" onClick={() => setAssistantOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-2.5 xl:px-3 text-xs text-white/75 transition hover:border-[#e20246]/50 hover:bg-white/[0.05] hover:text-white">
            <MessageSquare size={15} aria-hidden="true" /> <span className="hidden xl:inline">Assistant</span>
          </button>
          <button type="button" onClick={() => { setSavedOpen(true); setNotice(''); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-2.5 xl:px-3 text-xs text-white/75 transition hover:border-[#e20246]/50 hover:bg-white/[0.05] hover:text-white">
            <FolderOpen size={15} aria-hidden="true" /><span className="hidden xl:inline">Saved</span><span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums text-white/65">{savedWorkspaces.length}</span>
          </button>
          <button type="button" onClick={() => setSaveOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#e20246] px-3 text-xs font-semibold text-white transition hover:bg-[#ff315f]">
            <Save size={15} aria-hidden="true" /> <span className="hidden xl:inline">Save workspace</span>
          </button>
          <button type="button" onClick={() => setCommandOpen(true)} aria-label="Search ADVIS commands" className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.035] px-3 text-xs text-white/80 transition hover:border-[#e20246]/60 hover:bg-white/[0.07]">
            <Search size={15} aria-hidden="true" /><span className="hidden xl:inline">Search</span><kbd className="ml-1 hidden rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-[10px] text-white/45 xl:inline-flex"><Command size={10} className="inline" aria-hidden="true" /> K</kbd>
          </button>
        </div>
      </header>

      {isSpatial && (
        <div className="pointer-events-auto fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[90] flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => setAssistantOpen(true)} aria-label="Open ADVIS Assistant" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#101014]/95 text-white shadow-lg backdrop-blur-xl">
            <MessageSquare size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setCommandOpen(true)} aria-label="Search workspace" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e20246]/45 bg-[#101014]/95 text-[#ff7194] shadow-lg backdrop-blur-xl">
            <Search size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className="pointer-events-auto fixed bottom-4 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-white/12 bg-[#101014]/95 px-4 py-2.5 text-xs text-white shadow-xl backdrop-blur-xl">
          {notice}
        </div>
      )}

      {commandOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[110] flex items-start justify-center bg-black/70 px-3 pb-4 pt-[min(14vh,7rem)] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommandOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="Search ADVIS workspace" className="flex max-h-[min(78vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#111114] text-[#f3f3f5] shadow-[0_30px_100px_rgba(0,0,0,0.78)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <Search size={19} className="shrink-0 text-[#ff527b]" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((i) => Math.min(filteredCommands.length - 1, i + 1)); }
                  else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
                  else if (event.key === 'Enter' && filteredCommands[activeIndex]) { event.preventDefault(); executeCommand(filteredCommands[activeIndex]); }
                  else if (event.key === 'Escape') { event.preventDefault(); setCommandOpen(false); }
                }}
                placeholder="Search destinations, models, components, molecules and lessons…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
              <kbd className="hidden rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/45 sm:inline">ESC</kbd>
              <button type="button" onClick={() => setCommandOpen(false)} aria-label="Close workspace search" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {filteredCommands.length ? (
                <div className="space-y-1">
                  {filteredCommands.map((command, index) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.key}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => executeCommand(command)}
                        className={`group flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${activeIndex === index ? 'bg-[#e20246]/15 ring-1 ring-[#e20246]/35' : 'hover:bg-white/[0.045]'}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${activeIndex === index ? 'border-[#e20246]/45 bg-[#e20246]/10 text-[#ff7194]' : 'border-white/10 bg-white/[0.035] text-white/55'}`}>
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white/90">{command.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-white/45">{command.detail}</span>
                        </span>
                        <span className="hidden shrink-0 text-[9px] uppercase tracking-[0.15em] text-white/30 sm:block">{kindLabels[command.kind]}</span>
                        {activeIndex === index && <CornerDownLeft size={14} className="shrink-0 text-[#ff7194]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Search size={22} className="text-white/35" aria-hidden="true" />
                  <div className="text-sm font-medium text-white/80">Nothing matched that search</div>
                  <div className="max-w-sm text-xs leading-relaxed text-white/45">Try a component name, molecule formula, lesson topic, or workspace destination.</div>
                </div>
              )}
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[10px] text-white/40">
              <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> Navigate</span><span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> Open</span></div>
              <span>{filteredCommands.length} result{filteredCommands.length === 1 ? '' : 's'} · Searches existing catalogue data</span>
            </footer>
          </section>
        </div>
      )}

      {saveOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="advis-save-workspace-title" className="w-full max-w-md rounded-2xl border border-white/12 bg-[#111114] p-5 text-[#f3f3f5] shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#ff7194]">Workspace session</div>
                <h2 id="advis-save-workspace-title" className="text-lg font-semibold">Save this workspace</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Saves navigation, selected context and UI/control state on this device. It does not copy or alter model geometry.</p>
              {activeContextLabel.toLowerCase().includes('molecular builder') && !snapshot.chemistryFormula && (
                <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                  This custom molecular builder graph is not included in workspace snapshots yet. Save will preserve the surrounding workspace settings, but not the editable custom structure.
                </p>
              )}
              </div>
              <button type="button" onClick={() => setSaveOpen(false)} aria-label="Close save workspace dialog" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={submitSave}>
              <label htmlFor="advis-workspace-name" className="mb-1.5 block text-xs font-medium text-white/70">Workspace name</label>
              <input id="advis-workspace-name" ref={saveInputRef} value={saveName} onChange={(event) => setSaveName(event.target.value)} maxLength={80} required className="h-11 w-full rounded-xl border border-white/12 bg-black/25 px-3 text-sm text-white outline-none focus:border-[#e20246]/70" placeholder="e.g. V12 inspection · crankshaft" />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setSaveOpen(false)} className="h-10 rounded-xl border border-white/12 px-4 text-xs text-white/65 hover:bg-white/[0.05]">Cancel</button>
                <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e20246] px-4 text-xs font-semibold text-white hover:bg-[#ff315f]"><Save size={14} /> Save session</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {savedOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[110] flex items-start justify-center bg-black/70 px-3 pb-4 pt-[min(12vh,6rem)] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSavedOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="advis-saved-workspaces-title" className="flex max-h-[min(78vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#111114] text-[#f3f3f5] shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e20246]/40 bg-[#e20246]/10 text-[#ff7194]"><FolderOpen size={17} /></span><div><h2 id="advis-saved-workspaces-title" className="text-sm font-semibold">Saved workspaces</h2><p className="mt-0.5 text-xs text-white/45">Stored locally on this device · newest first</p></div></div>
              <button type="button" onClick={() => setSavedOpen(false)} aria-label="Close saved workspaces" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 hover:bg-white/10 hover:text-white"><X size={17} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {savedWorkspaces.length ? (
                <div className="space-y-2">
                  {savedWorkspaces.map((workspace) => (
                    <div key={workspace.id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/55"><FolderOpen size={16} /></span>
                      <button type="button" onClick={() => handleLoad(workspace)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium text-white/90">{workspace.name}</span>
                        <span className="mt-1 block truncate text-xs text-white/45">{viewName(workspace.currentView)}{workspace.selectedComponentId ? ` · ${workspace.selectedComponentId}` : ''}</span>
                        <span className="mt-1 block text-[10px] text-white/30">{new Date(workspace.savedAt).toLocaleString()}</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(workspace.id)} aria-label={`Delete saved workspace ${workspace.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/35 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={15} /></button>
                      <button type="button" onClick={() => handleLoad(workspace)} aria-label={`Restore saved workspace ${workspace.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/55 hover:border-[#e20246]/50 hover:text-white"><ArrowRight size={15} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                  <FolderOpen size={25} className="text-white/30" />
                  <div className="text-sm font-medium text-white/80">No saved workspaces yet</div>
                  <p className="max-w-xs text-xs leading-relaxed text-white/45">Open a model, select a component, set up your workspace, and save it to resume later.</p>
                  <button type="button" onClick={() => { setSavedOpen(false); setSaveOpen(true); }} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-[#e20246] px-3 text-xs font-semibold text-white hover:bg-[#ff315f]"><Save size={14} /> Save current workspace</button>
                </div>
              )}
            </div>
            <footer className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[10px] text-white/40">
              <span>Up to 12 sessions per device</span><button type="button" onClick={() => { setSavedOpen(false); setSaveOpen(true); }} className="inline-flex items-center gap-1.5 text-[#ff7194] hover:text-white"><Save size={12} /> Save current</button>
            </footer>
          </section>
        </div>
      )}

      {assistantOpen && (
        <WorkspaceAssistantDock
          contextLabel={displayContext}
          systemState={systemState}
          messages={messages}
          audioLevel={audioLevel}
          onClose={() => setAssistantOpen(false)}
          onSendMessage={onSendMessage}
        />
      )}
    </>
  );
}

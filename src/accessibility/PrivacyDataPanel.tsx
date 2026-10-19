import React, { useMemo, useState } from 'react';
import { Database, ShieldCheck, Trash2, X } from 'lucide-react';

const LESSON_PROGRESS_KEY = 'advis-ncsc.lesson-progress.v1';
const ACCESSIBILITY_KEY = 'advis-ncsc.accessibility-preferences.v1';
const CONTRIBUTION_QUEUE_KEY = 'advis-ncsc.contribution-review-queue.v1';
const WORKSHOP_STORAGE_KEY = 'advis-ncsc.workshop-projects.v1';
const WORKSHOP_PREFIXES = ['advis-ncsc.workshop.v1.'];
const WORKSPACE_TRANSFORMS_KEY = 'advis-ncsc.workspace-transforms.v1';
const STUDY_PROJECT_KEY = 'advis-ncsc.innovation-study.v1';
const CHAT_HISTORY_KEY = 'advis_chat_history_v1';

type LocalDataKey = 'lesson-progress' | 'workshop-projects' | 'authoring-queue' | 'accessibility-preferences' | 'workspace-state' | 'innovation-study' | 'chat-history';

const LABELS: Record<LocalDataKey, { title: string; detail: string }> = {
  'lesson-progress': { title: 'Lesson progress', detail: 'Saved lesson IDs, step completion and answer choices.' },
  'workshop-projects': { title: 'Visual workshop projects', detail: 'Local component transforms and undo/redo history for editable copies.' },
  'authoring-queue': { title: 'Draft/review queue', detail: 'Locally stored model and lesson JSON submissions and reviewer notes.' },
  'accessibility-preferences': { title: 'Display preferences', detail: 'Rendering quality and reduced-motion/audio/camera preference flags.' },
  'workspace-state': { title: 'Saved workspace transforms', detail: 'Locally stored current model transforms and visual workspace state.' },
  'innovation-study': { title: 'Parametric innovation study', detail: 'Saved planetary gear study parameters and baseline settings.' },
  'chat-history': { title: 'Assistant chat history', detail: 'The recent text-only assistant conversation saved by this browser.' },
};

function removeLocalData(kind: LocalDataKey): { ok: boolean; message: string } {
  if (typeof window === 'undefined') return { ok: false, message: 'Browser storage is unavailable in this environment.' };
  try {
    switch (kind) {
      case 'lesson-progress':
        window.localStorage.removeItem(LESSON_PROGRESS_KEY);
        break;
      case 'authoring-queue':
        window.localStorage.removeItem(CONTRIBUTION_QUEUE_KEY);
        break;
      case 'accessibility-preferences':
        window.localStorage.removeItem(ACCESSIBILITY_KEY);
        document.documentElement.removeAttribute('data-advis-reduced-motion');
        break;
      case 'workshop-projects': {
        window.localStorage.removeItem(WORKSHOP_STORAGE_KEY);
        const keys: string[] = [];
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key && WORKSHOP_PREFIXES.some((prefix) => key.startsWith(prefix))) keys.push(key);
        }
        for (const key of keys) window.localStorage.removeItem(key);
        break;
      }
      case 'workspace-state':
        window.localStorage.removeItem(WORKSPACE_TRANSFORMS_KEY);
        break;
      case 'innovation-study':
        window.localStorage.removeItem(STUDY_PROJECT_KEY);
        break;
      case 'chat-history':
        window.localStorage.removeItem(CHAT_HISTORY_KEY);
        break;
    }
    return { ok: true, message: `${LABELS[kind].title} cleared from this browser.` };
  } catch {
    return { ok: false, message: 'The browser blocked local-storage changes. Check site storage permissions and try again.' };
  }
}

export interface PrivacyDataPanelProps {
  onClose: () => void;
  onDataCleared?: (kind: LocalDataKey) => void;
}

export function PrivacyDataPanel({ onClose, onDataCleared }: PrivacyDataPanelProps) {
  const [confirming, setConfirming] = useState<LocalDataKey | null>(null);
  const [message, setMessage] = useState('');
  const [clearedAt, setClearedAt] = useState<Partial<Record<LocalDataKey, number>>>({});
  const counts = useMemo(() => {
    if (typeof window === 'undefined') return { lessons: 0, workshop: 0, authoring: 0, preferences: 0, workspace: 0, study: 0, chat: 0 };
    try {
      const lessons = window.localStorage.getItem(LESSON_PROGRESS_KEY);
      const authoring = window.localStorage.getItem(CONTRIBUTION_QUEUE_KEY);
      const preferences = window.localStorage.getItem(ACCESSIBILITY_KEY);
      const workspace = window.localStorage.getItem(WORKSPACE_TRANSFORMS_KEY);
      const study = window.localStorage.getItem(STUDY_PROJECT_KEY);
      const chat = window.localStorage.getItem(CHAT_HISTORY_KEY);
      let workshop = window.localStorage.getItem(WORKSHOP_STORAGE_KEY) ? 1 : 0;
      for (let index = 0; index < window.localStorage.length; index += 1) {
        if (WORKSHOP_PREFIXES.some((prefix) => window.localStorage.key(index)?.startsWith(prefix))) workshop += 1;
      }
      return {
        lessons: lessons ? 1 : 0,
        workshop,
        authoring: authoring ? 1 : 0,
        preferences: preferences ? 1 : 0,
        workspace: workspace ? 1 : 0,
        study: study ? 1 : 0,
        chat: chat ? 1 : 0,
      };
    } catch {
      return { lessons: 0, workshop: 0, authoring: 0, preferences: 0, workspace: 0, study: 0, chat: 0 };
    }
  }, [clearedAt]);

  const countFor = (kind: LocalDataKey): number => {
    switch (kind) {
      case 'lesson-progress': return counts.lessons;
      case 'workshop-projects': return counts.workshop;
      case 'authoring-queue': return counts.authoring;
      case 'accessibility-preferences': return counts.preferences;
      case 'workspace-state': return counts.workspace;
      case 'innovation-study': return counts.study;
      case 'chat-history': return counts.chat;
    }
  };

  const clearConfirmed = (kind: LocalDataKey) => {
    const result = removeLocalData(kind);
    setMessage(result.message);
    if (result.ok) {
      setClearedAt((previous) => ({ ...previous, [kind]: Date.now() }));
      onDataCleared?.(kind);
    }
    setConfirming(null);
  };

  return (
    <div className="fixed inset-0 z-[122] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="privacy-data-title">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 text-slate-100 shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"><ShieldCheck size={19} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.18em] text-emerald-300">Privacy · local data controls</div>
            <h2 id="privacy-data-title" className="mt-1 text-lg font-semibold">Your data and permissions</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Core model browsing does not require an account. Local project and lesson state can be removed here; this panel does not upload data or change browser-level permissions.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close privacy and data panel" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-900"><X size={15} /></button>
        </header>

        <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold"><Database size={14} className="text-emerald-300" /> What is stored locally</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">Lesson progress stores lesson/step IDs and answer choices, not account identity. Workshop documents store visual transforms and source revision. Draft/review submissions may contain the full JSON you pasted and notes. Rendering preferences are stored in this browser. Storage can be unavailable in private or restricted browsing modes.</p>
          </section>

          <section className="rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-semibold">Delete local data by category</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">These controls remove only the listed A.D.V.I.S.-NCSC storage keys. They do not clear your browser history or revoke camera/microphone permissions.</p>
            <div className="mt-3 space-y-2">
              {(Object.keys(LABELS) as LocalDataKey[]).map((kind) => (
                <div key={kind} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold">{LABELS[kind].title}</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-slate-500">{LABELS[kind].detail}</div>
                    <div className="mt-1 text-[9px] text-slate-500">{(['workshop-projects', 'workspace-state', 'innovation-study'].includes(kind) ? countFor(kind) + ' saved item(s)' : (countFor(kind) ? 'Data key exists' : 'No data key detected'))}</div>
                    {clearedAt[kind] && <div className="mt-1 text-[9px] text-emerald-300">Cleared during this session</div>}
                  </div>
                  {confirming === kind ? (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => clearConfirmed(kind)} className="rounded border border-rose-600/50 bg-rose-950/40 px-2.5 py-2 text-[9px] font-semibold text-rose-200 hover:bg-rose-950/70">Confirm delete</button>
                      <button type="button" onClick={() => setConfirming(null)} className="rounded border border-slate-700 px-2.5 py-2 text-[9px] hover:bg-slate-800">Cancel</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setConfirming(kind); setMessage(''); }} aria-label={`Delete ${LABELS[kind].title}`} className="flex min-h-9 items-center gap-1.5 rounded border border-slate-700 px-2.5 py-2 text-[9px] text-slate-300 hover:border-rose-500/50 hover:text-rose-200"><Trash2 size={12} /> Clear</button>
                  )}
                </div>
              ))}
            </div>
            {message && <p className="mt-3 text-[10px] leading-relaxed text-slate-300" role="status" aria-live="polite">{message}</p>}
          </section>

          <section className="rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-semibold">Camera, microphone and AI</h3>
            <div className="mt-2 space-y-2 text-[10px] leading-relaxed text-slate-400">
              <p>Hand tracking requires camera access when its feature is enabled. You can deny the browser permission and use mouse, touch and keyboard controls instead.</p>
              <p>The app’s audio-level analysis requests microphone access when the assistant enters its listening state; if denied, a simulated visualizer may be used. Browser permission settings control whether the microphone can be accessed.</p>
              <p>When you use Ask ADVIS, the question and current model/component context (catalog descriptions, recorded source links, parameter values and stated limitations) are sent to the configured API/tutor backend to generate a response. Do not send passwords or sensitive personal/medical information. This UI does not control the external provider’s processing/retention policy; refer to the deployment/provider policy for those details.</p>
              <p>Core manual controls and authored lessons do not require AI. Offline HTML workbooks can be opened as local files and do not load remote scripts/stylesheets.</p>
            </div>
            <p className="mt-3 border-t border-slate-800 pt-3 text-[9px] leading-relaxed text-slate-500">To revoke camera/microphone access, use your browser’s site-permissions controls. This panel cannot revoke browser permission on your behalf.</p>
          </section>
        </div>
      </section>
    </div>
  );
}

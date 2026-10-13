import React, { useEffect, useMemo, useState } from 'react';
import { Download, FilePlus2, ShieldCheck, X } from 'lucide-react';
import { SPATIAL_LIBRARY } from '../SpatialLibrary';
import { LEARNING_LESSONS } from '../learning/LessonCatalog';
import type { LearningLesson } from '../learning/LessonSchema';
import type { ObjectMetadata } from '../SpatialLibrary';
import {
  canPublishContribution,
  validateLessonSubmission,
  validateModelSubmission,
  type ContributionReview,
  type ContributionValidationIssue,
  type ReviewStatus,
  type SubmissionKind,
} from './ContributionValidation';

const QUEUE_KEY = 'advis-ncsc.contribution-review-queue.v1';
const MAX_PAYLOAD_CHARS = 1_000_000;
const VALID_STATUSES: ReviewStatus[] = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'];

interface LocalReviewItem extends ContributionReview {
  payloadJson: string;
  validationIssues: ContributionValidationIssue[];
}

interface DraftAssessment {
  title: string;
  payloadId: string;
  license: string;
  attribution: string;
  issues: ContributionValidationIssue[];
}

function makeId(): string {
  return 'submission-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function readLocalQueue(): LocalReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-50).filter((item): item is LocalReviewItem =>
      Boolean(item && typeof item === 'object' &&
        typeof item.id === 'string' &&
        (item.kind === 'MODEL' || item.kind === 'LESSON') &&
        typeof item.payloadJson === 'string' &&
        VALID_STATUSES.includes(item.status)),
    );
  } catch {
    return [];
  }
}

function addIssue(issues: ContributionValidationIssue[], code: string, message: string): ContributionValidationIssue[] {
  return [...issues, { severity: 'ERROR', code, message }];
}

function assessDraft(raw: string, kind: SubmissionKind): DraftAssessment {
  const issues: ContributionValidationIssue[] = [];
  if (!raw.trim()) {
    return { title: 'Untitled submission', payloadId: 'not-parsed', license: '', attribution: '', issues: addIssue(issues, 'EMPTY_JSON', 'Paste a model or lesson JSON object first.') };
  }
  if (raw.length > MAX_PAYLOAD_CHARS) {
    return { title: 'Oversized submission', payloadId: 'too-large', license: '', attribution: '', issues: addIssue(issues, 'PAYLOAD_SIZE', 'Submissions are limited to 1 MB of JSON text.') };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { title: 'Invalid JSON draft', payloadId: 'invalid-json', license: '', attribution: '', issues: addIssue(issues, 'JSON_PARSE', 'The draft is not valid JSON. Fix the syntax before submitting it for review.') };
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { title: 'Invalid submission', payloadId: 'invalid-object', license: '', attribution: '', issues: addIssue(issues, 'JSON_OBJECT', 'The top-level submission must be a JSON object.') };
  }

  const record = payload as Record<string, unknown>;
  const payloadId = typeof record.id === 'string' ? record.id : 'missing-id';
  if (kind === 'MODEL') {
    const model = payload as ObjectMetadata;
    const modelIssues = validateModelSubmission(model);
    if (model.id && SPATIAL_LIBRARY[model.id]) {
      modelIssues.push({ severity: 'ERROR', code: 'MODEL_ID_COLLISION', message: 'This model ID already exists in the catalog. Use a distinct ID and revision; this review tool never overwrites catalog data.' });
    }
    if (model.capabilities?.validatedSimulation === true && model.evidence?.simulationStatus !== 'BENCHMARK_VALIDATED') {
      modelIssues.push({ severity: 'ERROR', code: 'SIMULATION_TRUST', message: 'Do not claim a validated simulation without documented benchmark evidence.' });
    }
    return {
      title: typeof model.name === 'string' && model.name.trim() ? model.name.trim().slice(0, 120) : payloadId,
      payloadId,
      license: typeof model.evidence?.license === 'string' ? model.evidence.license : '',
      attribution: typeof model.evidence?.attribution === 'string' ? model.evidence.attribution : '',
      issues: modelIssues,
    };
  }

  const lesson = payload as LearningLesson;
  const lessonIssues = validateLessonSubmission(lesson, new Set(Object.keys(SPATIAL_LIBRARY)));
  if (lesson.id && LEARNING_LESSONS.some((existing) => existing.id === lesson.id)) {
    lessonIssues.push({ severity: 'ERROR', code: 'LESSON_ID_COLLISION', message: 'This lesson ID already exists in the built-in catalog. Give the new draft a distinct ID or submit it as a revision outside this local queue.' });
  }
  return {
    title: typeof lesson.title === 'string' && lesson.title.trim() ? lesson.title.trim().slice(0, 120) : payloadId,
    payloadId,
    license: 'See linked lesson references / asset licenses',
    attribution: typeof lesson.reviewedBy === 'string' ? lesson.reviewedBy : '',
    issues: lessonIssues,
  };
}

function saveReviewQueue(queue: LocalReviewItem[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
    return true;
  } catch {
    return false;
  }
}

function issueClass(issue: ContributionValidationIssue): string {
  return issue.severity === 'ERROR' ? 'text-rose-300' : 'text-amber-200';
}

export interface AuthoringWorkbenchProps {
  onClose: () => void;
}

export function AuthoringWorkbench({ onClose }: AuthoringWorkbenchProps) {
  const [queue, setQueue] = useState<LocalReviewItem[]>(readLocalQueue);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<SubmissionKind>('LESSON');
  const [author, setAuthor] = useState('Local contributor');
  const [changeNotes, setChangeNotes] = useState('');
  const [draftJson, setDraftJson] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [draftIssues, setDraftIssues] = useState<ContributionValidationIssue[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [validationRun, setValidationRun] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'ALL' | ReviewStatus>('ALL');

  const selected = queue.find((item) => item.id === selectedId) || null;
  const visibleQueue = useMemo(
    () => queue.filter((item) => queueFilter === 'ALL' || item.status === queueFilter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [queue, queueFilter],
  );
  const latestIssues = selected?.validationIssues || draftIssues;

  useEffect(() => {
    if (queue.length) saveReviewQueue(queue);
  }, [queue]);

  const assessCurrent = () => {
    const assessment = assessDraft(draftJson, kind);
    setDraftIssues(assessment.issues);
    setValidationRun(true);
    return assessment;
  };

  const makeItem = (id: string, status: ReviewStatus, assessment: DraftAssessment): LocalReviewItem => {
    const timestamp = new Date().toISOString();
    return {
      id,
      kind,
      title: assessment.title,
      author: author.trim().slice(0, 120) || 'Local contributor',
      createdAt: queue.find((entry) => entry.id === id)?.createdAt || timestamp,
      updatedAt: timestamp,
      status,
      license: assessment.license,
      attribution: assessment.attribution,
      changeNotes: changeNotes.trim().slice(0, 1000),
      payloadId: assessment.payloadId,
      payloadJson: draftJson,
      validationIssues: assessment.issues,
    };
  };

  const saveDraft = () => {
    const assessment = assessCurrent();
    const id = selected?.id || makeId();
    const item = makeItem(id, 'DRAFT', assessment);
    const next = selected ? queue.map((entry) => entry.id === id ? item : entry) : [...queue, item];
    setQueue(next.slice(-50));
    setSelectedId(id);
    setStatusMessage('Draft saved to this browser only. It has not been uploaded or published.');
  };

  const submitForReview = () => {
    const assessment = assessCurrent();
    if (assessment.issues.some((issue) => issue.severity === 'ERROR')) {
      setStatusMessage('Submission blocked: fix all validation errors before submitting for review.');
      return;
    }
    if (selected && selected.status !== 'DRAFT' && selected.status !== 'CHANGES_REQUESTED') {
      setStatusMessage('Only a draft or a changes-requested item can be resubmitted. Save a copy as a new draft instead.');
      return;
    }
    const id = selected?.id || makeId();
    const item = makeItem(id, 'SUBMITTED', assessment);
    const next = selected ? queue.map((entry) => entry.id === id ? item : entry) : [...queue, item];
    setQueue(next.slice(-50));
    setSelectedId(id);
    setStatusMessage('Submitted to the local review queue. No server or public catalog was changed.');
  };

  const selectItem = (item: LocalReviewItem) => {
    setSelectedId(item.id);
    setKind(item.kind);
    setAuthor(item.author);
    setChangeNotes(item.changeNotes);
    setDraftJson(item.payloadJson);
    setDraftIssues(item.validationIssues || []);
    setValidationRun(true);
    setReviewer(item.reviewer || '');
    setReviewNotes(item.reviewNotes || '');
    setStatusMessage('');
  };

  const updateReviewStatus = (nextStatus: ReviewStatus) => {
    if (!selected) return;
    if (nextStatus === 'IN_REVIEW' && selected.status !== 'SUBMITTED') {
      setStatusMessage('Only submitted entries can enter review.');
      return;
    }
    if (['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(nextStatus) && selected.status !== 'IN_REVIEW') {
      setStatusMessage('Open a submitted entry for review before recording a reviewer decision.');
      return;
    }
    const assessment = assessDraft(selected.payloadJson, selected.kind);
    const reviewerName = reviewer.trim();
    const now = new Date().toISOString();
    if (nextStatus !== 'IN_REVIEW' && !reviewerName) {
      setStatusMessage('Enter a reviewer identifier before recording a decision.');
      return;
    }
    if (nextStatus === 'APPROVED' && !canPublishContribution('APPROVED', assessment.issues, reviewerName, now)) {
      setStatusMessage('Approval blocked: the payload still has validation errors or lacks review metadata.');
      return;
    }
    const updated: LocalReviewItem = {
      ...selected,
      status: nextStatus,
      updatedAt: now,
      validationIssues: assessment.issues,
      reviewer: nextStatus === 'IN_REVIEW' ? reviewerName || undefined : reviewerName,
      reviewedAt: nextStatus === 'IN_REVIEW' ? undefined : now,
      reviewNotes: reviewNotes.trim().slice(0, 2000),
    };
    setQueue(queue.map((entry) => entry.id === selected.id ? updated : entry));
    setStatusMessage(nextStatus === 'APPROVED'
      ? 'Approved in this local review queue only. Nothing has been published to the shared model catalog.'
      : `Review status updated to ${nextStatus.replace(/_/g, ' ')} locally.`);
  };

  const exportItem = (item: LocalReviewItem) => {
    try {
      const exportData = {
        schemaVersion: 1,
        notice: 'Review artifact only. Exporting does not publish or certify a model or lesson.',
        review: item,
        payload: (() => { try { return JSON.parse(item.payloadJson); } catch { return { rawDraftText: item.payloadJson }; } })(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.id}.advis-review.json`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatusMessage('Review record exported as JSON. Shared catalog data was not changed.');
    } catch {
      setStatusMessage('Export failed. The draft remains saved locally.');
    }
  };

  const transitionAvailable = selected?.status === 'IN_REVIEW';
  const errorCount = latestIssues.filter((issue) => issue.severity === 'ERROR').length;
  const warningCount = latestIssues.filter((issue) => issue.severity === 'WARNING').length;

  return (
    <div className="fixed inset-0 z-[121] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="authoring-title">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-violet-500/35 bg-slate-950 text-slate-100 shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.18em] text-violet-300">Teacher / community workspace · local-only</div>
            <h2 id="authoring-title" className="mt-1 text-lg font-semibold">Model and lesson authoring review</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Validate JSON, record review decisions, and export a review artifact. This queue stays in this browser; approved entries are not automatically published or treated as externally certified.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close authoring workbench" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-900"><X size={15} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-slate-800 p-3 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold">Review queue</h3>
              <span className="text-[9px] text-slate-500">{queue.length}/50</span>
            </div>
            <select value={queueFilter} onChange={(event) => setQueueFilter(event.currentTarget.value as 'ALL' | ReviewStatus)} aria-label="Filter review queue" className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-[10px]">
              <option value="ALL">All statuses</option>
              {VALID_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="mt-3 space-y-2">
              {visibleQueue.map((item) => (
                <button key={item.id} type="button" onClick={() => selectItem(item)} className={`w-full rounded-lg border p-3 text-left ${selectedId === item.id ? 'border-violet-400 bg-violet-950/30' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'}`}>
                  <div className="text-[8px] uppercase tracking-wider text-slate-500">{item.kind} · {item.status.replace(/_/g, ' ')}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] font-semibold">{item.title}</div>
                  <div className="mt-1 break-all text-[8px] text-slate-500">{item.payloadId}</div>
                </button>
              ))}
              {visibleQueue.length === 0 && <p className="py-5 text-center text-[10px] text-slate-500">No local submissions match this filter.</p>}
            </div>
          </aside>

          <main className="min-w-0 space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[10px] text-slate-400">Submission type
                <select value={kind} onChange={(event) => { setKind(event.currentTarget.value as SubmissionKind); setSelectedId(null); setValidationRun(false); }} className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
                  <option value="LESSON">Lesson JSON</option>
                  <option value="MODEL">Model metadata JSON</option>
                </select>
              </label>
              <label className="text-[10px] text-slate-400">Contributor / author
                <input value={author} onChange={(event) => setAuthor(event.currentTarget.value)} maxLength={120} className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
              </label>
            </div>
            <label htmlFor="authoring-json" className="block text-[10px] text-slate-400">Paste JSON payload
              <textarea id="authoring-json" value={draftJson} onChange={(event) => { setDraftJson(event.currentTarget.value); setValidationRun(false); }} rows={12} maxLength={MAX_PAYLOAD_CHARS} spellCheck={false} placeholder={kind === 'LESSON' ? '{\n  "id": "my-new-lesson",\n  "modelId": "v8_engine",\n  "...": "paste a complete lesson JSON object"\n}' : '{\n  "id": "my-new-model",\n  "name": "Example model",\n  "evidence": { "license": "..." },\n  "...": "paste model metadata JSON"\n}'} className="mt-1 block w-full resize-y rounded-lg border border-slate-700 bg-[#070d18] p-3 font-mono text-[10px] leading-relaxed text-cyan-100 placeholder:text-slate-700" />
            </label>
            <label className="block text-[10px] text-slate-400">Revision / change notes
              <input value={changeNotes} onChange={(event) => setChangeNotes(event.currentTarget.value)} maxLength={1000} placeholder="What changed and what should reviewers inspect?" className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600" />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-[10px] hover:bg-slate-900"><FilePlus2 size={13} /> Save draft locally</button>
              <button type="button" onClick={submitForReview} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-[10px] font-semibold text-violet-100 hover:bg-violet-500/25"><ShieldCheck size={13} /> Submit for review</button>
              {selected && <button type="button" onClick={() => exportItem(selected)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-[10px] hover:bg-slate-900"><Download size={13} /> Export review artifact</button>}
            </div>

            {validationRun && (
              <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">Validation results</h3>
                  <span className="text-[9px] text-slate-400">{errorCount} errors · {warningCount} warnings</span>
                </div>
                {latestIssues.length === 0
                  ? <p className="mt-2 text-[10px] text-emerald-300">No local schema/trust errors detected. This is not a scientific peer review or publishing approval.</p>
                  : <ul className="mt-2 space-y-1.5">{latestIssues.map((issue, index) => <li key={issue.code + index} className={`text-[10px] leading-relaxed ${issueClass(issue)}`}>[{issue.severity}] {issue.code}: {issue.message}</li>)}</ul>}
              </section>
            )}

            {selected && (
              <section className="rounded-xl border border-slate-800 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">Reviewer decision · {selected.status.replace(/_/g, ' ')}</h3>
                  {selected.reviewedAt && <span className="text-[9px] text-slate-500">Reviewed {new Date(selected.reviewedAt).toLocaleString()}</span>}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[10px] text-slate-400">Reviewer identifier
                    <input value={reviewer} onChange={(event) => setReviewer(event.currentTarget.value)} maxLength={120} className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
                  </label>
                  <label className="text-[10px] text-slate-400">Review notes
                    <input value={reviewNotes} onChange={(event) => setReviewNotes(event.currentTarget.value)} maxLength={2000} className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.status === 'SUBMITTED' && <button type="button" onClick={() => updateReviewStatus('IN_REVIEW')} className="rounded border border-cyan-600/30 px-3 py-2 text-[10px] text-cyan-200 hover:bg-cyan-950/40">Start review</button>}
                  {transitionAvailable && <>
                    <button type="button" onClick={() => updateReviewStatus('APPROVED')} className="rounded border border-emerald-600/30 px-3 py-2 text-[10px] text-emerald-200 hover:bg-emerald-950/40">Approve locally</button>
                    <button type="button" onClick={() => updateReviewStatus('CHANGES_REQUESTED')} className="rounded border border-amber-600/30 px-3 py-2 text-[10px] text-amber-200 hover:bg-amber-950/40">Request changes</button>
                    <button type="button" onClick={() => updateReviewStatus('REJECTED')} className="rounded border border-rose-600/30 px-3 py-2 text-[10px] text-rose-200 hover:bg-rose-950/40">Reject</button>
                  </>}
                </div>
              </section>
            )}

            {statusMessage && <p className="rounded-lg border border-cyan-700/30 bg-cyan-950/20 p-3 text-[10px] leading-relaxed text-cyan-100" role="status">{statusMessage}</p>}
            <p className="text-[9px] leading-relaxed text-slate-500">Privacy: queue entries are stored only in this browser’s local storage and can be exported. They are not sent to a server. “Approved locally” means a local reviewer recorded a decision; it does not publish a new model, verify scientific truth, or certify CAD. Use the built-in CI/review pipeline before proposing any shared catalog change.</p>
          </main>
        </div>
      </section>
    </div>
  );
}

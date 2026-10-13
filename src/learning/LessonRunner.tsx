import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Download, Lightbulb, RotateCcw, X } from 'lucide-react';
import { LEARNING_LESSONS, getLessonById } from './LessonCatalog';
import { clearLessonProgress, loadLessonProgress, saveLessonProgress } from './LessonProgress';
import type { LearningLesson, LessonAction, LessonProgress, LessonStep } from './LessonSchema';
import { SPATIAL_LIBRARY } from '../SpatialLibrary';
import { createOfflineLearningPack, downloadOfflineLearningHtmlPack, downloadOfflineLearningPack } from './OfflineLearningPack';

export interface LessonRunnerProps {
  open: boolean;
  onClose: () => void;
  initialLessonId?: string;
  selectedComponentId?: string | null;
  onOpenModel: (modelId: string) => void;
  onAction: (action: LessonAction) => void;
}

function makeInitialProgress(lesson: LearningLesson): LessonProgress {
  return {
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    currentStepIndex: 0,
    completedStepIds: [],
    answersByQuestionId: {},
    updatedAt: new Date().toISOString(),
  };
}

export function LessonRunner({
  open,
  onClose,
  initialLessonId,
  selectedComponentId,
  onOpenModel,
  onAction,
}: LessonRunnerProps) {
  const [lessonId, setLessonId] = useState(initialLessonId || LEARNING_LESSONS[0]?.id || '');
  const lesson = useMemo(() => getLessonById(lessonId) || LEARNING_LESSONS[0], [lessonId]);
  const [progress, setProgress] = useState<LessonProgress>(() => lesson ? loadLessonProgress(lesson.id, lesson.version) || makeInitialProgress(lesson) : {
    lessonId: '', lessonVersion: 1, currentStepIndex: 0, completedStepIds: [], answersByQuestionId: {}, updatedAt: new Date().toISOString()
  });
  const [draftChoice, setDraftChoice] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [offlinePackStatus, setOfflinePackStatus] = useState<string | null>(null);
  const lastActionToken = useRef('');
  const lastOpenedLesson = useRef('');

  useEffect(() => {
    if (open && initialLessonId && getLessonById(initialLessonId) && initialLessonId !== lessonId) {
      setLessonId(initialLessonId);
    }
  }, [open, initialLessonId, lessonId]);

  useEffect(() => {
    if (!lesson) return;
    const saved = loadLessonProgress(lesson.id, lesson.version);
    setProgress(saved || makeInitialProgress(lesson));
    setDraftChoice('');
    setShowHint(false);
    setActionError(null);
    lastActionToken.current = '';
    lastOpenedLesson.current = '';
  }, [lesson?.id, lesson?.version]);

  const isFinished = Boolean(lesson && progress.currentStepIndex >= lesson.steps.length);
  const step: LessonStep | undefined = lesson && !isFinished ? lesson.steps[progress.currentStepIndex] : undefined;
  const completedCount = lesson ? progress.completedStepIds.filter((id) => lesson.steps.some((candidate) => candidate.id === id)).length : 0;
  const progressPercent = lesson ? Math.round((completedCount / lesson.steps.length) * 100) : 0;
  const submittedChoice = step?.question ? progress.answersByQuestionId[step.question.id] : undefined;
  const answerCorrect = Boolean(step?.question && submittedChoice === step.question.correctChoiceId);
  const stepCompleted = Boolean(step && progress.completedStepIds.includes(step.id));
  const selectionRequirementMet = Boolean(step?.completionRule.type === 'SELECT_COMPONENT' && selectedComponentId === step.completionRule.componentId);
  const canAdvance = Boolean(step && (
    stepCompleted ||
    selectionRequirementMet ||
    (step.completionRule.type === 'ACKNOWLEDGE' && step.question && answerCorrect)
  ) && (!step?.question || answerCorrect));

  useEffect(() => {
    if (!open || !lesson) return;
    if (lastOpenedLesson.current !== lesson.id) {
      lastOpenedLesson.current = lesson.id;
      try { onOpenModel(lesson.modelId); } catch (error) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    }
    if (!step?.action) return;
    const token = `${lesson.id}@${lesson.version}:${step.id}`;
    if (lastActionToken.current === token) return;
    lastActionToken.current = token;
    try {
      onAction(step.action);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  }, [open, lesson?.id, lesson?.version, step?.id, onOpenModel, onAction]);

  useEffect(() => {
    if (lesson && progress.lessonId === lesson.id && progress.lessonVersion === lesson.version) {
      saveLessonProgress(progress);
    }
  }, [lesson, progress]);

  if (!open || !lesson) return null;

  const saveAnswer = () => {
    if (!step?.question || !draftChoice) return;
    const isCorrect = draftChoice === step.question.correctChoiceId;
    const completedStepIds = isCorrect
      ? [...new Set([...progress.completedStepIds, step.id])]
      : progress.completedStepIds.filter((id) => id !== step.id);
    const next: LessonProgress = {
      ...progress,
      completedStepIds,
      answersByQuestionId: { ...progress.answersByQuestionId, [step.question.id]: draftChoice },
      updatedAt: new Date().toISOString(),
    };
    setProgress(next);
    saveLessonProgress(next);
  };

  const markStepComplete = () => {
    if (!step) return;
    if (step.question && !answerCorrect) return;
    if (step.completionRule.type === 'SELECT_COMPONENT' && selectedComponentId !== step.completionRule.componentId) return;
    const next = { ...progress, completedStepIds: [...new Set([...progress.completedStepIds, step.id])], updatedAt: new Date().toISOString() };
    setProgress(next);
    saveLessonProgress(next);
  };

  const goNext = () => {
    if (!step || !canAdvance) return;
    const next = {
      ...progress,
      completedStepIds: [...new Set([...progress.completedStepIds, step.id])],
      currentStepIndex: Math.min(lesson.steps.length, progress.currentStepIndex + 1),
      updatedAt: new Date().toISOString(),
    };
    setProgress(next);
    setDraftChoice('');
    setShowHint(false);
    saveLessonProgress(next);
  };

  const goPrevious = () => {
    setProgress((current) => {
      const next = { ...current, currentStepIndex: Math.max(0, current.currentStepIndex - 1), updatedAt: new Date().toISOString() };
      saveLessonProgress(next);
      return next;
    });
    setDraftChoice('');
    setShowHint(false);
  };

  const restart = () => {
    clearLessonProgress(lesson.id, lesson.version);
    const next = makeInitialProgress(lesson);
    setProgress(next);
    setDraftChoice('');
    setShowHint(false);
    setActionError(null);
    lastActionToken.current = '';
    lastOpenedLesson.current = '';
    saveLessonProgress(next);
  };

  const chooseLesson = (nextLessonId: string) => {
    const nextLesson = getLessonById(nextLessonId);
    if (!nextLesson) return;
    setLessonId(nextLesson.id);
  };

  return (
    <div className="absolute inset-0 z-[90] pointer-events-auto flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Guided learning lesson">
      <section className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-[0_20px_80px_rgba(0,0,0,0.55)] flex flex-col">
        <header className="px-4 sm:px-6 py-4 border-b border-cyan-500/20 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl border border-cyan-500/30 bg-cyan-950/60 flex items-center justify-center shrink-0"><BookOpen size={19} className="text-cyan-300" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">Free guided learning · locally saved progress</div>
            <h2 className="text-lg sm:text-xl font-semibold mt-1">{lesson.title}</h2>
            <p className="text-xs leading-relaxed text-slate-400 mt-1">{lesson.summary}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close lesson" className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center justify-center"><X size={16} /></button>
        </header>

        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800">
          <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-[9px] uppercase tracking-[0.13em] text-slate-500">
            Choose a lesson
            <select value={lesson.id} onChange={(event) => chooseLesson(event.currentTarget.value)} className="sm:ml-2 flex-1 rounded-md border border-slate-700 bg-slate-900 text-cyan-100 px-3 py-2 text-[11px] normal-case tracking-normal outline-none focus:border-cyan-400">
              {LEARNING_LESSONS.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.learnerLevel.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <div className="flex items-center justify-between gap-3 mt-3 text-[9px] text-slate-400">
            <span>{completedCount} of {lesson.steps.length} steps completed</span>
            <span>{lesson.estimatedMinutes} min · {lesson.authoringStatus.replace(/_/g, ' ')}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const model = SPATIAL_LIBRARY[lesson.modelId];
                if (!model) {
                  setOfflinePackStatus('This lesson has no matching catalog model, so a pack could not be prepared.');
                  return;
                }
                try {
                  const pack = createOfflineLearningPack(lesson, model);
                  setOfflinePackStatus(downloadOfflineLearningHtmlPack(pack)
                    ? 'Self-contained HTML workbook downloaded. It runs offline and includes lesson text, checkboxes and formative questions, but not the 3D runtime or live simulation.'
                    : 'Download could not start in this browser. Check download permissions and try again.');
                } catch (error) {
                  setOfflinePackStatus(error instanceof Error ? error.message : 'Offline workbook could not be prepared.');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/20 px-2.5 py-2 text-[10px] text-cyan-100 hover:bg-cyan-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Download size={12} /> Download offline HTML workbook
            </button>
            <button
              type="button"
              onClick={() => {
                const model = SPATIAL_LIBRARY[lesson.modelId];
                if (!model) {
                  setOfflinePackStatus('This lesson has no matching catalog model, so a data pack could not be prepared.');
                  return;
                }
                try {
                  const pack = createOfflineLearningPack(lesson, model);
                  setOfflinePackStatus(downloadOfflineLearningPack(pack)
                    ? 'JSON data pack downloaded for backup, migration or authoring. Use the HTML workbook for a ready-to-read offline experience.'
                    : 'Download could not start in this browser. Check download permissions and try again.');
                } catch (error) {
                  setOfflinePackStatus(error instanceof Error ? error.message : 'Offline data pack could not be prepared.');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-2 text-[10px] text-slate-200 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Download size={12} /> Export JSON pack
            </button>
            {offlinePackStatus && (
              <p className="basis-full text-[10px] leading-relaxed text-slate-400" role="status" aria-live="polite">{offlinePackStatus}</p>
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          {isFinished ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full border border-emerald-400/40 bg-emerald-950/50 flex items-center justify-center text-emerald-300"><Check size={26} /></div>
              <h3 className="text-xl font-semibold">Lesson complete!</h3>
              <p className="max-w-xl mx-auto text-sm text-slate-300 leading-relaxed mt-2">You've completed the guided steps. Revisit any step, explore the model independently, or restart the lesson to practise again.</p>
              <p className="text-[10px] text-slate-500 mt-4">Progress is stored on this device when browser storage is available. It is not sent to a server.</p>
              <button type="button" onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-4 py-2 text-xs text-cyan-200 hover:bg-cyan-950/50"><RotateCcw size={13} /> Restart lesson</button>
            </div>
          ) : step && (
            <>
              <div className="text-[9px] uppercase tracking-[0.17em] text-cyan-400">Step {progress.currentStepIndex + 1} / {lesson.steps.length}</div>
              <h3 className="text-xl font-semibold mt-2">{step.title}</h3>
              <p className="text-xs leading-relaxed text-cyan-100/70 mt-1">Objective: {step.objective}</p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-2">Understand</div>
                <p className="text-sm leading-7 text-slate-200">{step.explanation}</p>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <div className="text-[9px] uppercase tracking-[0.15em] text-cyan-400 mb-2">Your task</div>
                <p className="text-sm text-cyan-50 leading-relaxed">{step.learnerTask}</p>
                {step.completionRule.type === 'SELECT_COMPONENT' && (
                  <div className="text-xs mt-3" role="status">
                    {selectedComponentId === step.completionRule.componentId
                      ? <span className="text-emerald-300 inline-flex items-center gap-1"><Check size={13} /> Correct component selected</span>
                      : <span className="text-amber-200">Select component ID: <code className="text-amber-100">{step.completionRule.componentId}</code></span>}
                  </div>
                )}
                {step.completionRule.type === 'ACKNOWLEDGE' && !step.question && (
                  <button type="button" onClick={markStepComplete} className="mt-3 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-950/70">
                    {stepCompleted ? 'Step completed' : 'Mark step complete'}
                  </button>
                )}
              </div>

              {step.question && (
                <fieldset className="mt-4 rounded-xl border border-slate-800 p-4">
                  <legend className="px-2 text-sm font-semibold text-white">{step.question.prompt}</legend>
                  <div className="space-y-2 mt-2">
                    {step.question.choices.map((choice) => {
                      const wasSubmitted = submittedChoice === choice.id;
                      const isCorrect = choice.id === step.question?.correctChoiceId;
                      const border = wasSubmitted
                        ? (isCorrect ? 'border-emerald-400 bg-emerald-950/50' : 'border-rose-400 bg-rose-950/30')
                        : (draftChoice === choice.id ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40');
                      return (
                        <label key={choice.id} className={`flex gap-3 items-start rounded-lg border p-3 text-sm cursor-pointer transition-colors ${border}`}>
                          <input type="radio" name={step.question?.id} value={choice.id} checked={draftChoice === choice.id} onChange={() => setDraftChoice(choice.id)} className="mt-1 accent-cyan-400" />
                          <span className="leading-relaxed">{choice.text}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button type="button" onClick={saveAnswer} disabled={!draftChoice} className="mt-3 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-40">Check answer</button>
                  {submittedChoice && (
                    <div className={`mt-3 rounded-lg p-3 text-xs leading-relaxed ${answerCorrect ? 'text-emerald-200 bg-emerald-950/40' : 'text-rose-200 bg-rose-950/30'}`} role="status">
                      <div className="font-semibold mb-1">{answerCorrect ? 'Correct!' : 'Not quite — try again.'}</div>
                      {answerCorrect ? step.question.explanation : (step.question.hint || step.hint || 'Review the explanation and try another answer.')}
                    </div>
                  )}
                </fieldset>
              )}

              {showHint && (step.hint || step.question?.hint) && (
                <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-100">
                  <Lightbulb size={15} className="shrink-0 mt-0.5" /> {step.hint || step.question?.hint}
                </div>
              )}
              {(step.hint || step.question?.hint) && (
                <button type="button" onClick={() => setShowHint((value) => !value)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-100"><Lightbulb size={13} /> {showHint ? 'Hide hint' : 'Need a hint?'}</button>
              )}
              {actionError && <p className="mt-3 text-xs text-rose-300" role="alert">The lesson action could not be applied: {actionError}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
                <span>Progress saves locally when available.</span>
                <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 hover:text-slate-300"><RotateCcw size={11} /> Restart</button>
              </div>
            </>
          )}
        </div>

        {!isFinished && (
          <footer className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/95">
            <button type="button" onClick={goPrevious} disabled={progress.currentStepIndex === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-35"><ChevronLeft size={14} /> Previous</button>
            <button type="button" onClick={goNext} disabled={!canAdvance} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-35 disabled:cursor-not-allowed">{progress.currentStepIndex === lesson.steps.length - 1 ? 'Finish lesson' : 'Next step'} <ChevronRight size={14} /></button>
          </footer>
        )}
      </section>
    </div>
  );
}

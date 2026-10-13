import React, { useEffect, useMemo, useState } from 'react';
import type { ComponentMetadata } from '../SpatialLibrary';
import type { GuidedLessonDefinition, LessonProgress } from './LessonSchema';

interface LearningStepPanelProps {
  lesson: GuidedLessonDefinition;
  components: ComponentMetadata[];
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
  onHighlightComponent?: (id: string | null) => void;
}

function readProgress(lesson: GuidedLessonDefinition): LessonProgress {
  const empty: LessonProgress = {
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    currentStepIndex: 0,
    answers: {},
    completedStepIds: [],
    completed: false,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(`advis:lesson-progress:${lesson.id}:${lesson.version}`);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<LessonProgress>;
    if (parsed.lessonId !== lesson.id || parsed.lessonVersion !== lesson.version) return empty;
    return {
      ...empty,
      ...parsed,
      currentStepIndex: Math.max(0, Math.min(lesson.steps.length - 1, Number(parsed.currentStepIndex) || 0)),
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      completedStepIds: Array.isArray(parsed.completedStepIds) ? parsed.completedStepIds : [],
      completed: parsed.completed === true,
    };
  } catch {
    return empty;
  }
}

export function LearningStepPanel({
  lesson,
  components,
  selectedComponentId,
  onSelectComponent,
  onHighlightComponent,
}: LearningStepPanelProps) {
  const [progress, setProgress] = useState<LessonProgress>(() => readProgress(lesson));
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setProgress(readProgress(lesson));
    setShowHint(false);
  }, [lesson.id, lesson.version]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `advis:lesson-progress:${lesson.id}:${lesson.version}`,
        JSON.stringify({ ...progress, updatedAt: new Date().toISOString() })
      );
    } catch {
      // Progress is a convenience; storage denial/quota must not block a lesson.
    }
  }, [lesson.id, lesson.version, progress]);

  const step = lesson.steps[progress.currentStepIndex];
  const targetComponent = useMemo(() => {
    if (!step) return undefined;
    const terms = step.targetComponentNames.map((value) => value.toLowerCase());
    return components.find((component) => {
      const label = `${component.name} ${component.id} ${component.description}`.toLowerCase();
      return terms.some((term) => label.includes(term));
    });
  }, [components, step]);

  if (!step) return null;

  const selectedAnswer = progress.answers[step.id];
  const answeredCorrectly = selectedAnswer === step.question.correctOptionId;
  const done = progress.completedStepIds.includes(step.id);
  const progressPercent = Math.round((progress.completedStepIds.length / lesson.steps.length) * 100);
  const evidenceText = {
    SOURCE_BACKED_FACT: 'Source-backed fact',
    GENERAL_SCIENTIFIC_PRINCIPLE: 'General scientific principle',
    ILLUSTRATIVE_MODEL_BEHAVIOR: 'Illustrative model behavior',
    UNVERIFIED_ASSUMPTION: 'Unverified assumption',
  }[step.evidenceLabel];

  const save = (patch: Partial<LessonProgress>) => {
    setProgress((previous) => ({ ...previous, ...patch, updatedAt: new Date().toISOString() }));
  };

  const chooseAnswer = (answerId: string) => {
    save({ answers: { ...progress.answers, [step.id]: answerId } });
  };

  const completeStep = () => {
    if (!answeredCorrectly) return;
    const completedStepIds = [...new Set([...progress.completedStepIds, step.id])];
    const isComplete = completedStepIds.length === lesson.steps.length;
    save({
      completedStepIds,
      currentStepIndex: isComplete ? progress.currentStepIndex : Math.min(progress.currentStepIndex + 1, lesson.steps.length - 1),
      completed: isComplete,
    });
    setShowHint(false);
  };

  const reset = () => {
    const next = readProgress({ ...lesson, steps: lesson.steps });
    save({ ...next, currentStepIndex: 0, answers: {}, completedStepIds: [], completed: false });
    setShowHint(false);
  };

  return (
    <section aria-label={`Guided lesson: ${lesson.title}`} className="bg-white/95 border border-slate-300 shadow-lg overflow-hidden text-slate-800">
      <header className="px-3 py-2 border-b border-slate-200 flex items-start justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-rose-600">Guided learning · {lesson.estimatedMinutes} min</div>
          <h3 className="text-sm font-semibold leading-tight">{lesson.title}</h3>
          <p className="text-[9px] text-slate-500 mt-1">{progress.completedStepIds.length}/{lesson.steps.length} steps · {progressPercent}%</p>
        </div>
        <button type="button" onClick={reset} className="text-[9px] border border-slate-200 px-2 py-1 hover:border-rose-400" aria-label="Reset lesson progress">Reset</button>
      </header>

      <div className="h-1 bg-slate-100"><div className="h-full bg-rose-500 transition-all" style={{ width: `${progressPercent}%` }} /></div>
      <div className="max-h-[42vh] overflow-y-auto p-3 space-y-3">
        {progress.completed ? (
          <div role="status" className="space-y-2">
            <h4 className="font-semibold text-sm">Lesson complete 🎉</h4>
            <p className="text-[11px] leading-relaxed">You completed every question. Review the lesson limitations below; completion means the learning activity was finished, not that the model is certified.</p>
            <ul className="list-disc pl-4 text-[10px] space-y-1">{lesson.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            <button type="button" onClick={reset} className="w-full border border-slate-300 px-2 py-2 text-[10px] hover:border-rose-400">Repeat lesson</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-slate-500">
              <span>Step {progress.currentStepIndex + 1} of {lesson.steps.length}</span>
              <span className="border border-slate-200 px-1.5 py-0.5">{evidenceText}</span>
            </div>
            <h4 className="font-semibold text-sm">{step.title}</h4>
            <p className="text-[10px] leading-relaxed"><strong>Objective:</strong> {step.objective}</p>
            <p className="text-[11px] leading-relaxed">{step.instruction}</p>

            {targetComponent ? (
              <div className="border border-slate-200 bg-slate-50 p-2 space-y-1.5">
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em]">Suggested component</div>
                <div className="text-[11px] font-semibold">{targetComponent.name}</div>
                <p className="text-[10px] text-slate-600">{step.expectedObservation}</p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectComponent?.(targetComponent.id);
                    onHighlightComponent?.(targetComponent.id);
                    window.dispatchEvent(new CustomEvent('advis-focus-component', { detail: { componentId: targetComponent.id } }));
                  }}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5 text-[10px] hover:border-rose-400"
                >Focus / select this component</button>
                <div className="text-[9px] text-slate-500">{selectedComponentId === targetComponent.id ? 'This component is selected.' : 'Use the component drawer or the button above to select the part.'}</div>
              </div>
            ) : (
              <p role="status" className="border border-amber-200 bg-amber-50 p-2 text-[10px]">This catalog does not expose a component matching this lesson step. Continue with the concept explanation; no component-selection claim is made.</p>
            )}

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold">{step.question.prompt}</p>
              {step.question.options.map((option) => {
                const selected = selectedAnswer === option.id;
                const correct = selected && option.id === step.question.correctOptionId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseAnswer(option.id)}
                    className={`w-full text-left border px-2 py-2 text-[10px] transition-colors ${correct ? 'border-emerald-500 bg-emerald-50' : selected ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                  >{option.text}</button>
                );
              })}
              {selectedAnswer && (
                <p role="status" className={`text-[10px] leading-relaxed p-2 ${answeredCorrectly ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {answeredCorrectly ? step.question.explanationCorrect : step.question.explanationIncorrect}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowHint((value) => !value)} className="border border-slate-200 px-2 py-1.5 text-[10px] hover:border-slate-400">{showHint ? 'Hide hint' : 'Hint'}</button>
              <button
                type="button"
                disabled={!answeredCorrectly}
                onClick={completeStep}
                className="flex-1 border border-slate-800 bg-slate-900 text-white disabled:opacity-40 px-2 py-1.5 text-[10px]"
              >{progress.currentStepIndex === lesson.steps.length - 1 ? 'Finish lesson' : 'Check & continue'}</button>
            </div>
            {showHint && <p className="text-[10px] leading-relaxed bg-amber-50 border border-amber-200 p-2">Hint: {step.hint}</p>}
            <p className="text-[10px] text-slate-600 leading-relaxed">{step.explanation}</p>
          </>
        )}

        <details className="border-t border-slate-200 pt-2">
          <summary className="cursor-pointer text-[10px] font-semibold">Assumptions and limitations</summary>
          <ul className="list-disc pl-4 mt-2 text-[9px] leading-relaxed space-y-1">
            {lesson.limitations.map((item) => <li key={item}>{item}</li>)}
            {step.limitations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>
      </div>
    </section>
  );
}

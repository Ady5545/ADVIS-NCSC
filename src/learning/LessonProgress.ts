import type { LessonProgress } from './LessonSchema';

const STORAGE_KEY = 'advis-ncsc.lesson-progress.v1';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStore(): Record<string, LessonProgress> {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, LessonProgress>;
  } catch {
    return {};
  }
}

function progressKey(lessonId: string, version: number) {
  return `${lessonId}@${version}`;
}

/** Progress contains only lesson IDs, step IDs and answer choices—never account identity. */
export function loadLessonProgress(lessonId: string, version: number): LessonProgress | null {
  const item = readStore()[progressKey(lessonId, version)];
  if (!item || item.lessonId !== lessonId || item.lessonVersion !== version) return null;
  if (!Number.isFinite(item.currentStepIndex) || !Array.isArray(item.completedStepIds) || !item.answersByQuestionId) return null;
  return item;
}

export function saveLessonProgress(progress: LessonProgress): boolean {
  if (!hasStorage()) return false;
  try {
    const store = readStore();
    store[progressKey(progress.lessonId, progress.lessonVersion)] = {
      ...progress,
      currentStepIndex: Math.max(0, Math.floor(progress.currentStepIndex)),
      completedStepIds: [...new Set(progress.completedStepIds)],
      answersByQuestionId: { ...progress.answersByQuestionId },
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function clearLessonProgress(lessonId: string, version: number): boolean {
  if (!hasStorage()) return false;
  try {
    const store = readStore();
    delete store[progressKey(lessonId, version)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

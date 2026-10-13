import type { LearningLesson } from './LessonSchema';
import type { ObjectMetadata } from '../SpatialLibrary';

export const OFFLINE_PACK_SCHEMA_VERSION = 1;

export interface OfflineLearningPack {
  schemaVersion: 1;
  createdAt: string;
  title: string;
  lesson: LearningLesson;
  modelSummary: {
    id: string;
    name: string;
    description: string;
    modelVersion: string;
    modelKind: string;
    limitations: string[];
    availableOffline: 'LESSON_TEXT_AND_ASSESSMENT_ONLY';
  };
  notice: string;
}

export function createOfflineLearningPack(
  lesson: LearningLesson,
  model: ObjectMetadata,
  createdAt = new Date().toISOString(),
): OfflineLearningPack {
  if (lesson.modelId !== model.id) throw new Error('Lesson and model IDs do not match.');
  return {
    schemaVersion: OFFLINE_PACK_SCHEMA_VERSION,
    createdAt,
    title: `${lesson.title} — Offline Lesson Pack`,
    lesson: JSON.parse(JSON.stringify(lesson)) as LearningLesson,
    modelSummary: {
      id: model.id,
      name: model.name,
      description: model.description,
      modelVersion: model.modelVersion || 'unversioned',
      modelKind: model.modelKind || 'unspecified',
      limitations: [...(model.evidence?.limitations || []), ...lesson.limitations],
      availableOffline: 'LESSON_TEXT_AND_ASSESSMENT_ONLY',
    },
    notice: 'This pack saves lesson text, objectives, questions, hints, and model limitations. It does not include the interactive 3D mesh, simulation runtime, external assets, or AI access; those may still require the website and network.',
  };
}

export function serializeOfflineLearningPack(pack: OfflineLearningPack): string {
  return JSON.stringify(pack, null, 2);
}

export function validateOfflineLearningPack(value: unknown): value is OfflineLearningPack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const pack = value as Partial<OfflineLearningPack>;
  return pack.schemaVersion === OFFLINE_PACK_SCHEMA_VERSION &&
    typeof pack.title === 'string' &&
    Boolean(pack.lesson && typeof pack.lesson.id === 'string' && Array.isArray(pack.lesson.steps)) &&
    Boolean(pack.modelSummary && typeof pack.modelSummary.id === 'string') &&
    pack.modelSummary?.availableOffline === 'LESSON_TEXT_AND_ASSESSMENT_ONLY';
}

export function downloadOfflineLearningPack(pack: OfflineLearningPack): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  try {
    const blob = new Blob([serializeOfflineLearningPack(pack)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.lesson.id}-offline-pack.json`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

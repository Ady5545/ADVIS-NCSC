import type { LearningLesson } from './LessonSchema';
import type { ObjectMetadata } from '../SpatialLibrary';

export interface OfflineLessonPack {
  schemaVersion: 1;
  createdAt: string;
  lesson: LearningLesson;
  modelSummary: {
    id: string;
    name: string;
    category: string;
    description: string;
    modelKind: string;
    geometryAuthority: string;
    dimensionsStatus: string;
    simulationStatus: string;
    limitations: string[];
    componentList: Array<{ id: string; name: string; description: string }>;
  };
  offlineNotice: string[];
}

/** Text-and-metadata pack only. Does not copy third-party model files or application code. */
export function buildOfflineLessonPack(lesson: LearningLesson, object: ObjectMetadata): OfflineLessonPack {
  if (lesson.modelId !== object.id) {
    throw new Error('The selected lesson and model do not match.');
  }
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    lesson: JSON.parse(JSON.stringify(lesson)) as LearningLesson,
    modelSummary: {
      id: object.id,
      name: object.name,
      category: object.category,
      description: object.description,
      modelKind: object.modelKind || 'NOT_DECLARED',
      geometryAuthority: object.evidence?.geometryAuthority || 'NOT_DECLARED',
      dimensionsStatus: object.evidence?.dimensionsStatus || 'NOT_DECLARED',
      simulationStatus: object.evidence?.simulationStatus || 'NOT_DECLARED',
      limitations: [...(object.evidence?.limitations || []), ...(object.educationalInformation?.specifications ? [] : ['No structured physical specifications are supplied for this pack.'])],
      componentList: (object.components || []).map((component) => ({
        id: component.id,
        name: component.name,
        description: component.description,
      })),
    },
    offlineNotice: [
      'This pack contains lesson text and catalog metadata, not the ADVIS app bundle or large 3D/model assets.',
      'Offline interactive 3D requires the app shell and needed assets to have been cached separately.',
      'AI responses, live search, external references, cloud sync, and uncached assets require a network connection.',
      'The source model is unchanged; saved lesson progress is managed separately by the browser on this device.',
    ],
  };
}

export function serializeOfflineLessonPack(lesson: LearningLesson, object: ObjectMetadata): string {
  return JSON.stringify(buildOfflineLessonPack(lesson, object), null, 2);
}

export type LearningEvidenceLabel =
  | 'SOURCE_BACKED_FACT'
  | 'GENERAL_SCIENTIFIC_PRINCIPLE'
  | 'ILLUSTRATIVE_MODEL_BEHAVIOR'
  | 'UNVERIFIED_ASSUMPTION';

export interface LessonAnswerOption {
  id: string;
  text: string;
}

export interface LessonQuestion {
  id: string;
  prompt: string;
  options: LessonAnswerOption[];
  correctOptionId: string;
  explanationCorrect: string;
  explanationIncorrect: string;
}

export interface GuidedLessonStep {
  id: string;
  title: string;
  objective: string;
  instruction: string;
  expectedObservation: string;
  explanation: string;
  hint: string;
  targetComponentNames: string[];
  question: LessonQuestion;
  evidenceLabel: LearningEvidenceLabel;
  limitations: string[];
}

export interface GuidedLessonDefinition {
  id: string;
  version: number;
  title: string;
  domain: string;
  learnerLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  prerequisites: string[];
  objectives: string[];
  applicableModelIds: string[];
  reviewStatus: 'DRAFT' | 'CONTENT_REVIEWED' | 'EXPERT_REVIEWED';
  author: string;
  references: Array<{ title: string; url?: string; note?: string }>;
  limitations: string[];
  steps: GuidedLessonStep[];
}

export interface LessonProgress {
  lessonId: string;
  lessonVersion: number;
  currentStepIndex: number;
  answers: Record<string, string>;
  completedStepIds: string[];
  completed: boolean;
  updatedAt: string;
}

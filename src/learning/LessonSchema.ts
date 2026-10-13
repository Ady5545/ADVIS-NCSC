export type LessonLearningLevel = 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'ADVANCED';

export type LessonViewMode = 'SOLID' | 'GLASS' | 'BLUEPRINT';

export type LessonAction =
  | { type: 'SELECT_COMPONENT'; componentId: string }
  | { type: 'SET_EXPLOSION'; factor: number }
  | { type: 'SET_VIEW_MODE'; mode: LessonViewMode }
  | { type: 'SET_RPM'; rpm: number }
  | { type: 'SCRUB_CYCLE'; angleDeg: number }
  | { type: 'RESET_VIEW' };

export interface LessonQuestionChoice {
  id: string;
  text: string;
}

export interface LessonQuestion {
  id: string;
  prompt: string;
  choices: LessonQuestionChoice[];
  correctChoiceId: string;
  explanation: string;
  hint?: string;
}

export type LessonCompletionRule =
  | { type: 'ACKNOWLEDGE' }
  | { type: 'SELECT_COMPONENT'; componentId: string }
  | { type: 'ANSWER_QUESTION'; questionId: string };

export interface LessonStep {
  id: string;
  title: string;
  objective: string;
  explanation: string;
  learnerTask: string;
  action?: LessonAction;
  completionRule: LessonCompletionRule;
  question?: LessonQuestion;
  hint?: string;
  sourceNotes?: string[];
  estimatedMinutes?: number;
}

export interface LearningLesson {
  id: string;
  version: number;
  title: string;
  domain: 'MECHANICAL_ENGINEERING' | 'CHEMISTRY' | 'ANATOMY' | 'PHYSICS' | 'ELECTRICAL_ENGINEERING' | 'FLUID_MECHANICS' | 'ROBOTICS' | 'STRUCTURES' | 'AEROSPACE';
  learnerLevel: LessonLearningLevel;
  summary: string;
  modelId: string;
  prerequisites: string[];
  learningObjectives: string[];
  estimatedMinutes: number;
  authoringStatus: 'EDUCATIONAL_DRAFT' | 'CONTENT_REVIEWED' | 'EVIDENCE_REVIEWED';
  reviewedBy?: string;
  reviewedAt?: string;
  sourceReferences: Array<{ label: string; url?: string; applicability: 'GENERAL_PRINCIPLE' | 'EXACT_MODEL' | 'ILLUSTRATIVE' }>;
  limitations: string[];
  steps: LessonStep[];
}

export interface LessonProgress {
  lessonId: string;
  lessonVersion: number;
  currentStepIndex: number;
  completedStepIds: string[];
  answersByQuestionId: Record<string, string>;
  updatedAt: string;
}

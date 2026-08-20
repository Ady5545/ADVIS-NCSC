export type Subject = 'Chemistry' | 'Physics' | 'Mathematics' | 'ComputerScience';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type LearnMode = 'SHOW_ME' | 'TEACH_ME';
export type ChemistryIntent = 'SHOW_STRUCTURE' | 'TEACH_PROCESS' | 'LEWIS_STRUCTURE' | 'IONIC_BOND_FORMATION' | 'HYBRIDIZATION' | 'UNKNOWN';

export interface LearnTopicContext {
  classLevel: string;
  subject: Subject;
  chapter: string;
  topic: string;
  entity?: string;
  intent?: ChemistryIntent;
}

export interface LearnStep {
  id: string;
  title: string;
  explanation: string;
  reasoning: string;
  visualStateId: string; // References a predefined visualization state in the rendering engine
  checkpointQuestion?: string; // Optional question for the user to answer before moving on
}

export interface LearningSession {
  id: string;
  context: LearnTopicContext;
  mode: LearnMode;
  difficulty: Difficulty;
  steps: LearnStep[];
  currentStepIndex: number;
  completed: boolean;
}

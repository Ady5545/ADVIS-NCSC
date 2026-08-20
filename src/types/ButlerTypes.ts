export type InteractionClassification = 
  | 'REQUEST' 
  | 'QUESTION' 
  | 'CORRECTION' 
  | 'CONTINUATION' 
  | 'ACKNOWLEDGEMENT' 
  | 'CASUAL_CONVERSATION';

export type SubsystemTarget = 
  | 'CHEMISTRY' 
  | 'SPATIAL' 
  | 'ENGINEERING'
  | 'PROJECT' 
  | 'MEMORY' 
  | 'EXECUTION' 
  | 'HELIOMOTION' 
  | 'LOCAL_INTEL' 
  | 'CONVERSATION' 
  | 'SEARCH';

export interface RecentAction {
  type: string;
  target?: string | null;
  name?: string | null;
  timestamp: number;
  details?: any;
}

export interface ButlerContext {
  activeProjectId?: string | null;
  activeProjectName?: string | null;
  activeWorkspace: 'HUD' | 'SPATIAL' | 'CHEMISTRY' | 'ENGINEERING';
  activeSpatialObject?: string | string[] | null;
  activeScientificVisualization?: string | null;
  selectedComponentId?: string | null;
  hoveredComponentId?: string | null;
  spatialMode?: string;
  showLabels?: boolean;
  isEngineeringMode?: boolean;
  systemState?: string;
  recentActions?: RecentAction[];
  recentConversation?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ButlerDecision {
  userObjective: string;
  classification: InteractionClassification;
  isAnaphoric: boolean;
  resolvedReference?: string | null;
  targetSubsystem: SubsystemTarget;
  responseMode: 'VERBAL_ONLY' | 'ACTION_ONLY' | 'BOTH';
  proactiveSuggestion?: string | null;
}

export interface ButlerResponse {
  reply: string;
  mode?: string;
  status: 'online' | 'offline' | 'error';
  spatialAction?: any;
  learnAction?: any;
  activeProjectId?: string;
  butlerDecision?: ButlerDecision;
}

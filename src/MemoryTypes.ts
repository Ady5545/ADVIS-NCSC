export type MemoryCategory = 
  | 'PERSONAL'
  | 'PROJECT'
  | 'HARDWARE'
  | 'ENGINEERING'
  | 'DEVELOPMENT'
  | 'GOAL'
  | 'PREFERENCE'
  | 'WORKSPACE';

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  source: 'USER' | 'SYSTEM' | 'INFERENCE';
  createdAt: number;
  updatedAt: number;
  importance: number; // 1-10
  tags: string[];
  projectId?: string | null;
  pinned: boolean;
  metadata?: Record<string, any>;
}

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' | 'PLANNED';

export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  associatedMemories: string[]; // Memory IDs
}

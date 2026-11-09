import { MemoryEntry, ProjectContext, MemoryCategory } from './MemoryTypes';

class MemoryService {
  private baseUrl = '/api/memory';

  async getMemories(projectId?: string): Promise<MemoryEntry[]> {
    const url = projectId ? `${this.baseUrl}?projectId=${encodeURIComponent(projectId)}` : this.baseUrl;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  }

  async createMemory(data: Partial<MemoryEntry>): Promise<MemoryEntry> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  }

  async updateMemory(id: string, data: Partial<MemoryEntry>): Promise<MemoryEntry> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  }

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  }

  async searchMemories(query: string, projectId?: string): Promise<MemoryEntry[]> {
    let url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    if (projectId) url += `&projectId=${encodeURIComponent(projectId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to search memories');
    return res.json();
  }

  async pinMemory(id: string): Promise<MemoryEntry> {
    return this.updateMemory(id, { pinned: true });
  }

  async unpinMemory(id: string): Promise<MemoryEntry> {
    return this.updateMemory(id, { pinned: false });
  }

  // Projects
  async getProjects(): Promise<ProjectContext[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  }

  async createProject(data: Partial<ProjectContext>): Promise<ProjectContext> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  }

  async updateProject(id: string, data: Partial<ProjectContext>): Promise<ProjectContext> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  }

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete project');
  }
}

export const memoryService = new MemoryService();

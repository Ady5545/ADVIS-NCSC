const fs = require('fs');

const fileContent = `
import React, { useState, useEffect } from 'react';
import { memoryService } from './MemoryService';
import { MemoryEntry, ProjectContext } from './MemoryTypes';
import { Search, Pin, Trash, Edit2, Check, X, Brain } from 'lucide-react';

export function MemoryManager({ activeProjectId, onProjectSwitch }: { activeProjectId: string | null, onProjectSwitch: (id: string | null) => void }) {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [newMemContent, setNewMemContent] = useState('');
  const [newProjName, setNewProjName] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const projs = await memoryService.getProjects();
      setProjects(projs);
      
      let mems;
      if (searchQuery.trim() && (memoryService as any).searchMemories) {
         mems = await (memoryService as any).searchMemories(searchQuery, activeProjectId || undefined);
      } else {
         mems = await memoryService.getMemories(activeProjectId || undefined);
      }
      
      setMemories(mems.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh periodically since background tasks might add memories
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [activeProjectId, searchQuery]);

  const handleAddMemory = async () => {
    if (!newMemContent.trim()) return;
    await memoryService.createMemory({
      content: newMemContent,
      projectId: activeProjectId || undefined,
      category: 'PERSONAL',
      source: 'USER',
      importance: 5,
      pinned: false
    });
    setNewMemContent('');
    loadData();
  };

  const handleAddProject = async () => {
    if (!newProjName.trim()) return;
    await memoryService.createProject({
      name: newProjName,
      description: 'Auto-created project',
    });
    setNewProjName('');
    loadData();
  };
  
  const handleDeleteMemory = async (id: string) => {
    await memoryService.deleteMemory(id);
    loadData();
  };
  
  const handleTogglePin = async (mem: MemoryEntry) => {
    await memoryService.updateMemory(mem.id, { pinned: !mem.pinned });
    loadData();
  };
  
  const startEditing = (mem: MemoryEntry) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
  };
  
  const saveEdit = async () => {
    if (editingId && editContent.trim()) {
      await memoryService.updateMemory(editingId, { content: editContent });
      setEditingId(null);
      loadData();
    }
  };

  return (
    <div className="absolute top-16 right-5 w-96 bg-black/80 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md overflow-hidden z-50 flex flex-col font-mono text-[10px] uppercase text-cyan-500 h-[600px]">
      <div className="p-3 border-b border-cyan-500/20 bg-cyan-950/30 flex justify-between items-center">
        <h3 className="tracking-widest flex items-center gap-2"><Brain size={14} /> ADVIS MEMORY CORE</h3>
      </div>
      
      <div className="p-3 border-b border-cyan-500/20 flex flex-col gap-2">
         <div className="flex justify-between items-center text-cyan-300">
             <span>Active Context:</span>
             <select 
               className="bg-black border border-cyan-500/50 p-1 rounded text-cyan-300 outline-none"
               value={activeProjectId || ''}
               onChange={(e) => onProjectSwitch(e.target.value || null)}
             >
               <option value="">GLOBAL MEMORY</option>
               {projects.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
         </div>
         <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="NEW PROJECT..." 
              className="flex-1 bg-black/50 border border-cyan-500/30 p-1 rounded px-2 outline-none text-cyan-100 placeholder:text-cyan-800"
              value={newProjName}
              onChange={e => setNewProjName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddProject()}
            />
            <button onClick={handleAddProject} className="bg-cyan-900/50 hover:bg-cyan-800/80 px-2 rounded border border-cyan-500/50">+</button>
         </div>
      </div>
      
      <div className="p-3 border-b border-cyan-500/20 flex gap-2 items-center">
        <Search size={12} className="text-cyan-700" />
        <input 
            type="text" 
            placeholder="SEARCH MEMORIES..." 
            className="flex-1 bg-transparent outline-none text-cyan-300 placeholder:text-cyan-800"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {loading && memories.length === 0 ? (
           <div className="text-center text-cyan-800 py-4 animate-pulse">ACCESSING DATABANKS...</div>
        ) : memories.length === 0 ? (
           <div className="text-center text-cyan-800 py-4">NO MEMORIES FOUND</div>
        ) : (
          memories.map(m => (
            <div key={m.id} className={"bg-black/40 border " + (m.pinned ? 'border-amber-500/50' : 'border-cyan-900') + " p-2 rounded flex flex-col gap-1 transition-colors hover:border-cyan-500/50 group"}>
              <div className="flex justify-between items-start">
                <span className={"text-[8px] px-1 rounded " + (m.source === 'INFERENCE' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30')}>
                  {m.source === 'INFERENCE' ? 'AUTO' : 'MANUAL'} | {m.category} | IMP: {m.importance}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditing(m)} className="text-cyan-600 hover:text-cyan-300"><Edit2 size={10} /></button>
                  <button onClick={() => handleTogglePin(m)} className={m.pinned ? "text-amber-500" : "text-cyan-600 hover:text-amber-500"}><Pin size={10} /></button>
                  <button onClick={() => handleDeleteMemory(m.id)} className="text-red-900 hover:text-red-500"><Trash size={10} /></button>
                </div>
              </div>
              
              {editingId === m.id ? (
                 <div className="flex gap-1 mt-1">
                    <textarea 
                      className="flex-1 bg-black/60 border border-cyan-500/50 rounded p-1 text-cyan-100 text-[10px] normal-case outline-none resize-none min-h-[40px]"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={saveEdit} className="text-green-500 hover:text-green-300 p-1 bg-green-900/30 rounded border border-green-500/30"><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-300 p-1 bg-red-900/30 rounded border border-red-500/30"><X size={12} /></button>
                    </div>
                 </div>
              ) : (
                <div className="text-cyan-100 normal-case mt-1">{m.content}</div>
              )}
              
              <div className="flex justify-between items-center text-[8px] text-cyan-800 mt-1">
                <span>{new Date(m.createdAt).toLocaleString()}</span>
                {m.metadata?.confidence && <span>CONF: {m.metadata.confidence}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-cyan-500/20 bg-cyan-950/20 flex gap-2">
        <input 
          type="text" 
          placeholder="EXPLICIT MEMORY..." 
          className="flex-1 bg-black/50 border border-cyan-500/30 p-2 rounded px-2 outline-none text-cyan-100 placeholder:text-cyan-800"
          value={newMemContent}
          onChange={e => setNewMemContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddMemory()}
        />
        <button onClick={handleAddMemory} className="bg-cyan-900/50 hover:bg-cyan-800/80 px-3 rounded border border-cyan-500/50">SAVE</button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/MemoryManager.tsx', fileContent, 'utf8');

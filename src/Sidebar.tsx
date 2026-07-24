import React from 'react';
import { Home, BrainCircuit, History, FolderOpen, MonitorSmartphone, Settings2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const menuItems = [
  { id: 'home', icon: Home, label: 'HOME' },
  { id: 'memory', icon: BrainCircuit, label: 'MEMORY CORE' },
  { id: 'history', icon: History, label: 'HISTORY' },
  { id: 'projects', icon: FolderOpen, label: 'PROJECTS' },
  { id: 'devices', icon: MonitorSmartphone, label: 'DEVICES' },
  { id: 'status', icon: Activity, label: 'SYSTEM STATUS' },
  { id: 'settings', icon: Settings2, label: 'SETTINGS' },
];

export function Sidebar({ currentView, setView }: { currentView: string, setView: (id: string) => void }) {
  return (
    <div className="w-64 flex flex-col gap-8 pointer-events-auto shrink-0 z-10">
      <div className="text-2xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-mono">
        A.D.V.I.S.
      </div>

      <div className="flex flex-col gap-2">
        {menuItems.map((item, i) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={i}
              onClick={() => setView(item.id)}
              whileHover={{ x: 5, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group relative overflow-hidden ${
                isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-cyan-500/70 hover:text-cyan-400'
              }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 transition-transform origin-left ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`} />
              <item.icon size={18} />
              <span className="text-xs font-mono tracking-widest">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

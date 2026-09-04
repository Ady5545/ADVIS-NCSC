import React from 'react';
import { Home, Atom, Cpu, GitCompare, PlayCircle, GraduationCap, Hand, Activity, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const menuItems = [
  { id: 'home', icon: Home, label: 'SPATIAL WORKSPACE' },
  { id: 'molecules', icon: Atom, label: 'MOLECULAR LIBRARY' },
  { id: 'engineering', icon: Cpu, label: 'ENGINEERING CATALOG' },
  { id: 'compare', icon: GitCompare, label: 'COMPARATOR' },
  { id: 'demonstration', icon: PlayCircle, label: 'DEMONSTRATIONS' },
  { id: 'lessons', icon: GraduationCap, label: 'INTERACTIVE LESSONS' },
  { id: 'gestures', icon: Hand, label: 'GESTURE CONTROL' },
  { id: 'telemetry', icon: Activity, label: 'SCIENTIFIC TELEMETRY' },
  { id: 'settings', icon: Settings2, label: 'SETTINGS' },
];

export function Sidebar({ currentView, setView }: { currentView: string, setView: (id: string) => void }) {
  return (
    <div className="w-64 flex flex-col gap-6 pointer-events-auto shrink-0 z-10">
      <div className="text-2xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-mono">
        A.D.V.I.S.
      </div>

      <div className="flex flex-col gap-1.5">
        {menuItems.map((item, i) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={i}
              onClick={() => setView(item.id)}
              whileHover={{ x: 5, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg transition-colors group relative overflow-hidden cursor-pointer ${
                isActive ? 'text-cyan-400 bg-cyan-500/10 border-l-2 border-cyan-400' : 'text-cyan-500/70 hover:text-cyan-400'
              }`}
            >
              <item.icon size={17} />
              <span className="text-xs font-mono tracking-widest">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

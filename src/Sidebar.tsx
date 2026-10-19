import React from 'react';
import { Home, Atom, Cpu, GitCompare, PlayCircle, GraduationCap, Hand, Activity, Settings2, Cuboid, Lightbulb, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const menuItems = [
  { id: 'home', icon: Home, label: 'SPATIAL WORKSPACE', section: 'Workspace' },
  { id: 'molecules', icon: Atom, label: 'MOLECULAR LIBRARY', section: 'Explore' },
  { id: 'engineering', icon: Cpu, label: 'ENGINEERING CATALOG', section: 'Explore' },
  { id: 'cad-lab', icon: Cuboid, label: 'CAD REFERENCE LAB', section: 'Explore' },
  { id: 'innovation-lab', icon: Lightbulb, label: 'INNOVATION LAB', section: 'Learn & experiment' },
  { id: 'compare', icon: GitCompare, label: 'COMPARATOR', section: 'Explore' },
  { id: 'demonstration', icon: PlayCircle, label: 'DEMONSTRATIONS', section: 'Learn & experiment' },
  { id: 'lessons', icon: GraduationCap, label: 'INTERACTIVE LESSONS', section: 'Learn & experiment' },
  { id: 'gestures', icon: Hand, label: 'GESTURE CONTROL', section: 'System' },
  { id: 'telemetry', icon: Activity, label: 'SCIENTIFIC TELEMETRY', section: 'System' },
  { id: 'settings', icon: Settings2, label: 'SETTINGS', section: 'System' },
];

export function Sidebar({ currentView, setView, onOpenCommand }: { currentView: string, setView: (id: string) => void, onOpenCommand?: () => void }) {
  return (
    <div className="w-64 flex flex-col gap-6 pointer-events-auto shrink-0 z-10">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setView('home')} aria-label="Return to ADVIS spatial workspace" className="text-left text-2xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-mono focus-visible:outline-offset-4">
          A.D.V.I.S.
        </button>
        {onOpenCommand && (
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="Open ADVIS command search"
            title="Search workspace · Ctrl/Cmd+K"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-black/40 text-cyan-400/70 transition hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <Search size={16} aria-hidden="true" />
          </button>
        )}
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

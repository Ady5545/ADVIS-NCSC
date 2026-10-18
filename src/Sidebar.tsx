import React from 'react';
import {
  Home,
  Atom,
  Cpu,
  GitCompare,
  PlayCircle,
  GraduationCap,
  Hand,
  Activity,
  Settings2,
  Cuboid,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

type NavigationSection = 'Workspace' | 'Explore' | 'Learn & experiment' | 'System';

type NavigationItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  section: NavigationSection;
};

export const menuItems: NavigationItem[] = [
  { id: 'home', icon: Home, label: 'Home', section: 'Workspace' },
  { id: 'molecules', icon: Atom, label: 'Molecules', section: 'Explore' },
  { id: 'engineering', icon: Cpu, label: 'Engineering', section: 'Explore' },
  { id: 'cad-lab', icon: Cuboid, label: 'CAD Reference Lab', section: 'Explore' },
  { id: 'innovation-lab', icon: Lightbulb, label: 'Innovation Lab', section: 'Learn & experiment' },
  { id: 'compare', icon: GitCompare, label: 'Compare', section: 'Explore' },
  { id: 'demonstration', icon: PlayCircle, label: 'Demonstrations', section: 'Learn & experiment' },
  { id: 'lessons', icon: GraduationCap, label: 'Lessons', section: 'Learn & experiment' },
  { id: 'gestures', icon: Hand, label: 'Gesture Control', section: 'System' },
  { id: 'telemetry', icon: Activity, label: 'Telemetry', section: 'System' },
  { id: 'settings', icon: Settings2, label: 'Settings', section: 'System' },
];

const navigationSections: NavigationSection[] = [
  'Workspace',
  'Explore',
  'Learn & experiment',
  'System',
];

export function Sidebar({
  currentView,
  setView,
}: {
  currentView: string;
  setView: (id: string) => void;
}) {
  return (
    <aside className="flex h-full max-h-full w-64 shrink-0 flex-col gap-5 overflow-y-auto pr-1 custom-scrollbar pointer-events-auto">
      <button
        type="button"
        onClick={() => setView('home')}
        aria-label="ADVIS Home"
        className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-offset-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <span className="h-3 w-3 rounded-full border-2 border-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.7)]" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-semibold tracking-[0.16em] text-white">ADVIS</span>
          <span className="mt-0.5 block text-[10px] tracking-wide text-slate-400">Spatial intelligence</span>
        </span>
      </button>

      <nav aria-label="Workspace navigation" className="flex min-h-0 flex-col gap-5 pb-3">
        {navigationSections.map((section) => {
          const items = menuItems.filter((item) => item.section === section);
          if (!items.length) return null;

          return (
            <div key={section} className="advis-nav-section">
              <h2 className="advis-nav-section-label">{section}</h2>
              {items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className="advis-nav-link group"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.16 }}
                  >
                    <Icon size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                    <span className="truncate text-[13px] font-medium tracking-normal">{item.label}</span>
                    {isActive && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

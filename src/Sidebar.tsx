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
import './advisMotion.css';

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
      <motion.button
        type="button"
        onClick={() => setView('home')}
        aria-label="ADVIS Home"
        className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-blue-50/80 focus-visible:outline-offset-4"
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          aria-hidden="true"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_24px_rgba(56,105,189,0.12)]"
          whileHover={{ rotate: 4, scale: 1.04 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute h-7 w-7 rotate-45 rounded-full border border-blue-300/90" />
          <span className="absolute h-5 w-5 -rotate-45 rounded-full border border-indigo-300/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-white via-blue-400 to-blue-700 shadow-[0_0_12px_rgba(40,100,232,0.35)]" />
        </motion.span>
        <span className="min-w-0">
          <span className="block text-lg font-semibold tracking-[0.16em] text-slate-800">ADVIS</span>
          <span className="mt-0.5 block text-[9px] leading-snug tracking-wide text-slate-500">Aadyant's Visual Intelligence System</span>
          <span className="mt-1 block text-[9px] font-semibold tracking-[0.08em] text-rose-600">BY AADYANT BANSAL</span>
        </span>
      </motion.button>

      <nav aria-label="Workspace navigation" className="flex min-h-0 flex-col gap-5 pb-3">
        {navigationSections.map((section) => {
          const items = menuItems.filter((item) => item.section === section);
          if (!items.length) return null;

          return (
            <motion.div
              key={section}
              className="advis-nav-section"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: navigationSections.indexOf(section) * 0.035, ease: [0.22, 1, 0.36, 1] }}
            >
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
                    whileHover={{ x: 4, scale: 1.008 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="advis-active-nav-rail"
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-2 left-0.5 top-2 w-[3px] rounded-full bg-[#e20246] shadow-[0_0_12px_rgba(226,2,70,0.55)]"
                        transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      />
                    )}
                    <motion.span
                      aria-hidden="true"
                      className="relative flex shrink-0 items-center justify-center"
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        x: isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </motion.span>
                    <span className="truncate text-[13px] font-medium tracking-normal">{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="advis-active-nav-dot"
                        aria-hidden="true"
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(40,100,232,0.35)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-slate-200/80 px-3 pt-4 pb-2">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-rose-600">Origin & authorship</div>
        <div className="mt-1 text-[12px] font-semibold text-slate-800">Aadyant Bansal</div>
        <div className="mt-0.5 text-[10px] leading-relaxed text-slate-500">Creator of ADVIS</div>
        <div className="mt-2 text-[9px] leading-relaxed text-slate-500">Aadyant's Visual Intelligence System</div>
      </div>
    </aside>
  );
}

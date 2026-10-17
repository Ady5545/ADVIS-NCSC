import React from 'react';
import {
  Activity, Atom, Cpu, Cuboid, GitCompare, GraduationCap, Hand, Home,
  Lightbulb, Orbit, PlayCircle, Settings2,
} from 'lucide-react';

export const menuItems = [
  { id: 'home', icon: Home, label: 'Workspace' },
  { id: 'molecules', icon: Atom, label: 'Molecular library' },
  { id: 'engineering', icon: Cpu, label: 'Engineering catalog' },
  { id: 'cad-lab', icon: Cuboid, label: 'CAD reference lab' },
  { id: 'innovation-lab', icon: Lightbulb, label: 'Innovation workshop' },
  { id: 'compare', icon: GitCompare, label: 'Compare systems' },
  { id: 'demonstration', icon: PlayCircle, label: 'Demonstrations' },
  { id: 'lessons', icon: GraduationCap, label: 'Learning studio' },
  { id: 'gestures', icon: Hand, label: 'Hand gestures' },
  { id: 'telemetry', icon: Activity, label: 'Live telemetry' },
  { id: 'settings', icon: Settings2, label: 'Preferences' },
];

export function Sidebar({ currentView, setView }: { currentView: string; setView: (id: string) => void }) {
  return (
    <aside className="advis-sidebar" aria-label="ADVIS workspace navigation">
      <div className="advis-brand">
        <div className="advis-brand-mark"><Orbit size={23} strokeWidth={2.2} /></div>
        <div>
          <div className="advis-brand-name">A.D.V.I.S.</div>
          <div className="advis-brand-caption">Spatial intelligence</div>
        </div>
      </div>
      <div className="advis-sidebar-label">Your workspace</div>
      <nav className="advis-sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setView(item.id)}
              className={['advis-nav-item', isActive ? 'is-active' : ''].join(' ')}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="advis-sidebar-footer">
        <div className="advis-footer-title"><span className="advis-footer-dot" /> Spatial core ready</div>
        <div className="advis-footer-copy">3D viewing, scientific exploration and camera gesture input in one workspace.</div>
      </div>
    </aside>
  );
}

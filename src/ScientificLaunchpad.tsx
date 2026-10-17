import React from 'react';
import {
  Activity, Atom, ArrowUpRight, Cpu, GitCompare, GraduationCap, Orbit, Shapes, Sparkles, Wrench,
} from 'lucide-react';
import { SPATIAL_LIBRARY } from './SpatialLibrary';

interface ScientificLaunchpadProps {
  onOpenView: (view: 'molecules' | 'engineering' | 'learning' | 'compare' | 'demonstration') => void;
  onSelectMolecule: (formulaOrKey: string) => void;
  onSelectSpatialObject: (objectId: string) => void;
}

const pathways = [
  { title: 'Engineering systems', description: 'Engines, mechanisms, electronics and assemblies.', view: 'engineering' as const, icon: Wrench },
  { title: 'Molecular structures', description: 'Explore atoms, bonds, geometry and chemistry.', view: 'molecules' as const, icon: Atom },
  { title: 'Learning studio', description: 'Guided, interactive explanations in 3D.', view: 'learning' as const, icon: GraduationCap },
  { title: 'Compare & demonstrate', description: 'Inspect differences, systems and motion.', view: 'compare' as const, icon: GitCompare },
];

const featuredModels = [
  { id: 'v8_engine_scientific', icon: Wrench },
  { id: 'arduino_uno', icon: Cpu },
  { id: 'human_anatomy_scientific', icon: Activity },
  { id: 'solar_system', icon: Orbit },
  { id: 'hydrogen_atom', icon: Atom },
  { id: 'solar_panel', icon: Shapes },
];

export function ScientificLaunchpad({
  onOpenView, onSelectMolecule, onSelectSpatialObject,
}: ScientificLaunchpadProps) {
  const availableModels = featuredModels
    .map((entry) => ({ ...entry, model: SPATIAL_LIBRARY[entry.id] }))
    .filter((entry) => Boolean(entry.model));

  return (
    <section className="advis-home" aria-label="Spatial intelligence workspace">
      <header className="advis-home-hero">
        <div className="advis-home-kicker"><Sparkles size={12} /> The spatial intelligence studio</div>
        <h1 className="advis-home-title">Explore complex systems.<br /><span>See how they work.</span></h1>
        <p className="advis-home-description">
          One interactive workspace for engineering, electronics, molecular science, anatomy, physics and space systems.
          Explore a model, inspect its parts, or learn through guided demonstrations.
        </p>
      </header>

      <div className="advis-home-label-row">Choose a path</div>
      <div className="advis-pathway-grid">
        {pathways.map((pathway) => {
          const Icon = pathway.icon;
          return (
            <button key={pathway.title} type="button" className="advis-pathway-card" onClick={() => onOpenView(pathway.view)}>
              <div className="advis-pathway-icon"><Icon size={18} strokeWidth={1.9} /></div>
              <div className="advis-pathway-title">{pathway.title}</div>
              <div className="advis-pathway-copy">{pathway.description}</div>
            </button>
          );
        })}
      </div>

      <div className="advis-home-label-row" style={{ marginTop: 23 }}>Open a 3D system</div>
      <div className="advis-featured-row">
        {availableModels.map(({ id, icon: Icon, model }) => (
          <button key={id} type="button" className="advis-featured-model" onClick={() => onSelectSpatialObject(id)}>
            <span className="advis-featured-icon"><Icon size={16} /></span>
            <span style={{ display: 'block', minWidth: 0, flex: 1 }}>
              <span className="advis-featured-name" style={{ display: 'block' }}>{model.name}</span>
              <span className="advis-featured-category" style={{ display: 'block' }}>{model.category || 'Scientific model'}</span>
            </span>
            <ArrowUpRight size={14} style={{ color: '#8198bd', flex: '0 0 auto' }} />
          </button>
        ))}
      </div>

      <div className="advis-home-hint">
        Select a system to enter immersive 3D inspection. Camera-based hand input can be enabled from the top bar.
        <button type="button" onClick={() => onSelectMolecule('H2O')} style={{ marginLeft: 7, color: '#9db8ff', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Try a water molecule
        </button>
      </div>
    </section>
  );
}

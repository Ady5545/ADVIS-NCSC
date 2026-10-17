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
  { title: 'Molecular structures', description: 'Explore atoms, bonds and molecular geometry.', view: 'molecules' as const, icon: Atom },
  { title: 'Learning studio', description: 'Understand concepts through guided 3D lessons.', view: 'learning' as const, icon: GraduationCap },
  { title: 'Compare & demonstrate', description: 'Inspect systems, differences and motion.', view: 'compare' as const, icon: GitCompare },
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
    <section className="advis-home" aria-label="ADVIS spatial intelligence home">
      <div className="advis-home-main">
        <header className="advis-home-hero">
          <div className="advis-home-kicker"><Sparkles size={12} /> A.D.V.I.S. / SPATIAL INTELLIGENCE</div>
          <h1 className="advis-home-title">Meet your <span>spatial intelligence.</span></h1>
          <p className="advis-home-description">
            Bring complex systems to life. Explore engineering, electronics, molecular science, anatomy and the universe in an interactive 3D workspace.
          </p>
          <div className="advis-core-statusline">
            <span className="advis-core-statusdot" />
            <span>ADVIS CORE</span>
            <span className="advis-core-status-divider" />
            <span>ONLINE · READY TO EXPLORE</span>
          </div>
        </header>

        <div className="advis-home-label-row">Explore a workspace</div>
        <div className="advis-pathway-grid">
          {pathways.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <button key={pathway.title} type="button" className="advis-pathway-card" onClick={() => onOpenView(pathway.view)}>
                <div className="advis-pathway-icon"><Icon size={18} strokeWidth={1.9} /></div>
                <div className="advis-pathway-title">{pathway.title}</div>
                <div className="advis-pathway-copy">{pathway.description}</div>
                <ArrowUpRight className="advis-pathway-arrow" size={14} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div className="advis-home-label-row advis-home-model-label">Jump into a 3D system</div>
        <div className="advis-featured-row">
          {availableModels.map(({ id, icon: Icon, model }) => (
            <button key={id} type="button" className="advis-featured-model" onClick={() => onSelectSpatialObject(id)}>
              <span className="advis-featured-icon"><Icon size={16} /></span>
              <span className="advis-featured-model-copy">
                <span className="advis-featured-name">{model.name}</span>
                <span className="advis-featured-category">{model.category || 'Scientific model'}</span>
              </span>
              <ArrowUpRight className="advis-featured-arrow" size={14} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="advis-home-hint">
          Select any system to enter immersive 3D inspection.
          <button type="button" onClick={() => onSelectMolecule('H2O')}>Try a water molecule <ArrowUpRight size={12} /></button>
        </div>
      </div>

      <aside className="advis-core-presence" aria-label="ADVIS Core status">
        <div className="advis-core-label">
          <span className="advis-core-label-dot" />
          <span>CORE SYSTEM / 01</span>
        </div>
        <div className="advis-core-caption">
          <div className="advis-core-caption-title">ADVIS CORE</div>
          <div className="advis-core-caption-subtitle">Spatial intelligence engine</div>
        </div>
        <div className="advis-core-readout">
          <span>NEURAL FIELD</span>
          <span className="advis-core-readout-line" />
          <span>ACTIVE</span>
        </div>
      </aside>
    </section>
  );
}

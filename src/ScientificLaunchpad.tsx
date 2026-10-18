import React from 'react';
import {
  Atom,
  ArrowRight,
  Cpu,
  GitCompare,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { CHEMISTRY_DATABASE } from './LearnEngine/ChemistryDatabase';

interface ScientificLaunchpadProps {
  onOpenView: (view: 'molecules' | 'engineering' | 'lessons' | 'compare' | 'demonstration') => void;
  onSelectMolecule: (formulaOrKey: string) => void;
  onSelectSpatialObject: (objectId: string) => void;
}

const destinations = [
  {
    id: 'engineering',
    title: 'Explore systems',
    category: 'ENGINEERING',
    description: 'Inspect mechanisms, assemblies and motion.',
    icon: Cpu,
    view: 'engineering',
  },
  {
    id: 'molecules',
    title: 'Molecular library',
    category: 'CHEMISTRY',
    description: 'Explore molecular structure and geometry.',
    icon: Atom,
    view: 'molecules',
  },
  {
    id: 'learning',
    title: 'Learning Studio',
    category: 'GUIDED LEARNING',
    description: 'Build understanding step by step.',
    icon: GraduationCap,
    view: 'lessons',
  },
  {
    id: 'compare',
    title: 'Compare systems',
    category: 'ANALYSIS',
    description: 'Place concepts side by side.',
    icon: GitCompare,
    view: 'compare',
  },
  {
    id: 'demonstration',
    title: 'Demonstrations',
    category: 'INTERACTIVE',
    description: 'Follow a process through motion.',
    icon: PlayCircle,
    view: 'demonstration',
  },
] as const;

const directStartDefinitions = [
  { label: 'Four-stroke engine', id: 'v8_engine_scientific', type: 'spatial' },
  { label: 'Human anatomy', id: 'human_anatomy_scientific', type: 'spatial' },
  { label: 'V12 engine', id: 'v12_engine', type: 'spatial' },
  { label: 'Servo motor', id: 'servo_motor', type: 'spatial' },
  { label: 'Solar tracker', id: 'heliomotion', type: 'spatial' },
  { label: 'Water · H₂O', id: 'H2O', type: 'molecule' },
  { label: 'Carbon dioxide · CO₂', id: 'CO2', type: 'molecule' },
  { label: 'Methane · CH₄', id: 'CH4', type: 'molecule' },
] as const;

const directStarts = directStartDefinitions.filter((item) => {
  if (item.type === 'molecule') {
    return Object.values(CHEMISTRY_DATABASE).some(
      (entity) => entity.formula.toLowerCase() === item.id.toLowerCase(),
    );
  }

  const object = SPATIAL_LIBRARY[item.id];
  return Boolean(
    object &&
      object.modelStatus !== 'UNAVAILABLE' &&
      object.modelStatus !== 'AWAITING_ASSET',
  );
});

export function ScientificLaunchpad({
  onOpenView,
  onSelectMolecule,
  onSelectSpatialObject,
}: ScientificLaunchpadProps) {
  return (
    <section
      aria-label="ADVIS home workspace"
      className="pointer-events-auto mx-auto flex w-full max-w-5xl select-none flex-col gap-4 px-3 py-2 sm:gap-5 sm:px-5"
    >
      <header className="flex flex-col gap-2 text-center sm:gap-2.5">
        <div className="advis-eyebrow flex items-center justify-center gap-2">
          <Sparkles size={13} aria-hidden="true" />
          <span>ADVIS · Spatial intelligence</span>
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(2,6,23,0.9)] sm:text-3xl lg:text-[2.15rem]">
          One Core. Every scientific world.
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-300 drop-shadow-[0_2px_12px_rgba(2,6,23,0.9)] sm:text-[15px]">
          Move from a question to a living model, then explore the science behind it—all in one ADVIS workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onOpenView(destination.view)}
              aria-label={destination.title}
              className="group flex min-h-[118px] flex-col rounded-2xl border border-sky-200/15 bg-slate-950/70 p-3.5 text-left shadow-[0_12px_35px_rgba(0,0,0,0.16)] backdrop-blur-lg transition-[background,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-slate-900/90 focus-visible:outline-offset-4 sm:min-h-[132px] sm:p-4"
            >
              <span className="mb-3 flex w-full items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-300/[0.08] text-cyan-200 transition-colors group-hover:border-cyan-200/40 group-hover:bg-cyan-300/[0.14]">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="advis-eyebrow text-[9px] tracking-[0.1em]">{destination.category}</span>
              </span>

              <span className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-50 sm:text-sm">
                <span>{destination.title}</span>
                <ArrowRight size={14} className="shrink-0 text-cyan-200/60 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-100" aria-hidden="true" />
              </span>
              <span className="mt-1.5 text-xs leading-5 text-slate-400">{destination.description}</span>
            </button>
          );
        })}
      </div>

      {directStarts.length > 0 && (
        <div className="advis-surface rounded-2xl px-3.5 py-3 sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Quick starts</h2>
              <p className="mt-0.5 text-xs text-slate-400">Jump into an available model or molecule.</p>
            </div>
            <span className="advis-eyebrow text-[9px]">From the current library</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {directStarts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.type === 'molecule') onSelectMolecule(item.id);
                  else onSelectSpatialObject(item.id);
                }}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-sky-200/15 bg-slate-950/65 px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:border-cyan-200/40 hover:bg-cyan-300/[0.08] hover:text-white focus-visible:outline-offset-2"
              >
                {item.type === 'molecule' ? (
                  <Atom size={13} className="shrink-0 text-cyan-200" aria-hidden="true" />
                ) : (
                  <Cpu size={13} className="shrink-0 text-blue-200" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 drop-shadow-[0_2px_10px_rgba(2,6,23,0.9)]">
        Choose a starting point, or ask ADVIS using the command dock below.
      </p>
    </section>
  );
}

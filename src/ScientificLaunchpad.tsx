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
      className="pointer-events-auto custom-scrollbar mx-auto flex max-h-[calc(100dvh-14rem)] w-full max-w-6xl flex-col gap-3 overflow-y-auto px-2.5 py-1.5 sm:max-h-[calc(100dvh-13rem)] sm:gap-4 sm:px-4 xl:max-h-none xl:overflow-visible scale-[0.9] sm:scale-[0.85] lg:scale-[0.7] origin-center"
    >
      <header className="flex flex-col gap-2 text-center sm:gap-2.5">
        <div className="advis-eyebrow flex items-center justify-center gap-2">
          <Sparkles size={13} aria-hidden="true" />
          <span>ADVIS · Spatial intelligence</span>
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-[#172b4d] sm:text-3xl lg:text-[2.15rem]">
          One Core. Every scientific world.
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
          Move from a question to a living model, then explore the science behind it—all in one ADVIS workspace.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 xl:grid-cols-5">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onOpenView(destination.view)}
              aria-label={destination.title}
              className="group flex min-h-[92px] flex-col rounded-xl border border-slate-300/90 bg-white/96 p-2.5 text-left shadow-[0_10px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-[background,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-[0_16px_32px_rgba(0,0,0,0.42)] focus-visible:outline-offset-4 sm:min-h-[98px] sm:p-3"
            >
              <span className="mb-1.5 flex w-full items-center justify-between gap-1 sm:mb-2 sm:gap-1.5">
                <span className="advis-icon-surface h-7 w-7 transition-transform group-hover:scale-[1.04] sm:h-8 sm:w-8">
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="advis-eyebrow text-[8px] tracking-[0.08em]">{destination.category}</span>
              </span>

              <span className="flex items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-800 sm:text-xs">
                <span>{destination.title}</span>
                <ArrowRight size={12} className="shrink-0 text-blue-400/80 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
              </span>
              <span className="mt-0.5 text-[9px] leading-3.5 text-slate-500 sm:mt-1 sm:text-[10px] sm:leading-4">{destination.description}</span>
            </button>
          );
        })}
      </div>

      {directStarts.length > 0 && (
        <div className="rounded-xl border border-slate-300/90 bg-white/96 px-2.5 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:px-3 sm:py-2.5">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <div>
              <h2 className="text-xs font-semibold text-slate-800">Quick starts</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">Jump directly into an available model or molecule.</p>
            </div>
            <span className="advis-eyebrow text-[8px]">From the current library</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {directStarts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.type === 'molecule') onSelectMolecule(item.id);
                  else onSelectSpatialObject(item.id);
                }}
                className="inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-left text-[10px] font-medium text-slate-800 transition-[color,border-color,background-color,box-shadow] hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-800 hover:shadow-sm focus-visible:outline-offset-2"
              >
                {item.type === 'molecule' ? (
                  <Atom size={11} className="shrink-0 text-blue-600" aria-hidden="true" />
                ) : (
                  <Cpu size={11} className="shrink-0 text-indigo-600" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-500">
        Choose a starting point, or ask ADVIS using the command dock below.
      </p>
    </section>
  );
}

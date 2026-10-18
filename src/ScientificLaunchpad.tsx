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
      className="pointer-events-auto custom-scrollbar mx-auto flex max-h-[calc(100dvh-14rem)] w-full max-w-6xl flex-col gap-4 overflow-y-auto px-3 py-2 sm:max-h-[calc(100dvh-13rem)] sm:gap-5 sm:px-5 xl:max-h-none xl:overflow-visible"
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

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-5">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onOpenView(destination.view)}
              aria-label={destination.title}
              className="group flex min-h-[126px] flex-col rounded-2xl border border-slate-300/90 bg-white/96 p-3 text-left shadow-[0_14px_34px_rgba(45,75,126,0.13)] backdrop-blur-xl transition-[background,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-[0_22px_48px_rgba(45,75,126,0.2)] focus-visible:outline-offset-4 sm:min-h-[132px] sm:p-4"
            >
              <span className="mb-2 flex w-full items-center justify-between gap-1.5 sm:mb-3 sm:gap-2">
                <span className="advis-icon-surface h-10 w-10 transition-transform group-hover:scale-[1.04]">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="advis-eyebrow text-[9px] tracking-[0.1em]">{destination.category}</span>
              </span>

              <span className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-800 sm:text-sm">
                <span>{destination.title}</span>
                <ArrowRight size={14} className="shrink-0 text-blue-400/80 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
              </span>
              <span className="mt-1 text-[11px] leading-4 text-slate-500 sm:mt-1.5 sm:text-xs sm:leading-5">{destination.description}</span>
            </button>
          );
        })}
      </div>

      {directStarts.length > 0 && (
        <div className="rounded-2xl border border-slate-300/90 bg-white/96 px-3.5 py-3 shadow-[0_14px_38px_rgba(45,75,126,0.13)] backdrop-blur-xl sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Quick starts</h2>
              <p className="mt-0.5 text-xs text-slate-500">Jump directly into an available model or molecule.</p>
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
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 transition-[color,border-color,background-color,box-shadow] hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-800 hover:shadow-sm focus-visible:outline-offset-2"
              >
                {item.type === 'molecule' ? (
                  <Atom size={13} className="shrink-0 text-blue-600" aria-hidden="true" />
                ) : (
                  <Cpu size={13} className="shrink-0 text-indigo-600" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        Choose a starting point, or ask ADVIS using the command dock below.
      </p>
    </section>
  );
}

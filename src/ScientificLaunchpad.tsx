import React, { useEffect, useState } from 'react';
import {
  Atom,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  GitCompare,
  GraduationCap,
  PlayCircle,
  Sparkles,
  X,
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
  const [isExpanded, setIsExpanded] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  const [showQuickStarts, setShowQuickStarts] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const syncToViewport = () => setIsExpanded(desktopQuery.matches);
    desktopQuery.addEventListener('change', syncToViewport);
    return () => desktopQuery.removeEventListener('change', syncToViewport);
  }, []);

  if (!isExpanded) {
    return (
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label="Open ADVIS explorer"
          aria-expanded={false}
          className="flex items-center gap-2.5 rounded-full border border-white/12 bg-[#101014]/92 px-4 py-3 text-left text-sm font-semibold text-[#f3f3f5] shadow-[0_10px_30px_rgba(0,0,0,0.58)] backdrop-blur-2xl transition hover:border-[#e20246]/60 hover:bg-[#171116] focus-visible:outline-offset-4"
        >
          <span className="advis-icon-surface h-8 w-8 shrink-0"><Sparkles size={15} aria-hidden="true" /></span>
          <span>Explore ADVIS</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-400">5 spaces</span>
          <ArrowRight size={15} className="text-rose-500" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="ADVIS home workspace"
      className="pointer-events-auto custom-scrollbar flex w-[min(25rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-6.5rem)] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/12 bg-[#0c0c10]/92 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:w-[min(25rem,34vw)] sm:gap-3.5 sm:p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="advis-eyebrow mb-1.5 flex items-center gap-2">
            <Sparkles size={12} aria-hidden="true" />
            <span>ADVIS · Spatial intelligence</span>
          </div>
          <h1 className="text-balance text-lg font-semibold tracking-tight text-[#f3f3f5] sm:text-xl">
            One Core. Every scientific world.
          </h1>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Pick a destination; the Core stays in view.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse explorer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-[#e20246]/70 hover:bg-[#e20246]/10 hover:text-white focus-visible:outline-offset-2"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onOpenView(destination.view)}
              aria-label={destination.title}
              className="group flex min-h-[58px] items-center gap-3 rounded-2xl border border-white/10 bg-[#17171c]/84 px-2.5 py-2 text-left shadow-[0_5px_16px_rgba(0,0,0,0.28)] transition-[background,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#e20246]/55 hover:bg-[#211116]/95 hover:shadow-[0_9px_24px_rgba(0,0,0,0.38)] focus-visible:outline-offset-2 sm:px-3"
            >
              <span className="advis-icon-surface flex h-9 w-9 shrink-0 items-center justify-center transition-transform group-hover:scale-[1.04]">
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-slate-100">{destination.title}</span>
                  <ArrowRight size={13} className="shrink-0 text-rose-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" aria-hidden="true" />
                </span>
                <span className="mt-0.5 block text-[10px] leading-4 text-slate-400 sm:text-[11px]">{destination.description}</span>
              </span>
              <span className="hidden shrink-0 text-[8px] font-semibold tracking-[0.1em] text-slate-400 2xl:block">{destination.category}</span>
            </button>
          );
        })}
      </div>

      {directStarts.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#121216]/80 p-2.5">
          <button
            type="button"
            aria-expanded={showQuickStarts}
            aria-controls="advis-quick-starts"
            onClick={() => setShowQuickStarts((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-xs font-semibold text-slate-100 transition hover:text-rose-300 focus-visible:outline-offset-2"
          >
            <span>Quick starts</span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-normal text-slate-400">Models & molecules</span>
              {showQuickStarts ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </span>
          </button>

          {showQuickStarts && (
            <div id="advis-quick-starts" className="mt-2 flex flex-wrap gap-1.5">
              {directStarts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.type === 'molecule') onSelectMolecule(item.id);
                    else onSelectSpatialObject(item.id);
                  }}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/12 bg-[#1b1b21] px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-100 transition-[color,border-color,background-color,box-shadow] hover:border-[#e20246]/55 hover:bg-[#2a1119] hover:text-rose-100 hover:shadow-sm focus-visible:outline-offset-2"
                >
                  {item.type === 'molecule' ? (
                    <Atom size={12} className="shrink-0 text-blue-600" aria-hidden="true" />
                  ) : (
                    <Cpu size={12} className="shrink-0 text-indigo-600" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[10px] leading-4 text-slate-400">
        You can also ask ADVIS using the command dock below.
      </p>
    </section>
  );
}

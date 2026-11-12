import React from 'react';
import { AlertTriangle, CheckCircle2, Info, LoaderCircle } from 'lucide-react';

/**
 * Chemistry-only design tokens shared by the guided lesson and molecular builder.
 * These intentionally preserve the existing light, blue-accent ADVIS chemistry HUD
 * rather than importing the engineering workstation's spatial-control language.
 */
export const CHEMISTRY_UI = {
  panel: 'rounded-xl border border-blue-200/60 bg-white/85 text-slate-800 backdrop-blur-md shadow-[0_0_24px_rgba(37,99,235,0.08)]',
  panelHeader: 'flex items-center justify-between border-b border-blue-200/60 pb-3',
  eyebrow: 'font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700',
  label: 'font-mono text-[9px] uppercase tracking-wider text-slate-500',
  value: 'font-mono text-blue-800',
  body: 'font-sans text-xs leading-relaxed text-slate-700',
  control: 'rounded-lg border border-blue-200/70 bg-white/80 text-blue-800 transition-colors hover:border-blue-300 hover:bg-blue-50/70 disabled:opacity-40',
  divider: 'border-blue-200/60'
} as const;

export type ChemistryStatus = 'READY' | 'LOADING' | 'ERROR' | 'INFO';

const STATUS_PRESENTATION: Record<ChemistryStatus, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  READY: {
    label: 'READY',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2
  },
  LOADING: {
    label: 'LOADING',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    Icon: LoaderCircle
  },
  ERROR: {
    label: 'NEEDS ATTENTION',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    Icon: AlertTriangle
  },
  INFO: {
    label: 'INFO',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    Icon: Info
  }
};

export function ChemistryStatusPill({ status, label }: { status: ChemistryStatus; label?: string }) {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation.Icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] font-semibold tracking-wider ${presentation.className}`}>
      <Icon className={`h-3 w-3 ${status === 'LOADING' ? 'animate-spin' : ''}`} />
      {label || presentation.label}
    </span>
  );
}

/** Render standard molecular formula digits as Unicode subscripts. */
export function formatMolecularFormula(formula: string): string {
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };

  return formula.replace(/[0-9]+/g, match => match.split('').map(char => subscripts[char] || char).join(''));
}

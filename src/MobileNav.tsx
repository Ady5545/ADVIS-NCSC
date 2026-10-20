import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { menuItems } from './Sidebar';

const primaryDestinationIds = new Set(['home', 'engineering', 'molecules', 'lessons']);

export function MobileNav({
  currentView,
  setView,
}: {
  currentView: string;
  setView: (id: string) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = menuItems.filter((item) =>
    ['engineering', 'molecules', 'lessons'].includes(item.id)
  );
  const secondaryItems = menuItems.filter((item) => !primaryDestinationIds.has(item.id));

  const navigateTo = (id: string) => {
    setView(id);
    setMoreOpen(false);
  };

  return (
    <nav
      aria-label="Mobile primary navigation"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMoreOpen(false);
      }}
      className="lg:hidden absolute left-0 right-0 top-0 z-30 px-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] pointer-events-auto"
    >
      <div className="advis-surface flex w-full items-center gap-1.5 rounded-2xl p-1.5">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          aria-label="Home"
          aria-current={currentView === 'home' ? 'page' : undefined}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            currentView === 'home'
              ? 'bg-blue-50 text-blue-800'
              : 'text-slate-700 hover:bg-blue-50/80'
          }`}
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-2 border-blue-600 shadow-[0_0_10px_rgba(40,100,232,0.28)]" />
          <span className="text-[11px] font-semibold tracking-[0.12em]">ADVIS</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const visibleLabel = item.id === 'lessons' ? 'Learn' : item.label;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-9 min-w-0 shrink items-center justify-center gap-1 rounded-xl px-1.5 text-[10px] font-medium transition-colors sm:px-2 ${
                  isActive
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-blue-50/80 hover:text-blue-800'
                }`}
              >
                <Icon size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{visibleLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-label="More destinations"
            aria-expanded={moreOpen}
            aria-controls="advis-mobile-more-menu"
            className={`flex h-9 shrink-0 items-center gap-0.5 rounded-xl px-2 text-[10px] font-semibold transition-colors ${
              moreOpen ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-blue-50/80'
            }`}
          >
            {moreOpen ? <X size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            <span>More</span>
          </button>
        </div>
      </div>

      {moreOpen && (
        <div
          id="advis-mobile-more-menu"
          aria-label="More ADVIS destinations"
          className="advis-mobile-more-menu mt-2 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-1.5 overflow-y-auto p-2 custom-scrollbar"
        >
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-transparent text-slate-700 hover:border-blue-100 hover:bg-blue-50/80'
                }`}
              >
                <Icon size={16} aria-hidden="true" className="shrink-0 text-blue-600" />
                <span className="min-w-0 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}

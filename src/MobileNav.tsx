import React from 'react';
import { Search } from 'lucide-react';
import { menuItems } from './Sidebar';

export function MobileNav({ currentView, setView, onOpenCommand }: { currentView: string, setView: (id: string) => void, onOpenCommand?: () => void }) {
  return (
    <div className="lg:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => setView('home')} aria-label="Return to ADVIS spatial workspace" className="text-xl font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-mono">
          A.D.V.I.S.
        </button>
        {onOpenCommand && (
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="Open ADVIS command search"
            title="Search workspace · Ctrl/Cmd+K"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-black/40 text-cyan-400/80 transition hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <Search size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pl-4">
        {menuItems.filter(item => item.id !== 'home').map((item, i) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={i}
              onClick={() => setView(item.id)}
              className={`p-2 rounded-lg transition-colors border ${
                isActive ? 'text-cyan-400 bg-cyan-500/20 border-cyan-400/50' : 'text-cyan-500/70 border-cyan-500/10 bg-black/40 hover:text-cyan-400'
              }`}
            >
              <item.icon size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

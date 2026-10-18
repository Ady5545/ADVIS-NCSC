import React from 'react';
import { motion } from 'framer-motion';
import { menuItems } from './Sidebar';

export function MobileNav({ currentView, setView }: { currentView: string, setView: (id: string) => void }) {
  return (
    <div className="lg:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
      <div className="text-xl font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-mono shrink-0">
        A.D.V.I.S.
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

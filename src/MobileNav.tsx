import React from 'react';
import { Orbit } from 'lucide-react';
import { menuItems } from './Sidebar';

export function MobileNav({ currentView, setView }: { currentView: string; setView: (id: string) => void }) {
  return (
    <nav className="advis-mobile-nav lg:hidden" aria-label="Mobile workspace navigation">
      <button
        type="button"
        className={['advis-mobile-brand', currentView === 'home' ? 'is-active' : ''].join(' ')}
        aria-label="Open workspace overview"
        aria-current={currentView === 'home' ? 'page' : undefined}
        title="Workspace overview"
        onClick={() => setView('home')}
      >
        <span className="advis-mobile-mark"><Orbit size={17} /></span>
        <span>ADVIS</span>
      </button>
      <div className="advis-mobile-items">
        {menuItems.filter((item) => item.id !== 'home').map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setView(item.id)}
              className={['advis-mobile-item', isActive ? 'is-active' : ''].join(' ')}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

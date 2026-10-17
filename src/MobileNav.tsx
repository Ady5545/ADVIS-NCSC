import React from 'react';
import { Orbit } from 'lucide-react';
import { menuItems } from './Sidebar';

export function MobileNav({ currentView, setView }: { currentView: string; setView: (id: string) => void }) {
  return (
    <nav className="advis-mobile-nav lg:hidden" aria-label="Mobile workspace navigation">
      <div className="advis-mobile-brand">
        <span className="advis-mobile-mark"><Orbit size={17} /></span>
        <span>ADVIS</span>
      </div>
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

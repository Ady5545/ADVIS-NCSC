import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

# Make top-right responsive
content = content.replace(
    '<div className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[280px] md:max-w-[320px] animate-fade-in">',
    '''
      {/* Mobile Menu Toggle */}
      <div className="absolute top-4 right-4 md:hidden pointer-events-auto z-50">
        <button onClick={() => setShowControlsOnMobile(!showControlsOnMobile)} className="bg-slate-900/80 p-2 rounded border border-cyan-500/40 text-cyan-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      <div className={`absolute top-16 right-4 md:top-6 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[280px] md:max-w-[320px] animate-fade-in transition-all z-40 ${showControlsOnMobile ? 'block' : 'hidden md:flex'}`}>'''
)

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


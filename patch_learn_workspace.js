const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LearnWorkspace.tsx', 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningSession, LearnStep } from './LearnTypes';
import { ChevronRight, ChevronLeft, RotateCcw, Target, Cpu, Activity, Database, Crosshair, Hexagon, Zap, Layers, Network } from 'lucide-react';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';`;

code = code.replace(/import React[\s\S]*?from 'lucide-react';/, imports);

const newHUD = `      {/* LEFT: Step Information */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-auto flex items-center gap-6">
        <div className="flex flex-col gap-1 items-center justify-center w-1">
           {session.steps.map((_, idx) => (
             <div 
               key={idx}
               className={\`w-1 transition-all duration-300 \${idx === session.currentStepIndex ? 'h-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'h-2 bg-cyan-900/50'}\`}
             />
           ))}
        </div>
        <div className="flex flex-col bg-slate-950/70 backdrop-blur-md border-l-2 border-cyan-500/50 pl-4 py-3 rounded-r-lg shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <div className="text-[10px] tracking-[0.3em] text-cyan-500/80 mb-1 uppercase">
            CURRENT STEP
          </div>
          <div className="text-lg font-bold tracking-widest text-cyan-200 uppercase w-48 break-words leading-tight">
            {currentStep.title}
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT: Live Chemical Event Readout */}
      <div className="absolute bottom-24 left-6 pointer-events-auto flex flex-col bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg w-72 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
         <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-2">
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <div className="text-[10px] tracking-[0.2em] text-amber-400 font-bold uppercase">Live Event Readout</div>
         </div>
         <div className="text-[10px] tracking-[0.2em] text-cyan-500/80 mb-1 uppercase">CURRENT EVENT</div>
         <div className="text-sm font-bold text-cyan-300 uppercase mb-3 border-l-2 border-cyan-400 pl-2">
            {currentStep.title.replace(/^\\d+\\s*—\\s*/, '')}
         </div>
         <div className="text-[10px] tracking-[0.2em] text-cyan-500/80 mb-1 uppercase">ANALYSIS</div>
         <div className="text-xs text-cyan-100/90 font-sans font-light leading-relaxed border-l-2 border-amber-400/50 pl-2">
            {currentStep.explanation}
         </div>
      </div>

      {/* RIGHT: AI Analysis Module (Why?) */}
      <div className="absolute right-6 top-[20%] pointer-events-auto flex flex-col w-80">
        <div className="bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 p-5 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.05)]">          
          <div className="flex items-center gap-2 mb-4 border-b border-cyan-500/20 pb-3">
             <Activity size={14} className="text-cyan-400 animate-pulse" />
             <div className="text-[10px] tracking-[0.2em] text-cyan-400 font-bold uppercase">SCIENTIFIC REASONING</div>
          </div>
          {currentStep.reasoning && (
            <div className="bg-cyan-950/30 border border-cyan-500/20 p-4 rounded relative">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-amber-400/80 rounded-l"></div>
              <div className="text-[9px] uppercase text-amber-400/80 font-bold mb-2 tracking-[0.2em]">WHY THIS HAPPENS</div>
              <div className="text-xs text-amber-100/90 font-sans font-light leading-relaxed whitespace-pre-wrap">
                {currentStep.reasoning}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM RIGHT: Molecular Analysis Panel */}
      <div className="absolute right-6 bottom-24 pointer-events-auto w-80">
         <MolecularAnalysisPanel entityName={session.context.entity} currentPhase={currentStep.visualStateId} />
      </div>`;

code = code.replace(/\{\/\* LEFT: Step Information \*\/\}[\s\S]*?\{\/\* BOTTOM: Controls \*\/\}/, newHUD + '\n\n      {/* BOTTOM: Controls */}');

const panelComponent = `
function MolecularAnalysisPanel({ entityName, currentPhase }: { entityName: string, currentPhase: string }) {
  const entity = Object.keys(CHEMISTRY_DATABASE).find(k => k.toLowerCase() === entityName.toLowerCase());
  const data = entity ? CHEMISTRY_DATABASE[entity] : null;

  if (!data) return null;

  const bondCount = data.ligands?.reduce((acc, l) => acc + l.count, 0) || 0;
  const domains = bondCount + (data.lonePairs || 0);

  // Dynamic Highlighting Logic
  const hl = (keyword: string) => {
    if (currentPhase.includes('valence') && keyword === 'valence') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('hybrid') && keyword === 'hybridization') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('bond') && keyword === 'bonds') return 'text-amber-400 bg-amber-900/30 font-bold';
    if (currentPhase.includes('summary') && keyword === 'geometry') return 'text-amber-400 bg-amber-900/30 font-bold';
    return 'text-cyan-100';
  };

  const getAngle = () => {
    if (data.geometry === 'Bent') return '104.5°';
    if (data.geometry === 'Linear') return '180°';
    if (data.geometry === 'Tetrahedral') return '109.5°';
    if (data.geometry === 'Trigonal Planar') return '120°';
    if (data.geometry === 'Trigonal Pyramidal') return '107°';
    return 'N/A';
  };

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.05)] font-mono text-[11px]">
      <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-2">
         <Hexagon size={14} className="text-cyan-400" />
         <div className="tracking-[0.2em] text-cyan-400 font-bold uppercase">Molecular Analysis</div>
      </div>
      <div className="grid grid-cols-2 gap-y-2">
        <div className="text-cyan-500/70">Formula</div>
        <div className="text-cyan-100">{data.formula}</div>
        
        {data.centralAtom && (
           <>
            <div className="text-cyan-500/70">Central Atom</div>
            <div className="text-cyan-100">{data.centralAtom}</div>
           </>
        )}

        <div className="text-cyan-500/70">Valence e⁻</div>
        <div className={\`transition-colors duration-300 px-1 -mx-1 rounded \${hl('valence')}\`}>{data.valenceElectrons}</div>

        <div className="text-cyan-500/70">Bonding Pairs</div>
        <div className={\`transition-colors duration-300 px-1 -mx-1 rounded \${hl('bonds')}\`}>{bondCount}</div>

        {data.lonePairs !== undefined && (
          <>
            <div className="text-cyan-500/70">Lone Pairs</div>
            <div className="text-cyan-100">{data.lonePairs}</div>
          </>
        )}

        <div className="text-cyan-500/70">Domains</div>
        <div className="text-cyan-100">{domains}</div>

        {data.hybridization && (
          <>
            <div className="text-cyan-500/70 mt-2">Hybridization</div>
            <div className={\`transition-colors duration-300 px-1 -mx-1 rounded mt-2 \${hl('hybridization')}\`}>{data.hybridization}</div>
          </>
        )}

        <div className="text-cyan-500/70">Geometry</div>
        <div className={\`transition-colors duration-300 px-1 -mx-1 rounded \${hl('geometry')}\`}>{data.geometry}</div>

        {data.bondType === 'COVALENT' && (
          <>
            <div className="text-cyan-500/70">Bond Angle</div>
            <div className={\`transition-colors duration-300 px-1 -mx-1 rounded \${hl('geometry')}\`}>{getAngle()}</div>
          </>
        )}

        <div className="text-cyan-500/70">Bond Type</div>
        <div className={\`transition-colors duration-300 px-1 -mx-1 rounded \${hl('bonds')}\`}>{data.bondType}</div>
      </div>
    </div>
  );
}
`;

code = code + '\n' + panelComponent;
fs.writeFileSync('src/LearnEngine/LearnWorkspace.tsx', code, 'utf8');

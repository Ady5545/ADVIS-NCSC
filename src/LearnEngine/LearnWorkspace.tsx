import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningSession, LearnStep } from './LearnTypes';
import { ChevronRight, ChevronLeft, RotateCcw, Target, Cpu, Activity, Database, Crosshair, Hexagon, Zap, Layers, Network } from 'lucide-react';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';
import { ChemistryHUD } from './ChemistryHUD';

interface LearnWorkspaceProps {
  session: LearningSession;
  onClose: () => void;
  onUpdateSession: (updated: LearningSession) => void;
}

export function LearnWorkspace({ session, onClose, onUpdateSession }: LearnWorkspaceProps) {
  const currentStep = session.steps[session.currentStepIndex];
  
  const handleNext = () => {
    if (session.currentStepIndex < session.steps.length - 1) {
      onUpdateSession({ ...session, currentStepIndex: session.currentStepIndex + 1 });
    }
  };

  const handlePrev = () => {
    if (session.currentStepIndex > 0) {
      onUpdateSession({ ...session, currentStepIndex: session.currentStepIndex - 1 });
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-transparent text-cyan-400 font-mono flex flex-col pointer-events-none">
      {/* 
        STARK R&D HUD LAYOUT
        Extremely thin borders, no thick panels, precise typography
      */}

      {/* TOP LEFT: System Identification */}
      <div className="absolute top-6 left-6 pointer-events-auto flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 mt-1">
          <div className="w-8 h-8 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-950/30 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Cpu size={16} className="text-cyan-400" />
          </div>
          <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-2">
            <span className="text-[10px] tracking-[0.3em] text-cyan-300 font-bold">ADVIS // LEARN</span>
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
          </div>
          <div className="text-xs tracking-[0.2em] text-cyan-500/80 mt-2 uppercase">
            CHEMISTRY ANALYSIS
          </div>
        </div>
      </div>

      {/* TOP RIGHT: Session Information */}
      <div className="absolute top-6 right-6 pointer-events-auto flex items-start gap-4 text-right">
        <div className="flex flex-col">
          <div className="flex items-center justify-end gap-3 border-b border-cyan-500/30 pb-2">
            <span className="text-[10px] tracking-[0.3em] text-cyan-300 font-bold uppercase">SESSION // {session.context.entity}</span>
            <Database size={12} className="text-cyan-500/70" />
          </div>
          <div className="text-xs tracking-[0.2em] text-cyan-500/80 mt-2 uppercase">
            {session.context.topic}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-1">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-950/30 backdrop-blur-md hover:bg-cyan-900/50 hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] text-cyan-400 group"
          >
            <Crosshair size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
        </div>
      </div>

            {/* LEFT: Step Information */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-auto flex items-center gap-6">
        <div className="flex flex-col gap-1 items-center justify-center w-1">
           {session.steps.map((_, idx) => (
             <div 
               key={idx}
               className={`w-1 transition-all duration-300 ${idx === session.currentStepIndex ? 'h-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'h-2 bg-cyan-900/50'}`}
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
            {currentStep.title.replace(/^\d+\s*—\s*/, '')}
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
         <ChemistryHUD entityName={session.context.entity || ""} currentPhase={currentStep.visualStateId} />
      </div>

      {/* BOTTOM: Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto flex items-center gap-6 bg-slate-950/60 backdrop-blur-lg border border-cyan-500/30 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        
        <button
          onClick={handlePrev}
          disabled={session.currentStepIndex === 0}
          className="w-10 h-10 rounded-full border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-900/50 hover:border-cyan-300 hover:text-cyan-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-cyan-500/40"
        >
          <ChevronLeft size={18} />
        </button>
        
        <button
          onClick={() => {
            const e = new CustomEvent('ADVIS_LEARN_REPLAY_STEP');
            window.dispatchEvent(e);
          }}
          className="flex flex-col items-center gap-1 px-4 text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <RotateCcw size={16} />
          <span className="text-[8px] tracking-widest uppercase">Replay</span>
        </button>

        {session.currentStepIndex === session.steps.length - 1 ? (
          <button className="flex items-center gap-3 px-6 py-2.5 bg-cyan-500/20 border border-cyan-400 rounded-full text-xs tracking-widest font-bold text-cyan-300 hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Target size={14} /> PRACTICE
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-3 px-6 py-2.5 bg-cyan-500/20 border border-cyan-400 rounded-full text-xs tracking-widest font-bold text-cyan-300 hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            NEXT <ChevronRight size={16} />
          </button>
        )}

      </div>
    </div>
  );
}




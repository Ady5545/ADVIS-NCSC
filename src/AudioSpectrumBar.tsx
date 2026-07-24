import React, { useMemo, useEffect, useState } from 'react';
import { SystemState } from './App';

export function AudioSpectrumBar({ audioLevel, systemState }: { audioLevel: number, systemState: SystemState }) {
  const barsCount = 32;

  // We generate pseudo-random offsets to make the bars look dynamic,
  // but we base the overall amplitude on audioLevel.
  const offsets = useMemo(() => {
    return Array.from({ length: barsCount }).map(() => Math.random() * 0.5 + 0.5);
  }, [barsCount]);

  // Use a fast local interval to jitter the bars based on the main audioLevel prop
  // to make it feel more "real-time" and responsive than the react update rate
  const [jitter, setJitter] = useState<number[]>(Array(barsCount).fill(1));

  useEffect(() => {
    if (systemState !== 'LISTENING' && systemState !== 'SPEAKING') return;
    
    const interval = setInterval(() => {
      setJitter(Array.from({ length: barsCount }).map(() => Math.random() * 0.4 + 0.8));
    }, 50);
    
    return () => clearInterval(interval);
  }, [systemState, barsCount]);

  if (systemState !== 'LISTENING' && systemState !== 'SPEAKING') {
    return null;
  }

  // Multi-color palette based on frequency/index
  const getGradientColor = (index: number, count: number) => {
    // Symmetrical gradient from outside to inside
    const ratio = Math.abs((index - count / 2) / (count / 2));
    if (ratio > 0.8) return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]';
    if (ratio > 0.6) return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]';
    if (ratio > 0.4) return 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]';
    if (ratio > 0.2) return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]';
    return 'bg-cyan-200 shadow-[0_0_8px_rgba(165,243,252,0.8)]';
  };

  return (
    <div className="flex items-end justify-center gap-1 h-8 w-full mt-2">
      {offsets.map((offset, i) => {
        // Base height on audioLevel, offset, and the fast jitter
        const heightMultiplier = Math.max(0.05, audioLevel * offset * jitter[i] * 2.5);
        const heightPercent = Math.min(100, heightMultiplier * 100);
        
        return (
          <div 
            key={i} 
            className={`w-1 rounded-full transition-all duration-75 ${getGradientColor(i, barsCount)}`}
            style={{ 
              height: `${Math.max(8, heightPercent)}%`,
              opacity: Math.min(1, heightMultiplier + 0.2)
            }}
          />
        );
      })}
    </div>
  );
}

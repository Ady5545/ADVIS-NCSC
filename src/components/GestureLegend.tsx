import React, { useState, useEffect } from 'react';
import { HandTrackingData } from '../useHandTracking';
import { MousePointerClick, Move, Rotate3d, Maximize2, Layers, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface GestureLegendProps {
  handTracking: HandTrackingData;
  isSpatial?: boolean;
}

export function GestureLegend({ handTracking }: GestureLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tapFlash, setTapFlash] = useState(false);
  const [rotateModeActive, setRotateModeActive] = useState(false);

  const activeGesture = handTracking?.gesture || 'NONE';
  const rawGesture = handTracking?.rawGesture || activeGesture;
  const isTracking = handTracking?.state === 'TRACKING';
  const handsDetected = handTracking?.handsDetected || 0;

  useEffect(() => {
    const handleTap = () => {
      setTapFlash(true);
      const t = setTimeout(() => setTapFlash(false), 550);
      return () => clearTimeout(t);
    };
    const handleCarryRotate = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      setRotateModeActive(Boolean(customEvent.detail?.active));
    };

    window.addEventListener('advis-tap', handleTap);
    window.addEventListener('advis-carry-rotate-active', handleCarryRotate);
    return () => {
      window.removeEventListener('advis-tap', handleTap);
      window.removeEventListener('advis-carry-rotate-active', handleCarryRotate);
    };
  }, []);

  const gestures = [
    {
      id: 'TAP',
      name: '1. Tap (Quick Pinch)',
      action: 'Select / Open / Close',
      icon: MousePointerClick,
      isActive: isTracking && (activeGesture === 'TAP' || rawGesture === 'TAP' || tapFlash),
      color: 'cyan',
    },
    {
      id: 'PINCH_DRAG',
      name: '2. Pinch & Move',
      action: 'Drag Part / Free Placement',
      icon: Move,
      isActive: isTracking && (activeGesture === 'PINCH' || handTracking?.interactionState === 'PINCH_DRAG') && !tapFlash && !rotateModeActive,
      color: 'emerald',
    },
    {
      id: 'ROTATE_STILL',
      name: '3. Hold Still',
      action: 'Rotate 3D in Place',
      icon: Rotate3d,
      isActive: isTracking && rotateModeActive,
      color: 'indigo',
    },
    {
      id: 'SCALE_TWO_HAND',
      name: '4. Two Hands',
      action: 'Scale Object Up / Down',
      icon: Maximize2,
      isActive: isTracking && handsDetected === 2,
      color: 'amber',
    },
    {
      id: 'SCRUB_EXPLODE',
      name: '5. Empty Pinch Drag',
      action: 'Scrub Explode View',
      icon: Layers,
      isActive: false,
      color: 'purple',
    },
    {
      id: 'CLAP_RESET',
      name: 'Clap (Palms Together)',
      action: 'Reset & Center View',
      icon: Sparkles,
      isActive: false,
      color: 'cyan',
    }
  ];

  const handleReset = () => {
    window.dispatchEvent(new CustomEvent('advis-selection-success', {
      detail: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }));
  };

  return (
    <div
      id="advis-gesture-legend"
      className="fixed bottom-4 left-4 z-[9990] pointer-events-auto select-none"
    >
      <div className="bg-black/85 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.18)] max-w-xs transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isTracking
                  ? activeGesture === 'FIST'
                    ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="font-mono text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
              GESTURE CONTROLS
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Soft Reset Camera and Position"
              className="p-1 rounded text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand legend' : 'Collapse legend'}
              className="p-1 rounded text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/60 transition-colors"
            >
              {collapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Gesture List */}
        {!collapsed && (
          <div className="space-y-1.5 text-[11px] font-mono">
            {gestures.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg border transition-all duration-150 ${
                    g.isActive
                      ? g.color === 'emerald'
                        ? 'bg-emerald-950/80 border-emerald-400/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : g.color === 'amber'
                        ? 'bg-amber-950/80 border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-cyan-950/80 border-cyan-400/80 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-zinc-950/40 border-transparent text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        g.isActive
                          ? g.color === 'emerald'
                            ? 'text-emerald-400'
                            : g.color === 'amber'
                            ? 'text-amber-400'
                            : 'text-cyan-400'
                          : 'text-zinc-500'
                      }`}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold ${
                          g.isActive ? 'text-white' : 'text-zinc-300'
                        }`}
                      >
                        {g.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 leading-tight">
                        {g.action}
                      </span>
                    </div>
                  </div>

                  {g.isActive && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        g.color === 'emerald'
                          ? 'border-emerald-400/50 bg-emerald-900/60 text-emerald-300'
                          : g.color === 'amber'
                          ? 'border-amber-400/50 bg-amber-900/60 text-amber-300'
                          : 'border-cyan-400/50 bg-cyan-900/60 text-cyan-300'
                      }`}
                    >
                      Active
                    </span>
                  )}
                </div>
              );
            })}

            {/* Tracking Status indicator */}
            <div className="pt-1.5 border-t border-cyan-500/10 flex items-center justify-between text-[9px] text-zinc-500">
              <span>{isTracking ? `${handsDetected} hand${handsDetected !== 1 ? 's' : ''} detected` : 'Waiting for hand...'}</span>
              <span>{isTracking ? `${handTracking?.fps || 30} FPS` : 'Ready'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

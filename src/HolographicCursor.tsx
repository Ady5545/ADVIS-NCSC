import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandTrackingData } from './useHandTracking';

export function HolographicCursor({ handTracking, isSpatial }: { handTracking: HandTrackingData, isSpatial?: boolean }) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isActive, setIsActive] = useState(false);
  const [trail, setTrail] = useState<{x: number, y: number, id: number}[]>([]);
  const [successEvents, setSuccessEvents] = useState<{ x: number, y: number, id: number }[]>([]);
  const [fistConfirmEvents, setFistConfirmEvents] = useState<{ x: number, y: number, id: number }[]>([]);
  const [repulsorEvents, setRepulsorEvents] = useState<{ id: number }[]>([]);
  const [summonEvents, setSummonEvents] = useState<{ id: number }[]>([]);
  const [cycleEvents, setCycleEvents] = useState<{ dir: 'LEFT' | 'RIGHT', id: number }[]>([]);
  const [carryRotateActive, setCarryRotateActive] = useState(false);
  const [scaleFeedback, setScaleFeedback] = useState<{ active: boolean; scale?: number; direction?: 'UP' | 'DOWN'; componentId?: string | null }>({ active: false });
  const [showDebugHUD, setShowDebugHUD] = useState<boolean>(() => {
    return localStorage.getItem('advis_gesture_hud') === 'true';
  });
  
  const trailIdRef = useRef(0);

  // Toggle debug HUD with key 'g' or 'G'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setShowDebugHUD(prev => {
          const next = !prev;
          localStorage.setItem('advis_gesture_hud', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const htState = handTracking?.state;
  const cursorX = handTracking?.cursorPosition?.x;
  const cursorY = handTracking?.cursorPosition?.y;
  const interactionState = handTracking?.interactionState;

  // Position interpolation for absolute fluid feeling and trail management
  useEffect(() => {
    if (htState === 'TRACKING' && cursorX !== undefined && cursorY !== undefined) {
      const isPointerState = interactionState === 'HOVERING';
      const isScrollState = interactionState === 'SCROLL';
      
      const targetActive = isPointerState || isScrollState || htState === 'TRACKING';
      setIsActive(prev => (prev === targetActive ? prev : targetActive));
      
      const screenX = (1 - cursorX) * window.innerWidth;
      const screenY = cursorY * window.innerHeight;
      
      let nextPos: { x: number; y: number } | null = null;

      setPosition(prev => {
        if (prev.x < 0 || prev.y < 0) {
          nextPos = { x: screenX, y: screenY };
        } else {
          const targetX = prev.x + (screenX - prev.x) * 0.45;
          const targetY = prev.y + (screenY - prev.y) * 0.45;
          
          if (Math.abs(prev.x - targetX) >= 0.1 || Math.abs(prev.y - targetY) >= 0.1) {
            nextPos = { x: targetX, y: targetY };
          } else {
            nextPos = prev;
          }
        }
        return nextPos;
      });

      if (targetActive && interactionState !== 'SCROLL') {
        trailIdRef.current += 1;
        const currentId = trailIdRef.current;
        setTrail(tPrev => {
          const newTrail = [...tPrev, { x: screenX, y: screenY, id: currentId }];
          if (newTrail.length > 8) newTrail.shift();
          return newTrail;
        });
      }
    } else {
      setIsActive(prev => (prev === false ? prev : false));
      setTrail(prev => (prev.length === 0 ? prev : []));
    }
  }, [htState, cursorX, cursorY, interactionState]);

  // Listen to selection success confirmation events and new Jarvis gesture events
  useEffect(() => {
    const handleSuccess = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSuccessEvents(prev => [...prev, { x: customEvent.detail.x || position.x, y: customEvent.detail.y || position.y, id: Date.now() }]);
      }
    };

    const handleTap = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const x = customEvent.detail.screenX || position.x;
        const y = customEvent.detail.screenY || position.y;
        setSuccessEvents(prev => [...prev, { x, y, id: Date.now() }]);
      }
    };

    const handleFistConfirm = () => {
      setFistConfirmEvents(prev => [...prev, { x: position.x > 0 ? position.x : window.innerWidth / 2, y: position.y > 0 ? position.y : window.innerHeight / 2, id: Date.now() }]);
    };

    const handleRepulsor = () => {
      setRepulsorEvents(prev => [...prev, { id: Date.now() }]);
    };

    const handleSummon = () => {
      setSummonEvents(prev => [...prev, { id: Date.now() }]);
    };

    const handleCycle = (e: Event) => {
      const ce = e as CustomEvent<{ direction: 'LEFT' | 'RIGHT' }>;
      setCycleEvents(prev => [...prev, { dir: ce.detail?.direction || 'RIGHT', id: Date.now() }]);
    };

    const handleCarryRotate = (e: Event) => {
      const ce = e as CustomEvent<{ active: boolean }>;
      setCarryRotateActive(Boolean(ce.detail?.active));
    };

    const handleTwoHandScale = (e: Event) => {
      const ce = e as CustomEvent<{ active: boolean; componentId?: string | null; scale?: number; direction?: 'UP' | 'DOWN' }>;
      setScaleFeedback({
        active: Boolean(ce.detail?.active),
        scale: ce.detail?.scale,
        direction: ce.detail?.direction,
        componentId: ce.detail?.componentId
      });
    };

    window.addEventListener('advis-selection-success', handleSuccess);
    window.addEventListener('advis-tap', handleTap);
    window.addEventListener('advis-fist-confirm', handleFistConfirm);
    window.addEventListener('advis-model-cycle', handleCycle);
    window.addEventListener('advis-carry-rotate-active', handleCarryRotate);
    window.addEventListener('advis-two-hand-scale-active', handleTwoHandScale);

    return () => {
      window.removeEventListener('advis-selection-success', handleSuccess);
      window.removeEventListener('advis-tap', handleTap);
      window.removeEventListener('advis-fist-confirm', handleFistConfirm);
      window.removeEventListener('advis-model-cycle', handleCycle);
      window.removeEventListener('advis-carry-rotate-active', handleCarryRotate);
      window.removeEventListener('advis-two-hand-scale-active', handleTwoHandScale);
    };
  }, [position.x, position.y]);

  // Clean up old events
  useEffect(() => {
    if (successEvents.length > 0) {
      const timer = setTimeout(() => setSuccessEvents(prev => prev.slice(1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [successEvents]);

  useEffect(() => {
    if (fistConfirmEvents.length > 0) {
      const timer = setTimeout(() => setFistConfirmEvents(prev => prev.slice(1)), 800);
      return () => clearTimeout(timer);
    }
  }, [fistConfirmEvents]);

  useEffect(() => {
    if (repulsorEvents.length > 0) {
      const timer = setTimeout(() => setRepulsorEvents(prev => prev.slice(1)), 900);
      return () => clearTimeout(timer);
    }
  }, [repulsorEvents]);

  useEffect(() => {
    if (summonEvents.length > 0) {
      const timer = setTimeout(() => setSummonEvents(prev => prev.slice(1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [summonEvents]);

  useEffect(() => {
    if (cycleEvents.length > 0) {
      const timer = setTimeout(() => setCycleEvents(prev => prev.slice(1)), 600);
      return () => clearTimeout(timer);
    }
  }, [cycleEvents]);

  // Scroll logic for scrolling containers
  const lastScrollPosRef = useRef({ x: 0, y: 0 });
  const scrollVelocityRef = useRef(0);
  const scrollTargetRef = useRef<Element | Window | null>(null);
  
  useEffect(() => {
    let animationFrameId: number;

    const applyInertia = () => {
      if (Math.abs(scrollVelocityRef.current) > 0.5) {
        if (scrollTargetRef.current) {
          scrollTargetRef.current.scrollBy({ top: scrollVelocityRef.current, behavior: 'auto' });
        }
        scrollVelocityRef.current *= 0.92; // Friction damping
        animationFrameId = requestAnimationFrame(applyInertia);
      } else {
        scrollVelocityRef.current = 0;
      }
    };

    if (handTracking.interactionState === 'SCROLL' && handTracking.scrollPosition) {
      const screenY = handTracking.scrollPosition.y * window.innerHeight;
      
      if (lastScrollPosRef.current.y !== 0) {
        const dy = screenY - lastScrollPosRef.current.y;
        const el = document.elementFromPoint(position.x, position.y);
        const scrollable = el ? getClosestScrollable(el) : null;
        
        const target = scrollable || window;
        scrollTargetRef.current = target;
        
        // Push content (smoothly accumulate velocity)
        const newVelocity = dy * 3.0;
        scrollVelocityRef.current = scrollVelocityRef.current * 0.5 + newVelocity * 0.5;
        
        target.scrollBy({ top: scrollVelocityRef.current, behavior: 'auto' });
      }
      lastScrollPosRef.current.y = screenY;
    } else {
      if (lastScrollPosRef.current.y !== 0) {
        // Just released, start inertia
        animationFrameId = requestAnimationFrame(applyInertia);
      }
      lastScrollPosRef.current.y = 0;
    }
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [handTracking.interactionState, handTracking?.scrollPosition?.y, position.y]);

  const getClosestScrollable = (el: Element): Element | null => {
    if (!el || el === document.body) return null;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const isScrollableY = overflowY !== 'visible' && overflowY !== 'hidden';
    const isScrollableX = overflowX !== 'visible' && overflowX !== 'hidden';
    
    if ((isScrollableY && el.scrollHeight > el.clientHeight) || (isScrollableX && el.scrollWidth > el.clientWidth)) {
      return el;
    }
    return getClosestScrollable(el.parentElement as Element);
  };

  if (!isActive) return null;

  const isScrolling = handTracking.interactionState === 'SCROLL';
  const isHoverState = handTracking.interactionState === 'HOVERING';
  const isSelectState = handTracking.interactionState === 'PINCH_HOLD' || handTracking.interactionState === 'PINCH_DRAG' || handTracking.interactionState === 'PINCH_START';
  const isTrackingState = handTracking.state === 'TRACKING' && !isHoverState && !isSelectState && !isScrolling;
  const progress = handTracking.hoverProgress || 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* 1. GESTURE SELECTION OUTLINE SWEEP (STATE 4: HOVER & SELECT MODE) */}
      <AnimatePresence>
        {handTracking.hoveredRect && (isHoverState || isSelectState) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute border border-cyan-400/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-cyan-950/5"
            style={{
              top: handTracking.hoveredRect.top - 6,
              left: handTracking.hoveredRect.left - 6,
              width: handTracking.hoveredRect.width + 12,
              height: handTracking.hoveredRect.height + 12,
            }}
          >
            {/* Corner Bracket Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
            
            {/* Horizontal Laser Scanning Sweep Line */}
            <motion.div 
              className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              animate={{
                top: ["0%", "100%", "0%"]
              }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SUCCESS CONFIRMATION Ripples (STATE 5: SELECTION SUCCESS BURST) */}
      <AnimatePresence>
        {successEvents.map(evt => (
          <React.Fragment key={evt.id}>
            {/* Wave 1: Rapid High-Intensity Energy Pulse */}
            <motion.div
              initial={{ scale: 0.4, opacity: 1, borderWidth: "4px" }}
              animate={{ scale: 4.5, opacity: 0, borderWidth: "1px" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute rounded-full border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.9)]"
              style={{
                left: evt.x,
                top: evt.y,
                width: 32,
                height: 32,
                x: '-50%',
                y: '-50%'
              }}
            />
            {/* Wave 2: Slower Secondary Holographic Halo */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 6.0, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="absolute rounded-full border border-dashed border-cyan-300"
              style={{
                left: evt.x,
                top: evt.y,
                width: 32,
                height: 32,
                x: '-50%',
                y: '-50%'
              }}
            />
            {/* Burst Sparks */}
            <div className="absolute" style={{ left: evt.x, top: evt.y }}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <motion.div
                  key={angle}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ 
                    x: Math.cos(angle * Math.PI / 180) * 60, 
                    y: Math.sin(angle * Math.PI / 180) * 60,
                    opacity: 0,
                    scale: 0.3
                  }}
                  className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ originX: 0.5, originY: 0.5 }}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* 2B. FIST CONFIRM RETICLE BURST */}
      <AnimatePresence>
        {fistConfirmEvents.map(evt => (
          <React.Fragment key={evt.id}>
            <motion.div
              initial={{ scale: 0.3, opacity: 1, rotate: 0 }}
              animate={{ scale: 3.8, opacity: 0, rotate: 180 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute rounded-full border-2 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.95)]"
              style={{
                left: evt.x,
                top: evt.y,
                width: 40,
                height: 40,
                x: '-50%',
                y: '-50%'
              }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute font-mono text-[10px] tracking-widest text-amber-300 font-bold uppercase pointer-events-none"
              style={{
                left: evt.x,
                top: evt.y - 32,
                transform: 'translateX(-50%)'
              }}
            >
              TARGET LOCKED
            </motion.div>
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* 2C. REPULSOR BLAST RECENTER SHOCKWAVE */}
      <AnimatePresence>
        {repulsorEvents.map(evt => (
          <React.Fragment key={evt.id}>
            <motion.div
              initial={{ scale: 0.1, opacity: 0.9, borderWidth: "6px" }}
              animate={{ scale: 16, opacity: 0, borderWidth: "1px" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute rounded-full border-cyan-300 shadow-[0_0_80px_rgba(6,182,212,1)]"
              style={{
                left: '50%',
                top: '50%',
                width: 80,
                height: 80,
                x: '-50%',
                y: '-50%'
              }}
            />
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* 2D. SUMMON HOLOGRAPHIC PORTAL FLARE */}
      <AnimatePresence>
        {summonEvents.map(evt => (
          <React.Fragment key={evt.id}>
            <motion.div
              initial={{ scale: 0.2, rotate: -90, opacity: 1 }}
              animate={{ scale: 5.5, rotate: 180, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute rounded-3xl border-2 border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.9)] bg-cyan-500/10"
              style={{
                left: '50%',
                top: '50%',
                width: 100,
                height: 100,
                x: '-50%',
                y: '-50%'
              }}
            />
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* 2E. TWO-FINGER FLICK DIRECTION CHEVRONS */}
      <AnimatePresence>
        {cycleEvents.map(evt => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 1, x: evt.dir === 'RIGHT' ? -60 : 60 }}
            animate={{ opacity: 0, x: evt.dir === 'RIGHT' ? 120 : -120 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-1/2 font-mono text-3xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] pointer-events-none"
            style={{
              left: evt.dir === 'RIGHT' ? '60%' : '40%',
              transform: 'translateY(-50%)'
            }}
          >
            {evt.dir === 'RIGHT' ? '>>>' : '<<<'}
          </motion.div>
        ))}
      </AnimatePresence>

      {isSpatial && (
        <>
      {/* 3. POINTER TRAIL */}
      {!isScrolling && trail.map((t, index) => (
        <div 
          key={t.id}
          className="absolute rounded-full bg-cyan-400/30 blur-[1.5px]"
          style={{
            left: t.x,
            top: t.y,
            width: 6 + (index * 1.2),
            height: 6 + (index * 1.2),
            transform: 'translate(-50%, -50%)',
            opacity: (index / trail.length) * 0.8
          }}
        />
      ))}

      {/* 4. ACTIVE HOVER SCANNING PROGRESS GLOW HALO */}
      {isHoverState && progress > 0 && (
        <div 
          className="absolute transition-all duration-75"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg width="44" height="44" className="absolute -left-[22px] -top-[22px]" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background tracking circle */}
            <circle 
              cx="22" cy="22" r="18" 
              fill="transparent" 
              stroke="rgba(6,182,212,0.12)" 
              strokeWidth="1.5"
            />
            {/* Dwell loading progress ring */}
            <circle 
              cx="22" cy="22" r="18" 
              fill="transparent" 
              stroke="rgba(34,211,238,1)" 
              strokeWidth="2.5"
              strokeDasharray={`${progress * 113} 113`}
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]"
            />
          </svg>
        </div>
      )}

      {/* 5. SELECTION PENDING HOLD HALO (STATE 5: CLICK GESTURE PENDING) */}
      {isSelectState && (
        <motion.div
          animate={{ scale: [1, 0.7, 1], rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute border border-dashed border-cyan-200/60 rounded-full"
          style={{
            left: position.x,
            top: position.y,
            width: 32,
            height: 32,
            x: '-50%',
            y: '-50%'
          }}
        />
      )}

      {/* 6. PRIMARY HOLOGRAPHIC CURSOR CORE */}
      <div 
        className={`absolute rounded-full flex items-center justify-center transition-all duration-150
          ${isScrolling ? 'bg-indigo-400/60 scale-125 border border-indigo-200' : 'bg-cyan-300'}
          ${isTrackingState ? 'bg-cyan-500/30 scale-75 border border-cyan-400/20' : ''}
          ${isHoverState ? 'scale-110 shadow-[0_0_20px_5px_rgba(34,211,238,0.7)]' : ''}
          ${isSelectState ? 'scale-75 bg-white shadow-[0_0_25px_10px_rgba(255,255,255,0.95)]' : 'shadow-[0_0_12px_3px_rgba(6,182,212,0.6)]'}
        `}
        style={{
          left: position.x,
          top: position.y,
          width: isTrackingState ? 8 : 10,
          height: isTrackingState ? 8 : 10,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Minimal dot indicator inside scroll cursor */}
        {isScrolling && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
        
        {/* Core point glow effect */}
        {!isScrolling && !isTrackingState && (
          <div className="absolute inset-0 bg-cyan-400 rounded-full animate-pulse opacity-40 blur-[1px]" />
        )}
      </div>

      {/* 7. TWO-HAND INTERACTION FEEDBACK */}
      {handTracking.interactionState === 'TWO_HAND_INTERACTION' && handTracking.leftHandPosition && handTracking.rightHandPosition && (() => {
        const x1 = (1 - handTracking.leftHandPosition.x) * window.innerWidth;
        const y1 = handTracking.leftHandPosition.y * window.innerHeight;
        const x2 = (1 - handTracking.rightHandPosition.x) * window.innerWidth;
        const y2 = handTracking.rightHandPosition.y * window.innerHeight;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const isScaling = Boolean(scaleFeedback.active || handTracking.gesture === 'TWO HAND SCALE');
        const scalePercent = Math.round((scaleFeedback.scale || 1.0) * 100);

        return (
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
            <svg className="w-full h-full">
              {/* Connector line between hands */}
              <line 
                x1={x1} y1={y1} 
                x2={x2} y2={y2} 
                stroke={isScaling ? "rgba(251, 191, 36, 0.65)" : "rgba(6, 182, 212, 0.45)"} 
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              {/* Left hand anchor reticle */}
              <circle cx={x1} cy={y1} r="14" fill="none" stroke={isScaling ? "rgba(251, 191, 36, 0.7)" : "rgba(6, 182, 212, 0.5)"} strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={x1} cy={y1} r="3" fill={isScaling ? "#fbbf24" : "#22d3ee"} />

              {/* Right hand anchor reticle */}
              <circle cx={x2} cy={y2} r="14" fill="none" stroke={isScaling ? "rgba(251, 191, 36, 0.7)" : "rgba(6, 182, 212, 0.5)"} strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={x2} cy={y2} r="3" fill={isScaling ? "#fbbf24" : "#22d3ee"} />
            </svg>

            {/* Midpoint Holographic Scale HUD */}
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: midX, top: midY }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/85 border border-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.35)] backdrop-blur-sm">
                <span className="text-amber-400 font-mono text-xs font-bold">
                  {scaleFeedback.direction === 'UP' ? '◂ SCALE UP ▸' : scaleFeedback.direction === 'DOWN' ? '▸ SCALE DOWN ◂' : 'SCALE'}
                </span>
                <span className="font-mono text-xs text-white font-black bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                  {scalePercent}%
                </span>
              </div>
              <div className="font-mono text-[9px] text-amber-300/80 tracking-widest uppercase mt-0.5">
                {scaleFeedback.componentId ? `PART: ${scaleFeedback.componentId}` : 'MODEL ASSEMBLY'}
              </div>
            </div>
          </div>
        );
      })()}
      {/* 8. FIST HOLD & ROTARY DIAL RING */}
      {handTracking.gesture === 'FIST' && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg width="68" height="68" className="absolute -left-[34px] -top-[34px] animate-[spin_8s_linear_infinite]">
            <circle
              cx="34" cy="34" r="26"
              fill="transparent"
              stroke="rgba(251,191,36,0.25)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>
          <svg width="68" height="68" className="absolute -left-[34px] -top-[34px] -rotate-90">
            <circle
              cx="34" cy="34" r="26"
              fill="transparent"
              stroke="rgba(251,191,36,0.95)"
              strokeWidth="3"
              strokeDasharray={`${(handTracking.fistHoldProgress || 0) * 163} 163`}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            />
          </svg>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-amber-300 font-bold uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
            {handTracking.fistHoldProgress && handTracking.fistHoldProgress > 0.7 ? 'HOLD TO RESET' : 'PAUSED / FROZEN'}
          </div>
        </div>
      )}

      {/* 8B. GESTURE 3: CARRY 3D ROTATION INDICATOR */}
      {carryRotateActive && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg width="64" height="64" className="absolute -left-[32px] -top-[32px] animate-[spin_5s_linear_infinite]">
            <circle
              cx="32" cy="32" r="24"
              fill="transparent"
              stroke="rgba(99, 102, 241, 0.45)"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          </svg>
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-indigo-300 font-bold uppercase tracking-widest bg-black/85 px-2.5 py-0.5 rounded border border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.4)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            3D ROTATE
          </div>
        </div>
      )}
        </>
      )}

      {/* 9. ON-SCREEN GESTURE TELEMETRY (Toggleable via 'G' or HUD button) */}
      <div className="fixed bottom-4 right-4 z-[10000] pointer-events-auto flex flex-col items-end gap-1">
        <button
          onClick={() => {
            setShowDebugHUD(prev => {
              const next = !prev;
              localStorage.setItem('advis_gesture_hud', String(next));
              return next;
            });
          }}
          className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase rounded border transition-all duration-150 backdrop-blur-md bg-black/75 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/80 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1.5 cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showDebugHUD ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'}`} />
          TELEMETRY [G]
        </button>

        {showDebugHUD && (
          <div className="mt-1 bg-black/90 border border-cyan-500/40 rounded-lg p-3 text-[10px] font-mono backdrop-blur-lg shadow-[0_0_30px_rgba(6,182,212,0.2)] text-cyan-100 min-w-[240px] space-y-1.5">
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-1">
              <span className="text-cyan-400 font-bold tracking-widest uppercase">JARVIS TELEMETRY</span>
              <span className="text-[9px] text-cyan-300/60 font-mono">{(handTracking.fps || 30)} FPS</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <span className="text-zinc-400">RAW:</span>
              <span className="text-amber-300 font-semibold truncate">{handTracking.rawGesture || handTracking.gesture}</span>

              <span className="text-zinc-400">STABILIZED:</span>
              <span className="text-cyan-300 font-semibold truncate">{handTracking.gesture}</span>

              <span className="text-zinc-400">INTERACTION:</span>
              <span className="text-emerald-300 truncate">{handTracking.interactionState}</span>

              <span className="text-zinc-400">CONFIDENCE:</span>
              <span className="text-cyan-200">{((handTracking.confidence || 0) * 100).toFixed(0)}%</span>

              <span className="text-zinc-400">ROT DIAL Δ:</span>
              <span className="text-cyan-300 font-mono">{handTracking.fistRotationDelta ? handTracking.fistRotationDelta.toFixed(3) : '0.000'}</span>

              <span className="text-zinc-400">FIST PROGRESS:</span>
              <span className="text-amber-300 font-mono">{(((handTracking.fistHoldProgress || 0)) * 100).toFixed(0)}%</span>
            </div>

            {/* Gesture quick confidence bar */}
            <div className="w-full bg-cyan-950/60 rounded-full h-1 overflow-hidden mt-1 border border-cyan-500/30">
              <div
                className="bg-cyan-400 h-full transition-all duration-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.min(100, Math.max(5, (handTracking.confidence || 0) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

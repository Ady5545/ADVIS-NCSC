import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandTrackingData } from './useHandTracking';

export function HolographicCursor({ handTracking, isSpatial }: { handTracking: HandTrackingData, isSpatial?: boolean }) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isActive, setIsActive] = useState(false);
  const [trail, setTrail] = useState<{x: number, y: number, id: number}[]>([]);
  const [successEvents, setSuccessEvents] = useState<{ x: number, y: number, id: number }[]>([]);
  
  const trailIdRef = useRef(0);

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

  // Listen to selection success confirmation events
  useEffect(() => {
    const handleSuccess = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSuccessEvents(prev => [...prev, { x: customEvent.detail.x, y: customEvent.detail.y, id: Date.now() }]);
      }
    };
    window.addEventListener('advis-selection-success', handleSuccess);
    return () => window.removeEventListener('advis-selection-success', handleSuccess);
  }, []);

  // Clean up old success events
  useEffect(() => {
    if (successEvents.length > 0) {
      const timer = setTimeout(() => {
        setSuccessEvents(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successEvents]);

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
      {handTracking.interactionState === 'TWO_HAND_INTERACTION' && handTracking.leftHandPosition && handTracking.rightHandPosition && (
        <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          {handTracking.gesture === 'TWO HAND SCALE' && (
            <line 
              x1={(1 - handTracking.leftHandPosition.x) * window.innerWidth} 
              y1={handTracking.leftHandPosition.y * window.innerHeight} 
              x2={(1 - handTracking.rightHandPosition.x) * window.innerWidth} 
              y2={handTracking.rightHandPosition.y * window.innerHeight} 
              stroke="rgba(6, 182, 212, 0.4)" 
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
          {handTracking.gesture === 'TWO HAND ROTATE' && (
            <circle 
              cx={((1 - handTracking.leftHandPosition.x) * window.innerWidth + (1 - handTracking.rightHandPosition.x) * window.innerWidth) / 2} 
              cy={(handTracking.leftHandPosition.y * window.innerHeight + handTracking.rightHandPosition.y * window.innerHeight) / 2} 
              r={Math.sqrt(Math.pow((1 - handTracking.leftHandPosition.x) * window.innerWidth - (1 - handTracking.rightHandPosition.x) * window.innerWidth, 2) + Math.pow(handTracking.leftHandPosition.y * window.innerHeight - handTracking.rightHandPosition.y * window.innerHeight, 2)) / 2}
              fill="transparent" 
              stroke="rgba(6, 182, 212, 0.2)" 
              strokeWidth="1"
              strokeDasharray="10 10"
            />
          )}
        </svg>
      )}
        </>
      )}
    </div>
  );
}

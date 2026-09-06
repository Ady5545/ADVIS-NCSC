import { useState, useEffect, useRef, useCallback } from 'react';
import { useTrackingState, NormalizedHandState } from './TrackingProvider';
import { getDistance, isFingerExtended, isThumbExtended, getHandRotation } from './gestureUtils';

export type TrackingState = 'OFF' | 'SEARCHING' | 'TRACKING' | 'LOST';

export type InteractionState = 
  | 'IDLE'
  | 'TRACKING'
  | 'HOVERING'
  | 'PINCH_START'
  | 'PINCH_HOLD'
  | 'PINCH_DRAG'
  | 'PINCH_RELEASE'
  | 'TWO_HAND_INTERACTION'
  | 'PAUSED'
  | 'SCROLL';

export type GestureType = 
  | 'NONE'
  | 'INDEX POINTER'
  | 'PINCH'
  | 'TWO FINGER NAVIGATION'
  | 'TWO FINGER SCROLL'
  | 'TWO FINGER ROTATION'
  | 'TWO FINGER ZOOM'
  | 'OPEN PALM'
  | 'FIST'
  | 'TWO HAND GRAB'
  | 'TWO HAND SCALE'
  | 'TWO HAND ROTATE'
  | 'TWO HAND POSITION'
  | 'TWO HAND ENERGY'
  | 'CLAP';

export interface HandTrackingData {
  state: TrackingState;
  interactionState: InteractionState;
  handsDetected: number;
  landmarks: any[];
  fps: number;
  confidence: number;
  gesture: GestureType;
  rawGesture?: GestureType;
  cursorPosition: { x: number, y: number, z: number } | null;
  scrollPosition: { x: number, y: number, z: number } | null;
  pinchDistance: number;
  twoFingerDistance: number;
  handRotation: number;
  fistRotationDelta?: number;
  fistHoldProgress?: number;
  leftHandPosition: { x: number, y: number, z: number } | null;
  rightHandPosition: { x: number, y: number, z: number } | null;
  handsDistance: number;
  hoverProgress: number;
  hoveredRect: { top: number, left: number, width: number, height: number } | null;
}

class AdaptiveKalmanFilter {
  private x: number = 0.5;
  private p: number = 1.0;
  private qBase: number = 0.00001; // Base process noise covariance for stationary hand
  private rBase: number = 0.015;    // Measurement noise covariance (higher = smoother, less jitter)
  private initialized: boolean = false;
  private lastMeasurement: number = 0.5;

  constructor(qBase: number = 0.00001, rBase: number = 0.015) {
    this.qBase = qBase;
    this.rBase = rBase;
  }

  public reset() {
    this.initialized = false;
  }

  public update(measurement: number): number {
    if (!this.initialized) {
      this.x = measurement;
      this.p = 1.0;
      this.lastMeasurement = measurement;
      this.initialized = true;
      return this.x;
    }

    // Velocity proxy: squared delta of measurement change
    const delta = measurement - this.lastMeasurement;
    this.lastMeasurement = measurement;

    // Adapt process noise dynamically.
    // When moving quickly (large delta), increase Q so the filter follows instantly without lag.
    // When stationary (tiny delta), reduce Q to block out any micro-vibrations and camera noise.
    const dynamicQ = this.qBase + delta * delta * 2.5;

    // Time update (predict)
    const pPredict = this.p + dynamicQ;

    // Measurement update
    const kGain = pPredict / (pPredict + this.rBase);
    this.x = this.x + kGain * (measurement - this.x);
    this.p = (1 - kGain) * pPredict;

    return this.x;
  }
}

const getMagneticAdjustment = (x: number, y: number) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  // Convert normalized coordinate (camera is mirrored so 1 - x) to screen pixel coordinates
  const screenX = (1 - x) * window.innerWidth;
  const screenY = y * window.innerHeight;
  
  const selectables = document.querySelectorAll('button, a, input, [data-selectable="true"]');
  let closestElement: HTMLElement | null = null;
  let minDistance = Infinity;
  let centerOfClosest = { x: 0, y: 0 };
  
  selectables.forEach(el => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt(Math.pow(screenX - cx, 2) + Math.pow(screenY - cy, 2));
    
    if (dist < minDistance) {
      minDistance = dist;
      closestElement = el as HTMLElement;
      centerOfClosest = { x: cx, y: cy };
    }
  });
  
  const MAGNETIC_RADIUS = 80; // magnetic attraction radius in pixels
  if (closestElement && minDistance < MAGNETIC_RADIUS) {
    // 0.3 means 30% pull towards center of the button to assist precision
    const pullFactor = 0.3 * (1 - minDistance / MAGNETIC_RADIUS);
    const adjustedScreenX = screenX + (centerOfClosest.x - screenX) * pullFactor;
    const adjustedScreenY = screenY + (centerOfClosest.y - screenY) * pullFactor;
    
    return {
      x: 1 - (adjustedScreenX / window.innerWidth),
      y: adjustedScreenY / window.innerHeight,
      element: closestElement
    };
  }
  
  return null;
};

export function useHandTracking(enabled: boolean) {
  const [data, setData] = useState<HandTrackingData>({
    state: 'OFF',
    interactionState: 'IDLE',
    handsDetected: 0,
    landmarks: [],
    fps: 0,
    confidence: 0,
    gesture: 'NONE',
    cursorPosition: null,
    scrollPosition: null,
    pinchDistance: 1,
    twoFingerDistance: 0,
    handRotation: 0,
    leftHandPosition: null,
    rightHandPosition: null,
    handsDistance: 0,
    hoverProgress: 0,
    hoveredRect: null
  });

  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lossBufferStartTimeRef = useRef<number>(0);
  const [fps, setFps] = useState(0);

  const prevMetricsRef = useRef({
    twoFingerDist: 0,
    handRotation: 0,
    handPos: { x: 0, y: 0 },
    handsDist: 0,
    twoHandCenter: { x: 0, y: 0 },
    twoHandRotation: 0
  });

  // Smoothing filters (EMA)
  const smoothedRef = useRef({
    lHand: { x: 0, y: 0, z: 0 },
    rHand: { x: 0, y: 0, z: 0 },
    handsDist: 0,
    twoHandRot: 0,
    oneHandRot: 0,
    cursorPos: { x: 0.5, y: 0.5, z: 0.1 },
    scrollPos: { x: 0.5, y: 0.5, z: 0.1 },
    lastPointerUpdate: 0,
    twoFingerDist: 0,
    wasScrolling: false
  });

  // Adaptive Kalman Filter references for index fingertip coordinates
  const kalmanX = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));
  const kalmanY = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));
  const kalmanZ = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));

  // Separate Adaptive Kalman Filter references for scrolling to prevent cursor drift/pollution
  const scrollKalmanX = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));
  const scrollKalmanY = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));
  const scrollKalmanZ = useRef(new AdaptiveKalmanFilter(0.00001, 0.015));

  // State machine references
  const lastHoveredElementRef = useRef<HTMLElement | null>(null);
  const hoverProgressRef = useRef<number>(0);
  const clickExecutedRef = useRef<boolean>(false);
  const pinchStartTimeRef = useRef<number>(0);
  const lastActiveGestureRef = useRef<GestureType>('NONE');
  const isTransitioningRef = useRef<boolean>(false);
  const lastActiveTimeRef = useRef<number>(0);
  const hoverStartTimeRef = useRef<number>(0);


  // Swipe State Machine
  const swipeRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startTime: number;
    lastSwipeTime: number;
  }>({ active: false, startX: 0, startY: 0, startTime: 0, lastSwipeTime: 0 });

  // Pinch State Machine
  const pinchStateMachineRef = useRef<{
    state: 'IDLE' | 'PINCH_START' | 'PINCH_HOLD' | 'PINCH_DRAG' | 'PINCH_RELEASE';
    startTime: number;
    startPos: {x: number, y: number} | null;
  }>({ state: 'IDLE', startTime: 0, startPos: null });


  // Gesture locking and stability
  const gestureLockRef = useRef<{
    candidate: GestureType;
    locked: GestureType;
    startTime: number;
  }>({ candidate: 'NONE', locked: 'NONE', startTime: 0 });

  // Fist Hold Confirm, Rotation Dial, and Summon detection
  const fistStartTimeRef = useRef<number>(0);
  const fistConfirmedRef = useRef<boolean>(false);
  const lastFistRotationRef = useRef<number | null>(null);

  // Open-palm Push (Repulsor Reset) detection
  const lastZRef = useRef<number>(0);
  const lastZTimeRef = useRef<number>(0);
  const lastPushTimeRef = useRef<number>(0);

  // Two Finger Navigation & Swipe
  const twoFingerSwipeRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startTime: number;
    lastSwipeTime: number;
  }>({ active: false, startX: 0, startY: 0, startTime: 0, lastSwipeTime: 0 });

  const { handState } = useTrackingState();
  useEffect(() => {
    const processHands = (state: NormalizedHandState) => {
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFrameTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    const hasHands = state.hands.map(h => h.landmarks) && state.hands.map(h => h.landmarks).length > 0;
    
    setData(prev => {
      if (hasHands) {
        lossBufferStartTimeRef.current = 0;
        let cursorPosition = null;
        let scrollPosition = null;
        let confidence = 0.99;

        const numHands = state.hands.map(h => h.landmarks).length;
        
        let lHandPos = null;
        let rHandPos = null;
        let handsDist = 0;
        let rawCursor = { x: 0.5, y: 0.5, z: 0.1 };
        let rawGesture: GestureType = 'NONE';
        let pinchDist = 1;
        let fistRotDelta = 0;
        let fistHoldProgress = 0;

        if (numHands === 1) {
          const lm = state.hands.map(h => h.landmarks)[0];
          
          const isThumb = isThumbExtended(lm);
          const isIndex = isFingerExtended(lm, 5);
          const isMiddle = isFingerExtended(lm, 9);
          const isRing = isFingerExtended(lm, 13);
          const isPinky = isFingerExtended(lm, 17);

          const rawRotation = getHandRotation(lm);
          rawCursor = { x: lm[8].x, y: lm[8].y, z: getDistance(lm[0], lm[9]) };

          pinchDist = getDistance(lm[4], lm[8]);
          const rawTwoFingerDist = getDistance(lm[8], lm[12]);

          smoothedRef.current.oneHandRot = smoothedRef.current.oneHandRot * 0.8 + rawRotation * 0.2;
          smoothedRef.current.twoFingerDist = smoothedRef.current.twoFingerDist * 0.9 + rawTwoFingerDist * 0.1;

          const isStablePinch = pinchDist < 0.038;
          const isTwoFinger = isIndex && isMiddle && !isRing && !isPinky;
          const isFist = !isThumb && !isIndex && !isMiddle && !isRing && !isPinky;

          if (isStablePinch) {
            rawGesture = 'PINCH';
          } else if (isIndex && !isMiddle && !isRing && !isPinky) {
            rawGesture = 'INDEX POINTER';
          } else if (isTwoFinger) {
            const dy = lm[8].y - (prevMetricsRef.current.handPos?.y ?? lm[8].y);
            const dx = lm[8].x - (prevMetricsRef.current.handPos?.x ?? lm[8].x);
            if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dy) > 0.005) {
              rawGesture = 'TWO FINGER SCROLL';
            } else {
              rawGesture = 'TWO FINGER NAVIGATION';
            }
          } else if (isFist) {
            rawGesture = 'FIST';
          } else {
            // Open palm / open hand gesture: allow object rotation/orbit from any hand position
            rawGesture = 'OPEN PALM';
          }

          // Single-fist Hold, Confirm & Rotary Dial Tracking
          if (rawGesture === 'FIST') {
            if (fistStartTimeRef.current === 0) {
              fistStartTimeRef.current = now;
              fistConfirmedRef.current = false;
              lastFistRotationRef.current = rawRotation;
            }
            const fistElapsed = now - fistStartTimeRef.current;
            fistHoldProgress = Math.min(1.0, fistElapsed / 320);

            // Dial rotation delta while fist is closed
            if (lastFistRotationRef.current !== null) {
              let diff = rawRotation - lastFistRotationRef.current;
              while (diff < -Math.PI) diff += 2 * Math.PI;
              while (diff > Math.PI) diff -= 2 * Math.PI;
              if (Math.abs(diff) > 0.015 && Math.abs(diff) < 0.35) {
                fistRotDelta = diff;
                lastFistRotationRef.current = rawRotation;
              }
            }

            if (fistElapsed >= 320 && !fistConfirmedRef.current) {
              fistConfirmedRef.current = true;
              const screenX = (1 - lm[9].x) * window.innerWidth;
              const screenY = lm[9].y * window.innerHeight;
              window.dispatchEvent(new CustomEvent('advis-fist-confirm', {
                detail: { x: screenX, y: screenY, timestamp: now }
              }));
            }
          } else {
            if (fistStartTimeRef.current !== 0) {
              const heldDuration = now - fistStartTimeRef.current;
              // Deliberate Summon Gesture: closed fist held then deliberately opening into spread palm!
              if (heldDuration >= 200 && (isIndex && isMiddle && isRing && isPinky)) {
                const screenX = (1 - lm[9].x) * window.innerWidth;
                const screenY = lm[9].y * window.innerHeight;
                window.dispatchEvent(new CustomEvent('advis-summon-model', {
                  detail: { x: screenX, y: screenY, timestamp: now }
                }));
              }
              fistStartTimeRef.current = 0;
              fistConfirmedRef.current = false;
              lastFistRotationRef.current = null;
            }
          }

          // Open-palm Push (Repulsor Blast Reset)
          if (rawGesture === 'OPEN PALM') {
            const currentZ = rawCursor.z;
            const lastZ = lastZRef.current;
            const lastZTime = lastZTimeRef.current;
            const dtZ = now - lastZTime;
            
            if (dtZ > 35 && dtZ < 220 && lastZ > 0) {
              const deltaZ = currentZ - lastZ;
              const zVel = deltaZ / dtZ;
              if (deltaZ > 0.028 && zVel > 0.00025 && (now - lastPushTimeRef.current > 1200)) {
                lastPushTimeRef.current = now;
                const screenX = (1 - rawCursor.x) * window.innerWidth;
                const screenY = rawCursor.y * window.innerHeight;
                window.dispatchEvent(new CustomEvent('advis-repulsor-reset', {
                  detail: { x: screenX, y: screenY, timestamp: now }
                }));
              }
            }
            lastZRef.current = currentZ;
            lastZTimeRef.current = now;
          }
          
          prevMetricsRef.current.handRotation = rawRotation;
          prevMetricsRef.current.twoFingerDist = rawTwoFingerDist;
          prevMetricsRef.current.handPos = lm[0];

        } else if (numHands === 2) {
          const lm1 = state.hands.map(h => h.landmarks)[0];
          const lm2 = state.hands.map(h => h.landmarks)[1];
          
          const rawLHand = { x: lm1[0].x, y: lm1[0].y, z: lm1[0].z };
          const rawRHand = { x: lm2[0].x, y: lm2[0].y, z: lm2[0].z };
          
          const filterPos = (cur: any, raw: any) => ({
             x: cur.x * 0.75 + raw.x * 0.25,
             y: cur.y * 0.75 + raw.y * 0.25,
             z: cur.z * 0.95 + raw.z * 0.05
          });

          if (prev.handsDetected !== 2) {
             smoothedRef.current.lHand = { ...rawLHand };
             smoothedRef.current.rHand = { ...rawRHand };
             smoothedRef.current.handsDist = getDistance(lm1[0], lm2[0]);
             const dx = rawRHand.x - rawLHand.x;
             const dy = rawRHand.y - rawLHand.y;
             smoothedRef.current.twoHandRot = Math.atan2(dy, dx);
          } else {
             smoothedRef.current.lHand = filterPos(smoothedRef.current.lHand, rawLHand);
             smoothedRef.current.rHand = filterPos(smoothedRef.current.rHand, rawRHand);
          }

          lHandPos = smoothedRef.current.lHand;
          rHandPos = smoothedRef.current.rHand;
          
          const rawHandsDist = getDistance(lm1[0], lm2[0]);
          smoothedRef.current.handsDist = smoothedRef.current.handsDist * 0.85 + rawHandsDist * 0.15;
          handsDist = smoothedRef.current.handsDist;
          
          const center = { x: (lHandPos.x + rHandPos.x)/2, y: (lHandPos.y + rHandPos.y)/2 };
          const rawDx = rawRHand.x - rawLHand.x;
          const rawDxDiff = rawDx;
          const rawDy = rawRHand.y - rawLHand.y;
          const rawTwoHandRotation = Math.atan2(rawDy, rawDxDiff);
          
          let diff = rawTwoHandRotation - smoothedRef.current.twoHandRot;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          smoothedRef.current.twoHandRot += diff * 0.2;

          const isHand1Pinch = getDistance(lm1[4], lm1[8]) < 0.055;
          const isHand2Pinch = getDistance(lm2[4], lm2[8]) < 0.055;
          
          pinchDist = Math.min(getDistance(lm1[4], lm1[8]), getDistance(lm2[4], lm2[8]));

          if (isHand1Pinch && isHand2Pinch) {
            const rotDelta = Math.abs(rawTwoHandRotation - prevMetricsRef.current.twoHandRotation);
            const distDelta = Math.abs(rawHandsDist - prevMetricsRef.current.handsDist);
            const centerDelta = getDistance(center, prevMetricsRef.current.twoHandCenter);
            
            const distChange = rawHandsDist - prevMetricsRef.current.handsDist;
            if (rawHandsDist < 0.13 && distChange < -0.01) {
              rawGesture = 'CLAP';
            } else if (rawHandsDist < 0.15) {
              rawGesture = 'TWO HAND ENERGY';
            } else if (distDelta > 0.05) {
              rawGesture = 'TWO HAND SCALE';
            } else if (rotDelta > 0.15) {
              rawGesture = 'TWO HAND ROTATE';
            } else if (centerDelta > 0.04) {
              rawGesture = 'TWO HAND POSITION';
            } else {
              rawGesture = 'TWO HAND GRAB';
            }
          }
          
          prevMetricsRef.current.handsDist = rawHandsDist;
          prevMetricsRef.current.twoHandCenter = center;
          prevMetricsRef.current.twoHandRotation = rawTwoHandRotation;
        }
        
        // --- Gesture Temporal Stability Debouncing ---
        if (rawGesture !== gestureLockRef.current.candidate) {
          gestureLockRef.current.candidate = rawGesture;
          gestureLockRef.current.startTime = now;
        }

        let stabilizedGesture = gestureLockRef.current.locked;
        if (now - gestureLockRef.current.startTime >= 120) { // 120ms stable window
          stabilizedGesture = rawGesture;
          gestureLockRef.current.locked = rawGesture;
        }

        // --- Gesture Locking and Priority transition rules ---
        const isFunctional = (g: GestureType) => {
          return g === 'INDEX POINTER' || g === 'PINCH' || g === 'TWO FINGER SCROLL' || g === 'TWO FINGER NAVIGATION' ||
                 g.startsWith('TWO HAND') || g === 'TWO FINGER ROTATION' || g === 'TWO FINGER ZOOM' || g === 'CLAP' || g === 'FIST';
        };

        let activeGesture = stabilizedGesture;

        // Transition logic: require Neutral State between different functional gestures
        if (isFunctional(stabilizedGesture)) {
          if (lastActiveGestureRef.current !== 'NONE' && lastActiveGestureRef.current !== stabilizedGesture) {
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              lastActiveTimeRef.current = now;
            }
            if (now - lastActiveTimeRef.current < 150) { // 150ms Neutral Transition State
              activeGesture = 'NONE';
            } else {
              isTransitioningRef.current = false;
              lastActiveGestureRef.current = stabilizedGesture;
            }
          } else {
            lastActiveGestureRef.current = stabilizedGesture;
            isTransitioningRef.current = false;
          }
        } else {
          lastActiveGestureRef.current = 'NONE';
          isTransitioningRef.current = false;
        }

        // --- Compute cursor/scrolling position with stability ---
        if (numHands === 1) {
          const isScrollGesture = activeGesture === 'TWO FINGER SCROLL' || activeGesture === 'TWO FINGER NAVIGATION';

          if (isScrollGesture) {
            if (!smoothedRef.current.wasScrolling) {
              scrollKalmanX.current.reset();
              scrollKalmanY.current.reset();
              scrollKalmanZ.current.reset();
              smoothedRef.current.wasScrolling = true;
            }
            const filteredScrollX = scrollKalmanX.current.update(rawCursor.x);
            const filteredScrollY = scrollKalmanY.current.update(rawCursor.y);
            const filteredScrollZ = scrollKalmanZ.current.update(rawCursor.z);

            smoothedRef.current.scrollPos = { x: filteredScrollX, y: filteredScrollY, z: filteredScrollZ };
            scrollPosition = { ...smoothedRef.current.scrollPos };
            cursorPosition = smoothedRef.current.cursorPos ? { ...smoothedRef.current.cursorPos } : null;
          } else {
            if (smoothedRef.current.wasScrolling) {
              kalmanX.current.reset();
              kalmanY.current.reset();
              kalmanZ.current.reset();
              smoothedRef.current.wasScrolling = false;
            }
            const filteredX = kalmanX.current.update(rawCursor.x);
            const filteredY = kalmanY.current.update(rawCursor.y);
            const filteredZ = kalmanZ.current.update(rawCursor.z);

            const distToCursor = getDistance({ x: filteredX, y: filteredY }, smoothedRef.current.cursorPos);
            if (distToCursor > 0.008) { // fine circular dead zone
              smoothedRef.current.cursorPos = {
                 x: smoothedRef.current.cursorPos.x * 0.70 + filteredX * 0.30,
                 y: smoothedRef.current.cursorPos.y * 0.70 + filteredY * 0.30,
                 z: smoothedRef.current.cursorPos.z * 0.70 + filteredZ * 0.30
              };
            }
            cursorPosition = { ...smoothedRef.current.cursorPos };
            scrollPosition = null;
          }
        }

        // --- State Machine Determination ---
        let interactionState: InteractionState = 'IDLE';
        let hoverProgress = 0;
        let hoveredRect: { top: number, left: number, width: number, height: number } | null = null;

        
        if (numHands === 0) {
          interactionState = 'IDLE';
          pinchStateMachineRef.current.state = 'IDLE';
        } else if (numHands === 2) {
          interactionState = 'TWO_HAND_INTERACTION';
          pinchStateMachineRef.current.state = 'IDLE';
        } else if (numHands === 1) {

          // Swipe Detection
          const swipe = swipeRef.current;
          if (activeGesture === 'OPEN PALM' || activeGesture === 'INDEX POINTER') {
            if (!swipe.active && cursorPosition) {
              swipe.active = true;
              swipe.startX = cursorPosition.x;
              swipe.startY = cursorPosition.y;
              swipe.startTime = now;
            } else if (swipe.active && cursorPosition) {
              const dx = cursorPosition.x - swipe.startX;
              const dy = cursorPosition.y - swipe.startY;
              const dt = now - swipe.startTime;
              
              if (dt < 400 && dt > 50) {
                const velocityX = dx / dt;
                const velocityY = dy / dt;
                
                if (now - swipe.lastSwipeTime > 1000) { // Cooldown
                  if (Math.abs(dx) > 0.15 && Math.abs(velocityX) > 0.0005 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    window.dispatchEvent(new CustomEvent('advis-swipe', { detail: { direction: dx > 0 ? 'RIGHT' : 'LEFT' } }));
                    swipe.lastSwipeTime = now;
                    swipe.active = false;
                  } else if (Math.abs(dy) > 0.15 && Math.abs(velocityY) > 0.0005 && Math.abs(dy) > Math.abs(dx) * 1.5) {
                    window.dispatchEvent(new CustomEvent('advis-swipe', { detail: { direction: dy > 0 ? 'DOWN' : 'UP' } }));
                    swipe.lastSwipeTime = now;
                    swipe.active = false;
                  }
                }
              } else if (dt >= 400) {
                // Reset swipe if took too long
                swipe.active = false;
              }
            }
          } else {
            swipe.active = false;
          }

          // Two-Finger Navigation Flick / Model & Panel Cycling
          const tfSwipe = twoFingerSwipeRef.current;
          if ((activeGesture === 'TWO FINGER NAVIGATION' || activeGesture === 'TWO FINGER SCROLL') && cursorPosition) {
            if (!tfSwipe.active) {
              tfSwipe.active = true;
              tfSwipe.startX = cursorPosition.x;
              tfSwipe.startY = cursorPosition.y;
              tfSwipe.startTime = now;
            } else {
              const dx = cursorPosition.x - tfSwipe.startX;
              const dy = cursorPosition.y - tfSwipe.startY;
              const dt = now - tfSwipe.startTime;

              if (dt < 420 && dt > 45) {
                if (now - tfSwipe.lastSwipeTime > 750) {
                  if (Math.abs(dx) > 0.12 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                    const dir = dx > 0 ? 'RIGHT' : 'LEFT';
                    window.dispatchEvent(new CustomEvent('advis-model-cycle', { detail: { direction: dir } }));
                    tfSwipe.lastSwipeTime = now;
                    tfSwipe.active = false;
                  }
                }
              } else if (dt >= 420) {
                tfSwipe.active = false;
              }
            }
          } else {
            twoFingerSwipeRef.current.active = false;
          }

          // Process JARVIS-style Pinch State Machine
          const isPinchDetected = activeGesture === 'PINCH';
          const psm = pinchStateMachineRef.current;
          
          if (isPinchDetected) {
            if (psm.state === 'IDLE' || psm.state === 'PINCH_RELEASE') {
              psm.state = 'PINCH_START';
              psm.startTime = now;
              psm.startPos = cursorPosition ? { x: cursorPosition.x, y: cursorPosition.y } : null;
            } else if (psm.state === 'PINCH_START') {
              if (now - psm.startTime > 100) {
                psm.state = 'PINCH_HOLD';
              }
              // Check movement to transition early to drag
              if (psm.startPos && cursorPosition) {
                const dist = Math.sqrt(Math.pow(cursorPosition.x - psm.startPos.x, 2) + Math.pow(cursorPosition.y - psm.startPos.y, 2));
                if (dist > 0.01) psm.state = 'PINCH_DRAG';
              }
            } else if (psm.state === 'PINCH_HOLD') {
              if (psm.startPos && cursorPosition) {
                const dist = Math.sqrt(Math.pow(cursorPosition.x - psm.startPos.x, 2) + Math.pow(cursorPosition.y - psm.startPos.y, 2));
                if (dist > 0.015) psm.state = 'PINCH_DRAG';
              }
            }
          } else {
            if (psm.state === 'PINCH_START' || psm.state === 'PINCH_HOLD' || psm.state === 'PINCH_DRAG') {
              psm.state = 'PINCH_RELEASE';
              psm.startTime = now;
            } else if (psm.state === 'PINCH_RELEASE') {
              if (now - psm.startTime > 150) {
                psm.state = 'IDLE';
              }
            }
          }

          if (psm.state !== 'IDLE') {
            interactionState = psm.state;
          } else if (activeGesture === 'INDEX POINTER') {
            interactionState = 'HOVERING';
          } else if (activeGesture === 'TWO FINGER SCROLL') {
            interactionState = 'SCROLL';
          } else if (activeGesture === 'TWO FINGER NAVIGATION') {
            interactionState = 'TRACKING';
          } else if (activeGesture === 'OPEN PALM') {
            interactionState = 'TRACKING';
          } else if (activeGesture === 'FIST') {
            interactionState = 'IDLE';
          } else {
            interactionState = 'TRACKING';
          }
        }

        // --- Cursor Magnetism, Hover detection and Selection click flow ---
        if (interactionState === 'HOVERING' && cursorPosition) {
          const mag = getMagneticAdjustment(cursorPosition.x, cursorPosition.y);
          if (mag && mag.element) {
            interactionState = 'HOVERING';
            
            // Subtle magnetic pull
            cursorPosition = { x: mag.x, y: mag.y, z: cursorPosition ? cursorPosition.z : 0.1 };
            lastHoveredElementRef.current = mag.element as any;
            
            // Smoothly increment hover progress (1.0 in 600ms)
            if (hoverProgressRef.current === 0) {
              hoverStartTimeRef.current = now;
              hoverProgressRef.current = 0.01;
            } else {
              const elapsed = now - hoverStartTimeRef.current;
              hoverProgressRef.current = Math.min(elapsed / 600, 1.0);
            }
            hoverProgress = hoverProgressRef.current;
            
            // Get bounding client rect for holographic outline
            const r = (mag.element as Element).getBoundingClientRect();
            hoveredRect = { top: r.top, left: r.left, width: r.width, height: r.height };
          } else {
            lastHoveredElementRef.current = null;
            hoverProgressRef.current = 0;
          }
        } else if (interactionState.startsWith('PINCH_') && interactionState !== 'PINCH_RELEASE' && lastHoveredElementRef.current) {
          // Carry hover target and progress over into select
          hoverProgress = 1.0;
          if (lastHoveredElementRef.current) {
            const elToClick = lastHoveredElementRef.current;
            const r = (elToClick as Element).getBoundingClientRect();
            hoveredRect = { top: r.top, left: r.left, width: r.width, height: r.height };
            
            // Pinch Hold Confirmation Process
            if (pinchStartTimeRef.current === 0) {
              pinchStartTimeRef.current = now;
            }
            const pinchElapsed = now - pinchStartTimeRef.current;
            if (pinchElapsed >= 150) { // 150ms stable pinch hold
              if (!clickExecutedRef.current) {
                clickExecutedRef.current = true;
                
                // Pulsate/Confirm visually!
                const screenX = cursorPosition ? (1 - cursorPosition.x) * window.innerWidth : 0;
                const screenY = cursorPosition ? cursorPosition.y * window.innerHeight : 0;
                window.dispatchEvent(new CustomEvent('advis-selection-success', {
                  detail: { x: screenX, y: screenY }
                }));

                // Programmatically trigger button action ONCE and clear hover target
                lastHoveredElementRef.current = null;
                elToClick.click();
              }
            }
          }
        } else {
          // Reset progress and clicks when leaving pointer/hover/select states
          if ((interactionState as string) !== 'HOVER') {
            hoverProgressRef.current = 0;
          }
          if (activeGesture !== 'PINCH') {
            clickExecutedRef.current = false;
            pinchStartTimeRef.current = 0;
            lastHoveredElementRef.current = null;
          }
        }

        return {
          ...prev,
          state: 'TRACKING',
          interactionState,
          handsDetected: numHands,
          landmarks: state.hands.map(h => h.landmarks),
          fps: frameCountRef.current,
          confidence,
          gesture: activeGesture,
          rawGesture,
          cursorPosition,
          scrollPosition,
          pinchDistance: pinchDist,
          twoFingerDistance: smoothedRef.current.twoFingerDist,
          handRotation: numHands === 1 ? smoothedRef.current.oneHandRot : smoothedRef.current.twoHandRot,
          fistRotationDelta: fistRotDelta,
          fistHoldProgress,
          leftHandPosition: lHandPos,
          rightHandPosition: rHandPos,
          handsDistance: handsDist,
          hoverProgress,
          hoveredRect
        };
      } else {
        if (lossBufferStartTimeRef.current === 0) {
          lossBufferStartTimeRef.current = now;
        }
        if (now - lossBufferStartTimeRef.current < 450) {
          // Buffer tracking loss for 450ms to prevent jitter and unwanted pausing
          return prev;
        }

        gestureLockRef.current.candidate = 'NONE';
        gestureLockRef.current.locked = 'NONE';
        kalmanX.current.reset();
        kalmanY.current.reset();
              kalmanZ.current.reset();
        scrollKalmanX.current.reset();
        scrollKalmanY.current.reset();
              scrollKalmanZ.current.reset();
        smoothedRef.current.wasScrolling = false;
        lastHoveredElementRef.current = null;
        hoverProgressRef.current = 0;
        clickExecutedRef.current = false;
        pinchStartTimeRef.current = 0;
        
        const targetState = prev.state === 'TRACKING' ? 'LOST' : prev.state === 'LOST' ? 'LOST' : prev.state === 'OFF' ? 'OFF' : 'SEARCHING';
        
        if (
          prev.state === targetState &&
          prev.interactionState === 'PAUSED' && prev.handsDetected === 0
        ) {
          return prev;
        }
        
        return {
          ...prev,
          state: targetState,
          interactionState: 'PAUSED',
          handsDetected: 0
        };
      }
    });
    };

    if (enabled && handState.timestamp > 0) {
      processHands(handState);
    } else if (!enabled) {
      // Clear data if disabled
      setData(prev => {
        if (prev.state === 'OFF' && prev.handsDetected === 0 && prev.landmarks.length === 0 && prev.gesture === 'NONE' && prev.cursorPosition === null && prev.scrollPosition === null) {
          return prev;
        }
        return { 
           ...prev, 
           state: 'OFF', 
           handsDetected: 0, 
           landmarks: [],
          gesture: 'NONE',
          cursorPosition: null,
          scrollPosition: null
        };
      });
    }
  }, [handState, enabled]);
  return data;
}

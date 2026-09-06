import { useState, useEffect, useRef, useCallback } from 'react';
import { useTrackingState, NormalizedHandState } from './TrackingProvider';
import { getDistance, isFingerExtended, isThumbExtended, getHandRotation } from './gestureUtils';

export type TrackingState = 'OFF' | 'SEARCHING' | 'TRACKING' | 'LOST';

export type InteractionState = 
  | 'IDLE'
  | 'TRACKING'
  | 'HOVERING'
  | 'PINCH_DRAG'
  | 'TWO_HAND_INTERACTION'
  | 'PAUSED';

export type GestureType = 
  | 'NONE'
  | 'OPEN PALM'
  | 'PINCH'
  | 'TAP'
  | 'FIST'
  | 'SWIPE'
  | 'TWO HAND SCALE';

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

  // Barehands Quick-Pinch Tap Tracker
  const tapTrackerRef = useRef<{
    pinching: boolean;
    startTime: number;
    startX: number;
    startY: number;
    lastTapTime: number;
  }>({ pinching: false, startTime: 0, startX: 0, startY: 0, lastTapTime: 0 });


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
          
          const rawRotation = getHandRotation(lm);
          rawCursor = { x: lm[8].x, y: lm[8].y, z: getDistance(lm[0], lm[9]) };

          // 1. PINCH & TAP: Forgiving thumb-to-index or thumb-to-middle distance
          const thumbTip = lm[4];
          const indexTip = lm[8];
          const middleTip = lm[12];
          const dThumbIndex = getDistance(thumbTip, indexTip);
          const dThumbMiddle = getDistance(thumbTip, middleTip);
          pinchDist = Math.min(dThumbIndex, dThumbMiddle);

          const isPinch = pinchDist < 0.075;

          // Quick-pinch Tap Detection (touch and release fast, < 360ms, minimal travel)
          let isTapThisFrame = false;
          if (isPinch) {
            if (!tapTrackerRef.current.pinching) {
              tapTrackerRef.current.pinching = true;
              tapTrackerRef.current.startTime = now;
              tapTrackerRef.current.startX = rawCursor.x;
              tapTrackerRef.current.startY = rawCursor.y;
            }
          } else {
            if (tapTrackerRef.current.pinching) {
              tapTrackerRef.current.pinching = false;
              const pinchDuration = now - tapTrackerRef.current.startTime;
              const pinchTravel = Math.hypot(rawCursor.x - tapTrackerRef.current.startX, rawCursor.y - tapTrackerRef.current.startY);

              if (pinchDuration >= 35 && pinchDuration <= 360 && pinchTravel < 0.045 && (now - tapTrackerRef.current.lastTapTime > 180)) {
                tapTrackerRef.current.lastTapTime = now;
                isTapThisFrame = true;

                const screenX = (1 - rawCursor.x) * window.innerWidth;
                const screenY = rawCursor.y * window.innerHeight;

                // Dispatch instant tap event
                window.dispatchEvent(new CustomEvent('advis-tap', {
                  detail: {
                    x: rawCursor.x,
                    y: rawCursor.y,
                    screenX,
                    screenY,
                    duration: pinchDuration,
                    timestamp: now
                  }
                }));

                // Instant click if hovering UI element
                if (lastHoveredElementRef.current) {
                  window.dispatchEvent(new CustomEvent('advis-selection-success', {
                    detail: { x: screenX, y: screenY }
                  }));
                  (lastHoveredElementRef.current as HTMLElement).click();
                }
              }
            }
          }

          // 2. FIST: All fingers curled into palm, instant pause/freeze safety
          const isIndex = isFingerExtended(lm, 5);
          const isMiddle = isFingerExtended(lm, 9);
          const isRing = isFingerExtended(lm, 13);
          const isPinky = isFingerExtended(lm, 17);
          const extendedCount = (isIndex ? 1 : 0) + (isMiddle ? 1 : 0) + (isRing ? 1 : 0) + (isPinky ? 1 : 0);
          const isFist = extendedCount === 0;

          if (isTapThisFrame) {
            rawGesture = 'TAP';
          } else if (isPinch) {
            rawGesture = 'PINCH';
          } else if (isFist) {
            rawGesture = 'FIST';
          } else {
            // Baseline default: OPEN PALM (Orbit/Rotate model from any position)
            rawGesture = 'OPEN PALM';
          }

          // 3. FAST LATERAL SWIPE: Quick lateral motion of single open hand cycles next/previous model
          const swipe = swipeRef.current;
          const palmX = lm[9].x;
          const palmY = lm[9].y;

          if (rawGesture === 'OPEN PALM') {
            if (!swipe.active) {
              swipe.active = true;
              swipe.startX = palmX;
              swipe.startY = palmY;
              swipe.startTime = now;
            } else {
              const dx = palmX - swipe.startX;
              const dy = palmY - swipe.startY;
              const dt = now - swipe.startTime;

              if (dt > 40 && dt < 450) {
                const velocityX = Math.abs(dx) / dt;
                if (Math.abs(dx) > 0.10 && Math.abs(dx) > Math.abs(dy) * 1.2 && velocityX > 0.00035) {
                  if (now - swipe.lastSwipeTime > 650) {
                    const direction = dx > 0 ? 'RIGHT' : 'LEFT';
                    window.dispatchEvent(new CustomEvent('advis-model-cycle', { detail: { direction } }));
                    swipe.lastSwipeTime = now;
                    swipe.active = false;
                    rawGesture = 'SWIPE';
                  }
                }
              } else if (dt >= 450) {
                swipe.startX = palmX;
                swipe.startY = palmY;
                swipe.startTime = now;
              }
            }
          } else {
            swipe.active = false;
          }

          smoothedRef.current.oneHandRot = smoothedRef.current.oneHandRot * 0.8 + rawRotation * 0.2;
          prevMetricsRef.current.handRotation = rawRotation;
          prevMetricsRef.current.handPos = lm[0];

        } else if (numHands === 2) {
          // 4. TWO HANDS: Spread apart / bring together continuous explode / assemble
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
          } else {
             smoothedRef.current.lHand = filterPos(smoothedRef.current.lHand, rawLHand);
             smoothedRef.current.rHand = filterPos(smoothedRef.current.rHand, rawRHand);
          }

          lHandPos = smoothedRef.current.lHand;
          rHandPos = smoothedRef.current.rHand;
          
          const rawHandsDist = getDistance(lm1[0], lm2[0]);
          smoothedRef.current.handsDist = smoothedRef.current.handsDist * 0.85 + rawHandsDist * 0.15;
          handsDist = smoothedRef.current.handsDist;

          rawGesture = 'TWO HAND SCALE';
          prevMetricsRef.current.handsDist = rawHandsDist;
        }
        
        // --- Fast, forgiving stabilization ---
        let stabilizedGesture = rawGesture;
        if (rawGesture === 'FIST' || rawGesture === 'TAP') {
          // FIST and TAP trigger immediately without delay
          gestureLockRef.current.locked = rawGesture;
          gestureLockRef.current.candidate = rawGesture;
          stabilizedGesture = rawGesture;
        } else {
          if (rawGesture !== gestureLockRef.current.candidate) {
            gestureLockRef.current.candidate = rawGesture;
            gestureLockRef.current.startTime = now;
          }
          if (now - gestureLockRef.current.startTime >= 75) {
            gestureLockRef.current.locked = rawGesture;
          }
          stabilizedGesture = gestureLockRef.current.locked;
        }

        const activeGesture = stabilizedGesture;

        // --- Unified Single-Hand Cursor position with Kalman smoothing ---
        if (numHands === 1) {
          const filteredX = kalmanX.current.update(rawCursor.x);
          const filteredY = kalmanY.current.update(rawCursor.y);
          const filteredZ = kalmanZ.current.update(rawCursor.z);

          const distToCursor = getDistance({ x: filteredX, y: filteredY }, smoothedRef.current.cursorPos);
          if (distToCursor > 0.005) {
            smoothedRef.current.cursorPos = {
               x: smoothedRef.current.cursorPos.x * 0.65 + filteredX * 0.35,
               y: smoothedRef.current.cursorPos.y * 0.65 + filteredY * 0.35,
               z: smoothedRef.current.cursorPos.z * 0.65 + filteredZ * 0.35
            };
          }
          cursorPosition = { ...smoothedRef.current.cursorPos };
          scrollPosition = null;
        }

        // --- Streamlined Interaction State Determination ---
        let interactionState: InteractionState = 'IDLE';
        let hoverProgress = 0;
        let hoveredRect: { top: number, left: number, width: number, height: number } | null = null;

        if (numHands === 0) {
          interactionState = 'IDLE';
        } else if (activeGesture === 'FIST') {
          interactionState = 'PAUSED';
        } else if (numHands === 2 || activeGesture === 'TWO HAND SCALE') {
          interactionState = 'TWO_HAND_INTERACTION';
        } else if (activeGesture === 'PINCH') {
          interactionState = 'PINCH_DRAG';
        } else {
          interactionState = 'TRACKING';
        }

        // --- UI Button Magnetism & Direct Pinch Click ---
        if (cursorPosition) {
          const mag = getMagneticAdjustment(cursorPosition.x, cursorPosition.y);
          if (mag && mag.element) {
            if (interactionState === 'TRACKING') {
              interactionState = 'HOVERING';
            }
            cursorPosition = { x: mag.x, y: mag.y, z: cursorPosition.z };
            lastHoveredElementRef.current = mag.element as any;
            const r = (mag.element as Element).getBoundingClientRect();
            hoveredRect = { top: r.top, left: r.left, width: r.width, height: r.height };
            hoverProgress = 1.0;

            // Direct Pinch Click on UI
            if (activeGesture === 'PINCH') {
              if (!clickExecutedRef.current) {
                clickExecutedRef.current = true;
                const screenX = (1 - cursorPosition.x) * window.innerWidth;
                const screenY = cursorPosition.y * window.innerHeight;
                window.dispatchEvent(new CustomEvent('advis-selection-success', {
                  detail: { x: screenX, y: screenY }
                }));
                (mag.element as HTMLElement).click();
              }
            }
          } else {
            lastHoveredElementRef.current = null;
          }
        }

        if (activeGesture !== 'PINCH') {
          clickExecutedRef.current = false;
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
          twoFingerDistance: 0,
          handRotation: smoothedRef.current.oneHandRot,
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

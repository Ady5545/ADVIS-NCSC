import React, { createContext, useContext, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { HandTrackingData } from './useHandTracking';

export interface GestureEngineState {
  pos: THREE.Vector3;
  rot: THREE.Vector3;
  scale: { current: number };
  energy: { current: number };
  targetPos: THREE.Vector3;
  targetRot: THREE.Vector3;
  targetScale: { current: number };
  targetEnergy: { current: number };
  cameraTarget: THREE.Vector3; // Note: Vector3 to include Z

  // Spatial Pipeline Unified Gesture State
  trackingState: 'IDLE' | 'SEARCHING' | 'TRACKING' | 'LOST' | 'OFF';
  isHandActive: boolean;
  handsCount: number;
  interactionState: string;
  cursorPosition: { x: number; y: number; z?: number } | null;
  isPinch: boolean;
  isPointing: boolean;

  // Physics, Intent & Metrics
  metrics: SpatialPhysicsMetrics;
  velocity: { velX: number; velY: number; velDist: number; velZ: number };
  dirConsistency: number;
  smartZoomScale: number;

  // Deltas & Camera
  spatialCam: {
    theta: number;
    phi: number;
    radius: number;
    targetTheta: number;
    targetPhi: number;
    targetRadius: number;
  };
  orbitDelta: { theta: number; phi: number };
  zoomDelta: number;
  rotationDelta: THREE.Vector3;
}

export interface GestureTuningConfig {
  sensitivity: {
    orbitTheta: number;
    orbitPhi: number;
    zoomTwoHand: number;
    singlePinchOrbit: number;
    singlePinchZoom: number;
  };
  velocityBoost: {
    base: number;
    multiplier: number;
  };
  damping: {
    exploration: number;
    inspection: number;
    presentation: number;
  };
  maxSpeed: {
    orbitTheta: number; // Max radians delta per frame
    orbitPhi: number;   // Max radians delta per frame
    zoom: number;       // Max distance units delta per frame
  };
  deadzone: {
    orbit: number;
    zoom: number;
  };
  nonLinearExponent: number;
}

export type SpatialContextMode = 'EXPLORATION' | 'INSPECTION' | 'PRESENTATION';

export interface SpatialPhysicsMetrics {
  mode: SpatialContextMode;
  confidence: number;
  handSpeedAvg: number;
  acceleration: number;
  precisionScale: number;
}

export const DEFAULT_GESTURE_TUNING: GestureTuningConfig = {
  sensitivity: {
    orbitTheta: 5.5,
    orbitPhi: 5.5,
    zoomTwoHand: 18.0,
    singlePinchOrbit: 5.0,
    singlePinchZoom: 14.0,
  },
  velocityBoost: {
    base: 1.0,
    multiplier: 0.18,
  },
  damping: {
    exploration: 0.13,
    inspection: 0.09,
    presentation: 0.05,
  },
  maxSpeed: {
    orbitTheta: 0.20,
    orbitPhi: 0.16,
    zoom: 1.35,
  },
  deadzone: {
    orbit: 0.0006,
    zoom: 0.0008,
  },
  nonLinearExponent: 1.35,
};

// Non-Linear response curve mapping
export function applyNonLinearCurve(val: number, deadzone: number, power: number = 1.25): number {
  const absVal = Math.abs(val);
  if (absVal <= deadzone) return 0;
  const excess = absVal - deadzone;
  const curved = Math.pow(excess * 20.0, power) / 20.0;
  return Math.sign(val) * Math.min(0.25, curved);
}

const GestureContext = createContext<GestureEngineState | null>(null);

const defaultState: GestureEngineState = {
  pos: new THREE.Vector3(0, 0, 0),
  rot: new THREE.Vector3(0, 0, 0),
  scale: { current: 1.0 },
  energy: { current: 0 },
  targetPos: new THREE.Vector3(0, 0, 0),
  targetRot: new THREE.Vector3(0, 0, 0),
  targetScale: { current: 1.0 },
  targetEnergy: { current: 0 },
  cameraTarget: new THREE.Vector3(0, 0, 15),

  trackingState: 'IDLE',
  isHandActive: false,
  handsCount: 0,
  interactionState: 'NONE',
  cursorPosition: null,
  isPinch: false,
  isPointing: false,

  metrics: {
    mode: 'EXPLORATION',
    confidence: 1.0,
    handSpeedAvg: 0.2,
    acceleration: 0,
    precisionScale: 1.0
  },
  velocity: { velX: 0, velY: 0, velDist: 0, velZ: 0 },
  dirConsistency: 1.0,
  smartZoomScale: 1.0,

  spatialCam: {
    theta: 0,
    phi: Math.PI / 2,
    radius: 15,
    targetTheta: 0,
    targetPhi: Math.PI / 2,
    targetRadius: 15
  },
  orbitDelta: { theta: 0, phi: 0 },
  zoomDelta: 0,
  rotationDelta: new THREE.Vector3(0, 0, 0)
};

export function useGestureEngine() {
  const context = useContext(GestureContext);
  return context || defaultState;
}

export function GestureProvider({ 
  children, 
  handTracking, 
  isSpatial 
}: { 
  children: React.ReactNode, 
  handTracking: HandTrackingData | null, 
  isSpatial: boolean 
}) {
  const { size } = useThree();

  const state = useRef<GestureEngineState>({
    pos: new THREE.Vector3(0, 0, 0),
    rot: new THREE.Vector3(0, 0, 0),
    scale: { current: 1.0 },
    energy: { current: 0 },
    targetPos: new THREE.Vector3(0, 0, 0),
    targetRot: new THREE.Vector3(0, 0, 0),
    targetScale: { current: 1.0 },
    targetEnergy: { current: 0 },
    cameraTarget: new THREE.Vector3(0, 0, 15),

    trackingState: 'IDLE',
    isHandActive: false,
    handsCount: 0,
    interactionState: 'NONE',
    cursorPosition: null,
    isPinch: false,
    isPointing: false,

    metrics: {
      mode: 'EXPLORATION',
      confidence: 1.0,
      handSpeedAvg: 0.2,
      acceleration: 0,
      precisionScale: 1.0
    },
    velocity: { velX: 0, velY: 0, velDist: 0, velZ: 0 },
    dirConsistency: 1.0,
    smartZoomScale: 1.0,

    spatialCam: {
      theta: 0,
      phi: Math.PI / 2,
      radius: 15,
      targetTheta: 0,
      targetPhi: Math.PI / 2,
      targetRadius: 15
    },
    orbitDelta: { theta: 0, phi: 0 },
    zoomDelta: 0,
    rotationDelta: new THREE.Vector3(0, 0, 0)
  }).current;

  const physics = useRef({
    posX: { vel: 0 }, posY: { vel: 0 }, posZ: { vel: 0 },
    rotX: { vel: 0 }, rotY: { vel: 0 }, rotZ: { vel: 0 },
    scale: { vel: 0 }, energy: { vel: 0 }
  }).current;

  const velocityRot = useRef(new THREE.Vector3(0, 0, 0));
  const lastHandsMidpoint = useRef<THREE.Vector3 | null>(null);
  const lastHandRotation = useRef<number | null>(null);

  // Neutral reference point for two-hand delta-based zoom
  const initialHandsDistRef = useRef<number | null>(null);
  const initialTargetRadiusRef = useRef<number | null>(null);

  // V7 Adaptive Calibration & Physics Metrics
  const adaptiveSpeedAvg = useRef<number>(0.2);
  const prevVelocity = useRef<{ velX: number; velY: number; velDist: number; velZ: number }>({ velX: 0, velY: 0, velDist: 0, velZ: 0 });
  const prevDirVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const physicsMetrics = useRef<SpatialPhysicsMetrics>({
    mode: 'EXPLORATION',
    confidence: 1.0,
    handSpeedAvg: 0.2,
    acceleration: 0,
    precisionScale: 1.0
  });

  useFrame((threeState, delta) => {
    const dt = Math.min(delta, 0.033);
    const spatialCam = state.spatialCam;

    // Sync basic hand tracking properties to state ref
    const isHandActive = !!(handTracking && handTracking.state === 'TRACKING');
    const trackingState: 'IDLE' | 'SEARCHING' | 'TRACKING' | 'LOST' | 'OFF' = handTracking ? handTracking.state : 'IDLE';
    const handsCount = isHandActive ? (handTracking.handsDetected || (handTracking.landmarks ? handTracking.landmarks.length : 0)) : 0;
    const interactionState = (isHandActive && handTracking.interactionState) ? handTracking.interactionState : 'NONE';
    const cursorPosition = (isHandActive && handTracking.cursorPosition) ? handTracking.cursorPosition : null;

    const isPinchGrab = interactionState === 'GRABBING OBJECT';
    const isPinch = isHandActive && (isPinchGrab || !!(handTracking.pinchDistance && handTracking.pinchDistance < 0.05));
    const isPointing = isHandActive && (interactionState === 'POINTING' || isPinchGrab);

    state.trackingState = trackingState;
    state.isHandActive = isHandActive;
    state.handsCount = handsCount;
    state.interactionState = interactionState;
    state.cursorPosition = cursorPosition;
    state.isPinch = isPinch;
    state.isPointing = isPointing;

    // 1. Spatial Inspection Mode vs Non-Spatial Core Mode
    if (isSpatial) {
      // Determine Context Awareness Mode (EXPLORATION vs INSPECTION)
      let currentMode: SpatialContextMode = 'EXPLORATION';
      if (spatialCam.radius <= 12.0 || (adaptiveSpeedAvg.current < 0.12 && spatialCam.radius <= 18.0)) {
        currentMode = 'INSPECTION';
      }
      physicsMetrics.current.mode = currentMode;

      // Select Mode Damping & Precision Scale
      const currentDamping = currentMode === 'INSPECTION'
        ? DEFAULT_GESTURE_TUNING.damping.inspection
        : DEFAULT_GESTURE_TUNING.damping.exploration;

      const precisionScale = currentMode === 'INSPECTION'
        ? Math.max(0.35, Math.min(0.85, spatialCam.radius / 12.0))
        : 1.0;
      physicsMetrics.current.precisionScale = precisionScale;

      // Smart Zoom Sensitivity Factor (scales depth responsiveness with proximity)
      const smartZoomScale = THREE.MathUtils.clamp(spatialCam.radius / 10.0, 0.4, 2.5);

      let curDeltaTheta = 0;
      let curDeltaPhi = 0;
      let curDeltaRadius = 0;

      if (isHandActive) {
        const { leftHandPosition, rightHandPosition, handsDistance } = handTracking;
        const numHands = handsCount;

        const leftHandPos = leftHandPosition;
        const rightHandPos = rightHandPosition;
        const bothHandsOpen = (numHands === 2 || (leftHandPos && rightHandPos)) && !isPinch;

        console.log('[GESTURE OWNERSHIP DEBUG]', {
          handsCount: numHands,
          leftPinch: leftHandPos ? isPinch : false,
          rightPinch: rightHandPos ? isPinch : false,
          bothHandsOpen,
          activeGestureOwner: bothHandsOpen ? 'TWO_HAND_CAMERA' : (isPinch ? 'SINGLE_HAND_ROTATION' : 'IDLE'),
          singleHandRotationActive: isPinch,
          twoHandZoomActive: bothHandsOpen,
          zoomMultiplierUsed: 15.0
        });

        // 1. Two Hand Mode: Distance Delta = Zoom (P1), Movement = Rotation/Orbit
        if (bothHandsOpen) {
          const lPos = leftHandPosition || { x: 0.3, y: 0.5 };
          const rPos = rightHandPosition || { x: 0.7, y: 0.5 };
          const currentHandsDist = handsDistance || Math.hypot(lPos.x - rPos.x, lPos.y - rPos.y);
          const centerX = (lPos.x + rPos.x) / 2;
          const centerY = (lPos.y + rPos.y) / 2;

          // Record neutral reference point when entering two-hand zoom mode
          if (initialHandsDistRef.current === null || initialTargetRadiusRef.current === null) {
            initialHandsDistRef.current = currentHandsDist;
            initialTargetRadiusRef.current = spatialCam.targetRadius;
          }

          // --- Priority 1: Delta-based Two-Hand Zoom relative to initial reference distance ---
          const rawDistDelta = currentHandsDist - initialHandsDistRef.current;
          const DEADZONE_ZOOM = 0.015; // Ignore small distance fluctuations and noise

          if (Math.abs(rawDistDelta) > DEADZONE_ZOOM) {
            const effectiveDistDelta = rawDistDelta - Math.sign(rawDistDelta) * DEADZONE_ZOOM;
            const BASE_ZOOM_SENSITIVITY = 12.0;

            // Hands moving apart from starting distance (rawDistDelta > 0) = Zoom IN (targetRadius DECREASES)
            // Hands moving closer from starting distance (rawDistDelta < 0) = Zoom OUT (targetRadius INCREASES)
            const targetRadiusFromInitial = initialTargetRadiusRef.current - (effectiveDistDelta * BASE_ZOOM_SENSITIVITY * smartZoomScale);
            const clampedTargetRadius = THREE.MathUtils.clamp(targetRadiusFromInitial, 3.0, 38.0);

            curDeltaRadius = clampedTargetRadius - spatialCam.targetRadius;
            spatialCam.targetRadius = clampedTargetRadius;
          } else {
            // Inside deadzone: camera maintains target zoom steadily without drift
            curDeltaRadius = 0;
          }

          if (lastHandsMidpoint.current === null) {
            lastHandsMidpoint.current = new THREE.Vector3(centerX, centerY, currentHandsDist);
          } else {
            const dx = centerX - lastHandsMidpoint.current.x;
            const dy = centerY - lastHandsMidpoint.current.y;

            const velX = dx / dt;
            const velY = dy / dt;
            const velDist = rawDistDelta / dt;

            // --- Priority 2: Two hands moving together = Rotation/Orbit ---
            const DEADZONE_ORBIT = 0.0006;
            if (Math.hypot(dx, dy) > DEADZONE_ORBIT) {
              if (Math.abs(dx) > DEADZONE_ORBIT) {
                let deltaTheta = dx * DEFAULT_GESTURE_TUNING.sensitivity.orbitTheta * precisionScale;
                deltaTheta = THREE.MathUtils.clamp(deltaTheta, -DEFAULT_GESTURE_TUNING.maxSpeed.orbitTheta, DEFAULT_GESTURE_TUNING.maxSpeed.orbitTheta);
                spatialCam.targetTheta += deltaTheta;
                curDeltaTheta = deltaTheta;
              }

              if (Math.abs(dy) > DEADZONE_ORBIT) {
                let deltaPhi = -dy * DEFAULT_GESTURE_TUNING.sensitivity.orbitPhi * precisionScale;
                deltaPhi = THREE.MathUtils.clamp(deltaPhi, -DEFAULT_GESTURE_TUNING.maxSpeed.orbitPhi, DEFAULT_GESTURE_TUNING.maxSpeed.orbitPhi);
                spatialCam.targetPhi = THREE.MathUtils.clamp(spatialCam.targetPhi + deltaPhi, 0.15, Math.PI - 0.15);
                curDeltaPhi = deltaPhi;
              }
            }

            prevVelocity.current = { velX, velY, velDist, velZ: 0 };
            lastHandsMidpoint.current.set(centerX, centerY, currentHandsDist);
          }
        } 
        // 2. Single Hand Mode (Never trigger zoom with one hand, reset two-hand zoom reference)
        else if (numHands === 1 && cursorPosition) {
          initialHandsDistRef.current = null;
          initialTargetRadiusRef.current = null;

          if (lastHandsMidpoint.current === null) {
            lastHandsMidpoint.current = new THREE.Vector3(cursorPosition.x, cursorPosition.y, 0);
          } else {
            const dx = cursorPosition.x - lastHandsMidpoint.current.x;
            const dy = cursorPosition.y - lastHandsMidpoint.current.y;

            const velX = dx / dt;
            const velY = dy / dt;
            const rawSpeed = Math.hypot(velX, velY);

            // --- Priority 2: One-Hand Open Palm = Rotation/Orbit from any hand position ---
            const isPalmGesture = handTracking.gesture === 'OPEN PALM' || interactionState === 'HAND DETECTED';
            if (isPalmGesture) {
              const DEADZONE_ORBIT = 0.0006;
              if (Math.hypot(dx, dy) > DEADZONE_ORBIT) {
                const curvedDx = applyNonLinearCurve(dx, DEADZONE_ORBIT, DEFAULT_GESTURE_TUNING.nonLinearExponent);
                const curvedDy = applyNonLinearCurve(dy, DEADZONE_ORBIT, DEFAULT_GESTURE_TUNING.nonLinearExponent);

                const orbitSpeedMult = DEFAULT_GESTURE_TUNING.velocityBoost.base + Math.min(1.8, rawSpeed * DEFAULT_GESTURE_TUNING.velocityBoost.multiplier);

                if (Math.abs(dx) > DEADZONE_ORBIT) {
                  let deltaTheta = curvedDx * DEFAULT_GESTURE_TUNING.sensitivity.orbitTheta * orbitSpeedMult * precisionScale;
                  deltaTheta = THREE.MathUtils.clamp(deltaTheta, -DEFAULT_GESTURE_TUNING.maxSpeed.orbitTheta, DEFAULT_GESTURE_TUNING.maxSpeed.orbitTheta);
                  spatialCam.targetTheta += deltaTheta;
                  curDeltaTheta = deltaTheta;
                }

                if (Math.abs(dy) > DEADZONE_ORBIT) {
                  let deltaPhi = -curvedDy * DEFAULT_GESTURE_TUNING.sensitivity.orbitPhi * orbitSpeedMult * precisionScale;
                  deltaPhi = THREE.MathUtils.clamp(deltaPhi, -DEFAULT_GESTURE_TUNING.maxSpeed.orbitPhi, DEFAULT_GESTURE_TUNING.maxSpeed.orbitPhi);
                  spatialCam.targetPhi = THREE.MathUtils.clamp(spatialCam.targetPhi + deltaPhi, 0.15, Math.PI - 0.15);
                  curDeltaPhi = deltaPhi;
                }
              }
            }
            // --- Priority 3: Index Pointing = Selection (Raycast cursor only, no camera movement) ---
            // --- Priority 4: Pinch = Manipulation (Intentional object grab, stable pinch detection, no camera zoom) ---

            // Single hand NEVER alters camera radius (zoom)
            curDeltaRadius = 0;

            prevVelocity.current = { velX, velY, velDist: 0, velZ: 0 };
            lastHandsMidpoint.current.set(cursorPosition.x, cursorPosition.y, 0);
          }
        } 
        // 3. Hand Active but idle
        else {
          initialHandsDistRef.current = null;
          initialTargetRadiusRef.current = null;
          lastHandsMidpoint.current = null;
          lastHandRotation.current = null;
        }
      } else {
        // HAND LOSS / FROZEN INSPECTION STATE:
        // Preserve last valid camera targets so camera continues interpolating smoothly and freezes naturally when target is reached.
        initialHandsDistRef.current = null;
        initialTargetRadiusRef.current = null;
        lastHandsMidpoint.current = null;
        lastHandRotation.current = null;
      }

      // Smoothly interpolate inspection camera spherical coordinates using context-adaptive low-pass damping
      spatialCam.theta += (spatialCam.targetTheta - spatialCam.theta) * currentDamping;
      spatialCam.phi += (spatialCam.targetPhi - spatialCam.phi) * currentDamping;
      spatialCam.radius += (spatialCam.targetRadius - spatialCam.radius) * Math.max(currentDamping, 0.18);

      // Compute 3D camera position orbiting fixed hologram at origin [0,0,0]
      const camX = spatialCam.radius * Math.sin(spatialCam.phi) * Math.sin(spatialCam.theta);
      const camY = spatialCam.radius * Math.cos(spatialCam.phi);
      const camZ = spatialCam.radius * Math.sin(spatialCam.phi) * Math.cos(spatialCam.theta);

      state.cameraTarget.set(camX, camY, camZ);
      state.targetPos.set(0, 0, 0);
      state.targetRot.set(0, 0, 0);
      state.targetScale.current = 1.0;

      // Update gesture engine metrics
      state.metrics = { ...physicsMetrics.current };
      state.velocity = { ...prevVelocity.current };
      state.dirConsistency = prevDirVector.current.x ? Math.max(0, prevDirVector.current.x) : 1.0;
      state.smartZoomScale = smartZoomScale;
      state.orbitDelta = { theta: curDeltaTheta, phi: curDeltaPhi };
      state.zoomDelta = curDeltaRadius;
      state.spatialCam = {
        theta: spatialCam.theta,
        phi: spatialCam.phi,
        radius: spatialCam.radius,
        targetTheta: spatialCam.targetTheta,
        targetPhi: spatialCam.targetPhi,
        targetRadius: spatialCam.targetRadius,
      };
      if (handTracking && handTracking.handRotation !== undefined) {
        state.rotationDelta.z = handTracking.handRotation;
      }

      // Developer Console Debug Logging
      if (Math.random() < 0.04) {
        console.log('[GESTURE STATE DEBUG]', {
          handsCount: state.handsCount,
          isHandActive: state.isHandActive,
          isPointing: state.isPointing,
          isPinch: state.isPinch,
          isTwoHand: state.handsCount === 2 || interactionState === 'TWO HAND CONTROL',
          interactionState: state.interactionState,
          contextMode: physicsMetrics.current.mode,
          confidence: Number(physicsMetrics.current.confidence.toFixed(2)),
          cameraOrbitDelta: { theta: Number(curDeltaTheta.toFixed(4)), phi: Number(curDeltaPhi.toFixed(4)) },
          zoomDelta: Number(curDeltaRadius.toFixed(4)),
          rotationDelta: Number(state.rotationDelta.z.toFixed(4)),
        });
      }
    } else {
      // --- NON-SPATIAL HOLOGRAM PIPELINE ---
      if (handTracking && handTracking.state === 'TRACKING') {
        const { gesture, handRotation, leftHandPosition, rightHandPosition, handsDistance, twoFingerDistance, pinchDistance } = handTracking;

        if (handTracking.landmarks && handTracking.landmarks[0] && handTracking.landmarks[0][9]) {
          const hand = handTracking.landmarks[0][9];
          state.cameraTarget.x = (hand.x - 0.5) * 30;
          state.cameraTarget.y = (hand.y - 0.5) * 30;
          state.cameraTarget.z = 15 - ((pinchDistance || 0) * 20);
        } else {
          state.cameraTarget.x = (threeState.pointer.x * size.width) / -100;
          state.cameraTarget.y = (threeState.pointer.y * size.height) / -100;
          state.cameraTarget.z = 15;
        }

        if (gesture === 'TWO FINGER ROTATION') {
          state.targetRot.z = -handRotation;
        } else if (gesture === 'TWO HAND ENERGY') {
          state.targetEnergy.current = Math.max(0, 1 - handsDistance * 2);
          state.targetScale.current = 1.0 + state.targetEnergy.current * 0.5;
        } else if (leftHandPosition && rightHandPosition) {
          if (gesture === 'TWO HAND POSITION') {
            const centerX = (leftHandPosition.x + rightHandPosition.x) / 2;
            const centerY = (leftHandPosition.y + rightHandPosition.y) / 2;
            state.targetPos.x = (centerX - 0.5) * 10;
            state.targetPos.y = -(centerY - 0.5) * 10;
          } else if (gesture === 'TWO HAND SCALE') {
            state.targetScale.current = Math.max(0.5, Math.min(3.0, handsDistance * 3.5));
          } else if (gesture === 'TWO HAND ROTATE') {
            state.targetRot.x = (leftHandPosition.y - rightHandPosition.y) * 2.5;
            state.targetRot.y = (leftHandPosition.x - rightHandPosition.x) * 2.5;
          } else if (gesture === 'TWO HAND GRAB') {
            state.targetEnergy.current = 0.5;
            state.targetScale.current = 1.05;
          }
        } else if (gesture === 'TWO FINGER ZOOM') {
          state.targetScale.current = Math.max(0.5, Math.min(2.5, twoFingerDistance * 5));
        } else if (gesture === 'FIST') {
          // Locked
        } else {
          state.targetRot.x = threeState.pointer.y * 0.4;
          state.targetRot.y = threeState.pointer.x * 0.4;
          state.targetScale.current = 1.0;
          state.targetPos.set(0, 0, 0);
          state.targetEnergy.current = 0;
        }
      } else {
        // Idle / Lost Tracking
        state.cameraTarget.x = threeState.pointer.x * 1.5;
        state.cameraTarget.y = threeState.pointer.y * 1.5;
        state.cameraTarget.z = 15;
        
        state.targetRot.x = threeState.pointer.y * 0.4;
        state.targetRot.y = threeState.pointer.x * 0.4;
        state.targetScale.current = 1.0;
        state.targetPos.set(0, 0, 0);
        state.targetEnergy.current = 0;
      }
    }

    // 2. Apply Physics / Smoothing
    const updateSpring = (current: number, target: number, velObj: { vel: number }, stiffness: number, damping: number) => {
      const force = stiffness * (target - current);
      const accel = force - damping * velObj.vel;
      velObj.vel += accel * dt;
      return current + velObj.vel * dt;
    };

    if (isSpatial) {
      state.pos.x += (state.targetPos.x - state.pos.x) * 0.25;
      state.pos.y += (state.targetPos.y - state.pos.y) * 0.25;
      state.pos.z += (state.targetPos.z - state.pos.z) * 0.25;
      state.rot.x += (state.targetRot.x - state.rot.x) * 0.18;
      state.rot.y += (state.targetRot.y - state.rot.y) * 0.18;
      state.rot.z += (state.targetRot.z - state.rot.z) * 0.18;
      state.scale.current += (state.targetScale.current - state.scale.current) * 0.2;
    } else {
      state.pos.x = updateSpring(state.pos.x, state.targetPos.x, physics.posX, 120, 14);
      state.pos.y = updateSpring(state.pos.y, state.targetPos.y, physics.posY, 120, 14);
      state.pos.z = updateSpring(state.pos.z, state.targetPos.z, physics.posZ, 120, 14);
      state.rot.x = updateSpring(state.rot.x, state.targetRot.x, physics.rotX, 100, 12);
      state.rot.y = updateSpring(state.rot.y, state.targetRot.y, physics.rotY, 100, 12);
      state.rot.z = updateSpring(state.rot.z, state.targetRot.z, physics.rotZ, 100, 12);
      state.scale.current = updateSpring(state.scale.current, state.targetScale.current, physics.scale, 100, 12);
      state.energy.current = updateSpring(state.energy.current, state.targetEnergy.current, physics.energy, 100, 12);
    }
  });

  return (
    <GestureContext.Provider value={state}>
      {children}
    </GestureContext.Provider>
  );
}

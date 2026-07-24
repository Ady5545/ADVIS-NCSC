import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { HandTrackingData } from './useHandTracking';

export interface GestureEngineState {
  // Smoothed physics-based values for rendering
  pos: THREE.Vector3;
  rot: THREE.Vector3;
  scale: { current: number };
  energy: { current: number };

  // The raw targets the engine is driving towards
  targetPos: THREE.Vector3;
  targetRot: THREE.Vector3;
  targetScale: { current: number };
  targetEnergy: { current: number };

  // Camera parallax targets
  cameraTarget: THREE.Vector2;
}

export function useGestureEngine(
  handTracking: HandTrackingData | null,
  isSpatial: boolean
): GestureEngineState {
  const { size } = useThree();

  // Targets
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetRot = useRef(new THREE.Vector3(0, 0, 0));
  const targetScale = useRef({ current: 1.0 });
  const targetEnergy = useRef({ current: 0 });
  const cameraTarget = useRef(new THREE.Vector2(0, 0));

  // Current values (smoothed)
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const rot = useRef(new THREE.Vector3(0, 0, 0));
  const scale = useRef({ current: 1.0 });
  const energy = useRef({ current: 0 });

  // Physics state
  const physics = useRef({
    posX: { vel: 0 }, posY: { vel: 0 }, posZ: { vel: 0 },
    rotX: { vel: 0 }, rotY: { vel: 0 }, rotZ: { vel: 0 },
    scale: { vel: 0 }, energy: { vel: 0 },
    camX: { vel: 0, current: 0 }, camY: { vel: 0, current: 0 }
  });

  // Inertia state for spatial interactions
  const velocityRot = useRef(new THREE.Vector3(0, 0, 0));
  const lastHandsMidpoint = useRef<THREE.Vector3 | null>(null);
  const lastHandRotation = useRef<number | null>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);

    // 1. Calculate Targets
    if (handTracking && handTracking.state === 'TRACKING') {
      const { gesture, handRotation, leftHandPosition, rightHandPosition, handsDistance, interactionState, cursorPosition, twoFingerDistance } = handTracking;

      const isObjectControl = interactionState === 'TWO HAND CONTROL' &&
                              (gesture.startsWith('TWO HAND') || gesture === 'CLAP');
      const isPinchGrab = interactionState === 'GRABBING OBJECT';

      // --- Camera Parallax ---
      if (handTracking.landmarks && handTracking.landmarks[0] && handTracking.landmarks[0][9]) {
        const hand = handTracking.landmarks[0][9];
        cameraTarget.current.x = (hand.x - 0.5) * 30;
        cameraTarget.current.y = (hand.y - 0.5) * 30;
      } else {
        cameraTarget.current.x = (state.pointer.x * size.width) / -100;
        cameraTarget.current.y = (state.pointer.y * size.height) / -100;
      }

      // --- Core / Spatial Transform Mapping ---
      if (isSpatial) {
        if (leftHandPosition && rightHandPosition) {
          if (gesture === 'TWO HAND POSITION') {
            const centerX = (leftHandPosition.x + rightHandPosition.x) / 2;
            const centerY = (leftHandPosition.y + rightHandPosition.y) / 2;
            targetPos.current.x = (centerX - 0.5) * 10;
            targetPos.current.y = -(centerY - 0.5) * 10;
          } else if (gesture === 'TWO HAND SCALE') {
            targetScale.current.current = Math.max(0.5, Math.min(3.0, handsDistance * 3.5));
          } else if (gesture === 'TWO HAND ROTATE') {
            targetRot.current.x = (leftHandPosition.y - rightHandPosition.y) * 2.5;
            targetRot.current.y = (leftHandPosition.x - rightHandPosition.x) * 2.5;
          }
        } else if (gesture === 'TWO FINGER ZOOM') {
          targetScale.current.current = Math.max(0.5, Math.min(2.5, twoFingerDistance * 5));
        } else if (gesture === 'TWO FINGER ROTATION') {
          targetRot.current.z = -handRotation;
        }

        if (isPinchGrab && cursorPosition) {
          if (lastHandsMidpoint.current === null) {
            lastHandsMidpoint.current = new THREE.Vector3(cursorPosition.x, cursorPosition.y, cursorPosition.z);
            lastHandRotation.current = handRotation;
          } else {
            const dx = cursorPosition.x - lastHandsMidpoint.current.x;
            const dy = cursorPosition.y - lastHandsMidpoint.current.y;
            const dz = cursorPosition.z - lastHandsMidpoint.current.z;

            if (lastHandRotation.current !== null) {
              let rotDelta = handRotation - lastHandRotation.current;
              while (rotDelta < -Math.PI) rotDelta += 2 * Math.PI;
              while (rotDelta > Math.PI) rotDelta -= 2 * Math.PI;
              velocityRot.current.y += rotDelta * 0.15;
            }

            const sensitivity = 10.0;
            const zSensitivity = 30.0;
            
            targetPos.current.x -= dx * sensitivity;
            targetPos.current.y -= dy * sensitivity;
            targetPos.current.z += dz * zSensitivity;

            lastHandsMidpoint.current.set(cursorPosition.x, cursorPosition.y, cursorPosition.z);
            lastHandRotation.current = handRotation;
          }
        } else if (isObjectControl) {
            // Apply inertia for throwing/spinning
            const maxSpeed = 0.25;
            velocityRot.current.x = Math.max(-maxSpeed, Math.min(maxSpeed, velocityRot.current.x));
            velocityRot.current.y = Math.max(-maxSpeed, Math.min(maxSpeed, velocityRot.current.y));
            velocityRot.current.z = Math.max(-maxSpeed, Math.min(maxSpeed, velocityRot.current.z));

            targetRot.current.x += velocityRot.current.x;
            targetRot.current.y += velocityRot.current.y;
            targetRot.current.z += velocityRot.current.z;

            if (targetRot.current.x > 1.2) { targetRot.current.x = 1.2; velocityRot.current.x = 0; }
            if (targetRot.current.x < -1.2) { targetRot.current.x = -1.2; velocityRot.current.x = 0; }

            velocityRot.current.multiplyScalar(0.75);
            if (Math.abs(velocityRot.current.x) < 0.001) velocityRot.current.x = 0;
            if (Math.abs(velocityRot.current.y) < 0.001) velocityRot.current.y = 0;
            if (Math.abs(velocityRot.current.z) < 0.001) velocityRot.current.z = 0;

            lastHandsMidpoint.current = null;
            lastHandRotation.current = null;
        } else {
            velocityRot.current.set(0, 0, 0);
            lastHandsMidpoint.current = null;
            lastHandRotation.current = null;
        }

      } else {
        // --- Core Transformations ---
        if (gesture === 'TWO FINGER ROTATION') {
          targetRot.current.z = -handRotation;
        } else if (gesture === 'TWO HAND ENERGY') {
          targetEnergy.current.current = Math.max(0, 1 - handsDistance * 2);
          targetScale.current.current = 1.0 + targetEnergy.current.current * 0.5;
        } else if (leftHandPosition && rightHandPosition) {
          if (gesture === 'TWO HAND POSITION') {
            const centerX = (leftHandPosition.x + rightHandPosition.x) / 2;
            const centerY = (leftHandPosition.y + rightHandPosition.y) / 2;
            targetPos.current.x = (centerX - 0.5) * 10;
            targetPos.current.y = -(centerY - 0.5) * 10;
          } else if (gesture === 'TWO HAND SCALE') {
            targetScale.current.current = Math.max(0.5, Math.min(3.0, handsDistance * 3.5));
          } else if (gesture === 'TWO HAND ROTATE') {
            targetRot.current.x = (leftHandPosition.y - rightHandPosition.y) * 2.5;
            targetRot.current.y = (leftHandPosition.x - rightHandPosition.x) * 2.5;
          } else if (gesture === 'TWO HAND GRAB') {
            targetEnergy.current.current = 0.5;
            targetScale.current.current = 1.05;
          }
        } else if (gesture === 'TWO FINGER ZOOM') {
          targetScale.current.current = Math.max(0.5, Math.min(2.5, twoFingerDistance * 5));
        } else if (gesture === 'FIST') {
          // Locked, do nothing
        } else {
          // Default mapping based on cursor position or center proximity
          const distance = Math.sqrt(state.pointer.x * state.pointer.x + state.pointer.y * state.pointer.y);
          const proximity = Math.max(0, 1 - distance * 0.8);
          targetRot.current.x = state.pointer.y * 0.4;
          targetRot.current.y = state.pointer.x * 0.4;
          targetScale.current.current = 1.0;
          targetPos.current.set(0, 0, 0);
          targetEnergy.current.current = 0;
        }
      }
    } else {
      // Idle / Lost Tracking
      cameraTarget.current.x = (state.pointer.x * size.width) / -100;
      cameraTarget.current.y = (state.pointer.y * size.height) / -100;
      
      if (!isSpatial) {
        targetRot.current.x = state.pointer.y * 0.4;
        targetRot.current.y = state.pointer.x * 0.4;
        targetScale.current.current = 1.0;
        targetPos.current.set(0, 0, 0);
        targetEnergy.current.current = 0;
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
      // Spatial Objects use LERP for slower, mechanical presentation feel
      pos.current.x += (targetPos.current.x - pos.current.x) * 0.25;
      pos.current.y += (targetPos.current.y - pos.current.y) * 0.25;
      pos.current.z += (targetPos.current.z - pos.current.z) * 0.25;
      rot.current.x += (targetRot.current.x - rot.current.x) * 0.18;
      rot.current.y += (targetRot.current.y - rot.current.y) * 0.18;
      rot.current.z += (targetRot.current.z - rot.current.z) * 0.18;
      scale.current.current += (targetScale.current.current - scale.current.current) * 0.2;
    } else {
      // Hologram Core uses spring physics for bouncy, organic feel
      pos.current.x = updateSpring(pos.current.x, targetPos.current.x, physics.current.posX, 120, 14);
      pos.current.y = updateSpring(pos.current.y, targetPos.current.y, physics.current.posY, 120, 14);
      pos.current.z = updateSpring(pos.current.z, targetPos.current.z, physics.current.posZ, 120, 14);
      
      rot.current.x = updateSpring(rot.current.x, targetRot.current.x, physics.current.rotX, 100, 12);
      rot.current.y = updateSpring(rot.current.y, targetRot.current.y, physics.current.rotY, 100, 12);
      rot.current.z = updateSpring(rot.current.z, targetRot.current.z, physics.current.rotZ, 100, 12);
      
      scale.current.current = updateSpring(scale.current.current, targetScale.current.current, physics.current.scale, 100, 12);
      energy.current.current = updateSpring(energy.current.current, targetEnergy.current.current, physics.current.energy, 100, 12);
    }
  });

  return {
    pos: pos.current,
    rot: rot.current,
    scale: scale.current,
    energy: energy.current,
    targetPos: targetPos.current,
    targetRot: targetRot.current,
    targetScale: targetScale.current,
    targetEnergy: targetEnergy.current,
    cameraTarget: cameraTarget.current
  };
}

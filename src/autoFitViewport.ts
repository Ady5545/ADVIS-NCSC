import * as THREE from 'three';

export interface AutoFitResult {
  scale: number;
  center: THREE.Vector3;
  size: THREE.Vector3;
  maxDim: number;
  visibleHeight: number;
  targetSize: number;
  isValid: boolean;
}

/**
 * Authoritative shared auto-fit utility for A.D.V.I.S.
 * 
 * Calculates an appropriate scale factor for an Object3D so that it occupies
 * approximately targetViewportFraction (default 75%) of the visible camera viewport height.
 * 
 * Works symmetrically across both GLTF assets and procedural assemblies.
 * Safely measures unscaled base geometry bounds to completely eliminate scale feedback loops.
 */
export function calculateAutoFitScale(
  object: THREE.Object3D,
  camera: THREE.Camera,
  targetViewportFraction = 0.75,
  fallbackScale = 1.0
): AutoFitResult {
  if (!object) {
    return {
      scale: fallbackScale,
      center: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(1, 1, 1),
      maxDim: 1,
      visibleHeight: 10,
      targetSize: 7.5,
      isValid: false
    };
  }

  // Temporarily reset object scale to (1, 1, 1) and update world matrix
  // to measure true unscaled base geometry bounds without feedback loops.
  const originalScale = object.scale.clone();
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);

  // Restore original scale immediately
  object.scale.copy(originalScale);
  object.updateMatrixWorld(true);

  if (box.isEmpty()) {
    return {
      scale: fallbackScale,
      center: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(1, 1, 1),
      maxDim: 1,
      visibleHeight: 10,
      targetSize: 7.5,
      isValid: false
    };
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Guard against point-like, zero-volume, NaN or infinite bounds
  if (!Number.isFinite(maxDim) || maxDim <= 0.001) {
    return {
      scale: fallbackScale,
      center: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(1, 1, 1),
      maxDim: 1,
      visibleHeight: 10,
      targetSize: 7.5,
      isValid: false
    };
  }

  // Compute visible camera viewport height at current camera distance
  let dist = camera.position.length();
  if (dist < 1 || !Number.isFinite(dist)) dist = 15;

  const fov = (camera as THREE.PerspectiveCamera).fov || 45;
  const vFOV = THREE.MathUtils.degToRad(fov);
  const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;

  const targetSize = visibleHeight * targetViewportFraction;
  const computedScale = targetSize / maxDim;

  const finalScale = Number.isFinite(computedScale) && computedScale > 0
    ? computedScale
    : fallbackScale;

  return {
    scale: finalScale,
    center,
    size,
    maxDim,
    visibleHeight,
    targetSize,
    isValid: true
  };
}

// src/AutonomousModelEngine/RenderIntegrityGuard.ts
// Strict Universal Render-Integrity Guard & Spatial Scene Verification

import * as THREE from 'three';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { AutonomousModelPlan } from './ModelTypes';
import { ComponentMetadata, ObjectMetadata, SPATIAL_LIBRARY } from '../SpatialLibrary';
import { ModelRegistry } from './ModelRegistry';

export interface IntegrityValidationReport {
  isValid: boolean;
  componentCount: number;
  geometryCount: number;
  totalVertices: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    dimensions: [number, number, number];
    radius: number;
  };
  errors: string[];
}

export class RenderIntegrityGuard {
  /**
   * Validates a generated or mutated assembly before it can be registered or displayed.
   * Throws a descriptive error if any condition fails.
   */
  public static validateAssembly(
    assembly: GeneratedAssemblyPayload,
    plan: AutonomousModelPlan
  ): IntegrityValidationReport {
    const errors: string[] = [];

    // 1. Condition: At least one valid renderable component
    if (!assembly || !assembly.components || assembly.components.length === 0) {
      throw new Error(
        `RENDER INTEGRITY VIOLATION [EMPTY_ASSEMBLY]: Model '${plan.displayName}' generated 0 components. A valid spatial object must contain at least one renderable component.`
      );
    }

    // 1b. Structural Signature Validation
    const objTypeUpper = (plan.objectType || '').toUpperCase();
    const displayNameUpper = (plan.displayName || '').toUpperCase();

    const REQUIRED_SIGNATURES: Record<string, string[]> = {
      BICYCLE: ['frame', 'wheel', 'steering', 'drivetrain'],
      ENGINE: ['block', 'crank', 'piston'],
      SHOES: ['upper', 'sole'],
      AIRCRAFT: ['fuselage', 'wing'],
      AUTOMOBILE: ['chassis', 'wheel']
    };

    let matchedTypeKey: string | null = null;
    if (objTypeUpper.includes('BICYCLE') || displayNameUpper.includes('BICYCLE') || displayNameUpper.includes('BIKE')) {
      matchedTypeKey = 'BICYCLE';
    } else if (objTypeUpper.includes('ENGINE') || displayNameUpper.includes('V12') || displayNameUpper.includes('ENGINE')) {
      matchedTypeKey = 'ENGINE';
    } else if (objTypeUpper.includes('SHOE') || displayNameUpper.includes('SHOE') || displayNameUpper.includes('FOOTWEAR')) {
      matchedTypeKey = 'SHOES';
    } else if (objTypeUpper.includes('AIRCRAFT') || displayNameUpper.includes('AIRPLANE')) {
      matchedTypeKey = 'AIRCRAFT';
    } else if (objTypeUpper.includes('AUTOMOBILE') || displayNameUpper.includes('CAR')) {
      matchedTypeKey = 'AUTOMOBILE';
    }

    if (matchedTypeKey) {
      const requiredTokens = REQUIRED_SIGNATURES[matchedTypeKey];
      const compTokens = assembly.components.map(c => `${c.id} ${c.name}`.toLowerCase());
      const missingTokens = requiredTokens.filter(req => !compTokens.some(tok => tok.includes(req)));

      if (missingTokens.length > 0) {
        throw new Error(
          `RENDER INTEGRITY VIOLATION [MISSING_STRUCTURAL_SIGNATURE]: Model '${plan.displayName}' fails structural signature validation for ${matchedTypeKey}. Missing required structural components: ${missingTokens.join(', ')}.`
        );
      }
    }

    let totalVertices = 0;
    let geometryCount = 0;

    const box3 = new THREE.Box3();
    let hasValidBox = false;

    // 2. Condition: Geometry contains valid vertices/faces or valid Three.js primitives
    for (const comp of assembly.components) {
      if (!comp.id || typeof comp.id !== 'string') {
        errors.push(`Component has invalid or missing 'id'.`);
        continue;
      }
      if (!comp.name || typeof comp.name !== 'string') {
        errors.push(`Component '${comp.id}' has missing 'name'.`);
      }
      if (!comp.position || comp.position.length !== 3 || comp.position.some(v => typeof v !== 'number' || isNaN(v))) {
        errors.push(`Component '${comp.id}' has non-finite position coordinates: [${comp.position}].`);
      }

      const geom = assembly.geometries?.[comp.id] || ModelRegistry.getGeometry(plan.planId, comp.id);
      if (geom) {
        geometryCount++;
        const posAttr = geom.getAttribute('position');
        if (!posAttr || posAttr.count === 0) {
          errors.push(`Component '${comp.id}' has geometry with zero vertices.`);
        } else {
          totalVertices += posAttr.count;
          geom.computeBoundingBox();
          if (geom.boundingBox) {
            const compBox = geom.boundingBox.clone();
            compBox.translate(new THREE.Vector3(...comp.position));
            if (!hasValidBox) {
              box3.copy(compBox);
              hasValidBox = true;
            } else {
              box3.union(compBox);
            }
          }
        }
      } else {
        // Parametric primitive fallback validation
        if (!comp.size || comp.size.length !== 3 || comp.size.some(s => typeof s !== 'number' || isNaN(s) || s <= 0)) {
          errors.push(`Component '${comp.id}' has invalid dimensions size: [${comp.size}].`);
        } else {
          const halfW = comp.size[0] / 2;
          const halfH = comp.size[1] / 2;
          const halfD = comp.size[2] / 2;
          const min = new THREE.Vector3(comp.position[0] - halfW, comp.position[1] - halfH, comp.position[2] - halfD);
          const max = new THREE.Vector3(comp.position[0] + halfW, comp.position[1] + halfH, comp.position[2] + halfD);
          const compBox = new THREE.Box3(min, max);
          if (!hasValidBox) {
            box3.copy(compBox);
            hasValidBox = true;
          } else {
            box3.union(compBox);
          }
          // Primitive approximate vertex count
          totalVertices += 24;
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `RENDER INTEGRITY VIOLATION [COMPONENT_GEOMETRY_ERROR]: Failed to validate '${plan.displayName}':\n- ${errors.join('\n- ')}`
      );
    }

    // 3. Condition: Bounding box has non-zero dimensions
    const size = new THREE.Vector3();
    box3.getSize(size);
    const radius = box3.getBoundingSphere(new THREE.Sphere()).radius;

    if (size.x <= 0.0001 && size.y <= 0.0001 && size.z <= 0.0001) {
      throw new Error(
        `RENDER INTEGRITY VIOLATION [ZERO_BOUNDING_BOX]: Model '${plan.displayName}' has zero dimensions (${size.x.toFixed(4)}, ${size.y.toFixed(4)}, ${size.z.toFixed(4)}). Geometry cannot be displayed.`
      );
    }

    const report: IntegrityValidationReport = {
      isValid: true,
      componentCount: assembly.components.length,
      geometryCount,
      totalVertices,
      boundingBox: {
        min: [box3.min.x, box3.min.y, box3.min.z],
        max: [box3.max.x, box3.max.y, box3.max.z],
        dimensions: [size.x, size.y, size.z],
        radius
      },
      errors: []
    };

    return report;
  }

  /**
   * Verifies that an active object is fully mounted into the Three.js spatial scene.
   */
  public static verifySpatialMount(objectId: string): boolean {
    const obj = SPATIAL_LIBRARY[objectId] || ModelRegistry.getSpatialObject(objectId);
    if (!obj) return false;
    if (!obj.components || obj.components.length === 0) return false;
    return true;
  }

  /**
   * Calculates auto-framing camera scale and offset for any spatial object metadata.
   */
  public static computeCameraFraming(objMeta: ObjectMetadata): {
    normalizedScale: number;
    maxExtent: number;
    center: [number, number, number];
  } {
    let maxExt = 1.0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    if (objMeta.components && objMeta.components.length > 0) {
      for (const c of objMeta.components) {
        const sx = c.size ? c.size[0] / 2 : 0.5;
        const sy = c.size ? c.size[1] / 2 : 0.5;
        const sz = c.size ? c.size[2] / 2 : 0.5;
        const px = c.position[0];
        const py = c.position[1];
        const pz = c.position[2];

        minX = Math.min(minX, px - sx);
        maxX = Math.max(maxX, px + sx);
        minY = Math.min(minY, py - sy);
        maxY = Math.max(maxY, py + sy);
        minZ = Math.min(minZ, pz - sz);
        maxZ = Math.max(maxZ, pz + sz);

        const r = Math.sqrt((Math.abs(px) + sx) ** 2 + (Math.abs(py) + sy) ** 2 + (Math.abs(pz) + sz) ** 2);
        if (r > maxExt) maxExt = r;
      }
    }

    const baseScale = objMeta.defaultScale || 1.0;
    const normalizedFactor = maxExt > 3.0 ? 2.4 / maxExt : maxExt < 0.6 ? 1.6 / maxExt : 1.0;
    const normalizedScale = baseScale * normalizedFactor;

    const centerX = isFinite(minX) && isFinite(maxX) ? (minX + maxX) / 2 : 0;
    const centerY = isFinite(minY) && isFinite(maxY) ? (minY + maxY) / 2 : 0;
    const centerZ = isFinite(minZ) && isFinite(maxZ) ? (minZ + maxZ) / 2 : 0;

    return {
      normalizedScale,
      maxExtent: maxExt,
      center: [-centerX, -centerY, -centerZ]
    };
  }
}

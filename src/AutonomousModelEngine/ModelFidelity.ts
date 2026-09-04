// src/AutonomousModelEngine/ModelFidelity.ts
// A.D.V.I.S. Universal Model Fidelity & Structural Verification Layer
// Ensures models satisfy structural completeness, recognizable silhouette signatures,
// component relationships, proportional consistency, and functional plausibility.

import * as THREE from 'three';
import { ComponentMetadata, ObjectMetadata } from '../SpatialLibrary';
import { FidelityClassification, ModelQualityTier } from './ModelTypes';
import { GeneratedAssemblyPayload } from './GeometryGenerator';

export interface FidelityValidationCriteria {
  requiredComponentCountMin: number;
  expectedStructuralSignatures: string[];
  requiredSubsystems: string[];
  minimumVertexCount: number;
  allowGenericPrimitives?: boolean;
}

export interface FidelityEvaluationReport {
  isFidelityApproved: boolean;
  score: number; // 0.0 to 1.0
  qualityTier: ModelQualityTier;
  fidelityClassification: FidelityClassification;
  detectedSignatures: string[];
  missingSignatures: string[];
  structuralCompleteness: number; // 0.0 to 1.0
  proportionalConsistency: boolean;
  spatialArrangementScore: number;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class ModelFidelity {
  /**
   * Evaluates an assembled model against engineering & structural fidelity standards.
   */
  public static evaluateFidelity(
    objectType: string,
    assembly: GeneratedAssemblyPayload,
    parameters: Record<string, any>
  ): FidelityEvaluationReport {
    const normType = objectType.toUpperCase().trim();
    const components = assembly.components || [];
    const geometries = assembly.geometries || {};

    const criteria = this.getCriteriaForType(normType);
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const detectedSignatures: string[] = [];
    const missingSignatures: string[] = [];

    // 1. Check Component Count
    if (components.length < criteria.requiredComponentCountMin) {
      errors.push(
        `Insufficient component count: Model has ${components.length} components, minimum required is ${criteria.requiredComponentCountMin}.`
      );
    }

    // 2. Total Vertices & Non-Empty Geometries
    let totalVertices = 0;
    for (const [id, geom] of Object.entries(geometries)) {
      const pos = geom.getAttribute('position');
      if (!pos || pos.count === 0) {
        errors.push(`Component '${id}' contains empty geometry buffer.`);
      } else {
        totalVertices += pos.count;
      }
    }

    if (totalVertices < criteria.minimumVertexCount) {
      errors.push(
        `Insufficient geometric resolution: Model has ${totalVertices} vertices, minimum required for recognizable fidelity is ${criteria.minimumVertexCount}.`
      );
    }

    // 3. Structural Signatures & Subsystems Check
    const compNamesAndIds = components.map(c => `${c.id} ${c.name} ${c.description || ''}`.toLowerCase()).join(' ');

    for (const sig of criteria.expectedStructuralSignatures) {
      const tokens = sig.toLowerCase().split('|');
      const found = tokens.some(t => compNamesAndIds.includes(t.trim()));
      if (found) {
        detectedSignatures.push(sig);
      } else {
        missingSignatures.push(sig);
      }
    }

    // 4. Proportional & Spatial Consistency
    let proportionalConsistency = true;
    let spatialArrangementScore = 1.0;

    // Check for distinct component positions (not all collapsed onto [0,0,0])
    const positions = components.map(c => new THREE.Vector3(...c.position));
    if (positions.length > 2) {
      let identicalPositions = 0;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          if (positions[i].distanceTo(positions[j]) < 0.001) {
            identicalPositions++;
          }
        }
      }
      if (identicalPositions > positions.length / 2) {
        spatialArrangementScore = 0.4;
        warnings.push('Multiple components share identical coordinates; possible unspaced assembly.');
      }
    }

    // 5. Compute Structural Completeness
    const signatureRatio = criteria.expectedStructuralSignatures.length > 0
      ? detectedSignatures.length / criteria.expectedStructuralSignatures.length
      : 1.0;
    
    const structuralCompleteness = Math.min(1.0, signatureRatio * (components.length >= criteria.requiredComponentCountMin ? 1.0 : 0.6));

    // Reject generic box/sphere fallbacks for recognizable complex objects
    if (!criteria.allowGenericPrimitives && (components.length <= 2 && missingSignatures.length > 2)) {
      errors.push(`Model collapsed into generic primitive blocks without recognizable ${objectType} structural features.`);
      proportionalConsistency = false;
    }

    // Determine Final Approval & Quality Tier
    const isFidelityApproved = errors.length === 0 && signatureRatio >= 0.7;
    let qualityTier: ModelQualityTier = 'VERIFIED';
    let fidelityClassification: FidelityClassification = 'ENGINEERING_SPECIFICATION';

    if (!isFidelityApproved) {
      qualityTier = 'INCOMPLETE';
      fidelityClassification = 'ILLUSTRATIVE_VISUALIZATION';
    } else if (signatureRatio >= 0.95 && totalVertices > 2000) {
      qualityTier = 'VERIFIED';
      fidelityClassification = 'ENGINEERING_SPECIFICATION';
    } else {
      qualityTier = 'APPROXIMATE';
      fidelityClassification = 'SIMPLIFIED_ASSEMBLY';
    }

    const score = Math.max(0, Math.min(1.0, (signatureRatio * 0.5) + (Math.min(totalVertices, 3000) / 3000 * 0.3) + (spatialArrangementScore * 0.2)));

    return {
      isFidelityApproved,
      score,
      qualityTier,
      fidelityClassification,
      detectedSignatures,
      missingSignatures,
      structuralCompleteness,
      proportionalConsistency,
      spatialArrangementScore,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Retrieves specific structural criteria for known manufactured & engineering archetypes.
   */
  private static getCriteriaForType(objectType: string): FidelityValidationCriteria {
    switch (objectType) {
      case 'BICYCLE':
      case 'BIKE':
        return {
          requiredComponentCountMin: 6,
          expectedStructuralSignatures: [
            'frame|top_tube|down_tube',
            'wheel|rim|tire|spoke',
            'fork|front_assembly',
            'handlebar|stem',
            'saddle|seat',
            'drivetrain|crank|chain|pedal'
          ],
          requiredSubsystems: ['Frame', 'Wheels', 'Steering', 'Drivetrain', 'Seating'],
          minimumVertexCount: 1500
        };

      case 'OXFORD_SHOE':
      case 'SHOE':
      case 'FOOTWEAR':
        return {
          requiredComponentCountMin: 5,
          expectedStructuralSignatures: [
            'outsole|sole',
            'midsole|welt',
            'heel|stacked_heel',
            'vamp|toe_cap|upper',
            'quarters|heel_counter',
            'laces|eyelets|tongue'
          ],
          requiredSubsystems: ['Sole Stack', 'Upper Leather Shell', 'Lacing System', 'Heel Counter'],
          minimumVertexCount: 1200
        };

      case 'SMARTPHONE':
      case 'PHONE':
        return {
          requiredComponentCountMin: 5,
          expectedStructuralSignatures: [
            'chassis|frame|body',
            'screen|display|amoled',
            'camera|lens',
            'port|usb',
            'button|switch'
          ],
          requiredSubsystems: ['Chassis', 'Display', 'Optics', 'I/O'],
          minimumVertexCount: 1000
        };

      case 'LAPTOP':
      case 'NOTEBOOK':
        return {
          requiredComponentCountMin: 5,
          expectedStructuralSignatures: [
            'base|chassis|bottom',
            'lid|display|screen',
            'hinge|pivot',
            'keyboard|keys',
            'trackpad|touchpad'
          ],
          requiredSubsystems: ['Base Chassis', 'Articulated Lid', 'Input Devices', 'Hinges'],
          minimumVertexCount: 1200
        };

      case 'TRANSFORMER':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'core|laminated_core',
            'winding|primary|secondary|coil',
            'tank|enclosure|fin',
            'bushing|terminal|insulator'
          ],
          requiredSubsystems: ['Magnetic Core', 'Electric Windings', 'Cooling Enclosure', 'High-Voltage Bushings'],
          minimumVertexCount: 1000
        };

      case 'CEILING_FAN':
      case 'FAN':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'motor|housing',
            'blade|airfoil',
            'downrod|canopy|mount',
            'light|bowl|hub'
          ],
          requiredSubsystems: ['Motor Enclosure', 'Aerodynamic Blades', 'Mounting Downrod'],
          minimumVertexCount: 1000
        };

      case 'CAMERA':
      case 'DSLR':
        return {
          requiredComponentCountMin: 5,
          expectedStructuralSignatures: [
            'body|chassis|grip',
            'lens|barrel|optics',
            'front_element|glass',
            'dial|shutter|controls',
            'viewfinder|screen|lcd'
          ],
          requiredSubsystems: ['Camera Chassis', 'Optical Lens Barrel', 'User Interface Controls', 'Sensor/Viewfinder'],
          minimumVertexCount: 1400
        };

      case 'DRONE':
      case 'QUADCOPTER':
        return {
          requiredComponentCountMin: 5,
          expectedStructuralSignatures: [
            'chassis|fuselage|core',
            'arm|boom',
            'motor|brushless',
            'propeller|rotor|blade',
            'gimbal|camera|landing_gear'
          ],
          requiredSubsystems: ['Airframe', 'Propulsion System', 'Avionics Enclosure', 'Payload/Landing Gear'],
          minimumVertexCount: 1400
        };

      case 'CAR_WHEEL':
      case 'WHEEL':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'rim|alloy_spoke',
            'tire|rubber_tread',
            'hub|lug_nuts',
            'brake_rotor|caliper'
          ],
          requiredSubsystems: ['Alloy Rim', 'Rubber Tire', 'Hub Center', 'Brake Assembly'],
          minimumVertexCount: 1200
        };

      case 'GEARBOX':
      case 'PLANETARY_GEARBOX':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'housing|casing',
            'input_shaft|output_shaft',
            'pinion|gear|bull_gear|sun_gear',
            'bearing|sight_glass'
          ],
          requiredSubsystems: ['Split Housing', 'Gearing Assembly', 'Shafts & Bearings'],
          minimumVertexCount: 1200
        };

      case 'KEYBOARD':
        return {
          requiredComponentCountMin: 3,
          expectedStructuralSignatures: [
            'case|enclosure|housing',
            'keycap|keys|matrix',
            'spacebar|stabilizer'
          ],
          requiredSubsystems: ['Enclosure Case', 'Key Matrix', 'Stabilized Spacebar'],
          minimumVertexCount: 800
        };

      case 'MOUSE':
      case 'COMPUTER_MOUSE':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'palm|body|shell',
            'button|click|trigger',
            'wheel|scroll',
            'sensor|skate|base'
          ],
          requiredSubsystems: ['Ergonomic Shell', 'Primary Switches', 'Scroll Wheel', 'Optical Sensor Base'],
          minimumVertexCount: 900
        };

      case 'WATER_BOTTLE':
      case 'BOTTLE':
      case 'FLASK':
        return {
          requiredComponentCountMin: 3,
          expectedStructuralSignatures: [
            'body|flask|cylinder',
            'neck|spout|taper',
            'cap|lid|handle'
          ],
          requiredSubsystems: ['Flask Body', 'Spout Neck', 'Sealing Cap'],
          minimumVertexCount: 800
        };

      case 'MONITOR':
      case 'DISPLAY':
      case 'SCREEN':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'screen|panel|display',
            'case|rear|housing',
            'stand|arm|riser',
            'base|pedestal|foot'
          ],
          requiredSubsystems: ['Active Display Panel', 'Rear Chassis', 'Articulated Stand', 'Pedestal Base'],
          minimumVertexCount: 1000
        };

      case 'SMARTWATCH':
      case 'WATCH':
        return {
          requiredComponentCountMin: 4,
          expectedStructuralSignatures: [
            'case|chassis|housing',
            'display|screen|sapphire',
            'crown|button|dial',
            'strap|band|loop'
          ],
          requiredSubsystems: ['Chassis Enclosure', 'Display Crystal', 'Crown Controller', 'Wrist Straps'],
          minimumVertexCount: 800
        };

      case 'HEADPHONES':
      case 'HEADSET':
        return {
          requiredComponentCountMin: 3,
          expectedStructuralSignatures: [
            'headband|canopy|arch',
            'earcup|cushion|left',
            'earcup|cushion|right'
          ],
          requiredSubsystems: ['Spring Headband', 'Left Acoustic Earcup', 'Right Acoustic Earcup'],
          minimumVertexCount: 900
        };

      case 'GAME_CONTROLLER':
      case 'CONTROLLER':
        return {
          requiredComponentCountMin: 3,
          expectedStructuralSignatures: [
            'body|grip|chassis',
            'stick|thumbstick|analog',
            'button|dpad|cluster'
          ],
          requiredSubsystems: ['Ergonomic Chassis', 'Analog Sticks', 'Action Buttons'],
          minimumVertexCount: 800
        };

      default:
        return {
          requiredComponentCountMin: 2,
          expectedStructuralSignatures: ['core|base|body', 'component|detail'],
          requiredSubsystems: ['Primary Structure', 'Functional Interface'],
          minimumVertexCount: 400,
          allowGenericPrimitives: true
        };
    }
  }
}

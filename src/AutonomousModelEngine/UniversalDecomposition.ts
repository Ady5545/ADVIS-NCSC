import { HighFidelityGenerators } from './HighFidelityGenerators';
// src/AutonomousModelEngine/UniversalDecomposition.ts
// Universal Semantic Structural Decomposition & High-Fidelity Assembly Engine

import * as THREE from 'three';
import { ComponentMetadata } from '../SpatialLibrary';
import { ProceduralMeshSpecification } from './ModelTypes';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { UniversalGeometryVocabulary } from './UniversalGeometryVocabulary';

export class UniversalDecomposition {
  /**
   * Generates a fully decomposed, high-fidelity engineering assembly for a BICYCLE.
   */
  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {
    
    return HighFidelityGenerators.generateBicycle(params);
  }

  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {
    
    return HighFidelityGenerators.generateOxfordShoe(params);
  }

  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 2.8) * scale;
    const height = Number(params.height || 2.4) * scale;
    const depth = Number(params.depth || 2.0) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    const legW = width * 0.2;
    const legH = height * 0.75;
    const legD = depth * 0.6;

    // 1. Core
    const coreGeoms: THREE.BufferGeometry[] = [];
    for (const xOff of [-width * 0.32, 0, width * 0.32]) {
      const limb = new THREE.BoxGeometry(legW, legH, legD);
      limb.translate(xOff, 0, 0);
      coreGeoms.push(limb);
    }
    const topYoke = new THREE.BoxGeometry(width * 0.9, height * 0.16, legD);
    topYoke.translate(0, legH / 2 + height * 0.08, 0);
    const bottomYoke = new THREE.BoxGeometry(width * 0.9, height * 0.16, legD);
    bottomYoke.translate(0, -legH / 2 - height * 0.08, 0);
    coreGeoms.push(topYoke, bottomYoke);
    
    addComp(
      'transformer_core', 'Silicon Steel Core', 'Laminated CRGO silicon steel core.',
      [0, 0, 0], [width * 0.9, height, legD], [0, 0, -1.0], '#475569',
      UniversalGeometryVocabulary.mergeGeometries(coreGeoms),
      { 'Material': 'CRGO Silicon Steel M4' }, 'PBR_METALLIC'
    );

    // 2. Windings
    const windingGeoms: THREE.BufferGeometry[] = [];
    for (const xOff of [-width * 0.32, 0, width * 0.32]) {
      const winding = new THREE.CylinderGeometry(legW * 0.95, legW * 0.95, legH * 0.82, 24);
      winding.translate(xOff, 0, 0);
      windingGeoms.push(winding);
    }
    addComp(
      'transformer_windings', 'Copper Windings', 'Concentric high-voltage and low-voltage copper coils.',
      [0, 0, 0], [width * 0.85, legH * 0.85, legW * 2.0], [0, 0, -0.5], '#b45309',
      UniversalGeometryVocabulary.mergeGeometries(windingGeoms),
      { 'Conductor': 'OFHC Copper', 'Insulation': 'Kraft Paper' }, 'PBR_METALLIC'
    );

    // 3. Tank
    const tankGeoms: THREE.BufferGeometry[] = [];
    const tankBody = UniversalGeometryVocabulary.createRoundedBox(width * 1.15, height * 1.05, depth * 1.1, 0.05, 4);
    tankGeoms.push(tankBody);
    
    // Radiator Fins (Side 1)
    const radFins1 = UniversalGeometryVocabulary.createCoolingFinArray(width * 1.15, height * 0.8, depth * 0.8, 12, 0.02, 0.3);
    radFins1.translate(0, -height*0.05, depth * 0.6);
    tankGeoms.push(radFins1);
    
    // Radiator Fins (Side 2)
    const radFins2 = UniversalGeometryVocabulary.createCoolingFinArray(width * 1.15, height * 0.8, depth * 0.8, 12, 0.02, 0.3);
    radFins2.translate(0, -height*0.05, -depth * 0.6);
    tankGeoms.push(radFins2);

    addComp(
      'transformer_tank', 'Mineral Oil Tank & Radiators', 'Sealed steel containment tank with corrugated cooling radiators.',
      [0, 0, 0], [width * 1.4, height * 1.1, depth * 1.6], [0, 0, 0], '#334155',
      UniversalGeometryVocabulary.mergeGeometries(tankGeoms),
      { 'Cooling': 'ONAN (Oil Natural Air Natural)' }, 'PBR_METALLIC'
    );

    // 4. Conservator Tank
    const conservatorGeom = new THREE.CylinderGeometry(height * 0.2, height * 0.2, width * 0.8, 16);
    conservatorGeom.rotateZ(Math.PI / 2);
    conservatorGeom.translate(0, height * 0.75, depth * 0.6);
    
    // Pipe to main tank
    const pipeGeom = UniversalGeometryVocabulary.createTubeBetweenPoints([0, height * 0.75 - height * 0.2, depth * 0.6], [0, height * 0.525, depth * 0.55], 0.05);
    
    addComp(
      'transformer_conservator', 'Conservator Tank', 'Oil expansion reservoir with breather.',
      [0, 0, 0], [width * 0.8, height * 0.4, depth * 0.4], [0, 0.5, 0.5], '#334155',
      UniversalGeometryVocabulary.mergeGeometries([conservatorGeom, pipeGeom]),
      { 'Function': 'Oil Expansion Buffer' }, 'PBR_METALLIC'
    );

    // 5. Bushings
    const bushingGeoms: THREE.BufferGeometry[] = [];
    const bushingH = height * 0.45;
    for (let i = 0; i < 3; i++) {
      const xOff = -width * 0.3 + i * (width * 0.3);
      const bushing = UniversalGeometryVocabulary.createCeramicBushing(bushingH, 0.12, 0.05, 5);
      bushing.translate(xOff, height / 2 + bushingH / 2, -depth * 0.2);
      bushingGeoms.push(bushing);
    }
    
    // LV Bushings
    for (let i = 0; i < 4; i++) {
      const xOff = -width * 0.25 + i * (width * 0.16);
      const bushing = UniversalGeometryVocabulary.createCeramicBushing(bushingH * 0.6, 0.08, 0.04, 3);
      bushing.translate(xOff, height / 2 + bushingH * 0.3, depth * 0.2);
      bushingGeoms.push(bushing);
    }

    addComp(
      'transformer_hv_bushings', 'HV & LV Porcelain Bushings', 'High-voltage and low-voltage glazed ceramic insulators.',
      [0, 0, 0], [width * 0.8, bushingH, depth * 0.5], [0, 0.8, 0], '#713f12',
      UniversalGeometryVocabulary.mergeGeometries(bushingGeoms),
      { 'Material': 'Glazed Porcelain' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  public static generateCeilingFan(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const span = Number(params.span || 4.2) * scale;
    const bladeCount = Number(params.bladeCount || 5);
    const dropHeight = Number(params.dropHeight || 1.6) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Direct-Drive Permanent Magnet Motor Housing
    const motorGeom = new THREE.CylinderGeometry(span * 0.12, span * 0.14, 0.45 * scale, 32);
    const motorComp: ComponentMetadata = {
      id: 'fan_motor_housing',
      name: 'Direct-Current Brushless (BLDC) Motor Housing',
      description: 'Precision dynamically balanced cast aluminum motor housing containing permanent neodymium magnet rotor and 16-pole stator.',
      position: [0, 0, 0],
      size: [span * 0.28, 0.45 * scale, span * 0.28],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#1e293b',
      specifications: {
        'Motor Type': 'Sensorless 6-Speed BLDC (35W Max)',
        'Efficiency': 'Energy Star Certified > 220 CFM/Watt',
        'Bearings': 'Dual Sealed High-Precision Ball Bearings'
      }
    };
    components.push(motorComp);
    geometries['fan_motor_housing'] = motorGeom;
    meshSpecs['fan_motor_housing'] = {
      id: 'fan_motor_housing',
      name: motorComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#1e293b',
      materialType: 'PBR_METALLIC'
    };

    // 2. Ceiling Canopy & Steel Downrod Suspension Pipe
    const downrodGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createTubeBetweenPoints([0, 0.22 * scale, 0], [0, dropHeight, 0], 0.04 * scale),
      // Ceiling Canopy Flange
      new THREE.CylinderGeometry(0.28 * scale, 0.12 * scale, 0.16 * scale, 24)
    ];
    downrodGeoms[1].translate(0, dropHeight - 0.08 * scale, 0);

    const downrodComp: ComponentMetadata = {
      id: 'fan_downrod_canopy',
      name: 'Rigid Steel Downrod & Ball-Socket Ceiling Canopy',
      description: 'Vibration-isolating threaded steel suspension rod with self-aligning ball swivel joint accommodating up to 30° sloped ceilings.',
      position: [0, 0, 0],
      size: [0.35 * scale, dropHeight, 0.35 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#475569',
      specifications: {
        'Downrod': '3/4" Heavy-Gauge Threaded Steel Pipe',
        'Canopy Mount': 'Dual-Locking Hanger Ball with Rubber Isolation Dampers'
      }
    };
    components.push(downrodComp);
    geometries['fan_downrod_canopy'] = UniversalGeometryVocabulary.mergeGeometries(downrodGeoms);
    meshSpecs['fan_downrod_canopy'] = {
      id: 'fan_downrod_canopy',
      name: downrodComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#475569',
      materialType: 'PBR_METALLIC'
    };

    // 3. Radial Aerodynamic Airfoil Blades & Metal Blade Irons
    const bladeGeoms: THREE.BufferGeometry[] = [];
    const bladeLen = span * 0.42;

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2;
      const blade = UniversalGeometryVocabulary.createAirfoilBlade(bladeLen, 0.32 * scale, 0.22 * scale, 0.03 * scale, 14);
      blade.translate(bladeLen / 2 + span * 0.1, 0, 0);
      blade.rotateY(angle);
      bladeGeoms.push(blade);
    }

    const bladeComp: ComponentMetadata = {
      id: 'fan_blades',
      name: `${bladeCount}-Blade Aerodynamic Carved Airfoil Rotor Array`,
      description: 'Precisely weight-matched engineered composite blades with 14° optimized pitch delivering whisper-quiet laminar airflow.',
      position: [0, 0, 0],
      size: [span, 0.15 * scale, span],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#78350f', // Polished Walnut / Matte Teak
      specifications: {
        'Blade Span': `${(span * 30).toFixed(0)} inches (Sweep Diameter)`,
        'Airflow Velocity': '5,800 CFM High Speed',
        'Pitch Angle': '14° Positive Aerodynamic Attack Angle'
      }
    };
    components.push(bladeComp);
    geometries['fan_blades'] = UniversalGeometryVocabulary.mergeGeometries(bladeGeoms);
    meshSpecs['fan_blades'] = {
      id: 'fan_blades',
      name: bladeComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#78350f',
      materialType: 'PBR_METALLIC'
    };

    // 4. Integrated Dimmable LED Light Fixture & Frosted Glass Bowl
    const lightGeoms: THREE.BufferGeometry[] = [];
    const glassBowl = new THREE.CylinderGeometry(span * 0.1, span * 0.05, 0.14 * scale, 24);
    glassBowl.translate(0, -0.28 * scale, 0);
    lightGeoms.push(glassBowl);

    const lightComp: ComponentMetadata = {
      id: 'fan_light_fixture',
      name: 'Integrated Dimmable LED Luminaire & Frosted Diffuser Bowl',
      description: 'Energy-efficient 18W color-tunable LED array (2700K-5000K) with shatter-resistant frosted optical dispersion bowl.',
      position: [0, 0, 0],
      size: [span * 0.2, 0.18 * scale, span * 0.2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#f8fafc',
      specifications: {
        'Luminous Flux': '1,600 Lumens (CRI > 90)',
        'Dimming Range': '1% - 100% Flicker-Free TRIAC/PWM'
      }
    };
    components.push(lightComp);
    geometries['fan_light_fixture'] = UniversalGeometryVocabulary.mergeGeometries(lightGeoms);
    meshSpecs['fan_light_fixture'] = {
      id: 'fan_light_fixture',
      name: lightComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#f8fafc',
      materialType: 'XRAY_GLASS'
    };

    return { components, meshSpecs, geometries };
  }

  /**
   * Generates a fully decomposed, high-fidelity engineering assembly for a DSLR / MIRRORLESS CAMERA.
   */
  public static generateCamera(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const bodyW = Number(params.width || 2.4) * scale;
    const bodyH = Number(params.height || 1.6) * scale;
    const bodyD = Number(params.depth || 1.0) * scale;
    const lensRadius = Number(params.lensRadius || 0.55) * scale;
    const lensLength = Number(params.lensLength || 1.4) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Weather-Sealed Magnesium Alloy Camera Body & Deep Handgrip
    const bodyGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createRoundedBox(bodyW, bodyH, bodyD, 0.15 * scale),
      // Deep Ergonomic Handgrip on Right Flank
      UniversalGeometryVocabulary.createRoundedBox(bodyW * 0.28, bodyH * 0.95, bodyD * 0.65, 0.1 * scale)
    ];
    bodyGeoms[1].translate(bodyW * 0.38, 0, bodyD * 0.25);

    // Top Pentaprism / Electronic Viewfinder (EVF) Hump
    const evfHump = new THREE.ConeGeometry(bodyW * 0.26, bodyH * 0.35, 4);
    evfHump.rotateY(Math.PI / 4);
    evfHump.translate(-bodyW * 0.05, bodyH / 2 + bodyH * 0.15, 0);
    bodyGeoms.push(evfHump);

    const bodyComp: ComponentMetadata = {
      id: 'camera_body_chassis',
      name: 'Weather-Sealed Magnesium Alloy Unibody Chassis & Textured Grip',
      description: 'Die-cast magnesium alloy frame with synthetic elastomer tactile wrap and 72 internal silicone weather seals.',
      position: [0, 0, 0],
      size: [bodyW * 1.1, bodyH * 1.3, bodyD * 1.3],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#1e293b',
      specifications: {
        'Chassis': 'Die-Cast Magnesium Alloy AM60B',
        'Weather Sealing': 'IP53 Dust & Moisture Resistance',
        'Sensor Chamber': '35mm Full-Frame BSI CMOS (45.7 Megapixels)'
      }
    };
    components.push(bodyComp);
    geometries['camera_body_chassis'] = UniversalGeometryVocabulary.mergeGeometries(bodyGeoms);
    meshSpecs['camera_body_chassis'] = {
      id: 'camera_body_chassis',
      name: bodyComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#1e293b',
      materialType: 'PBR_METALLIC'
    };

    // 2. Detachable Multi-Element Optical Lens Barrel
    const lensGeoms: THREE.BufferGeometry[] = [];
    const mainBarrel = new THREE.CylinderGeometry(lensRadius, lensRadius * 0.9, lensLength, 32);
    mainBarrel.rotateX(Math.PI / 2);
    mainBarrel.translate(-bodyW * 0.05, 0, bodyD / 2 + lensLength / 2);
    lensGeoms.push(mainBarrel);

    // Knurled Rubber Focus & Zoom Control Rings
    const zoomRing = new THREE.CylinderGeometry(lensRadius * 1.04, lensRadius * 1.04, lensLength * 0.25, 32);
    zoomRing.rotateX(Math.PI / 2);
    zoomRing.translate(-bodyW * 0.05, 0, bodyD / 2 + lensLength * 0.35);
    lensGeoms.push(zoomRing);

    const lensComp: ComponentMetadata = {
      id: 'camera_lens_barrel',
      name: '24-70mm f/2.8 Constant Aperture ED Zoom Lens Barrel',
      description: '18 optical elements in 15 groups including 3 aspherical and 2 extra-low dispersion (ED) elements with internal ultrasonic stepping motor.',
      position: [-bodyW * 0.05, 0, bodyD / 2 + lensLength / 2],
      size: [lensRadius * 2.1, lensRadius * 2.1, lensLength],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0f172a',
      specifications: {
        'Focal Length': '24-70mm Standard Zoom (f/2.8 constant)',
        'Optics': '18 Elements in 15 Groups (Fluorite & ED glass)',
        'Autofocus': 'Dual Linear XD Voice Coil Actuators'
      }
    };
    components.push(lensComp);
    geometries['camera_lens_barrel'] = UniversalGeometryVocabulary.mergeGeometries(lensGeoms);
    meshSpecs['camera_lens_barrel'] = {
      id: 'camera_lens_barrel',
      name: lensComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#0f172a',
      materialType: 'PBR_METALLIC'
    };

    // 3. Multi-Coated Optical Front Element Glass
    const frontGlass = new THREE.CylinderGeometry(lensRadius * 0.88, lensRadius * 0.88, 0.03 * scale, 32);
    frontGlass.rotateX(Math.PI / 2);
    frontGlass.translate(-bodyW * 0.05, 0, bodyD / 2 + lensLength);

    const glassComp: ComponentMetadata = {
      id: 'camera_front_glass',
      name: 'Fluorine Multi-Coated Front Optical Glass Element',
      description: 'Hydrophobic and oleophobic fluorine coated high-refractive index front lens with subwavelength anti-reflective nanocoatings.',
      position: [-bodyW * 0.05, 0, bodyD / 2 + lensLength],
      size: [lensRadius * 1.8, lensRadius * 1.8, 0.05],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#06b6d4',
      specifications: {
        'Coating': 'Nano AR Coating II + Fluorine Topcoat',
        'Filter Thread': '82 mm Precision CNC Brass'
      }
    };
    components.push(glassComp);
    geometries['camera_front_glass'] = frontGlass;
    meshSpecs['camera_front_glass'] = {
      id: 'camera_front_glass',
      name: glassComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#06b6d4',
      materialType: 'XRAY_GLASS'
    };

    // 4. Tactile Mode Dials, Control Wheels & Shutter Button
    const dialGeoms: THREE.BufferGeometry[] = [];
    // Mode Dial on Left Top
    const modeDial = new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.12 * scale, 20);
    modeDial.translate(-bodyW * 0.35, bodyH / 2 + 0.06 * scale, 0);
    dialGeoms.push(modeDial);

    // Two-Stage Shutter Button on Grip
    const shutter = new THREE.CylinderGeometry(0.12 * scale, 0.14 * scale, 0.08 * scale, 20);
    shutter.translate(bodyW * 0.38, bodyH / 2 + 0.04 * scale, bodyD * 0.28);
    dialGeoms.push(shutter);

    const dialComp: ComponentMetadata = {
      id: 'camera_controls',
      name: 'Knurled Metal Mode Dial & Two-Stage Magnetic Shutter Button',
      description: 'Diamond-knurled aluminum dials with locking pins and Hall-effect two-stage tactile release shutter button.',
      position: [0, bodyH / 2, 0],
      size: [bodyW, 0.2 * scale, bodyD],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#e2e8f0',
      specifications: {
        'Shutter Mechanism': 'Electronic Carbon-Fiber Focal Plane Shutter (1/8000s)',
        'Rated Actuations': '500,000 Cycles Tested'
      }
    };
    components.push(dialComp);
    geometries['camera_controls'] = UniversalGeometryVocabulary.mergeGeometries(dialGeoms);
    meshSpecs['camera_controls'] = {
      id: 'camera_controls',
      name: dialComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#e2e8f0',
      materialType: 'PBR_METALLIC'
    };

    // 5. Rear Articulated High-Resolution Touchscreen LCD
    const lcdGeom = new THREE.BoxGeometry(bodyW * 0.65, bodyH * 0.68, 0.04 * scale);
    lcdGeom.translate(0, 0, -bodyD / 2 - 0.02 * scale);

    const lcdComp: ComponentMetadata = {
      id: 'camera_rear_lcd',
      name: '3.2" 2.1M-Dot Vari-Angle Capacitive Touch LCD',
      description: 'Fully articulating 3-axis touchscreen display with 100% sRGB color gamut coverage and anti-smudge coating.',
      position: [0, 0, -bodyD / 2 - 0.02 * scale],
      size: [bodyW * 0.65, bodyH * 0.68, 0.05],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: {
        'Resolution': '3.2-Inch 2,100,000 Dots RGBW',
        'Articulation': 'Side-Opening Vari-Angle (180° Flip, 270° Rotation)'
      }
    };
    components.push(lcdComp);
    geometries['camera_rear_lcd'] = lcdGeom;
    meshSpecs['camera_rear_lcd'] = {
      id: 'camera_rear_lcd',
      name: lcdComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#0284c7',
      materialType: 'PBR_METALLIC'
    };

    return { components, meshSpecs, geometries };
  }

  /**
   * Generates a fully decomposed, high-fidelity engineering assembly for an AUTONOMOUS DRONE (Quadcopter).
   */
  public static generateDrone(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const diagonalWheelbase = Number(params.diagonalWheelbase || 3.6) * scale;
    const armRadius = 0.04 * scale;
    const motorRadius = 0.16 * scale;
    const propDiameter = Number(params.propDiameter || 1.4) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const armLength = diagonalWheelbase / 2;
    const armAngle = Math.PI / 4; // 45 degree X-configuration
    const motorOffsets: [number, number, number][] = [
      [Math.cos(armAngle) * armLength, 0, Math.sin(armAngle) * armLength],
      [-Math.cos(armAngle) * armLength, 0, Math.sin(armAngle) * armLength],
      [-Math.cos(armAngle) * armLength, 0, -Math.sin(armAngle) * armLength],
      [Math.cos(armAngle) * armLength, 0, -Math.sin(armAngle) * armLength]
    ];

    // 1. Carbon Fiber Center Fuselage & Avionics Bay
    const fuselageGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createRoundedBox(1.2 * scale, 0.45 * scale, 1.6 * scale, 0.12 * scale),
      // Top GPS / LiDAR Sensor Puck
      new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.14 * scale, 24)
    ];
    fuselageGeoms[1].translate(0, 0.3 * scale, 0);

    const fuselageComp: ComponentMetadata = {
      id: 'drone_fuselage',
      name: 'Toray 3K Carbon Fiber Monocoque Fuselage & Avionics Bay',
      description: 'Ultralight impact-resistant carbon composite fuselage enclosing redundant IMU flight controllers, RTK GNSS module, and 6S LiPo power bay.',
      position: [0, 0, 0],
      size: [1.2 * scale, 0.6 * scale, 1.6 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#1e293b',
      specifications: {
        'Flight Controller': 'Triple-Redundant STM32H7 IMU / RTK GNSS',
        'Battery Interface': '6S 22.2V 8,000mAh Smart LiPo Quick-Release'
      }
    };
    components.push(fuselageComp);
    geometries['drone_fuselage'] = UniversalGeometryVocabulary.mergeGeometries(fuselageGeoms);
    meshSpecs['drone_fuselage'] = {
      id: 'drone_fuselage',
      name: fuselageComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#1e293b',
      materialType: 'PBR_METALLIC'
    };

    // 2. Tubular Carbon Fiber X-Booms (4 Rotor Arms)
    const armGeoms: THREE.BufferGeometry[] = [];
    for (const mPos of motorOffsets) {
      const arm = UniversalGeometryVocabulary.createTubeBetweenPoints([0, 0, 0], mPos, armRadius);
      armGeoms.push(arm);
    }

    const armsComp: ComponentMetadata = {
      id: 'drone_carbon_arms',
      name: 'High-Modulus Tubular Carbon Fiber X-Configuration Booms',
      description: '4x roll-wrapped 3K twill carbon fiber structural tubes optimized for maximum torsional stiffness and resonance dampening.',
      position: [0, 0, 0],
      size: [diagonalWheelbase, 0.15 * scale, diagonalWheelbase],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0f172a',
      specifications: {
        'Diagonal Wheelbase': `${(diagonalWheelbase * 250).toFixed(0)} mm`,
        'Material': 'High-Modulus Roll-Wrapped Carbon Fiber 1.5mm wall'
      }
    };
    components.push(armsComp);
    geometries['drone_carbon_arms'] = UniversalGeometryVocabulary.mergeGeometries(armGeoms);
    meshSpecs['drone_carbon_arms'] = {
      id: 'drone_carbon_arms',
      name: armsComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#0f172a',
      materialType: 'PBR_METALLIC'
    };

    // 3. High-Torque Brushless Outrunner Motors (4x)
    const motorGeoms: THREE.BufferGeometry[] = [];
    for (const mPos of motorOffsets) {
      const motor = new THREE.CylinderGeometry(motorRadius, motorRadius, 0.22 * scale, 24);
      motor.translate(mPos[0], 0.11 * scale, mPos[2]);
      motorGeoms.push(motor);
    }

    const motorsComp: ComponentMetadata = {
      id: 'drone_brushless_motors',
      name: '4x High-KV Field-Oriented Brushless Outrunner Motors',
      description: '14-pole neodymium N52H magnet outrunners with titanium hollow shafts and 60A sinusoidal FOC electronic speed controllers.',
      position: [0, 0.11 * scale, 0],
      size: [diagonalWheelbase, 0.25 * scale, diagonalWheelbase],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: {
        'Stator Size': '4014 400KV Ultra-Efficient Brushless',
        'Peak Thrust': '4.2 kg per motor (16.8 kg total takeoff thrust)',
        'Speed Controller': '60A FOC (Field-Oriented Control) 48kHz PWM'
      }
    };
    components.push(motorsComp);
    geometries['drone_brushless_motors'] = UniversalGeometryVocabulary.mergeGeometries(motorGeoms);
    meshSpecs['drone_brushless_motors'] = {
      id: 'drone_brushless_motors',
      name: motorsComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#0284c7',
      materialType: 'PBR_METALLIC'
    };

    // 4. Folding Carbon Propeller Rotor Blades (4x CW/CCW Pairs)
    const propGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const mPos = motorOffsets[i];
      const blade = UniversalGeometryVocabulary.createAirfoilBlade(propDiameter, 0.14 * scale, 0.08 * scale, 0.02 * scale, 12);
      blade.rotateY(i * (Math.PI / 2));
      blade.translate(mPos[0], 0.24 * scale, mPos[2]);
      propGeoms.push(blade);
    }

    const propsComp: ComponentMetadata = {
      id: 'drone_propellers',
      name: '4x Quick-Release Carbon-Fiber Folding Propellers',
      description: 'Dynamically balanced low-noise aerodynamic folding carbon propellers engineered for maximum hover endurance.',
      position: [0, 0.24 * scale, 0],
      size: [diagonalWheelbase + propDiameter, 0.1 * scale, diagonalWheelbase + propDiameter],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#334155',
      specifications: {
        'Diameter & Pitch': `${(propDiameter * 10).toFixed(0)}x5.5 Inch Folding Airfoil`,
        'Acoustic Signature': '< 62 dBA at 3 meters'
      }
    };
    components.push(propsComp);
    geometries['drone_propellers'] = UniversalGeometryVocabulary.mergeGeometries(propGeoms);
    meshSpecs['drone_propellers'] = {
      id: 'drone_propellers',
      name: propsComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#334155',
      materialType: 'PBR_METALLIC'
    };

    // 5. 3-Axis Stabilized Gimbal & 4K Optical Sensor Payload
    const gimbalGeoms: THREE.BufferGeometry[] = [];
    const gimbalArm = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.25 * scale, 16);
    gimbalArm.translate(0, -0.32 * scale, 0.5 * scale);
    const cameraSph = new THREE.SphereGeometry(0.24 * scale, 24, 24);
    cameraSph.translate(0, -0.48 * scale, 0.5 * scale);
    const lensRing = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.12 * scale, 20);
    lensRing.rotateX(Math.PI / 2);
    lensRing.translate(0, -0.48 * scale, 0.68 * scale);
    gimbalGeoms.push(gimbalArm, cameraSph, lensRing);

    const gimbalComp: ComponentMetadata = {
      id: 'drone_gimbal_camera',
      name: '3-Axis Brushless Gimbal & 1-Inch CMOS 4K Cinema Camera',
      description: 'Micro-motor 3-axis mechanical gimbal with 0.005° stabilization accuracy housing 1-inch 20MP HDR optical sensor.',
      position: [0, -0.48 * scale, 0.5 * scale],
      size: [0.6 * scale, 0.6 * scale, 0.6 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'sphere',
      color: '#06b6d4',
      specifications: {
        'Sensor': '1-Inch 20 Megapixel Stacked CMOS',
        'Video Encoding': '4K 60fps 10-bit D-Log M',
        'Stabilization': '3-Axis Motorized (Pitch: -90° to +30°, Yaw: 360°)'
      }
    };
    components.push(gimbalComp);
    geometries['drone_gimbal_camera'] = UniversalGeometryVocabulary.mergeGeometries(gimbalGeoms);
    meshSpecs['drone_gimbal_camera'] = {
      id: 'drone_gimbal_camera',
      name: gimbalComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#06b6d4',
      materialType: 'PBR_METALLIC'
    };

    return { components, meshSpecs, geometries };
  }

  /**
   * Generates a fully decomposed, high-fidelity engineering assembly for a CAR WHEEL & BRAKE ASSEMBLY.
   */
  public static generateCarWheel(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const rimRadius = Number(params.rimRadius || 1.4) * scale;
    const tireRadius = rimRadius * 1.35;
    const wheelWidth = Number(params.wheelWidth || 1.1) * scale;
    const spokeCount = Number(params.spokeCount || 5);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Forged Monoblock Aluminum-Alloy 5-Spoke Wheel Rim
    const rimGeoms: THREE.BufferGeometry[] = [];
    // Outer Barrel Cylinder
    const barrel = new THREE.CylinderGeometry(rimRadius, rimRadius, wheelWidth, 32, 1, true);
    barrel.rotateZ(Math.PI / 2);
    rimGeoms.push(barrel);

    // 5 Aggressive Aero Spokes
    const spokeLen = rimRadius * 0.72;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = UniversalGeometryVocabulary.createRoundedBox(spokeLen, 0.18 * scale, 0.12 * scale, 0.03 * scale);
      spoke.translate(spokeLen / 2 + rimRadius * 0.2, 0, wheelWidth * 0.4);
      spoke.rotateZ(angle);
      rimGeoms.push(spoke);
    }

    // Center Hub Bore & Logo Cap
    const centerHub = new THREE.CylinderGeometry(rimRadius * 0.28, rimRadius * 0.28, 0.15 * scale, 24);
    centerHub.rotateZ(Math.PI / 2);
    centerHub.translate(0, 0, wheelWidth * 0.42);
    rimGeoms.push(centerHub);

    const rimComp: ComponentMetadata = {
      id: 'car_wheel_rim',
      name: 'Forged 6061-T6 Aluminum Monoblock 5-Spoke Wheel Rim',
      description: '19-inch forged aerospace-grade lightweight alloy wheel rim with machined drop-center safety hump.',
      position: [0, 0, 0],
      size: [rimRadius * 2, rimRadius * 2, wheelWidth],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#e2e8f0', // Silver Polished
      specifications: {
        'Rim Size': '19x9.5J ET35 5x114.3 PCD',
        'Forging Process': '10,000-Ton Hydraulic Die Forging',
        'Weight': '8.6 kg per wheel'
      }
    };
    components.push(rimComp);
    geometries['car_wheel_rim'] = UniversalGeometryVocabulary.mergeGeometries(rimGeoms);
    meshSpecs['car_wheel_rim'] = {
      id: 'car_wheel_rim',
      name: rimComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#e2e8f0',
      materialType: 'PBR_METALLIC'
    };

    // 2. High-Performance Ultra-Low-Profile Rubber Tire
    const tireGeoms: THREE.BufferGeometry[] = [];
    const tireSectionRadius = (tireRadius - rimRadius) * 0.55;
    const tireTorus = new THREE.TorusGeometry(rimRadius + tireSectionRadius * 0.9, tireSectionRadius, 20, 32);
    tireTorus.rotateY(Math.PI / 2);
    tireGeoms.push(tireTorus);

    const tireComp: ComponentMetadata = {
      id: 'car_wheel_tire',
      name: '265/35ZR19 High-Grip Synthetic Rubber Compound Tire',
      description: 'Asymmetric summer sport tire with silica-reinforced tread compound and twin steel belt structure.',
      position: [0, 0, 0],
      size: [tireRadius * 2, tireRadius * 2, wheelWidth * 1.1],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#1e293b',
      specifications: {
        'Dimensions': '265/35 ZR19 (98Y) XL',
        'Treadwear Rating': 'UTQG 240 AA A',
        'Speed Rating': 'Y (Certified up to 300 km/h)'
      }
    };
    components.push(tireComp);
    geometries['car_wheel_tire'] = UniversalGeometryVocabulary.mergeGeometries(tireGeoms);
    meshSpecs['car_wheel_tire'] = {
      id: 'car_wheel_tire',
      name: tireComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#1e293b',
      materialType: 'PBR_METALLIC'
    };

    // 3. Cross-Drilled & Slotted Cast-Iron Disc Brake Rotor
    const rotorGeom = UniversalGeometryVocabulary.createDiscBrakeRotor(rimRadius * 0.78, rimRadius * 0.35, 0.08 * scale, 16);
    rotorGeom.rotateZ(Math.PI / 2);
    rotorGeom.translate(0, 0, -wheelWidth * 0.1);

    const rotorComp: ComponentMetadata = {
      id: 'car_wheel_rotor',
      name: '380mm Two-Piece Cross-Drilled Carbon-Iron Brake Rotor',
      description: 'Directionally curved vane vented rotor with floating aluminum mounting bell for maximum heat dissipation.',
      position: [0, 0, -wheelWidth * 0.1],
      size: [rimRadius * 1.6, rimRadius * 1.6, 0.12 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#94a3b8',
      specifications: {
        'Rotor Diameter': '380mm x 34mm Thickness',
        'Ventilation': '48 Directional Curved Internal Vanes',
        'Thermal Capacity': 'Resistant up to 800°C Brake Fade'
      }
    };
    components.push(rotorComp);
    geometries['car_wheel_rotor'] = rotorGeom;
    meshSpecs['car_wheel_rotor'] = {
      id: 'car_wheel_rotor',
      name: rotorComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#94a3b8',
      materialType: 'PBR_METALLIC'
    };

    // 4. Red Powder-Coated 6-Piston Aluminum Monoblock Brake Caliper
    const caliperGeoms: THREE.BufferGeometry[] = [];
    const caliperBody = UniversalGeometryVocabulary.createRoundedBox(rimRadius * 0.7, 0.32 * scale, 0.42 * scale, 0.08 * scale);
    caliperBody.translate(0, rimRadius * 0.52, -wheelWidth * 0.08);
    caliperGeoms.push(caliperBody);

    const caliperComp: ComponentMetadata = {
      id: 'car_wheel_caliper',
      name: '6-Piston Opposed Monoblock Aluminum Brake Caliper',
      description: 'Radial-mount racing caliper with staggered stainless steel pistons and ceramic composite high-friction pads.',
      position: [0, rimRadius * 0.52, -wheelWidth * 0.08],
      size: [rimRadius * 0.7, 0.35 * scale, 0.45 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#dc2626', // High-Gloss Racing Red
      specifications: {
        'Piston Array': '6 Opposed Stainless Steel (30/34/38mm staggered)',
        'Fluid Compatibility': 'DOT 5.1 High Boiling Point Fluid'
      }
    };
    components.push(caliperComp);
    geometries['car_wheel_caliper'] = UniversalGeometryVocabulary.mergeGeometries(caliperGeoms);
    meshSpecs['car_wheel_caliper'] = {
      id: 'car_wheel_caliper',
      name: caliperComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: {},
      color: '#dc2626',
      materialType: 'PBR_METALLIC'
    };

    return { components, meshSpecs, geometries };
  }

  /**
   * Generates a fully decomposed, high-fidelity engineering assembly for an INDUSTRIAL GEARBOX.
   */
  public static generateGearbox(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 3.0) * scale;
    const height = Number(params.height || 2.4) * scale;
    const depth = Number(params.depth || 2.2) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Heavy-Duty Cast-Iron Split Housing with Mounting Flange Feet
    const housingGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createRoundedBox(width, height * 0.85, depth, 0.15 * scale, 8),
      // Base Mounting Flange Foot
      UniversalGeometryVocabulary.createRoundedBox(width * 1.25, 0.16 * scale, depth * 1.2, 0.05 * scale, 4)
    ];
    housingGeoms[1].translate(0, -height * 0.42, 0);
    
    // Add cooling ribs to housing
    const ribGeom1 = UniversalGeometryVocabulary.createCoolingFinArray(width, height * 0.6, depth * 0.1, 8, 0.03, 0.05);
    ribGeom1.translate(0, 0, depth * 0.55);
    const ribGeom2 = UniversalGeometryVocabulary.createCoolingFinArray(width, height * 0.6, depth * 0.1, 8, 0.03, 0.05);
    ribGeom2.translate(0, 0, -depth * 0.55);
    housingGeoms.push(ribGeom1, ribGeom2);

    addComp(
      'gearbox_housing', 'Cast Iron Grade 250 Housing', 'Heavy-duty ribbed grey cast iron gearbox casing designed for extreme torsional rigidity.',
      [0, 0, 0], [width * 1.25, height, depth * 1.2], [0, 0, 0], '#334155',
      UniversalGeometryVocabulary.mergeGeometries(housingGeoms),
      { 'Material': 'Class 35 Grey Cast Iron (EN-GJL-250)' }, 'PBR_METALLIC'
    );

    // 2. High-Speed Input Drive Pinion Gear
    const pinionRadius = 0.45 * scale;
    const pinionGeom = new THREE.CylinderGeometry(pinionRadius, pinionRadius, depth * 0.45, 24);
    pinionGeom.rotateX(Math.PI / 2);
    pinionGeom.translate(-width * 0.22, height * 0.15, 0);
    
    addComp(
      'gearbox_pinion_gear', 'Case-Hardened Input Pinion (z=18)', 'Precision ground 18-tooth helical gear forged from 18CrNiMo7-6 steel.',
      [-width * 0.22, height * 0.15, 0], [pinionRadius * 2, pinionRadius * 2, depth * 0.45], [-0.4, 0.4, 0], '#0284c7',
      pinionGeom,
      { 'Teeth Count': 'z = 18 Helical Involute', 'Module': 'm = 4.0 mm' }, 'PBR_METALLIC'
    );

    // 3. Low-Speed Driven Bull Gear
    const bullRadius = 0.95 * scale;
    const bullGeom = new THREE.CylinderGeometry(bullRadius, bullRadius, depth * 0.45, 36);
    bullGeom.rotateX(Math.PI / 2);
    bullGeom.translate(width * 0.25, -height * 0.12, 0);
    
    addComp(
      'gearbox_bull_gear', 'High-Torque Output Bull Gear (z=54)', 'Precision-meshed 54-tooth spur gear mounted on alloy steel output shaft.',
      [width * 0.25, -height * 0.12, 0], [bullRadius * 2, bullRadius * 2, depth * 0.45], [0.4, -0.4, 0], '#e2e8f0',
      bullGeom,
      { 'Teeth Count': 'z = 54 (Ratio 3.0:1)' }, 'PBR_METALLIC'
    );

    // 4. Hardened Input & Output Shafts
    const inputShaftGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [-width * 0.22, height * 0.15, -depth * 0.7], [-width * 0.22, height * 0.15, depth * 0.7], 0.14 * scale
    );
    const outputShaftGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [width * 0.25, -height * 0.12, -depth * 0.7], [width * 0.25, -height * 0.12, depth * 0.7], 0.22 * scale
    );
    
    addComp(
      'gearbox_shafts', 'Hardened Alloy Steel Shafts', '42CrMo4 high-tensile shafts with precision keyways.',
      [0, 0, 0], [width, height, depth * 1.4], [0, 0, 0.4], '#94a3b8',
      UniversalGeometryVocabulary.mergeGeometries([inputShaftGeom, outputShaftGeom]),
      { 'Material': '42CrMo4 Steel', 'Input Shaft': '35mm Keyed', 'Output Shaft': '55mm Keyed' }, 'PBR_METALLIC'
    );
    
    // 5. Bearings and Seals
    const bearingGeoms = [];
    const bearingRadius = 0.25 * scale;
    // Input bearings
    for(const z of [-depth * 0.5, depth * 0.5]) {
      const bGeom = new THREE.CylinderGeometry(bearingRadius, bearingRadius, 0.1, 24);
      bGeom.rotateX(Math.PI/2);
      bGeom.translate(-width * 0.22, height * 0.15, z);
      bearingGeoms.push(bGeom);
    }
    // Output bearings
    const outBearingRadius = 0.35 * scale;
    for(const z of [-depth * 0.5, depth * 0.5]) {
      const bGeom = new THREE.CylinderGeometry(outBearingRadius, outBearingRadius, 0.12, 32);
      bGeom.rotateX(Math.PI/2);
      bGeom.translate(width * 0.25, -height * 0.12, z);
      bearingGeoms.push(bGeom);
    }
    
    addComp(
      'gearbox_bearings', 'Tapered Roller Bearings & Seals', 'SKF heavy-duty tapered roller bearings with radial shaft seals.',
      [0, 0, 0], [width, height, depth * 1.1], [0, 0, -0.4], '#334155',
      UniversalGeometryVocabulary.mergeGeometries(bearingGeoms),
      { 'Bearings': 'SKF Explorer Series', 'Seals': 'Viton Double-Lip' }, 'PBR_METALLIC'
    );

    return { components, meshSpecs, geometries };
  }

  public static generateHelmet(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const radius = Number(params.radius || 1.2) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. EPS Foam Liner
    const epsGeom = new THREE.SphereGeometry(radius * 0.95, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    addComp(
      'helmet_eps', 'EPS Foam Impact Liner', 'Multi-density expanded polystyrene energy absorbing core.',
      [0, 0, 0], [radius * 1.9, radius, radius * 1.9], [0, 0.4, 0], '#334155',
      epsGeom, { 'Material': 'Multi-Density EPS' }, 'PBR_MATTE'
    );

    // 2. Polycarbonate Outer Shell
    const shellGeom = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.53);
    addComp(
      'helmet_shell', 'Polycarbonate Outer Shell', 'Aerodynamic injection molded polycarbonate shell.',
      [0, 0, 0], [radius * 2, radius * 1.05, radius * 2], [0, 0.8, 0], '#ffffff',
      shellGeom, { 'Material': 'Injection Molded Polycarbonate' }, 'PBR_METALLIC'
    );

    // 3. Comfort Padding
    const padGeom = new THREE.SphereGeometry(radius * 0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
    addComp(
      'helmet_padding', 'Microfiber Comfort Padding', 'Moisture-wicking, removable and washable interior padding.',
      [0, 0, 0], [radius * 1.8, radius * 0.9, radius * 1.8], [0, -0.4, 0], '#0f172a',
      padGeom, { 'Fabric': 'Antimicrobial Microfiber' }, 'PBR_MATTE'
    );

    // 4. Retention System (Straps)
    const strapL = UniversalGeometryVocabulary.createTubeBetweenPoints([-radius*0.8, 0, 0], [-radius*0.8, -radius*0.6, 0], 0.05 * scale);
    const strapR = UniversalGeometryVocabulary.createTubeBetweenPoints([radius*0.8, 0, 0], [radius*0.8, -radius*0.6, 0], 0.05 * scale);
    addComp(
      'helmet_straps', 'Nylon Retention Straps', 'Adjustable nylon webbing chin strap with quick-release buckle.',
      [0, 0, 0], [radius * 1.6, radius * 0.6, 0.1], [0, -0.8, 0], '#000000',
      UniversalGeometryVocabulary.mergeGeometries([strapL, strapR]),
      { 'Buckle': 'Fidlock Magnetic' }, 'PBR_MATTE'
    );

    // 5. Visor (if motorcycle type, adding a basic shield)
    const visorGeom = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, radius * 0.6, 32, 1, true, -Math.PI / 4, Math.PI / 2);
    visorGeom.rotateY(Math.PI / 2); // Face forward
    visorGeom.rotateX(Math.PI / 2);
    visorGeom.translate(0, radius * 0.2, radius * 0.2);
    addComp(
      'helmet_visor', 'Optically Correct Visor', 'Anti-scratch, anti-fog coated face shield.',
      [0, radius * 0.2, radius * 0.2], [radius * 2, radius * 0.6, radius], [0, 0.4, 0.6], '#1e293b',
      visorGeom, { 'Coating': 'Anti-Fog / Anti-Scratch' }, 'PBR_GLASS'
    );

    return { components, meshSpecs, geometries };
  }

}

// src/AutonomousModelEngine/HighFidelityGenerators.ts
// Precision Procedural 3D Geometry Generators for High-Fidelity Engineering & Consumer Assemblies

import * as THREE from 'three';
import { ComponentMetadata } from '../SpatialLibrary';
import { ProceduralMeshSpecification } from './ModelTypes';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { UniversalGeometryVocabulary } from './UniversalGeometryVocabulary';

export class HighFidelityGenerators {

  // =========================================================================
  // 1. BICYCLE — HIGH-FIDELITY ROAD BIKE (Frame, Fork, Drivetrain, Disc Brakes, Wheels, Cockpit, Saddle)
  // =========================================================================
  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const wheelbase = Number(params.wheelbase || 3.4) * scale;
    const frameHeight = Number(params.frameHeight || 1.8) * scale;
    const tubeRadius = 0.045 * scale;

    // Wheel and tire dimensions with physical clearances
    const frontWheelRadius = Number(params.frontWheelRadius || params.wheelRadius || 1.1) * scale;
    const frontTireRadius = Number(params.frontTireRadius || params.tireRadius || frontWheelRadius * 1.15);
    const rearWheelRadius = Number(params.rearWheelRadius || params.wheelRadius || 1.1) * scale;
    const rearTireRadius = Number(params.rearTireRadius || params.tireRadius || rearWheelRadius * 1.15);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_METALLIC'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'box',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'Engineered Alloy [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // Node locations
    const bb: [number, number, number] = [0, -frameHeight * 0.45, 0];
    const rearHub: [number, number, number] = [-wheelbase * 0.55, -frameHeight * 0.45, 0];
    const frontHub: [number, number, number] = [wheelbase * 0.45, -frameHeight * 0.45, 0];
    const seatJunction: [number, number, number] = [-wheelbase * 0.15, frameHeight * 0.35, 0];
    const headTop: [number, number, number] = [wheelbase * 0.25, frameHeight * 0.45, 0];
    const headBottom: [number, number, number] = [wheelbase * 0.22, frameHeight * 0.05, 0];

    // 1. Aerodynamic Monocoque Carbon Fiber Diamond Frame
    const topTube = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, headTop, tubeRadius * 0.95);
    const downTube = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, headBottom, tubeRadius * 1.35);
    downTube.scale(1.1, 1.2, 0.75); // Kammtail aero airfoil section
    const seatTube = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, seatJunction, tubeRadius * 1.15);
    seatTube.scale(1.15, 1.15, 0.8);
    const headTube = UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, headTop, tubeRadius * 1.45);

    // Tapered chainstays & seatstays
    const chainstayLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], rearHub[2] - 0.22], tubeRadius * 0.75);
    const chainstayRight = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], rearHub[2] + 0.22], tubeRadius * 0.75);
    const seatstayLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], rearHub[2] - 0.22], tubeRadius * 0.55);
    const seatstayRight = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], rearHub[2] + 0.22], tubeRadius * 0.55);

    // Bottom bracket shell & Head tube gusset
    const bbShell = new THREE.CylinderGeometry(tubeRadius * 1.6, tubeRadius * 1.6, 0.38, 24);
    bbShell.rotateX(Math.PI / 2);
    bbShell.translate(bb[0], bb[1], bb[2]);

    const frameGeom = UniversalGeometryVocabulary.mergeGeometries([
      topTube, downTube, seatTube, headTube,
      chainstayLeft, chainstayRight, seatstayLeft, seatstayRight,
      bbShell
    ]);

    addComp(
      'bicycle_frame', 'Monocoque T800 Carbon Fiber Frame', 'High-modulus aerodynamic road frame with integrated internal routing.',
      [0, 0, 0], [wheelbase * 0.8, frameHeight, 0.45], [0, 0, 0], '#0f172a',
      frameGeom, { 'Material': 'Toray T800 Carbon Fiber [LIT]', 'Bottom Bracket': 'BB86 Press-Fit [LIT]', 'Dropout': '142x12mm Thru-Axle [LIT]' }, 'CARBON_FIBER'
    );

    // 2. Bladed Carbon Fork with Thru-Axle Dropouts
    const forkCrown: [number, number, number] = headBottom;
    const forkLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(forkCrown, [frontHub[0], frontHub[1], frontHub[2] - 0.18], tubeRadius * 0.85);
    forkLeft.scale(1.3, 1.0, 0.7); // Bladed aero profile
    const forkRight = UniversalGeometryVocabulary.createTubeBetweenPoints(forkCrown, [frontHub[0], frontHub[1], frontHub[2] + 0.18], tubeRadius * 0.85);
    forkRight.scale(1.3, 1.0, 0.7);
    const forkSteerer = UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, headTop, tubeRadius * 0.75);

    // Front thru-axle
    const frontAxle = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 16);
    frontAxle.rotateX(Math.PI / 2);
    frontAxle.translate(frontHub[0], frontHub[1], frontHub[2]);

    const forkGeom = UniversalGeometryVocabulary.mergeGeometries([forkLeft, forkRight, forkSteerer, frontAxle]);
    addComp(
      'bicycle_fork', 'Aero Carbon Bladed Fork', 'Tapered full carbon fork with 12x100mm thru-axle dropouts and flat brake mounts.',
      frontHub, [0.35, frameHeight * 0.45, 0.42], [0.6, -0.4, 0], '#1e293b',
      forkGeom, { 'Material': 'Unidirectional Carbon Fiber [LIT]', 'Axle Standard': '100x12mm E-Thru [LIT]', 'Offset': '45mm Rake [DATA]' }, 'CARBON_FIBER'
    );

    // 3. Front 700c Aero Disc Wheel Assembly
    const fWheelBase = UniversalGeometryVocabulary.createSpokeWheel(frontWheelRadius, frontTireRadius, 0.028 * scale, 0.035 * scale, 24, 0.007);
    fWheelBase.rotateY(Math.PI / 2);
    fWheelBase.translate(...frontHub);

    // 160mm Drilled Stainless Steel Disc Brake Rotor
    const fRotor = new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.015, 32);
    fRotor.rotateX(Math.PI / 2);
    fRotor.translate(frontHub[0], frontHub[1], frontHub[2] - 0.12);

    // Presta Valve Stem
    const fValve = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 12);
    fValve.translate(frontHub[0], frontHub[1] + frontWheelRadius * 0.82, frontHub[2]);

    const fWheelGeom = UniversalGeometryVocabulary.mergeGeometries([fWheelBase, fRotor, fValve]);
    addComp(
      'bicycle_front_wheel', 'Front 700c Carbon Disc Wheel', '50mm deep-section carbon rim with bladed straight-pull spokes and centerlock rotor.',
      frontHub, [frontTireRadius * 2, frontTireRadius * 2, 0.35], [1.3, 0, 0], '#334155',
      fWheelGeom, { 'Rim Depth': '50mm Aero [DATA]', 'Tire': '700x28c Tubeless Ready [LIT]', 'Rotor': '160mm Stainless Floating [LIT]' }, 'CARBON_FIBER'
    );

    // 4. Rear 700c Drive Wheel Assembly with 11-Speed Cassette
    const rWheelBase = UniversalGeometryVocabulary.createSpokeWheel(rearWheelRadius, rearTireRadius, 0.028 * scale, 0.035 * scale, 28, 0.007);
    rWheelBase.rotateY(Math.PI / 2);
    rWheelBase.translate(...rearHub);

    // Rear Disc Rotor
    const rRotor = new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.015, 32);
    rRotor.rotateX(Math.PI / 2);
    rRotor.translate(rearHub[0], rearHub[1], rearHub[2] - 0.12);

    // Presta Valve Stem
    const rValve = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 12);
    rValve.translate(rearHub[0], rearHub[1] + rearWheelRadius * 0.82, rearHub[2]);

    const rWheelGeom = UniversalGeometryVocabulary.mergeGeometries([rWheelBase, rRotor, rValve]);
    addComp(
      'bicycle_rear_wheel', 'Rear 700c Drive Wheel & Hub', 'Driven aero wheel assembly with 11-speed freehub body and disc brake rotor.',
      rearHub, [rearTireRadius * 2, rearTireRadius * 2, 0.35], [-1.3, 0, 0], '#334155',
      rWheelGeom, { 'Hub': 'Ratchet EXP Freehub [LIT]', 'Tire': '700x28c Tubeless [LIT]', 'Rotor': '160mm Centerlock [LIT]' }, 'CARBON_FIBER'
    );

    // 5. Complete Drivetrain (52/36T Crankset, Pedals, 11-Speed Cassette, Rear Derailleur, Roller Chain)
    const drivetrainGeoms: THREE.BufferGeometry[] = [];

    // Outer Chainring 52T & Inner 36T
    const outerRing = new THREE.CylinderGeometry(0.36, 0.36, 0.015, 48);
    outerRing.rotateX(Math.PI / 2);
    outerRing.translate(bb[0], bb[1], bb[2] + 0.16);
    const innerRing = new THREE.CylinderGeometry(0.26, 0.26, 0.015, 40);
    innerRing.rotateX(Math.PI / 2);
    innerRing.translate(bb[0], bb[1], bb[2] + 0.13);
    const spiderArm1 = new THREE.BoxGeometry(0.68, 0.06, 0.02);
    spiderArm1.translate(bb[0], bb[1], bb[2] + 0.17);
    const spiderArm2 = new THREE.BoxGeometry(0.68, 0.06, 0.02);
    spiderArm2.rotateZ(Math.PI / 2);
    spiderArm2.translate(bb[0], bb[1], bb[2] + 0.17);

    // Left & Right Crank Arms with Pedals
    const crankArmR = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] - 0.52, bb[2] + 0.18], 0.038);
    const crankArmL = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] + 0.52, bb[2] - 0.18], 0.038);

    // SPD-SL Style Road Pedals
    const pedalR = new THREE.BoxGeometry(0.18, 0.05, 0.14);
    pedalR.translate(bb[0], bb[1] - 0.52, bb[2] + 0.28);
    const pedalL = new THREE.BoxGeometry(0.18, 0.05, 0.14);
    pedalL.translate(bb[0], bb[1] + 0.52, bb[2] - 0.28);

    // 11-Speed Nickel-Plated Sprocket Stack Cassette (graduated discs)
    for (let c = 0; c < 8; c++) {
      const spRadius = 0.12 + c * 0.022;
      const spZ = rearHub[2] + 0.11 + c * 0.014;
      const sprocket = new THREE.CylinderGeometry(spRadius, spRadius, 0.008, 32);
      sprocket.rotateX(Math.PI / 2);
      sprocket.translate(rearHub[0], rearHub[1], spZ);
      drivetrainGeoms.push(sprocket);
    }

    // Rear Derailleur Body & 11T Jockey Wheels Cage
    const derailleurBody = new THREE.BoxGeometry(0.12, 0.18, 0.08);
    derailleurBody.translate(rearHub[0] + 0.08, rearHub[1] - 0.18, rearHub[2] + 0.22);
    const jockeyTop = new THREE.CylinderGeometry(0.055, 0.055, 0.015, 16);
    jockeyTop.rotateX(Math.PI / 2);
    jockeyTop.translate(rearHub[0] + 0.08, rearHub[1] - 0.22, rearHub[2] + 0.22);
    const jockeyBottom = new THREE.CylinderGeometry(0.055, 0.055, 0.015, 16);
    jockeyBottom.rotateX(Math.PI / 2);
    jockeyBottom.translate(rearHub[0] + 0.06, rearHub[1] - 0.36, rearHub[2] + 0.22);

    // Closed Roller Chain Geometry
    const chainTop = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [bb[0], bb[1] + 0.36, bb[2] + 0.16],
      [rearHub[0], rearHub[1] + 0.22, rearHub[2] + 0.16],
      0.016
    );
    const chainBottom = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [rearHub[0] + 0.06, rearHub[1] - 0.36, rearHub[2] + 0.22],
      [bb[0], bb[1] - 0.36, bb[2] + 0.16],
      0.016
    );

    drivetrainGeoms.push(
      outerRing, innerRing, spiderArm1, spiderArm2,
      crankArmR, crankArmL, pedalR, pedalL,
      derailleurBody, jockeyTop, jockeyBottom,
      chainTop, chainBottom
    );

    const drivetrainGeom = UniversalGeometryVocabulary.mergeGeometries(drivetrainGeoms);
    addComp(
      'bicycle_drivetrain', 'Precision 2x11 Drivetrain Assembly', 'Hollowtech crankset, 52/36T chainrings, 11-30T cassette, shadow rear derailleur, and roller chain.',
      bb, [0.85, 1.2, 0.45], [0, -0.6, 0.6], '#e2e8f0',
      drivetrainGeom, { 'Gearing': '52/36T Crankset x 11-30T Cassette [LIT]', 'Crank Arms': '172.5mm Hollow Carbon [LIT]', 'Chain': '11-Speed Sil-Tec [DATA]' }, 'MACHINED_ALUMINUM'
    );

    // 6. Flat-Mount Hydraulic Disc Brakes (Front & Rear Calipers & Hoses)
    const brakeGeoms: THREE.BufferGeometry[] = [];
    const fCaliper = new THREE.BoxGeometry(0.12, 0.18, 0.08);
    fCaliper.translate(frontHub[0] - 0.08, frontHub[1] + 0.14, frontHub[2] - 0.12);
    const rCaliper = new THREE.BoxGeometry(0.12, 0.18, 0.08);
    rCaliper.translate(rearHub[0] + 0.08, rearHub[1] + 0.14, rearHub[2] - 0.12);
    brakeGeoms.push(fCaliper, rCaliper);

    const brakeGeom = UniversalGeometryVocabulary.mergeGeometries(brakeGeoms);
    addComp(
      'bicycle_brakes', 'Flat-Mount Hydraulic Disc Calipers', 'Dual-piston hydraulic disc calipers with finned ICE-tech resin pads.',
      [0, -frameHeight * 0.35, -0.12], [wheelbase * 0.8, 0.3, 0.1], [0, 0, -0.5], '#1e293b',
      brakeGeom, { 'Type': 'Flat Mount Hydraulic [LIT]', 'Brake Fluid': 'Mineral Oil [LIT]', 'Pistons': 'Ceramic Dual-Opposed [DATA]' }, 'PBR_METALLIC'
    );

    // 7. Ergonomic Cutout Saddle & Micro-Adjust Carbon Seatpost
    const seatpost = UniversalGeometryVocabulary.createTubeBetweenPoints(
      seatJunction,
      [seatJunction[0] - 0.12, seatJunction[1] + 0.68, 0],
      tubeRadius * 0.82
    );

    // Twin Round Titanium Saddle Rails
    const railL = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [seatJunction[0] - 0.24, seatJunction[1] + 0.68, -0.06],
      [seatJunction[0] + 0.18, seatJunction[1] + 0.68, -0.06],
      0.012
    );
    const railR = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [seatJunction[0] - 0.24, seatJunction[1] + 0.68, 0.06],
      [seatJunction[0] + 0.18, seatJunction[1] + 0.68, 0.06],
      0.012
    );

    // Ergonomic Pressure-Relief Cutout Saddle
    const saddleShape = new THREE.Shape();
    saddleShape.moveTo(0.38, 0); // Narrow nose
    saddleShape.bezierCurveTo(0.38, 0.08, 0.12, 0.14, -0.18, 0.16); // Flare to wing
    saddleShape.bezierCurveTo(-0.35, 0.16, -0.42, 0.08, -0.42, 0); // Rear curve
    saddleShape.bezierCurveTo(-0.42, -0.08, -0.35, -0.16, -0.18, -0.16);
    saddleShape.bezierCurveTo(0.12, -0.14, 0.38, -0.08, 0.38, 0);

    const saddleExtrude = new THREE.ExtrudeGeometry(saddleShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 2,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    saddleExtrude.rotateX(Math.PI / 2);
    saddleExtrude.translate(seatJunction[0] - 0.08, seatJunction[1] + 0.74, -0.07);

    const saddleGeom = UniversalGeometryVocabulary.mergeGeometries([seatpost, railL, railR, saddleExtrude]);
    addComp(
      'bicycle_saddle', 'Ergonomic Cutout Saddle & Seatpost', 'Short-fit carbon-reinforced nylon saddle with titanium rails and 27.2mm seatpost.',
      seatJunction, [0.65, 0.8, 0.35], [-0.5, 0.9, 0], '#09090b',
      saddleGeom, { 'Rails': '7x9mm Carbon/Titanium [LIT]', 'Shell': 'Carbon-Reinforced Polymer [LIT]', 'Width': '143mm [DATA]' }, 'PBR_MATTE'
    );

    // 8. Integrated Cockpit (Aero Drop Bars, Stem with Faceplate, STI Dual-Control Levers)
    const cockpitGeoms: THREE.BufferGeometry[] = [];
    const barMid: [number, number, number] = [headTop[0] + 0.22, headTop[1] + 0.08, 0];
    const handlebarWidth = 0.84 * scale;

    // Stem with 4-bolt faceplate
    const stemTube = UniversalGeometryVocabulary.createTubeBetweenPoints(headTop, barMid, tubeRadius * 0.95);
    const stemClamp = new THREE.CylinderGeometry(tubeRadius * 1.3, tubeRadius * 1.3, 0.12, 16);
    stemClamp.rotateZ(Math.PI / 2);
    stemClamp.translate(headTop[0], headTop[1] + 0.04, 0);
    const stemFaceplate = new THREE.BoxGeometry(0.08, 0.12, 0.14);
    stemFaceplate.translate(barMid[0] + 0.04, barMid[1], 0);

    // Tops of Drop Bar
    const topBar = new THREE.CylinderGeometry(0.035, 0.035, handlebarWidth, 24);
    topBar.rotateX(Math.PI / 2);
    topBar.translate(barMid[0], barMid[1], 0);

    // Left and Right Ergonomic Drops
    const dropL = UniversalGeometryVocabulary.createCurvedTube([
      [barMid[0], barMid[1], -handlebarWidth / 2],
      [barMid[0] + 0.18, barMid[1] - 0.08, -handlebarWidth / 2],
      [barMid[0] + 0.14, barMid[1] - 0.24, -handlebarWidth / 2],
      [barMid[0] - 0.08, barMid[1] - 0.26, -handlebarWidth / 2]
    ], 0.032);

    const dropR = UniversalGeometryVocabulary.createCurvedTube([
      [barMid[0], barMid[1], handlebarWidth / 2],
      [barMid[0] + 0.18, barMid[1] - 0.08, handlebarWidth / 2],
      [barMid[0] + 0.14, barMid[1] - 0.24, handlebarWidth / 2],
      [barMid[0] - 0.08, barMid[1] - 0.26, handlebarWidth / 2]
    ], 0.032);

    // Dual-Control STI Shift/Brake Hoods and Carbon Levers
    const hoodL = UniversalGeometryVocabulary.createRoundedBox(0.2, 0.14, 0.09, 0.025);
    hoodL.translate(barMid[0] + 0.18, barMid[1] - 0.02, -handlebarWidth / 2);
    const leverL = new THREE.BoxGeometry(0.02, 0.28, 0.04);
    leverL.rotateZ(-Math.PI / 10);
    leverL.translate(barMid[0] + 0.26, barMid[1] - 0.16, -handlebarWidth / 2);

    const hoodR = UniversalGeometryVocabulary.createRoundedBox(0.2, 0.14, 0.09, 0.025);
    hoodR.translate(barMid[0] + 0.18, barMid[1] - 0.02, handlebarWidth / 2);
    const leverR = new THREE.BoxGeometry(0.02, 0.28, 0.04);
    leverR.rotateZ(-Math.PI / 10);
    leverR.translate(barMid[0] + 0.26, barMid[1] - 0.16, handlebarWidth / 2);

    cockpitGeoms.push(
      stemTube, stemClamp, stemFaceplate, topBar,
      dropL, dropR, hoodL, leverL, hoodR, leverR
    );

    const cockpitGeom = UniversalGeometryVocabulary.mergeGeometries(cockpitGeoms);
    addComp(
      'bicycle_steering_cockpit', 'Aero Drop Cockpit & STI Levers', 'Compact drop handlebars with textured bar tape wrap, 100mm stem, and hydraulic STI levers.',
      barMid, [0.55, 0.45, handlebarWidth], [0.7, 0.6, 0], '#18181b',
      cockpitGeom, { 'Bar Width': '420mm [LIT]', 'Drop': '125mm [DATA]', 'Reach': '80mm [DATA]', 'Tape': 'High-Grip Perforated Polyurethane [LIT]' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 2. OXFORD SHOE — HANDCRAFTED BESPOKE CALFSKIN DRESS SHOE
  // =========================================================================
  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const l = 2.8 * scale;
    const w = 1.05 * scale;
    const h = 1.15 * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'LEATHER'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'custom',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'Full-Grain Calfskin [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Goodyear-Welted Leather Outsole with Beveled Waist & Stacked Heel
    const soleGeom = UniversalGeometryVocabulary.createGoodyearWeltSole(l, w, 0.08 * scale, 0.18 * scale);
    addComp(
      'shoe_outsole', 'Goodyear-Welted Oak-Bark Leather Outsole', 'Single-channel stitched oak-bark tanned leather sole with beveled fiddleback waist and stacked heel.',
      [0, -0.06 * scale, 0], [w * 1.08, 0.28 * scale, l * 1.05], [0, -0.35 * scale, 0], '#2b1810',
      soleGeom, { 'Construction': '360° Goodyear Welted [LIT]', 'Sole Material': 'Oak-Bark Tanned Leather [LIT]', 'Heel Toplift': 'Quarter-Rubber Dovetail Insert [LIT]' }, 'LEATHER'
    );

    // 2. Smooth Burnished Calfskin Vamp (The main forward upper spanning to the instep)
    const vampGeom = UniversalGeometryVocabulary.createShoeUpper(l * 0.98, w * 0.98, h, 0.32 * scale);
    // Crop rear half to leave quarters and collar cleanly separated
    const vPos = vampGeom.getAttribute('position');
    for (let i = 0; i < vPos.count; i++) {
      const z = vPos.getZ(i);
      const y = vPos.getY(i);
      if (z < -l * 0.12 && y > h * 0.15) {
        // Drop down inside for foot cavity opening
        vPos.setY(i, Math.min(y, h * 0.12));
      }
    }
    vampGeom.computeVertexNormals();

    addComp(
      'shoe_vamp', 'Burnished Box Calfskin Vamp & Instep', 'Hand-patinated French full-grain box calf leather vamp extending from cap-toe seam over the instep.',
      [0, 0.12 * scale, l * 0.05], [w, h * 0.8, l * 0.65], [0, 0.4 * scale, 0.1 * scale], '#451a03',
      vampGeom, { 'Leather Origin': 'French Box-Calf (Tannerie d\'Annonay) [LIT]', 'Tannage': 'Chrome Tanned [LIT]', 'Thickness': '1.3mm [DATA]' }, 'LEATHER'
    );

    // 3. Stitched Cap Toe with Delicate Brogue Perforations
    const capGeom = new THREE.SphereGeometry(1, 48, 32);
    const cPos = capGeom.getAttribute('position');
    for (let i = 0; i < cPos.count; i++) {
      let x = cPos.getX(i);
      let y = cPos.getY(i);
      let z = cPos.getZ(i);

      if (y < 0) y = y * 0.02;
      z = z * (l / 2);

      // Only preserve the toe tip
      if (z < l * 0.22) {
        x = 0; y = 0; z = l * 0.22;
      } else {
        const t = (z - l * 0.22) / (l * 0.28);
        const wFactor = (w / 2) * Math.max(0.18, 0.92 - t * 0.75);
        x *= wFactor * 1.02;
        y *= (h * 0.38 * (1 - t * 0.45) + 0.02);
      }
      cPos.setXYZ(i, x, Math.max(0, y), z);
    }
    capGeom.computeVertexNormals();

    addComp(
      'shoe_cap_toe', 'Chiselled Straight Cap Toe', 'Reinforced toe puff cap with double-needle decorative stitching and subtle brogue punching.',
      [0, 0.1 * scale, l * 0.35], [w * 0.85, h * 0.4, l * 0.28], [0, 0.45 * scale, 0.4 * scale], '#3b1402',
      capGeom, { 'Style': 'Straight Cap Toe [LIT]', 'Internal Stiffener': 'Molded Vegetable Leather Toe Puff [LIT]' }, 'LEATHER'
    );

    // 4. Closed Oxford Quarters & Ankle Collar
    const quarterShape = new THREE.Shape();
    quarterShape.moveTo(-l * 0.48, 0);
    quarterShape.bezierCurveTo(-l * 0.48, h * 0.7, -l * 0.3, h * 0.65, -l * 0.12, h * 0.45);
    quarterShape.bezierCurveTo(-l * 0.05, h * 0.35, 0, h * 0.3, l * 0.08, h * 0.25);
    quarterShape.lineTo(l * 0.08, 0);
    quarterShape.lineTo(-l * 0.48, 0);

    const quarterExtrude = new THREE.ExtrudeGeometry(quarterShape, {
      depth: w * 0.92,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    quarterExtrude.rotateY(Math.PI / 2);
    quarterExtrude.translate(-w * 0.46, 0.08 * scale, 0);

    addComp(
      'shoe_quarters', 'Closed Balmoral Quarters & Collar', 'Side quarter panels stitched under the vamp (closed lacing) with rolled leather topline collar.',
      [0, 0.25 * scale, -l * 0.2], [w * 0.95, h * 0.75, l * 0.58], [0, 0.35 * scale, -0.3 * scale], '#361608',
      quarterExtrude, { 'Lacing Construction': 'Balmoral Closed Facing [LIT]', 'Collar Topline': 'French Bound Calfskin [LIT]' }, 'LEATHER'
    );

    // 5. 5-Eyelet Closed Facing & Straight-Bar Laces
    const lacingGeoms: THREE.BufferGeometry[] = [];
    const laceZStart = -l * 0.06;
    const laceZEnd = l * 0.14;
    const laceSteps = 5;

    for (let e = 0; e < laceSteps; e++) {
      const zE = laceZStart + (e / (laceSteps - 1)) * (laceZEnd - laceZStart);
      const yE = h * 0.38 + (1 - e / (laceSteps - 1)) * 0.18;
      const laceWidth = 0.09 + (1 - e / (laceSteps - 1)) * 0.04;

      // Eyelet Grommets (Left & Right)
      const eyeL = new THREE.TorusGeometry(0.016, 0.006, 8, 16);
      eyeL.rotateX(Math.PI / 2);
      eyeL.translate(-laceWidth / 2, yE, zE);
      const eyeR = new THREE.TorusGeometry(0.016, 0.006, 8, 16);
      eyeR.rotateX(Math.PI / 2);
      eyeR.translate(laceWidth / 2, yE, zE);

      // Horizontal Bar Lace
      const barLace = UniversalGeometryVocabulary.createTubeBetweenPoints(
        [-laceWidth / 2, yE, zE],
        [laceWidth / 2, yE, zE],
        0.012
      );

      lacingGeoms.push(eyeL, eyeR, barLace);
    }

    // Soft glove leather tongue underneath
    const tongue = UniversalGeometryVocabulary.createRoundedBox(0.18 * scale, 0.02 * scale, 0.38 * scale, 0.04 * scale);
    tongue.rotateX(-Math.PI / 8);
    tongue.translate(0, h * 0.44, laceZStart + 0.06);
    lacingGeoms.push(tongue);

    const lacingGeom = UniversalGeometryVocabulary.mergeGeometries(lacingGeoms);
    addComp(
      'shoe_lacing', 'Blind Eyelets & Waxed Cotton Bar Lacing', '5 pairs of blind interior brass eyelets laced in traditional straight European dress bar style.',
      [0, h * 0.45, 0.04 * scale], [0.24 * scale, 0.35 * scale, 0.35 * scale], [0, 0.55 * scale, 0], '#1c1917',
      lacingGeom, { 'Eyelets': '5 Blind Metal Grommets [LIT]', 'Laces': 'Braided Waxed Cotton 2.5mm Flat [LIT]' }, 'PBR_MATTE'
    );

    // 6. Leather Insole & Anatomic Heel Counter
    const insoleShape = new THREE.Shape();
    insoleShape.moveTo(0, l * 0.45);
    insoleShape.bezierCurveTo(w * 0.38, l * 0.44, w * 0.44, l * 0.25, w * 0.4, l * 0.1);
    insoleShape.bezierCurveTo(w * 0.38, 0, w * 0.26, -l * 0.12, w * 0.26, -l * 0.22);
    insoleShape.bezierCurveTo(w * 0.28, -l * 0.35, w * 0.24, -l * 0.44, 0, -l * 0.46);
    insoleShape.bezierCurveTo(-w * 0.24, -l * 0.44, -w * 0.28, -l * 0.35, -w * 0.26, -l * 0.22);
    insoleShape.bezierCurveTo(-w * 0.26, -l * 0.12, -w * 0.38, 0, -w * 0.4, l * 0.1);
    insoleShape.bezierCurveTo(-w * 0.44, l * 0.25, -w * 0.38, l * 0.44, 0, l * 0.45);

    const insoleGeom = new THREE.ExtrudeGeometry(insoleShape, {
      depth: 0.04 * scale,
      bevelEnabled: false
    });
    insoleGeom.rotateX(Math.PI / 2);
    insoleGeom.translate(0, 0.03 * scale, 0);

    addComp(
      'shoe_insole', 'Vegetable-Tanned Calf Insole & Heel Counter', 'Full-length molded vegetable-tanned calfskin footbed with arch support pad and stiffened heel counter.',
      [0, 0.05 * scale, 0], [w * 0.9, 0.12 * scale, l * 0.95], [0, 0.1 * scale, 0], '#d4a373',
      insoleGeom, { 'Insole': 'Molded Vegetable-Tanned Shoulder [LIT]', 'Counter': 'Full-Grain Leather Stiffener [LIT]' }, 'LEATHER'
    );

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 3. POWER DRILL — 20V BRUSHLESS CORDLESS IMPACT HAMMER DRILL
  // =========================================================================
  public static generatePowerDrill(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const bodyLength = 2.4 * scale;
    const gripHeight = 2.0 * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'box',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'Glass-Filled Nylon & Alloy [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Ergonomic Motor Housing & Pistol Grip with Rubber Overmold
    const housingGeoms: THREE.BufferGeometry[] = [];
    const motorCylinder = UniversalGeometryVocabulary.createRoundedBox(0.9 * scale, 0.9 * scale, 1.4 * scale, 0.12 * scale);
    motorCylinder.translate(0, 0.6 * scale, -0.2 * scale);

    // Pistol Grip
    const grip = UniversalGeometryVocabulary.createRoundedBox(0.6 * scale, gripHeight, 0.7 * scale, 0.15 * scale);
    grip.rotateX(-Math.PI / 16);
    grip.translate(0, -0.3 * scale, -0.2 * scale);

    // Motor Cooling Airflow Slots
    const ventL = UniversalGeometryVocabulary.createCoolingFinArray(6, 0.05 * scale, 0.4 * scale, 0.6 * scale, 0.04 * scale);
    ventL.translate(-0.46 * scale, 0.6 * scale, -0.2 * scale);
    const ventR = UniversalGeometryVocabulary.createCoolingFinArray(6, 0.05 * scale, 0.4 * scale, 0.6 * scale, 0.04 * scale);
    ventR.translate(0.46 * scale, 0.6 * scale, -0.2 * scale);

    housingGeoms.push(motorCylinder, grip, ventL, ventR);
    const housingGeom = UniversalGeometryVocabulary.mergeGeometries(housingGeoms);

    addComp(
      'drill_housing', 'Ergonomic Glass-Filled Nylon Housing & Grip', 'Impact-resistant PA6-GF30 polymer chassis with dual-side motor ventilation slots and rubber overmold.',
      [0, 0.2 * scale, -0.2 * scale], [1.1 * scale, 2.4 * scale, 1.6 * scale], [0, 0, 0], '#0284c7',
      housingGeom, { 'Material': 'PA6-GF30 Reinforced Polyamide [LIT]', 'Grip': 'Santoprene Thermoplastic Elastomer [LIT]' }, 'PBR_MATTE'
    );

    // 2. All-Metal 1/2" Keyless 3-Jaw Ratcheting Chuck
    const chuckGeoms: THREE.BufferGeometry[] = [];
    const chuckSleeve = UniversalGeometryVocabulary.createKnurledCylinder(0.38 * scale, 0.8 * scale, 36, 0.02 * scale);
    chuckSleeve.rotateX(Math.PI / 2);
    chuckSleeve.translate(0, 0.6 * scale, 1.05 * scale);

    // 3 Hardened Carbide Jaws
    for (let j = 0; j < 3; j++) {
      const jAngle = (j / 3) * Math.PI * 2;
      const jaw = new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.24 * scale);
      jaw.translate(Math.cos(jAngle) * 0.12 * scale, 0.6 * scale + Math.sin(jAngle) * 0.12 * scale, 1.48 * scale);
      chuckGeoms.push(jaw);
    }
    chuckGeoms.push(chuckSleeve);
    const chuckGeom = UniversalGeometryVocabulary.mergeGeometries(chuckGeoms);

    addComp(
      'drill_chuck', '1/2-Inch All-Metal Ratcheting Keyless Chuck', 'Heavy-duty single-sleeve keyless chuck with carbide gripping jaws and positive locking ratchet.',
      [0, 0.6 * scale, 1.1 * scale], [0.8 * scale, 0.8 * scale, 1.0 * scale], [0, 0, 0.8 * scale], '#334155',
      chuckGeom, { 'Capacity': '1.5mm - 13mm (1/2\") [LIT]', 'Spindle Thread': '1/2\"-20 UNF [LIT]', 'Jaws': 'Carbide-Tipped Tool Steel [LIT]' }, 'MACHINED_ALUMINUM'
    );

    // 3. 24-Position Torque Adjustment Collar & 2-Speed Gearbox Selector
    const collarGeoms: THREE.BufferGeometry[] = [];
    const collar = UniversalGeometryVocabulary.createKnurledCylinder(0.44 * scale, 0.35 * scale, 24, 0.025 * scale);
    collar.rotateX(Math.PI / 2);
    collar.translate(0, 0.6 * scale, 0.55 * scale);

    // Top Spine 2-Speed Mechanical Slide Switch
    const speedSwitch = new THREE.BoxGeometry(0.22 * scale, 0.12 * scale, 0.3 * scale);
    speedSwitch.translate(0, 1.12 * scale, -0.15 * scale);
    collarGeoms.push(collar, speedSwitch);
    const collarGeom = UniversalGeometryVocabulary.mergeGeometries(collarGeoms);

    addComp(
      'drill_torque_collar', '24-Position Torque Clutch & 2-Speed Selector', 'Mechanical slip-clutch collar with hammer drill mode selector and high/low planetary gearbox switch.',
      [0, 0.7 * scale, 0.5 * scale], [0.9 * scale, 0.9 * scale, 0.5 * scale], [0, 0.3 * scale, 0.4 * scale], '#1e293b',
      collarGeom, { 'Clutch Settings': '24 + Drill + Hammer Modes [DATA]', 'Gear 1 RPM': '0 - 550 RPM (High Torque) [DATA]', 'Gear 2 RPM': '0 - 2,000 RPM (High Speed) [DATA]' }, 'PBR_METALLIC'
    );

    // 4. Brushless DC Motor & Planetary Gearbox Assembly (Internal)
    const motorGeoms: THREE.BufferGeometry[] = [];
    const stator = new THREE.CylinderGeometry(0.35 * scale, 0.35 * scale, 0.55 * scale, 24);
    stator.rotateX(Math.PI / 2);
    stator.translate(0, 0.6 * scale, -0.2 * scale);

    const planetaryGearset = new THREE.CylinderGeometry(0.38 * scale, 0.38 * scale, 0.4 * scale, 24);
    planetaryGearset.rotateX(Math.PI / 2);
    planetaryGearset.translate(0, 0.6 * scale, 0.2 * scale);

    motorGeoms.push(stator, planetaryGearset);
    const motorGeom = UniversalGeometryVocabulary.mergeGeometries(motorGeoms);

    addComp(
      'drill_motor_core', 'Brushless DC Motor & 3-Stage Planetary Gearbox', 'High-efficiency 4-pole brushless motor coupled to an all-metal 3-stage planetary reduction geartrain.',
      [0, 0.6 * scale, 0], [0.8 * scale, 0.8 * scale, 1.0 * scale], [0, 0.8 * scale, 0], '#ca8a04',
      motorGeom, { 'Motor Type': 'Brushless BLDC Outrunner [LIT]', 'Max Torque': '95 Nm (840 in-lbs) [DATA]', 'Transmission': 'All-Metal Planetary Gears [LIT]' }, 'COPPER'
    );

    // 5. Trigger Switch, Forward/Reverse Selector, and LED Worklight
    const triggerGeoms: THREE.BufferGeometry[] = [];
    const trigger = UniversalGeometryVocabulary.createRoundedBox(0.18 * scale, 0.35 * scale, 0.22 * scale, 0.04 * scale);
    trigger.translate(0, 0.2 * scale, 0.15 * scale);

    const fwdRevRocker = new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 0.7 * scale, 16);
    fwdRevRocker.rotateZ(Math.PI / 2);
    fwdRevRocker.translate(0, 0.42 * scale, -0.05 * scale);

    // Base LED Worklight
    const ledBezel = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.06 * scale, 16);
    ledBezel.rotateX(-Math.PI / 4);
    ledBezel.translate(0, -0.85 * scale, 0.25 * scale);

    triggerGeoms.push(trigger, fwdRevRocker, ledBezel);
    const triggerGeom = UniversalGeometryVocabulary.mergeGeometries(triggerGeoms);

    addComp(
      'drill_controls', 'Variable-Speed Trigger, Direction Selector & LED', 'Linear Hall-effect variable speed trigger switch, through-body shuttle selector, and 60-lumen shadowless LED.',
      [0, 0.1 * scale, 0.1 * scale], [0.7 * scale, 1.1 * scale, 0.4 * scale], [0, 0, 0.4 * scale], '#dc2626',
      triggerGeom, { 'Switch': 'Variable Speed Hall-Effect [LIT]', 'LED Illuminance': '60 Lumens with 20s Delay [DATA]' }, 'PBR_MATTE'
    );

    // 6. 20V Max Lithium-Ion Slide-On Battery Pack
    const battGeoms: THREE.BufferGeometry[] = [];
    const battPack = UniversalGeometryVocabulary.createRoundedBox(1.1 * scale, 0.75 * scale, 1.5 * scale, 0.12 * scale);
    battPack.translate(0, -1.55 * scale, -0.2 * scale);

    // Release Latch Button
    const latch = new THREE.BoxGeometry(0.35 * scale, 0.15 * scale, 0.15 * scale);
    latch.translate(0, -1.25 * scale, 0.45 * scale);

    // 3-Segment LED Fuel Gauge
    for (let b = 0; b < 3; b++) {
      const bar = new THREE.BoxGeometry(0.08 * scale, 0.03 * scale, 0.02 * scale);
      bar.translate(-0.12 * scale + b * 0.12 * scale, -1.45 * scale, 0.56 * scale);
      battGeoms.push(bar);
    }
    battGeoms.push(battPack, latch);
    const battGeom = UniversalGeometryVocabulary.mergeGeometries(battGeoms);

    addComp(
      'drill_battery_pack', '20V Max 5.0Ah Li-Ion Slide Pack & Fuel Gauge', 'High-discharge 18650/21700 cell pack with integrated cell-monitoring BMS and 3-LED fuel gauge.',
      [0, -1.5 * scale, -0.2 * scale], [1.2 * scale, 0.9 * scale, 1.6 * scale], [0, -0.8 * scale, 0], '#0f172a',
      battGeom, { 'Voltage': '20V Max (18V Nominal) [LIT]', 'Capacity': '5.0 Ah (90 Wh) [LIT]', 'Cells': '10x Samsung INR18650-25R [DATA]' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 4. COFFEE MACHINE — PROSUMER DUAL-BOILER ESPRESSO MACHINE
  // =========================================================================
  public static generateCoffeeMachine(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = 2.4 * scale;
    const height = 2.8 * scale;
    const depth = 2.6 * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'STAINLESS_STEEL'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'box',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'AISI 304 Stainless Steel [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Mirror-Finish 304 Stainless Steel Body Chassis & Frame
    const bodyGeoms: THREE.BufferGeometry[] = [];
    const mainCabinet = UniversalGeometryVocabulary.createRoundedBox(width, height * 0.95, depth * 0.9, 0.08 * scale);
    mainCabinet.translate(0, 0.1 * scale, -depth * 0.05);

    // Cup Warming Tray Perimeter Guard Railing
    const railL = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [-width * 0.44, height * 0.58, depth * 0.3],
      [-width * 0.44, height * 0.58, -depth * 0.44],
      0.02 * scale
    );
    const railR = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [width * 0.44, height * 0.58, depth * 0.3],
      [width * 0.44, height * 0.58, -depth * 0.44],
      0.02 * scale
    );
    const railBack = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [-width * 0.44, height * 0.58, -depth * 0.44],
      [width * 0.44, height * 0.58, -depth * 0.44],
      0.02 * scale
    );

    // Rear Side Ventilation Louvers
    const louvers = UniversalGeometryVocabulary.createCoolingFinArray(8, width * 0.8, 0.03 * scale, 0.4 * scale, 0.015 * scale);
    louvers.translate(0, height * 0.3, -depth * 0.48);

    bodyGeoms.push(mainCabinet, railL, railR, railBack, louvers);
    const bodyGeom = UniversalGeometryVocabulary.mergeGeometries(bodyGeoms);

    addComp(
      'espresso_chassis', 'Mirror-Polished 304 Stainless Steel Cabinet', 'Heavy-gauge laser-cut AISI 304 stainless steel body with passive thermal cup warming tray and ventilation louvers.',
      [0, 0.1 * scale, 0], [width, height, depth], [0, 0, 0], '#f8fafc',
      bodyGeom, { 'Material': 'Mirror AISI 304 Stainless Steel [LIT]', 'Frame': 'Powder-Coated Steel Subframe [LIT]' }, 'CHROME'
    );

    // 2. Solid Brass E61 Group Head & Manual Mechanical Extraction Cam
    const groupGeoms: THREE.BufferGeometry[] = [];
    const groupBody = UniversalGeometryVocabulary.createChamferedCylinder(0.35 * scale, 0.65 * scale, 0.05 * scale, 32);
    groupBody.translate(0, 0.25 * scale, depth * 0.48);

    // Thermo-syphon circulation neck
    const neck = new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, 0.4 * scale, 24);
    neck.rotateX(Math.PI / 2);
    neck.translate(0, 0.38 * scale, depth * 0.32);

    // Manual Cam Lever
    const leverCam = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.45 * scale, 16);
    leverCam.rotateZ(-Math.PI / 4);
    leverCam.translate(0.38 * scale, 0.35 * scale, depth * 0.45);
    const leverKnob = new THREE.SphereGeometry(0.09 * scale, 16, 16);
    leverKnob.translate(0.52 * scale, 0.5 * scale, depth * 0.45);

    groupGeoms.push(groupBody, neck, leverCam, leverKnob);
    const groupGeom = UniversalGeometryVocabulary.mergeGeometries(groupGeoms);

    addComp(
      'espresso_group_head', 'Solid Chrome-Plated Brass E61 Group Head', '4.2 kg classic E61 thermosyphon circulation group with mechanical pre-infusion chamber and manual lever.',
      [0, 0.3 * scale, depth * 0.45], [0.9 * scale, 0.8 * scale, 0.8 * scale], [0, 0, 0.6 * scale], '#e2e8f0',
      groupGeom, { 'Mass': '4.2 kg Solid Brass [DATA]', 'Circulation': 'Dual Thermosyphon Heat Loop [LIT]', 'Pre-Infusion': 'Mechanical Spring Chamber [LIT]' }, 'CHROME'
    );

    // 3. 58mm Commercial Portafilter with Dual Spouts and Turned Walnut Handle
    const portafilterGeoms: THREE.BufferGeometry[] = [];
    const basketRing = new THREE.CylinderGeometry(0.36 * scale, 0.34 * scale, 0.28 * scale, 32);
    basketRing.translate(0, -0.05 * scale, depth * 0.48);

    // Turned Ergonomic Wooden Handle
    const handle = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [0, -0.05 * scale, depth * 0.48],
      [0, -0.15 * scale, depth * 0.48 + 1.2 * scale],
      0.08 * scale
    );

    // Dual Bottom Spouts
    const spoutL = new THREE.CylinderGeometry(0.04 * scale, 0.03 * scale, 0.16 * scale, 12);
    spoutL.translate(-0.1 * scale, -0.25 * scale, depth * 0.48);
    const spoutR = new THREE.CylinderGeometry(0.04 * scale, 0.03 * scale, 0.16 * scale, 12);
    spoutR.translate(0.1 * scale, -0.25 * scale, depth * 0.48);

    portafilterGeoms.push(basketRing, handle, spoutL, spoutR);
    const portafilterGeom = UniversalGeometryVocabulary.mergeGeometries(portafilterGeoms);

    addComp(
      'espresso_portafilter', '58mm Brass Portafilter & Turned Walnut Handle', 'Commercial 58mm chrome-plated brass portafilter with precision 18g double basket and turned walnut handle.',
      [0, -0.1 * scale, depth * 0.7], [0.8 * scale, 0.4 * scale, 1.4 * scale], [0, -0.4 * scale, 0.8 * scale], '#78350f',
      portafilterGeom, { 'Diameter': '58 mm Commercial Standard [LIT]', 'Capacity': '18g Ridge-less Precision Basket [LIT]', 'Handle': 'Solid American Walnut [LIT]' }, 'WOOD'
    );

    // 4. Cool-Touch Articulating Steam Wand & Hot Water Dispenser
    const wandGeoms: THREE.BufferGeometry[] = [];
    // Left Steam Wand
    const steamWand = UniversalGeometryVocabulary.createCurvedTube([
      [-width * 0.36, 0.3 * scale, depth * 0.38],
      [-width * 0.46, 0.15 * scale, depth * 0.46],
      [-width * 0.42, -0.3 * scale, depth * 0.52]
    ], 0.035 * scale);

    // 4-Hole Steam Tip
    const steamTip = new THREE.CylinderGeometry(0.04 * scale, 0.025 * scale, 0.08 * scale, 16);
    steamTip.translate(-width * 0.42, -0.34 * scale, depth * 0.52);

    // Right Hot Water Tap
    const waterTap = UniversalGeometryVocabulary.createCurvedTube([
      [width * 0.36, 0.3 * scale, depth * 0.38],
      [width * 0.44, 0.15 * scale, depth * 0.46],
      [width * 0.4, -0.2 * scale, depth * 0.5]
    ], 0.035 * scale);

    // Rotary Valve Knobs (Steam & Hot Water)
    const steamKnob = UniversalGeometryVocabulary.createKnurledCylinder(0.18 * scale, 0.12 * scale, 24, 0.015 * scale);
    steamKnob.rotateX(Math.PI / 2);
    steamKnob.translate(-width * 0.36, 0.45 * scale, depth * 0.41);

    const waterKnob = UniversalGeometryVocabulary.createKnurledCylinder(0.18 * scale, 0.12 * scale, 24, 0.015 * scale);
    waterKnob.rotateX(Math.PI / 2);
    waterKnob.translate(width * 0.36, 0.45 * scale, depth * 0.41);

    wandGeoms.push(steamWand, steamTip, waterTap, steamKnob, waterKnob);
    const wandGeom = UniversalGeometryVocabulary.mergeGeometries(wandGeoms);

    addComp(
      'espresso_steam_wands', 'Cool-Touch Steam Wand & Hot Water Tap', 'Double-insulated cool-touch stainless steam wand with 4-hole tip and rotary brass valves.',
      [0, 0.1 * scale, depth * 0.45], [width * 0.95, 0.9 * scale, 0.4 * scale], [0, 0.2 * scale, 0.5 * scale], '#cbd5e1',
      wandGeom, { 'Steam Tip': '4-Hole 1.5mm Precision Nozzle [LIT]', 'Boiler Connection': 'Cool-Touch Double Wall PTFE Liner [LIT]' }, 'CHROME'
    );

    // 5. Dual Analog Retro Pressure Gauges (Steam Boiler & Brew Extraction)
    const gaugeGeoms: THREE.BufferGeometry[] = [];
    const gaugeL = UniversalGeometryVocabulary.createChamferedCylinder(0.22 * scale, 0.06 * scale, 0.015 * scale, 24);
    gaugeL.rotateX(Math.PI / 2);
    gaugeL.translate(-width * 0.18, 0.42 * scale, depth * 0.41);

    const gaugeR = UniversalGeometryVocabulary.createChamferedCylinder(0.22 * scale, 0.06 * scale, 0.015 * scale, 24);
    gaugeR.rotateX(Math.PI / 2);
    gaugeR.translate(width * 0.18, 0.42 * scale, depth * 0.41);

    gaugeGeoms.push(gaugeL, gaugeR);
    const gaugeGeom = UniversalGeometryVocabulary.mergeGeometries(gaugeGeoms);

    addComp(
      'espresso_gauges', 'Dual White-Dial Analog Pressure Manometers', 'Precision Bourdon tube gauges monitoring steam boiler pressure (0-3 bar) and pump brew pressure (0-16 bar).',
      [0, 0.42 * scale, depth * 0.41], [width * 0.5, 0.5 * scale, 0.15 * scale], [0, 0.3 * scale, 0.4 * scale], '#0f172a',
      gaugeGeom, { 'Steam Gauge': '0 - 3 Bar with Green Zone (1.2-1.5 Bar) [DATA]', 'Brew Gauge': '0 - 16 Bar with 9 Bar Extraction Target [DATA]' }, 'PBR_METALLIC'
    );

    // 6. Laser-Cut Stainless Drip Tray with Drainage Grate
    const trayGeoms: THREE.BufferGeometry[] = [];
    const trayBase = UniversalGeometryVocabulary.createRoundedBox(width * 0.96, 0.25 * scale, depth * 0.5, 0.06 * scale);
    trayBase.translate(0, -height * 0.42, depth * 0.3);

    // Laser-Slotted Grate
    const grate = UniversalGeometryVocabulary.createCoolingFinArray(14, width * 0.88, 0.02 * scale, depth * 0.44, 0.02 * scale);
    grate.translate(0, -height * 0.3 + 0.02 * scale, depth * 0.3);

    trayGeoms.push(trayBase, grate);
    const trayGeom = UniversalGeometryVocabulary.mergeGeometries(trayGeoms);

    addComp(
      'espresso_drip_tray', 'Removable Slotted Drip Tray & Grate', 'Deep 1.8-liter brushed stainless reservoir with laser-cut anti-splash drainage grate and red float indicator.',
      [0, -height * 0.4 * scale, depth * 0.3], [width, 0.3 * scale, depth * 0.55], [0, -0.4 * scale, 0.4 * scale], '#94a3b8',
      trayGeom, { 'Capacity': '1.8 Liters Drainage Reservoir [DATA]', 'Grate': 'Laser-Cut Slotted Stainless Plate [LIT]' }, 'MACHINED_ALUMINUM'
    );

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 5. DESKTOP PC — TEMPERED GLASS LIQUID-COOLED GAMING WORKSTATION TOWER
  // =========================================================================
  public static generateDesktopPC(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = 1.6 * scale;
    const height = 3.2 * scale;
    const depth = 3.0 * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_METALLIC'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'box',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'Anodized Aluminum & Steel [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Mid-Tower Steel/Aluminum Chassis & PSU Basement Shroud
    const chassisGeoms: THREE.BufferGeometry[] = [];
    const rearSpine = new THREE.BoxGeometry(width, height, 0.08 * scale);
    rearSpine.translate(0, 0, -depth / 2);
    const topPlate = new THREE.BoxGeometry(width, 0.08 * scale, depth);
    topPlate.translate(0, height / 2, 0);
    const bottomPlate = new THREE.BoxGeometry(width, 0.08 * scale, depth);
    bottomPlate.translate(0, -height / 2, 0);
    const rightPanel = new THREE.BoxGeometry(0.04 * scale, height, depth);
    rightPanel.translate(width / 2, 0, 0);

    // Lower PSU / Drive Bay Basement Shroud
    const psuShroud = new THREE.BoxGeometry(width * 0.95, 0.65 * scale, depth * 0.95);
    psuShroud.translate(0, -height / 2 + 0.35 * scale, 0);

    chassisGeoms.push(rearSpine, topPlate, bottomPlate, rightPanel, psuShroud);
    const chassisGeom = UniversalGeometryVocabulary.mergeGeometries(chassisGeoms);

    addComp(
      'pc_chassis', 'SGCC Steel & Anodized Aluminum Chassis', 'Rigid dual-chamber mid-tower enclosure with isolated lower power supply compartment and cable management channels.',
      [0, 0, 0], [width, height, depth], [0, 0, 0], '#09090b',
      chassisGeom, { 'Material': '0.8mm Electro-Galvanized Steel & Anodized Aluminum [LIT]', 'Form Factor': 'Standard ATX Mid-Tower [LIT]' }, 'PBR_MATTE'
    );

    // 2. Tinted Tempered Glass Side Window
    const glassPanel = new THREE.BoxGeometry(0.04 * scale, height * 0.92, depth * 0.92);
    glassPanel.translate(-width / 2 - 0.02 * scale, 0, 0);

    addComp(
      'pc_tempered_glass', '4mm Smoked Tempered Glass Side Panel', 'High-clarity impact-tested tempered safety glass with acoustic dampening perimeter gasket.',
      [-width / 2, 0, 0], [0.1 * scale, height * 0.95, depth * 0.95], [-0.8 * scale, 0, 0], '#18181b',
      glassPanel, { 'Material': '4.0mm Chemically Strengthened Tempered Glass [LIT]', 'Tint': '25% Smoked Light Transmission [LIT]' }, 'OPTICAL_GLASS'
    );

    // 3. ATX Motherboard with VRM Heatsinks & Dual DDR5 RAM
    const moboGeoms: THREE.BufferGeometry[] = [];
    const pcb = new THREE.BoxGeometry(0.04 * scale, height * 0.6, depth * 0.65);
    pcb.translate(width / 2 - 0.1 * scale, 0.15 * scale, -depth * 0.05);

    // Dual Large VRM Aluminum Heatsink Blocks
    const vrmTop = new THREE.BoxGeometry(0.18 * scale, 0.22 * scale, 0.45 * scale);
    vrmTop.translate(width / 2 - 0.18 * scale, height * 0.35 * scale, -depth * 0.15);
    const vrmLeft = new THREE.BoxGeometry(0.18 * scale, 0.45 * scale, 0.18 * scale);
    vrmLeft.translate(width / 2 - 0.18 * scale, 0.15 * scale, -depth * 0.32);

    // Dual DDR5 RAM Modules with Brushed Heatspreaders
    const ram1 = new THREE.BoxGeometry(0.05 * scale, 0.35 * scale, 0.38 * scale);
    ram1.translate(width / 2 - 0.16 * scale, 0.22 * scale, 0.05 * scale);
    const ram2 = new THREE.BoxGeometry(0.05 * scale, 0.35 * scale, 0.38 * scale);
    ram2.translate(width / 2 - 0.22 * scale, 0.22 * scale, 0.05 * scale);

    moboGeoms.push(pcb, vrmTop, vrmLeft, ram1, ram2);
    const moboGeom = UniversalGeometryVocabulary.mergeGeometries(moboGeoms);

    addComp(
      'pc_motherboard', 'Flagship Z790/X670 ATX Motherboard & RAM', '8-layer low-loss PCB with 20+1 power stages, massive aluminum fin heatsinks, and 64GB DDR5-6000 memory.',
      [width * 0.35, 0.2 * scale, 0], [0.4 * scale, height * 0.65, depth * 0.7], [0, 0, -0.4 * scale], '#1e293b',
      moboGeom, { 'Chipset': 'Intel Z790 / AMD X670E High-End Desktop [LIT]', 'Memory': '64GB (2x32GB) DDR5-6000 CL30 [DATA]', 'PCB Layers': '8-Layer 2oz Copper [LIT]' }, 'PCB_FR4'
    );

    // 4. Flagship Triple-Fan Graphics Processing Unit (GPU)
    const gpuGeoms: THREE.BufferGeometry[] = [];
    const gpuShroud = UniversalGeometryVocabulary.createRoundedBox(0.48 * scale, 0.85 * scale, depth * 0.65, 0.06 * scale);
    gpuShroud.translate(0, -0.25 * scale, 0.1 * scale);

    // Triple Axial Fans
    for (let f = 0; f < 3; f++) {
      const fanHub = new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 0.04 * scale, 24);
      fanHub.rotateZ(Math.PI / 2);
      fanHub.translate(-0.25 * scale, -0.25 * scale, -depth * 0.15 + f * 0.28 * scale);
      gpuGeoms.push(fanHub);
    }

    // Metal Backplate
    const backplate = new THREE.BoxGeometry(0.02 * scale, 0.82 * scale, depth * 0.62);
    backplate.translate(0.25 * scale, -0.25 * scale, 0.1 * scale);

    gpuGeoms.push(gpuShroud, backplate);
    const gpuGeom = UniversalGeometryVocabulary.mergeGeometries(gpuGeoms);

    addComp(
      'pc_gpu', 'Triple-Fan Flagship GPU & Die-Cast Backplate', '24GB VRAM discrete desktop GPU with vapor chamber coldplate, triple alternate-spinning axial fans, and aluminum backplate.',
      [0, -0.25 * scale, 0.1 * scale], [0.6 * scale, 0.9 * scale, depth * 0.7], [-0.5 * scale, 0, 0.4 * scale], '#27272a',
      gpuGeom, { 'GPU Core': 'NVIDIA RTX 4090 / AMD RX 7900 XTX [LIT]', 'VRAM': '24GB GDDR6X 384-bit [LIT]', 'TDP': '450 Watts Power Limit [DATA]' }, 'MACHINED_ALUMINUM'
    );

    // 5. 360mm AIO Liquid Cooler (Radiator, Braided Tubing, and Pump Block)
    const aioGeoms: THREE.BufferGeometry[] = [];
    const rad = new THREE.BoxGeometry(width * 0.9, 0.22 * scale, depth * 0.85);
    rad.translate(0, height / 2 - 0.15 * scale, 0);

    // CPU Pump / Cold Plate Block
    const pumpBlock = UniversalGeometryVocabulary.createChamferedCylinder(0.28 * scale, 0.28 * scale, 0.04 * scale, 32);
    pumpBlock.rotateZ(Math.PI / 2);
    pumpBlock.translate(width / 2 - 0.22 * scale, 0.25 * scale, -depth * 0.12);

    // Braided High-Density Tubing Loops
    const tube1 = UniversalGeometryVocabulary.createCurvedTube([
      [width / 2 - 0.22 * scale, 0.28 * scale, -depth * 0.08],
      [0.1 * scale, 0.8 * scale, -depth * 0.05],
      [0, height / 2 - 0.2 * scale, 0.1 * scale]
    ], 0.038 * scale);

    const tube2 = UniversalGeometryVocabulary.createCurvedTube([
      [width / 2 - 0.22 * scale, 0.22 * scale, -depth * 0.16],
      [0.1 * scale, 0.75 * scale, -depth * 0.15],
      [0, height / 2 - 0.2 * scale, -0.2 * scale]
    ], 0.038 * scale);

    aioGeoms.push(rad, pumpBlock, tube1, tube2);
    const aioGeom = UniversalGeometryVocabulary.mergeGeometries(aioGeoms);

    addComp(
      'pc_liquid_cooler', '360mm AIO Liquid Cooling System', 'High-fin density copper radiator with dual braided FEP tubes and micro-channel copper CPU cold plate.',
      [0, height * 0.35, 0], [width, 0.8 * scale, depth * 0.9], [0, 0.6 * scale, 0], '#0284c7',
      aioGeom, { 'Radiator Size': '360mm Aluminum Triple-Fan [LIT]', 'Coldplate': 'Skived Micro-Fin Pure Copper [LIT]', 'Pump Speed': '3,200 RPM Ceramic Bearing [DATA]' }, 'PBR_METALLIC'
    );

    // 6. Triple 120mm PWM Front Intake Fans with Aero Blades
    const fanGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      const yF = height / 2 - 0.65 * scale - i * 0.85 * scale;
      const fanFrame = new THREE.BoxGeometry(width * 0.85, 0.75 * scale, 0.12 * scale);
      fanFrame.translate(0, yF, depth / 2 - 0.08 * scale);

      const fanRotor = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.08 * scale, 24);
      fanRotor.rotateX(Math.PI / 2);
      fanRotor.translate(0, yF, depth / 2 - 0.08 * scale);

      fanGeoms.push(fanFrame, fanRotor);
    }
    const fanGeom = UniversalGeometryVocabulary.mergeGeometries(fanGeoms);

    addComp(
      'pc_intake_fans', 'Triple 120mm High-Static-Pressure PWM Intake Fans', 'Fluid dynamic bearing (FDB) intake fans delivering positive chamber air pressure with anti-vibration rubber mounts.',
      [0, 0, depth * 0.45], [width * 0.9, height * 0.8, 0.25 * scale], [0, 0, 0.6 * scale], '#18181b',
      fanGeom, { 'Fan Speed': '500 - 2,000 RPM (PWM Controlled) [DATA]', 'Airflow': '78.5 CFM per Fan [DATA]', 'Bearing': 'Fluid Dynamic Bearing (FDB) [LIT]' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 6. MICROSCOPE — HIGH-PRECISION LABORATORY COMPOUND OPTICAL MICROSCOPE
  // =========================================================================
  public static generateMicroscope(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const height = 3.4 * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'CAST_ALUMINUM'
    ) => {
      components.push({
        id,
        name,
        description,
        position: pos,
        size,
        explodedOffset: offset,
        shape: 'cylinder',
        color,
        specifications: specs,
        engineeringDetails: {
          material: specs['Material'] || 'Cast Aluminum Alloy & Optical Glass [LIT]'
        }
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Heavy Cast-Iron Vibration-Damping Base & Integrated LED Illuminator
    const baseGeoms: THREE.BufferGeometry[] = [];
    const horseshoeBase = UniversalGeometryVocabulary.createRoundedBox(1.8 * scale, 0.35 * scale, 2.2 * scale, 0.18 * scale);
    horseshoeBase.translate(0, -height / 2 + 0.18 * scale, 0);

    // Kohler Field Diaphragm / LED Light Port
    const fieldLens = new THREE.CylinderGeometry(0.35 * scale, 0.38 * scale, 0.14 * scale, 24);
    fieldLens.translate(0, -height / 2 + 0.42 * scale, 0.25 * scale);

    baseGeoms.push(horseshoeBase, fieldLens);
    const baseGeom = UniversalGeometryVocabulary.mergeGeometries(baseGeoms);

    addComp(
      'microscope_base', 'Cast-Iron Vibration-Damping Base & LED Illuminator', 'Heavy low-center-of-gravity die-cast base with built-in 3W continuous Kohler LED light source and field diaphragm dial.',
      [0, -height / 2 + 0.25 * scale, 0], [2.0 * scale, 0.6 * scale, 2.4 * scale], [0, -0.4 * scale, 0], '#334155',
      baseGeom, { 'Base Mass': '5.8 kg Die-Cast Zinc-Aluminum [DATA]', 'Light Source': '3W Kohler LED (6500K Daylight Spectrum) [LIT]' }, 'CAST_ALUMINUM'
    );

    // 2. Rigid Curved C-Frame Stand Arm & Coaxial Coarse/Fine Focus Knobs
    const armGeoms: THREE.BufferGeometry[] = [];
    const armPillar = UniversalGeometryVocabulary.createCurvedTube([
      [0, -height / 2 + 0.35 * scale, -0.6 * scale],
      [0, 0, -0.75 * scale],
      [0, height * 0.35, -0.6 * scale],
      [0, height * 0.42, 0]
    ], 0.22 * scale);

    // Coaxial Focus Knobs (Coarse outer + Fine inner)
    const coarseKnobL = UniversalGeometryVocabulary.createKnurledCylinder(0.32 * scale, 0.18 * scale, 32, 0.02 * scale);
    coarseKnobL.rotateZ(Math.PI / 2);
    coarseKnobL.translate(-0.52 * scale, -0.2 * scale, -0.6 * scale);

    const fineKnobL = UniversalGeometryVocabulary.createKnurledCylinder(0.18 * scale, 0.28 * scale, 24, 0.015 * scale);
    fineKnobL.rotateZ(Math.PI / 2);
    fineKnobL.translate(-0.62 * scale, -0.2 * scale, -0.6 * scale);

    const coarseKnobR = UniversalGeometryVocabulary.createKnurledCylinder(0.32 * scale, 0.18 * scale, 32, 0.02 * scale);
    coarseKnobR.rotateZ(Math.PI / 2);
    coarseKnobR.translate(0.52 * scale, -0.2 * scale, -0.6 * scale);

    const fineKnobR = UniversalGeometryVocabulary.createKnurledCylinder(0.18 * scale, 0.28 * scale, 24, 0.015 * scale);
    fineKnobR.rotateZ(Math.PI / 2);
    fineKnobR.translate(0.62 * scale, -0.2 * scale, -0.6 * scale);

    armGeoms.push(armPillar, coarseKnobL, fineKnobL, coarseKnobR, fineKnobR);
    const armGeom = UniversalGeometryVocabulary.mergeGeometries(armGeoms);

    addComp(
      'microscope_arm', 'Rigid Curved C-Frame Arm & Coaxial Focus Drives', 'Cast aluminum ergonomic limb housing ball-bearing rack-and-pinion movement with 0.002mm fine focus resolution.',
      [0, 0.1 * scale, -0.6 * scale], [1.4 * scale, height * 0.85, 1.2 * scale], [0, 0, -0.5 * scale], '#f8fafc',
      armGeom, { 'Fine Focus Precision': '0.002mm (2 Microns per Division) [DATA]', 'Coarse Travel': '30mm with Slip Clutch [LIT]' }, 'PBR_METALLIC'
    );

    // 3. Double-Layer Mechanical Stage with X-Y Vernier Controls
    const stageGeoms: THREE.BufferGeometry[] = [];
    const mainStage = UniversalGeometryVocabulary.createRoundedBox(1.5 * scale, 0.12 * scale, 1.4 * scale, 0.05 * scale);
    mainStage.translate(0, 0, 0.25 * scale);

    // Slide Clip Caliper Mechanism
    const slideCaliper = new THREE.BoxGeometry(0.85 * scale, 0.04 * scale, 0.08 * scale);
    slideCaliper.translate(-0.2 * scale, 0.08 * scale, 0.25 * scale);

    // Low-Position Coaxial X-Y Drop Control Knobs
    const xyKnob = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.45 * scale, 16);
    xyKnob.translate(0.65 * scale, -0.22 * scale, 0.25 * scale);

    stageGeoms.push(mainStage, slideCaliper, xyKnob);
    const stageGeom = UniversalGeometryVocabulary.mergeGeometries(stageGeoms);

    addComp(
      'microscope_stage', 'Double-Layer Mechanical Stage with X-Y Caliper', 'Wear-resistant hard-anodized aluminum mechanical stage with 76x52mm cross-travel and vernier scale reading.',
      [0, 0, 0.25 * scale], [1.6 * scale, 0.5 * scale, 1.5 * scale], [0, 0, 0.5 * scale], '#0f172a',
      stageGeom, { 'Stage Dimensions': '160 x 140 mm [DATA]', 'X-Y Range': '76 x 52 mm Travel [DATA]', 'Scale': 'Vernier Caliper 0.1mm [LIT]' }, 'PBR_MATTE'
    );

    // 4. Substage Abbe Condenser N.A. 1.25 with Iris Diaphragm
    const condenserGeoms: THREE.BufferGeometry[] = [];
    const condBody = new THREE.CylinderGeometry(0.3 * scale, 0.24 * scale, 0.35 * scale, 24);
    condBody.translate(0, -0.32 * scale, 0.25 * scale);

    const irisLever = new THREE.BoxGeometry(0.25 * scale, 0.03 * scale, 0.03 * scale);
    irisLever.translate(0.22 * scale, -0.32 * scale, 0.25 * scale);

    condenserGeoms.push(condBody, irisLever);
    const condenserGeom = UniversalGeometryVocabulary.mergeGeometries(condenserGeoms);

    addComp(
      'microscope_condenser', 'Abbe Condenser N.A. 1.25 with Iris Aperture', 'Rack-and-pinion height-adjustable Abbe optical condenser with continuous iris diaphragm and blue daylight filter tray.',
      [0, -0.3 * scale, 0.25 * scale], [0.7 * scale, 0.4 * scale, 0.7 * scale], [0, -0.3 * scale, 0.3 * scale], '#475569',
      condenserGeom, { 'Numerical Aperture': 'N.A. 1.25 with Immersion Oil [LIT]', 'Diaphragm': 'Continuous Metal Leaf Iris [LIT]' }, 'MACHINED_ALUMINUM'
    );

    // 5. Quadruple Reverse-Angle Revolving Nosepiece & 4x Achromatic Objective Lenses
    const nosepieceGeoms: THREE.BufferGeometry[] = [];
    const turretDisc = UniversalGeometryVocabulary.createKnurledCylinder(0.55 * scale, 0.18 * scale, 32, 0.02 * scale);
    turretDisc.rotateX(Math.PI / 12);
    turretDisc.translate(0, 0.75 * scale, 0.2 * scale);
    nosepieceGeoms.push(turretDisc);

    // 4 DIN Standard Objectives (4x, 10x, 40x, 100x Oil)
    const objMagnifications = [
      { mag: '4x', len: 0.35 * scale, col: '#ef4444' },
      { mag: '10x', len: 0.45 * scale, col: '#eab308' },
      { mag: '40x', len: 0.58 * scale, col: '#3b82f6' },
      { mag: '100x', len: 0.65 * scale, col: '#ffffff' }
    ];

    for (let o = 0; o < 4; o++) {
      const oAngle = (o / 4) * Math.PI * 2;
      const objLen = objMagnifications[o].len;
      const objTube = UniversalGeometryVocabulary.createChamferedCylinder(0.12 * scale, objLen, 0.02 * scale, 20);
      objTube.translate(Math.cos(oAngle) * 0.32 * scale, 0.75 * scale - objLen / 2, 0.2 * scale + Math.sin(oAngle) * 0.32 * scale);
      nosepieceGeoms.push(objTube);
    }
    const nosepieceGeom = UniversalGeometryVocabulary.mergeGeometries(nosepieceGeoms);

    addComp(
      'microscope_nosepiece', 'Quadruple Revolving Nosepiece & 4x-100x Objectives', 'Ball-bearing reverse inward-facing turret with 4 DIN Achromatic objective lenses: 4x, 10x, 40x (spring), and 100x (oil).',
      [0, 0.65 * scale, 0.2 * scale], [1.1 * scale, 0.8 * scale, 1.1 * scale], [0, 0.4 * scale, 0.3 * scale], '#cbd5e1',
      nosepieceGeom, { 'Nosepiece': 'Reverse 4-Position Ball-Bearing Click Stop [LIT]', 'Optics': 'DIN 160mm Achromatic Antifungal Coated [LIT]', 'Magnifications': '4x, 10x, 40x (S), 100x (S, Oil) [LIT]' }, 'CHROME'
    );

    // 6. Binocular 30-Degree Inclined Seidentopf Head & Dual 10x Eyepieces
    const headGeoms: THREE.BufferGeometry[] = [];
    const binocBody = UniversalGeometryVocabulary.createRoundedBox(0.9 * scale, 0.45 * scale, 0.65 * scale, 0.08 * scale);
    binocBody.rotateX(-Math.PI / 6);
    binocBody.translate(0, height * 0.42, -0.05 * scale);

    // Left and Right 10x Widefield Eyepiece Tubes (30-degree tilt)
    const eyeTubeL = UniversalGeometryVocabulary.createChamferedCylinder(0.14 * scale, 0.55 * scale, 0.02 * scale, 24);
    eyeTubeL.rotateX(-Math.PI / 6);
    eyeTubeL.translate(-0.25 * scale, height * 0.42 + 0.32 * scale, 0.12 * scale);

    const eyeTubeR = UniversalGeometryVocabulary.createChamferedCylinder(0.14 * scale, 0.55 * scale, 0.02 * scale, 24);
    eyeTubeR.rotateX(-Math.PI / 6);
    eyeTubeR.translate(0.25 * scale, height * 0.42 + 0.32 * scale, 0.12 * scale);

    headGeoms.push(binocBody, eyeTubeL, eyeTubeR);
    const headGeom = UniversalGeometryVocabulary.mergeGeometries(headGeoms);

    addComp(
      'microscope_head', '30° Inclined Siedentopf Binocular Head & Eyepieces', 'Ergonomic 30° inclined, 360° rotatable Siedentopf binocular head with 48-75mm interpupillary adjustment and dual WF10x/20mm eyepieces.',
      [0, height * 0.45, 0.05 * scale], [1.1 * scale, 0.9 * scale, 0.9 * scale], [0, 0.6 * scale, 0], '#f8fafc',
      headGeom, { 'Viewing Head': 'Siedentopf Binocular 30° Inclined [LIT]', 'Interpupillary Range': '48 - 75 mm Adjustable [DATA]', 'Eyepieces': 'WF10x / 20mm Field of View [LIT]' }, 'CAST_ALUMINUM'
    );

    return { components, meshSpecs, geometries };
  }
}

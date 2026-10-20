const fs = require('fs');

const code = `import * as THREE from 'three';
import { ComponentMetadata, ProceduralMeshSpecification } from '../SpatialLibrary';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { UniversalGeometryVocabulary } from './UniversalGeometryVocabulary';

export class HighFidelityGenerators {
  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const wheelbase = Number(params.wheelbase || 3.4) * scale;
    const frameHeight = Number(params.frameHeight || 1.8) * scale;
    const tubeRadius = 0.045 * scale;
    
    // Front wheel and rear wheel
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
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
    };

    // Node locations
    const bb: [number, number, number] = [0, -frameHeight * 0.45, 0];
    const rearHub: [number, number, number] = [-wheelbase * 0.55, -frameHeight * 0.45, 0];
    const frontHub: [number, number, number] = [wheelbase * 0.45, -frameHeight * 0.45, 0];
    const seatJunction: [number, number, number] = [-wheelbase * 0.15, frameHeight * 0.35, 0];
    const headTop: [number, number, number] = [wheelbase * 0.25, frameHeight * 0.45, 0];
    const headBottom: [number, number, number] = [wheelbase * 0.22, frameHeight * 0.05, 0];
    const rearDropout: [number, number, number] = [rearHub[0], rearHub[1], 0];

    // Frame tubes (more distinct shapes)
    const topTube = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, headTop, tubeRadius * 0.9);
    // Aero down tube
    const downTube = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, headBottom, tubeRadius * 1.3);
    downTube.scale(1, 1, 0.6); // Ovalized
    const seatTube = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, seatJunction, tubeRadius * 1.1);
    
    // Head tube with slightly larger diameter
    const headTube = UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, headTop, tubeRadius * 1.4);

    // Chainstays (tapered)
    const chainstayLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], rearHub[2] - 0.2], tubeRadius * 0.7);
    const chainstayRight = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], rearHub[2] + 0.2], tubeRadius * 0.7);
    
    // Seatstays (tapered)
    const seatstayLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], rearHub[2] - 0.2], tubeRadius * 0.5);
    const seatstayRight = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], rearHub[2] + 0.2], tubeRadius * 0.5);

    const frameGeom = UniversalGeometryVocabulary.mergeGeometries([topTube, downTube, seatTube, headTube, chainstayLeft, chainstayRight, seatstayLeft, seatstayRight]);
    addComp(
      'bicycle_frame', 'Carbon Fiber Diamond Frame', 'High-modulus monocoque carbon frame.',
      [0, 0, 0], [wheelbase * 0.8, frameHeight, 0.4], [0, 0, 0], '#b91c1c',
      frameGeom, { 'Material': 'Carbon Fiber T800', 'Geometry': 'Endurance Road' }, 'PBR_METALLIC'
    );

    // Fork
    const forkCrown: [number, number, number] = headBottom;
    const forkLeft = UniversalGeometryVocabulary.createTubeBetweenPoints(forkCrown, [frontHub[0], frontHub[1], frontHub[2] - 0.2], tubeRadius * 0.8);
    const forkRight = UniversalGeometryVocabulary.createTubeBetweenPoints(forkCrown, [frontHub[0], frontHub[1], frontHub[2] + 0.2], tubeRadius * 0.8);
    const forkGeom = UniversalGeometryVocabulary.mergeGeometries([forkLeft, forkRight]);
    addComp(
      'bicycle_fork', 'Rigid Carbon Fork', 'Bladed aero carbon fork.',
      frontHub, [0.3, frameHeight * 0.4, 0.4], [0.5, -0.5, 0], '#1e293b',
      forkGeom, { 'Material': 'Carbon Fiber', 'Rake': '45mm' }, 'PBR_METALLIC'
    );

    // Front Wheel
    const fWheel = UniversalGeometryVocabulary.createSpokedWheel(frontWheelRadius, frontTireRadius);
    fWheel.rotateY(Math.PI / 2);
    fWheel.translate(...frontHub);
    addComp(
      'bicycle_front_wheel', 'Front 700c Wheel', 'Aerodynamic alloy wheel assembly.',
      frontHub, [frontTireRadius * 2, frontTireRadius * 2, 0.3], [1.2, 0, 0], '#475569',
      fWheel, { 'Diameter': \`\${(frontTireRadius * 2).toFixed(2)}m\`, 'Spokes': '24H Bladed' }, 'PBR_METALLIC'
    );

    // Rear Wheel
    const rWheel = UniversalGeometryVocabulary.createSpokedWheel(rearWheelRadius, rearTireRadius);
    rWheel.rotateY(Math.PI / 2);
    rWheel.translate(...rearHub);
    addComp(
      'bicycle_rear_wheel', 'Rear 700c Drive Wheel', 'Rear driven wheel assembly with cassette hub.',
      rearHub, [rearTireRadius * 2, rearTireRadius * 2, 0.3], [-1.2, 0, 0], '#475569',
      rWheel, { 'Diameter': \`\${(rearTireRadius * 2).toFixed(2)}m\`, 'Spokes': '28H Bladed' }, 'PBR_METALLIC'
    );

    // Drivetrain
    const crankset = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
    crankset.rotateX(Math.PI / 2);
    crankset.translate(bb[0], bb[1], bb[2] + 0.1);
    const crankArmL = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] - 0.5, bb[2] - 0.15], 0.04);
    const crankArmR = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] + 0.5, bb[2] + 0.15], 0.04);
    const pedalL = new THREE.BoxGeometry(0.15, 0.05, 0.1);
    pedalL.translate(bb[0], bb[1] - 0.5, bb[2] - 0.2);
    const pedalR = new THREE.BoxGeometry(0.15, 0.05, 0.1);
    pedalR.translate(bb[0], bb[1] + 0.5, bb[2] + 0.2);
    
    // Chain (simple representation)
    const chainPath = new THREE.Shape();
    chainPath.absarc(bb[0], bb[1], 0.3, Math.PI/2, Math.PI*3/2, false);
    chainPath.lineTo(rearHub[0], rearHub[1] - 0.1);
    chainPath.absarc(rearHub[0], rearHub[1], 0.1, Math.PI*3/2, Math.PI/2, false);
    chainPath.lineTo(bb[0], bb[1] + 0.3);
    const chainGeom = new THREE.ExtrudeGeometry(chainPath, { depth: 0.02, bevelEnabled: false });
    chainGeom.translate(0, 0, 0.1);
    
    const cassette = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24);
    cassette.rotateX(Math.PI / 2);
    cassette.translate(rearHub[0], rearHub[1], rearHub[2] + 0.1);

    const derailleur = new THREE.BoxGeometry(0.1, 0.2, 0.05);
    derailleur.translate(rearHub[0] + 0.1, rearHub[1] - 0.2, rearHub[2] + 0.15);

    const drivetrainGeom = UniversalGeometryVocabulary.mergeGeometries([crankset, crankArmL, crankArmR, pedalL, pedalR, chainGeom, cassette, derailleur]);
    addComp(
      'bicycle_drivetrain_crankset', 'Drivetrain Assembly', 'Crankset, pedals, chain, cassette, and derailleur.',
      bb, [0.6, 1.0, 0.4], [0, -0.6, 0.5], '#334155',
      drivetrainGeom, { 'Gearing': '52/36T x 11-28T', 'Groupset': 'Mechanical 11-speed' }, 'PBR_METALLIC'
    );

    // Seatpost & Saddle
    const seatpost = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [seatJunction[0] - 0.1, seatJunction[1] + 0.6, 0], tubeRadius * 0.8);
    // Saddle
    const saddleShape = new THREE.Shape();
    saddleShape.moveTo(0.4, 0);
    saddleShape.bezierCurveTo(0.4, 0.1, 0.1, 0.15, -0.2, 0.15);
    saddleShape.bezierCurveTo(-0.4, 0.15, -0.5, 0.05, -0.5, 0);
    saddleShape.bezierCurveTo(-0.5, -0.05, -0.4, -0.15, -0.2, -0.15);
    saddleShape.bezierCurveTo(0.1, -0.15, 0.4, -0.1, 0.4, 0);
    const saddleExtrude = new THREE.ExtrudeGeometry(saddleShape, { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 2, bevelSize: 0.02, bevelThickness: 0.02 });
    saddleExtrude.rotateX(Math.PI/2);
    saddleExtrude.translate(seatJunction[0] - 0.1, seatJunction[1] + 0.65, -0.1);
    
    const saddleGeom = UniversalGeometryVocabulary.mergeGeometries([seatpost, saddleExtrude]);
    addComp(
      'bicycle_saddle', 'Saddle & Seatpost', 'Ergonomic saddle and carbon seatpost.',
      seatJunction, [0.6, 0.6, 0.3], [-0.5, 0.8, 0], '#0f172a',
      saddleGeom, { 'Saddle': 'Ergo Cutout', 'Seatpost': '27.2mm Carbon' }, 'PBR_MATTE'
    );

    // Cockpit
    const stem = UniversalGeometryVocabulary.createTubeBetweenPoints(headTop, [headTop[0] + 0.2, headTop[1] + 0.1, 0], tubeRadius * 0.9);
    const barMid: [number, number, number] = [headTop[0] + 0.2, headTop[1] + 0.1, 0];
    const handlebar = new THREE.CylinderGeometry(tubeRadius*0.7, tubeRadius*0.7, handlebarWidth, 16);
    handlebar.rotateX(Math.PI / 2);
    handlebar.translate(...barMid);
    
    const dropL = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [barMid[0], barMid[1], barMid[2] - handlebarWidth/2],
      [barMid[0] + 0.15, barMid[1] - 0.15, barMid[2] - handlebarWidth/2], tubeRadius * 0.7);
    const dropR = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [barMid[0], barMid[1], barMid[2] + handlebarWidth/2],
      [barMid[0] + 0.15, barMid[1] - 0.15, barMid[2] + handlebarWidth/2], tubeRadius * 0.7);
      
    // Brake hoods
    const hoodL = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    hoodL.translate(barMid[0] + 0.1, barMid[1] + 0.05, barMid[2] - handlebarWidth/2);
    const hoodR = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    hoodR.translate(barMid[0] + 0.1, barMid[1] + 0.05, barMid[2] + handlebarWidth/2);

    const cockpitGeom = UniversalGeometryVocabulary.mergeGeometries([stem, handlebar, dropL, dropR, hoodL, hoodR]);
    addComp(
      'bicycle_steering_cockpit', 'Integrated Cockpit', 'Drop handlebars, stem, and brake levers.',
      barMid, [0.4, 0.4, handlebarWidth], [0.6, 0.5, 0], '#1e293b',
      cockpitGeom, { 'Handlebar Width': '420mm', 'Stem Length': '100mm' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const l = 2.8 * scale;
    const w = 1.1 * scale;
    const h = 1.2 * scale;

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
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
    };

    // 1. Shoe Last / Upper (The main leather body)
    // We use a high-res deformed sphere for the upper to get realistic curvature
    const upperGeom = new THREE.SphereGeometry(1, 64, 64);
    const pos = upperGeom.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      
      // Flatten bottom
      if (y < 0) y = y * 0.05;
      
      // Scale length
      z = z * (l / 2);
      
      // Taper width
      let wFactor = w / 2;
      if (z < -l * 0.2) wFactor *= 0.65; // Heel
      else if (z >= -l * 0.2 && z < 0) wFactor *= 0.6; // Waist
      else if (z >= 0 && z < l * 0.25) wFactor *= 0.95; // Ball
      if (z > l * 0.25) {
        const toeTaper = (z - l * 0.25) / (l * 0.25);
        wFactor *= Math.max(0.15, 0.95 - toeTaper * 0.8);
      }
      x *= wFactor;
      
      // Taper height
      let hFactor = h;
      if (y >= 0) {
        if (z > l * 0.2) {
          const toeDrop = (z - l * 0.2) / (l * 0.3);
          y *= (hFactor * Math.max(0.2, 0.45 - toeDrop * 0.3));
        } else if (z > 0 && z <= l * 0.2) {
          y *= (hFactor * 0.45);
        } else if (z <= 0 && z > -l * 0.25) {
          const instepRise = (0 - z) / (l * 0.25);
          y *= (hFactor * (0.45 + instepRise * 0.55));
        } else {
          y *= (hFactor * 0.7); // Heel cup
        }
      }
      
      // Collar opening
      if (y > h * 0.3 && z < -l * 0.05 && z > -l * 0.35) {
        const cx = 0;
        const cz = -l * 0.2;
        const dist = Math.sqrt((x * 1.5) ** 2 + (z - cz) ** 2);
        if (dist < 0.25 * scale) {
           y = h * 0.3;
           x *= 0.8;
        }
      }
      pos.setXYZ(i, x, Math.max(0, y), z);
    }
    upperGeom.computeVertexNormals();

    addComp(
      'shoe_upper', 'Calfskin Leather Upper', 'Full-grain calfskin leather with closed Oxford lacing.',
      [0, 0.1, 0], [w, h, l], [0, 0.5, 0], '#3f2b1a',
      upperGeom, { 'Material': 'Full-Grain Calfskin', 'Style': 'Cap-toe Oxford' }, 'PBR_MATTE'
    );

    // 2. Leather Outsole
    const soleGeom = new THREE.SphereGeometry(1, 64, 16);
    const sPos = soleGeom.getAttribute('position');
    for (let i = 0; i < sPos.count; i++) {
      let x = sPos.getX(i);
      let y = sPos.getY(i);
      let z = sPos.getZ(i);
      if (y > 0) y = y * 0.01;
      else y = y * 0.1; // flat bottom
      z = z * (l / 2) * 1.02; // slightly longer than upper
      let wFactor = (w / 2) * 1.05; // welt extension
      if (z < -l * 0.2) wFactor *= 0.65;
      else if (z >= -l * 0.2 && z < 0) wFactor *= 0.6;
      else if (z >= 0 && z < l * 0.25) wFactor *= 0.95;
      if (z > l * 0.25) {
        const toeTaper = (z - l * 0.25) / (l * 0.25);
        wFactor *= Math.max(0.15, 0.95 - toeTaper * 0.8);
      }
      x *= wFactor;
      sPos.setXYZ(i, x, y, z);
    }
    soleGeom.computeVertexNormals();
    soleGeom.translate(0, 0.05, 0);

    addComp(
      'shoe_outsole', 'Oak-Bark Tanned Leather Sole', 'Goodyear welted leather outsole.',
      [0, -0.05, 0], [w * 1.05, 0.1, l * 1.02], [0, -0.2, 0], '#78350f',
      soleGeom, { 'Construction': 'Goodyear Welt', 'Material': 'Oak-Bark Leather' }, 'PBR_MATTE'
    );

    // 3. Stacked Heel
    const heelGeom = new THREE.CylinderGeometry(w * 0.32, w * 0.34, 0.25, 32);
    // Flatten the breast of the heel
    const hPos = heelGeom.getAttribute('position');
    for (let i = 0; i < hPos.count; i++) {
      if (hPos.getZ(i) > 0) {
         hPos.setZ(i, hPos.getZ(i) * 0.2); // flat front
      }
    }
    heelGeom.computeVertexNormals();
    heelGeom.translate(0, -0.1, -l * 0.35);

    addComp(
      'shoe_heel', 'Stacked Leather Heel', 'Built-up leather heel with rubber dovetail insert.',
      [0, -0.15, -l * 0.35], [w * 0.7, 0.3, l * 0.3], [0, -0.4, 0], '#291b10',
      heelGeom, { 'Height': '25mm', 'Toplift': 'Leather / Rubber combo' }, 'PBR_MATTE'
    );
    
    // 4. Cap Toe Detail (just a slightly enlarged slice of the front)
    const capGeom = upperGeom.clone();
    const cPos = capGeom.getAttribute('position');
    for (let i = 0; i < cPos.count; i++) {
      if (cPos.getZ(i) < l * 0.22) {
        cPos.setXYZ(i, 0, 0, 0); // Collapse everything behind cap toe
      } else {
        cPos.setX(i, cPos.getX(i) * 1.01);
        cPos.setY(i, cPos.getY(i) * 1.01);
        cPos.setZ(i, cPos.getZ(i) * 1.01);
      }
    }
    capGeom.computeVertexNormals();
    
    addComp(
      'shoe_cap_toe', 'Cap Toe', 'Stitched leather cap toe reinforcement.',
      [0, 0.1, l * 0.3], [w * 0.9, 0.4, l * 0.25], [0, 0.5, 0.2], '#3f2b1a',
      capGeom, { 'Style': 'Straight Cap' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }
}
`
fs.writeFileSync('src/AutonomousModelEngine/HighFidelityGenerators.ts', code);

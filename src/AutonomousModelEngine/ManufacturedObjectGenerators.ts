// src/AutonomousModelEngine/ManufacturedObjectGenerators.ts
// Universal Procedural 3D Geometry Generators for Manufactured Objects & Assemblies

import * as THREE from 'three';
import { ComponentMetadata } from '../SpatialLibrary';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { ProceduralMeshSpecification } from './ModelTypes';
import { UniversalGeometryVocabulary } from './UniversalGeometryVocabulary';

export class ManufacturedObjectGenerators {

  // =========================================================================
  // 1. SMARTPHONE (Chassis, Display, Bezel, Rear Glass, Camera Island & Lenses, Buttons, Port)
  // =========================================================================
  public static generateSmartphone(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 1.4) * scale;
    const height = Number(params.height || 2.8) * scale;
    const thickness = Number(params.thickness || 0.15) * scale;
    const cameraCount = Number(params.cameraCount || 3);
    const cornerRadius = width * 0.12;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComponent = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_METALLIC'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Chassis
    addComponent(
      'smartphone_chassis', 'Titanium Unibody Chassis', 'Precision CNC-machined aerospace-grade titanium frame.',
      [0, 0, 0], [width, height, thickness], [0, 0, 0], '#64748b',
      UniversalGeometryVocabulary.createRoundedBox(width, height, thickness, cornerRadius, 8),
      { 'Material': 'Grade 5 Titanium (Ti-6Al-4V)' }, 'PBR_METALLIC'
    );

    // 2. Antenna Breaks
    for (let i = 0; i < 4; i++) {
      const yPos = i < 2 ? height / 2 - cornerRadius * 1.5 : -height / 2 + cornerRadius * 1.5;
      const xPos = i % 2 === 0 ? width / 2 : -width / 2;
      addComponent(
        `antenna_break_${i}`, `Antenna Band ${i + 1}`, 'Polymer injection molded antenna break.',
        [xPos, yPos, 0], [0.02, 0.04, thickness * 1.01], [xPos * 0.5, yPos * 0.5, 0], '#334155',
        new THREE.BoxGeometry(0.04, 0.04, thickness * 1.02),
        { 'Material': 'RF-transparent Polymer' }, 'PBR_MATTE'
      );
    }

    // 3. Rear Glass Panel
    addComponent(
      'smartphone_rear_panel', 'Textured Matte Glass Back', 'Ion-exchanged frosted ceramic glass backplate.',
      [0, 0, -thickness / 2 - 0.01], [width * 0.98, height * 0.99, 0.02], [0, 0, -0.4], '#0f172a',
      UniversalGeometryVocabulary.createRoundedBox(width * 0.98, height * 0.99, 0.02, cornerRadius * 0.95, 6),
      { 'Glass Coating': 'Dual Ion-Exchange Matte' }, 'PBR_MATTE'
    );

    // 4. Camera Island
    const camIslandW = width * 0.45;
    const camIslandH = height * 0.25;
    const camIslandX = -width / 2 + camIslandW / 2 + 0.08;
    const camIslandY = height / 2 - camIslandH / 2 - 0.08;
    addComponent(
      'smartphone_camera_module', 'Camera Island', 'Sapphire glass camera bump.',
      [camIslandX, camIslandY, -thickness / 2 - 0.035], [camIslandW, camIslandH, 0.05], [-0.3, 0.3, -0.7], '#020617',
      UniversalGeometryVocabulary.createRoundedBox(camIslandW, camIslandH, 0.05, 0.15, 6),
      { 'Material': 'Sapphire Crystal' }, 'PBR_GLASS'
    );

    // 5. Camera Lenses & Rings
    const lensRadius = width * 0.09;
    const lensPositions: [number, number][] = [
      [camIslandX - 0.1, camIslandY + 0.18], // Main
      [camIslandX - 0.1, camIslandY - 0.18], // Ultra Wide
      [camIslandX + 0.15, camIslandY], // Telephoto
    ];

    for (let i = 0; i < Math.min(cameraCount, 3); i++) {
      const pos = lensPositions[i];
      const zPos = -thickness / 2 - 0.06;
      
      // Lens Ring
      const ringGeom = new THREE.CylinderGeometry(lensRadius * 1.1, lensRadius * 1.1, 0.06, 32);
      ringGeom.rotateX(Math.PI / 2);
      addComponent(
        `smartphone_lens_ring_${i}`, `Machined Lens Ring ${i + 1}`, 'Titanium lens protection ring.',
        [pos[0], pos[1], zPos], [lensRadius * 2.2, lensRadius * 2.2, 0.06], [-0.4, 0.4, -0.8 - i * 0.1], '#475569',
        ringGeom, { 'Material': 'Titanium' }, 'PBR_METALLIC'
      );

      // Lens Glass
      const lensGeom = new THREE.CylinderGeometry(lensRadius, lensRadius, 0.061, 24);
      lensGeom.rotateX(Math.PI / 2);
      addComponent(
        `smartphone_lens_${i}`, `Optical Lens ${i + 1}`, 'Multi-layer coated sapphire lens.',
        [pos[0], pos[1], zPos], [lensRadius * 2, lensRadius * 2, 0.061], [-0.5, 0.5, -0.9 - i * 0.1], '#000000',
        lensGeom, { 'Coating': 'Anti-reflective' }, 'PBR_GLASS'
      );
    }

    // Camera Flash
    const flashGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16);
    flashGeom.rotateX(Math.PI / 2);
    addComponent(
      'smartphone_flash', 'True Tone LED Flash', 'Dual-tone LED flash.',
      [camIslandX + 0.15, camIslandY + 0.2, -thickness / 2 - 0.06], [0.08, 0.08, 0.05], [-0.3, 0.4, -0.8], '#fef08a',
      flashGeom, { 'Type': 'Adaptive LED' }, 'PBR_MATTE'
    );

    // LiDAR / Sensor
    const lidarGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
    lidarGeom.rotateX(Math.PI / 2);
    addComponent(
      'smartphone_lidar', 'LiDAR Scanner', 'Time-of-flight 3D depth sensor.',
      [camIslandX + 0.15, camIslandY - 0.2, -thickness / 2 - 0.06], [0.1, 0.1, 0.05], [-0.3, 0.2, -0.8], '#1e293b',
      lidarGeom, { 'Type': 'dToF Scanner' }, 'PBR_GLASS'
    );

    // 6. Display Bezel
    addComponent(
      'smartphone_bezel', 'Display Bezel', 'Ultra-thin symmetrical screen bezel.',
      [0, 0, thickness / 2 + 0.005], [width * 0.98, height * 0.99, 0.01], [0, 0, 0.3], '#000000',
      UniversalGeometryVocabulary.createRoundedBox(width * 0.98, height * 0.99, 0.01, cornerRadius * 0.95, 6),
      { 'Bezel Width': '1.5mm Symmetrical' }, 'PBR_MATTE'
    );

    // 7. Active Display Area
    addComponent(
      'smartphone_display', 'LTPO OLED Display', '120Hz ProMotion HDR OLED display.',
      [0, 0, thickness / 2 + 0.01], [width * 0.94, height * 0.96, 0.01], [0, 0, 0.4], '#020617',
      UniversalGeometryVocabulary.createRoundedBox(width * 0.94, height * 0.96, 0.01, cornerRadius * 0.85, 6),
      { 'Resolution': '2796x1290', 'Refresh Rate': '1-120Hz LTPO' }, 'PBR_GLASS'
    );

    // 8. Dynamic Island / Sensor Housing
    addComponent(
      'smartphone_sensor_island', 'Dynamic Sensor Island', 'Pill-shaped cutout for TrueDepth camera and Face ID.',
      [0, height / 2 - 0.15, thickness / 2 + 0.015], [0.4, 0.12, 0.01], [0, 0.3, 0.5], '#000000',
      UniversalGeometryVocabulary.createRoundedBox(0.4, 0.12, 0.01, 0.06, 6),
      { 'Sensors': 'Face ID, Front Camera' }, 'PBR_MATTE'
    );

    // 9. Buttons
    const btnZ = 0;
    // Power/Action button (Right)
    addComponent(
      'smartphone_btn_power', 'Side Button', 'Solid-state side button.',
      [width / 2 + 0.01, height * 0.15, btnZ], [0.03, 0.4, 0.05], [0.3, 0, 0], '#64748b',
      UniversalGeometryVocabulary.createRoundedBox(0.03, 0.4, 0.05, 0.01, 2),
      { 'Type': 'Capacitive/Mechanical' }, 'PBR_METALLIC'
    );
    
    // Volume Up (Left)
    addComponent(
      'smartphone_btn_volup', 'Volume Up', 'Volume control button.',
      [-width / 2 - 0.01, height * 0.2, btnZ], [0.03, 0.25, 0.05], [-0.3, 0, 0], '#64748b',
      UniversalGeometryVocabulary.createRoundedBox(0.03, 0.25, 0.05, 0.01, 2),
      { 'Action': 'Volume Up' }, 'PBR_METALLIC'
    );
    
    // Volume Down (Left)
    addComponent(
      'smartphone_btn_voldown', 'Volume Down', 'Volume control button.',
      [-width / 2 - 0.01, height * 0.05, btnZ], [0.03, 0.25, 0.05], [-0.3, -0.15, 0], '#64748b',
      UniversalGeometryVocabulary.createRoundedBox(0.03, 0.25, 0.05, 0.01, 2),
      { 'Action': 'Volume Down' }, 'PBR_METALLIC'
    );

    // Action/Mute Switch (Left)
    addComponent(
      'smartphone_btn_action', 'Action Switch', 'Customizable action switch.',
      [-width / 2 - 0.01, height * 0.35, btnZ], [0.03, 0.15, 0.04], [-0.3, 0.15, 0], '#64748b',
      UniversalGeometryVocabulary.createRoundedBox(0.03, 0.15, 0.04, 0.01, 2),
      { 'Action': 'Customizable' }, 'PBR_METALLIC'
    );

    // 10. Bottom Ports and Grilles
    // USB-C Port
    addComponent(
      'smartphone_port', 'USB-C Thunderbolt Port', '40Gbps high-speed data and charging port.',
      [0, -height / 2 - 0.01, 0], [0.3, 0.05, 0.08], [0, -0.4, 0], '#000000',
      UniversalGeometryVocabulary.createRoundedBox(0.3, 0.05, 0.08, 0.02, 4),
      { 'Protocol': 'USB4 / Thunderbolt' }, 'PBR_MATTE'
    );

    // Speakers/Mics (Bottom)
    for (let i = 0; i < 4; i++) {
      const micGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12);
      addComponent(
        `smartphone_speaker_l_${i}`, `Speaker Grille L${i+1}`, 'Acoustic port.',
        [-0.25 - i * 0.06, -height / 2 - 0.01, 0], [0.04, 0.05, 0.04], [-0.2, -0.4, 0], '#000000',
        micGeom, { 'Type': 'Acoustic Mesh' }, 'PBR_MATTE'
      );
      const spkGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12);
      addComponent(
        `smartphone_speaker_r_${i}`, `Speaker Grille R${i+1}`, 'Acoustic port.',
        [0.25 + i * 0.06, -height / 2 - 0.01, 0], [0.04, 0.05, 0.04], [0.2, -0.4, 0], '#000000',
        spkGeom, { 'Type': 'Acoustic Mesh' }, 'PBR_MATTE'
      );
    }

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 2. LAPTOP (Base Unibody, Display Lid, Screen, Keyboard Deck & Keys, Trackpad, Hinge)
  // =========================================================================
  public static generateLaptop(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 3.2) * scale;
    const depth = Number(params.depth || 2.2) * scale;
    const baseThick = Number(params.baseThickness || 0.14) * scale;
    const lidThick = Number(params.lidThickness || 0.08) * scale;
    const lidAngleDeg = Number(params.lidAngle || 110); // degrees open

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Lower Base Chassis Unibody
    const baseComp: ComponentMetadata = {
      id: 'laptop_base_chassis',
      name: 'Extruded Aluminum Base Enclosure',
      description: 'Rigid CNC aluminum unibody housing motherboard, SoC, dual axial cooling fans, and 99.9 Wh lithium battery.',
      position: [0, -baseThick / 2, depth * 0.2],
      size: [width, baseThick, depth],
      explodedOffset: [0, -0.3, 0],
      shape: 'box',
      color: '#334155',
      specifications: {
        'Material': '100% Recycled 6000-Series Aluminum',
        'Thermal System': 'Vapor Chamber with Dual High-Efficiency Blowers',
        'Battery Capacity': '99.9 Watt-Hour Li-Polymer'
      }
    };
    components.push(baseComp);
    geometries['laptop_base_chassis'] = UniversalGeometryVocabulary.createRoundedBox(width, baseThick, depth, 0.06, 4);
    meshSpecs['laptop_base_chassis'] = {
      id: 'laptop_base_chassis',
      name: baseComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: { width, depth, baseThick },
      color: '#334155',
      materialType: 'PBR_METALLIC'
    };

    // 2. Display Housing Lid
    const lidHeight = depth * 0.95;
    const radAngle = (lidAngleDeg * Math.PI) / 180;
    // Position lid centered at hinge pivot (z = -depth * 0.45)
    const hingePosZ = -depth * 0.45;
    const hingePosY = 0.0;
    
    // Add Hinge
    const hingeW = width * 0.7;
    const hingeGeom = new THREE.CylinderGeometry(0.04, 0.04, hingeW, 16);
    hingeGeom.rotateZ(Math.PI / 2);
    components.push({
      id: 'laptop_hinge', name: 'Torsion Hinge Mechanism', description: 'Friction-tuned display clutch.',
      position: [0, hingePosY, hingePosZ], size: [hingeW, 0.08, 0.08], explodedOffset: [0, 0, -0.2],
      shape: 'cylinder', color: '#1e293b', specifications: { 'Type': 'Clutch Hinge' }
    });
    geometries['laptop_hinge'] = hingeGeom;
    meshSpecs['laptop_hinge'] = { id: 'laptop_hinge', name: 'Torsion Hinge Mechanism', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_METALLIC' };

    const lidCenterY = hingePosY + (lidHeight / 2) * Math.sin(radAngle);
    const lidCenterZ = hingePosZ + (lidHeight / 2) * Math.cos(radAngle);
    const rotArr = new THREE.Euler(Math.PI / 2 - radAngle, 0, 0);

    const lidComp: ComponentMetadata = {
      id: 'laptop_display_housing',
      name: 'Torsion-Resistant Display Lid Housing',
      description: 'Ultra-thin aluminum display enclosure engineered for structural rigidity and minimal flex.',
      position: [0, lidCenterY, lidCenterZ],
      size: [width, lidHeight, lidThick],
      explodedOffset: [0, 0.4, -0.3],
      shape: 'box',
      color: '#64748b',
      specifications: {
        'Enclosure': 'Anodized Billet Aluminum',
        'Thickness': '4.5 mm tapered edge'
      }
    };
    components.push(lidComp);
    const lidGeom = UniversalGeometryVocabulary.createRoundedBox(width, lidHeight, lidThick, 0.04, 6);
    lidGeom.applyQuaternion(new THREE.Quaternion().setFromEuler(rotArr));
    geometries['laptop_display_housing'] = lidGeom;
    meshSpecs['laptop_display_housing'] = {
      id: 'laptop_display_housing', name: lidComp.name, meshType: 'CUSTOM_PRIMITIVE',
      parameters: { width, lidHeight, lidThick }, color: '#64748b', materialType: 'PBR_METALLIC'
    };
    
    // Display Bezel
    const bezelZ = lidCenterZ - (lidThick / 2 - 0.005) * Math.sin(radAngle);
    const bezelY = lidCenterY + (lidThick / 2 - 0.005) * Math.cos(radAngle);
    components.push({
      id: 'laptop_display_bezel', name: 'Glass Display Bezel', description: 'Edge-to-edge cover glass.',
      position: [0, bezelY, bezelZ], size: [width * 0.99, lidHeight * 0.99, 0.01], explodedOffset: [0, 0.5, -0.2],
      shape: 'box', color: '#000000', specifications: { 'Material': 'Cover Glass' }
    });
    const bezelGeom = UniversalGeometryVocabulary.createRoundedBox(width * 0.99, lidHeight * 0.99, 0.01, 0.035, 6);
    bezelGeom.applyQuaternion(new THREE.Quaternion().setFromEuler(rotArr));
    geometries['laptop_display_bezel'] = bezelGeom;
    meshSpecs['laptop_display_bezel'] = { id: 'laptop_display_bezel', name: 'Glass Display Bezel', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#000000', materialType: 'PBR_GLASS' };

    // 3. High-Contrast Liquid Retina XDR Display Screen
    const screenW = width * 0.95;
    const screenH = lidHeight * 0.92;
    const sZ = lidCenterZ - (lidThick / 2) * Math.sin(radAngle);
    const sY = lidCenterY + (lidThick / 2) * Math.cos(radAngle);
    const screenComp: ComponentMetadata = {
      id: 'laptop_display_panel',
      name: 'Mini-LED Liquid XDR Display Screen',
      description: '10,000+ mini-LED backlight zones delivering 1,000,000:1 contrast ratio and 120Hz ProMotion.',
      position: [0, sY, sZ],
      size: [screenW, screenH, 0.01],
      explodedOffset: [0, 0.6, -0.1],
      shape: 'box',
      color: '#020617',
      specifications: {
        'Diagonal': '16.2-inch Active Matrix',
        'Resolution': '3456 x 2234 native (254 ppi)',
        'Color Gamut': '100% DCI-P3 Wide Color'
      }
    };
    components.push(screenComp);
    const screenGeom = UniversalGeometryVocabulary.createRoundedBox(screenW, screenH, 0.01, 0.02, 4);
    screenGeom.applyQuaternion(new THREE.Quaternion().setFromEuler(rotArr));
    geometries['laptop_display_panel'] = screenGeom;
    meshSpecs['laptop_display_panel'] = {
      id: 'laptop_display_panel',
      name: screenComp.name,
      meshType: 'CUSTOM_PRIMITIVE',
      parameters: { screenW, screenH },
      color: '#020617',
      materialType: 'PBR_GLASS'
    };
    
    // Webcam
    const camY = hingePosY + (lidHeight - 0.1) * Math.sin(radAngle);
    const camZ = hingePosZ + (lidHeight - 0.1) * Math.cos(radAngle);
    components.push({
      id: 'laptop_webcam', name: '1080p FaceTime HD Camera', description: 'Integrated ISP camera array.',
      position: [0, camY, camZ], size: [0.3, 0.08, 0.01], explodedOffset: [0, 0.65, -0.15],
      shape: 'box', color: '#000000', specifications: { 'Resolution': '1080p', 'Lens': 'f/2.0' }
    });
    const camGeom = UniversalGeometryVocabulary.createRoundedBox(0.3, 0.08, 0.01, 0.04, 4);
    camGeom.applyQuaternion(new THREE.Quaternion().setFromEuler(rotArr));
    geometries['laptop_webcam'] = camGeom;
    meshSpecs['laptop_webcam'] = { id: 'laptop_webcam', name: '1080p FaceTime HD Camera', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#000000', materialType: 'PBR_MATTE' };

    // 4. Recessed Keyboard Deck & Keycaps
    const kbW = width * 0.75;
    const kbD = depth * 0.45;
    const kbPosZ = depth * 0.05;
    const kbComp: ComponentMetadata = {
      id: 'laptop_keyboard_deck',
      name: 'Anodized Aluminum Keyboard Recess',
      description: 'Precision milled recess.',
      position: [0, 0.01, kbPosZ],
      size: [kbW, 0.02, kbD],
      explodedOffset: [0, 0.3, 0],
      shape: 'box',
      color: '#0f172a',
      specifications: {
        'Design': 'Precision milled recess'
      }
    };
    components.push(kbComp);
    geometries['laptop_keyboard_deck'] = UniversalGeometryVocabulary.createRoundedBox(kbW, 0.02, kbD, 0.04, 4);
    meshSpecs['laptop_keyboard_deck'] = {
      id: 'laptop_keyboard_deck', name: kbComp.name, meshType: 'CUSTOM_PRIMITIVE',
      parameters: { kbW, kbD }, color: '#0f172a', materialType: 'PBR_METALLIC'
    };

    // Individual keys
    const rows = 6;
    const cols = 14;
    const keySpaceX = kbW / cols;
    const keySpaceZ = kbD / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 5 && c > 3 && c < 10 && c !== 6) continue;
        
        const keyW = (r === 5 && c === 6) ? keySpaceX * 6.8 : keySpaceX * 0.9;
        const xPos = (r === 5 && c === 6) ? 0 : -kbW/2 + keySpaceX * (c + 0.5);
        const zPos = kbPosZ - kbD/2 + keySpaceZ * (r + 0.5);
        
        const keyId = `laptop_key_${r}_${c}`;
        const keyGeom = UniversalGeometryVocabulary.createRoundedBox(keyW, 0.015, keySpaceZ * 0.9, 0.02, 2);
        components.push({
          id: keyId, name: `Keycap R${r}C${c}`, description: 'Scissor-switch keycap.',
          position: [xPos, 0.02, zPos], size: [keyW, 0.015, keySpaceZ * 0.9], explodedOffset: [0, 0.35 + Math.random()*0.1, 0],
          shape: 'box', color: '#1e293b', specifications: { 'Travel': '1mm' }
        });
        geometries[keyId] = keyGeom;
        meshSpecs[keyId] = { id: keyId, name: `Keycap R${r}C${c}`, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_MATTE' };
      }
    }

    // 5. Force Touch Glass Trackpad
    const padW = width * 0.45;
    const padD = depth * 0.32;
    const padPosZ = depth * 0.52;
    const padComp: ComponentMetadata = {
      id: 'laptop_trackpad',
      name: 'Force Touch Capacitive Glass Trackpad',
      description: 'Solid-state precision glass surface with quad force sensors and electro-magnetic Taptic feedback.',
      position: [0, 0.01, padPosZ],
      size: [padW, 0.02, padD],
      explodedOffset: [0, 0.25, 0.2],
      shape: 'box',
      color: '#475569',
      specifications: {
        'Sensors': '4x Strain Gauge Force Sensors',
        'Actuation': 'Sub-millisecond Taptic Linear Resonator'
      }
    };
    components.push(padComp);
    geometries['laptop_trackpad'] = UniversalGeometryVocabulary.createRoundedBox(padW, 0.02, padD, 0.02, 3);
    meshSpecs['laptop_trackpad'] = {
      id: 'laptop_trackpad', name: padComp.name, meshType: 'CUSTOM_PRIMITIVE',
      parameters: { padW, padD }, color: '#475569', materialType: 'PBR_GLASS'
    };

    // Speaker Grilles
    const grilleW = width * 0.08;
    const grilleD = depth * 0.6;
    components.push({
      id: 'laptop_speaker_l', name: 'Left Speaker Array', description: 'High-fidelity acoustic mesh.',
      position: [-width / 2 + grilleW * 1.2, 0.01, depth * 0.05], size: [grilleW, 0.01, grilleD], explodedOffset: [-0.2, 0.1, 0],
      shape: 'box', color: '#334155', specifications: { 'Audio': 'Force-cancelling woofers' }
    });
    geometries['laptop_speaker_l'] = UniversalGeometryVocabulary.createRoundedBox(grilleW, 0.01, grilleD, 0.02, 4);
    meshSpecs['laptop_speaker_l'] = { id: 'laptop_speaker_l', name: 'Left Speaker Array', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#334155', materialType: 'PBR_MATTE' };

    components.push({
      id: 'laptop_speaker_r', name: 'Right Speaker Array', description: 'High-fidelity acoustic mesh.',
      position: [width / 2 - grilleW * 1.2, 0.01, depth * 0.05], size: [grilleW, 0.01, grilleD], explodedOffset: [0.2, 0.1, 0],
      shape: 'box', color: '#334155', specifications: { 'Audio': 'Force-cancelling woofers' }
    });
    geometries['laptop_speaker_r'] = UniversalGeometryVocabulary.createRoundedBox(grilleW, 0.01, grilleD, 0.02, 4);
    meshSpecs['laptop_speaker_r'] = { id: 'laptop_speaker_r', name: 'Right Speaker Array', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#334155', materialType: 'PBR_MATTE' };

    // Rubber Feet
    const footR = 0.08;
    for(let i=0; i<4; i++) {
      const x = (i % 2 === 0 ? 1 : -1) * (width / 2 - width * 0.05 * 1.5);
      const z = (i < 2 ? 1 : -1) * (depth / 2 - width * 0.05 * 1.5);
      components.push({
        id: `laptop_foot_${i}`, name: `Rubber Foot ${i+1}`, description: 'Anti-slip elastomer foot.',
        position: [x, -baseThick / 2 - 0.01, z], size: [footR*2, 0.02, footR*2], explodedOffset: [x*0.5, -0.3, z*0.5],
        shape: 'cylinder', color: '#1e293b', specifications: { 'Material': 'Elastomer' }
      });
      geometries[`laptop_foot_${i}`] = new THREE.CylinderGeometry(footR, footR, 0.02, 16);
      meshSpecs[`laptop_foot_${i}`] = { id: `laptop_foot_${i}`, name: `Rubber Foot ${i+1}`, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_MATTE' };
    }

    // Side Ports
    const portGeom = UniversalGeometryVocabulary.createRoundedBox(0.03, 0.04, 0.1, 0.01, 2);
    components.push({
      id: 'laptop_port_l1', name: 'Thunderbolt 4 Port', description: '40Gbps USB-C port.',
      position: [-width / 2, -0.02, -depth * 0.3], size: [0.03, 0.04, 0.1], explodedOffset: [-0.2, -0.2, -0.2],
      shape: 'box', color: '#000000', specifications: { 'Protocol': 'Thunderbolt 4' }
    });
    geometries['laptop_port_l1'] = portGeom;
    meshSpecs['laptop_port_l1'] = { id: 'laptop_port_l1', name: 'Thunderbolt 4 Port', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#000000', materialType: 'PBR_MATTE' };

    components.push({
      id: 'laptop_port_l2', name: 'Thunderbolt 4 Port', description: '40Gbps USB-C port.',
      position: [-width / 2, -0.02, -depth * 0.1], size: [0.03, 0.04, 0.1], explodedOffset: [-0.2, -0.2, -0.1],
      shape: 'box', color: '#000000', specifications: { 'Protocol': 'Thunderbolt 4' }
    });
    geometries['laptop_port_l2'] = portGeom;
    meshSpecs['laptop_port_l2'] = { id: 'laptop_port_l2', name: 'Thunderbolt 4 Port', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#000000', materialType: 'PBR_MATTE' };

    const hdmiGeom = UniversalGeometryVocabulary.createRoundedBox(0.03, 0.04, 0.15, 0.01, 2);
    components.push({
      id: 'laptop_port_r1', name: 'HDMI Port', description: 'HDMI 2.1 video output.',
      position: [width / 2, -0.02, -depth * 0.2], size: [0.03, 0.04, 0.15], explodedOffset: [0.2, -0.2, -0.2],
      shape: 'box', color: '#000000', specifications: { 'Protocol': 'HDMI 2.1' }
    });
    geometries['laptop_port_r1'] = hdmiGeom;
    meshSpecs['laptop_port_r1'] = { id: 'laptop_port_r1', name: 'HDMI Port', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#000000', materialType: 'PBR_MATTE' };

    // 6. Dual Titanium Friction Barrel Hinges (Removed, now integrated earlier)
    // 7. Left & Right High-Speed Thunderbolt 4 / USB-C & USB-A Port Array (Removed, integrated earlier)

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 3. KEYBOARD (Mechanical / Desktop Keyboard)
  // =========================================================================
  public static generateKeyboard(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 3.6) * scale;
    const depth = Number(params.depth || 1.4) * scale;
    const height = Number(params.height || 0.28) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Chassis Case Base
    const caseComp: ComponentMetadata = {
      id: 'keyboard_case',
      name: 'Anodized Aluminum Keyboard Case',
      description: 'Gasket-mounted high-mass aluminum case with integrated sound dampening silicone foam.',
      position: [0, 0, 0],
      size: [width, height, depth],
      explodedOffset: [0, -0.2, 0],
      shape: 'box',
      color: '#1e293b',
      specifications: { 'Mounting': 'Poron Gasket Mount', 'Incline Angle': '6.5 Degrees' }
    };
    components.push(caseComp);
    geometries['keyboard_case'] = new THREE.BoxGeometry(width, height, depth);
    meshSpecs['keyboard_case'] = { id: 'keyboard_case', name: caseComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_METALLIC' };

    // 2. Keycaps Matrix Plate
    const keyPlateComp: ComponentMetadata = {
      id: 'keyboard_keycaps',
      name: 'Double-Shot PBT Keycap Matrix (87 Keys)',
      description: 'Sculpted Cherry-profile PBT keycaps with mechanical hot-swappable tactile linear switches.',
      position: [0, height / 2 + 0.05, -depth * 0.05],
      size: [width * 0.94, 0.08, depth * 0.8],
      explodedOffset: [0, 0.4, 0],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Keycaps': 'Double-Shot PBT 1.5mm', 'Switches': 'Hot-Swappable Gateron Oil King Linear (55g)' }
    };
    components.push(keyPlateComp);
    geometries['keyboard_keycaps'] = new THREE.BoxGeometry(width * 0.94, 0.08, depth * 0.8);
    meshSpecs['keyboard_keycaps'] = { id: 'keyboard_keycaps', name: keyPlateComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    // 3. Spacebar Keycap
    const spaceComp: ComponentMetadata = {
      id: 'keyboard_spacebar',
      name: '6.25u Stabilized Spacebar Keycap',
      description: 'PCB-mounted screw-in stabilizer balanced spacebar with tuned acoustic foam dampener.',
      position: [0, height / 2 + 0.06, depth * 0.35],
      size: [width * 0.35, 0.07, depth * 0.12],
      explodedOffset: [0, 0.6, 0.2],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Size': '6.25u Wire Stabilized', 'Actuation': 'Smooth Linear 50g' }
    };
    components.push(spaceComp);
    geometries['keyboard_spacebar'] = new THREE.BoxGeometry(width * 0.35, 0.07, depth * 0.12);
    meshSpecs['keyboard_spacebar'] = { id: 'keyboard_spacebar', name: spaceComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 4. COMPUTER MOUSE (Ergonomic Shell, Left/Right Buttons, Scroll Wheel, Sensor)
  // =========================================================================
  public static generateMouse(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const length = Number(params.length || 2.4) * scale;
    const width = Number(params.width || 1.4) * scale;
    const height = Number(params.height || 0.9) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Palm Grip Ergonomic Shell
    const shellComp: ComponentMetadata = {
      id: 'mouse_palm_body',
      name: 'Contoured Ergonomic Palm Shell',
      description: 'Lightweight honeycomb internal reinforced palm rest engineered for claw and palm grip styles.',
      position: [0, 0, 0],
      size: [width, height, length],
      explodedOffset: [0, 0.2, 0],
      shape: 'sphere',
      color: '#1e293b',
      specifications: { 'Weight': '58 grams', 'Coating': 'Hydrophobic Matte Grip Coating' }
    };
    components.push(shellComp);
    const shellGeom = new THREE.SphereGeometry(width * 0.6, 24, 24);
    shellGeom.scale(1.0, height / width, length / width);
    geometries['mouse_palm_body'] = shellGeom;
    meshSpecs['mouse_palm_body'] = { id: 'mouse_palm_body', name: shellComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_METALLIC' };

    // 2. Left & Right Click Switch Assembly
    const btnComp: ComponentMetadata = {
      id: 'mouse_buttons',
      name: 'Optical Switch Split Trigger Plates',
      description: 'Zero-debounce optical light-beam microswitches rated for 90 million clicks.',
      position: [0, height * 0.35, length * 0.32],
      size: [width * 0.85, 0.08, length * 0.35],
      explodedOffset: [0, 0.4, 0.2],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Switch Type': 'Gen-3 Optical Microswitches (0.2ms latency)', 'Rating': '90M Clicks' }
    };
    components.push(btnComp);
    geometries['mouse_buttons'] = new THREE.BoxGeometry(width * 0.85, 0.08, length * 0.35);
    meshSpecs['mouse_buttons'] = { id: 'mouse_buttons', name: btnComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    // 3. Scroll Wheel Encoder
    const wheelComp: ComponentMetadata = {
      id: 'mouse_scroll_wheel',
      name: 'Textured Aluminum Optical Scroll Wheel',
      description: 'Tactile indexed scroll wheel with rubberized grip ring and middle click actuator.',
      position: [0, height * 0.45, length * 0.28],
      size: [0.18, 0.35, 0.35],
      explodedOffset: [0, 0.6, 0.3],
      shape: 'cylinder',
      color: '#06b6d4',
      specifications: { 'Steps': '24 tactile steps per revolution', 'Encoder': 'TTC Gold Dustproof' }
    };
    components.push(wheelComp);
    const wheelGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20);
    wheelGeom.rotateZ(Math.PI / 2);
    geometries['mouse_scroll_wheel'] = wheelGeom;
    meshSpecs['mouse_scroll_wheel'] = { id: 'mouse_scroll_wheel', name: wheelComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#06b6d4', materialType: 'PBR_METALLIC' };

    // 4. Base Skates & Optical Sensor
    const sensorComp: ComponentMetadata = {
      id: 'mouse_base_sensor',
      name: '30,000 DPI Optical Sensor Baseplate',
      description: 'Virgin-grade PTFE glide skates with Focus Pro 30K optical sensor tracking on glass.',
      position: [0, -height * 0.45, 0],
      size: [width * 0.9, 0.04, length * 0.9],
      explodedOffset: [0, -0.3, 0],
      shape: 'box',
      color: '#0f172a',
      specifications: { 'Max DPI': '30,000 DPI', 'Max Speed': '750 IPS', 'Max Acceleration': '70 G' }
    };
    components.push(sensorComp);
    geometries['mouse_base_sensor'] = new THREE.BoxGeometry(width * 0.9, 0.04, length * 0.9);
    meshSpecs['mouse_base_sensor'] = { id: 'mouse_base_sensor', name: sensorComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0f172a', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 5. WATER BOTTLE (Insulated Body, Tapered Neck, Screw Cap)
  // =========================================================================
  public static generateWaterBottle(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const radius = Number(params.radius || 0.6) * scale;
    const height = Number(params.height || 2.4) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Vacuum Insulated Double-Wall Flask Body
    const bodyH = height * 0.72;
    const bodyComp: ComponentMetadata = {
      id: 'bottle_body',
      name: 'Double-Wall Vacuum 18/8 Stainless Flask Body',
      description: 'Food-grade 18/8 (304) stainless steel inner and outer walls separated by a high-vacuum thermal barrier.',
      position: [0, -height * 0.14, 0],
      size: [radius * 2, bodyH, radius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: { 'Alloy': '18/8 Food Grade Stainless Steel', 'Thermal Retention': '24h Cold / 12h Hot', 'Capacity': '750 ml (25 oz)' }
    };
    components.push(bodyComp);
    geometries['bottle_body'] = new THREE.CylinderGeometry(radius, radius, bodyH, 32);
    meshSpecs['bottle_body'] = { id: 'bottle_body', name: bodyComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { radius, bodyH }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Tapered Shoulder & Neck
    const neckH = height * 0.15;
    const neckR = radius * 0.55;
    const neckComp: ComponentMetadata = {
      id: 'bottle_neck',
      name: 'Threaded Spout Neck Transition',
      description: 'Precision hydroformed neck taper with CNC cut external threads.',
      position: [0, height * 0.28, 0],
      size: [radius * 2, neckH, radius * 2],
      explodedOffset: [0, 0.2, 0],
      shape: 'cylinder',
      color: '#0369a1',
      specifications: { 'Spout Diameter': '38 mm Standard Mouth', 'Thread Pitch': '3.0 mm' }
    };
    components.push(neckComp);
    geometries['bottle_neck'] = new THREE.CylinderGeometry(neckR, radius, neckH, 32);
    meshSpecs['bottle_neck'] = { id: 'bottle_neck', name: neckComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { neckR, neckH }, color: '#0369a1', materialType: 'PBR_METALLIC' };

    // 3. Insulated Grip Screw Cap & Loop
    const capH = height * 0.16;
    const capComp: ComponentMetadata = {
      id: 'bottle_cap',
      name: 'Leakproof Insulated Screw Cap with Carry Handle',
      description: 'BPA-free polypropylene cap with food-grade silicone compression gasket seal.',
      position: [0, height * 0.42, 0],
      size: [neckR * 1.25 * 2, capH, neckR * 1.25 * 2],
      explodedOffset: [0, 0.6, 0],
      shape: 'cylinder',
      color: '#0f172a',
      specifications: { 'Seal': 'Food-Grade Platinum-Cured Silicone', 'Handle': 'Flexible Polycarbonate Loop' }
    };
    components.push(capComp);
    geometries['bottle_cap'] = new THREE.CylinderGeometry(neckR * 1.15, neckR * 1.15, capH, 24);
    meshSpecs['bottle_cap'] = { id: 'bottle_cap', name: capComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { capH }, color: '#0f172a', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 6. MONITOR / DESKTOP DISPLAY (Screen Panel, Bezel, Stand Arm, Base Plate)
  // =========================================================================
  public static generateMonitor(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 4.2) * scale;
    const height = Number(params.height || 2.5) * scale;
    const thickness = 0.1 * scale;
    const cornerRadius = 0.1;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComponent = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_METALLIC',
      rot?: [number, number, number]
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      if (rot) geom.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // 1. Display Panel (Active Area)
    const screenW = width * 0.98;
    const screenH = height * 0.95;
    addComponent(
      'monitor_screen', '4K IPS Display Panel', 'Anti-glare coated IPS panel.',
      [0, height/2 + 0.4, thickness/2 + 0.01], [screenW, screenH, 0.01], [0, 0, 0.4], '#020617',
      UniversalGeometryVocabulary.createRoundedBox(screenW, screenH, 0.01, 0.02, 4),
      { 'Resolution': '3840 x 2160 UHD', 'Refresh Rate': '144Hz' }, 'PBR_MATTE'
    );

    // 2. Bezel & Front Frame
    addComponent(
      'monitor_bezel', 'Slim Display Bezel', 'Ultra-thin symmetrical bezel.',
      [0, height/2 + 0.4, thickness/2], [width, height, 0.01], [0, 0, 0.2], '#0f172a',
      UniversalGeometryVocabulary.createRoundedBox(width, height, 0.01, cornerRadius, 6),
      { 'Material': 'Polycarbonate' }, 'PBR_MATTE'
    );

    // 3. Rear Enclosure
    addComponent(
      'monitor_rear_case', 'Curved Rear Enclosure', 'Thermal dissipation housing.',
      [0, height/2 + 0.4, -thickness/2], [width * 0.95, height * 0.9, thickness], [0, 0, -0.2], '#1e293b',
      UniversalGeometryVocabulary.createRoundedBox(width * 0.95, height * 0.9, thickness, cornerRadius * 2, 6),
      { 'Material': 'ABS Plastic' }, 'PBR_MATTE'
    );

    // VESA Mount Block
    addComponent(
      'monitor_vesa_mount', 'VESA Mounting Interface', '100x100mm quick-release mount.',
      [0, height/2 + 0.4, -thickness - 0.05], [0.8, 0.8, 0.1], [0, 0, -0.4], '#334155',
      UniversalGeometryVocabulary.createRoundedBox(0.8, 0.8, 0.1, 0.05, 4),
      { 'Standard': 'VESA 100x100' }, 'PBR_METALLIC'
    );

    // 4. Stand Riser Arm (Cylinder)
    const armR = 0.15;
    const armH = 1.6;
    const armGeom = new THREE.CylinderGeometry(armR, armR, armH, 24);
    addComponent(
      'monitor_stand_arm', 'Ergonomic Stand Riser', 'Gas-spring height adjustable column.',
      [0, armH/2 - 0.1, -thickness - 0.25], [armR*2, armH, armR*2], [0, -0.2, -0.7], '#475569',
      armGeom, { 'Adjustment': '150mm Height' }, 'PBR_METALLIC'
    );
    
    // Cable routing hole in arm
    addComponent(
      'monitor_cable_hole', 'Cable Management Routing', 'Through-hole for clean desk setup.',
      [0, 0.3, -thickness - 0.25], [armR*1.2, 0.4, armR*2.1], [0, -0.2, -0.8], '#000000',
      UniversalGeometryVocabulary.createRoundedBox(armR*1.2, 0.4, armR*2.2, 0.05, 4),
      { 'Feature': 'Internal routing' }, 'PBR_MATTE'
    );

    // 5. Heavy Die-Cast Base Plate
    const baseW = 1.8;
    const baseD = 1.2;
    const baseThick = 0.08;
    addComponent(
      'monitor_base_plate', 'Weighted Base Pedestal', 'Die-cast aluminum base for maximum stability.',
      [0, 0, -0.1], [baseW, baseThick, baseD], [0, -0.5, 0], '#334155',
      UniversalGeometryVocabulary.createRoundedBox(baseW, baseThick, baseD, 0.1, 4),
      { 'Material': 'Cast Aluminum' }, 'PBR_METALLIC'
    );

    // I/O Ports
    for (let i = 0; i < 4; i++) {
      addComponent(
        `monitor_port_${i}`, `I/O Port ${i+1}`, 'Display input.',
        [-0.4 + i*0.15, height/2 + 0.1, -thickness - 0.02], [0.08, 0.04, 0.1], [0, -0.2, -0.4], '#000000',
        UniversalGeometryVocabulary.createRoundedBox(0.08, 0.04, 0.1, 0.01, 2),
        { 'Type': 'HDMI / DP / USB-C' }, 'PBR_MATTE'
      );
    }

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 7. SMARTWATCH (Case, Screen, Digital Crown, Wrist Straps)
  // =========================================================================
  public static generateSmartwatch(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const size = Number(params.caseSize || 1.4) * scale;
    const thickness = Number(params.thickness || 0.4) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Titanium Case & Sensor Crystal
    const caseComp: ComponentMetadata = {
      id: 'smartwatch_case',
      name: 'Titanium Smartwatch Case & Bio-Sensors',
      description: 'Aerospace-grade titanium case housing ECG, optical heart rate, SpO2, and skin temperature sensors.',
      position: [0, 0, 0],
      size: [size, size, thickness],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#475569',
      specifications: { 'Case Size': '49 mm', 'Sensors': 'Optical HR, Electrical Heart Sensor (ECG), SpO2, Depth Gauge' }
    };
    components.push(caseComp);
    geometries['smartwatch_case'] = new THREE.BoxGeometry(size, size, thickness);
    meshSpecs['smartwatch_case'] = { id: 'smartwatch_case', name: caseComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#475569', materialType: 'PBR_METALLIC' };

    // 2. Sapphire Crystal OLED Display
    const dispComp: ComponentMetadata = {
      id: 'smartwatch_display',
      name: 'Always-On Retina Sapphire OLED Display',
      description: 'Flat sapphire front crystal with 3000 nits peak outdoor brightness.',
      position: [0, 0, thickness / 2 + 0.02],
      size: [size * 0.88, size * 0.88, 0.02],
      explodedOffset: [0, 0, 0.4],
      shape: 'box',
      color: '#020617',
      specifications: { 'Resolution': '410 x 502 pixels (338 ppi)', 'Brightness': '3000 nits' }
    };
    components.push(dispComp);
    geometries['smartwatch_display'] = new THREE.BoxGeometry(size * 0.88, size * 0.88, 0.02);
    meshSpecs['smartwatch_display'] = { id: 'smartwatch_display', name: dispComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#020617', materialType: 'PBR_METALLIC' };

    // 3. Digital Crown Wheel
    const crownComp: ComponentMetadata = {
      id: 'smartwatch_crown',
      name: 'Haptic Knurled Digital Crown',
      description: 'Titanium rotary encoder with precision knurled grip and haptic vibration feedback.',
      position: [size / 2 + 0.06, size * 0.2, 0],
      size: [0.15, 0.28, 0.28],
      explodedOffset: [0.4, 0, 0],
      shape: 'cylinder',
      color: '#f97316',
      specifications: { 'Feedback': 'Sub-millimeter Haptic Pulse Engine' }
    };
    components.push(crownComp);
    const crownGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
    crownGeom.rotateZ(Math.PI / 2);
    geometries['smartwatch_crown'] = crownGeom;
    meshSpecs['smartwatch_crown'] = { id: 'smartwatch_crown', name: crownComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#f97316', materialType: 'PBR_METALLIC' };

    // 4. Upper Fluoroelastomer Strap
    const strapW = size * 0.75;
    const strapL = size * 1.2;
    const strapTopComp: ComponentMetadata = {
      id: 'smartwatch_strap_top',
      name: 'High-Performance Ocean Loop Upper Strap',
      description: 'Tubular elastomeric geometry woven from high-strength yarn with titanium G-hook clasp.',
      position: [0, size / 2 + strapL / 2, -0.02],
      size: [strapW, strapL, 0.1],
      explodedOffset: [0, 0.5, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Material': 'Fluoroelastomer with Titanium Buckle' }
    };
    components.push(strapTopComp);
    geometries['smartwatch_strap_top'] = new THREE.BoxGeometry(strapW, strapL, 0.08);
    meshSpecs['smartwatch_strap_top'] = { id: 'smartwatch_strap_top', name: strapTopComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 5. Lower Strap
    const strapBottomComp: ComponentMetadata = {
      id: 'smartwatch_strap_bottom',
      name: 'Ocean Loop Lower Strap Section',
      description: 'Flexible stretch elastomer matching wrist curvature.',
      position: [0, -size / 2 - strapL / 2, -0.02],
      size: [strapW, strapL, 0.1],
      explodedOffset: [0, -0.5, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Material': 'Fluoroelastomer with Adjustment Loops' }
    };
    components.push(strapBottomComp);
    geometries['smartwatch_strap_bottom'] = new THREE.BoxGeometry(strapW, strapL, 0.08);
    meshSpecs['smartwatch_strap_bottom'] = { id: 'smartwatch_strap_bottom', name: strapBottomComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 8. HEADPHONES (Headband Arch, Left/Right Earcups, Cushions, Yokes)
  // =========================================================================
  public static generateHeadphones(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 2.4) * scale;
    const height = Number(params.height || 2.8) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Spring Steel Arch Headband
    const bandComp: ComponentMetadata = {
      id: 'headphones_headband',
      name: 'Spring Steel Canopy Headband',
      description: 'Breathable knit mesh canopy wrapped in stainless steel frame distributing weight evenly.',
      position: [0, height * 0.28, 0],
      size: [width * 0.95, height * 0.45, 0.3],
      explodedOffset: [0, 0.4, 0],
      shape: 'box',
      color: '#475569',
      specifications: { 'Material': 'Stainless Steel with Memory Foam Canopy' }
    };
    components.push(bandComp);
    const bandGeom = new THREE.TorusGeometry(width * 0.45, 0.08, 12, 32, Math.PI);
    bandGeom.rotateZ(-Math.PI / 2);
    geometries['headphones_headband'] = bandGeom;
    meshSpecs['headphones_headband'] = { id: 'headphones_headband', name: bandComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#475569', materialType: 'PBR_METALLIC' };

    // 2. Left Acoustic Earcup & Cushion
    const cupR = 0.55 * scale;
    const cupD = 0.45 * scale;
    const cupLeftComp: ComponentMetadata = {
      id: 'headphones_earcup_left',
      name: 'Left Anodized Acoustic Earcup (40mm Driver)',
      description: 'Custom 40mm dynamic driver with dual neodymium ring magnet motor and active noise cancellation mic array.',
      position: [-width * 0.45, -height * 0.1, 0],
      size: [cupD, cupR * 2, cupR * 2],
      explodedOffset: [-0.6, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: { 'Driver': '40mm Custom Dynamic Transducer', 'THD': '< 0.1% at 1 kHz' }
    };
    components.push(cupLeftComp);
    const cupLeftGeom = new THREE.CylinderGeometry(cupR, cupR, cupD, 24);
    cupLeftGeom.rotateZ(Math.PI / 2);
    geometries['headphones_earcup_left'] = cupLeftGeom;
    meshSpecs['headphones_earcup_left'] = { id: 'headphones_earcup_left', name: cupLeftComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 3. Right Acoustic Earcup & Cushion
    const cupRightComp: ComponentMetadata = {
      id: 'headphones_earcup_right',
      name: 'Right Anodized Acoustic Earcup',
      description: 'Houses H1/H2 computational audio processing chip, battery, and digital crown volume control.',
      position: [width * 0.45, -height * 0.1, 0],
      size: [cupD, cupR * 2, cupR * 2],
      explodedOffset: [0.6, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: { 'ANC': 'Active Noise Cancellation with Transparency Mode' }
    };
    components.push(cupRightComp);
    const cupRightGeom = new THREE.CylinderGeometry(cupR, cupR, cupD, 24);
    cupRightGeom.rotateZ(Math.PI / 2);
    geometries['headphones_earcup_right'] = cupRightGeom;
    meshSpecs['headphones_earcup_right'] = { id: 'headphones_earcup_right', name: cupRightComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 9. GAME CONTROLLER (Gamepad, Thumbsticks, D-Pad, Triggers)
  // =========================================================================
  public static generateGameController(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const width = Number(params.width || 3.0) * scale;
    const height = Number(params.height || 2.0) * scale;
    const depth = Number(params.depth || 1.2) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Dual Ergonomic Grip Body
    const bodyComp: ComponentMetadata = {
      id: 'controller_body',
      name: 'Ergonomic Grip Body & Internal Rumble Actuators',
      description: 'Dual palm contours housing dual-axis haptic voice coil linear resonant actuators.',
      position: [0, 0, 0],
      size: [width, height, depth],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#1e293b',
      specifications: { 'Haptics': 'Dual Linear Resonant Actuators', 'Wireless': '2.4 GHz Low-Latency & Bluetooth 5.2' }
    };
    components.push(bodyComp);
    geometries['controller_body'] = new THREE.BoxGeometry(width, height * 0.7, depth * 0.7);
    meshSpecs['controller_body'] = { id: 'controller_body', name: bodyComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b', materialType: 'PBR_METALLIC' };

    // 2. Left & Right Analog Thumbsticks
    const stickComp: ComponentMetadata = {
      id: 'controller_thumbsticks',
      name: 'Hall-Effect Electromagnetic Thumbsticks',
      description: 'Contactless magnetic sensor thumbsticks eliminating stick drift with textured rubber thumbcaps.',
      position: [-width * 0.25, height * 0.15, depth * 0.3],
      size: [0.6, 0.4, 0.6],
      explodedOffset: [-0.3, 0.4, 0.3],
      shape: 'cylinder',
      color: '#06b6d4',
      specifications: { 'Sensors': 'Hall Effect Contactless (0% drift)', 'Sampling Rate': '1000 Hz Polling' }
    };
    components.push(stickComp);
    geometries['controller_thumbsticks'] = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 20);
    meshSpecs['controller_thumbsticks'] = { id: 'controller_thumbsticks', name: stickComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#06b6d4', materialType: 'PBR_METALLIC' };

    // 3. D-Pad & Action Buttons (ABXY)
    const btnComp: ComponentMetadata = {
      id: 'controller_buttons',
      name: 'Microswitch Directional D-Pad & ABXY Cluster',
      description: 'Tactile mechanical switches with distinct actuation feedback.',
      position: [width * 0.25, height * 0.15, depth * 0.3],
      size: [0.6, 0.4, 0.6],
      explodedOffset: [0.3, 0.4, 0.3],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Actuation': 'Mechanical Microswitches 0.3mm Travel' }
    };
    components.push(btnComp);
    geometries['controller_buttons'] = new THREE.BoxGeometry(0.6, 0.2, 0.6);
    meshSpecs['controller_buttons'] = { id: 'controller_buttons', name: btnComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  // =========================================================================
  // 10. UNIVERSAL PRIMITIVE ASSEMBLY FALLBACK (For any common manufactured object)
  // =========================================================================
  public static generatePrimitiveAssembly(query: string, params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const cleanQ = query.toLowerCase();

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // Determine representative geometric composition based on query keywords
    const isCylindrical = cleanQ.includes('cup') || cleanQ.includes('mug') || cleanQ.includes('can') || cleanQ.includes('pipe') || cleanQ.includes('tube') || cleanQ.includes('telescope') || cleanQ.includes('flashlight') || cleanQ.includes('speaker') || cleanQ.includes('battery');
    const isBoxy = cleanQ.includes('box') || cleanQ.includes('cube') || cleanQ.includes('case') || cleanQ.includes('table') || cleanQ.includes('chair') || cleanQ.includes('desk') || cleanQ.includes('cabinet') || cleanQ.includes('router') || cleanQ.includes('console');

    // 1. Primary Structural Core Component
    const coreId = `object_${cleanQ.replace(/[^a-z0-9]/g, '_')}_core`;
    const coreComp: ComponentMetadata = {
      id: coreId,
      name: `Primary Structural Chassis (${query})`,
      description: `Core volumetric geometric enclosure procedurally synthesized for '${query}'.`,
      position: [0, 0, 0],
      size: [2.0 * scale, 2.0 * scale, 2.0 * scale],
      explodedOffset: [0, 0, 0],
      shape: isCylindrical ? 'cylinder' : (isBoxy ? 'box' : 'sphere'),
      color: '#0284c7',
      specifications: { 'Representation': 'Illustrative 3D Digital Twin', 'Geometric Class': isCylindrical ? 'Revolution Cylinder' : (isBoxy ? 'Cuboid Prism' : 'Volumetric Quadric Solid') }
    };
    components.push(coreComp);

    if (isCylindrical) {
      geometries[coreId] = new THREE.CylinderGeometry(0.9 * scale, 0.9 * scale, 2.2 * scale, 32);
    } else if (isBoxy) {
      geometries[coreId] = new THREE.BoxGeometry(2.2 * scale, 1.4 * scale, 1.8 * scale);
    } else {
      geometries[coreId] = new THREE.SphereGeometry(1.2 * scale, 32, 32);
    }
    meshSpecs[coreId] = { id: coreId, name: coreComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Functional Top / Interface Component
    const topId = `object_${cleanQ.replace(/[^a-z0-9]/g, '_')}_top`;
    const topComp: ComponentMetadata = {
      id: topId,
      name: `Interface / Upper Assembly Component`,
      description: `Upper interactive surface and operational boundary.`,
      position: [0, 1.1 * scale, 0],
      size: [1.6 * scale, 0.4 * scale, 1.6 * scale],
      explodedOffset: [0, 0.5 * scale, 0],
      shape: isCylindrical ? 'cylinder' : 'box',
      color: '#38bdf8',
      specifications: { 'Interface Type': 'Upper Mechanical / Functional Boundary' }
    };
    components.push(topComp);
    if (isCylindrical) {
      geometries[topId] = new THREE.CylinderGeometry(0.7 * scale, 0.85 * scale, 0.4 * scale, 24);
    } else {
      geometries[topId] = new THREE.BoxGeometry(1.8 * scale, 0.25 * scale, 1.5 * scale);
    }
    meshSpecs[topId] = { id: topId, name: topComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    // 3. Base / Mounting Pad Component
    const baseId = `object_${cleanQ.replace(/[^a-z0-9]/g, '_')}_base`;
    const baseComp: ComponentMetadata = {
      id: baseId,
      name: `Stabilization Baseplate / Mounting Interface`,
      description: `Bottom structural footing providing stability and ground load transfer.`,
      position: [0, -1.1 * scale, 0],
      size: [2.2 * scale, 0.3 * scale, 2.2 * scale],
      explodedOffset: [0, -0.4 * scale, 0],
      shape: isCylindrical ? 'cylinder' : 'box',
      color: '#0f172a',
      specifications: { 'Mounting Interface': 'Damped Mechanical Footing' }
    };
    components.push(baseComp);
    if (isCylindrical) {
      geometries[baseId] = new THREE.CylinderGeometry(1.0 * scale, 1.0 * scale, 0.25 * scale, 24);
    } else {
      geometries[baseId] = new THREE.BoxGeometry(2.4 * scale, 0.2 * scale, 2.0 * scale);
    }
    meshSpecs[baseId] = { id: baseId, name: baseComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0f172a', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }
}

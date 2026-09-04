const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf-8');

const newMethod = `  public static generateGearbox(params: Record<string, any>): GeneratedAssemblyPayload {
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
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
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
    const pinionGeom = UniversalGeometryVocabulary.createSpurGear(pinionRadius, depth * 0.45, 18, 0.05, 0.05);
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
    const bullGeom = UniversalGeometryVocabulary.createSpurGear(bullRadius, depth * 0.45, 54, 0.05, 0.15);
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
  }`;

const startIndex = file.indexOf('  public static generateGearbox(params: Record<string, any>): GeneratedAssemblyPayload {');
const endIndex = file.indexOf('  public static createGearMesh(') > -1 ? file.indexOf('  public static createGearMesh(') : file.length;

if (startIndex !== -1) {
  const newFile = file.substring(0, startIndex) + newMethod + '\n\n}\n'; // End class
  fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newFile);
  console.log('Gearbox Replaced successfully.');
} else {
  console.log('Could not find indices.');
}

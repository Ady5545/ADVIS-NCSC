const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf-8');

const newMethod = `  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {
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
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
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
  }`;

const startIndex = file.indexOf('  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {');
const endIndex = file.indexOf('  public static generateCeilingFan(params: Record<string, any>): GeneratedAssemblyPayload {');

if (startIndex !== -1 && endIndex !== -1) {
  const newFile = file.substring(0, startIndex) + newMethod + '\n\n' + file.substring(endIndex);
  fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newFile);
  console.log('Transformer Replaced successfully.');
} else {
  console.log('Could not find indices.');
}

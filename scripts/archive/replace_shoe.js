const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf-8');

const newMethod = `  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const length = Number(params.length || 3.2) * scale;
    const width = Number(params.width || 1.15) * scale;
    const height = Number(params.height || 1.25) * scale;
    const soleThickness = Number(params.soleThickness || 0.12) * scale;
    const heelHeight = Number(params.heelHeight || 0.28) * scale;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComponent = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE',
      rot?: [number, number, number]
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      if (rot) geom.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
    };

    // 1. Goodyear Welted Outsole
    const outsoleGeom = UniversalGeometryVocabulary.createShoeSole(length, width, soleThickness, heelHeight * 0.6, 0.08);
    addComponent(
      'shoe_outsole', 'Oak-Bark Tanned Leather Outsole', 'Channel-stitched Goodyear welted 6mm prime leather outsole.',
      [0, 0, 0], [width, soleThickness, length], [0, -0.6, 0], '#5c2d16',
      outsoleGeom, { 'Construction': 'Goodyear Welt' }, 'PBR_MATTE'
    );

    // 2. Stacked Leather Heel with Rubber Top Lift
    const heelGeoms = [];
    const heelStack = new THREE.CylinderGeometry(width * 0.38, width * 0.42, heelHeight, 24);
    heelStack.translate(0, heelHeight / 2 + soleThickness, -length * 0.32);
    heelGeoms.push(heelStack);
    addComponent(
      'shoe_heel', 'Hand-Stacked Leather Heel', 'Multi-layer vegetable tanned leather heel block.',
      [0, 0, 0], [width * 0.8, heelHeight, length * 0.35], [0, -0.9, -0.3], '#3d1c08',
      UniversalGeometryVocabulary.mergeGeometries(heelGeoms), { 'Lifts': '5-Layer Stacked Bridle Leather' }, 'PBR_MATTE'
    );

    // 3. Midsole & Welt
    const midsoleGeom = UniversalGeometryVocabulary.createShoeSole(length * 0.98, width * 0.98, soleThickness * 0.8, heelHeight * 0.4, 0.08);
    midsoleGeom.translate(0, soleThickness, 0);
    addComponent(
      'shoe_midsole', 'Leather Midsole & Cork Bed', 'Cork-filled footbed and thick leather midsole.',
      [0, 0, 0], [width * 0.98, soleThickness * 0.8, length * 0.98], [0, -0.3, 0], '#8a5a3a',
      midsoleGeom, { 'Material': 'Vegetable Tanned Leather' }, 'PBR_MATTE'
    );

    // 4. Vamp & Quarters (Using the generic upper, but splitted theoretically)
    const upperGeom = UniversalGeometryVocabulary.createShoeUpper(length, width, height, width * 0.35);
    upperGeom.translate(0, soleThickness, 0);
    addComponent(
      'shoe_upper_vamp', 'French Boxcalf Upper', 'Seamless smooth leather vamp and quarters spanning the flex point.',
      [0, 0, 0], [width * 0.92, height, length], [0, 0.4, 0], '#1c1917',
      upperGeom, { 'Leather': 'French Boxcalf 1.4mm' }, 'PBR_METALLIC'
    );

    // 5. Toe Cap (Brogued detail simulated by a second cap geometry)
    const toeCapGeom = UniversalGeometryVocabulary.createRoundedBox(width * 0.85, height * 0.35, length * 0.25, 0.25, 4);
    toeCapGeom.translate(0, soleThickness + soleThickness * 0.8 + height * 0.175, length * 0.35);
    addComponent(
      'shoe_toe_cap', 'Perforated Toe Cap', 'Classic Oxford toe cap with broguing detail.',
      [0, 0, 0], [width * 0.85, height * 0.35, length * 0.25], [0, 0.1, 0.6], '#1c1917',
      toeCapGeom, { 'Detail': 'Medallion Broguing' }, 'PBR_METALLIC'
    );

    // 6. Laces
    const lacingGeoms = [];
    const laceCount = 5;
    const facingLength = length * 0.28;
    const lacingStart = 0;
    for (let i = 0; i < laceCount; i++) {
      const z = lacingStart - (i / (laceCount - 1)) * facingLength;
      const y = soleThickness + height * 0.65 + (i * 0.04);
      const laceBar = UniversalGeometryVocabulary.createTubeBetweenPoints(
        [-width * 0.14, y, z],
        [width * 0.14, y, z],
        0.012
      );
      lacingGeoms.push(laceBar);
    }
    addComponent(
      'shoe_lacing_system', 'Waxed Cotton Laces', 'Flat waxed cotton shoelace system.',
      [0, 0, 0], [width * 0.35, height * 0.4, facingLength], [0, 0.6, 0.1], '#000000',
      UniversalGeometryVocabulary.mergeGeometries(lacingGeoms), { 'Material': 'Waxed Cotton' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }`;

const startIndex = file.indexOf('  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {');
const endIndex = file.indexOf('  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {');

if (startIndex !== -1 && endIndex !== -1) {
  const newFile = file.substring(0, startIndex) + newMethod + '\n\n' + file.substring(endIndex);
  fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newFile);
  console.log('Replaced successfully.');
} else {
  console.log('Could not find indices.');
}

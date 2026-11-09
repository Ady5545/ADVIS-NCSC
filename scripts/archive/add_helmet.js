const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf-8');

const newMethod = `  public static generateHelmet(params: Record<string, any>): GeneratedAssemblyPayload {
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
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType };
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

`;

const endIndex = file.lastIndexOf('}'); // end of class UniversalDecomposition

if (endIndex !== -1) {
  const newFile = file.substring(0, endIndex) + newMethod + '}\n';
  fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newFile);
  console.log('Helmet Added successfully.');
} else {
  console.log('Could not find indices.');
}

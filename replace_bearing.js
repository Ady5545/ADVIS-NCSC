const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf-8');

const newMethod = `  public static generateBallBearing(params: Record<string, any>): GeneratedAssemblyPayload {
    const bore = Number(params.boreDiameter || params.innerDiameter || 20); // mm
    const outer = Number(params.outerDiameter || 47); // mm
    const width = Number(params.width || 14); // mm
    const ballCount = Number(params.ballCount || 8);

    const s = 0.05; // scale to 3D units
    const rInner = (bore / 2) * s;
    const rOuter = (outer / 2) * s;
    const rPitch = (rInner + rOuter) / 2;
    const ballRadius = ((rOuter - rInner) * 0.35);
    const depth = width * s;

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

    // Helper to make a hollow cylinder using ExtrudeGeometry
    const createRing = (innerRad: number, outerRad: number, thickness: number) => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRad, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRad, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const extrudeSettings = { depth: thickness, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 32 };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.translate(0, 0, -thickness / 2);
      return geom;
    };

    // 1. Outer Ring
    addComp(
      'bearing_outer_ring', \`Outer Raceway Ring (Ø\${outer}mm)\`, 'Precision ground solid outer raceway.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, 1.0], '#475569',
      createRing(rOuter - (rOuter - rInner) * 0.25, rOuter, depth),
      { 'Outer Diameter': \`\${outer} mm\`, 'Material': '52100 Chrome Steel' }, 'PBR_METALLIC'
    );

    // 2. Inner Ring
    addComp(
      'bearing_inner_ring', \`Inner Raceway Ring (Ø\${bore}mm)\`, 'Shaft-mounting solid inner raceway.',
      [0, 0, 0], [rInner * 2, rInner * 2, depth], [0, 0, -1.0], '#64748b',
      createRing(rInner, rInner + (rOuter - rInner) * 0.25, depth),
      { 'Bore Diameter': \`\${bore} mm\`, 'Tolerance Class': 'ABEC-5 / ISO Normal' }, 'PBR_METALLIC'
    );

    // 3. Rolling Balls
    const ballGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < ballCount; i++) {
      const angle = (i * Math.PI * 2) / ballCount;
      const bx = Math.cos(angle) * rPitch;
      const by = Math.sin(angle) * rPitch;
      const ball = new THREE.SphereGeometry(ballRadius, 24, 18);
      ball.translate(bx, by, 0);
      ballGeoms.push(ball);
    }
    
    // We can merge the balls into one component for performance if we don't need them individually,
    // but the original code had them individually. Let's merge them into a single "Rolling Elements" component to be cleaner.
    // Wait, the original code generated individual balls. Let's just create one component for the balls and cage.
    const mergedBalls = ballGeoms.length > 0 ? (ballGeoms.length === 1 ? ballGeoms[0] : (THREE as any).BufferGeometryUtils ? (THREE as any).BufferGeometryUtils.mergeBufferGeometries(ballGeoms) : ballGeoms[0]) : new THREE.BufferGeometry();
    
    // To handle lack of BufferGeometryUtils safely without imports, I will manually create balls or just use the original loop.
    // Let's use the original loop for the balls so they can explode properly radially.
    for (let i = 0; i < ballCount; i++) {
      const angle = (i * Math.PI * 2) / ballCount;
      const bx = Math.cos(angle) * rPitch;
      const by = Math.sin(angle) * rPitch;
      const ballId = \`bearing_ball_\${i + 1}\`;
      const ball = new THREE.SphereGeometry(ballRadius, 24, 18);
      ball.translate(bx, by, 0);
      
      addComp(
        ballId, \`Bearing Ball #\${i + 1} (Grade 10)\`, \`Precision spherical rolling element.\`,
        [0, 0, 0], [ballRadius * 2, ballRadius * 2, ballRadius * 2], [bx * 1.5, by * 1.5, 0], '#e2e8f0',
        ball, { 'Ball Diameter': \`\${(ballRadius * 2 / s).toFixed(1)} mm\`, 'Sphericity': '< 0.13 µm' }, 'PBR_METALLIC'
      );
    }

    // 4. Retainer Cage
    const cageGeom = createRing(rPitch - ballRadius * 0.4, rPitch + ballRadius * 0.4, depth * 0.5);
    addComp(
      'bearing_cage', 'Steel Ribbon Cage', 'Pressed steel cage guiding the rolling elements.',
      [0, 0, 0], [rPitch * 2, rPitch * 2, depth * 0.5], [0, 0, 0.4], '#cbd5e1',
      cageGeom, { 'Material': 'Pressed Sheet Steel' }, 'PBR_METALLIC'
    );
    
    // 5. Rubber Seals
    const sealZ = depth / 2 - 0.05;
    const sealFront = createRing(rInner + 0.1, rOuter - 0.1, 0.04);
    sealFront.translate(0, 0, sealZ);
    const sealBack = createRing(rInner + 0.1, rOuter - 0.1, 0.04);
    sealBack.translate(0, 0, -sealZ);
    addComp(
      'bearing_seals', 'Nitrile Rubber Seals (2RS)', 'Contact seals retaining lubricant and excluding contaminants.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, 0.6], '#1e293b',
      sealFront, { 'Seal Type': 'Double Lip Nitrile Rubber (NBR)' }, 'PBR_MATTE'
    );
    addComp(
      'bearing_seals_rear', 'Rear Seal', 'Rear nitrile rubber seal.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, -0.6], '#1e293b',
      sealBack, { 'Seal Type': 'Double Lip Nitrile Rubber (NBR)' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }`;

const startIndex = file.indexOf('  public static generateBallBearing(params: Record<string, any>): GeneratedAssemblyPayload {');
const endIndex = file.indexOf('  public static generateHeatSink(params: Record<string, any>): GeneratedAssemblyPayload {');

if (startIndex !== -1 && endIndex !== -1) {
  const newFile = file.substring(0, startIndex) + newMethod + '\n\n' + file.substring(endIndex);
  fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', newFile);
  console.log('Bearing Replaced successfully.');
} else {
  console.log('Could not find indices.');
}

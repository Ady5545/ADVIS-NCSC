const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf-8');

const newMethod = `  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);
    const baseWheelRadius = Number(params.wheelRadius || 1.1) * scale;
    const wheelRadius = baseWheelRadius;
    const baseTireRadius = Number(params.tireRadius || baseWheelRadius * 1.15) * scale;
    
    const frontWheelRadius = Number(params.frontWheelRadius || baseWheelRadius);
    const frontTireRadius = Number(params.frontTireRadius || params.frontWheelRadius ? frontWheelRadius * 1.15 : baseTireRadius);
    
    const rearWheelRadius = Number(params.rearWheelRadius || baseWheelRadius);
    const rearTireRadius = Number(params.rearTireRadius || params.rearWheelRadius ? rearWheelRadius * 1.15 : baseTireRadius);
    
    const wheelbase = Number(params.wheelbase || 3.4) * scale;
    const frameHeight = Number(params.frameHeight || 1.8) * scale;
    const tubeRadius = 0.05 * scale;
    const handlebarWidth = Number(params.handlebarWidth || 1.4) * scale;
    const seatHeight = Number(params.seatHeight || 0.8) * scale;
    const spokeCount = Number(params.spokeCount || 32);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const rearHub: [number, number, number] = [-wheelbase / 2, 0, 0];
    const frontHub: [number, number, number] = [wheelbase / 2, 0, 0];
    const bb: [number, number, number] = [-wheelbase * 0.1, -baseWheelRadius * 0.35, 0];
    
    const seatJunction: [number, number, number] = [-wheelbase * 0.2, frameHeight * (seatHeight / 0.8 * 0.8), 0];
    const headTop: [number, number, number] = [wheelbase * 0.35, frameHeight * 0.95, 0];
    const headBottom: [number, number, number] = [wheelbase * 0.30, frameHeight * 0.45, 0];

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

    // 1. Frame Main Triangle (Top Tube, Down Tube, Seat Tube, Head Tube)
    const frameGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, headTop, tubeRadius), // Top Tube
      UniversalGeometryVocabulary.createTubeBetweenPoints(bb, headBottom, tubeRadius * 1.15), // Down Tube
      UniversalGeometryVocabulary.createTubeBetweenPoints(bb, seatJunction, tubeRadius), // Seat Tube
      UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, headTop, tubeRadius * 1.25), // Head Tube
      // Rear Triangle (Chainstays & Seatstays)
      UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], 0.12], tubeRadius * 0.8), // Left Chainstay
      UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [rearHub[0], rearHub[1], -0.12], tubeRadius * 0.8), // Right Chainstay
      UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], 0.12], tubeRadius * 0.75), // Left Seatstay
      UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [rearHub[0], rearHub[1], -0.12], tubeRadius * 0.75) // Right Seatstay
    ];
    
    addComp(
      'bicycle_frame', 'Carbon Fiber Aero Frame', 'Monocoque high-modulus carbon fiber frame with internal routing.',
      [0, 0, 0], [wheelbase, frameHeight, 0.4], [0, 0.5, 0], '#0284c7',
      UniversalGeometryVocabulary.mergeGeometries(frameGeoms),
      { 'Material': 'Carbon Fiber T1000', 'Geometry': 'Aero Road Endurance' }, 'PBR_METALLIC'
    );

    // 2. Front Wheel Assembly
    addComp(
      'bicycle_front_wheel', 'Front 700c Aero Spoked Wheel & Tire', 'Double-wall carbon aero rim with clincher tire.',
      [frontHub[0], frontHub[1], frontHub[2]], [frontTireRadius * 2, frontTireRadius * 2, 0.2], [0.8, 0, 0], '#1e293b',
      UniversalGeometryVocabulary.createSpokeWheel(frontWheelRadius, frontTireRadius, 0.08, 0.09, spokeCount),
      { 'Rim': '60mm Deep Aero Carbon', 'Spokes': 'Bladed Stainless Steel' }, 'PBR_METALLIC'
    );

    // 3. Rear Wheel Assembly
    addComp(
      'bicycle_rear_wheel', 'Rear 700c Drive Wheel', 'Rear driven wheel assembly with 12-speed cassette.',
      [rearHub[0], rearHub[1], rearHub[2]], [rearTireRadius * 2, rearTireRadius * 2, 0.25], [-0.8, 0, 0], '#1e293b',
      UniversalGeometryVocabulary.createSpokeWheel(rearWheelRadius, rearTireRadius, 0.08, 0.09, spokeCount),
      { 'Freehub': 'Titanium HyperGlide', 'Spokes': 'Bladed Stainless Steel' }, 'PBR_METALLIC'
    );

    // 4. Cassette and Drivetrain
    const cassetteGeoms = [];
    for(let i=0; i<12; i++) {
        const cGeom = new THREE.CylinderGeometry(0.08 + (11-i)*0.015, 0.08 + (11-i)*0.015, 0.01, 24);
        cGeom.rotateX(Math.PI/2);
        cGeom.translate(rearHub[0], rearHub[1], 0.08 + i*0.012);
        cassetteGeoms.push(cGeom);
    }
    addComp(
      'bicycle_cassette', '12-Speed Titanium Cassette', '10-33T Titanium/Steel hybrid cassette block.',
      [0, 0, 0], [0.3, 0.3, 0.1], [-1.0, 0, 0.3], '#94a3b8',
      UniversalGeometryVocabulary.mergeGeometries(cassetteGeoms),
      { 'Range': '10-33T 12-Speed' }, 'PBR_METALLIC'
    );

    // 5. Crankset & Chainring
    const cranksetGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.03, 32);
    cranksetGeom.rotateX(Math.PI / 2);
    cranksetGeom.translate(bb[0], bb[1], 0.1);
    const crankArmGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] - 0.6, 0.15], 0.04);
    const crankLeftGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(bb, [bb[0], bb[1] + 0.6, -0.15], 0.04);

    addComp(
      'bicycle_crankset', 'Hollow-Forged Aluminum Crankset', '52/36T semi-compact chainring with integrated power meter.',
      [0, 0, 0], [0.7, 0.7, 0.3], [0, -0.6, 0.4], '#334155',
      UniversalGeometryVocabulary.mergeGeometries([cranksetGeom, crankArmGeom, crankLeftGeom]),
      { 'Chainrings': '52/36T Aluminum', 'Crank Length': '172.5mm' }, 'PBR_METALLIC'
    );

    // 6. Chain (Simulated block loop)
    const chainPath = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [rearHub[0], rearHub[1]+0.1, 0.1], [bb[0], bb[1]+0.35, 0.1], 0.015
    );
    const chainPath2 = UniversalGeometryVocabulary.createTubeBetweenPoints(
      [rearHub[0], rearHub[1]-0.1, 0.1], [bb[0], bb[1]-0.35, 0.1], 0.015
    );
    addComp(
      'bicycle_chain', 'Flattop 12-Speed Chain', 'Hard-chrome plated hollow-pin racing chain.',
      [0, 0, 0], [wheelbase, 0.1, 0.1], [0, -0.5, 0.3], '#cbd5e1',
      UniversalGeometryVocabulary.mergeGeometries([chainPath, chainPath2]),
      { 'Link Type': 'Hollow-Pin Flattop' }, 'PBR_METALLIC'
    );

    // 7. Front Fork & Handlebars
    const forkGeoms: THREE.BufferGeometry[] = [
      UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, frontHub, tubeRadius * 0.8), // Fork Blade Left (simulated single center for now, or just generic strut)
    ];
    // Create twin blades
    const forkL = UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, [frontHub[0], frontHub[1], 0.1], tubeRadius * 0.7);
    const forkR = UniversalGeometryVocabulary.createTubeBetweenPoints(headBottom, [frontHub[0], frontHub[1], -0.1], tubeRadius * 0.7);
    
    const handlebarGeom = new THREE.CylinderGeometry(tubeRadius * 0.6, tubeRadius * 0.6, handlebarWidth, 16);
    handlebarGeom.rotateX(Math.PI / 2);
    handlebarGeom.translate(headTop[0] + 0.1, headTop[1] + 0.1, 0); // Stem extension

    const stemGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(headTop, [headTop[0] + 0.1, headTop[1] + 0.1, 0], tubeRadius * 0.8);

    addComp(
      'bicycle_steering', 'Aero Fork & Integrated Cockpit', 'Carbon bladed fork with one-piece integrated bar/stem.',
      [0, 0, 0], [0.4, 1.0, handlebarWidth], [0.6, 0.5, 0], '#020617',
      UniversalGeometryVocabulary.mergeGeometries([forkL, forkR, handlebarGeom, stemGeom]),
      { 'Steerer': 'Tapered 1-1/8" to 1-1/4"', 'Handlebar': 'Aero Carbon 400mm' }, 'PBR_MATTE'
    );

    // 8. Seatpost & Saddle
    const seatpostGeom = UniversalGeometryVocabulary.createTubeBetweenPoints(seatJunction, [seatJunction[0] - 0.1, seatJunction[1] + 0.4, 0], tubeRadius * 0.7);
    const saddleGeom = UniversalGeometryVocabulary.createRoundedBox(0.4, 0.1, 0.2, 0.05, 4);
    saddleGeom.translate(seatJunction[0] - 0.1, seatJunction[1] + 0.45, 0);

    addComp(
      'bicycle_saddle', 'Carbon Rail Saddle & Post', 'Ergonomic short-nose saddle on a D-shaped carbon seatpost.',
      [0, 0, 0], [0.5, 0.5, 0.2], [0, 0.8, 0], '#000000',
      UniversalGeometryVocabulary.mergeGeometries([seatpostGeom, saddleGeom]),
      { 'Saddle Cover': 'Microfiber', 'Rails': '7x9mm Carbon' }, 'PBR_MATTE'
    );

    // 9. Brakes (Disc Calipers)
    const frontCaliper = UniversalGeometryVocabulary.createRoundedBox(0.15, 0.1, 0.1, 0.02, 2);
    frontCaliper.translate(frontHub[0] - 0.1, frontHub[1] + 0.2, 0.08);
    const rearCaliper = UniversalGeometryVocabulary.createRoundedBox(0.15, 0.1, 0.1, 0.02, 2);
    rearCaliper.translate(rearHub[0] + 0.2, rearHub[1] + 0.1, 0.08);

    addComp(
      'bicycle_brakes', 'Hydraulic Disc Brake Calipers', 'Flat-mount hydraulic 2-piston disc brakes.',
      [0, 0, 0], [wheelbase, 0.5, 0.2], [-0.5, 0, 0.4], '#1e293b',
      UniversalGeometryVocabulary.mergeGeometries([frontCaliper, rearCaliper]),
      { 'Rotor Size': '160mm Front/Rear', 'Actuation': 'Hydraulic' }, 'PBR_METALLIC'
    );

    return { components, meshSpecs, geometries };
  }`;

const startIndex = file.indexOf('  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {');
const endIndex = file.indexOf('  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {');

if (startIndex !== -1 && endIndex !== -1) {
  const newFile = file.substring(0, startIndex) + newMethod + '\n\n' + file.substring(endIndex);
  fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newFile);
  console.log('Bicycle Replaced successfully.');
} else {
  console.log('Could not find indices.');
}

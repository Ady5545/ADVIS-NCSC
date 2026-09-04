const fs = require('fs');
let code = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

// Line 429: <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} rotation={[Math.PI/2, 0, 0]} />
// Replace with: <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} />
// and rotate the mesh instead. The mesh already has position={[0, 0.3, 0]} so we can add rotation to it.

// Wait, looking at the code:
// <mesh position={[0, 0.3, 0]}>
//   <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} rotation={[Math.PI/2, 0, 0]} />
//   <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
// </mesh>

// Actually, we can just replace `rotation={[Math.PI/2, 0, 0]}` with nothing on the geometry, and add `rotation={[Math.PI/2, 0, 0]}` to the parent mesh.

code = code.replace(
  '<mesh position={[0, 0.3, 0]}>\n        <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} rotation={[Math.PI/2, 0, 0]} />',
  '<mesh position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]}>\n        <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} />'
);

code = code.replace(
  '<mesh position={[0, 0.3, 0.2]} ref={fanRef}>\n        <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} rotation={[Math.PI/2, 0, 0]} />',
  '<mesh position={[0, 0.3, 0.2]} ref={fanRef} rotation={[Math.PI/2, 0, 0]}>\n        <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />'
);

fs.writeFileSync('src/generators/MechanicalGenerator.tsx', code);

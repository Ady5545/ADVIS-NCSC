const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const targetStart = src.indexOf('  // True 60-degree V12 block profile');
const targetEnd = src.indexOf('{/* 12 Centrifugally-Cast Ductile Iron Cylinder Liners (6 Left Bank, 6 Right Bank) */}', targetStart);

if (targetStart > -1 && targetEnd > -1) {
    const blockCode = src.substring(targetStart, targetEnd);
    
    const replacement = `  // 3-Part V12 Engine Block (Crankcase + 2 Cylinder Banks with Bores)
  const crankcaseShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.48, -0.40); // Bottom left pan rail
    shape.lineTo(0.48, -0.40);  // Bottom right pan rail
    shape.lineTo(0.53, -0.22);
    shape.lineTo(0.58, -0.04);
    shape.lineTo(0.35, 0.44);   // Right bank base
    shape.lineTo(-0.35, 0.44);  // Left bank base
    shape.lineTo(-0.58, -0.04);
    shape.lineTo(-0.53, -0.22);
    shape.lineTo(-0.48, -0.40);
    return shape;
  }, []);

  const bankShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.51, -0.26); // z start, x start (local to bank)
    shape.lineTo(1.51, -0.26);
    shape.lineTo(1.51, 0.26);
    shape.lineTo(-1.51, 0.26);
    shape.lineTo(-1.51, -0.26);
    
    // Add 6 cylinder holes
    CYLINDER_Z.forEach(z => {
       const hole = new THREE.Path();
       hole.absarc(z, 0, 0.21, 0, Math.PI * 2, true);
       shape.holes.push(hole);
    });
    return shape;
  }, []);

  const crankcaseSettings = useMemo(() => ({ depth: 3.02, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.035, bevelThickness: 0.035 }), []);
  const bankSettings = useMemo(() => ({ depth: 0.65, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 24 }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Lower Crankcase */}
      <mesh position={[0, 0, -1.51]}>
        <extrudeGeometry args={[crankcaseShape, crankcaseSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      
      {/* Left Cylinder Bank */}
      <mesh position={[0, 0.40, 0]} rotation={[0, 0, BANK_ANGLE]}>
         {/* Rotate so that depth is along local Y (bore axis), and shape is in local XZ plane */}
         <group rotation={[Math.PI / 2, 0, Math.PI / 2]}>
           <mesh position={[0, 0, 0]}>
             <extrudeGeometry args={[bankShape, bankSettings]} />
             <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
           </mesh>
         </group>
      </mesh>

      {/* Right Cylinder Bank */}
      <mesh position={[0, 0.40, 0]} rotation={[0, 0, -BANK_ANGLE]}>
         <group rotation={[Math.PI / 2, 0, Math.PI / 2]}>
           <mesh position={[0, 0, 0]}>
             <extrudeGeometry args={[bankShape, bankSettings]} />
             <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
           </mesh>
         </group>
      </mesh>

      `;

    src = src.replace(blockCode, replacement);
    fs.writeFileSync(file, src);
    console.log("Patched engine block assembly.");
} else {
    console.log("Could not find engine block assembly.");
}

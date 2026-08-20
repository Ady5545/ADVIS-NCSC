const fs = require('fs');

const file = 'src/LearnEngine/ChemistryPrimitives.tsx';
let code = fs.readFileSync(file, 'utf8');

const newBond = `export function Bond({ start, end, multiple = 1, type = 'covalent', visible = true }: { start: [number, number, number]; end: [number, number, number]; multiple?: number; type?: 'covalent' | 'ionic' | 'pi'; visible?: boolean }) {
  const vStart = new THREE.Vector3(...start);
  const vEnd = new THREE.Vector3(...end);
  const distance = vStart.distanceTo(vEnd);
  const position = vStart.clone().lerp(vEnd, 0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vEnd.clone().sub(vStart).normalize());
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  const groupRef = React.useRef<THREE.Group>(null);
  const overlapRef = React.useRef<THREE.Mesh>(null);
  const targetLengthScale = visible ? 1 : 0;
  const targetThicknessScale = visible ? 1 : 0;

  useFrame((state, delta) => {
    if (groupRef.current) {
        easing.damp3(groupRef.current.scale, [targetThicknessScale, targetLengthScale, targetThicknessScale], 0.3, delta);
    }
    if (overlapRef.current) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        overlapRef.current.scale.set(pulse, pulse, pulse);
        
        const mat = overlapRef.current.material as THREE.Material;
        easing.damp(mat, 'opacity', visible ? 0.6 : 0, 0.3, delta);
    }
  });

  if (type === 'ionic') {
    // Just show a subtle field effect between them
    return (
      <group position={position} rotation={euler}>
         <Cylinder args={[0.2, 0.2, distance - 1.5, 16]}>
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
         </Cylinder>
      </group>
    );
  }

  const offsets = multiple === 2 ? [-0.15, 0.15] : multiple === 3 ? [-0.2, 0, 0.2] : [0];
  
  return (
    <group position={position} rotation={euler}>
      {/* Dynamic orbital overlap region */}
      <mesh ref={overlapRef}>
         <sphereGeometry args={[0.3 * Math.max(1, multiple * 0.8), 32, 32]} />
         <meshBasicMaterial color="#a855f7" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      {/* Procedurally growing cylinders */}
      <group ref={groupRef} scale={[0, 0, 0]}>
          {offsets.map((offset, i) => (
            <group key={i} position={[offset, 0, 0]}>
              <Cylinder args={[0.08, 0.08, distance - 0.6, 24]}>
                <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
              </Cylinder>
              {type === 'pi' && i !== 0 && (
                <Cylinder args={[0.12, 0.12, distance - 0.6, 16]} position={[0,0,0]}>
                    <meshStandardMaterial color="#a855f7" transparent opacity={0.4} depthWrite={false} />
                </Cylinder>
              )}
            </group>
          ))}
      </group>
    </group>
  );
}`;

code = code.replace(/export function Bond[\s\S]*?(?=export function LewisStructure)/, newBond + '\n\n');
fs.writeFileSync(file, code, 'utf8');

const contFile = 'src/LearnEngine/ContinuousVisuals.tsx';
let contCode = fs.readFileSync(contFile, 'utf8');
contCode = contCode.replace(
  /<AnimGroup visible=\{showBonds\}>\s*<Bond start=\{\[0,0,0\]\} end=\{target\} multiple=\{multipleBond\} \/>\s*<\/AnimGroup>/g,
  '<Bond start={[0,0,0]} end={target} multiple={multipleBond} visible={showBonds} />'
);

// We need to also patch the ionic bond if it uses AnimGroup in ContinuousIonicVisuals, but let's check if it does.
fs.writeFileSync(contFile, contCode, 'utf8');


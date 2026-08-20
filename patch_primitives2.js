const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

const missingPrimitives = `
export function Electron({ position, color = "#fef08a", label }: { position: [number, number, number]; color?: string; label?: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {label && (
        <Html position={[0, 0.2, 0]} center zIndexRange={[100, 0]}>
           <div className="text-[9px] font-mono font-bold text-yellow-100/90 whitespace-nowrap">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function LonePair({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 16, 16]} />
        <meshPhysicalMaterial color="#34d399" transparent opacity={0.2} transmission={0.9} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* Electrons inside the lobe */}
      <Electron position={[-0.1, 0.5, 0]} />
      <Electron position={[0.1, 0.5, 0]} />
    </group>
  );
}
`;

code = code.replace('export function POrbital', missingPrimitives + '\nexport function POrbital');
fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', code, 'utf8');

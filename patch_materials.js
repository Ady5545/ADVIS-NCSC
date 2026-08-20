const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

// Update Electron
code = code.replace(
  /export function Electron\(\{ position, color = "\#fcd34d", scale = 1 \}\: \{ position\: \[number, number, number\]\; color\?\: string\; scale\?\: number \}\) \{[\s\S]*?\}\s*\}\s*export function LonePair/g,
`export function Electron({ position, color = "#e0f2fe", scale = 1, label }: { position: [number, number, number]; color?: string; scale?: number; label?: string }) {
  return (
    <group position={new THREE.Vector3(...position)} scale={[scale, scale, scale]}>
      <Sphere args={[0.04, 16, 16]}>
        <meshBasicMaterial color={color} />
      </Sphere>
      {/* Subtle glow */}
      <Sphere args={[0.08, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Sphere>
      {/* Subtle coordinate ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.12, 0.005, 16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      {label && (
         <Html position={[0.1, 0.1, 0]}>
           <div className="text-[8px] font-mono tracking-widest text-cyan-300 drop-shadow-md">{label}</div>
         </Html>
      )}
    </group>
  );
}

export function LonePair`
);

// Update Atom
// Currently uses meshStandardMaterial. Let's make it more "engineered".
// Like an inner solid core + outer wireframe or fresnel-like effect.
code = code.replace(
  /export function Atom\(\{ position, element, label, overrideColor, showReticle, reticleLabel \}\: \{ position\: \[number, number, number\]\; element\: string\; label\?\: string\; overrideColor\?\: string\; showReticle\?\: boolean\; reticleLabel\?\: string \}\) \{[\s\S]*?return \([\s\S]*?\<group position=\{new THREE\.Vector3\(\.\.\.position\)\}\>[\s\S]*?\<Sphere args=\{\[props\.size, 64, 64\]\}\>[\s\S]*?\<meshStandardMaterial color=\{overrideColor \|\| props\.color\} metalness=\{props\.metalness\} roughness=\{props\.roughness\} \/\>[\s\S]*?\<\/Sphere\>/,
`export function Atom({ position, element, label, overrideColor, showReticle, reticleLabel }: { position: [number, number, number]; element: string; label?: string; overrideColor?: string; showReticle?: boolean; reticleLabel?: string }) {
  const props = getAtomProps(element);
  return (
    <group position={new THREE.Vector3(...position)}>
      {/* Core */}
      <Sphere args={[props.size * 0.9, 32, 32]}>
        <meshPhysicalMaterial color={overrideColor || props.color} transmission={0.9} opacity={1} transparent roughness={0.1} thickness={0.5} />
      </Sphere>
      {/* Technical outer shell */}
      <Sphere args={[props.size, 32, 32]}>
        <meshBasicMaterial color={overrideColor || props.color} transparent opacity={0.15} wireframe />
      </Sphere>
      {/* Scanline equator */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[props.size + 0.02, 0.01, 16, 64]} />
        <meshBasicMaterial color={overrideColor || props.color} transparent opacity={0.5} />
      </mesh>`
);

// Update Bond
code = code.replace(
  /export function Bond\(\{ start, end, order = 1, color = "\#94a3b8" \}\: \{ start\: \[number, number, number\]\; end\: \[number, number, number\]\; order\?\: number\; color\?\: string \}\) \{[\s\S]*?return \([\s\S]*?\<group position=\{midpoint\} rotation=\{rotationEuler\}\>/,
`export function Bond({ start, end, order = 1, color = "#38bdf8" }: { start: [number, number, number]; end: [number, number, number]; order?: number; color?: string }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const midpoint = startVec.clone().lerp(endVec, 0.5);
  const length = startVec.distanceTo(endVec);
  
  // Calculate rotation to point from start to end
  const axis = new THREE.Vector3(0, 1, 0); // Cylinder defaults to Y axis
  const direction = endVec.clone().sub(startVec).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
  const rotationEuler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <group position={midpoint} rotation={rotationEuler}>`
);

code = code.replace(
  /\<Cylinder args=\{\[0\.05, 0\.05, length, 8\]\} position=\{\[offset, 0, 0\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} roughness=\{0\.3\} metalness=\{0\.5\} \/\>[\s\S]*?\<\/Cylinder\>/g,
  `<Cylinder args={[0.02, 0.02, length - 0.4, 8]} position={[offset, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </Cylinder>
        {/* Glow outer cylinder */}
        <Cylinder args={[0.04, 0.04, length - 0.4, 8]} position={[offset, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </Cylinder>`
);

// POrbital, SOrbital, HybridOrbital
// SOrbital
code = code.replace(
  /\<Sphere args=\{\[1\.2, 32, 32\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} transparent opacity=\{0\.4\} depthWrite=\{false\} roughness=\{0\.2\} \/\>[\s\S]*?\<\/Sphere\>/,
`<Sphere args={[1.2, 32, 32]}>
        <meshPhysicalMaterial color={color} transparent opacity={0.3} transmission={0.9} roughness={0.1} thickness={0.5} depthWrite={false} />
      </Sphere>
      <Sphere args={[1.22, 16, 16]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.1} depthWrite={false} />
      </Sphere>`
);

// POrbital
code = code.replace(
  /\<Sphere args=\{\[0\.8, 32, 32\]\} position=\{\[0, 0\.8, 0\]\} scale=\{\[1, 1\.5, 1\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} transparent opacity=\{0\.3\} depthWrite=\{false\} roughness=\{0\.2\} \/\>[\s\S]*?\<\/Sphere\>[\s\S]*?\<Sphere args=\{\[0\.8, 32, 32\]\} position=\{\[0, -0\.8, 0\]\} scale=\{\[1, 1\.5, 1\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} transparent opacity=\{0\.3\} depthWrite=\{false\} roughness=\{0\.2\} \/\>[\s\S]*?\<\/Sphere\>/,
`<Sphere args={[0.8, 32, 32]} position={[0, 0.8, 0]} scale={[1, 1.5, 1]}>
        <meshPhysicalMaterial color={color} transparent opacity={0.2} transmission={0.9} roughness={0.1} depthWrite={false} />
      </Sphere>
      <Sphere args={[0.82, 16, 16]} position={[0, 0.8, 0]} scale={[1, 1.5, 1]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.05} depthWrite={false} />
      </Sphere>
      <Sphere args={[0.8, 32, 32]} position={[0, -0.8, 0]} scale={[1, 1.5, 1]}>
        <meshPhysicalMaterial color={color} transparent opacity={0.2} transmission={0.9} roughness={0.1} depthWrite={false} />
      </Sphere>
      <Sphere args={[0.82, 16, 16]} position={[0, -0.8, 0]} scale={[1, 1.5, 1]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.05} depthWrite={false} />
      </Sphere>`
);

// HybridOrbital
code = code.replace(
  /\<Sphere args=\{\[0\.8, 32, 32\]\} position=\{\[0, 1, 0\]\} scale=\{\[1, 1\.8, 1\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} transparent opacity=\{0\.4\} depthWrite=\{false\} roughness=\{0\.2\} \/\>[\s\S]*?\<\/Sphere\>[\s\S]*?\<Sphere args=\{\[0\.3, 16, 16\]\} position=\{\[0, -0\.3, 0\]\} scale=\{\[1, 1\.2, 1\]\}\>[\s\S]*?\<meshStandardMaterial color=\{color\} transparent opacity=\{0\.3\} depthWrite=\{false\} roughness=\{0\.2\} \/\>[\s\S]*?\<\/Sphere\>/,
`<Sphere args={[0.8, 32, 32]} position={[0, 1, 0]} scale={[1, 1.8, 1]}>
        <meshPhysicalMaterial color={color} transparent opacity={0.3} transmission={0.9} roughness={0.1} depthWrite={false} />
      </Sphere>
      <Sphere args={[0.82, 16, 16]} position={[0, 1, 0]} scale={[1, 1.8, 1]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.1} depthWrite={false} />
      </Sphere>
      <Sphere args={[0.3, 16, 16]} position={[0, -0.3, 0]} scale={[1, 1.2, 1]}>
        <meshPhysicalMaterial color={color} transparent opacity={0.2} transmission={0.9} roughness={0.1} depthWrite={false} />
      </Sphere>`
);

fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', code, 'utf8');

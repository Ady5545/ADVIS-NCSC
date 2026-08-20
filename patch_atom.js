const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

// Replace the Atom function
const newAtom = `
export function Atom({ position, element, label, showReticle, reticleLabel }: any) {
  const { color, radius } = getAtomProps(element);
  return (
    <group position={position}>
      {/* Dense Nucleus */}
      <mesh>
         <icosahedronGeometry args={[radius * 0.2, 2]} />
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.1} metalness={0.8} />
      </mesh>
      
      {/* Inner Shell Wireframe */}
      <mesh>
         <icosahedronGeometry args={[radius * 0.6, 2]} />
         <meshBasicMaterial color={color} wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Outer Shell Glass */}
      <mesh>
         <sphereGeometry args={[radius, 32, 32]} />
         <meshPhysicalMaterial color={color} transparent opacity={0.1} roughness={0.1} transmission={0.9} thickness={0.5} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Edge Highlight Ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
         <torusGeometry args={[radius, 0.01, 16, 64]} />
         <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0, Math.PI/2, 0]}>
         <torusGeometry args={[radius, 0.01, 16, 64]} />
         <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {label && (
        <Html position={[0, radius + 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="text-xs font-mono font-bold tracking-widest px-2 py-1 bg-slate-950/80 border border-slate-700/50 rounded backdrop-blur-md text-white/90 shadow-lg">
            {label}
          </div>
        </Html>
      )}
      {showReticle && (
         <SelectionReticle radius={radius + 0.8} label={reticleLabel || label} />
      )}
    </group>
  );
}
`;

code = code.replace(/export function Atom[\s\S]*?(?=export function POrbital)/, newAtom + '\n');
fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', code, 'utf8');

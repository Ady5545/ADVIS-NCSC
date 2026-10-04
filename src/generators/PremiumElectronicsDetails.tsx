import React from 'react';
import { Box, Cylinder, RoundedBox, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// Mirrors the convention established in PremiumEngineeringDetails.tsx (mechanical models):
// one dense, hand-authored primitive assembly per board, dispatched by (objectId, componentId)
// from SpatialObjectEngine.tsx, replacing a single placeholder box with every real part a
// hobbyist would recognize on the actual board.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.3, roughness = 0.45, emissive, emissiveIntensity = 0 }: {
  state: State; color: string; metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number;
}) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.42} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.18 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.28 : 1}
      transmission={state.xrayEnabled ? 0.4 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.2}
      clearcoatRoughness={0.25}
      envMapIntensity={1.2}
      emissive={emissive ?? (state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000')}
      emissiveIntensity={emissive ? emissiveIntensity : (state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0)}
    />
  );
}

/** A DIP-N package: rectangular black body + two rows of pin legs bent down the sides. */
function DipChip({ state, width, length, height, pins, position, labelNotch = true }: {
  state: State; width: number; length: number; height: number; pins: number;
  position: [number, number, number]; labelNotch?: boolean;
}) {
  const perSide = pins / 2;
  const legSpacing = length / (perSide + 1);
  return (
    <group position={position}>
      <RoundedBox args={[width, height, length]} radius={0.006} smoothness={2}>
        <Pbr state={state} color="#1c1c1e" metalness={0.1} roughness={0.5} />
      </RoundedBox>
      {labelNotch && (
        <Cylinder args={[width * 0.1, width * 0.1, 0.004, 12]} rotation={[0, 0, Math.PI / 2]} position={[0, height / 2 + 0.001, length / 2 - legSpacing * 0.5]}>
          <Pbr state={state} color="#3a3a3c" metalness={0.2} roughness={0.6} />
        </Cylinder>
      )}
      {Array.from({ length: perSide }).map((_, i) => {
        const z = -length / 2 + legSpacing * (i + 1);
        return [1, -1].map((side) => (
          <group key={`${side}-${i}`} position={[side * width / 2, 0, z]}>
            <Box args={[0.012, height * 0.5, 0.01]} position={[side * 0.006, -height * 0.25, 0]}>
              <Pbr state={state} color="#c7cad1" metalness={0.85} roughness={0.25} />
            </Box>
            <Box args={[0.012, 0.01, 0.01]} position={[side * 0.012, -height * 0.5, 0]}>
              <Pbr state={state} color="#c7cad1" metalness={0.85} roughness={0.25} />
            </Box>
          </group>
        ));
      })}
    </group>
  );
}

function ElectrolyticCap({ state, position, r = 0.028, h = 0.05 }: { state: State; position: [number, number, number]; r?: number; h?: number }) {
  return (
    <group position={position}>
      <Cylinder args={[r, r, h, 20]}>
        <Pbr state={state} color="#1a3a6b" metalness={0.3} roughness={0.35} />
      </Cylinder>
      <Cylinder args={[r * 1.001, r * 1.001, h * 0.08, 20]} position={[0, h / 2 - h * 0.04, 0]}>
        <Pbr state={state} color="#8a94a6" metalness={0.6} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

function CeramicCap({ state, position, size = 0.03 }: { state: State; position: [number, number, number]; size?: number }) {
  return (
    <RoundedBox args={[size, size * 1.1, size * 0.5]} radius={0.004} position={position}>
      <Pbr state={state} color="#d99a3a" metalness={0.1} roughness={0.55} />
    </RoundedBox>
  );
}

function ResistorTH({ state, position, rot = 0 }: { state: State; position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <Cylinder args={[0.009, 0.009, 0.07, 14]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#e4ceab" metalness={0.05} roughness={0.5} />
      </Cylinder>
      {['#3a2a14', '#e3342f', '#3a2a14', '#c9a227'].map((c, i) => (
        <Cylinder key={i} args={[0.0095, 0.0095, 0.006, 14]} rotation={[0, 0, Math.PI / 2]} position={[-0.02 + i * 0.013, 0, 0]}>
          <Pbr state={state} color={c} metalness={0.1} roughness={0.5} />
        </Cylinder>
      ))}
    </group>
  );
}

function LED({ state, position, color }: { state: State; position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <Cylinder args={[0.011, 0.011, 0.016, 12]}>
        <Pbr state={state} color="#e8e8ec" metalness={0.05} roughness={0.2} />
      </Cylinder>
      <Sphere args={[0.011, 12, 10]} position={[0, 0.013, 0]}>
        <Pbr state={state} color={color} metalness={0.0} roughness={0.15} emissive={color} emissiveIntensity={0.9} />
      </Sphere>
    </group>
  );
}

/** A row of square female header pin sockets (black plastic shroud + exposed pin tips). */
function HeaderRow({ state, count, position, rot = 0 }: { state: State; count: number; position: [number, number, number]; rot?: number }) {
  const pitch = 0.1;
  const len = count * pitch;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <Box args={[0.09, 0.09, len]}>
        <Pbr state={state} color="#0f1117" metalness={0.1} roughness={0.5} />
      </Box>
      {Array.from({ length: count }).map((_, i) => (
        <Cylinder key={i} args={[0.007, 0.007, 0.05, 6]} position={[0, 0.07, -len / 2 + pitch * (i + 0.5)]}>
          <Pbr state={state} color="#d4d8de" metalness={0.85} roughness={0.25} />
        </Cylinder>
      ))}
    </group>
  );
}

// Each function below renders exactly ONE of arduino_uno's library components (matching
// SpatialLibrary.ts 1:1) — unlike the single-mega-block V8/inline4 pattern, every part here
// stays individually selectable and explodable, which is what makes per-component inspection
// (click a part, read its spec card, pull it away in exploded view) actually work.

function ArduinoPcb({ state }: { state: State }) {
  return (
    <RoundedBox args={[1.0, 0.045, 1.4]} radius={0.015} smoothness={3}>
      <Pbr state={state} color="#0a3d2b" metalness={0.15} roughness={0.55} />
    </RoundedBox>
  );
}

function ArduinoAtmega({ state }: { state: State }) {
  return <DipChip state={state} width={0.14} length={0.34} height={0.07} pins={28} position={[0, 0, 0]} />;
}

function ArduinoCrystal({ state }: { state: State }) {
  return (
    <Cylinder args={[0.035, 0.035, 0.05, 16]} rotation={[0, 0, Math.PI / 2]}>
      <Pbr state={state} color="#c6c9ce" metalness={0.85} roughness={0.2} />
    </Cylinder>
  );
}

function ArduinoRegulator({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.1, 0.12, 0.02]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.15} roughness={0.5} />
      </Box>
      <Box args={[0.09, 0.09, 0.006]} position={[0, 0.0, 0.013]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.8} roughness={0.2} />
      </Box>
      {[-0.028, 0, 0.028].map((x, i) => (
        <Box key={i} args={[0.01, 0.07, 0.01]} position={[x, -0.09, -0.01]}>
          <Pbr state={state} color="#c7cad1" metalness={0.85} roughness={0.25} />
        </Box>
      ))}
    </group>
  );
}

function ArduinoUsb({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.3, 0.25, 0.3]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.75} roughness={0.3} />
      </Box>
      <Box args={[0.22, 0.17, 0.05]} position={[0, 0, -0.16]}>
        <Pbr state={state} color="#2a2a2e" metalness={0.3} roughness={0.5} />
      </Box>
    </group>
  );
}

function ArduinoDcJack({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.26, 0.24, 0.3]}>
        <Pbr state={state} color="#0f172a" metalness={0.3} roughness={0.45} />
      </Box>
      <Cylinder args={[0.06, 0.06, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.2} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

function ArduinoReset({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.08, 0.04, 0.08]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.15} roughness={0.5} />
      </Box>
      <Cylinder args={[0.025, 0.025, 0.015, 16]} position={[0, 0.028, 0]}>
        <Pbr state={state} color="#e3342f" metalness={0.1} roughness={0.4} />
      </Cylinder>
    </group>
  );
}

function ArduinoLeds({ state }: { state: State }) {
  return (
    <group>
      <LED state={state} position={[-0.16, 0, 0]} color="#4ade80" />
      <LED state={state} position={[-0.08, 0, 0]} color="#fb923c" />
      <LED state={state} position={[0.0, 0, 0]} color="#fb923c" />
      <LED state={state} position={[0.16, 0, 0]} color="#ef4444" />
    </group>
  );
}

function ArduinoIcsp({ state }: { state: State }) {
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => (
        <Cylinder key={i} args={[0.006, 0.006, 0.03, 6]} position={[(i % 2) * 0.1 - 0.05, 0.015, Math.floor(i / 2) * 0.1 - 0.1]}>
          <Pbr state={state} color="#d4d8de" metalness={0.85} roughness={0.25} />
        </Cylinder>
      ))}
    </group>
  );
}

function ArduinoHeaders({ state }: { state: State }) {
  // Four header rows arranged around the board's edge: two long digital rows (top/bottom),
  // the short analog-in row and the power row, each a real female-socket block, not one slab.
  return (
    <group>
      <HeaderRow state={state} count={8} position={[0, 0, -0.5]} />
      <HeaderRow state={state} count={8} position={[0, 0, 0.5]} />
      <HeaderRow state={state} count={6} position={[0, 0, -0.1]} rot={Math.PI / 2} />
      <HeaderRow state={state} count={4} position={[0, 0, 0.15]} rot={Math.PI / 2} />
    </group>
  );
}

function ArduinoPassives({ state }: { state: State }) {
  return (
    <group>
      <ElectrolyticCap state={state} position={[-0.1, 0, 0.0]} />
      <CeramicCap state={state} position={[0.08, 0, -0.04]} />
      <CeramicCap state={state} position={[0.14, 0, -0.04]} />
      <ResistorTH state={state} position={[-0.02, -0.01, 0.06]} />
      <ResistorTH state={state} position={[0.06, -0.01, 0.06]} rot={Math.PI / 2} />
      <ResistorTH state={state} position={[0.14, -0.01, 0.06]} rot={Math.PI / 2} />
      <Torus args={[0.1, 0.003, 4, 32, Math.PI * 1.3]} rotation={[Math.PI / 2, 0, 0.4]} position={[0, -0.01, -0.06]}>
        <Pbr state={state} color="#c8750a" metalness={0.6} roughness={0.3} emissive="#c8750a" emissiveIntensity={0.1} />
      </Torus>
    </group>
  );
}

// ----------------------------- ESP32 Development Board -----------------------------------

function Esp32Pcb({ state }: { state: State }) {
  return (
    <RoundedBox args={[0.6, 0.045, 1.2]} radius={0.012} smoothness={3}>
      <Pbr state={state} color="#0e0e10" metalness={0.15} roughness={0.5} />
    </RoundedBox>
  );
}

/** The WROOM module: a small daughter PCB with a stamped-steel RF shield can on top,
 * including the characteristic vent-hole grid and castellated edge pads. */
function Esp32Module({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.44, 0.012, 0.52]} position={[0, -0.034, 0]}>
        <Pbr state={state} color="#0a3d2b" metalness={0.15} roughness={0.55} />
      </Box>
      <RoundedBox args={[0.42, 0.055, 0.5]} radius={0.004} smoothness={2}>
        <Pbr state={state} color="#9aa0a8" metalness={0.65} roughness={0.35} />
      </RoundedBox>
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <Cylinder key={`${row}-${col}`} args={[0.012, 0.012, 0.004, 8]} position={[-0.16 + col * 0.064, 0.028, -0.18 + row * 0.09]}>
            <Pbr state={state} color="#7a7f87" metalness={0.5} roughness={0.5} />
          </Cylinder>
        ))
      )}
      {/* Castellated edge pads along the front/back edges */}
      {Array.from({ length: 9 }).map((_, i) => [1, -1].map((side) => (
        <Box key={`${side}-${i}`} args={[0.02, 0.05, 0.012]} position={[-0.18 + i * 0.045, -0.005, side * 0.26]}>
          <Pbr state={state} color="#d4d8de" metalness={0.85} roughness={0.25} />
        </Box>
      )))}
    </group>
  );
}

function Esp32Usb({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.2, 0.08, 0.14]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.75} roughness={0.3} />
      </Box>
      <Box args={[0.12, 0.045, 0.02]} position={[0, 0, -0.07]}>
        <Pbr state={state} color="#2a2a2e" metalness={0.3} roughness={0.5} />
      </Box>
    </group>
  );
}

/** A small SOIC-style surface-mount chip: flat body, short gull-wing leads on two sides. */
function SoicChip({ state, width, length, color = '#1c1c1e' }: { state: State; width: number; length: number; color?: string }) {
  const pins = 6;
  return (
    <group>
      <Box args={[width, 0.018, length]}>
        <Pbr state={state} color={color} metalness={0.1} roughness={0.5} />
      </Box>
      {Array.from({ length: pins }).map((_, i) => [1, -1].map((side) => (
        <Box key={`${side}-${i}`} args={[0.012, 0.006, 0.01]} position={[side * (width / 2 + 0.006), -0.006, -length / 2 + (length / (pins - 1)) * i]}>
          <Pbr state={state} color="#c7cad1" metalness={0.85} roughness={0.25} />
        </Box>
      )))}
    </group>
  );
}

function Esp32UartChip({ state }: { state: State }) {
  return <SoicChip state={state} width={0.06} length={0.08} />;
}

function Esp32Regulator({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.045, 0.02, 0.07]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.15} roughness={0.5} />
      </Box>
      <Box args={[0.04, 0.012, 0.01]} position={[0, -0.016, -0.02]}>
        <Pbr state={state} color="#c7cad1" metalness={0.85} roughness={0.25} />
      </Box>
    </group>
  );
}

function Esp32Buttons({ state }: { state: State }) {
  return (
    <group>
      {[-0.08, 0.08].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Box args={[0.07, 0.03, 0.05]}>
            <Pbr state={state} color="#1c1c1e" metalness={0.15} roughness={0.5} />
          </Box>
          <Cylinder args={[0.016, 0.016, 0.012, 16]} position={[0, 0.02, 0]}>
            <Pbr state={state} color="#2a2a2e" metalness={0.1} roughness={0.4} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

function Esp32Led({ state }: { state: State }) {
  return <LED state={state} position={[0, 0, 0]} color="#4ade80" />;
}

function Esp32Headers({ state }: { state: State }) {
  return (
    <group>
      <HeaderRow state={state} count={19} position={[0, 0, 0]} rot={Math.PI / 2} />
    </group>
  );
}

function Esp32Passives({ state }: { state: State }) {
  return (
    <group>
      <CeramicCap state={state} position={[-0.08, 0, 0]} />
      <CeramicCap state={state} position={[-0.02, 0, 0]} />
      <ResistorTH state={state} position={[0.08, -0.01, 0]} rot={Math.PI / 2} />
      <ResistorTH state={state} position={[0.14, -0.01, 0]} rot={Math.PI / 2} />
    </group>
  );
}

export function renderPremiumElectronicsWholeModel(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId === 'arduino_uno') {
    switch (componentId) {
      case 'uno_pcb': return <ArduinoPcb state={state} />;
      case 'uno_atmega': return <ArduinoAtmega state={state} />;
      case 'uno_crystal': return <ArduinoCrystal state={state} />;
      case 'uno_regulator': return <ArduinoRegulator state={state} />;
      case 'uno_usb': return <ArduinoUsb state={state} />;
      case 'uno_dc': return <ArduinoDcJack state={state} />;
      case 'uno_reset': return <ArduinoReset state={state} />;
      case 'uno_leds': return <ArduinoLeds state={state} />;
      case 'uno_icsp': return <ArduinoIcsp state={state} />;
      case 'uno_headers': return <ArduinoHeaders state={state} />;
      case 'uno_passives': return <ArduinoPassives state={state} />;
      default: return null;
    }
  }
  if (objectId === 'esp32') {
    switch (componentId) {
      case 'esp32_pcb': return <Esp32Pcb state={state} />;
      case 'esp32_module': return <Esp32Module state={state} />;
      case 'esp32_usb': return <Esp32Usb state={state} />;
      case 'esp32_uart_chip': return <Esp32UartChip state={state} />;
      case 'esp32_regulator': return <Esp32Regulator state={state} />;
      case 'esp32_buttons': return <Esp32Buttons state={state} />;
      case 'esp32_led': return <Esp32Led state={state} />;
      case 'esp32_headers': return <Esp32Headers state={state} />;
      case 'esp32_passives': return <Esp32Passives state={state} />;
      default: return null;
    }
  }
  return null;
}

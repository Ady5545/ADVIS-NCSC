import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CYLINDER_Z } from './MechanicalGenerator';
import { useEngineTelemetry, V12_CYLINDER_OFFSETS, V12_BANK_MAP } from '../scientific/EngineKinematicsBus';

interface V12VisualOverlaysProps {
  chargeFlowEnabled: boolean;
  vectorsEnabled: boolean;
  focusedCylinder?: number;
}

export function V12VisualOverlays({
  chargeFlowEnabled,
  vectorsEnabled,
  focusedCylinder = 1
}: V12VisualOverlaysProps) {
  const telemetry = useEngineTelemetry();
  const flameGroupRef = useRef<THREE.Group>(null);
  const arrowsGroupRef = useRef<THREE.Group>(null);

  // Geometry calculation for cylinder locations in model space
  // Bank 1 (Left, +30° tilt): cylinders 1 to 6 along Z axis (-1.8 to +1.8)
  // Bank 2 (Right, -30° tilt): cylinders 7 to 12 along Z axis (-1.8 to +1.8)
  const cylinderLocations = React.useMemo(() => {
    const locs: Record<number, { pos: [number, number, number]; rot: [number, number, number]; bank: 'L' | 'R' }> = {};
    const bankAngle = (30 * Math.PI) / 180;

    for (let c = 1; c <= 12; c++) {
      const isBank1 = c <= 6;
      const indexInBank = isBank1 ? (c - 1) : (c - 7);
      const zPos = CYLINDER_Z[indexInBank] + (isBank1 ? -0.05 : 0.05);
      // Point just above the piston crown, along the tilted bore axis (matches V12UltimateCutaway)
      const axisY = 0.95;
      const xPos = (isBank1 ? -1 : 1) * Math.sin(bankAngle) * axisY;
      const yPos = Math.cos(bankAngle) * axisY;
      locs[c] = { pos: [xPos, yPos, zPos], rot: [0, 0, isBank1 ? bankAngle : -bankAngle], bank: isBank1 ? 'L' : 'R' };
    }
    return locs;
  }, []);

  return (
    <group name="v12_visual_overlays" rotation={[0.13, -1.02, 0.04]} position={[0, -0.35, 0]}>
      {/* 1. CHARGE FLOW & COMBUSTION FLAME OVERLAYS */}
      {chargeFlowEnabled && (
        <group ref={flameGroupRef}>
          {/* Intake Airflow Streamlines entering dual carbon plenums in valley */}
          <group position={[0, 1.58, 0]}>
            {[-1.2, -0.6, 0.0, 0.6, 1.2].map((z, idx) => (
              <mesh key={`streamline-l-${idx}`} position={[-0.32, 0, z]} rotation={[0, 0, 0.3]}>
                <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
              </mesh>
            ))}
            {[-1.2, -0.6, 0.0, 0.6, 1.2].map((z, idx) => (
              <mesh key={`streamline-r-${idx}`} position={[0.32, 0, z]} rotation={[0, 0, -0.3]}>
                <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
              </mesh>
            ))}
          </group>

          {/* Combustion Chamber Flame Flares */}
          {telemetry.cylinders.map((cyl) => {
            const loc = cylinderLocations[cyl.cylinderIndex];
            if (!loc) return null;

            const isFiring = cyl.isFiring;
            const isPowerStroke = cyl.stroke === 'POWER';
            const flameIntensity = isFiring ? 1.0 : isPowerStroke ? 0.4 : 0.0;

            if (flameIntensity <= 0.01) return null;

            return (
              <group key={`flame-${cyl.cylinderIndex}`} position={loc.pos} rotation={loc.rot}>
                {/* Internal combustion sphere */}
                <mesh position={[0, 0.1, 0]}>
                  <sphereGeometry args={[0.18 * flameIntensity, 16, 16]} />
                  <meshBasicMaterial
                    color={isFiring ? '#f59e0b' : '#ef4444'}
                    transparent
                    opacity={0.85 * flameIntensity}
                  />
                </mesh>
                {/* Glow ring */}
                <pointLight
                  color="#f59e0b"
                  intensity={isFiring ? 2.5 : 0.8}
                  distance={1.5}
                  decay={2}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* 2. KINEMATIC FORCE & TORQUE ARROWS */}
      {vectorsEnabled && (
        <group ref={arrowsGroupRef}>
          {/* Active Piston Gas Pressure & Thrust Force Vector */}
          {telemetry.cylinders.map((cyl) => {
            const loc = cylinderLocations[cyl.cylinderIndex];
            if (!loc || cyl.cylinderPressureBar < 5.0) return null;

            const arrowLength = Math.min(1.2, (cyl.cylinderPressureBar / 75) * 1.2);

            return (
              <group key={`vector-piston-${cyl.cylinderIndex}`} position={loc.pos} rotation={loc.rot}>
                {/* Downward force vector arrow towards crankshaft */}
                <mesh position={[0, -arrowLength / 2, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, arrowLength, 8]} />
                  <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
                </mesh>
                <mesh position={[0, -arrowLength, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.05, 0.12, 12]} />
                  <meshBasicMaterial color="#ef4444" transparent opacity={0.95} />
                </mesh>
              </group>
            );
          })}

          {/* Crankshaft Net Output Torque Tangential Vector Arrow */}
          <group position={[0, -0.65, 1.7]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.35, 0.02, 8, 32, Math.PI * 1.2]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0.35, 0, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.15, 12]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.95} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

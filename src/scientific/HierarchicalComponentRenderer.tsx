import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScientificComponent, ComponentGeometry, KinematicBinding } from './ScientificSchema';
import { ScientificGeometryRegistry } from './ScientificGeometryRegistry';

interface HierarchicalComponentRendererProps {
  component: ScientificComponent;
  allComponents: Record<string, ScientificComponent>;
  explosionFactor: number;
  selectedComponentId: string | null;
  highlightedDriverIds: Set<string>;
  highlightedDrivenIds: Set<string>;
  isolatedSubsystemId: string | null;
  hiddenComponentIds: Set<string>;
  onSelectComponent: (id: string) => void;
  simulationVariables: Record<string, number>;
}

export function HierarchicalComponentRenderer({
  component,
  allComponents,
  explosionFactor,
  selectedComponentId,
  highlightedDriverIds,
  highlightedDrivenIds,
  isolatedSubsystemId,
  hiddenComponentIds,
  onSelectComponent,
  simulationVariables
}: HierarchicalComponentRendererProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Hidden check
  const isExplicitlyHidden = hiddenComponentIds.has(component.id);
  const isSubsystemIsolated = isolatedSubsystemId !== null && component.subsystemId !== isolatedSubsystemId;

  // Highlight state
  const isSelected = selectedComponentId === component.id;
  const isDriver = highlightedDriverIds.has(component.id);
  const isDriven = highlightedDrivenIds.has(component.id);

  // Geometry & Material
  const { geometry: compGeom } = component;
  const baseTransform = compGeom.transform;

  // Frame update for kinematic bindings
  useFrame(() => {
    if (!groupRef.current) return;

    // 1. Calculate base position + exploded offset
    const exOff = compGeom.explodedOffset || [0, 0, 0];
    const curX = baseTransform.position[0] + exOff[0] * explosionFactor;
    const curY = baseTransform.position[1] + exOff[1] * explosionFactor;
    const curZ = baseTransform.position[2] + exOff[2] * explosionFactor;

    // 2. Apply kinematic bindings if present
    const kb = component.kinematicBinding;
    let kinOffsetX = 0;
    let kinOffsetY = 0;
    let kinOffsetZ = 0;
    let kinRotX = baseTransform.rotation[0];
    let kinRotY = baseTransform.rotation[1];
    let kinRotZ = baseTransform.rotation[2];

    if (kb) {
      const varVal = simulationVariables[kb.driverVariable] ?? 0;
      const mult = kb.multiplier ?? 1.0;

      switch (kb.type) {
        case 'ROTATION_X':
          kinRotX += (varVal * Math.PI / 180) * mult;
          break;
        case 'ROTATION_Y':
          kinRotY += (varVal * Math.PI / 180) * mult;
          break;
        case 'ROTATION_Z':
          kinRotZ += (varVal * Math.PI / 180) * mult;
          break;
        case 'TRANSLATION_Y':
          // For piston or valve linear stroke
          kinOffsetY += varVal * mult;
          break;
        case 'CONROD_ANGLE_Z':
          kinRotZ += varVal * mult;
          break;
        case 'CUSTOM_EXPRESSION':
          if (kb.customCompute) {
            kinOffsetY += kb.customCompute(varVal, simulationVariables);
          }
          break;
      }
    }

    groupRef.current.position.set(curX + kinOffsetX, curY + kinOffsetY, curZ + kinOffsetZ);
    groupRef.current.rotation.set(kinRotX, kinRotY, kinRotZ);
  });

  // Calculate material appearance
  const materialProps = useMemo(() => {
    const base = compGeom.material;
    let color = base.color || '#94a3b8';
    let emissive = base.emissive || '#000000';
    let emissiveIntensity = base.emissiveIntensity || 0;
    let opacity = base.opacity !== undefined ? base.opacity : 1.0;
    let transparent = base.transparent || opacity < 1.0;

    if (isSelected) {
      color = '#38bdf8'; // Electric cyan
      emissive = '#0284c7';
      emissiveIntensity = 0.6;
      opacity = 1.0;
      transparent = false;
    } else if (isDriver) {
      color = '#10b981'; // Emerald driver highlight
      emissive = '#059669';
      emissiveIntensity = 0.45;
    } else if (isDriven) {
      color = '#06b6d4'; // Cyan driven highlight
      emissive = '#0891b2';
      emissiveIntensity = 0.45;
    } else if (isSubsystemIsolated) {
      opacity = 0.08;
      transparent = true;
    }

    return {
      color,
      emissive,
      emissiveIntensity,
      metalness: base.metalness ?? 0.8,
      roughness: base.roughness ?? 0.3,
      opacity,
      transparent,
      wireframe: base.wireframe ?? false
    };
  }, [compGeom.material, isSelected, isDriver, isDriven, isSubsystemIsolated]);

  if (isExplicitlyHidden) {
    return null;
  }

  // Render 3D geometric mesh representation via domain-agnostic ScientificGeometryRegistry
  const renderMesh = () => {
    const generator = ScientificGeometryRegistry.getGeometry(compGeom.type);
    if (generator) {
      return generator({
        params: compGeom.params || {},
        materialProps,
        simulationVariables
      });
    }

    // Default fallback geometry
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    );
  };

  return (
    <group
      ref={groupRef}
      name={`scientific-comp-${component.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(component.id);
      }}
    >
      {renderMesh()}

      {/* Render child components recursively */}
      {component.childrenIds.map(childId => {
        const childComp = allComponents[childId];
        if (!childComp) return null;
        return (
          <HierarchicalComponentRenderer
            key={childId}
            component={childComp}
            allComponents={allComponents}
            explosionFactor={explosionFactor}
            selectedComponentId={selectedComponentId}
            highlightedDriverIds={highlightedDriverIds}
            highlightedDrivenIds={highlightedDrivenIds}
            isolatedSubsystemId={isolatedSubsystemId}
            hiddenComponentIds={hiddenComponentIds}
            onSelectComponent={onSelectComponent}
            simulationVariables={simulationVariables}
          />
        );
      })}
    </group>
  );
}

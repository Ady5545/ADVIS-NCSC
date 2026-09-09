import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ScientificSystemModel } from './ScientificSchema';
import { HierarchicalComponentRenderer } from './HierarchicalComponentRenderer';
import { useScientificStore } from './ScientificStore';

interface ScientificSystemSceneProps {
  model: ScientificSystemModel;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  hoveredComponentId?: string | null;
  isExploded?: boolean;
  explodedFactor?: number;
  showLabels?: boolean;
  v12Rpm?: number;
  isKinematicPlaying?: boolean;
  isolatedComponentId?: string | null;
  highlightedComponentId?: string | null;
}

export function ScientificSystemScene({
  model,
  selectedComponentId,
  onSelectComponent,
  isExploded,
  explodedFactor = 0,
  showLabels = true,
  v12Rpm,
  isKinematicPlaying = true,
  isolatedComponentId,
  highlightedComponentId
}: ScientificSystemSceneProps) {
  const {
    activeModelId,
    setActiveModel,
    simulation,
    graph,
    simulationVariables,
    isolatedSubsystemId,
    setRpm,
    explosionFactor: storeExplode
  } = useScientificStore();

  // Ensure model is set in store
  useEffect(() => {
    if (activeModelId !== model.id) {
      setActiveModel(model.id);
    }
  }, [model.id, activeModelId, setActiveModel]);

  // Synchronize RPM if passed externally
  useEffect(() => {
    if (v12Rpm !== undefined && simulation) {
      setRpm(v12Rpm);
    }
  }, [v12Rpm, simulation, setRpm]);

  // Synchronize Play/Pause
  useEffect(() => {
    if (simulation) {
      if (isKinematicPlaying && !simulation.getIsRunning()) {
        simulation.start();
      } else if (!isKinematicPlaying && simulation.getIsRunning()) {
        simulation.pause();
      }
    }
  }, [isKinematicPlaying, simulation]);

  // Effective explosion factor: honor isExploded and explodedFactor or store
  const effectiveExplosionFactor = isExploded ? Math.max(0.65, explodedFactor || storeExplode) : explodedFactor || storeExplode;

  // Connected drivers and driven components
  const { driverIds, drivenIds } = useMemo(() => {
    if (!selectedComponentId || !graph) {
      return { driverIds: new Set<string>(), drivenIds: new Set<string>() };
    }
    const rels = graph.getDirectRelationships(selectedComponentId);
    return {
      driverIds: new Set(rels.drivers.map(d => d.component.id)),
      drivenIds: new Set(rels.driven.map(d => d.component.id))
    };
  }, [selectedComponentId, graph]);

  // Root components
  const rootComponents = useMemo(() => {
    if (!model || !model.components) return [];
    return Object.values(model.components).filter(c => c && c.parentId === null);
  }, [model]);

  if (!model || !model.components) {
    return null;
  }

  return (
    <group position={[0, 0, 0]}>
      {rootComponents.map(comp => (
        <HierarchicalComponentRenderer
          key={comp.id}
          component={comp}
          allComponents={model.components}
          explosionFactor={effectiveExplosionFactor}
          selectedComponentId={selectedComponentId || highlightedComponentId || null}
          highlightedDriverIds={driverIds}
          highlightedDrivenIds={drivenIds}
          isolatedSubsystemId={isolatedSubsystemId}
          hiddenComponentIds={new Set(isolatedComponentId && model.components ? Object.keys(model.components).filter(k => k !== isolatedComponentId) : [])}
          onSelectComponent={(id) => onSelectComponent(id)}
          simulationVariables={simulationVariables}
        />
      ))}

      {/* Floating 3D label for the actively selected component */}
      {selectedComponentId && model.components[selectedComponentId] && showLabels && (
        <group
          position={[
            model.components[selectedComponentId].geometry.transform.position[0],
            model.components[selectedComponentId].geometry.transform.position[1] + 0.6,
            model.components[selectedComponentId].geometry.transform.position[2]
          ]}
        >
          <Html center distanceFactor={8} className="pointer-events-none select-none">
            <div className="flex flex-col items-center bg-slate-900/95 border border-cyan-400/80 px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap animate-fade-in">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                {model.components[selectedComponentId].name}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {model.components[selectedComponentId].scientificName}
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

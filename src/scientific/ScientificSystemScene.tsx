import React, { useEffect, useMemo, useState } from 'react';
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

  const isHumanAnatomy = model.id === 'human_anatomy_scientific';
  const [anatomyView, setAnatomyView] = useState<'body' | 'muscles' | 'skeleton' | 'organs'>('body');

  // Ensure model is set in store
  useEffect(() => {
    if (activeModelId !== model.id) {
      setActiveModel(model.id);
    }
    setAnatomyView('body');
  }, [model.id, activeModelId, setActiveModel]);

  const anatomyModeOptions = [
    { id: 'body' as const, label: 'BODY', detail: 'External anatomy' },
    { id: 'muscles' as const, label: 'MUSCLES', detail: 'Muscular system' },
    { id: 'skeleton' as const, label: 'SKELETON', detail: 'Bones + joints' },
    { id: 'organs' as const, label: 'ORGANS', detail: 'Internal systems' },
  ];

  const hiddenComponentIds = useMemo(() => {
    const hidden = new Set<string>();
    if (!isHumanAnatomy && !isolatedComponentId) return hidden;

    Object.keys(model.components).forEach((id) => {
      if (isHumanAnatomy) {
        const visibleInMode = anatomyView === 'body'
          ? id.startsWith('body_')
          : anatomyView === 'muscles'
            ? id.startsWith('muscle_')
            : anatomyView === 'skeleton'
              ? id.startsWith('bone_') || id.startsWith('joint_')
              : !id.startsWith('body_') && !id.startsWith('muscle_') && !id.startsWith('bone_') && !id.startsWith('joint_');
        if (!visibleInMode) hidden.add(id);
      }
      if (isolatedComponentId && id !== isolatedComponentId) hidden.add(id);
    });
    return hidden;
  }, [model.components, isHumanAnatomy, anatomyView, isolatedComponentId]);

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
  const effectiveExplosionFactor = isHumanAnatomy && anatomyView !== 'organs'
    ? 0
    : isExploded ? Math.max(0.65, explodedFactor || storeExplode) : explodedFactor || storeExplode;

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
      {isHumanAnatomy && (
        <Html fullscreen zIndexRange={[500, 0]}>
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              width: 'min(560px, calc(100vw - 28px))',
            }}
          >
            <div
              role="group"
              aria-label="Human anatomy view"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '5px',
                flexWrap: 'wrap',
                padding: '7px',
                borderRadius: '15px',
                border: '1px solid rgba(148,163,184,0.28)',
                background: 'rgba(8,15,25,0.90)',
                boxShadow: '0 12px 38px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(16px)',
                pointerEvents: 'auto',
              }}
            >
              {anatomyModeOptions.map((option) => {
                const active = anatomyView === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    title={option.detail}
                    onClick={() => {
                      setAnatomyView(option.id);
                      onSelectComponent(null);
                    }}
                    style={{
                      minHeight: '34px',
                      padding: '7px 13px',
                      borderRadius: '10px',
                      border: active ? '1px solid rgba(244,63,94,0.8)' : '1px solid transparent',
                      background: active ? 'linear-gradient(135deg, rgba(190,24,93,0.34), rgba(127,29,29,0.25))' : 'rgba(255,255,255,0.045)',
                      color: active ? '#ffe4e6' : '#cbd5e1',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.11em',
                      cursor: 'pointer',
                      boxShadow: active ? 'inset 0 0 0 1px rgba(251,113,133,0.12)' : 'none',
                      transition: 'all 160ms ease',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '6px', textAlign: 'center', color: 'rgba(203,213,225,0.72)', fontSize: '10px', letterSpacing: '0.04em', textShadow: '0 1px 8px rgba(0,0,0,0.75)' }}>
              Select any structure in the model to inspect its anatomy
            </div>
          </div>
        </Html>
      )}
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
          hiddenComponentIds={hiddenComponentIds}
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

import { create } from 'zustand';
import { ScientificSystemModel, CyclePhase } from './ScientificSchema';
import { SimulationEngine } from './SimulationEngine';
import { RelationshipGraph } from './RelationshipGraph';
import { ScientificModelRegistry } from './ScientificModelRegistry';

interface ScientificState {
  activeModelId: string | null;
  activeModel: ScientificSystemModel | null;
  simulation: SimulationEngine | null;
  graph: RelationshipGraph | null;
  simulationVariables: Record<string, number>;
  parameters: Record<string, number>;
  currentCyclePhase: CyclePhase | undefined;
  selectedComponentId: string | null;
  isolatedSubsystemId: string | null;
  explosionFactor: number;
  simulationRunning: boolean;
  simulationSpeed: number;

  // Domain-agnostic generic parameter management
  setParameter: (key: string, value: number) => void;
  getParameter: (key: string) => number | undefined;

  // Compatibility convenience facades
  rpm: number;
  setRpm: (rpm: number) => void;

  // Actions
  setActiveModel: (modelId: string | null) => void;
  setSelectedComponentId: (id: string | null) => void;
  setIsolatedSubsystemId: (subId: string | null) => void;
  setExplosionFactor: (factor: number) => void;
  setSimulationSpeed: (speed: number) => void;
  toggleSimulation: () => void;
  scrubAngle: (angle: number) => void;
  updateVariables: (vars: Record<string, number>, phase?: CyclePhase) => void;
}

export const useScientificStore = create<ScientificState>((set, get) => ({
  activeModelId: null,
  activeModel: null,
  simulation: null,
  graph: null,
  simulationVariables: {},
  parameters: {},
  currentCyclePhase: undefined,
  selectedComponentId: null,
  isolatedSubsystemId: null,
  explosionFactor: 0.0,
  simulationRunning: true,
  simulationSpeed: 1.0,
  rpm: 1800,

  setActiveModel: (modelId: string | null) => {
    if (!modelId) {
      set({
        activeModelId: null,
        activeModel: null,
        simulation: null,
        graph: null,
        simulationVariables: {},
        parameters: {},
        currentCyclePhase: undefined
      });
      return;
    }

    const model = ScientificModelRegistry.getModel(modelId);
    if (!model) return;

    const sim = new SimulationEngine(model);
    const graph = new RelationshipGraph(model);

    // Initial variables and parameters
    const vars = sim.getVariables();
    const params = sim.getParameters();
    const phase = sim.getCurrentCyclePhase();

    set({
      activeModelId: model.id,
      activeModel: model,
      simulation: sim,
      graph: graph,
      simulationVariables: vars,
      parameters: params,
      currentCyclePhase: phase,
      selectedComponentId: null,
      isolatedSubsystemId: null,
      simulationRunning: sim.getIsRunning(),
      rpm: params['rpm'] ?? 1800
    });

    // Subscribe to state updates
    sim.subscribe((newVars, newPhase) => {
      set({
        simulationVariables: newVars,
        currentCyclePhase: newPhase
      });
    });
  },

  setParameter: (key: string, value: number) => {
    const { simulation, parameters } = get();
    if (simulation) {
      simulation.setParameter(key, value);
    }
    const updated = { ...parameters, [key]: value };
    set({
      parameters: updated,
      ...(key === 'rpm' ? { rpm: value } : {})
    });
  },

  getParameter: (key: string) => {
    const { simulation, parameters } = get();
    if (simulation) {
      return simulation.getParameter(key);
    }
    return parameters[key];
  },

  setRpm: (rpm: number) => {
    get().setParameter('rpm', rpm);
  },

  setSelectedComponentId: (id: string | null) => set({ selectedComponentId: id }),
  setIsolatedSubsystemId: (subId: string | null) => set({ isolatedSubsystemId: subId }),
  setExplosionFactor: (factor: number) => set({ explosionFactor: factor }),

  setSimulationSpeed: (speed: number) => {
    const { simulation } = get();
    if (simulation) {
      simulation.setSpeedMultiplier(speed);
    }
    set({ simulationSpeed: speed });
  },

  toggleSimulation: () => {
    const { simulation } = get();
    if (simulation) {
      simulation.togglePlay();
      set({ simulationRunning: simulation.getIsRunning() });
    }
  },

  scrubAngle: (angle: number) => {
    const { simulation } = get();
    if (simulation) {
      simulation.scrubToAngle(angle);
    }
  },

  updateVariables: (vars: Record<string, number>, phase?: CyclePhase) => {
    set({
      simulationVariables: vars,
      currentCyclePhase: phase
    });
  }
}));

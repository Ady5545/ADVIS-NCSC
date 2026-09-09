import { ScientificSystemModel } from './ScientificSchema';
import { SimulationEngine } from './SimulationEngine';
import { RelationshipGraph } from './RelationshipGraph';

export type ScientificActionType =
  | 'SELECT_COMPONENT'
  | 'ISOLATE_SUBSYSTEM'
  | 'RESET_ISOLATION'
  | 'SET_PARAMETER'
  | 'EXPLODE'
  | 'ASSEMBLE'
  | 'START_SIMULATION'
  | 'PAUSE_SIMULATION'
  | 'SCRUB_CYCLE'
  | 'EXPLAIN_RELATIONSHIP';

export interface ScientificAction {
  type: ScientificActionType;
  targetId?: string;
  subsystemId?: string;
  parameter?: string;
  value?: number;
  factor?: number;
  fromId?: string;
  toId?: string;
  description?: string;
}

export class ScientificActionRouter {
  private model: ScientificSystemModel;
  private simulation: SimulationEngine;
  private graph: RelationshipGraph;

  // External state callbacks
  private onSelectComponent?: (id: string | null) => void;
  private onIsolateSubsystem?: (id: string | null) => void;
  private onSetExplosion?: (factor: number) => void;

  constructor(
    model: ScientificSystemModel,
    simulation: SimulationEngine,
    graph: RelationshipGraph,
    callbacks?: {
      onSelectComponent?: (id: string | null) => void;
      onIsolateSubsystem?: (id: string | null) => void;
      onSetExplosion?: (factor: number) => void;
    }
  ) {
    this.model = model;
    this.simulation = simulation;
    this.graph = graph;
    if (callbacks) {
      this.onSelectComponent = callbacks.onSelectComponent;
      this.onIsolateSubsystem = callbacks.onIsolateSubsystem;
      this.onSetExplosion = callbacks.onSetExplosion;
    }
  }

  public setModel(model: ScientificSystemModel, simulation: SimulationEngine, graph: RelationshipGraph) {
    this.model = model;
    this.simulation = simulation;
    this.graph = graph;
  }

  /**
   * Execute a structured scientific action
   */
  public executeAction(action: ScientificAction): { success: boolean; feedback: string } {
    switch (action.type) {
      case 'SELECT_COMPONENT': {
        if (!action.targetId) return { success: false, feedback: 'No target component ID provided.' };
        const comp = this.model.components[action.targetId];
        if (comp) {
          this.onSelectComponent?.(comp.id);
          return {
            success: true,
            feedback: `Selected ${comp.name} (${comp.scientificName}). ${comp.education.function}`
          };
        }
        return { success: false, feedback: `Component ${action.targetId} not found in model.` };
      }

      case 'ISOLATE_SUBSYSTEM': {
        if (!action.subsystemId) return { success: false, feedback: 'No subsystem ID provided.' };
        const sub = this.model.subsystems.find(s => s.id === action.subsystemId);
        if (sub) {
          this.onIsolateSubsystem?.(sub.id);
          return {
            success: true,
            feedback: `Isolated ${sub.name}. ${sub.description}`
          };
        }
        return { success: false, feedback: `Subsystem ${action.subsystemId} not found.` };
      }

      case 'RESET_ISOLATION': {
        this.onIsolateSubsystem?.(null);
        return { success: true, feedback: 'Reset system isolation; displaying all assemblies.' };
      }

      case 'SET_PARAMETER': {
        if (!action.parameter || action.value === undefined) {
          return { success: false, feedback: 'Parameter or value missing.' };
        }
        this.simulation.setParameter(action.parameter, action.value);
        return {
          success: true,
          feedback: `Set simulation parameter ${action.parameter} to ${action.value}.`
        };
      }

      case 'EXPLODE': {
        const factor = action.factor ?? 0.85;
        this.onSetExplosion?.(factor);
        return {
          success: true,
          feedback: `Expanded model into exploded assembly view (${Math.round(factor * 100)}%).`
        };
      }

      case 'ASSEMBLE': {
        this.onSetExplosion?.(0.0);
        return {
          success: true,
          feedback: 'Reassembled components into canonical working datum.'
        };
      }

      case 'START_SIMULATION': {
        this.simulation.start();
        return { success: true, feedback: 'Simulation engine active; running dynamic cycle.' };
      }

      case 'PAUSE_SIMULATION': {
        this.simulation.pause();
        return { success: true, feedback: 'Simulation engine paused at current cycle phase.' };
      }

      case 'SCRUB_CYCLE': {
        if (action.value !== undefined) {
          this.simulation.scrubToAngle(action.value);
          return { success: true, feedback: `Scrubbed cycle position to ${action.value.toFixed(1)}°.` };
        }
        return { success: false, feedback: 'No cycle value provided.' };
      }

      case 'EXPLAIN_RELATIONSHIP': {
        if (action.fromId && action.toId) {
          const explanation = this.graph.explainRelationship(action.fromId, action.toId);
          return { success: true, feedback: explanation };
        }
        return { success: false, feedback: 'Source and target entities required to explain relationship.' };
      }

      default:
        return { success: false, feedback: 'Unknown action type.' };
    }
  }

  /**
   * Fast natural-language intent matcher for direct local processing,
   * dynamically querying the active ScientificSystemModel.
   */
  public parseNaturalLanguage(text: string): ScientificAction | null {
    const q = text.toLowerCase().trim();

    // 1. Explode / Disassemble
    if (q.includes('explode') || q.includes('disassemble') || q.includes('blow up') || q.includes('spread out')) {
      return { type: 'EXPLODE', factor: 0.85 };
    }
    if (q.includes('assemble') || q.includes('put back') || q.includes('reset view') || q.includes('together')) {
      return { type: 'ASSEMBLE' };
    }

    // 2. Playback
    if (q.includes('start cycle') || q.includes('run simulation') || q.includes('start simulation') || q.includes('play')) {
      return { type: 'START_SIMULATION' };
    }
    if (q.includes('pause') || q.includes('freeze') || q.includes('stop')) {
      return { type: 'PAUSE_SIMULATION' };
    }

    // 3. Dynamic Simulation Parameter matching
    const simParams = this.model.simulation.parameters || {};
    for (const paramKey of Object.keys(simParams)) {
      const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${paramKey})`, 'i');
      const match = q.match(regex);
      if (match) {
        return {
          type: 'SET_PARAMETER',
          parameter: paramKey,
          value: parseFloat(match[1])
        };
      }
    }

    // Dedicated RPM parsing if applicable
    const rpmMatch = q.match(/(\d+)\s*(?:rpm|revolutions)/i);
    if (rpmMatch) {
      return {
        type: 'SET_PARAMETER',
        parameter: 'rpm',
        value: parseInt(rpmMatch[1], 10)
      };
    }
    if (q.includes('faster') || q.includes('speed up') || q.includes('increase rpm')) {
      const current = this.simulation.getParameter('rpm') || 1800;
      return {
        type: 'SET_PARAMETER',
        parameter: 'rpm',
        value: Math.min(7500, current + 1000)
      };
    }
    if (q.includes('slower') || q.includes('slow down') || q.includes('decrease rpm')) {
      const current = this.simulation.getParameter('rpm') || 1800;
      return {
        type: 'SET_PARAMETER',
        parameter: 'rpm',
        value: Math.max(500, current - 1000)
      };
    }

    // 4. Subsystem isolation (Dynamic)
    if (q.includes('show all') || q.includes('reset isolation') || q.includes('unhide')) {
      return { type: 'RESET_ISOLATION' };
    }

    if (this.model.subsystems && this.model.subsystems.length > 0) {
      for (const sub of this.model.subsystems) {
        const subName = sub.name.toLowerCase();
        const subId = sub.id.toLowerCase().replace(/_/g, ' ');
        if (q.includes(subName) || q.includes(subId)) {
          return { type: 'ISOLATE_SUBSYSTEM', subsystemId: sub.id };
        }
      }
    }

    // 5. Dynamic Relationship explanation
    if (q.includes('how') && (q.includes('connect') || q.includes('move') || q.includes('drive') || q.includes('relate') || q.includes('work with'))) {
      const matchedComps: string[] = [];
      for (const comp of Object.values(this.model.components)) {
        if (q.includes(comp.name.toLowerCase()) || q.includes(comp.id.toLowerCase())) {
          matchedComps.push(comp.id);
        }
      }
      if (matchedComps.length >= 2) {
        return {
          type: 'EXPLAIN_RELATIONSHIP',
          fromId: matchedComps[0],
          toId: matchedComps[1]
        };
      }
    }

    // 6. Dynamic Component selection
    const candidateComps: Array<{ id: string; matchLength: number }> = [];
    for (const comp of Object.values(this.model.components)) {
      const name = comp.name.toLowerCase();
      const sciName = comp.scientificName.toLowerCase();
      const idStr = comp.id.toLowerCase().replace(/_/g, ' ');

      if (q.includes(name)) {
        candidateComps.push({ id: comp.id, matchLength: name.length });
      } else if (sciName && q.includes(sciName)) {
        candidateComps.push({ id: comp.id, matchLength: sciName.length });
      } else if (q.includes(idStr)) {
        candidateComps.push({ id: comp.id, matchLength: idStr.length });
      }
    }

    if (candidateComps.length > 0) {
      // Pick the most specific match (longest phrase matched)
      candidateComps.sort((a, b) => b.matchLength - a.matchLength);
      return { type: 'SELECT_COMPONENT', targetId: candidateComps[0].id };
    }

    return null;
  }
}

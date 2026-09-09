import { ScientificComponent, ScientificRelationship, ScientificSystemModel, RelationshipType } from './ScientificSchema';

export interface GraphNode {
  id: string;
  component: ScientificComponent;
  outgoing: ScientificRelationship[];
  incoming: ScientificRelationship[];
}

export class RelationshipGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private model: ScientificSystemModel;

  constructor(model: ScientificSystemModel) {
    this.model = model;
    this.buildGraph();
  }

  private buildGraph() {
    this.nodes.clear();

    // 1. Create nodes
    for (const [id, comp] of Object.entries(this.model.components)) {
      this.nodes.set(id, {
        id,
        component: comp,
        outgoing: [],
        incoming: []
      });
    }

    // 2. Populate edges
    for (const rel of this.model.relationships) {
      const srcNode = this.nodes.get(rel.sourceId);
      const tgtNode = this.nodes.get(rel.targetId);

      if (srcNode && tgtNode) {
        srcNode.outgoing.push(rel);
        tgtNode.incoming.push(rel);

        if (rel.bidirectional) {
          const reverseRel: ScientificRelationship = {
            sourceId: rel.targetId,
            targetId: rel.sourceId,
            type: rel.type,
            description: rel.description,
            transferType: rel.transferType,
            strength: rel.strength
          };
          tgtNode.outgoing.push(reverseRel);
          srcNode.incoming.push(reverseRel);
        }
      }
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getComponent(id: string): ScientificComponent | undefined {
    return this.nodes.get(id)?.component;
  }

  /**
   * Find direct neighbors with their relationship types
   */
  public getDirectRelationships(id: string): {
    drivers: Array<{ component: ScientificComponent; relationship: ScientificRelationship }>;
    driven: Array<{ component: ScientificComponent; relationship: ScientificRelationship }>;
    structural: Array<{ component: ScientificComponent; relationship: ScientificRelationship }>;
  } {
    const node = this.nodes.get(id);
    const drivers: Array<{ component: ScientificComponent; relationship: ScientificRelationship }> = [];
    const driven: Array<{ component: ScientificComponent; relationship: ScientificRelationship }> = [];
    const structural: Array<{ component: ScientificComponent; relationship: ScientificRelationship }> = [];

    if (!node) return { drivers, driven, structural };

    // Incoming relationships where other entity DRIVES this entity
    for (const rel of node.incoming) {
      const srcComp = this.model.components[rel.sourceId];
      if (!srcComp) continue;

      if (rel.type === 'DRIVES' || rel.type === 'TRANSFERS_FORCE_TO' || rel.type === 'TRANSFERS_ENERGY_TO' || rel.type === 'CONTROLS' || rel.type === 'PUMPS') {
        drivers.push({ component: srcComp, relationship: rel });
      } else {
        structural.push({ component: srcComp, relationship: rel });
      }
    }

    // Outgoing relationships where this entity DRIVES another
    for (const rel of node.outgoing) {
      const tgtComp = this.model.components[rel.targetId];
      if (!tgtComp) continue;

      if (rel.type === 'DRIVES' || rel.type === 'TRANSFERS_FORCE_TO' || rel.type === 'TRANSFERS_ENERGY_TO' || rel.type === 'CONTROLS' || rel.type === 'PUMPS') {
        driven.push({ component: tgtComp, relationship: rel });
      } else {
        structural.push({ component: tgtComp, relationship: rel });
      }
    }

    return { drivers, driven, structural };
  }

  /**
   * Get all components connected via kinematic or energy transfer chain
   */
  public getKinematicChain(startId: string, maxDepth: number = 4): string[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
    visited.add(startId);

    const kinematicTypes: RelationshipType[] = [
      'DRIVES', 'DRIVEN_BY', 'TRANSFERS_FORCE_TO', 'TRANSFERS_ENERGY_TO', 'CONNECTED_TO', 'PUMPS'
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const node = this.nodes.get(current.id);
      if (!node) continue;

      const allRels = [...node.outgoing, ...node.incoming];
      for (const rel of allRels) {
        if (kinematicTypes.includes(rel.type)) {
          const neighborId = rel.sourceId === current.id ? rel.targetId : rel.sourceId;
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, depth: current.depth + 1 });
          }
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Generates a scientific natural language explanation of how two components relate
   */
  public explainRelationship(fromId: string, toId: string): string {
    const fromComp = this.model.components[fromId];
    const toComp = this.model.components[toId];

    if (!fromComp || !toComp) {
      return `Entities not found in active model.`;
    }

    if (fromId === toId) {
      return `${fromComp.name} (${fromComp.scientificName}): ${fromComp.education.function}`;
    }

    // Check direct relationship
    const node = this.nodes.get(fromId);
    if (node) {
      const directRel = node.outgoing.find(r => r.targetId === toId) || node.incoming.find(r => r.sourceId === toId);
      if (directRel) {
        return `Direct relationship: ${directRel.description} (${directRel.type}).`;
      }
    }

    // Path search (BFS)
    const queue: Array<{ id: string; path: ScientificRelationship[] }> = [{ id: fromId, path: [] }];
    const visited = new Set<string>([fromId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (id === toId) {
        const steps = path.map(p => {
          const s = this.model.components[p.sourceId]?.name || p.sourceId;
          const t = this.model.components[p.targetId]?.name || p.targetId;
          return `${s} ${p.type.toLowerCase().replace(/_/g, ' ')} ${t} (${p.description})`;
        });
        return `Kinematic / Functional Path:\n• ${steps.join('\n• ')}`;
      }

      const currNode = this.nodes.get(id);
      if (currNode) {
        for (const rel of currNode.outgoing) {
          if (!visited.has(rel.targetId)) {
            visited.add(rel.targetId);
            queue.push({ id: rel.targetId, path: [...path, rel] });
          }
        }
      }
    }

    return `${fromComp.name} and ${toComp.name} belong to ${fromComp.subsystemId === toComp.subsystemId ? 'the same subsystem' : 'different subsystems'} but do not share a direct kinematic link.`;
  }
}

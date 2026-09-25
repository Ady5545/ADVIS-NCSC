import * as THREE from 'three';

export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'assembly' | 'part' | 'geometry';
  children?: string[];
  metadata?: Record<string, any>;
  userData?: Record<string, any>;
}

export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();
  private objectMap: Map<string, THREE.Object3D> = new Map();
  private rootId: string = 'root';

  constructor() {
    this.components.set(this.rootId, {
      id: this.rootId,
      name: 'Root Assembly',
      type: 'assembly',
      children: []
    });
  }

  register(definition: ComponentDefinition, parentId: string | null = null) {
    this.components.set(definition.id, definition);
    const actualParent = parentId || this.rootId;
    if (definition.id !== this.rootId) {
      const parent = this.components.get(actualParent);
      if (parent) {
        if (!parent.children) parent.children = [];
        if (!parent.children.includes(definition.id)) {
          parent.children.push(definition.id);
        }
      }
    }
  }

  registerObject3D(id: string, object: THREE.Object3D) {
    this.objectMap.set(id, object);
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  getObject3D(id: string): THREE.Object3D | undefined {
    return this.objectMap.get(id);
  }

  getChildren(id: string): ComponentDefinition[] {
    const comp = this.get(id);
    if (!comp || !comp.children) return [];
    return comp.children.map(cid => this.get(cid)!).filter(Boolean);
  }

  applyVisibility(id: string, visible: boolean) {
     const object = this.getObject3D(id);
     if (object) {
        object.visible = visible;
     }
  }

  applyVisibilityRecursive(id: string, visible: boolean) {
     this.applyVisibility(id, visible);
     const children = this.getChildren(id);
     for (const child of children) {
         this.applyVisibilityRecursive(child.id, visible);
     }
  }

  show(id: string) {
     this.applyVisibilityRecursive(id, true);
  }

  hide(id: string) {
     this.applyVisibilityRecursive(id, false);
  }
  
  isolate(id: string) {
     for (const [compId, obj] of this.objectMap.entries()) {
         if (compId === id || compId.startsWith(id + '.')) {
             obj.visible = true;
         } else if (id.startsWith(compId + '.')) {
             obj.visible = true;
         } else {
             obj.visible = false;
         }
     }
  }
  
  restore() {
     for (const obj of this.objectMap.values()) {
         obj.visible = true;
     }
  }

  private originalPositions: Map<string, THREE.Vector3> = new Map();

  explode(id: string, distance: number = 0.5, cumulativeOffset = new THREE.Vector3()) {
     const comp = this.getObject3D(id);
     const def = this.get(id);
     let currentOffset = new THREE.Vector3();
     if (comp) {
         if (!this.originalPositions.has(id)) {
            this.originalPositions.set(id, comp.position.clone());
         }
         if (def && def.userData && def.userData.explodedOffset) {
             currentOffset = new THREE.Vector3().fromArray(def.userData.explodedOffset).multiplyScalar(distance);
         } else if (comp.userData && comp.userData.explodedOffset) {
             currentOffset = new THREE.Vector3().fromArray(comp.userData.explodedOffset).multiplyScalar(distance);
         } else {
             let hash = 0;
             for (let i = 0; i < id.length; i++) {
                hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
             }
             const x = ((hash & 0xFF) / 255.0) - 0.5;
             const y = (((hash >> 8) & 0xFF) / 255.0) - 0.5;
             const z = (((hash >> 16) & 0xFF) / 255.0) - 0.5;
             const dir = new THREE.Vector3(x, y, z);
             if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);
             dir.normalize().multiplyScalar(distance * 0.3);
             currentOffset = dir;
         }
         const totalOffset = cumulativeOffset.clone().add(currentOffset);
         comp.position.copy(this.originalPositions.get(id)!).add(totalOffset);
         if (def && def.children) {
             def.children.forEach(childId => {
                 this.explode(childId, distance, totalOffset);
             });
         }
     } else if (def && def.children) {
         const totalOffset = cumulativeOffset.clone();
         if (def.userData && def.userData.explodedOffset) {
             totalOffset.add(new THREE.Vector3().fromArray(def.userData.explodedOffset).multiplyScalar(distance));
         }
         def.children.forEach(childId => {
             this.explode(childId, distance, totalOffset);
         });
     }
  }

  restoreExplosion(id: string) {
     const comp = this.getObject3D(id);
     const def = this.get(id);
     if (comp && this.originalPositions.has(id)) {
        comp.position.copy(this.originalPositions.get(id)!);
     }
     if (def && def.children) {
         def.children.forEach(childId => {
             this.restoreExplosion(childId);
         });
     }
  }
}

export const GlobalComponentRegistry = new ComponentRegistry();

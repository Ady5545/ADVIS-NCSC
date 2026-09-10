import * as THREE from 'three';

export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'assembly' | 'part' | 'geometry';
  children?: string[];
  metadata?: Record<string, any>;
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

  register(definition: ComponentDefinition) {
    this.components.set(definition.id, definition);
    if (!definition.id.includes('.') && definition.id !== this.rootId) {
       this.components.get(this.rootId)?.children?.push(definition.id);
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

  explode(id: string, distance: number = 0.5) {
     const comp = this.getObject3D(id);
     if (!comp) return;

     if (!this.originalPositions.has(id)) {
        this.originalPositions.set(id, comp.position.clone());
     }

     const dir = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
     ).normalize().multiplyScalar(distance);

     comp.position.add(dir);
  }

  restoreExplosion(id: string) {
     const comp = this.getObject3D(id);
     if (!comp) return;
     const orig = this.originalPositions.get(id);
     if (orig) {
         comp.position.copy(orig);
     }
  }
}

export const GlobalComponentRegistry = new ComponentRegistry();

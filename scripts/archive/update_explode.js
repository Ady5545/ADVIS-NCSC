const fs = require('fs');
let code = fs.readFileSync('src/scientific/architecture/ComponentRegistry.ts', 'utf8');

code = code.replace(/explode\(id: string, distance: number = 0\.5\) \{[\s\S]*?restoreExplosion\(id: string\) \{[\s\S]*?\}\s*}/, `explode(id: string, distance: number = 0.5, cumulativeOffset = new THREE.Vector3()) {
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
  }`);

fs.writeFileSync('src/scientific/architecture/ComponentRegistry.ts', code);

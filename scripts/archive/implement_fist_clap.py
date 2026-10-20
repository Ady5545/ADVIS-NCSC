import re

with open('src/SpatialObjectEngine.tsx', 'r') as f:
    content = f.read()

# I need to find where pointer raycast handles intersections.
raycast_block = """        if (mainGroupRef.current) {
          const intersects = raycaster.intersectObjects(mainGroupRef.current.children, true);
          let foundComponentId: string | null = null;
          
          if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && hit !== mainGroupRef.current) {
              if (hit.userData && hit.userData.componentId) {
                foundComponentId = hit.userData.componentId;
                break;
              }
              hit = hit.parent as THREE.Object3D;
            }
          }"""

new_raycast_block = """        if (mainGroupRef.current) {
          const intersects = raycaster.intersectObjects(mainGroupRef.current.children, true);
          let foundComponentId: string | null = null;
          
          if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && hit !== mainGroupRef.current) {
              if (hit.userData && hit.userData.componentId) {
                foundComponentId = hit.userData.componentId;
                break;
              }
              hit = hit.parent as THREE.Object3D;
            }
          }
          
          if (gEngine.interactionState === 'FIST' && foundComponentId) {
             if (onToggleIsolate) onToggleIsolate(foundComponentId);
          }
          if (gEngine.interactionState === 'CLAP') {
             if (onToggleIsolate) onToggleIsolate(null);
             // Maybe we should reset the workspace?
          }"""

content = content.replace(raycast_block, new_raycast_block)

with open('src/SpatialObjectEngine.tsx', 'w') as f:
    f.write(content)

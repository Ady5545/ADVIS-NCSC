import React, { useEffect, useRef, createContext, useContext } from 'react';
import * as THREE from 'three';
import { GlobalComponentRegistry, ComponentDefinition } from './ComponentRegistry';

interface Props {
  id: string;
  name: string;
  type: 'assembly' | 'part' | 'geometry';
  children?: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

const EntityParentContext = createContext<string | null>(null);

// V12 Engine specific constants for hierarchy auto-generation
const BANK_ANGLE = Math.PI / 6; // 30 degrees
const CYLINDER_Z = [-0.8, -0.48, -0.16, 0.16, 0.48, 0.8];

function getV12Transform(path: string): { position: [number, number, number], rotation: [number, number, number] } | null {
  if (!path.startsWith('v12')) return null;
  
  // Banks
  if (path === 'v12.bank_a') return { position: [0, 0, 0], rotation: [0, 0, BANK_ANGLE] };
  if (path === 'v12.bank_b') return { position: [0, 0, 0], rotation: [0, 0, -BANK_ANGLE] };
  
  // Cylinders
  const cylMatch = path.match(/^v12\.bank_(a|b)\.cylinder(\d+)$/);
  if (cylMatch) {
    const cylNum = parseInt(cylMatch[2], 10);
    const bank = cylMatch[1];
    // Bank A has cyls 1,3,5,7,9,11 mapped to Z indices 0..5
    // Bank B has cyls 2,4,6,8,10,12 mapped to Z indices 0..5
    const zIndex = bank === 'a' ? Math.floor((cylNum - 1) / 2) : Math.floor((cylNum - 2) / 2);
    if (zIndex >= 0 && zIndex < 6) {
      return { position: [0, 0, CYLINDER_Z[zIndex]], rotation: [0, 0, 0] };
    }
  }
  
  return null;
}

export const EntityRef: React.FC<Props> = ({ id, name, type, children, position, rotation, scale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const parentId = useContext(EntityParentContext);

  useEffect(() => {
    // 1. Auto-construct logical hierarchy for dotted IDs
    const parts = id.split('.');
    let currentPath = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
       const prevPath = currentPath;
       currentPath = currentPath ? `${currentPath}.${parts[i]}` : parts[i];
       
       if (!GlobalComponentRegistry.get(currentPath)) {
           const formattedName = parts[i].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
           GlobalComponentRegistry.register({
               id: currentPath,
               name: formattedName,
               type: 'assembly',
               children: []
           }, prevPath || null);
           
           // Create a physical group for the intermediate node so children can attach to it
           const intermediateGroup = new THREE.Group();
           intermediateGroup.name = currentPath;
           
           // Apply domain-specific transforms for V12 to maintain kinematics coordinate spaces
           const t = getV12Transform(currentPath);
           if (t) {
             intermediateGroup.position.set(...t.position);
             intermediateGroup.rotation.set(...t.rotation);
           }
           
           GlobalComponentRegistry.registerObject3D(currentPath, intermediateGroup);
           
           const parentObj = prevPath ? GlobalComponentRegistry.getObject3D(prevPath) : GlobalComponentRegistry.getObject3D('root');
           if (parentObj) {
               parentObj.add(intermediateGroup);
           }
       }
    }

    // 2. Register this logic identity
    const explicitParent = parts.length > 1 ? parts.slice(0, -1).join('.') : parentId;
    GlobalComponentRegistry.register({ id, name, type, children: [] }, explicitParent);
    
    // 3. Link physical Three.js node and reparent to match dotted hierarchy
    if (groupRef.current) {
      GlobalComponentRegistry.registerObject3D(id, groupRef.current);
      
      // Logical hierarchy only. No physical reparenting so we don't break SpatialObjectEngine's flat explode loop.
    }
    
    return () => {};
  }, [id, name, type, parentId]);

  return (
    <EntityParentContext.Provider value={id}>
      <group ref={groupRef} name={id} position={position} rotation={rotation as any} scale={scale}>
        {children}
      </group>
    </EntityParentContext.Provider>
  );
};



import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GlobalComponentRegistry } from './ComponentRegistry';

interface Props {
  id: string;
  name: string;
  type: 'assembly' | 'part' | 'geometry';
  children: React.ReactNode;
}

export const EntityRef: React.FC<Props> = ({ id, name, type, children }) => {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // 1. Register logic identity in the hierarchical registry
    GlobalComponentRegistry.register({ id, name, type, children: [] });
    
    // 2. Link physical Three.js node
    if (groupRef.current) {
      GlobalComponentRegistry.registerObject3D(id, groupRef.current);
    }
  }, [id, name, type]);

  return (
    <group ref={groupRef} name={id}>
      {children}
    </group>
  );
};

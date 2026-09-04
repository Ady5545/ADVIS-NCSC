const fs = require('fs');

const newCode = `
import * as THREE from 'three';
import { ComponentMetadata } from '../SpatialLibrary';
import { ProceduralMeshSpecification } from './ModelTypes';
import { GeneratedAssemblyPayload } from './GeometryGenerator';
import { UniversalGeometryVocabulary } from './UniversalGeometryVocabulary';

export class UniversalSemanticAssembler {
  public static async assemble(query: string, params: Record<string, any>): Promise<GeneratedAssemblyPayload> {
    const scale = Number(params.scale || 1.0);
    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    try {
      let objectQuery = query.replace('GENERIC_', '').replace(/_/g, ' ').toLowerCase();
      
      const response = await fetch('/api/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectQuery })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch structure");
      }
      
      const data = await response.json();
      const planComponents = data.components || [];

      for (const comp of planComponents) {
        const id = comp.id || \`comp_\${Math.random().toString(36).substr(2, 9)}\`;
        const name = comp.name || 'Component';
        const description = comp.description || '';
        
        let x = 0, y = 0, z = 0;
        if (comp.position) {
          x = comp.position.x || 0;
          y = comp.position.y || 0;
          z = comp.position.z || 0;
        }
        const position: [number, number, number] = [x * scale, y * scale, z * scale];

        let rx = 0, ry = 0, rz = 0;
        if (comp.rotation) {
          rx = comp.rotation.x || 0;
          ry = comp.rotation.y || 0;
          rz = comp.rotation.z || 0;
        }

        let sx = 0.1, sy = 0.1, sz = 0.1;
        if (comp.size) {
          sx = (comp.size.w ?? comp.size.r ?? 0.1);
          sy = (comp.size.h ?? 0.1);
          sz = (comp.size.d ?? comp.size.r ?? 0.1);
        }
        const size: [number, number, number] = [sx * scale, sy * scale, sz * scale];

        const color = comp.color || '#64748b';
        const materialType = comp.materialType || 'PBR_MATTE';
        const geometryType = comp.geometry || 'box';

        let geom: THREE.BufferGeometry;
        switch (geometryType.toLowerCase()) {
          case 'roundedbox':
            geom = UniversalGeometryVocabulary.createRoundedBox(size[0], size[1], size[2], Math.min(size[0], size[1], size[2]) * 0.1, 4);
            break;
          case 'cylinder':
            geom = new THREE.CylinderGeometry(size[0], size[0], size[1], 32);
            break;
          case 'sphere':
            geom = new THREE.SphereGeometry(size[0], 32, 32);
            break;
          case 'tube':
          case 'torus':
            geom = new THREE.TorusGeometry(size[0], size[1], 16, 32);
            break;
          case 'cone':
            geom = new THREE.ConeGeometry(size[0], size[1], 32);
            break;
          case 'spokewheel':
            geom = UniversalGeometryVocabulary.createSpokeWheel(size[0], size[0]*1.1, size[2], size[0]*0.1);
            break;
          case 'box':
          default:
            geom = new THREE.BoxGeometry(size[0], size[1], size[2]);
            break;
        }

        // Apply rotation
        geom.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)));

        components.push({
          id, name, description, position, size,
          explodedOffset: [0, 0, 0],
          shape: 'box', color, specifications: {}
        });
        geometries[id] = geom;
        meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
      }

      if (components.length === 0) throw new Error("Empty components");

      return { components, geometries, meshSpecs };
    } catch (e) {
      console.error("Semantic Assembler AI failed, fallback to basic generic:", e);
      // Fallback
      const id = 'generic_base';
      const geom = UniversalGeometryVocabulary.createRoundedBox(1*scale, 1*scale, 1*scale, 0.1, 4);
      components.push({
        id, name: 'Generic Assembly', description: 'Approximated generic geometry.', position: [0,0,0], size: [1*scale, 1*scale, 1*scale],
        explodedOffset: [0,0,0], shape: 'box', color: '#64748b', specifications: {}
      });
      geometries[id] = geom;
      meshSpecs[id] = { id, name: 'Generic Assembly', meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#64748b', materialType: 'PBR_MATTE' };
      return { components, geometries, meshSpecs };
    }
  }
}
`;

fs.writeFileSync('src/AutonomousModelEngine/UniversalSemanticAssembler.ts', newCode);

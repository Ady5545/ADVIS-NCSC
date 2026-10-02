import type { ObjectMetadata, ComponentMetadata } from '../SpatialLibrary';

export type GeometryAuthority =
  | 'CAD_BREP'
  | 'GLTF_ASSET'
  | 'PROCEDURAL_HIGH_DETAIL'
  | 'SCIENTIFIC_STRUCTURAL'
  | 'CONCEPT';

export type FidelityTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface GeometryFidelityProfile {
  authority: GeometryAuthority;
  tier: FidelityTier;
  supportsDeepZoom: boolean;
  supportsInteriorInspection: boolean;
  sourceLabel: string;
  detailLabel: string;
}

export function resolveComponentFidelity(component: ComponentMetadata): GeometryFidelityProfile {
  if (component.cadAssetPath) {
    return {
      authority: 'CAD_BREP',
      tier: 'L4',
      supportsDeepZoom: true,
      supportsInteriorInspection: true,
      sourceLabel: 'OCCT B-REP / CAD',
      detailLabel: 'Geometry authoritative',
    };
  }

  if (component.assetPath?.toLowerCase().endsWith('.glb')) {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L3',
      supportsDeepZoom: true,
      supportsInteriorInspection: false,
      sourceLabel: 'GLTF / PBR asset',
      detailLabel: 'Asset detailed',
    };
  }

  return {
    authority: 'PROCEDURAL_HIGH_DETAIL',
    tier: 'L2',
    supportsDeepZoom: false,
    supportsInteriorInspection: true,
    sourceLabel: 'Procedural engineering geometry',
    detailLabel: 'Educational detail',
  };
}

export function resolveObjectFidelity(object: ObjectMetadata): GeometryFidelityProfile {
  if (object.geometryAuthority === 'CAD_BREP' || object.cadAssetPath) {
    return {
      authority: 'CAD_BREP',
      tier: 'L4',
      supportsDeepZoom: true,
      supportsInteriorInspection: true,
      sourceLabel: 'OCCT B-REP / CAD',
      detailLabel: 'Geometry authoritative',
    };
  }

  const components = object.components || [];
  if (components.some(component => component.cadAssetPath)) {
    return {
      authority: 'CAD_BREP',
      tier: 'L4',
      supportsDeepZoom: true,
      supportsInteriorInspection: true,
      sourceLabel: 'Hybrid CAD assembly',
      detailLabel: 'CAD parts available',
    };
  }

  if (object.assetPath?.toLowerCase().endsWith('.glb')) {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L3',
      supportsDeepZoom: true,
      supportsInteriorInspection: false,
      sourceLabel: 'GLTF / PBR asset',
      detailLabel: 'Asset detailed',
    };
  }

  return {
    authority: 'PROCEDURAL_HIGH_DETAIL',
    tier: 'L2',
    supportsDeepZoom: false,
    supportsInteriorInspection: true,
    sourceLabel: 'Procedural engineering geometry',
    detailLabel: 'Educational detail',
  };
}

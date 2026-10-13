import type { ObjectMetadata, ComponentMetadata } from '../SpatialLibrary';
import { assessCadEvidence, isSourceCadVerified } from './CadCertification';

export type GeometryAuthority =
  | 'CAD_BREP'
  | 'CAD_SOURCE_UNVALIDATED'
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

function explicitCapability(metadata: Record<string, any> | undefined, key: string): boolean {
  return metadata?.capabilities?.[key] === true;
}

export function resolveComponentFidelity(component: ComponentMetadata): GeometryFidelityProfile {
  if (component.cadAssetPath) {
    return {
      authority: 'CAD_SOURCE_UNVALIDATED',
      tier: 'L2',
      supportsDeepZoom: false,
      supportsInteriorInspection: false,
      sourceLabel: 'CAD source path present',
      detailLabel: 'Validation not recorded',
    };
  }

  if (component.assetPath?.toLowerCase().endsWith('.glb') || component.assetPath?.toLowerCase().endsWith('.gltf')) {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L3',
      supportsDeepZoom: false,
      supportsInteriorInspection: false,
      sourceLabel: 'GLTF / visual asset',
      detailLabel: 'Mesh detail not independently validated',
    };
  }

  return {
    authority: 'PROCEDURAL_HIGH_DETAIL',
    tier: 'L2',
    supportsDeepZoom: false,
    supportsInteriorInspection: explicitCapability((component as any).metadata, 'interiorGeometryAvailable'),
    sourceLabel: 'Procedural engineering geometry',
    detailLabel: 'Educational detail; dimensions require evidence',
  };
}

export function resolveObjectFidelity(object: ObjectMetadata): GeometryFidelityProfile {
  const evidence = assessCadEvidence(object);
  const metadata = object.metadata;

  if (evidence.status === 'SOURCE_CAD_VERIFIED' && isSourceCadVerified(evidence)) {
    return {
      authority: 'CAD_BREP',
      tier: 'L4',
      supportsDeepZoom: explicitCapability(metadata, 'supportsDeepZoom'),
      supportsInteriorInspection: explicitCapability(metadata, 'interiorGeometryAvailable'),
      sourceLabel: 'Source CAD; recorded validation available',
      detailLabel: 'Validated only for recorded checks',
    };
  }

  if (evidence.status === 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION') {
    return {
      authority: 'CAD_SOURCE_UNVALIDATED',
      tier: 'L2',
      supportsDeepZoom: false,
      supportsInteriorInspection: false,
      sourceLabel: 'CAD source available',
      detailLabel: 'Validation pending',
    };
  }

  if (evidence.status === 'GLTF_ASSET_AWAITING_CAD_SOURCE') {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L3',
      supportsDeepZoom: explicitCapability(metadata, 'supportsDeepZoom'),
      supportsInteriorInspection: explicitCapability(metadata, 'interiorGeometryAvailable'),
      sourceLabel: 'GLTF / visual asset',
      detailLabel: 'Visual asset; CAD authority unverified',
    };
  }

  if (evidence.status === 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE') {
    return {
      authority: 'SCIENTIFIC_STRUCTURAL',
      tier: 'L1',
      supportsDeepZoom: explicitCapability(metadata, 'supportsDeepZoom'),
      supportsInteriorInspection: explicitCapability(metadata, 'interiorGeometryAvailable'),
      sourceLabel: 'Scientific visualization',
      detailLabel: 'Concept geometry; see assumptions',
    };
  }

  return {
    authority: object.geometryAuthority === 'CONCEPT' ? 'CONCEPT' : 'PROCEDURAL_HIGH_DETAIL',
    tier: explicitCapability(metadata, 'geometryReviewed') ? 'L2' : 'L1',
    supportsDeepZoom: explicitCapability(metadata, 'supportsDeepZoom'),
    supportsInteriorInspection: explicitCapability(metadata, 'interiorGeometryAvailable'),
    sourceLabel: 'Procedural educational model',
    detailLabel: explicitCapability(metadata, 'geometryReviewed') ? 'Geometry reviewed for stated scope' : 'Geometry validation not recorded',
  };
}

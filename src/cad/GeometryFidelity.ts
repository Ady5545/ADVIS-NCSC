import type { ObjectMetadata, ComponentMetadata } from '../SpatialLibrary';
import { hasRequiredCadValidationEvidence } from './CadCertification';

export type GeometryAuthority =
  | 'CAD_BREP'
  | 'CAD_SOURCE_UNVERIFIED'
  | 'GLTF_ASSET'
  | 'PROCEDURAL_HIGH_DETAIL'
  | 'PROCEDURAL_EDUCATIONAL_GEOMETRY'
  | 'SCIENTIFIC_STRUCTURAL'
  | 'CONCEPT';

export type FidelityTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface GeometryFidelityProfile {
  authority: GeometryAuthority;
  /** Visual completeness only; this is not a global quality or certification score. */
  tier: FidelityTier;
  supportsDeepZoom: boolean;
  supportsInteriorInspection: boolean;
  sourceLabel: string;
  detailLabel: string;
  validationLabel: string;
}

type ExplicitGeometryCapabilities = {
  supportsDeepZoom?: boolean;
  supportsInteriorInspection?: boolean;
};

function explicitCapabilities(value: unknown): ExplicitGeometryCapabilities {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  return {
    supportsDeepZoom: record.supportsDeepZoom === true,
    supportsInteriorInspection: record.supportsInteriorInspection === true,
  };
}

function componentCapabilities(component: ComponentMetadata): ExplicitGeometryCapabilities {
  return explicitCapabilities((component as ComponentMetadata & { capabilities?: unknown }).capabilities);
}

function objectCapabilities(object: ObjectMetadata): ExplicitGeometryCapabilities {
  return explicitCapabilities(object.metadata?.capabilities);
}

function hasCadSource(path?: string): boolean {
  return Boolean(path && /\.(step|stp|brep|brp)$/i.test(path));
}

function hasGltfSource(path?: string): boolean {
  return Boolean(path && /\.(glb|gltf)$/i.test(path));
}

function recordedCadValidation(object: ObjectMetadata): boolean {
  return Boolean(object.cadCertification && hasRequiredCadValidationEvidence(object.cadCertification));
}

export function resolveComponentFidelity(component: ComponentMetadata): GeometryFidelityProfile {
  const capabilities = componentCapabilities(component);
  const sourcePath = component.cadAssetPath || component.assetPath;

  if (hasCadSource(sourcePath)) {
    return {
      authority: 'CAD_SOURCE_UNVERIFIED',
      tier: 'L2',
      supportsDeepZoom: capabilities.supportsDeepZoom === true,
      supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
      sourceLabel: 'CAD source present',
      detailLabel: 'Source present; checks unverified',
      validationLabel: 'Validation evidence not supplied',
    };
  }

  if (hasGltfSource(sourcePath)) {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L2',
      supportsDeepZoom: capabilities.supportsDeepZoom === true,
      supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
      sourceLabel: 'GLTF / GLB scene asset',
      detailLabel: 'Visual asset; dimensions unspecified',
      validationLabel: 'Not CAD/topology validated',
    };
  }

  return {
    authority: 'PROCEDURAL_EDUCATIONAL_GEOMETRY',
    tier: 'L1',
    supportsDeepZoom: capabilities.supportsDeepZoom === true,
    supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
    sourceLabel: 'Procedural geometry',
    detailLabel: 'Educational visual approximation',
    validationLabel: 'Engineering validation unspecified',
  };
}

export function resolveObjectFidelity(object: ObjectMetadata): GeometryFidelityProfile {
  const capabilities = objectCapabilities(object);
  const components = object.components || [];
  const hasValidatedCad = recordedCadValidation(object);
  const hasSourceCad = hasCadSource(object.cadAssetPath || object.assetPath) ||
    components.some((component) => hasCadSource(component.cadAssetPath));

  if (hasValidatedCad) {
    return {
      authority: 'CAD_BREP',
      tier: 'L4',
      supportsDeepZoom: capabilities.supportsDeepZoom === true,
      supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
      sourceLabel: 'CAD source with recorded checks',
      detailLabel: 'Validation evidence recorded',
      validationLabel: 'Check records available; review scope and revision',
    };
  }

  if (hasSourceCad) {
    return {
      authority: 'CAD_SOURCE_UNVERIFIED',
      tier: 'L2',
      supportsDeepZoom: capabilities.supportsDeepZoom === true,
      supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
      sourceLabel: 'CAD source present',
      detailLabel: 'Source present; checks unverified',
      validationLabel: 'Validation evidence not supplied',
    };
  }

  if (hasGltfSource(object.assetPath)) {
    return {
      authority: 'GLTF_ASSET',
      tier: 'L2',
      supportsDeepZoom: capabilities.supportsDeepZoom === true,
      supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
      sourceLabel: 'GLTF / GLB scene asset',
      detailLabel: 'Visual asset; dimensions unspecified',
      validationLabel: 'Not CAD/topology validated',
    };
  }

  const isScientific = /anatomy|biology|chemistry|astronomy|physics|molecular|scientific|anatom/i.test(
    `${object.category} ${object.id}`
  );
  return {
    authority: isScientific ? 'SCIENTIFIC_STRUCTURAL' : 'PROCEDURAL_EDUCATIONAL_GEOMETRY',
    tier: isScientific ? 'L1' : 'L2',
    supportsDeepZoom: capabilities.supportsDeepZoom === true,
    supportsInteriorInspection: capabilities.supportsInteriorInspection === true,
    sourceLabel: isScientific ? 'Scientific concept geometry' : 'Procedural geometry',
    detailLabel: 'Educational visualization; authoritative dimensions not established',
    validationLabel: 'Engineering validation unspecified',
  };
}

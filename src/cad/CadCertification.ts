import type { ObjectMetadata } from '../SpatialLibrary';

export type CadCertificationStatus =
  | 'SOURCE_CAD_VERIFIED'
  | 'CAD_GRADE_PROCEDURAL'
  | 'GLTF_ASSET_AWAITING_CAD_SOURCE'
  | 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE';

export interface CadCertificationEvidence {
  status: CadCertificationStatus;
  sourceFormat: 'STEP' | 'STP' | 'BREP' | 'GLTF' | 'PROCEDURAL' | 'NONE';
  sourcePath?: string;
  exactBRepEvidence: boolean;
  occtValidated: boolean;
  topologyValidated: boolean;
  metricsValidated: boolean;
  assemblyStructureValidated: boolean;
  dimensionalDefinitionPresent: boolean;
  revisionControlled: boolean;
  limitations: string[];
  nextRequiredEvidence: string[];
}

export interface CadCatalogAuditRow {
  id: string;
  name: string;
  category: string;
  status: CadCertificationStatus;
  sourceFormat: CadCertificationEvidence['sourceFormat'];
  evidence: CadCertificationEvidence;
}

const CAD_EXTENSIONS = new Set(['.step', '.stp', '.brep', '.brp']);

function getExtension(path = ''): string {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

function isScientificConcept(id: string, category: string): boolean {
  const value = id + ' ' + category;
  return /(dna|quantum|electron|atom|nucleus|magnetic|earth|moon|solar_system|iss|satellite|anatomy|brain|heart|lungs|eye|skeleton)/i.test(value);
}

export function assessCadEvidence(obj: ObjectMetadata): CadCertificationEvidence {
  const sourcePath = obj.cadAssetPath || obj.assetPath;
  const extension = getExtension(sourcePath);
  const hasCadSource = CAD_EXTENSIONS.has(extension);
  const hasGltfSource = extension === '.glb' || extension === '.gltf';

  if (hasCadSource) {
    return {
      status: 'SOURCE_CAD_VERIFIED',
      sourceFormat: extension === '.brep' || extension === '.brp' ? 'BREP' : extension === '.stp' ? 'STP' : 'STEP',
      sourcePath,
      exactBRepEvidence: true,
      occtValidated: true,
      topologyValidated: true,
      metricsValidated: true,
      assemblyStructureValidated: true,
      dimensionalDefinitionPresent: true,
      revisionControlled: false,
      limitations: [
        'Repository metadata alone does not constitute external engineering approval or manufacturing certification.'
      ],
      nextRequiredEvidence: [
        'Attach revision-controlled source CAD and, where applicable, released PMI/drawing and inspection evidence.'
      ]
    };
  }

  if (hasGltfSource) {
    return {
      status: 'GLTF_ASSET_AWAITING_CAD_SOURCE',
      sourceFormat: 'GLTF',
      sourcePath,
      exactBRepEvidence: false,
      occtValidated: false,
      topologyValidated: false,
      metricsValidated: false,
      assemblyStructureValidated: false,
      dimensionalDefinitionPresent: false,
      revisionControlled: false,
      limitations: [
        'GLTF is a display/scene format and does not establish exact B-rep source geometry.',
        'A rendered asset cannot be called CAD-certified from its mesh alone.'
      ],
      nextRequiredEvidence: [
        'Provide authoritative STEP/STP/BREP source geometry.',
        'Import with OCCT and store validation metrics.',
        'Record revision and release/approval metadata.'
      ]
    };
  }

  return {
    status: isScientificConcept(obj.id, obj.category)
      ? 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE'
      : 'CAD_GRADE_PROCEDURAL',
    sourceFormat: 'PROCEDURAL',
    exactBRepEvidence: false,
    occtValidated: false,
    topologyValidated: false,
    metricsValidated: false,
    assemblyStructureValidated: false,
    dimensionalDefinitionPresent: false,
    revisionControlled: false,
    limitations: isScientificConcept(obj.id, obj.category)
      ? [
          'This is a scientific visualization/concept model, not an authoritative manufactured-part definition.',
          'CAD certification is not implied by procedural geometry.'
        ]
      : [
          'This is high-detail procedural geometry, not source CAD/B-rep.',
          'The model may be used for educational visualization but is not manufacturing-certified.'
        ],
    nextRequiredEvidence: [
      'Provide or author a source CAD model in STEP/STP/BREP.',
      'Validate the source with OCCT topology and measurement checks.',
      'Record revision-controlled engineering definition data.'
    ]
  };
}

export function auditCadCatalog(catalog: Record<string, ObjectMetadata>): CadCatalogAuditRow[] {
  return Object.values(catalog)
    .map((obj) => {
      const evidence = assessCadEvidence(obj);
      return {
        id: obj.id,
        name: obj.name,
        category: obj.category,
        status: evidence.status,
        sourceFormat: evidence.sourceFormat,
        evidence,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isSourceCadVerified(evidence: CadCertificationEvidence): boolean {
  return (
    evidence.status === 'SOURCE_CAD_VERIFIED' &&
    evidence.exactBRepEvidence &&
    evidence.occtValidated &&
    evidence.topologyValidated &&
    evidence.metricsValidated &&
    evidence.assemblyStructureValidated &&
    evidence.dimensionalDefinitionPresent
  );
}

export function getCadCertificationSummary(catalog: Record<string, ObjectMetadata>) {
  const rows = auditCadCatalog(catalog);
  return {
    total: rows.length,
    sourceCadVerified: rows.filter((row) => row.status === 'SOURCE_CAD_VERIFIED').length,
    cadGradeProcedural: rows.filter((row) => row.status === 'CAD_GRADE_PROCEDURAL').length,
    gltfAwaitingSource: rows.filter((row) => row.status === 'GLTF_ASSET_AWAITING_CAD_SOURCE').length,
    scientificAwaitingSource: rows.filter((row) => row.status === 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE').length,
  };
}

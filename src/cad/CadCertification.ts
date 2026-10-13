import type { ObjectMetadata } from '../SpatialLibrary';

/**
 * A CAD file extension only identifies the source format. It is never evidence
 * that parsing, topology, dimensions, assembly structure, or release checks passed.
 */
export type CadCertificationStatus =
  | 'SOURCE_CAD_VERIFIED' // Legacy status retained for reading old saved metadata; never inferred here.
  | 'CAD_VALIDATION_RECORDED'
  | 'SOURCE_CAD_PRESENT_AWAITING_VALIDATION'
  | 'CAD_GRADE_PROCEDURAL' // Legacy status retained for compatibility; no longer emitted.
  | 'PROCEDURAL_EDUCATIONAL_GEOMETRY'
  | 'GLTF_ASSET_AWAITING_CAD_SOURCE'
  | 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE';

export type CadValidationCheck =
  | 'CAD_PARSE'
  | 'TOPOLOGY'
  | 'METRICS'
  | 'ASSEMBLY_STRUCTURE'
  | 'DIMENSIONAL_DEFINITION'
  | 'REVISION_CONTROL'
  | 'RELEASE_REVIEW';

export interface CadValidationRecord {
  check: CadValidationCheck;
  result: 'PASSED' | 'FAILED' | 'NOT_RUN';
  tool: string;
  toolVersion: string;
  runAt: string;
  sourceHash: string;
  modelRevision: string;
  reviewer: string;
  evidenceUri?: string;
  notes?: string;
}

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
  validationRecords?: CadValidationRecord[];
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

function isRecord(value: unknown): value is CadValidationRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<CadValidationRecord>;
  return (
    typeof record.check === 'string' &&
    typeof record.result === 'string' &&
    typeof record.tool === 'string' && record.tool.trim().length > 0 &&
    typeof record.toolVersion === 'string' && record.toolVersion.trim().length > 0 &&
    typeof record.runAt === 'string' && Number.isFinite(Date.parse(record.runAt)) &&
    typeof record.sourceHash === 'string' && record.sourceHash.trim().length > 0 &&
    typeof record.modelRevision === 'string' && record.modelRevision.trim().length > 0 &&
    typeof record.reviewer === 'string' && record.reviewer.trim().length > 0
  );
}

function getCurrentSourceHash(obj: ObjectMetadata): string | undefined {
  const value = obj.metadata?.cadSourceHash ?? obj.metadata?.sourceHash;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getCurrentRevision(obj: ObjectMetadata): string | undefined {
  const value = obj.metadata?.modelRevision ?? obj.metadata?.revision;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getCurrentValidationRecords(obj: ObjectMetadata): CadValidationRecord[] {
  const raw = obj.metadata?.cadValidationRecords;
  if (!Array.isArray(raw)) return [];

  const sourceHash = getCurrentSourceHash(obj);
  const revision = getCurrentRevision(obj);
  if (!sourceHash || !revision) return [];

  return raw.filter(isRecord).filter((record) =>
    record.sourceHash === sourceHash &&
    record.modelRevision === revision &&
    record.result === 'PASSED'
  );
}

function hasCheck(records: CadValidationRecord[], check: CadValidationCheck): boolean {
  return records.some((record) => record.check === check);
}

export function assessCadEvidence(obj: ObjectMetadata): CadCertificationEvidence {
  const sourcePath = obj.cadAssetPath || obj.assetPath;
  const extension = getExtension(sourcePath);
  const hasCadSource = CAD_EXTENSIONS.has(extension);
  const hasGltfSource = extension === '.glb' || extension === '.gltf';

  if (hasCadSource) {
    const validationRecords = getCurrentValidationRecords(obj);
    const cadParsed = hasCheck(validationRecords, 'CAD_PARSE');
    const topologyValidated = hasCheck(validationRecords, 'TOPOLOGY');
    const metricsValidated = hasCheck(validationRecords, 'METRICS');
    const assemblyStructureValidated = hasCheck(validationRecords, 'ASSEMBLY_STRUCTURE');
    const dimensionalDefinitionPresent = hasCheck(validationRecords, 'DIMENSIONAL_DEFINITION');
    const revisionControlled = hasCheck(validationRecords, 'REVISION_CONTROL');
    const allRequiredChecksPassed =
      cadParsed &&
      topologyValidated &&
      metricsValidated &&
      assemblyStructureValidated &&
      dimensionalDefinitionPresent &&
      revisionControlled;

    return {
      status: allRequiredChecksPassed ? 'CAD_VALIDATION_RECORDED' : 'SOURCE_CAD_PRESENT_AWAITING_VALIDATION',
      sourceFormat: extension === '.brep' || extension === '.brp' ? 'BREP' : extension === '.stp' ? 'STP' : 'STEP',
      sourcePath,
      exactBRepEvidence: cadParsed,
      occtValidated: cadParsed,
      topologyValidated,
      metricsValidated,
      assemblyStructureValidated,
      dimensionalDefinitionPresent,
      revisionControlled,
      validationRecords,
      limitations: allRequiredChecksPassed
        ? ['Recorded checks apply only to the source hash and model revision attached to the validation records; they are not blanket manufacturing certification.']
        : ['A CAD source path is present, but its extension does not prove that the file parses or passes engineering checks.'],
      nextRequiredEvidence: allRequiredChecksPassed
        ? ['Review the recorded checks for fitness for the intended educational or engineering use.', 'Keep source hash, revision, tool versions, and review evidence current.']
        : [
            'Record the current CAD source hash and model revision.',
            'Run and record CAD parsing, topology, metrics, and assembly-structure checks.',
            'Record dimensional definition and revision-control evidence.',
            'Include tool/version, timestamp, source hash, revision, reviewer, and a result for every check.'
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
        'Deep zoom or apparent visual detail does not establish dimensional or topology validation.'
      ],
      nextRequiredEvidence: [
        'Provide authoritative STEP/STP/BREP source geometry if CAD authority is required.',
        'Record actual validation outputs; do not infer validation from the filename or renderer.',
        'Record revision and release/approval metadata where applicable.'
      ]
    };
  }

  const scientificConcept = isScientificConcept(obj.id, obj.category);
  return {
    status: scientificConcept
      ? 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE'
      : 'PROCEDURAL_EDUCATIONAL_GEOMETRY',
    sourceFormat: sourcePath ? 'PROCEDURAL' : 'NONE',
    sourcePath,
    exactBRepEvidence: false,
    occtValidated: false,
    topologyValidated: false,
    metricsValidated: false,
    assemblyStructureValidated: false,
    dimensionalDefinitionPresent: false,
    revisionControlled: false,
    limitations: scientificConcept
      ? [
          'This is a scientific visualization/concept model, not an authoritative manufactured-part definition.',
          'CAD certification is not implied by procedural geometry.'
        ]
      : [
          'This is procedural or otherwise non-CAD geometry, not source CAD/B-rep.',
          'The model may be useful for educational visualization but is not manufacturing-certified.'
        ],
    nextRequiredEvidence: [
      'Provide or author a source CAD model in STEP/STP/BREP only if the use case requires it.',
      'Validate source geometry with recorded parser, topology, and measurement checks.',
      'Record revision-controlled engineering definition data before making stronger claims.'
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

export function hasRequiredCadValidationEvidence(evidence: CadCertificationEvidence): boolean {
  return (
    evidence.status === 'CAD_VALIDATION_RECORDED' &&
    evidence.exactBRepEvidence &&
    evidence.occtValidated &&
    evidence.topologyValidated &&
    evidence.metricsValidated &&
    evidence.assemblyStructureValidated &&
    evidence.dimensionalDefinitionPresent &&
    evidence.revisionControlled
  );
}

/** @deprecated Prefer the more precise hasRequiredCadValidationEvidence name. */
export function isSourceCadVerified(evidence: CadCertificationEvidence): boolean {
  return hasRequiredCadValidationEvidence(evidence);
}

export function getCadCertificationSummary(catalog: Record<string, ObjectMetadata>) {
  const rows = auditCadCatalog(catalog);
  return {
    total: rows.length,
    sourceCadVerified: rows.filter((row) => row.status === 'CAD_VALIDATION_RECORDED').length,
    cadValidationRecorded: rows.filter((row) => row.status === 'CAD_VALIDATION_RECORDED').length,
    cadSourceAwaitingValidation: rows.filter((row) => row.status === 'SOURCE_CAD_PRESENT_AWAITING_VALIDATION').length,
    cadGradeProcedural: rows.filter((row) => row.status === 'PROCEDURAL_EDUCATIONAL_GEOMETRY').length,
    proceduralEducationalGeometry: rows.filter((row) => row.status === 'PROCEDURAL_EDUCATIONAL_GEOMETRY').length,
    gltfAwaitingSource: rows.filter((row) => row.status === 'GLTF_ASSET_AWAITING_CAD_SOURCE').length,
    scientificAwaitingSource: rows.filter((row) => row.status === 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE').length,
  };
}

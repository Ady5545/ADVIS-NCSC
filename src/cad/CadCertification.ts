import type { ObjectMetadata } from '../SpatialLibrary';

export type CadCertificationStatus =
  | 'SOURCE_CAD_VERIFIED'
  | 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION'
  | 'PROCEDURAL_EDUCATIONAL_MODEL'
  | 'GLTF_ASSET_AWAITING_CAD_SOURCE'
  | 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE';

export interface CadValidationRecord {
  /** Hash of the exact source file that was validated (for example SHA-256). */
  sourceHash: string;
  sourceRevision: string;
  toolName: string;
  toolVersion: string;
  validatedAt: string;
  validator: string;
  reportPath: string;
  checks: {
    sourceParsed: boolean;
    topologyPassed: boolean;
    metricsPassed: boolean;
    assemblyStructurePassed: boolean;
    dimensionalDefinitionPresent: boolean;
  };
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
  /** Structured, reviewable evidence; a filename extension is never validation proof. */
  validationRecord?: CadValidationRecord;
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

function hasNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** CAD paths can be authored on Windows or POSIX; normalize separators before comparison. */
function normalizeSourcePath(path: string): string {
  return path.replace(/\\/g, '/');
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
  const recorded = obj.cadCertification;
  const validationRecord = recorded?.validationRecord;
  const checks = validationRecord?.checks;
  const hasValidRecord = Boolean(
    validationRecord &&
    hasNonEmptyText(validationRecord.sourceHash) &&
    hasNonEmptyText(validationRecord.sourceRevision) &&
    hasNonEmptyText(validationRecord.toolName) &&
    hasNonEmptyText(validationRecord.toolVersion) &&
    hasNonEmptyText(validationRecord.validator) &&
    hasNonEmptyText(validationRecord.reportPath) &&
    hasNonEmptyText(validationRecord.validatedAt) &&
    !Number.isNaN(Date.parse(validationRecord.validatedAt)) &&
    checks &&
    checks.sourceParsed === true &&
    checks.topologyPassed === true &&
    checks.metricsPassed === true &&
    checks.assemblyStructurePassed === true &&
    checks.dimensionalDefinitionPresent === true
  );
  const sourceHashMatchesEvidence = Boolean(
    validationRecord &&
    (obj.evidence?.sourceHash === undefined ||
      (hasNonEmptyText(obj.evidence.sourceHash) && obj.evidence.sourceHash === validationRecord.sourceHash))
  );
  const sourceRevisionMatchesEvidence = Boolean(
    validationRecord &&
    (obj.evidence?.revision === undefined ||
      (hasNonEmptyText(obj.evidence.revision) && obj.evidence.revision === validationRecord.sourceRevision))
  );
  const sameSource = Boolean(
    hasNonEmptyText(sourcePath) &&
    hasNonEmptyText(recorded?.sourcePath) &&
    normalizeSourcePath(sourcePath) === normalizeSourcePath(recorded.sourcePath) &&
    hasValidRecord &&
    sourceHashMatchesEvidence &&
    sourceRevisionMatchesEvidence
  );
  const fullyVerified = Boolean(
    hasCadSource &&
    recorded?.status === 'SOURCE_CAD_VERIFIED' &&
    recorded.exactBRepEvidence &&
    recorded.occtValidated &&
    recorded.topologyValidated &&
    recorded.metricsValidated &&
    recorded.assemblyStructureValidated &&
    recorded.dimensionalDefinitionPresent &&
    recorded.revisionControlled &&
    sameSource
  );

  if (fullyVerified && recorded) {
    return {
      ...recorded,
      status: 'SOURCE_CAD_VERIFIED',
      sourceFormat: extension === '.brep' || extension === '.brp' ? 'BREP' : extension === '.stp' ? 'STP' : 'STEP',
      sourcePath,
      validationRecord,
      limitations: [
        ...recorded.limitations,
        'Validation evidence supports only the documented checks and revision; it does not by itself establish approval for every engineering or manufacturing use.'
      ],
      nextRequiredEvidence: recorded.nextRequiredEvidence
    };
  }

  if (hasCadSource) {
    return {
      status: 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION',
      sourceFormat: extension === '.brep' || extension === '.brp' ? 'BREP' : extension === '.stp' ? 'STP' : 'STEP',
      sourcePath,
      exactBRepEvidence: false,
      occtValidated: false,
      topologyValidated: false,
      metricsValidated: false,
      assemblyStructureValidated: false,
      dimensionalDefinitionPresent: false,
      revisionControlled: false,
      validationRecord,
      limitations: [
        'A STEP/STP/BREP source path is present, but its contents and engineering authority have not been established by a recorded validation run.',
        'A CAD file extension is not evidence of successful parsing, topology validity, dimensional correctness, or manufacturing approval.'
      ],
      nextRequiredEvidence: [
        'Parse the exact source file using a documented CAD tool/version and record the source hash.',
        'Record topology, metrics, assembly-structure and dimensional-definition checks.',
        'Record source revision, validation date, reviewer and a report path.',
        'Obtain applicable engineering release/inspection approval before making purpose-specific certification claims.'
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
        'Provide authoritative STEP/STP/BREP source geometry if exact CAD is required.',
        'Import with a documented CAD tool and store validation evidence.',
        'Record revision and release/approval metadata.'
      ]
    };
  }

  const concept = isScientificConcept(obj.id, obj.category);
  return {
    status: concept ? 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE' : 'PROCEDURAL_EDUCATIONAL_MODEL',
    sourceFormat: 'PROCEDURAL',
    exactBRepEvidence: false,
    occtValidated: false,
    topologyValidated: false,
    metricsValidated: false,
    assemblyStructureValidated: false,
    dimensionalDefinitionPresent: false,
    revisionControlled: false,
    limitations: concept
      ? [
          'This is a scientific visualization/concept model, not an authoritative manufactured-part definition.',
          'CAD certification is not implied by procedural geometry.'
        ]
      : [
          'This is procedural educational geometry, not source CAD/B-rep.',
          'It may support learning and visualization but is not manufacturing-certified.'
        ],
    nextRequiredEvidence: concept
      ? ['Document the scientific source and intended educational abstraction.', 'Do not claim CAD certification unless a genuine CAD validation workflow applies.']
      : ['Provide authoritative source CAD if the intended use requires it.', 'Record geometry assumptions, revision and any validation performed.']
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
  const record = evidence.validationRecord;
  const checks = record?.checks;
  return (
    evidence.status === 'SOURCE_CAD_VERIFIED' &&
    hasNonEmptyText(record?.sourceHash) &&
    hasNonEmptyText(record?.sourceRevision) &&
    hasNonEmptyText(record?.toolName) &&
    hasNonEmptyText(record?.toolVersion) &&
    hasNonEmptyText(record?.validator) &&
    hasNonEmptyText(record?.reportPath) &&
    hasNonEmptyText(record?.validatedAt) &&
    !Number.isNaN(Date.parse(record?.validatedAt || '')) &&
    checks?.sourceParsed === true &&
    checks.topologyPassed === true &&
    checks.metricsPassed === true &&
    checks.assemblyStructurePassed === true &&
    checks.dimensionalDefinitionPresent === true &&
    evidence.revisionControlled &&
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
    proceduralEducationalModels: rows.filter((row) => row.status === 'PROCEDURAL_EDUCATIONAL_MODEL').length,
    sourceCadAwaitingValidation: rows.filter((row) => row.status === 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION').length,
    gltfAwaitingSource: rows.filter((row) => row.status === 'GLTF_ASSET_AWAITING_CAD_SOURCE').length,
    scientificAwaitingSource: rows.filter((row) => row.status === 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE').length,
  };
}

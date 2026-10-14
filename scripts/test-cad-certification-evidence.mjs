import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-cad-evidence-test-'));
const cadModule = join(temporaryDirectory, 'cad-certification.cjs');
const fidelityModule = join(temporaryDirectory, 'geometry-fidelity.cjs');
const VALID_HASH = 'sha256:unit-test-source-hash';
const VALID_REVISION = 'revision-3';

function makeValidationRecord(overrides = {}) {
  return {
    sourceHash: VALID_HASH,
    sourceRevision: VALID_REVISION,
    toolName: 'Open CASCADE Technology',
    toolVersion: '7.8.0-test',
    validatedAt: '2026-10-14T00:00:00.000Z',
    validator: 'Automated contract test',
    reportPath: 'reports/cad-validation/revision-3.json',
    checks: {
      sourceParsed: true,
      topologyPassed: true,
      metricsPassed: true,
      assemblyStructurePassed: true,
      dimensionalDefinitionPresent: true,
    },
    ...overrides,
  };
}

function makeVerifiedCandidate(overrides = {}) {
  const record = makeValidationRecord();
  const cadCertification = {
    status: 'SOURCE_CAD_VERIFIED',
    sourceFormat: 'STEP',
    sourcePath: 'C:/models/part.step',
    exactBRepEvidence: true,
    occtValidated: true,
    topologyValidated: true,
    metricsValidated: true,
    assemblyStructureValidated: true,
    dimensionalDefinitionPresent: true,
    revisionControlled: true,
    validationRecord: record,
    limitations: [],
    nextRequiredEvidence: [],
  };
  return {
    id: 'cad-evidence-contract-fixture',
    name: 'CAD evidence test fixture',
    path: '/models/cad-evidence-contract-fixture',
    assetPath: 'procedural/cad-evidence-contract-fixture',
    cadAssetPath: 'C:\\models\\part.step',
    modelStatus: 'AVAILABLE',
    category: 'Mechanical Engineering',
    description: 'Synthetic unit-test metadata. It is not an actual certified engineering asset.',
    defaultScale: 1,
    components: [],
    evidence: {
      geometryAuthority: 'SOURCE_CAD',
      sourceHash: VALID_HASH,
      revision: VALID_REVISION,
      dimensionsStatus: 'SOURCE_SUPPORTED',
      limitations: ['Unit-test fixture only.'],
    },
    capabilities: { deepZoom: true, interiorGeometry: true },
    cadCertification,
    ...overrides,
  };
}

try {
  await Promise.all([
    build({
      entryPoints: [resolve('src/cad/CadCertification.ts')],
      outfile: cadModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/cad/GeometryFidelity.ts')],
      outfile: fidelityModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const cad = require(cadModule);
  const fidelity = require(fidelityModule);

  // An absent or procedural CAD source never becomes verified merely because a user can inspect it.
  const procedural = {
    id: 'v8_engine',
    name: 'Representative V8',
    path: '/models/procedural/v8',
    assetPath: 'procedural/automotive/v8',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'Illustrative educational geometry.',
    defaultScale: 1,
    components: [],
  };
  assert.equal(cad.assessCadEvidence(procedural).status, 'PROCEDURAL_EDUCATIONAL_MODEL');
  assert.equal(fidelity.resolveObjectFidelity(procedural).authority, 'PROCEDURAL_HIGH_DETAIL');
  assert.equal(fidelity.resolveObjectFidelity(procedural).tier, 'L1');

  // A GLTF file remains a visual asset even if stale metadata tries to label it source-CAD verified.
  const gltf = makeVerifiedCandidate({
    assetPath: 'models/part.glb',
    cadAssetPath: undefined,
    cadCertification: {
      ...makeVerifiedCandidate().cadCertification,
      sourcePath: 'models/part.glb',
    },
  });
  assert.equal(cad.assessCadEvidence(gltf).status, 'GLTF_ASSET_AWAITING_CAD_SOURCE');
  assert.equal(fidelity.resolveObjectFidelity(gltf).authority, 'GLTF_ASSET');
  assert.equal(fidelity.resolveObjectFidelity(gltf).tier, 'L3');

  // A complete record is accepted only when its declared source path, source hash and revision agree.
  const verified = makeVerifiedCandidate();
  const assessment = cad.assessCadEvidence(verified);
  assert.equal(assessment.status, 'SOURCE_CAD_VERIFIED',
    'Matching, complete validation evidence should be accepted for its documented checks.');
  assert.equal(cad.isSourceCadVerified(assessment), true);
  const verifiedFidelity = fidelity.resolveObjectFidelity(verified);
  assert.equal(verifiedFidelity.authority, 'CAD_BREP');
  assert.equal(verifiedFidelity.tier, 'L4');
  assert.equal(verifiedFidelity.supportsDeepZoom, true);
  assert.equal(verifiedFidelity.supportsInteriorInspection, true);

  const mismatchedHash = makeVerifiedCandidate({
    evidence: {
      ...makeVerifiedCandidate().evidence,
      sourceHash: 'sha256:different-source-hash',
    },
  });
  assert.equal(cad.assessCadEvidence(mismatchedHash).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION',
    'An evidence hash mismatch must fail closed.');
  assert.equal(fidelity.resolveObjectFidelity(mismatchedHash).authority, 'CAD_SOURCE_UNVALIDATED');

  const mismatchedRevision = makeVerifiedCandidate({
    evidence: {
      ...makeVerifiedCandidate().evidence,
      revision: 'revision-4',
    },
  });
  assert.equal(cad.assessCadEvidence(mismatchedRevision).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION',
    'A validation record for another source revision must fail closed.');

  const mismatchedPath = makeVerifiedCandidate({
    cadCertification: {
      ...makeVerifiedCandidate().cadCertification,
      sourcePath: 'C:/models/other-part.step',
    },
  });
  assert.equal(cad.assessCadEvidence(mismatchedPath).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION',
    'A validation record for another source path must fail closed.');

  const incompleteChecks = makeVerifiedCandidate();
  incompleteChecks.cadCertification.validationRecord.checks.topologyPassed = false;
  assert.equal(cad.assessCadEvidence(incompleteChecks).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION',
    'Any failed validation check must block the verified state.');

  const malformedRecord = makeVerifiedCandidate();
  malformedRecord.cadCertification.validationRecord.checks = null;
  assert.doesNotThrow(() => cad.assessCadEvidence(malformedRecord),
    'Malformed validation evidence should fail closed rather than crash catalog inspection.');
  assert.equal(cad.assessCadEvidence(malformedRecord).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION');

  const missingHash = makeVerifiedCandidate();
  missingHash.cadCertification.validationRecord.sourceHash = '';
  assert.equal(cad.assessCadEvidence(missingHash).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION');

  const candidateWithoutRecord = {
    ...procedural,
    id: 'pending-step-cad',
    cadAssetPath: 'models/part.step',
  };
  assert.equal(cad.assessCadEvidence(candidateWithoutRecord).status, 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION');
  const pendingFidelity = fidelity.resolveObjectFidelity(candidateWithoutRecord);
  assert.equal(pendingFidelity.authority, 'CAD_SOURCE_UNVALIDATED');
  assert.equal(pendingFidelity.tier, 'L2');
  assert.equal(pendingFidelity.supportsDeepZoom, false);
  assert.equal(pendingFidelity.supportsInteriorInspection, false);

  const concept = { ...procedural, id: 'human_heart', category: 'Anatomy' };
  assert.equal(cad.assessCadEvidence(concept).status, 'SCIENTIFIC_GEOMETRY_AWAITING_CAD_SOURCE');
  assert.equal(fidelity.resolveObjectFidelity(concept).authority, 'SCIENTIFIC_STRUCTURAL');
  assert.equal(fidelity.resolveObjectFidelity(concept).tier, 'L1');

  const gltfComponent = fidelity.resolveComponentFidelity({ id: 'visual-mesh', name: 'Visual mesh', description: 'Test', position: [0, 0, 0], size: [1, 1, 1], explodedOffset: [1, 0, 0], shape: 'custom', assetPath: 'assets/model.gltf' });
  assert.equal(gltfComponent.authority, 'GLTF_ASSET');
  assert.equal(gltfComponent.supportsDeepZoom, false);
  assert.match(gltfComponent.detailLabel, /not independently validated/i);

  console.log('CAD evidence contract passed: path-separator normalization, source hash/revision binding, failed and malformed validation records, GLTF/procedural/concept states, and evidence-aware fidelity tiers.');
} catch (error) {
  console.error('CAD evidence contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

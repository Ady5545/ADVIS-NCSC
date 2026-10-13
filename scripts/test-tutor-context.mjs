import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { cleanContext } = require(resolve('api/advis.js'));

const refs = Array.from({ length: 7 }, (_, index) => ({
  label: `Reference ${index + 1}`,
  url: index === 1 ? 'javascript:alert(1)' : `https://example.org/reference-${index + 1}`,
  citation: 'catalog reference',
  applicability: 'EXACT_MODEL',
}));
const capabilities = {
  inspect: true,
  validatedSimulation: false,
  exportStep: true,
  pretendCapability: true,
  kinematics: 'yes',
};
const sanitized = cleanContext({
  activeWorkspace: 'ENGINEERING',
  activeSpatialObject: 'v8_engine',
  selectedComponentId: 'v8_block',
  activeModelEvidence: {
    id: 'v8_engine',
    name: 'V8 Engine',
    category: 'Mechanical Engineering',
    description: 'Educational engine assembly',
    modelKind: 'PROCEDURAL_EDUCATIONAL_MODEL',
    modelVersion: '1',
    unitSystem: 'SI',
    evidence: {
      geometryAuthority: 'PROCEDURAL',
      dimensionsStatus: 'UNSPECIFIED',
      simulationStatus: 'KINEMATIC',
      educationalLevel: 'HIGH_SCHOOL',
      references: refs,
      limitations: ['Illustrative geometry'],
    },
    capabilities,
    selectedComponent: {
      id: 'v8_block',
      name: 'Engine block',
      description: 'Main casting',
      specifications: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`spec-${i}`, `value-${i}`])),
    },
  },
});

assert.equal(sanitized.activeWorkspace, 'ENGINEERING');
assert.equal(sanitized.activeModelEvidence.id, 'v8_engine');
assert.equal(sanitized.activeModelEvidence.evidence.references.length, 5, 'reference list must be bounded');
assert.equal(sanitized.activeModelEvidence.evidence.references[1].url, '', 'non-http source URLs must be removed');
assert.equal(sanitized.activeModelEvidence.capabilities.inspect, true);
assert.equal(sanitized.activeModelEvidence.capabilities.validatedSimulation, false);
assert.equal('pretendCapability' in sanitized.activeModelEvidence.capabilities, false, 'unknown capability keys must be discarded');
assert.equal('kinematics' in sanitized.activeModelEvidence.capabilities, false, 'non-boolean capabilities must be discarded');
assert.equal(Object.keys(sanitized.activeModelEvidence.selectedComponent.specifications).length, 8, 'component specifications must be bounded');
assert.equal(sanitized.activeModelEvidence.evidence.limitations.length, 1);
assert.equal(cleanContext({ activeModelEvidence: 'not an object' }).activeModelEvidence, null);
assert.equal(cleanContext({ activeModelEvidence: { modelKind: 'MADE_UP', evidence: { simulationStatus: 'PERFECT' } } }).activeModelEvidence.modelKind, null);
assert.equal(cleanContext({ activeModelEvidence: { modelKind: 'MADE_UP', evidence: { simulationStatus: 'PERFECT' } } }).activeModelEvidence.evidence.simulationStatus, null);

console.log('Tutor context tests passed: bounded evidence, source URL filtering, capability allowlist, component spec limits and invalid-input handling.');

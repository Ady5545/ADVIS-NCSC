import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { cleanContext } = require(resolve('api/advis.js'));
const { buildContextSummary } = require(resolve('ButlerEngine.js'));

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

const typedContext = cleanContext({
  selectedComponentId: 'v8_crankshaft',
  activeModelTutorContext: {
    modelId: 'v8_engine',
    modelName: 'Representative V8',
    modelVersion: '1.0-educational',
    domain: 'Automotive',
    selectedComponentId: 'v8_crankshaft',
    selectedComponentName: 'Crankshaft',
    selectedComponentPurpose: 'Convert linked piston travel to rotation.',
    simulationLevel: 'KINEMATIC',
    evidence: [
      { id: 'ref-1', label: 'General engine principle', kind: 'SOURCE_BACKED', detail: 'General principle only', sourceUrl: 'https://example.org/engine', applicability: 'GENERAL_PRINCIPLE' },
      { id: 'fake', label: 'Bad URL', kind: 'UNKNOWN', detail: 'Untrusted', sourceUrl: 'javascript:alert(1)', applicability: 'EXACT_MODEL' },
      { id: 'fake2', label: 'Bad kind', kind: 'ADMINISTRATOR_VERIFIED', detail: 'Trust me', sourceUrl: 'http://example.org/unsecured', applicability: 'EXACT_MODEL' },
    ],
    relationships: [
      { componentId: 'v8_block', name: 'Engine block', relationship: 'supports', description: 'Supports the crankshaft.' },
      { componentId: 'v8_crankshaft', name: 'Crankshaft', relationship: 'drives', description: 'Driven by connecting rod force.' },
    ],
    parameters: [
      { id: 'rpm', name: 'Engine speed', unit: 'rpm', value: 1200, description: 'Animation input.' },
      { id: 'malformed', name: 'NaN', unit: '', value: 'not a number', description: 'Must be dropped.' },
    ],
    limitations: ['Generic educational geometry'],
    safeActions: ['SELECT_COMPONENT', 'FOCUS_COMPONENT', 'EXECUTE_CODE', 'SET_EXPLOSION'],
  },
});
assert.equal(typedContext.activeModelTutorContext.modelId, 'v8_engine');
assert.equal(typedContext.activeModelTutorContext.evidence.length, 3);
assert.equal(typedContext.activeModelTutorContext.evidence[0].sourceUrl, 'https://example.org/engine');
assert.equal(typedContext.activeModelTutorContext.evidence[1].sourceUrl, '', 'javascript URLs must be discarded');
assert.equal(typedContext.activeModelTutorContext.evidence[2].kind, 'UNKNOWN', 'unknown evidence kinds must fail closed');
assert.equal(typedContext.activeModelTutorContext.evidence[2].sourceUrl, '', 'non-HTTPS tutor context URLs must be discarded');
assert.equal(typedContext.activeModelTutorContext.parameters.length, 1, 'non-finite or non-numeric parameter values must be discarded');
assert.deepEqual(typedContext.activeModelTutorContext.safeActions, ['SELECT_COMPONENT', 'FOCUS_COMPONENT', 'SET_EXPLOSION']);
assert.equal(typedContext.activeModelTutorContext.relationships.length, 2);

const contextSummary = buildContextSummary(typedContext, null, [], []);
assert.match(contextSummary, /Typed Tutor Context/);
assert.match(contextSummary, /General engine principle/);
assert.match(contextSummary, /Allowed Suggested UI Actions: SELECT_COMPONENT, FOCUS_COMPONENT, SET_EXPLOSION/);
assert.doesNotMatch(contextSummary, /EXECUTE_CODE/);
assert.doesNotMatch(contextSummary, /javascript:alert\\(1\\)/, 'unsafe URL must not appear in tutor prompt');

console.log('Tutor context tests passed: bounded source evidence, allowlisted model capabilities, typed component/parameter context, safe action types and invalid-input handling.');

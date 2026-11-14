import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  normalizeCompoundInput,
  normalizeCompoundName,
  findExactCompoundNameMatches,
  isMolecularFormula,
  normalizeElementSymbol,
  buildStructureResult,
  assertValidStructureResult,
  validateMolecularGraph
} from '../shared/chemistry-contract.mjs';

const require = createRequire(import.meta.url);
const chemistryApi = require('../api/chemistry.js');

function atomLine(x, y, z, element, chargeCode = 0, parity = 0) {
  const coordinates = [x, y, z].map(value => Number(value).toFixed(4).padStart(10)).join('');
  return coordinates + ' ' + element.padEnd(3) + ' 0' +
    String(chargeCode).padStart(3) + String(parity).padStart(3) +
    '  0  0  0  0  0  0  0  0  0  0';
}

function bondLine(atomA, atomB, order, stereo = 0) {
  return String(atomA).padStart(3) + String(atomB).padStart(3) +
    String(order).padStart(3) + String(stereo).padStart(3) + '  0  0';
}

function makeWaterSdf() {
  return [
    'ADVIS WATER FIXTURE',
    'ADVIS Chemistry Resolver Tests',
    '',
    '  3  2  0  0  0  0            999 V2000',
    atomLine(0, 0, 0, 'O', 0, 1),
    atomLine(0.96, 0, 0, 'H'),
    atomLine(-0.24, 0.93, 0, 'H'),
    bondLine(1, 2, 1),
    bondLine(1, 3, 1),
    'M  END',
    '$$$$',
    ''
  ].join('\n');
}

function makeChargedIsotopeSdf() {
  return [
    'ADVIS ISOTOPE FIXTURE',
    'ADVIS Chemistry Resolver Tests',
    '',
    '  2  1  0  0  0  0            999 V2000',
    atomLine(0, 0, 0, 'O', 0, 1),
    atomLine(1.2, 0, 0, 'H'),
    bondLine(1, 2, 1, 1),
    'M  CHG  1   1  -1',
    'M  ISO  1   2  18',
    'M  END',
    '$$$$',
    ''
  ].join('\n');
}

function makeV3000Sdf() {
  return [
    'ADVIS V3000 FIXTURE',
    'ADVIS Chemistry Resolver Tests',
    '',
    '  0  0  0     0  0            999 V3000',
    'M  V30 BEGIN CTAB',
    'M  V30 COUNTS 2 1 0 0 0',
    'M  V30 BEGIN ATOM',
    'M  V30 1 Co 0.0000 0.0000 0.0000 0 CHG=2 MASS=59 CFG=1',
    'M  V30 2 C 1.9000 0.0000 0.0000 0',
    'M  V30 END ATOM',
    'M  V30 BEGIN BOND',
    'M  V30 1 4 1 2 CFG=1',
    'M  V30 END BOND',
    'M  V30 END CTAB',
    'M  END',
    '$$$$',
    ''
  ].join('\n');
}

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return body; },
    end() { return this; }
  };
}

function makePubChemJsonFetch(sdf, cids = [962], overrides = {}) {
  return async (url, options = {}) => {
    const target = String(url);
    if (target.includes('/compound/name/water/cids/JSON')) {
      return new Response(JSON.stringify({ IdentifierList: { CID: cids } }), { status: 200 });
    }
    if (target.includes('/compound/fastformula/C2H6O/cids/JSON')) {
      return new Response(JSON.stringify({ IdentifierList: { CID: cids } }), { status: 200 });
    }
    if (target.includes('/compound/cid/1,2/property/')) {
      return new Response(JSON.stringify({
        PropertyTable: { Properties: [
          { CID: 1, IUPACName: 'candidate one', MolecularFormula: 'C2H6O', MolecularFormulaNoCharge: 'C2H6O', Charge: 0 },
          { CID: 2, IUPACName: 'candidate two', MolecularFormula: 'C2H6O', MolecularFormulaNoCharge: 'C2H6O', Charge: 0 }
        ] }
      }), { status: 200 });
    }
    if (target.includes('/compound/cid/962/property/')) {
      return new Response(JSON.stringify({
        PropertyTable: { Properties: [{
          CID: 962,
          IUPACName: 'oxidane',
          MolecularFormula: overrides.formula || 'H2O',
          MolecularFormulaNoCharge: overrides.formulaNoCharge || overrides.formula || 'H2O',
          Charge: overrides.charge ?? 0,
          CanonicalSMILES: 'O',
          IsomericSMILES: 'O',
          InChI: 'InChI=1S/H2O/h1H2',
          InChIKey: 'XLYOFNOQVPJJNP-UHFFFAOYSA-N'
        }] }
      }), { status: 200 });
    }
    if (target.includes('/compound/cid/962/SDF?record_type=3d')) {
      if (overrides.missing3d) return new Response('not found', { status: 404 });
      return new Response(sdf, { status: 200 });
    }
    if (target.includes('/compound/cid/962/SDF?record_type=3d-missing')) {
      return new Response('not found', { status: 404 });
    }
    if (options.method === 'POST' && target.includes('/compound/inchi/cids/JSON')) {
      return new Response(JSON.stringify({ IdentifierList: { CID: [962] } }), { status: 200 });
    }
    throw new Error('Unexpected PubChem mock request: ' + target);
  };
}

async function run() {
  // Identifier normalization: names remain names; formula-only and explicit structure IDs stay typed.
  assert.equal(normalizeCompoundInput('  Water  ').kind, 'name');
  assert.equal(normalizeCompoundInput('Vitamin B12').kind, 'name');
  assert.equal(normalizeCompoundInput('C6H12O6').kind, 'formula');
  assert.equal(normalizeCompoundInput('Formula: Ca(OH)2').kind, 'formula');
  assert.equal(normalizeCompoundInput('CID:2244').identifier, '2244');
  assert.equal(normalizeCompoundInput('CID 2244').identifier, '2244');
  assert.equal(normalizeCompoundInput('PubChem CID 2244').identifier, '2244');
  assert.equal(normalizeCompoundInput('C₂H₆O').identifier, 'C2H6O');
  assert.equal(normalizeCompoundInput('Ethanol').lookupKey, 'ethanol');
  assert.equal(normalizeCompoundName('  D–Glucose  '), 'd-glucose');
  const localNameCandidates = findExactCompoundNameMatches([
    { name: 'Water', iupacName: 'Oxidane' },
    { name: 'Water', iupacName: 'Aqua' },
    { name: 'Ethanol', iupacName: 'Ethyl alcohol' }
  ], ' WATER ');
  assert.equal(localNameCandidates.length, 2);
  assert.equal(findExactCompoundNameMatches([{ name: 'Ethanol' }], 'ethan').length, 0);
  assert.throws(() => normalizeCompoundInput('x'.repeat(221)), /220-character/);
  assert.throws(() => normalizeCompoundInput('SMILES:'), /empty/);
  assert.equal(normalizeCompoundInput('SMILES: CCO').kind, 'smiles');
  assert.equal(normalizeCompoundInput('InChI=1S/H2O/h1H2').kind, 'inchi');
  assert.equal(normalizeCompoundInput('XLYOFNOQVPJJNP-UHFFFAOYSA-N').kind, 'inchikey');
  assert.equal(isMolecularFormula('Ca(OH)2'), true);
  assert.equal(isMolecularFormula('C2H5OH'), true);
  assert.equal(isMolecularFormula('CuSO4·5H2O'), true);
  assert.equal(isMolecularFormula('Fe3+'), true);
  assert.equal(isMolecularFormula('C6'), true);
  assert.equal(isMolecularFormula('VitaminB12'), false);
  assert.equal(normalizeElementSymbol('cl'), 'Cl');
  assert.equal(normalizeElementSymbol('NA'), 'Na');
  assert.equal(normalizeElementSymbol('co'), 'Co');
  assert.equal(normalizeElementSymbol('Xx'), null);

  // The API parser has its own V2000/V3000 element normalizer; test it directly too.
  assert.equal(chemistryApi.normalizeElementSymbol('o'), 'O');
  assert.equal(chemistryApi.normalizeElementSymbol('h'), 'H');
  assert.equal(chemistryApi.normalizeElementSymbol('cl'), 'Cl');
  assert.equal(chemistryApi.normalizeElementSymbol('co'), 'Co');
  assert.equal(chemistryApi.normalizeElementSymbol('Xx'), null);

  // Graph validation checks identities, elements, coordinates, bonds and disconnected components.
  const validWater = {
    atoms: [
      { id: 'o', element: 'O', x: 0, y: 0, z: 0, charge: 0 },
      { id: 'h1', element: 'H', x: 0.96, y: 0, z: 0, charge: 0 },
      { id: 'h2', element: 'H', x: -0.24, y: 0.93, z: 0, charge: 0 }
    ],
    bonds: [
      { id: 'b1', atomA: 'o', atomB: 'h1', order: 1, type: 'covalent' },
      { id: 'b2', atomA: 'o', atomB: 'h2', order: 1, type: 'covalent' }
    ]
  };
  const graphCheck = validateMolecularGraph(validWater, { formula: 'H2O', formalCharge: 0 });
  assert.equal(graphCheck.valid, true);
  assert.equal(graphCheck.formulaFromGraph, 'H2O');
  assert.equal(graphCheck.formulaConsistent, true);
  assert.equal(graphCheck.chargeConsistent, true);
  assert.equal(graphCheck.connectedComponents, 1);

  // Equivalent formula spellings compare by composition, not literal text.
  const ethanolGraph = {
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'c2', element: 'C', x: 1.5, y: 0, z: 0 },
      { id: 'o', element: 'O', x: 2.9, y: 0, z: 0 },
      ...Array.from({ length: 6 }, (_, i) => ({ id: 'h' + i, element: 'H', x: i + 4, y: 1, z: 0 }))
    ],
    bonds: []
  };
  assert.equal(validateMolecularGraph(ethanolGraph, { formula: 'C2H5OH' }).formulaConsistent, true);
  const formulaMismatch = validateMolecularGraph(validWater, { formula: 'H2O2' });
  assert.equal(formulaMismatch.valid, false);
  assert.ok(formulaMismatch.errors.some(error => error.includes('does not match the source formula')));
  const chargeMismatch = validateMolecularGraph(validWater, { formula: 'H2O', formalCharge: 1 });
  assert.equal(chargeMismatch.valid, false);
  assert.ok(chargeMismatch.errors.some(error => error.includes('does not match the source charge')));

  const fragmented = validateMolecularGraph({
    atoms: [
      { id: 'na', element: 'Na', x: 0, y: 0, z: 0 },
      { id: 'cl', element: 'Cl', x: 2, y: 0, z: 0 }
    ],
    bonds: []
  }, { formula: 'NaCl' });
  assert.equal(fragmented.valid, true);
  assert.equal(fragmented.connectedComponents, 2);
  assert.deepEqual(fragmented.componentAtomCounts, [1, 1]);
  assert.deepEqual(fragmented.componentFormulas, ['Na', 'Cl']);
  assert.ok(fragmented.warnings.some(warning => warning.includes('disconnected components')));

  const invalidGraphs = [
    { atoms: [{ id: 'a', element: 'Xx', x: 0, y: 0, z: 0 }], bonds: [] },
    { atoms: [{ id: 'a', element: 'C', x: NaN, y: 0, z: 0 }], bonds: [] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }], bonds: [{ id: 'b', atomA: 'a', atomB: 'missing', order: 1, type: 'covalent' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }], bonds: [{ id: 'b', atomA: 'a', atomB: 'a', order: 1, type: 'covalent' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }], bonds: [{ id: 'b', atomA: 'a', atomB: 'a2', order: 5, type: 'covalent' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }, { id: 'b', element: 'C', x: 0, y: 0, z: 0 }], bonds: [{ id: 'b1', atomA: 'a', atomB: 'b', order: 1, type: 'covalent' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }, { id: 'b', element: 'C', x: 1, y: 0, z: 0 }], bonds: [{ id: 'b1', atomA: 'a', atomB: 'b', order: 1.5, type: 'covalent' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }, { id: 'b', element: 'C', x: 1, y: 0, z: 0 }], bonds: [{ id: 'b1', atomA: 'a', atomB: 'b', order: 1, type: 'unsupported' }] },
    { atoms: [{ id: 'a', element: 'C', x: 0, y: 0, z: 0 }, { id: 'b', element: 'C', x: 1, y: 0, z: 0 }], bonds: [{ id: 'b1', atomA: 'a', atomB: 'b', order: 1, type: 'covalent' }, { id: 'b1', atomA: 'a', atomB: 'b', order: 1, type: 'covalent' }] }
  ];
  for (const graph of invalidGraphs) {
    assert.equal(validateMolecularGraph(graph).valid, false);
  }

  // Structure contract retains isotope/stereo/provenance and normalizes measured bond lengths.
  const contractResult = assertValidStructureResult(buildStructureResult({
    identity: { query: 'water', name: 'Water', formula: 'H2O' },
    graph: validWater,
    coordinates: { dimension: 3, kind: 'source_3d', origin: 'source_supplied', units: 'angstrom', method: 'test source conformer' },
    provenance: {
      provider: 'fixture',
      providerLabel: 'Test fixture',
      evidence: 'source_record',
      sourceId: 'fixture-1',
      retrievedAt: new Date().toISOString(),
      sourceAtomCount: 3,
      sourceBondCount: 2
    }
  }));
  assert.equal(contractResult.schemaVersion, '1.1.0');
  assert.equal(contractResult.status, 'VALID');
  assert.equal(contractResult.coordinates.origin, 'source_supplied');
  assert.equal(contractResult.provenance.evidence, 'source_record');
  assert.equal(contractResult.validation.formulaConsistent, true);
  assert.equal(contractResult.validation.chargeConsistent, true);
  assert.ok(contractResult.graph.bonds[0].length > 0.9);

  // SDF parser: V2000, charges, isotopes and bond stereo.
  const v2000 = chemistryApi.parseSdf(makeChargedIsotopeSdf());
  assert.equal(v2000.atoms[0].charge, -1);
  assert.equal(v2000.atoms[1].isotope, 18);
  assert.equal(v2000.bonds[0].stereo, 'UP');
  assert.equal(v2000.atoms[0].metadata.stereoEncoding, 'V2000 atom parity');
  assert.equal(v2000.bonds[0].metadata.stereoEncoding, 'V2000 bond stereo');
  assert.equal(v2000.bonds[0].sourceIndex, 1);
  assert.equal(v2000.sourceFormat, 'V2000');

  // SDF parser: V3000, two-letter elements, isotope, formal charge, aromaticity and CFG data.
  const v3000 = chemistryApi.parseSdf(makeV3000Sdf());
  assert.equal(v3000.atoms[0].element, 'Co');
  assert.equal(v3000.atoms[0].charge, 2);
  assert.equal(v3000.atoms[0].isotope, 59);
  assert.equal(v3000.atoms[0].stereo, 'V3000_CFG_1');
  assert.equal(v3000.bonds[0].type, 'aromatic');
  assert.equal(v3000.bonds[0].order, 1.5);
  assert.equal(v3000.bonds[0].stereo, 'V3000_CFG_1');
  assert.equal(v3000.atoms[0].metadata.stereoEncoding, 'V3000 atom CFG');
  assert.equal(v3000.bonds[0].metadata.stereoEncoding, 'V3000 bond CFG');
  assert.equal(v3000.bonds[0].sourceIndex, 1);
  assert.equal(v3000.sourceFormat, 'V3000');

  // PubChem resolver returns the same versioned contract rather than a loose graph payload.
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = makePubChemJsonFetch(makeWaterSdf(), [962]);
    const response = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'water' } },
      response
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.schemaVersion, '1.1.0');
    assert.equal(response.body.identity.cid, 962);
    assert.equal(response.body.identity.formalCharge, 0);
    assert.equal(response.body.coordinates.kind, 'source_3d');
    assert.equal(response.body.coordinates.origin, 'source_supplied');
    assert.equal(response.body.provenance.provider, 'pubchem');
    assert.equal(response.body.provenance.evidence, 'source_record');
    assert.equal(response.body.graph.metadata.sourceFormat, 'V2000');
    assert.equal(response.body.graph.atoms.length, 3);
    assert.equal(response.body.graph.bonds.length, 2);
    assert.equal(response.body.graph.bonds[0].sourceIndex, 1);
    assert.equal(response.body.validation.valid, true);
    assert.equal(response.body.validation.formulaConsistent, true);
    assert.equal(response.body.validation.chargeConsistent, true);

    // Formula-only searches never choose silently when PubChem returns multiple identities.
    globalThis.fetch = makePubChemJsonFetch(makeWaterSdf(), [1, 2]);
    const ambiguousResponse = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'C2H6O' } },
      ambiguousResponse
    );
    assert.equal(ambiguousResponse.statusCode, 409);
    assert.equal(ambiguousResponse.body.candidates.length, 2);
    assert.match(ambiguousResponse.body.error, /will not guess/i);

    // Ambiguous names are also returned as candidates rather than silently selecting one.
    const ambiguousNameResponse = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'water' } },
      ambiguousNameResponse
    );
    assert.equal(ambiguousNameResponse.statusCode, 409);
    assert.equal(ambiguousNameResponse.body.candidates.length, 2);

    // A source formula/charge mismatch is rejected, not downgraded to a warning.
    globalThis.fetch = makePubChemJsonFetch(makeWaterSdf(), [962], { formulaNoCharge: 'H2O2' });
    const invalidSourceResponse = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'water' } },
      invalidSourceResponse
    );
    assert.equal(invalidSourceResponse.statusCode, 422);
    assert.match(invalidSourceResponse.body.error, /does not match the source formula/i);

    // Missing source 3D data remains unsupported; no coordinates are fabricated.
    globalThis.fetch = makePubChemJsonFetch(makeWaterSdf(), [962], { missing3d: true });
    const missingConformerResponse = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'water' } },
      missingConformerResponse
    );
    assert.equal(missingConformerResponse.statusCode, 422);
    assert.match(missingConformerResponse.body.error, /no source-supplied 3D conformer/i);

    // Oversized identifiers are rejected as client input errors rather than truncated.
    const oversizedResponse = createResponse();
    await chemistryApi(
      { method: 'POST', headers: {}, body: { query: 'x'.repeat(221) } },
      oversizedResponse
    );
    assert.equal(oversizedResponse.statusCode, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('Chemistry resolver tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

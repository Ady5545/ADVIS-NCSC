import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-v8-hierarchy-contract-'));
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');
const hierarchyModule = join(temporaryDirectory, 'component-hierarchy.cjs');

function flattenTree(nodes, parentComponentId = null, records = []) {
  for (const node of nodes) {
    const currentComponentId = node.kind === 'component' ? node.id : parentComponentId;
    if (node.kind === 'component') {
      records.push({ id: node.id, parentId: parentComponentId });
    }
    flattenTree(node.children || [], currentComponentId, records);
  }
  return records;
}

function assertParent(records, childId, expectedParentId) {
  const row = records.find((record) => record.id === childId);
  assert.ok(row, 'Component "' + childId + '" must appear in the V8 hierarchy tree.');
  assert.equal(row.parentId, expectedParentId,
    'Component "' + childId + '" must be nested under "' + expectedParentId + '".');
}

try {
  await Promise.all([
    build({
      entryPoints: [resolve('src/SpatialLibrary.ts')],
      outfile: spatialModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/models/assemblies/ComponentHierarchy.ts')],
      outfile: hierarchyModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(spatialModule);
  const { buildComponentHierarchy, validateComponentHierarchy, resolveVisibleComponentIds } = require(hierarchyModule);
  const v8 = SPATIAL_LIBRARY.v8_engine;

  assert.ok(v8, 'The V8 benchmark model must exist.');
  assert.equal(v8.components.length, 22, 'The V8 benchmark catalog should retain all 22 component records.');

  const issues = validateComponentHierarchy(v8);
  assert.deepEqual(issues, [], 'The V8 parent/child relationships must pass hierarchy validation.');

  const roots = buildComponentHierarchy(v8);
  const rows = flattenTree(roots);
  assert.equal(rows.length, v8.components.length,
    'Every V8 component must appear exactly once in the navigable hierarchy.');
  assert.equal(new Set(rows.map((row) => row.id)).size, v8.components.length,
    'The V8 tree must not duplicate component nodes.');

  assertParent(rows, 'v8_block', null);
  assertParent(rows, 'v8_crankshaft', 'v8_block');
  assertParent(rows, 'v8_head_a', 'v8_block');
  assertParent(rows, 'v8_head_b', 'v8_block');
  assertParent(rows, 'v8_valve_cover_a', 'v8_head_a');
  assertParent(rows, 'v8_valve_cover_b', 'v8_head_b');
  assertParent(rows, 'v8_exhaust_a', 'v8_head_a');
  assertParent(rows, 'v8_exhaust_b', 'v8_head_b');
  assertParent(rows, 'v8_fuel_system', 'v8_intake');
  assertParent(rows, 'v8_flywheel', 'v8_crankshaft');


  // Malformed assemblies must be diagnosed explicitly instead of appearing as valid trees.
  const fixtureComponent = (id, overrides = {}) => ({
    id,
    name: id,
    description: 'Synthetic hierarchy-test fixture.',
    position: [0, 0, 0],
    size: [1, 1, 1],
    explodedOffset: [0, 0, 0],
    shape: 'box',
    ...overrides,
  });
  const assertIssue = (components, expectedCode, label) => {
    const issuesForFixture = validateComponentHierarchy({ components });
    assert.ok(
      issuesForFixture.some((issue) => issue.code === expectedCode),
      label + ' should be flagged as ' + expectedCode + '; got ' +
        JSON.stringify(issuesForFixture.map((issue) => issue.code)),
    );
  };

  assertIssue(
    [fixtureComponent('duplicate'), fixtureComponent('duplicate')],
    'DUPLICATE_ID',
    'Duplicate component IDs',
  );
  assertIssue(
    [fixtureComponent('orphan', { parentId: 'missing-parent' })],
    'MISSING_PARENT',
    'Missing parent references',
  );
  assertIssue(
    [fixtureComponent('self', { parentId: 'self' })],
    'SELF_PARENT',
    'Self-parent relationships',
  );
  assertIssue(
    [fixtureComponent('parent', { childrenIds: ['missing-child'] })],
    'MISSING_CHILD',
    'Dangling child references',
  );
  assertIssue(
    [
      fixtureComponent('declared-parent', { childrenIds: ['child'] }),
      fixtureComponent('actual-parent'),
      fixtureComponent('child', { parentId: 'actual-parent' }),
    ],
    'PARENT_CHILD_MISMATCH',
    'Contradictory parent/child declarations',
  );
  assertIssue(
    [
      fixtureComponent('cycle-a', { parentId: 'cycle-b' }),
      fixtureComponent('cycle-b', { parentId: 'cycle-a' }),
    ],
    'CYCLE',
    'Cyclic parent relationships',
  );


  const visibilityFixture = [
    fixtureComponent('root', { subsystemId: 'Powertrain', childrenIds: ['branch', 'sibling'] }),
    fixtureComponent('branch', { subsystemId: 'Powertrain', parentId: 'root', childrenIds: ['leaf'] }),
    fixtureComponent('leaf', { subsystemId: 'Powertrain', parentId: 'branch' }),
    fixtureComponent('sibling', { subsystemId: 'Powertrain', parentId: 'root' }),
    fixtureComponent('other', { subsystemId: 'Electrical' }),
  ];
  const fixtureBeforeVisibilityChecks = JSON.stringify(visibilityFixture);
  const visibleIds = (hiddenIds = [], isolateId = null) =>
    [...resolveVisibleComponentIds({ components: visibilityFixture }, hiddenIds, isolateId)].sort();

  assert.deepEqual(
    visibleIds(),
    ['branch', 'leaf', 'other', 'root', 'sibling'],
    'All components should be visible in the normal assembled state.',
  );
  assert.deepEqual(
    visibleIds(['branch']),
    ['other', 'root', 'sibling'],
    'Hiding a parent subsystem component must also hide every descendant.',
  );
  assert.deepEqual(
    visibleIds([], 'root'),
    ['branch', 'leaf', 'root', 'sibling'],
    'Isolating a parent must keep its subtree while hiding unrelated components.',
  );
  assert.deepEqual(
    visibleIds([], 'branch'),
    ['branch', 'leaf'],
    'Isolating a nested component must keep its descendants, but not its ancestors or siblings.',
  );
  assert.deepEqual(
    visibleIds(['branch'], 'root'),
    ['root', 'sibling'],
    'Explicitly hidden descendants must stay hidden when an ancestor is isolated.',
  );
  assert.deepEqual(
    visibleIds(['root'], 'branch'),
    ['branch', 'leaf'],
    'Explicitly isolating a child must reveal its subtree even if an ancestor was hidden.',
  );
  assert.deepEqual(
    visibleIds([], 'no-such-component'),
    ['branch', 'leaf', 'other', 'root', 'sibling'],
    'A stale isolation ID must fail open to normal visibility, not blank the assembly.',
  );
  assert.equal(
    JSON.stringify(visibilityFixture),
    fixtureBeforeVisibilityChecks,
    'Visibility resolution must not mutate the canonical component hierarchy.',
  );

  console.log('V8 hierarchy contract passed: 22 unique components, validated parent/child references, and nested head, intake, crankshaft, and block relationships.');
} catch (error) {
  console.error('V8 hierarchy contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

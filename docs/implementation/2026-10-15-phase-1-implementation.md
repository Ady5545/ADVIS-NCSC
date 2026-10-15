# Phase 1 Implementation Report — 15 October 2026

**Repository:** `Ady5545/ADVIS-NCSC`  
**Baseline:** `main` at `114bd67311dd2bb3ca898333e96f5ad6cb54c18f`  
**Scope:** First implementation tranche of the deep implementation plan: baseline discipline and model-trust contracts.

## Implemented in this pull request

1. **CAD verification fails closed.** A CAD filename extension, renderer type, or optimistic status flag is not enough to claim validation. The evidence assessment requires a complete validation record with non-empty fields, a parseable timestamp, and explicit successful parse, topology, metrics, assembly-structure and dimensional-definition checks.
2. **Evidence is tied to the intended source.** Windows and POSIX path separators are normalized before comparison. Where a model declares source hash and revision metadata, the validation record must match them. A mismatch prevents the verified status.
3. **Malformed evidence remains inspectable.** Missing or malformed nested check data is treated as unverified instead of crashing a catalog/fidelity inspection.
4. **Regression tests are part of the normal catalog gate.** `npm run validate:catalog` runs both the model-catalog validator and the new CAD evidence contract tests. Cases cover a matching synthetic validation fixture, path/hash/revision mismatches, failed checks, malformed records, procedural geometry, scientific-concept geometry, GLTF assets and fidelity capabilities.
5. **Baseline evidence remains separate from release claims.** The accompanying 14 October report is retained as a point-in-time snapshot; this report records the current implementation tranche.

## Validation evidence

- The earlier isolated CAD-evidence candidate (`3a48954497f461543f60ae3702580dcad51a2b68`) passed the recorded GitHub Actions catalog/learning-contract/TypeScript/production-build check.
- This pull request's updated head must pass GitHub Actions again; prior success is not reused as evidence for the changed commit.
- These tests use synthetic fixture metadata. They do **not** prove that any actual catalog model is CAD-certified.
- The repository's static validation and production build do not replace a real browser interaction check.

## Deployment and browser limitation

The Vercel project inspection call was denied with HTTP 403 because the current connection does not have access to the project's `ady19` scope. The protected preview therefore has not been visually verified in this tranche. No V8 exploded-view, reassembly, motion, or audio behavior is marked as production-verified.

## Out of scope for this tranche

The V8/V12 transform and explosion contract, staged disassembly hierarchy, V8 model visual work, audio behavior, guided-lesson effectiveness, reusable workspace controls, editable projects and wider domain expansion remain follow-on stages. They must be implemented and tested in later increments rather than being declared complete here.

## Acceptance gate

- The current PR head passes catalog validation, CAD evidence regression tests, the configured learning contracts, TypeScript checks and production build.
- Failed or mismatched CAD evidence cannot produce a verified status.
- No unsupported manufacturing/CAD certification claim is introduced.
- Live browser verification remains explicitly open until an authorized preview can be inspected.

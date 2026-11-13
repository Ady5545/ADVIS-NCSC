# ADVIS Chemistry — Structure Coverage Fix Plan

**Scope:** Structure lookup, source-record parsing, validation, and display reliability only.  
**Out of scope:** Workstation redesign, lesson changes, editing/export features, proteins, and unrelated engines.

## Goal

Make ADVIS reliably display structures for supported classroom compounds when a trustworthy structure source exists. Fix false failures such as citric acid, improve error handling, and never fill missing scientific data with invented coordinates.

## Work items

1. **Repair source-record parsing**
   - Normalize element symbols consistently in the server-side SDF parser.
   - Handle PubChem V2000/V3000 records, atom/bond counts, charges, isotopes, aromatic bonds, and stereo annotations.
   - Return a useful, specific validation reason when a source record cannot be parsed.

2. **Make source conformer retrieval dependable**
   - Resolve the compound identity first and preserve its CID and source metadata.
   - Request the source 3D record and validate the complete graph before rendering.
   - Distinguish “not found”, “no source 3D conformer”, “malformed source record”, and “unsupported representation”.
   - Never treat a 2D record as 3D or silently generate coordinates.

3. **Add targeted regression coverage**
   - Keep water as the parser/API baseline.
   - Add parser coverage for multi-letter element symbols, charges, isotopes, aromaticity, and stereochemistry.
   - Add a citric-acid source-record regression using a captured, source-attributed PubChem record once the exact record is verified.
   - Confirm ambiguous identities remain explicit choices rather than silently selected compounds.

4. **Verify the user-visible result**
   - Confirm the accepted atom and bond counts match the source.
   - Confirm source provenance and coordinate type survive into the molecular session.
   - Run chemistry tests, TypeScript validation, production build, and the focused structure-opening smoke test.

## Acceptance criteria

- Citric acid loads when its valid PubChem 3D SDF record is returned.
- No malformed or incomplete graph reaches the renderer.
- Unsupported or unavailable structures receive an accurate reason, not a generic parser failure.
- No invented atoms, bonds, charges, stereochemistry, or coordinates.
- Existing chemistry UI and guided lessons remain unchanged.

## Current boundary

This pass targets reliable ingestion and display of supported educational compounds. It does not promise universal coverage or add a fallback that fabricates 3D geometry. Compounds without a trustworthy supported 3D source remain clearly marked as unavailable until a separately validated chemistry geometry provider is evaluated.

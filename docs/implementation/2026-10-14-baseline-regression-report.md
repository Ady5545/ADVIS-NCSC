# ADVIS-NCSC Implementation Baseline & Regression Report

**Snapshot date:** 14 October 2026  
**Repository:** `Ady5545/ADVIS-NCSC`  
**Recorded main baseline:** `114bd67311dd2bb3ca898333e96f5ad6cb54c18f`  
**Working rule:** preserve the existing architecture; make small, auditable changes; treat engineering/CAD claims as evidence-backed; do not infer live deployment health from CI alone.

## Executive state

The work described below is proposed on isolated pull requests against the recorded main baseline. No production merge was initiated as part of this pass.

| Area | Current finding | Evidence / limitation |
|---|---|---|
| Production deployment and visual verification | **Not fully verified** | The connected Vercel access path returned HTTP 403 for protected preview access. This pass therefore cannot honestly certify the live rendered V8 model or its live exploded/reassembly interaction. |
| Model explosion manifests | **Automated contract added** | PR #35; last checked head `197090c5c8a22ad6ce49525a2a2fc3b033bbf029`; GitHub Actions run #236 passed. |
| CAD evidence / fidelity claims | **Evidence contract hardened** | PR #36; last checked head `3a48954497f461543f60ae3702580dcad51a2b68`; GitHub Actions run #237 passed. The positive test fixture is synthetic and does not certify a catalog model. |
| V8 audio and motion | **Automated contracts added** | PR #37; last checked head `05a5ca2c420eac81899e9edf2767baa2f2dd6288`; GitHub Actions run #248 passed, including TypeScript, app build, and browser startup/narrow-viewport smoke checks. |
| V8 guided lesson and reset action | **Implementation present; final head awaiting CI** | PR #38; current head `91e6e16aa99f2430af9d674bb6cade491413b7b0`; Actions run #257 failed while waiting for the first lesson step to render. The latest head `e884b2a0260d2df153cda15cf7804ebe2e4c5c69` aligns the launchpad with the canonical V8 model and adds diagnostics; its new CI result is pending. The lesson remains labelled `EDUCATIONAL_DRAFT` pending subject-matter review. |
| Actual learner effectiveness | **Not tested** | No observed learner session or measured learning outcome was completed during this implementation pass. |
| Protected-preview browser inspection | **Blocked** | This pass did not bypass or alter deployment protection. |

## Changes under review

### PR #35 — Explosion manifest and hierarchy contracts

- Turns missing/duplicate `explodedParts` references into catalog validation failures.
- Adds catalog-backed checks over models that declare exploded parts, including V8, V12, ESP32 and the remaining matching catalog entries.
- Corrects the stale V12 `v12.cylinder_head` reference to the existing `v12.valvetrain` component.
- Adds explicit V8 parent/child relationships and a regression for tree uniqueness and valid nesting.
- Gives the listed jet-engine combustor a non-zero explosion offset so an exploded part actually separates.

### PR #36 — CAD evidence and fidelity trust boundary

- Requires non-empty validation metadata, valid dates and explicit successful checks before a verification claim is accepted.
- Normalizes Windows/POSIX separators when comparing source paths.
- Binds a CAD validation record to evidence hash/revision when the model declares those values.
- Makes malformed nested checks fail closed rather than crashing the evidence assessment.
- Adds tests for mismatched paths, hashes and revisions, failed/malformed checks, and the procedural, GLTF and scientific-concept fidelity states.
- Does **not** assert that any real model is CAD-certified.

### PR #37 — V8 audio and motion contracts

- Extracts synthesis parameters into pure, testable code and clamps invalid RPM, speed and volume inputs.
- Corrects stale harmonic-order/filter documentation and makes mute/pause/zero-RPM gates explicit.
- Aligns piston TDC timing, the example HUD firing sequence and simplified intake/exhaust valve windows through a shared V8 kinematics definition.
- Adds regression coverage for firing events, slider-crank bounds, valve-lift windows and finite audio controls.
- These are educational kinematic/audio contracts, not evidence of OEM geometry or validated thermodynamics/acoustics.

### PR #38 — V8 guided lesson

- Versions the V8 lesson to invalidate saved progress from the older content.
- Adds three answer-gated checks: four-stroke order, simplified valve phases, and model limitations.
- Resets the lesson view and V8 playback/RPM/speed/crank phase at the final reset action while preserving the user's sound-mute preference.
- Adds a lesson/runtime contract. The latest head has not yet passed the browser walkthrough. Run #257 exposed a stall at the first lesson step after the shell opened; the latest code aligns the model entry point and captures diagnostics if rendering stalls again.

## Roadmap tracking

The 14 phases in the deep implementation plan should be treated as a sequence, not as one global “done” flag.

1. **Confirm production deployment and visually inspect V8:** blocked by protected-preview access; still outstanding.
2. **Baseline report:** this report records the commit and known verification limits; production deployment identity remains unverified.
3. **CAD evidence and fidelity statuses:** hardened in PR #36; real assets still require real source evidence.
4. **Manifest/schema/reference validation:** automated contracts in PR #35.
5. **Explosion/reassembly contract:** automated tests in PR #35; live visual verification remains outstanding.
6. **V8 component hierarchy:** tree validation in PR #35; live renderer inspection remains outstanding.
7. **V8 motion/audio consistency:** automated contract in PR #37; subjective/live audio quality remains unverified.
8. **Complete guided lesson and assessment:** implementation in PR #38; final-head CI pending at this snapshot; lesson still draft.
9. **Test instructional effectiveness:** not started; requires an observed learner session and honest recording of where learners succeed or struggle.
10. **Reusable workspace controls:** defer until V8 lesson flow has passed the actual experience check.
11. **V12 parity:** not started in this pass; preserve its existing dedicated behavior.
12. **Expand lessons/domains:** existing framework and domain contracts remain; do not scale content before the initial lesson is tested.
13. **Editable copies / undo-redo / save-export:** existing foundation has regression coverage in the passing CI suites; broader integration and UX testing remain.
14. **Accessibility, low-end performance, privacy and release gates:** not closed by this pass; require dedicated verification.

## Release / merge gate

Before merging these changes into `main` or treating them as production-ready:

- Require the current head of each PR to pass CI (especially PR #38, whose final head was pending at snapshot time).
- Review all four PR diffs against their target baseline.
- Obtain protected-preview access or perform an authorized browser inspection of the live V8 assembly, explode slider, component isolation, valve/piston animation and sound toggle.
- Keep CAD verification, physical accuracy, simulation validity and lesson review claims limited to the evidence actually available.
- Run an observed lesson walkthrough before building additional reusable controls or declaring the teaching experience effective.

**No production deployment was initiated and no claim of live visual verification is made by this report.**

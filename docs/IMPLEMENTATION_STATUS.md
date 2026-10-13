# A.D.V.I.S.-NCSC Implementation Status

Last updated: 2026-10-13 (remaining-work implementation branch)

This file tracks the "A.D.V.I.S.-NCSC — Deep Implementation Plan". Statuses mean:
- **Implemented (partial scope)**: code exists and the listed scope passed repository checks; this is not a claim of full plan completion.
- **In progress**: implementation has started but is not complete or not yet accepted.
- **Not implemented**: no deliverable satisfying the plan requirement has been completed yet.
- **Needs browser/scientific review**: compilation is not enough; live interaction or domain validation is still required.

## Release baseline

Current mainline work as of this status note:
- V8 improvement foundation: commit `91ce120e696f59b50256e0fc619519cb8ec58efc`.
- Vercel build/startup diagnostic fix: commit `56624c4f38deb8f5d3ac9832b442c75b3a12f5fb`.
- V8 independent HUD/audio/powertrain groups: commit `c15f887e49029b35693cd7aaa69391548b3d6ac6`.
- V8 explosion transform fix: commit `406e6c5abcd1faac8eb4329495b6ed698a02a4e8`.
- Evidence-aware CAD/fidelity + catalogue validator: commit `e2361c6c8ac5e1f978f80b3a31e6e99b501f81e4`.
- Component explorer + hierarchy/capability contracts: commit `95035f0753090c3b88de578d1fd6ad1954bdb275`.
- Simulation/lesson foundation: commit `91286df19c3667725da848f3e2ae457616a1c5f8`.

The production host is Vercel. GitHub Actions checks build/contract quality; a Vercel "Ready" status is separate from a browser-verified experience. Do not mark visual work complete without checking the deployed page.

## Phase-by-phase status

| Plan phase | Status | Implemented now | Still outstanding |
|---|---|---|---|
| Phase 0 — Baseline, deployment and regression audit | In progress | Explicit API syntax, catalog validation, lesson validation, simulation contract tests, TypeScript and production build in CI. Vercel PR status is checked separately when available. | No automated real-browser smoke run, no maintained before/after screenshot suite, no confirmed cross-model live visual smoke report, and no final end-to-end check recorded for the latest main commit. Vercel project lookup is visible but deployment inspection currently returns a scope authorization error, so live verification remains blocked pending restored Vercel access. |
| Phase 1 — Model trust, geometry fidelity and metadata | Implemented (partial scope) | CAD status no longer becomes verified from a file extension alone; structured validation evidence is required. Procedural education status is distinct. Optional model version, kind, units, evidence and capabilities exist. Catalog validator runs in CI. | Catalog-wide metadata migration, source/license/reference packet, reviewer/version/date for every asset, real CAD/OCCT validator producing hash-bound reports, and UI showing full provenance for every model. |
| Phase 2 — Component hierarchy and exploration | Implemented (partial scope) | Backward-compatible hierarchy builder/validator, V8 subsystem grouping, search across all components, selected part details, hide/show and show-all, single authoritative explosion interpolator for current component groups, larger V8 offsets. | Explicit parent/child hierarchy for all assets and deep subparts; hide/show of nested child-aware assemblies; connection lines and step controls; exact transform round-trip tests; adjustable section plane; full blueprint projection and capability-gated controls. Recent mainline commit adds camera focus, isolation, staged explosion and related contract coverage, but these still need actual-browser verification. |
| Phase 3 — V8 end-to-end benchmark | In progress | 22 separate assembly groups; V8-specific state/HUD/audio; independent crank-angle reference; wider exploded offsets; introductory draft lesson. | Level-2 decomposition (individual pistons/rings/pins/rods/valves/fasteners etc.); geometry and port fit verification; actual browser-tested exploded layout; source-supported exact-engine option; cam/valve/firing kinematics independently validated; real measurements/graphs; reviewed full lesson; OEM source audio or documented validated audio model. |
| Phase 4 — V12 parity | In progress (legacy implementation exists) | Existing V12-specific HUD, model renderer/audio and firing-track machinery remain in place. | Formal audit of configuration and source evidence; V12 hierarchy/explosion parity; isolated simulation state regression; common HUD primitives; V8/V12 comparison backed by source; browser visual and interaction snapshots. |
| Phase 5 — Simulation and numerical truth | Implemented (partial scope) | SimulationEngine starts paused, supports manual steps, reset, finite/range checks, bounded time steps, fixed-step accumulator, cycle wrapping, errors, start/pause/dispose. Scientific schema supports parameter provenance/ranges, cycle length/timestep and validation metadata; CI tests core lifecycle contracts. | Tests for each model's equations against independent reference vectors, scientifically reviewed model metadata, reproducible serialized experiments, robust step/backpressure behavior in UI, plots/data export, uncertainty and accuracy bounds, and benchmark validation. The current test is a synthetic contract fixture—not evidence that engine physics is validated. This branch adds bounded study-project parsing and round-trip contract tests to CI, plus tutor-context sanitization tests. |
| Phase 6 — Shared model-independent learning workspace | In progress | Engineering Reference Cockpit has a searchable explorer and part/evidence details; capability metadata contract exists. | Unified ModelWorkspaceShell and shared primitives (view mode, camera presets, explosion timeline, section control, parameter editor, plots, evidence panel, learning runner) across domains; responsive drawer layout; capability-driven control gating across the catalog. |
| Phase 7 — Guided lessons and assessment | Implemented (partial scope) | Typed schema, lesson catalog, LessonRunner, questions/hints/feedback, completion/progress, versioned local storage, V8 and hydrogen draft lessons. Lesson/audit CI passes. | Subject-matter review; authoritative lesson sources; a real live learner usability test; full assessment rules/scoring, progress migration, teacher lesson assignment, more reviewed lessons for V12 and each supported domain. Current two lessons are EDUCATIONAL_DRAFT. |
| Phase 8 — Context-grounded AI tutor | In progress (context-grounding foundation) | This branch passes the selected catalog model, selected component, explicit evidence statuses, reference metadata, limitations, units and explicit capability flags through a bounded server-side sanitizer. The tutor prompt now requires model-specific grounding, citations only from supplied references, uncertainty disclosure, and capability-aware action suggestions; sanitizer contract tests are added to CI. | Reliable source retrieval beyond catalog-attached references; structured fact-versus-inference responses; rendered citation UI; action validation tied to a typed action schema and tested against every supported control; tutor browser usability tests; hints and offline authored fallback integrated into the shared workspace. |
| Phase 9 — Innovation workshop and editable projects | In progress (limited legacy editing) | Existing component transform state and controls can edit transforms in the engineering cockpit. The current implementation branch adds wired transform undo/redo and an accessible Innovation Workshop with bounded project import, local save/load, comparison baselines, and JSON export for the parametric planetary study; these changes are not yet merged or browser-verified. | Immutable source + Create My Copy for arbitrary catalog assemblies, shared versioned project schema, transactional edit grouping, constraint solver, validation of assembly conflicts, model compare/diff for arbitrary models, GLB import/export with capability/licence warnings, genuine CAD-native STEP export path, and production/browser validation. |
| Phase 10 — Other scientific domains | In progress (existing visual models only) | Catalog includes molecular, anatomy, electrical, mechanical and other assets; hydrogen lesson gives a second domain draft lesson. | Domain-specific controllers/lessons/simulators/validation for chemistry, anatomy, electrical/circuits, structures/materials, fluids/aerospace and robotics. Existing assets alone do not constitute these learning modules. |
| Phase 11 — Accessibility, performance, reliability and offline | In progress (partial existing support) | Existing LOD/render settings and camera-free mouse interaction; lesson progress is stored locally; this branch adds global CSS reduced-motion preferences, stronger focus-visible outlines, and a downloadable authored-lesson JSON pack. Web startup fallback exists. | Systematic keyboard/ARIA and screen-reader audit, reduced-motion verification for JavaScript/Three.js animations, low-end-device tests, quality tiers across model families, render/audio resource-disposal tests, WebGL recovery/retry UI, self-contained offline asset packs (the lesson JSON does not include 3D assets), privacy retention/deletion policy. |
| Phase 12 — Authoring and teacher/community tools | Not implemented | Catalog/lesson TypeScript structures and validators are foundational pieces. | Authored-model schema guide/templates, preview authoring tool, author/reviewer workflow, attribution/licence gate, teacher packs/assignment/reporting, reviewed community contribution queue and security scanning. |
| Phase 13 — Observability, testing and release discipline | Implemented (partial scope) | Catalog, lesson and simulation-contract validation in CI, plus API syntax, TypeScript and production build. Vercel status is separate from build. | Browser E2E, automated visual regression, smoke test by model-family matrix, detailed runtime diagnostics/performance telemetry, release checklist attached to PRs, rollback runbook and live browser validation. |
| Work packages WP-00 through WP-14 | In progress | Baseline checks, WP-01 trust data, WP-02 initial explorer/hierarchy, and part of WP-06 simulation + WP-07 lesson runner are represented in code. | Most work packages are not completed as whole packages; continue incrementally in the order described in the master plan. |

## CI commands currently expected

- `node --check api/advis.js && node --check api/history.js`
- `npm run validate:catalog`
- `npm run validate:lessons`
- `npm run test:simulation`
- `npx tsc --noEmit --pretty false`
- `npm run build`

The model catalog audit has existing legacy warnings (for example, objects whose model kind is not yet explicitly migrated); these remain warnings rather than inventing defaults. They should be triaged and migrated in follow-up work packages.

## Next prioritized packages

1. **WP-00 completion**: run real-browser smoke tests for production and preview, including normal/exploded V8, V12, molecule and anatomy; maintain screenshots/recording and a reproducible report.
2. **WP-01 catalog migration**: classify legacy catalog entries with careful evidence states and source/license metadata; do not infer validation.
3. **WP-02 transform/interaction completion**: focus-camera, explicit isolate/hide/restore, hierarchy child behavior, staged explosion and capability-gated Section/Blueprint/measure.
4. **WP-05/06 V8**: decompose into component-level internals; validate transform/kinematics invariants; improve graphs and telemetry.
5. **WP-07 lessons**: subject-matter review and browser usability test for the two draft lessons.
6. **WP-08 V12**: regression suite and parity without sharing incorrect parameters.
7. **WP-09/10 simulation**: equation test vectors, plots, units and export.
8. **WP-11/12 workshop**: immutable editable copies, history, local save/load and constrained assemblies.
9. **WP-13+**: domain-specific modules with real validation, accessibility, performance/offline, tutor and teacher tooling.

## Definition of honest completion

A phase is only complete when the planned functionality exists, automated tests pass where possible, relevant browser interactions have been verified, source/assumption status is documented, and adjacent models are not regressed. Compilation by itself does not complete a visual, educational or scientific work package.

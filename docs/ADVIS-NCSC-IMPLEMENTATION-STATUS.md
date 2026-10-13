# A.D.V.I.S.-NCSC — Implementation Status

**Last reviewed:** 2026-10-13  
**Working branch:** `implementation-roadmap-2026-10-13`  
**Baseline:** `main` at `b5205e459c30be440ccbfd779ce8da02e2dd6727` (“Complete component focus and staged explosion controls”)  
**Status vocabulary:** **Present in code** means repository evidence exists, not that production behavior has been browser-verified. **Partial** means a foundation exists but acceptance criteria are incomplete. **Not implemented** means the plan's complete deliverable is not established in the inspected code. **Blocked** means an external permission/access limitation prevents verification.

This document is an honest tracker, not a declaration that the full roadmap is complete. The plan itself recommends separate work packages. No changes in this branch have been merged or promoted to production.

## Verification status

- GitHub repository contents and the current mainline implementation were inspected through the connected GitHub integration.
- The mainline already has model catalog/CAD evidence checks, component hierarchy validation, deterministic staged-explosion math tests, a model explorer, simulation lifecycle tests, authored lesson schema/catalog checks, and a CI workflow for TypeScript/build validation.
- **Live deployment verification is blocked:** the connected Vercel tool returned HTTP 403 for the `ady17` scope. As a result, this report does not claim that the current production site opens, that the V8 explosion transition works in a real browser, or that the deployed commit matches the repository baseline.
- No production deployment was initiated from this branch.

## Phase-by-phase status

| Plan phase | Current status | Remaining work |
|---|---|---|
| 0. Baseline, deployment and regression audit | **Partial / blocked** | Vercel authorization must be restored before verifying the live deployment. Capture real browser screenshots and recordings; test WebGL startup, model switches, V8/V12 and a non-engine model; record the exact production SHA and observed defects. The existing CI/build checks are not a substitute for browser smoke tests. |
| 1. Model trust and evidence | **Partial; trust corrections added on this branch** | Existing CAD evidence and geometry-fidelity modules are present. This branch removes unsourced V8-scientific property tables, labels the V8 cycle output as a relative teaching indicator, and removes the V12's unsupported exact variant specifications. The entire model catalog, all component narratives, sources/licenses, and evidence labels still need a systematic review. The new trust validator still needs CI confirmation. |
| 2. Hierarchy and exploration | **Partial; key foundations present in mainline** | A compatible hierarchy builder/validator, component explorer, focus/isolation affordances, staged explosion math, and pure tests exist. Live V8/V12/non-engine interaction verification remains outstanding. Confirm one authoritative transform writer in every rendering path, exact reset, selection sync, breadcrumbs, component relationships, staged steps/guides, and section-plane/blueprint semantics. |
| 3. V8 benchmark | **Partial** | A representative V8 assembly and authored draft lesson exist. The exact OEM identity is not claimed by the main V8 catalog entry. Deep subassembly decomposition, geometric alignment tests, view-by-view kinematics verification, cylinder/firing event correctness, audio lifecycle/browser testing, and fully reviewed references are not complete. |
| 4. V12 parity | **Partial** | A V12 catalog entry/controller and model-specific visual behavior exist. Variant-specific geometry, component hierarchy depth, firing/kinematics/audio validation, source packet, parity testing, and a complete reviewed lesson are not established. |
| 5. Simulation correctness | **Partial** | A deterministic simulation engine, bounded stepping/lifecycle behavior, range controls and unit tests exist. This branch documents the V8's simplified slider-crank assumptions and relabels the pressure-shaped curve as a relative index. The model's equations, parameter-effect coverage, physical reference cases, validated plots, and result export remain incomplete. The anatomy curves remain presentation-level, not clinical simulation. |
| 6. Shared learning workspace | **Partial** | The engineering cockpit and global scientific HUD exist. A fully reusable, responsive model workspace with common inspector, camera presets, section plane, experiment panel, evidence panel and progressive disclosure has not been demonstrated end-to-end. |
| 7. Lessons and assessment | **Partial** | A typed lesson schema, lesson catalog, lesson validation script and authored V8/hydrogen lessons exist. Current lessons are marked as educational drafts; source-backed subject-matter review, complete step-state checks, comprehensive keyboard-only completion, progress-recovery browser tests, a second reviewed full lesson, and educator editing are outstanding. |
| 8. Evidence-grounded AI tutor | **Not verified as complete** | The requested contract (typed model/component context, retrieved evidence IDs, fact/derivation/assumption/unknown separation, allowlisted reversible actions, privacy-aware logging, and no-AI fallback) has not been verified end-to-end. |
| 9. Innovation workshop | **Not implemented to the plan's acceptance criteria** | No verified immutable-source/editable-copy document workflow with transform editing, command history, undo/redo, compare/reset-to-source, constraint validation, versioned local save/load and clearly scoped import/export was established. Catalog capability flags for save/edit/export remain disabled where inspected. |
| 10. Domain-specific modules | **Partial** | Chemistry and anatomy catalog/scientific models exist, and a hydrogen lesson exists. Complete domain-specific capability descriptors, structured metadata, validation suites and reviewed lessons for chemistry, anatomy, electrical engineering, structures/materials, fluid/aerospace and robotics are not all present. Do not interpret a model in the catalog as a complete domain learning module. |
| 11. Accessibility, performance and offline | **Partial / unverified** | Some loading/error handling and pause controls exist. Low/Balanced/High/Ultra tiers, deliberate adaptive-quality controls, reduced-motion behavior, keyboard/mobile E2E, audio alternatives, privacy/retention notice, offline lesson packs, cache/version policy, bounded asset cache and disposal verification are not established across the application. |
| 12. Authoring, teacher tools and community | **Not implemented to the plan's acceptance criteria** | Documented authoring templates, previewable lesson steps, teacher assignment/reporting, contribution submission/review queue, license/security gate, author/reviewer revision history and review tooling remain outstanding. |
| 13. Observability, testing and release discipline | **Partial** | CI runs catalog/CAD, lesson, simulation and explosion checks plus TypeScript/build. This branch adds scientific evidence/limits validation to CI. Browser E2E, WebGL/WebGL-failure tests, representative visual regression captures, per-model capability matrix, production interaction verification and a complete model-by-model release report remain outstanding. |

## This branch's focused implementation

- [x] Added explicit procedural/illustrative evidence metadata for the scientific V8 and visual V12 catalog records.
- [x] Removed unsourced exact displacement, power, firing-order, material, mass, tolerance and flow claims from the inspected V12 catalog record, replacing them with “not specified” / evidence-status language.
- [x] Corrected the scientific V8 catalog's unsupported displacement, compression ratio, bore/stroke and thermodynamic solver claims.
- [x] Removed 15 unreferenced component engineering-property tables from the scientific V8 schema rather than displaying exact-looking values without a source-identified engine.
- [x] Documented simulation level, assumptions and limitations for the four-stroke kinematics and anatomy presentation waveforms; changed the V8 pressure output to a relative illustrative index and clarified normalized scene units.
- [x] Added explicit parameter metadata and made the anatomy stroke-volume control affect the illustrative volume curve.
- [x] Added `scripts/validate-scientific-trust.mjs` and wired it into the `lint` contract and GitHub Actions workflow.
- [ ] Run the new and existing checks against this exact branch via GitHub Actions and fix any failures.
- [ ] Browser-verify the affected interfaces and confirm no unexpected model regressions.
- [ ] Obtain Vercel access and verify production before promoting changes.

## Not implemented by this branch

This change is a focused trust/evidence work package, not the entire multi-phase roadmap. It does **not** implement the full three-level V8 parts breakdown, complete V12 parity, CAD kernel authoring/export, a generalized workspace shell, fully reviewed lesson curriculum, grounded AI tutoring, editable project workshop, undo/redo/save/import/export, assembly constraints, full chemistry/anatomy/electrical/structures/fluid/robotics learning modules, teacher/community workflows, full offline support, or comprehensive accessibility/performance/E2E test coverage.

The next safe sequence is: (1) pass CI and review the metadata diff, (2) restore Vercel authorization and browser-verify existing V8/V12 behaviors, (3) finish the evidence audit and hierarchy/transform contract across representative models, (4) complete one fully reviewed V8 lesson end-to-end, then continue with the work-package order in the supplied plan. Production promotion remains a separate gate.

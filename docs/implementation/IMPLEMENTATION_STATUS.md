# Deep implementation plan — tracked status

**Tracking rule:** “Implemented” means code exists and its available automated checks pass. “Needs integration” means the contract/module exists but the current application has not been wired to it end-to-end. “Not implemented” means no complete product feature has been delivered yet.

| Work package / phases | Status in this branch | Evidence / remaining gate |
|---|---|---|
| WP-00 / Phase 0 baseline | Partial | Baseline source commit and smoke checklist recorded. Live browser render, V8 explode transition, screenshots, and deployment checks still require an authenticated browser/deployment session. |
| WP-01 / Phase 1 CAD evidence | Implemented at source-contract level | CAD path alone no longer grants validation flags. Validation records must match current source hash and model revision and include tool/version/time/reviewer fields. Automated contract tests added. Model-by-model provenance packet and all model metadata migration remain. |
| Phase 1 geometry fidelity | Implemented at resolver level | Source format no longer grants L4 or deep/interior capabilities by default. Explicit capability metadata is required. UI consumers need review and model metadata still needs migration. |
| WP-02 / Phase 2 hierarchy compatibility | Initial foundation | Flat catalog records remain supported; helper builds roots and checks duplicate IDs, dangling links, conflicts, and cycles. No full nested decomposition of the engine catalogs is complete yet. |
| WP-02 / Phase 2 transform contract | Initial foundation | Pure resolver defines base → edit → kinematic → explosion → presentation composition and normalized explosion factor. The shared renderer still needs migration to make this the only transform writer and live browser verification. |
| Phase 3 V8 quality benchmark | Not complete | Existing model is present and the latest explosion fix is in main. Detailed Level 2/3 parts, coordinate/geometry invariant tests, documented representative firing sequence, and complete lessons/graphs/audio audits remain. |
| Phase 4 V12 parity | Not complete | Existing V12 system is present. Cross-model state isolation and parity suite remain. |
| Phase 5 simulation contract | Not complete | Existing simulation engine is present; deterministic replay, bounded fixed-step lifecycle, numeric validation, equation/reference tests, and export are still pending. |
| Phase 6 shared workspace | Partial | Conservative capability manifest helper exists. Full shared shell, accurate section-plane UI, mobile drawers, camera focus, transform resolver integration and semantic inspection tables remain. |
| Phase 7 lessons and assessment | Not complete | Lesson runner, reviewed V8 lesson pack, local progress recovery, hints and assessment still need to be wired and tested end-to-end. |
| Phase 8 contextual AI tutor | Not complete | No complete evidence-grounded component context packet/action allowlist implemented in this work package. |
| Phase 9 workshop/editable copies | Not complete | Immutable reference, copy documents, undo/redo, save/load, constraints and GLB export remain. |
| Phase 10 domain modules | Existing foundations only | Existing molecular/anatomy/electronics models are not yet compliant with the target schemas and domain-specific acceptance tests. |
| Phase 11 accessibility/performance/offline/privacy | Not complete | Existing controls require audit; quality tiers, audio lifecycle tests, offline packs, consent/privacy notice and mobile coverage remain. |
| Phase 12 author/teacher/community tools | Not complete | Schema authoring workflow, preview, review queue and teacher packs remain. |
| Phase 13 release discipline | Initial foundation | Catalog validator and contract tests are being added to CI; broader integration/E2E/visual tests and production gates remain. |

## First implementation increment

This branch prioritizes demonstrably false CAD/fidelity claims, backward-compatible engineering contracts, and automated checks before deeper model decomposition. Do not merge/deploy until CI and review gates pass. Future packages should update this table with commit/PR evidence, tests, known limitations, and actual deployment verification.

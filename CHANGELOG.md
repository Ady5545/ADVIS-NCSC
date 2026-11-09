# Changelog

All notable changes to ADVIS are documented here.
Entries are grouped by shipped milestone in reverse-chronological order.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — post-PR-58 on `main`

---

## [milestone: Spatial Command HUD + Workspace Persistence] — 2026-11

**Commits:** `87a7198` (PR #58 merge) back through `84548b2`

### Added
- **Spatial Command Pod** (`MobileNav.tsx`) — compact cyan shortcut visible on mobile, opens the command palette.
- **Unified Workspace Command Center** (`UnifiedWorkspaceCenter.tsx`) — command palette + workspace manager merged into one surface; supports searching commands, saving, restoring, and listing named workspace sessions.
- **WorkspaceSessionStore** (`src/workspace/WorkspaceSessionStore.ts`) — safe local-storage persistence for spatial session snapshots including model state, kinematics playback, V12/V8 rpm, chemistry session, lesson runner, LOD tier, and display flags.
- **Command Search integration** in the spatial sidebar (`a962575`).
- **Saved-workspace modal** sequenced after command palette closes (`b4807ec`), with `refreshSavedWorkspaces` on open (`5d44fc7`).

### Fixed
- Stale spatial context was not exited on workspace navigation — fixed in `08a935c`.
- Flaky modal handoff in workspace persistence E2E smoke test.
- Saved workspace modal transition sequencing (`d83e18a`).

### CI
- GitHub Pages deployment unified to a single path (`8a99f29`).
- Validation must pass before Pages deploy (`4ca1dab`).

### Docs
- Spatial Command HUD implementation plan recorded (`a563e7a`, `docs/spatial-command-hud-implementation-plan.md`).

---

## [milestone: Dead Code Cleanup + Agent Skills] — 2026-11

**Commits:** `18e110a`, `2d6ac8c`, `7da10eb`

### Removed
- Dead code, legacy scripts, and archived legacy components pruned (`18e110a`).

### Added
- `bug-hunt` and `humanizer` agent skills added to `.agent/skills/` (`2d6ac8c`).
- Engineering skills tooling scripts and lockfile updates (`7da10eb`).

---

## [milestone: Scientific Trust + Domain Learning + Innovation Workshop] — 2026-10

**Commits:** `114bd67` merge through `3bb4ca3`

### Added
- **Four-stroke engine simulation** (`SimulationEngine.ts`) with deterministic bounded stepping and unit tests.
- **V12 Engine Audio Engine** (`V12EngineAudioEngine.ts`) — procedural audio driven by RPM/kinematics.
- **V8 Engine Audio Engine** (`V8EngineAudioEngine.ts`).
- **V12 Synchronized Diagrams** (`V12SynchronizedDiagrams.tsx`) — P-V / crank-angle real-time plots.
- **Scientific Model Registry** and **Scientific Action Router** — routing AI actions to 3D model operations.
- **STEM Domain Analytical Models** (`domains/AnalyticalModels.ts`, `DomainLearningModules.ts`) covering electricity, structures, fluids, aerospace, robotics, anatomy.
- **Lesson Runner** (`learning/LessonRunner.tsx`) with schema-validated authored lessons (`LessonCatalog.ts`, `LessonPack.ts`, `LessonProgress.ts`).
- **Innovation Workshop** (`workshop/InnovationWorkshop.tsx`, `WorkshopStore.ts`, `WorkshopSchema.ts`) — local editable workspace with save / load.
- **Component Hierarchy** (`models/assemblies/ComponentHierarchy.ts`) and **Explosion Math** (`ExplosionMath.ts`) — deterministic staged explosion offsets.
- **Model Capability Matrix** (`ModelCapabilityMatrix.ts`) — capability-gating per model entry.
- **CAD Lab** (`cad/`) — OCCT WASM kernel (`CadKernelService.ts`), parametric CAD UI (`ParametricInnovationLab.tsx`), study projects (`StudyProject.ts`), geometry fidelity checks (`GeometryFidelity.ts`).
- **Precision anatomy models** (`AutonomousModelEngine/precision/`) — Heart, Brain, Eye, Lungs, Skeleton.
- **Validation scripts** (`scripts/`) covering model catalog, lessons, simulation, explosion math, study projects, tutor context, workshop store, domain models, and kinematics.
- **Scientific trust labels** — V8 pressure curve relabelled as "relative teaching indicator"; anatomy waveforms labelled as illustrative.
- Global CSS `prefers-reduced-motion` support; stronger `focus-visible` outlines.
- Chemistry / molecular learning engine (`LearnEngine/`) — `MolecularEngine.ts`, `ValenceValidator.ts`, `ChemistryDatabase.ts`, `BF3Lesson.ts`.
- Chemistry HUD, Molecular Builder HUD, Continuous Visuals.

### Fixed
- Zero spark-advance parameter now respected (`9d1ea03`).
- Punctuation in anatomy and educational model metadata.
- V12 engine component hierarchy references (`8995201`).

### Changed
- Scientific simulation documents V8 simplified slider-crank assumptions.
- V8 / V12 unsourced exact-specification tables removed from model metadata.

### CI
- Scientific trust validation runs in CI (`78c6b3a`).
- Full lint contract (`npm run lint`) covers all 12 validators.
- TypeScript `tsc --noEmit` and `vite build` both required to pass before merge.

---

## [milestone: Hologram Visual Redesigns + ADVIS Core] — 2026-10

**Commits:** `045917f`, `bc950fd`, `cad5103`, `6caf360`, `8a04391`, ...

### Changed
- ADVIS Core hologram rebuilt as large nebula planet (`bc950fd`).
- Gas puff particles replaced with flowing nebula wisps (`045917f`).
- Holographic orb rebuilt with layered luminous orbital rings (`cad5103`).
- PBR physical shading for spatial model renderer (`347511b`).
- Procedural geometry resolution raised across model families (`49f03ba`).

---

## [milestone: Theatre.js Presentation Layer] — 2026-10

**Commits:** `0bcdab1`–`c44b0a1`

### Added
- Theatre.js runtime and R3F integration (`69a6a65`).
- Presentation bridges: `TheatreV12Bridge`, `TheatreMoleculeBridge`, `TheatreOrbBridge`, `TheatreCameraBridge`.
- `TheatrePresentationController` — `playMoleculePresentation`, `playV12Presentation`, `stopAllTheatrePresentations`.
- Theatre Studio initialized in development only.
- V12 Theatre presentation adapter (`81e4e59`).

### Fixed
- Theatre.js serialized track state corrected (`d12d189`, `4b28f02`).
- R3F scene provider close path corrected.
- Theatre Studio viewport overlay removed.

---

## [milestone: Engineering Component Inspection + High-Fidelity Models] — 2026-10

**Commits:** PR #6 `425a64c`, PR #8 `816ee64`

### Added
- Engineering component inspection UI with component focus and selection (`f7780ff`).
- High-fidelity engineering models: Turbocharger, Gearbox, PMSM motor, Steering, Suspension (`src/generators/`).
- Precision inline-4, V8, V12 cutaway generators.

### Fixed
- V12 component selection rendering corrected (`886e5b6`).
- Turbocharger component rendering corrected.
- Hierarchical component registry implemented (`fe538db`).

---

## [milestone: CAD + Innovation Lab Foundation] — 2026-09

**Commits:** `68b6da9`–`173e4ff`

### Added
- OCCT WASM dependency (`occt-wasm@^4.3.2`).
- `CadKernelService.ts`, `CadModelCanvas.tsx`, `CADLab.tsx`, `ParametricInnovationLab.tsx`.
- CAD and innovation lab navigation integrated into engineering workspace.
- Vite configured for OCCT WebAssembly (excluded from pre-bundling, target `esnext`).

---

## [milestone: Gesture + Spatial Navigation Foundation] — 2026-08 to 2026-09

### Added
- MediaPipe Hands adapter (`MediaPipeAdapter.tsx`).
- Gesture engine (`useGestureEngine.ts`) — spatial orbit camera, pinch-select, carry-to-rotate.
- Two-hand scaling gesture (`0fbfda2`).
- Carry-to-rotate gesture (`6839e79`).
- Holographic cursor (`HolographicCursor.tsx`).
- Spatial library (`SpatialLibrary.ts`) — model catalog with capability flags.
- Engineering Reference Cockpit (`EngineeringReferenceCockpit.tsx`).
- Scientific HUD + Scientific Launchpad.
- V12 engine controller, V8 engine controller.
- Learning Engine integration and memory management.

---

## [milestone: Initial Project Bootstrap] — 2026-07-24

**Commit:** `7af1173`

### Added
- Initial ADVIS project scaffolded — React 19, Vite 6, Three.js, React Three Fiber, Tailwind CSS v4, Express server, Gemini API integration, holographic orb, chat panel, voice input, sidebar navigation.
- `AGENTS.md` design philosophy document.
- `GEMINI_CHAT_SETUP.md`.
- GitHub Pages CI (`static.yml`).

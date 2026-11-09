# ADVIS — Development Guide

> Last updated: 2026-11-09 | Reflects `main` at `87a7198`

---

## Prerequisites

| Tool | Required | Notes |
|---|---|---|
| Node.js | ✅ | Node 18+ recommended (`vite build` target: `esnext`) |
| npm | ✅ | Package manager used in CI and scripts |
| A modern browser | ✅ | Chrome/Edge recommended — MediaPipe Hands requires WebGL + WebAssembly |
| A webcam | Optional | Required only for hand gesture tracking |
| `GEMINI_API_KEY` | ✅ | From [Google AI Studio](https://aistudio.google.com) |

---

## Setup

```bash
# Clone the repository
git clone https://github.com/Ady5545/ADVIS-NCSC.git
cd ADVIS-NCSC

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# → Edit .env, set GEMINI_API_KEY=<your key>

# Start development server
npm run dev
# → http://localhost:3000
```

The dev server runs on port 3000 (configured in `vite.config.ts`). `.data/` is watched and excluded from hot-reload.

---

## Available Scripts

```bash
npm run dev              # Vite HMR dev server + Express backend (concurrent)
npm run build            # Vite client build + esbuild server bundle → dist/
npm run start            # Run bundled production server (dist/server.cjs)
npm run lint             # All 12 validation contracts (see below)
npm run test:e2e         # Playwright end-to-end browser tests
```

### Validation Contracts (npm run lint)

Each script is a standalone Node.js test that exits non-zero on failure:

| Script | Checks |
|---|---|
| `validate:catalog` | Model catalog schema completeness |
| `validate:science` | Scientific trust assertions (no unsourced exact specs) |
| `validate:capabilities` | Model capability matrix coverage |
| `validate:lessons` | Lesson schema and catalog |
| `test:simulation` | SimulationEngine contract (bounded stepping, determinism) |
| `test:explosion` | ExplosionMath determinism |
| `test:study-project` | CAD study project import/export roundtrip |
| `test:tutor-context` | Tutor context sanitization |
| `test:lesson-progress` | Lesson progress persistence |
| `test:workshop` | WorkshopStore save/load/list |
| `test:domains` | STEM domain analytical model contracts |
| `test:kinematics` | Kinematics reference model |

---

## Project Structure Quick Reference

```
src/
├── App.tsx                    # Root state + mode orchestrator
├── HologramCore.tsx           # Holographic orb / ADVIS core visual
├── SpatialObjectEngine.tsx    # Three.js scene router
├── GestureContext.tsx         # Gesture state context provider
├── useGestureEngine.ts        # Spatial camera + gesture processing
├── useHandTracking.ts         # MediaPipe Hands integration
├── UnifiedWorkspaceCenter.tsx # Command palette + workspace manager
│
├── AutonomousModelEngine/     # Procedural geometry generation
├── cad/                       # OCCT WASM CAD Lab
├── components/v12/            # V12 engine R3F controller
├── components/v8/             # V8 engine R3F controller
├── domains/                   # STEM domain definitions + analytics
├── generators/                # High-fidelity precision geometry
├── LearnEngine/               # Chemistry / molecular learning
├── learning/                  # Lesson schema, runner, catalog, progress
├── models/assemblies/         # Component hierarchy + explosion math
├── scientific/                # SimulationEngine, kinematic bus, audio
├── theatre/                   # Theatre.js presentation bridges
├── types/                     # Shared TypeScript interfaces
├── workshop/                  # Innovation workshop
└── workspace/                 # Session snapshot persistence

api/                           # Vercel serverless functions
server.js                      # Express dev/production server
ButlerEngine.js                # Gemini multi-turn conversation engine
scripts/                       # Validation/unit test scripts
e2e/                           # Playwright E2E tests
public/models/                 # Static 3D model assets (GLB, etc.)
docs/                          # Design docs, architecture, plans
```

---

## Adding a New 3D Model

1. **Define capability flags** in `src/models/ModelCapabilityMatrix.ts`.
2. **Add catalog entry** to `SpatialLibrary.ts` with `id`, `label`, `category`, `description`, and capability flags.
3. **Create geometry generator** in `src/generators/` or `src/AutonomousModelEngine/` (procedural) OR add a GLB to `public/models/`.
4. **Register in `ScientificModelRegistry.ts`** if the model supports scientific simulation.
5. **Write a lesson** (optional) in `src/learning/LessonCatalog.ts` following `LessonSchema.ts`.
6. **Run** `npm run validate:catalog` and `npm run validate:capabilities` — both must pass.

> **Scientific honesty rule**: Do not claim exact OEM specifications for engine/hardware models. Label derived or analytical values as teaching indicators.

---

## Adding a Lesson

1. Create a lesson object conforming to `LessonSchema.ts` (steps, model, actions array of `LessonAction`).
2. Export from `LessonCatalog.ts` and add to `LEARNING_LESSONS`.
3. Optionally create an authored `LessonPack` for download.
4. Run `npm run validate:lessons`.

---

## Workspace Sessions

`WorkspaceSessionStore.ts` serializes ~40 UI state fields to localStorage under a user-named key. The store is **snapshot-based** — it records navigation context, not geometry. Saved sessions survive page reload.

To add a new persisted field:
1. Add the field to `WorkspaceSnapshotData` interface.
2. Update `captureSnapshot()` and `restoreSnapshot()` in `WorkspaceSessionStore.ts`.
3. Update `UnifiedWorkspaceCenter.tsx` if the field needs UI exposure.

---

## Hand Gesture Development

The gesture pipeline:

```
Camera → MediaPipeAdapter (video frames)
       → useHandTracking (landmarks[21] per hand)
       → GestureContext (broadcast)
       → useGestureEngine (interpret → spatial camera / action)
       → App.tsx (dispatch state change)
```

Add new gestures in `useGestureEngine.ts`. Utility helpers live in `gestureUtils.ts`. Always check confidence before dispatching — low-confidence gestures should do nothing (see `AGENTS.md` intent philosophy).

---

## Theatre Presentation

Theatre.js is initialized **in development only** (`TheatreRuntime.ts`). To create a new presentation:

1. Add a bridge in `src/theatre/` (follow `TheatreV12Bridge.ts` as a template).
2. Register the bridge in `TheatreRuntime.ts`.
3. Expose a `play*Presentation` function from `TheatrePresentationController.ts`.
4. Call from `App.tsx` or the relevant controller.

---

## CI / CD

GitHub Actions runs `.github/workflows/static.yml` on every push to `main`:
1. `npm ci`
2. `npm run lint` (all 12 validators)
3. `npx tsc --noEmit --pretty false`
4. `npm run build`
5. Deploy `dist/` to `gh-pages` branch → GitHub Pages

The Vite `base` path is auto-switched via `VERCEL` env var detection in `vite.config.ts`.

---

## Vercel Deployment

`vercel.json` routes all paths to the Express server. Set `GEMINI_API_KEY` as an environment variable in the Vercel project settings. CORS allowed origins are configured via `ADVIS_ALLOWED_ORIGINS` (default: `https://ady5545.github.io`).

---

## Gotchas

| Gotcha | Explanation |
|---|---|
| `occt-wasm` excluded from Vite pre-bundling | It ships WASM — adding to `optimizeDeps.exclude` is required |
| Build target is `esnext` | Required by OCCT WASM (SIMD / tail-call / exception handling) |
| MediaPipe model files served from CDN | Ensure network access in dev; see `useHandTracking.ts` for model URL |
| `.data/` is git-ignored | Server persistence (chat histories, memories) lives here — do not commit |
| Theatre Studio only in dev | `TheatreRuntime.ts` checks `import.meta.env.DEV` before initializing |

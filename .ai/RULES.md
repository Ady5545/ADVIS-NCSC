# ADVIS — Agent Rules

> These rules govern all AI-agent and pair-programming work on the ADVIS codebase.
> See `AGENTS.md` for the high-level design philosophy. This file captures engineering-specific rules.

---

## Mandatory Reading Before Any Change

1. **`AGENTS.md`** — ADVIS design philosophy (Spatial AI OS principles). Every feature must pass its test.
2. **`docs/ARCHITECTURE.md`** — module topology, data flow, layer responsibilities.
3. **`.ai/DECISIONS.md`** — why key architectural choices were made. Do not contradict an ADR without recording a new one.

---

## Design Rules (from AGENTS.md, enforced here)

- **One Organism**: Never add a UI element that feels disconnected from the holographic system. No isolated widgets.
- **Intent Over Gesture**: Low gesture confidence → do nothing. Never trigger unexpected actions.
- **Invisible Controls**: The interface adapts to the user. No jarring mode switches or state resets.
- **Spatial Mode**: When a 3D object is loaded, the hologram transfers to it. The object is the center. Do not add overlapping HUDs without clear spatial context.
- **Persistence**: Losing hand tracking must NEVER reset workspace state.
- **Performance is a feature**: LOD, lazy loading, efficient shaders. No GPU-heavy eye candy that hurts frame rate.

---

## Code Rules

### Scientific Honesty (CI-enforced)
- Do not add exact OEM hardware specifications to model metadata without sources.
- Simulation outputs that are analytical/illustrative MUST be labelled as "relative teaching indicator" or "illustrative" in both metadata and UI.
- `npm run validate:science` must pass. Fail = cannot merge.

### Validation Contracts
- `npm run lint` runs 12 validation scripts. All must pass before any PR merge.
- Do not mark a work package as complete unless: code exists, tests pass, AND browser interaction has been verified.

### TypeScript
- `npx tsc --noEmit` must pass. No `any` escape hatches that silence genuine type errors.
- TypeScript 7 strict mode — do not lower `strict` or add `tsconfig` exceptions to work around errors.

### State Management
- Root state lives in `App.tsx`. Do not add a global state library (Redux, Zustand, Jotai) without an ADR.
- Scientific state via `useScientificStore()` (existing hook). Do not duplicate state at the App level.
- Workspace/lesson/workshop state via their respective localStorage stores — do not send this to the server.

### API Key Security
- `GEMINI_API_KEY` MUST remain server-side only. Never reference it in `src/` (Vite client bundle).
- Never add `VITE_GEMINI_API_KEY` or similar. This would expose the key in the client build.

### Gesture Engineering
- Always guard gesture actions with a confidence threshold. When in doubt, do nothing.
- New gestures go in `useGestureEngine.ts`. Utility functions in `gestureUtils.ts`. No gesture logic in components.

### 3D Model Engineering
- New built-in models: add to `SpatialLibrary.ts` catalog + `ModelCapabilityMatrix.ts` + run `validate:catalog`.
- GLB assets go in `public/models/` — do not import binary assets into the client bundle.
- For procedural geometry, follow patterns in `src/generators/` or `src/AutonomousModelEngine/`.
- Scientific models: register in `ScientificModelRegistry.ts` and implement `ScientificActionRouter` intent handlers.

### Lessons & Learning
- Lessons must conform to `LessonSchema.ts`. Run `validate:lessons` after any change.
- Lesson steps must be verified by a subject-matter review before being marked complete (not just "compiles").

### Animation / Theatre
- Theatre Studio only in dev. No `getStudio()` calls in production paths.
- Every animation communicates purpose. Nothing animates because it looks cool (see AGENTS.md).
- Use `framer-motion` for UI transitions, R3F `useFrame` for 3D animation loops, Theatre.js for authored timelines.

### Persistence
- Server `.data/` JSON files: no schema migration system exists. Be backward-compatible with existing keys.
- localStorage: same — do not remove or rename existing session snapshot fields without migrating.

---

## Development Workflow Rules

1. Run `npm run lint` before committing.
2. Run `npm run build` to verify TypeScript and Vite both succeed.
3. For E2E: `npm run test:e2e` via Playwright. Browser must be installed (`npx playwright install`).
4. All CI checks must pass before merging to `main`.
5. Use PR descriptions that describe the ADVIS user experience impact, not just implementation details.

---

## What Counts as "Done" for a Feature

A feature is only done when:
- [ ] Code exists and compiles
- [ ] Relevant validation scripts pass (`npm run lint`)
- [ ] Playwright E2E test covers the critical path (or existing tests are updated)
- [ ] Browser interaction verified in a real browser session
- [ ] AGENTS.md design principles are not violated
- [ ] `CHANGELOG.md` updated with the change
- [ ] `docs/IMPLEMENTATION_STATUS.md` updated if it tracks the work package

**Compilation alone does not complete a feature.**

---

## Anti-Patterns (Do Not Do)

- ❌ Add new npm dependencies for functionality already in Three.js, React, or the standard library
- ❌ Use `dangerouslySetInnerHTML` for Gemini AI response content
- ❌ Hardcode `GEMINI_API_KEY` or any secret in source
- ❌ Add debug `console.log` to production paths
- ❌ Create permanent chat overlays that obscure the 3D view
- ❌ Add any UI that randomly animates or transitions without user intent
- ❌ Claim a model is "V12 Ferrari spec" without sourced technical data

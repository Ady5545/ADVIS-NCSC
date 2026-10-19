# ADVIS Core-led Spatial OS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ADVIS visibly feel like one Core-led Spatial AI Operating System across home, navigation, and scientific workspaces while preserving current model, lesson, voice, gesture, and simulation behavior.

**Architecture:** Keep `src/App.tsx` as the existing state owner and keep the React Three Fiber Canvas and ADVIS Core alive across normal UI transitions. Add a small semantic design-token layer; improve the current launchpad and shared navigation data; then progressively apply the shared presentation to existing panels rather than replacing their domain logic. Use the existing Playwright suite and scientific validation scripts as regression gates.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Three Fiber, Framer Motion, Lucide React, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-advis-spatial-os-redesign-design.md`

## Global Constraints

- Preserve the existing ADVIS Core geometry and `src/HologramCore.tsx`; do not replace it with an experimental orb.
- Preserve `src/App.tsx` state ownership, existing `currentView` values, action/callback contracts, and Canvas/model lifecycles.
- Preserve the menu IDs exactly: `home`, `molecules`, `engineering`, `cad-lab`, `innovation-lab`, `compare`, `demonstration`, `lessons`, `gestures`, `telemetry`, and `settings`.
- Preserve the existing `InputArea` typing, attachment, microphone, send, and keyboard behavior; never add a competing command box.
- Use `SPATIAL_LIBRARY`, `ScientificModelRegistry`, and existing chemistry/lesson data as the source of truth; do not invent catalog counts, model status, capabilities, provenance, or scientific fidelity.
- Do not add a dependency for appearance alone, rewrite the backend/API/auth, regenerate/delete models, or change simulation semantics.
- Keep the navy/graphite foundation and electric-blue/cyan ADVIS identity; honor keyboard focus and `prefers-reduced-motion`.
- Do not use broad `!important` mappings over legacy utility classes or DOM-structure selectors as styling APIs.
- No production deploy, alias promotion, domain change, Vercel configuration change, or wholesale merge of a divergent redesign branch in this work.
- Verified baseline for this plan: `main` at `5234f7b9f677723e9a73be46265377ca668eb8fd`.

## Review Focus

1. **A shortcut refers to missing/unavailable data:** the home screen must filter it out rather than render a dead launch button or overstate availability; test with catalog-backed quick starts and absence of the previous hard-coded count claims.
2. **A navigation destination is rearranged or shown only on desktop:** all existing destination IDs must remain reachable and Home/Back must remain accessible in mobile and immersive mode; test all destination labels and the mobile overflow path.
3. **A shell transition remounts the renderer or clears a user session:** Canvas, selected object, active lesson/molecule, and scientific control state should persist through normal UI changes and tracking loss; test home ↔ model ↔ home with a model session active.
4. **An overlay intercepts clicks or keyboard focus:** visible controls must actually respond while the model remains manipulable; test representative panel actions, focus order, and return controls in a browser.
5. **A narrow viewport or reduced-motion preference breaks the shell:** test a 1366×768 desktop and 390×844 mobile viewport for overflow, overlap, labelled controls, and reduced-motion-safe transitions.

---

### Task 1: Add behavior-level shell regression tests

**Files:**
- Create: `e2e/spatial-os-shell.spec.ts`
- Existing reference: `e2e/smoke.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Consumes: current rendered app and existing Playwright server configuration.
- Produces: browser-level checks for the new shell contract without exposing internal React implementation details.

- [ ] **Step 1: Write the failing shell tests**
  Create tests for:
  - Desktop home showing recognizable ADVIS identity, a labelled primary navigation landmark, and clear entry points for engineering, molecules, learning, comparison, and demonstrations.
  - Home showing no stale fixed claims such as “18 Verified Molecules” or “14 Mechanical Systems”.
  - Mobile navigation exposing a labelled Home control and an accessible path to secondary destinations.
  - Mobile page width not exceeding a 390px viewport.
  - Entering a representative spatial model retains a discoverable Home/Back/Exit action.
- [ ] **Step 2: Run the tests to establish the expected failures on the baseline**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
  Expected: the new tests fail on missing grouped/labelled navigation, old launchpad claims, or missing mobile Home discoverability—not because the app fails to boot. If an assertion fails because it does not match the existing UI contract, correct the assertion rather than weakening the required behavior.
- [ ] **Step 3: Keep the baseline smoke test unchanged unless a demonstrated overlap requires an update**
  Preserve its boot/WebGL-fallback and narrow-screen startup guarantees.
- [ ] **Step 4: Commit the test contract**
  `git add e2e/spatial-os-shell.spec.ts && git commit -m "test: define ADVIS spatial OS shell contract"`

### Task 2: Establish the shared ADVIS visual language

**Files:**
- Modify: `src/index.css`
- Modify: `src/InputArea.tsx`
- Add a small shared primitive module only if at least three call sites can reuse it without changing behavior.

**Interfaces:**
- Consumes: existing cyan primary token, Tailwind v4 theme, InputArea props and callbacks.
- Produces: semantic shell/surface/text/status/focus tokens and consistent classes/components used by later tasks.

- [ ] **Step 1: Add semantic tokens and focused shell utility classes**
  Define tokens for app background, stage, raised surface, border, primary text, muted text, brand/primary action, focus, real status colors, and motion timings. Preserve the existing Tailwind theme mappings and current primary value `#22d3ee`.
- [ ] **Step 2: Add browser assertions for the token and accessibility contract**
  Extend `e2e/spatial-os-shell.spec.ts` to verify visible keyboard focus and that reduced-motion preference does not leave long shell transitions active.
- [ ] **Step 3: Run the new tests and confirm they fail for the missing token behavior**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
- [ ] **Step 4: Apply the tokens to the current InputArea shell**
  Retain the existing input ref, file handling, global `/` and Enter shortcuts, send logic, audio controls, mic controls, and hand-tracking state. Add or improve accessible input/control names only where currently absent. Do not change its command semantics or location in a way that collides with mobile navigation.
- [ ] **Step 5: Run shell tests and review the command dock at desktop and mobile sizes**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
  Expected: token, focus, and reduced-motion assertions pass; existing smoke tests still pass.
- [ ] **Step 6: Commit**
  `git add src/index.css src/InputArea.tsx e2e/spatial-os-shell.spec.ts && git commit -m "feat: establish shared ADVIS spatial UI tokens"`

### Task 3: Make Home visibly Core-led and registry-backed

**Files:**
- Modify: `src/ScientificLaunchpad.tsx`
- Modify only the necessary launchpad composition in: `src/App.tsx`
- Reuse: `src/SpatialLibrary.ts`, `src/scientific/ScientificModelRegistry.ts`, and existing chemistry/lesson data.

**Interfaces:**
- Consumes: existing `onOpenView`, `onSelectMolecule`, and `onSelectSpatialObject` callback contracts.
- Produces: a clear, responsive home hierarchy with functional learning/comparison/exploration routes and direct starts validated against existing data.

- [ ] **Step 1: Add or refine browser assertions for home hierarchy and quick starts**
  Verify that the user sees one primary command surface, the existing ADVIS Core remains visible on Home, all home actions have meaningful accessible names, and catalog claims are based on current records rather than fixed numeric copy.
- [ ] **Step 2: Resolve direct-start cards against the existing records**
  Keep a small curated ordering of useful starts, but render an entry only when the target exists in the correct existing catalog and is not explicitly unavailable. Molecule starts must resolve through existing chemistry data; scientific system starts must resolve through the relevant library/registry. Do not make the launchpad a second source of scientific truth.
- [ ] **Step 3: Add a clear Learning Studio entry using the existing view callback**
  Keep the established `learning` callback contract and map it to current app behavior. Do not create a new route/state machine just to support a card.
- [ ] **Step 4: Replace count-heavy cards and the flat shortcut row with a clear hierarchy**
  Use concise destination names, short descriptions, restrained badges only for real differentiators, and one primary command entry integrated with the existing Core/InputArea composition. Do not add a second prompt or fictional readiness/status indicators.
- [ ] **Step 5: Run the home tests and validate the existing scientific model list**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
  Run: `npm run validate:catalog && npm run validate:science && npm run validate:capabilities`
  Expected: Home routes work, obsolete fixed count claims are absent, catalog/scientific contracts pass.
- [ ] **Step 6: Commit**
  `git add src/ScientificLaunchpad.tsx src/App.tsx e2e/spatial-os-shell.spec.ts && git commit -m "feat: make ADVIS home Core-led and data-aware"`

### Task 4: Unify desktop and mobile navigation without losing destinations

**Files:**
- Modify: `src/Sidebar.tsx`
- Modify: `src/MobileNav.tsx`
- Modify: `e2e/spatial-os-shell.spec.ts`

**Interfaces:**
- Consumes: existing menu IDs, icons, `currentView`, and `setView(id)`.
- Produces: a single destination model with group metadata used consistently across both navigation modes.

- [ ] **Step 1: Add navigation contract assertions**
  Assert the exact set of eleven destination IDs remains represented by their visible, accessible controls; on mobile, assert Home and a labelled More/secondary-destination control are reachable without requiring an icon guess.
- [ ] **Step 2: Group the existing menu data**
  Keep all IDs and callback values unchanged. Add grouping metadata such as Workspace, Explore, Learn & Experiment, and System; avoid introducing new routes for visual purposes.
- [ ] **Step 3: Refine desktop navigation**
  Introduce clear section hierarchy, sentence-case labels, predictable active-state styling, and an accessible navigation landmark. Home must return to the current app home state rather than clear scientific state accidentally.
- [ ] **Step 4: Replace mobile icon-only navigation with a compact labelled pattern**
  Keep Home always visible, show a small set of high-value labelled destinations, and expose all other current destinations in a labelled More menu/panel with `aria-expanded` and `aria-controls`. Include safe-area padding and ensure it does not overlap or block the existing command dock.
- [ ] **Step 5: Run desktop/mobile navigation tests**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
  Expected: every existing destination is reachable at both viewport sizes, no horizontal page overflow at 390px, and active labels/focus are exposed correctly.
- [ ] **Step 6: Commit**
  `git add src/Sidebar.tsx src/MobileNav.tsx e2e/spatial-os-shell.spec.ts && git commit -m "feat: unify ADVIS desktop and mobile navigation"`

### Task 5: Carry the same workspace grammar into scientific panels

**Files:**
- Modify as needed, one panel at a time: `src/App.tsx`, `src/ScientificHUD.tsx`, `src/EngineeringReferenceCockpit.tsx`, `src/LearnEngine/MolecularBuilderHUD.tsx`, `src/LearnEngine/LearnWorkspace.tsx`, `src/learning/LessonRunner.tsx`, `src/components/v8/V8EngineController.tsx`, `src/components/v12/V12EngineController.tsx`
- Reuse: tokens/primitives from Task 2.

**Interfaces:**
- Consumes: existing panel props and scientific/model/lesson callbacks.
- Produces: a shared presentation grammar around existing domain-specific controls.

- [ ] **Step 1: Add assertions for a stable spatial return path**
  Extend E2E checks to open the four-stroke model and a second representative target (molecule or anatomy), assert a reachable Home/Back/Exit control, and return Home without app startup errors.
- [ ] **Step 2: Normalize the top context/return strip in the root composition**
  Make the active context and return action predictable when the sidebar and command dock recede in spatial mode. Keep `currentView`, current object, molecule session, learning session, and engineering mode distinct; do not rewrite the `App.tsx` state machine or remount the Canvas.
- [ ] **Step 3: Apply shared surfaces, headings, controls, and status styling to ScientificHUD and EngineeringReferenceCockpit**
  Keep the model stage spatially dominant. Use contextual panels and progressive disclosure; do not remove existing inspection, isolate/show-hide, explosion/reset, measurement, camera, kinematic, telemetry, save/load, or evidence controls.
- [ ] **Step 4: Apply the same presentation conventions to lessons, molecular builder, and V8/V12 controls**
  Normalize typography, spacing, selected/focus states, panel headers and close/return affordances. Preserve domain-specific controls and all passed callback props. Do not force unlike controls into identical layouts.
- [ ] **Step 5: Check tracking-loss recovery and renderer/session persistence**
  Verify that losing hand tracking pauses interaction without clearing the selected model/session; closing a panel and returning Home must not leave stale selection, stop required cleanup, or create a duplicate Canvas.
- [ ] **Step 6: Run targeted domain and browser regression tests**
  Run: `npm run test:e2e -- e2e/spatial-os-shell.spec.ts`
  Run: `npm run test:simulation && npm run test:explosion && npm run test:domains && npm run test:kinematics`
  Expected: core model/lesson interactions and scientific calculations retain their existing behavior.
- [ ] **Step 7: Commit in coherent panel-sized changes**
  Commit only the files reviewed in each panel-sized batch; use messages that identify the panel or behavior, not a single sprawling “redesign everything” commit.

### Task 6: Responsive, accessibility, and release-candidate verification

**Files:**
- Modify: `e2e/spatial-os-shell.spec.ts` as needed
- No production configuration files should be changed.

**Interfaces:**
- Consumes: tasks 1–5 and the existing validation suite.
- Produces: an evidence-backed review branch suitable for browser preview review; not a production release.

- [ ] **Step 1: Cover desktop and mobile acceptance sizes**
  Run Playwright at 1366×768 and 390×844. Assert no unwanted horizontal overflow, no blocking overlay over primary controls, discoverable Home/Back, and usable command input.
- [ ] **Step 2: Run every existing validation and build command**
  Run: `npm run lint`
  Run: `npm run build`
  Run: `npm run test:e2e`
  Expected: all catalog, lesson, scientific-trust, capability, simulation, explosion, study-project, tutor-context, lesson-progress, workshop, domain, kinematics, build, and E2E checks pass.
- [ ] **Step 3: Review model-domain regression paths**
  Use the existing launch/load path for V8, V12, one molecule/chemistry case, anatomy, and Learning Studio. Confirm no control appears to work unless its existing capability supports it.
- [ ] **Step 4: Capture before/after browser evidence**
  Capture desktop Home, spatial V8, V12, molecule, anatomy, learning, and mobile Home/workspace at their target viewports where the local browser harness supports them. Report any state requiring camera permission instead of treating it as a pass.
- [ ] **Step 5: Verify preview ownership before attempting preview validation**
  Identify the actual Vercel project Git-linked to `Ady5545/ADVIS-NCSC` and the resulting preview URL. If the project cannot be verified in the connected account, document that blocker and use local Playwright evidence; do not substitute the unrelated `Ady5545/ADVIS` project or guess a deployment URL.
- [ ] **Step 6: Confirm release discipline**
  Do not promote, alias, roll back, or deploy to production as part of this plan. Present the branch, passing checks, screenshots, and any environment blockers for review.
- [ ] **Step 7: Commit final test changes**
  `git add e2e/spatial-os-shell.spec.ts && git commit -m "test: verify ADVIS spatial OS responsive shell"`

---

## Self-review record

- **Spec coverage:** WP-A is covered by Task 1 and Task 6; WP-B by Tasks 2–3; WP-C by Task 4; WP-D by Task 5; WP-E by Tasks 1, 4–6; WP-F by Task 6.
- **Step scan:** each task starts with observable browser or existing scientific-contract checks, then implementation and a defined verification command. Existing app behavior is retained rather than rewritten.
- **Interface consistency:** navigation continues to use `currentView` and `setView(id)`; Home quick starts keep the declared `ScientificLaunchpad` callback signatures; context panels keep their existing props and action handlers.
- **Review-focus tests:** catalog absence (Task 3), destination reachability (Task 4), session/Canvas continuity (Task 5), overlay interaction (Tasks 5–6), responsive/reduced motion/focus (Tasks 2 and 6).
- **Proportion:** this plan selects files, tests, interfaces, and commit boundaries without duplicating application code.
- **Release safety:** only a separate branch is used; the plan forbids production deployment/alias/config changes and requires verified repo-to-preview linkage.

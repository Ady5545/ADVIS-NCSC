# ADVIS-NCSC Spatial OS Experience Redesign

- **Status:** Design specification for review
- **Date:** 2026-10-18
- **Repository:** `Ady5545/ADVIS-NCSC`
- **Baseline:** `main` at `5234f7b9f677723e9a73be46265377ca668eb8fd` (restore of the pre-redesign snapshot)
- **Chosen direction:** Core-led Spatial OS with an immersive scientific workspace
- **Scope:** Experience layer and shared UI system; no production rollout

## 1. Product intent

ADVIS must remain unmistakably ADVIS: the Spatial AI Operating System built around the recognizable blue ADVIS Core, spatial interaction, scientific models, and contextual intelligence. This is not a rebrand, a chemistry-first product, a generic chat interface, a conventional dashboard, or a cosmetic reskin of another site.

The product distinction is coherence of the investigation: a learner enters through a question or scientific system, inspects the same object, explores its structure, operates available simulation controls, reads measurements and evidence, and asks for an explanation without feeling that separate applications have been stitched together.

**Design promise: one ADVIS Core, one consistent operating language, many scientific worlds.**

Within ten seconds, a new user should recognize ADVIS's Core-led identity, understand that this is a spatial scientific system rather than a conventional model-card catalogue, and find a clear way to start a question, launch an existing system, or enter an existing learning/exploration destination.

## 2. Current-main baseline and evidence

This specification is grounded in the current `main` tree and repository `AGENTS.md`; unmerged design branches are experiments, not the baseline.

### Foundations to preserve

- `src/App.tsx` owns session/interaction state, full-screen React Three Fiber composition, the Core, launchpad, navigation, command input, ScientificHUD, learning/molecular surfaces, and engineering-cockpit integration.
- `src/HologramCore.tsx` is the existing Core rendering and spatial/gesture integration. The first redesign phase does not replace its visual geometry.
- `src/SpatialLibrary.ts`, `src/SpatialObjectEngine.tsx`, autonomous model engine, scientific registry/store/schema, simulation engine, V8/V12 controllers and audio engines, chemistry/anatomy modules, lesson system, engineering cockpit, CAD/fidelity contracts and existing tests contain established product/scientific work.
- `src/ScientificHUD.tsx`, `src/EngineeringReferenceCockpit.tsx`, `src/LearnEngine/LearnWorkspace.tsx`, `src/LearnEngine/MolecularBuilderHUD.tsx`, and V8/V12 controllers already contain interactions. Their behavior is not to be replaced by a new shell.
- `src/InputArea.tsx` combines typed commands, attachments, microphone/voice-related controls, send behavior and status affordances. Retain these and do not add a second competing command box.
- `src/index.css` already includes reduced-motion handling and visible keyboard focus styling; retain and improve these safeguards.

### Gaps observed in current source

- `ScientificLaunchpad.tsx` presents four compact destinations and a row of direct 3D shortcuts. It lacks a clear Core-led hierarchy, omits a Learning Studio card despite the callback type supporting it, and displays catalog counts as hard-coded strings.
- `Sidebar.tsx` has eleven destination IDs with uppercase technical labels as one long list, rather than a small number of legible groups.
- `MobileNav.tsx` hides Home and renders icon-only navigation without explicit per-button accessible labels in the current implementation.
- The root is a full-viewport Canvas with separately composed overlays. When `isSpatial` turns true, navigation/sidebar/input recede while ScientificHUD and other panels use independent render conditions. The behaviors are valuable, but the surfaces can feel stitched together.
- The default style is near-black/navy with cyan accents, glows and technical monospace labels. Engineering mode can use a light-neutral Canvas background. Evaluate that renderer-specific choice for contrast and model readability; do not change it blindly.
- `index.css` provides a small global token foundation while most styling is embedded in Tailwind classes; a coherent design system is a real UI task, not just a palette replacement.

### Existing experiments

Branches including `redesign/spatial-studio-2026-10-17`, `polish/unified-ui-system-2026-10-17` and Core redesign experiments are reference material, not merge targets. The spatial-studio branch is diverged/behind `main`; its CSS includes broad rewriting of legacy utility-class attributes and structural selectors. Do not import that strategy wholesale. No experimental branch replaces the restored `main` baseline without review and browser validation.

## 3. Chosen approach: Core-led Spatial OS

Use the **Core-led Spatial OS** as the global product language. Enter a more immersive layout when the user starts a scientific investigation.

### 3.1 Home / launchpad

Keep the existing recognizable ADVIS Core as the visual signature. It must not be replaced with a different AI logo or an unrelated decorative orb.

Home hierarchy:

1. **ADVIS identity and system status:** concise and calm; status indicators reflect real state rather than a permanently green decoration.
2. **Core stage:** enough room for the existing Core to be seen and understood. Use purposeful transitions and protect rendering performance.
3. **One primary command entry:** visually integrated with the existing `InputArea`; preserve typed, attachment, microphone and send behavior. Do not add a duplicate prompt.
4. **Clear starting routes:** Explore a system, Learn through a guided lesson, Compare systems, and Demonstrations. Route through existing view/action contracts rather than parallel routing logic.
5. **A small set of direct starts:** representative objects resolved against the real catalog/registry. Filter missing and explicitly unavailable assets. Do not show hard-coded counts or imply that every listed domain has a complete, validated simulator.

Home examples may cover engineering, molecules, anatomy, physics/electronics or space where corresponding real records exist. Do not overstate catalog completeness, model provenance or scientific fidelity.

### 3.2 Navigation: grouped, stable, responsive

Build one shared navigation model for desktop and mobile, retaining current destination IDs as the behavior contract. Group them under short headings such as **Workspace**, **Explore**, **Learn & Experiment**, and **System** without inventing routes solely for visual grouping.

Preserve these IDs exactly: `home`, `molecules`, `engineering`, `cad-lab`, `innovation-lab`, `compare`, `demonstration`, `lessons`, `gestures`, `telemetry`, and `settings`.

- Keep text labels on desktop; give icon-only mobile controls programmatic accessible names.
- Make the ADVIS mark/Home affordance return to the existing home state.
- Treat active destination and active scientific object as different concepts. Do not conflate `currentView`, spatial object, lesson/molecule session, and engineering mode.
- On immersive entry, navigation may collapse through a consistent transition, but an always-reachable Back/Home/Exit action must remain.
- Do not make a cramped icon-only row the only mobile route to the application. Use labelled compact/bottom navigation and a clearly named overflow/menu treatment for secondary destinations.

### 3.3 Scientific workspace: one shell, contextual tools

All domains should use the same workspace grammar around the existing 3D scene:

- **Top context strip:** ADVIS mark, Home/Back/Exit, current object/title or breadcrumb, and truthful core/tracking status.
- **Primary stage:** current Canvas/model. The model remains spatially dominant; retain existing camera/gesture behavior and avoid wrapping the renderer in a permanent card.
- **Context tools:** consistent surface and placement for object inspection, component selection, supported views, simulation/demonstration controls, lessons, measurements and evidence/provenance.
- **Command surface:** reuse the existing command system. Available actions may adapt to context, but baseline keyboard/voice/send behavior remains.
- **Return path:** Home/Back/Exit stays in a predictable position even when navigation recedes.

Use shared visual primitives—surfaces, borders, selected/hover/focus states, typography, spacing, buttons, drawers, tooltips, status indicators and transitions—for ScientificHUD, EngineeringReferenceCockpit, molecular builder, lesson runner and V8/V12 controls. This does not mean identical domain controls; it means consistent presentation conventions.

Apply progressive disclosure: show a few high-value controls, and place secondary options in labelled panels rather than stacking always-open windows over the model. Expose controls only when the selected model/domain can support them. Do not upgrade a capability, evidence status or limitation for visual completeness.

### 3.4 Domain-aware, not domain-fragmented

Keep the shared shell stable; change context content by domain.

- **Engineering:** component hierarchy, isolate/show/hide, exploded view/stages, kinematics, measurement, evidence and limitations where supported.
- **Chemistry:** molecule/atom/bond selection, geometry, and supported builder/lesson actions.
- **Biology/anatomy:** structural/system inspection; retain educational and non-clinical limitations where applicable.
- **Physics/electronics/other domains:** expose only model-specific measures and actions that exist and meet capability contracts.

Do not create a separate navigation framework, unrelated palette or fake tabs for unfinished functionality for each domain.

### 3.5 Visual language

The target is **premium, calm, spatial, scientific and unmistakably ADVIS**.

- Keep the deep navy/graphite foundation and recognizable electric-blue/cyan Core identity.
- Use blue/cyan for ADVIS and primary actions; neutral surfaces for controls/readability; semantic warning/error colors only for real states. Do not turn this into a light corporate dashboard or generic black/neon cyberpunk.
- Establish semantic tokens for page/background, scene/stage, raised surfaces, borders, text hierarchy, muted labels, brand/action color, focus, statuses and motion timings.
- Use constrained spacing/radius/type scales. Reserve monospace for instrument values and metadata; keep instructional text readable without excessive tracking or all-caps.
- Use restrained blur/glow and the existing Core. Effects must not impair contrast, legibility or frame rate.
- Motion should explain a transition/state and respect `prefers-reduced-motion`.
- Avoid global selectors that restyle arbitrary Tailwind class strings with `!important`, DOM-structure selectors such as `:nth-child` as a design API, duplicated token values, and broad CSS overrides that unintentionally alter scientific panels.

### 3.6 Responsive/accessibility contracts

- **Desktop:** persistent discoverable navigation, generous model stage, contextual surfaces that do not cover important object geometry.
- **Tablet:** compact navigation without collisions with Canvas or command input; labels remain discoverable.
- **Mobile:** discoverable Home/Back, touch-sized controls, labelled navigation, reachable command entry, safe-area padding and scrollable panels. Essential actions remain accessible in immersive mode.
- Preserve keyboard operation, visible focus, semantic names/headings/landmarks, sufficient contrast and reduced motion.
- Camera/hand-tracking errors remain honest. Tracking loss pauses interaction without resetting the workspace or losing the active session.

## 4. State and behavior contracts

This is chiefly an experience-layer redesign. Preserve the established behavior/data paths.

1. Keep the current `currentView` values and menu IDs. Navigation rearrangement is presentational and uses existing callbacks.
2. Preserve model selection, molecule and learning sessions, component selection/hover state, spatial mode, explosion interpolation ownership, camera controls, quality settings, audio lifecycle, gesture tracking and action-preview behavior.
3. Do not rewrite the `App.tsx` state machine to make layout easier. It is a high-risk integration boundary: prefer small presentation components and typed props; limit edits to composition/layout.
4. Do not change scientific equations, model geometry, simulation semantics, capability metadata, evidence labels, asset provenance/licensing, APIs/server routes or saved-study data in the UI pass.
5. Retain current Canvas/Core lifecycle semantics; opening/closing a panel must not unnecessarily recreate the scene or reset model/session state.
6. Do not claim counts, verification, accuracy, runtime readiness or AI capabilities unless grounded in current data/state.
7. Avoid new dependencies for styling alone unless the implementation plan proves necessity and accounts for bundle/performance impact.
8. Every visible control must be functional; no mock control is shipped as if working.

## 5. Likely implementation boundaries

Validate these boundaries before implementation; this is a candidate map, not authorization to rewrite every file.

| Area | Candidate files | Boundary |
|---|---|---|
| Tokens/primitives | `src/index.css`; a small shared UI module if justified | Add semantic tokens and consistent primitives; no blanket legacy class rewrites. |
| Home | `src/ScientificLaunchpad.tsx` | Change hierarchy and real-data quick starts while preserving callback signatures/model-loading behavior. |
| Navigation | `src/Sidebar.tsx`, `src/MobileNav.tsx` | Share destination definitions and presentation; preserve IDs and `setView`. |
| Root composition | `src/App.tsx` | Narrow overlay/composition edits; do not rewrite state/action logic or Canvas behavior. |
| Command dock | `src/InputArea.tsx` | Apply shared tokens/layout while preserving voice, attachments, send and keyboard behavior. |
| Scientific panels | `src/ScientificHUD.tsx`, `src/EngineeringReferenceCockpit.tsx`, molecular/learning/controller panels | Normalize styling/layout in stages; preserve domain behavior. |
| Startup/modals | `index.html`, modal/startup boundary only if necessary | Keep diagnostics, fallback and errors functional and honest. |

## 6. Delivery work packages

This is the design scope, not the task-by-task implementation plan. A separate implementation plan follows only after the spec is reviewed and approved.

1. **WP-A — Baseline contract:** capture current home, spatial, lesson, molecule and mobile states where possible; identify the correct Git-linked preview/deployment target. No production rollout.
2. **WP-B — Tokens and launchpad:** semantic token foundation, Core-led home, accurate quick starts, stable command dock.
3. **WP-C — Navigation and immersive state:** normalize desktop/mobile navigation and consistent enter/exit transitions with clear return affordance.
4. **WP-D — Shared scientific surfaces:** apply common primitives/progressive disclosure to HUD, cockpit, lesson/molecule surfaces and applicable V8/V12 controls without removing model-specific capability.
5. **WP-E — Responsive/accessibility/regression:** overflow, reachability, focus/keyboard, reduced motion, pointer events, tracking loss/recovery and renderer persistence.
6. **WP-F — Review gate:** run current automated validation/build, smoke/E2E checks, and real browser preview review. Production promotion is separate and out of scope until accepted.

Split packages into small reviewable commits. First prioritize WP-B and the smallest necessary part of WP-C, then review captures/behavior before normalizing all scientific panels.

## 7. Acceptance criteria

A successful build or an attractive screenshot alone is not sufficient.

### Identity and consistency
- Home visibly retains the recognizable ADVIS Core, blue identity and unified spatial-science positioning.
- Navigation, buttons, focus/selected states, text hierarchy, surfaces and transitions look consistent across home, spatial inspection, engineering, molecular building and lessons.
- Every current destination remains reachable and retains its existing destination/action contract.

### Scientific behavior/integrity
- Loading a valid spatial model, leaving it, returning home and loading it again work without stale selection, lost session or a broken Canvas.
- Existing component selection, isolate/show-hide, explosion/reset, available simulation controls, measurements, lesson starts, molecule sessions and command actions remain functional where they already exist.
- Regression coverage includes V8, V12, at least one molecule/chemistry model and at least one anatomy/non-engine model.
- Unsupported controls stay hidden/disabled according to current capabilities; evidence and accuracy limits remain truthful.
- Tracking loss does not reset the workspace; Back/Exit works while the sidebar is hidden.

### Responsive/accessibility
- Desktop at a common **1366×768** viewport has no unintended overlap between model, navigation, HUD/inspector and command dock.
- Mobile navigation is not an unexplained icon-only row; Home/Back, command entry and primary actions remain reachable with no horizontal page overflow.
- Keyboard operations and focus remain usable; icon-only controls have accessible names; reduced motion remains supported.
- Pointer-event layers do not block the Canvas or make interactive panels inert.

### Performance/release discipline
- No heavy dependency is added for appearance alone.
- Opening/closing a UI surface does not remount/reset the Core/Canvas/model session unnecessarily.
- Run current checks where available: catalog, lesson, scientific-trust, simulation, explosion, study-project, tutor-context, lesson-progress, workshop, domain and kinematics validations, TypeScript, build and Playwright smoke tests.
- Before/after browser captures cover desktop home, V8, V12, molecule, anatomy, learning and mobile home/workspace where available.
- A green build is not browser verification. Confirm the actual Git-linked ADVIS-NCSC Vercel project/deployment before reporting preview or production status. No production alias changes in this work package.

## 8. Explicit non-goals

- No backend/API/server rewrite, auth/data migration, scientific-engine rewrite, renderer replacement, model regeneration or 3D asset deletion.
- No forced replacement of the current Core with minimal-orb/atomic-orb experiments.
- No new AI capability, evidence claim, persistence system or simulated control presented as a finished feature.
- No wholesale merge/cherry-pick of a divergent UI experiment branch.
- No production deploy, alias promotion, rollback, domain change or Vercel configuration change during implementation.
- No copying of Chemisphere's branding, screen layout, copy, signature interactions or assets. Differentiation comes from ADVIS's Core-led identity and coherent model/simulation/data/explanation workflow.

## 9. Risks and mitigations

- **Root shell regression:** narrow `App.tsx` edits, small commits, stable callback contracts and per-session smoke tests.
- **CSS leakage:** migrate component-by-component through semantic tokens; no broad `!important` mappings.
- **Layer/hit-testing conflict:** document z-order/pointer-events and test actual clicks/keyboard operation.
- **Mobile destination loss:** shared navigation data, clear Home/Exit, named controls and real narrow-viewport tests.
- **Scientific overclaim:** registry/capability/evidence data remains authoritative; visuals cannot make unsupported features appear available.
- **Deployment-target confusion:** prior repo notes report Vercel access/verification limitations, and project name alone is not proof of repository linkage. Verify the Git-linked ADVIS-NCSC project and preview target; leave production untouched until preview is verified.

## 10. Decision record

The chosen direction is **Core-led Spatial OS with immersive scientific investigation mode**. Preserve ADVIS's identity and put a coherent experience layer around the existing scientific work. Review and approve this specification before writing the implementation plan; review that plan before implementation begins.

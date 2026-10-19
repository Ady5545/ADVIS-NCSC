# ADVIS Unified Workspace — UI / HUD Implementation Plan

## Scope and ownership boundaries

This work starts from the exact deployed source commit `5db806f835d67ef705d474fdf95a1e1ff4f2f8e4` on `feat/core-led-spatial-os-2026-10-18`, via the isolated branch `feat/unified-advis-workspace-2026-10-19`.

**This phase is exclusively application UX, HUD, routing, workspace-session state and assistant orchestration.** It does not edit or regenerate 3D assets, geometry, model catalogue records, generators, CAD assets, `HologramCore`, `SpatialObjectEngine`, simulation algorithms or scientific model definitions. Those areas remain untouched for Affan and the later, explicitly approved model work.

No merge or production promotion occurs without explicit approval.

## Delivery goals

1. Provide one desktop workspace header with current destination/context, assistant access, saved-session access, save action and universal search.
2. Make the same core tools reachable from the mobile navigation and spatial inspection, without replacing the existing navigation architecture.
3. Search existing destinations, registered spatial objects and components, molecules and lessons using the data already in the repository. Search results route through shared application handlers.
4. Keep model selection, component selection, molecule selection, lesson opening and spatial exit aligned with a single app-level context, preventing stale scientific action state from leaking between modules.
5. Add a context-aware assistant dock which reuses the existing ADVIS conversation pipeline, so prompts continue to receive the selected workspace context from the existing App/backend request packet.
6. Save up to 12 workspace-session snapshots locally on the device. A snapshot records view/model/component selection, control settings, engine UI/kinematic settings, display toggles and optional lesson/canonical-molecule context. This is **not** a geometry export and does not upload the snapshot.
7. Validate restored identifiers against existing catalogue and lesson data before opening them; sanitize numeric/preferences values before applying them.

## Current implementation

- `src/UnifiedWorkspaceCenter.tsx`: shared command palette, desktop workspace header, assistant dock, save dialog and saved-workspace list.
- `src/workspace/WorkspaceSessionStore.ts`: typed, versioned, locally stored workspace snapshots with normalization, a maximum of 12 entries and delete support.
- `src/App.tsx`: one set of selection/restore/assistant handlers; context snapshot wiring; command-center and assistant visibility state; safe model/component/lesson/molecule ID checks; scientific action context synchronization when changing the active model context.
- `src/MobileNav.tsx`: search, assistant, save and saved-workspace actions are reachable from the existing mobile navigation.
- `src/ChatPanel.tsx`: the App-shared types are imported as type-only, avoiding a runtime import cycle when the same chat view is embedded in the assistant dock.

## Session persistence limitations (intentional and explicit)

- Snapshots are kept in browser local storage on the current device, not synchronized across accounts or devices.
- They restore workspace navigation, selection and supported UI/control state, not 3D geometry or model assets.
- The current custom molecular builder's editable atom/bond graph is not serialized by this snapshot format. The save UI must tell the user this when such a custom graph is active instead of implying the molecule itself will be restored.
- Current free-form chat history remains governed by the existing chat-history implementation. Workspace snapshots do not duplicate or transmit conversations.
- Camera pose and exact model-transform edits are not included in this initial session snapshot.

## Validation checklist

- TypeScript validation and production build pass.
- Universal search filters destinations/models/components/molecules/lessons and keyboard navigation works.
- Desktop and narrow/mobile layouts remain usable; the mobile menu keeps its existing destination navigation.
- Assistant sends through the existing `handleSendMessage` flow with active selection/context intact.
- Save, load, delete and invalid snapshot data handling operate locally.
- Selecting a new model/component/molecule and exiting a spatial view clear or synchronize app/scientific context correctly.
- Run current browser startup / narrow viewport smoke tests and distinguish pre-existing shell/theme failures from any new regressions.
- Review the generated preview; do not infer visual acceptance from build success alone.
- No 3D model, geometry, generator, simulation, catalogue or Core shader files changed in this scope.
- Keep the PR draft; do not merge or deploy to production without the user's explicit instruction.

# ADVIS spatial command HUD — implementation plan

## Exact source baseline
- Start from current production-source branch `main`, commit `045917f65d0a9d8d7cde65175fa83c2229037a85` (`Replace lumpy gas puffs with flowing nebula wisps`, 2026-10-19).
- Work is isolated on `feat/advis-spatial-command-hud-2026-10-19`.
- Vercel production-alias verification was unavailable during setup due to a scope-authorization error. The branch is based on the current `main` SHA, and the user should compare the preview to the live site before accepting it.

## Design contract
ADVIS is a spatial desktop application, not a content website. Preserve the current black-and-cyan industrial shell, left navigation, existing mobile icon row, scientific four-corner HUD, and spatial canvas. Do not add a conventional full-width navbar/header or reflow the 3D canvas for persistent chrome.

In a spatial session, expose a small floating command pod with active context and quick actions, anchored high in the center lane so it avoids the four-corner scientific overlays. Outside the spatial session, expose universal search through the existing Sidebar and MobileNav brand area plus Ctrl/Cmd+K.

## Unified app behavior
- Universal command search uses existing catalogues to find destinations, eligible spatial objects/components, chemistry database entries, and lessons.
- Assistant opens in a contextual dock but continues to send through the existing ADVIS message pipeline.
- Workspace sessions save supported navigation/context/control state locally on the current device, with up to 12 snapshots. Restores validate catalogue identifiers and sanitize user storage.
- Shared navigation handlers synchronize the active model/component/lesson/molecule context to prevent stale selections.
- Secure workspace lockdown closes all command surfaces.

## Scope guardrails
This PR changes only application UI/orchestration, navigation triggers, session state and test/docs. It must not modify 3D assets, geometry, generators, `HologramCore.tsx`, `SpatialObjectEngine.tsx`, `SpatialLibrary.ts`, scientific model definitions, or simulation algorithms. Affan's model work stays outside this branch.

## Deliberate session limitations
- Saved sessions are local to the current browser/device and are not synced across devices/accounts.
- Snapshots store view and supported presentation controls, not 3D geometry/assets, exact camera pose, component transform edits, or custom molecular builder atom/bond graphs.
- Existing chat history continues to follow its current persistence path and is not duplicated into snapshots.

## Validation
- TypeScript and production build via the repository's GitHub Actions workflow.
- Existing app startup and narrow-viewport Playwright smoke tests remain intact.
- Added browser tests cover Ctrl/Cmd+K chemistry search and local workspace save/restore/delete.
- Review the actual preview visually before merge. No production deploy or PR merge without explicit user approval.

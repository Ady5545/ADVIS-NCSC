# A.D.V.I.S.-NCSC implementation baseline

## Baseline source

- Repository: `Ady5545/ADVIS-NCSC`
- Baseline branch: `main`
- Baseline commit: `406e6c5abcd1faac8eb4329495b6ed698a02a4e8`
- Baseline commit title: `Fix V8 exploded view component separation`
- Baseline timestamp reported by GitHub: 2026-10-13 10:32:19 UTC
- Implementation branch: `feat/deep-implementation-foundation-2026-10-13`

## Observations confirmed from source

1. The V8 explosion fix is present in the current main source: the latest commit updates `explodedFactor` when changing spatial modes and makes the HUD toggle update the explosion factor.
2. `src/cad/CadCertification.ts` previously promoted a CAD-looking file extension to `SOURCE_CAD_VERIFIED` and set all validation booleans to `true` without validation records.
3. `src/cad/GeometryFidelity.ts` previously inferred L4 geometry authority, deep zoom, and interior inspection from `cadAssetPath`, and inferred interior inspection for generic procedural geometry.
4. `src/EngineeringReferenceCockpit.tsx` has a flat component drawer and camera presets. Its current “SECTION” mode is driven by the `blueprintEnabled` flag; that flag is a wireframe/presentation path, not evidence of a true section-plane implementation.
5. `package.json` has a no-op lint script that only prints “Linting complete”.
6. The repository already has TypeScript/build validation in `.github/workflows/static.yml`.

## Verification boundary

- Source-level checks above are based on GitHub's current `main` content.
- A live browser smoke test and visual check of the V8 assembled/exploded states were not completed in this session.
- The connected Vercel integration returned HTTP 403 for the `ady17` scope, so production deployment details could not be inspected through that connection. Do not treat a Vercel “Ready” state as browser verification.
- The baseline is the latest source commit available from GitHub, not an independently verified production bundle.

## Smoke-test checklist to use after CI and deployment

- [ ] Open the live page and confirm React mounts and the WebGL canvas renders.
- [ ] Open the V8 in assembled mode; record the active model ID and screenshot.
- [ ] Move the explosion control from 0 to 0.5 to 1; verify measurable component separation.
- [ ] Return to factor 0 and verify canonical positions exactly restore.
- [ ] Switch V8 → V12 → a non-engine model; verify no telemetry/audio state leaks.
- [ ] Select a part from the component drawer, inspect its text, then select from the canvas.
- [ ] Check keyboard-only access and a narrow mobile viewport.
- [ ] Record commit, deployment URL/status, browser, result, and any console errors.

## Release rule

Passing TypeScript or a production build is necessary but not sufficient. Production acceptance still requires a live-page render and a real interaction smoke test against the deployed commit.

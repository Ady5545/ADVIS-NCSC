# ADVIS Core Nebula — Implementation Plan

## Guardrails

- Source of truth: deployed commit `5db806f835d67ef705d474fdf95a1e1ff4f2f8e4` on `feat/core-led-spatial-os-2026-10-18`.
- Working branch: `feat/nebula-volumetric-flow-core-led-2026-10-19`, draft PR #53.
- No merge or production promotion without explicit approval.
- Preserve the mathematically spherical core; all organic variation belongs in surface/volume shading, not vertex deformation.
- Avoid unrelated application, camera, UI, science-model or backend changes.

## Baseline

- High-resolution spherical core and shader-driven magenta/rose/blue/cyan cloud surface.
- 30 curved mesh sheets for outer gas and 46 moving condensate points.
- Existing centered home-camera rig, bloom, spatial-mode transition, audio signals and system-state signal.
- TypeScript and Vite build passed after the last syntax fix. The repository's broad browser smoke suite previously failed on application-shell timeouts and a theme-style assertion; these are tracked separately and must not be assumed green.

## Phase 1 — Volumetric gas renderer

- Add `src/NebulaVolume.ts` containing an isolated Three.js `ShaderMaterial` factory for bounded volumetric gas.
- Use a sphere proxy and a conservative, bounded ray-march with early termination.
- Shape broken 3D cloud masses using warped low-frequency density plus restrained higher-frequency detail; integrate colour and transmittance along the ray.
- Stop sampling at the near-side intersection of the planet's inner radius, so the far-side gas does not overlay the planetary disc.
- Use a limited, explicit sample budget; no per-frame allocation; allow a lower sample count at higher canvas pixel ratios.
- Keep the existing gas layers temporarily, so the volume can be compared in isolation before removing redundant geometry.

## Phase 2 — Integrate with the Core

- Add a single volume mesh to `HologramCore`.
- Feed time, voice, activity, camera-local origin and sample budget through existing uniforms/useFrame; do not trigger a React render every frame.
- Keep the mesh aligned with group transforms and spatial-mode collapse; explicitly manage transparent render ordering.
- Retain the current planet radius and spherical mesh.

## Phase 3 — Gas shape and density refinement

- Tune broad cloud banks, turbulent curling structures, soft/broken edges, fine filaments and a small number of longer wisps.
- Reduce/retire existing ribbon/particle contribution only after the new volume visibly replaces it.
- Preserve dark negative space between formations; avoid thick rigid ribbons, evenly spaced strands or oversized dots.

## Phase 4 — Lighting and composition

- Refine the day/night terminator, violet shadow-side fill, narrow electric-blue rim, restrained rose edge and subtle halo.
- Keep the core visually dominant. Leave the camera rig unchanged unless real preview captures show a framing issue.

## Phase 5 — State and voice response

- Idle: slow circulation and gentle breath.
- Listening: subtle perimeter response.
- Thinking: more active internal turbulence, not flashing.
- Searching: slightly stronger outward-moving wisps.
- Speaking: restrained motion/intensity response connected to existing audio values.
- Error: visibly distinct but controlled response using the existing state.
- Smooth transitions; no jitter or rapid random flicker.

## Phase 6 — Performance and verification

- Run TypeScript validation and Vite production build after shader and integration changes.
- Verify shader compilation and real rendered output in the preview, ideally with desktop and mobile screenshots.
- Test idle/listening/thinking/searching/speaking and spatial-mode transition, resize and reload.
- Inspect performance and tune quality/sample budget before layering additional effects.
- Keep existing app-shell/theme failures separately tracked; confirm whether new changes introduce any additional failures.
- Update PR findings and only merge/promote after visual and functional checks pass.

## Acceptance criteria

1. Planet silhouette remains spherical and readable.
2. Gas reads as translucent 3D cloud volume, not a solid shell or uniformly spaced ribbons.
3. Far-side gas does not bleed across the planet surface.
4. State/voice response is subtle, smooth and consistent with real ADVIS states.
5. TypeScript/build pass; shader compiles; preview output is inspected; performance is acceptable on a narrow/mobile viewport.
6. Production remains untouched until explicit approval.

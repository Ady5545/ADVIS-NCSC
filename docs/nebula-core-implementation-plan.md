# ADVIS Core Nebula — Implementation Plan

## Guardrails

- Source of truth: deployed commit `5db806f835d67ef705d474fdf95a1e1ff4f2f8e4` on `feat/core-led-spatial-os-2026-10-18`.
- Working branch: `feat/nebula-volumetric-flow-core-led-2026-10-19`, draft PR #53.
- No merge or production promotion without explicit approval.
- Preserve the mathematically spherical core; all organic variation belongs in surface/volume shading, not vertex deformation.
- Avoid unrelated application, camera, UI, science-model or backend changes.

## Delivery checkpoints

- **Checkpoint 1 — first 50% (Phases 1–3):** implement the bounded volume renderer, integrate it with the existing core, and refine the cloud field while preserving enough legacy tendrils for comparison. Stop after this checkpoint for user preview/review.
- **Checkpoint 2 — remaining 50% (Phases 4–6):** lighting/composition, deeper state-response tuning, performance and rendered-preview verification. Do not begin this checkpoint until the user explicitly approves after reviewing Checkpoint 1.
- Existing state/audio uniforms remain connected where already present; this checkpoint does not expand the later state-response phase.

## Checkpoint 1 progress

- **Phase 1 — implemented, visual review pending:** src/NebulaVolume.ts uses a bounded spherical proxy, conservative front-to-back integration, early termination, and clips sampling at the near-side inner-core intersection. Its cloud field now uses anisotropic flow coordinates and sparse filament density to avoid only round, isolated blobs.
- **Phase 2 — integrated, visual review pending:** one volume mesh is driven through existing per-frame uniforms; camera-local coordinates are reused, render order is explicit, disposal is wired, and ray-march sample count adapts to drawing-buffer size/DPI.
- **Phase 3 — first density pass implemented, visual review pending:** the volume has elongated cloud banks and broken filaments; existing gas sheets are down to 20 and 46 condensate points remain. No further ribbon/particle reduction until the preview has been reviewed.
- No production promotion or merge has occurred. The current work remains in draft PR #53.
- The latest two shader/integration refinement commits have not yet completed CI; the current run must be checked before this checkpoint is considered ready to inspect.

## Baseline

- High-resolution spherical core and shader-driven magenta/rose/blue/cyan cloud surface.
- 20 curved mesh sheets remain as outer tendrils, with 46 moving condensate points. Do not reduce these further until rendered preview review confirms the new volume carries the mass.
- Existing centered home-camera rig, bloom, spatial-mode transition, audio signals and system-state signal.
- On the last validated pre-refinement commit, TypeScript and the Vite production build passed. The browser smoke suite still had three failures: mobile secondary-navigation interaction timeout, module-dialog/close timeout, and a theme text-color assertion returning no RGB channels. The newest volumetric refinements must be revalidated independently.

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

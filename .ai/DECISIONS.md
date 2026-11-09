# ADVIS — Architectural Decisions

> This file records significant design choices made during ADVIS development.
> Format: each entry has a **Decision**, **Rationale**, and **Tradeoffs**.

---

## ADR-001: React Three Fiber over raw Three.js imperative API

**Decision:** Use `@react-three/fiber` as the Three.js React renderer rather than writing imperative Three.js scene management.

**Rationale:** ADVIS is a React application; R3F integrates Three.js as declarative JSX. This aligns the 3D scene with the React component lifecycle, simplifying state-driven rendering (e.g., toggling exploded view, switching models by changing props).

**Tradeoffs:** R3F adds a reconciler layer; direct imperative escape hatches (`useFrame`, `useThree`) are still needed for high-frequency animation updates (kinematics, gesture camera).

---

## ADR-002: MediaPipe Hands runs client-side only — frames never sent to server

**Decision:** All hand tracking processing (MediaPipe model inference, landmark extraction) runs entirely in the browser. Only semantic gesture events reach `App.tsx`.

**Rationale:** Privacy (camera frames never leave the device), latency (no round-trip), and cost (no server GPU required).

**Tradeoffs:** MediaPipe WASM download adds to initial bundle cost. Requires WebGL + WebAssembly in the browser.

---

## ADR-003: GEMINI_API_KEY is server-side only

**Decision:** The Gemini API key lives in `process.env` on the server (`server.js` / Vercel serverless). The browser posts to `/api/advis`; the key never enters the client bundle.

**Rationale:** Fundamental security boundary. Any client-side key would be visible to any user.

**Tradeoffs:** Requires a server or serverless function. Vite `import.meta.env` vars are NOT used for the API key.

---

## ADR-004: Procedural geometry over loading GLB files for built-in models

**Decision:** Most ADVIS engineering models (V12, V8, molecular, anatomy) are generated procedurally via TypeScript geometry generators rather than loading pre-made GLB assets.

**Rationale:** Enables parametric control (explode factor, component selection, kinematics), scientific customization (label placement, section planes), and eliminates dependency on external 3D artists or licensing issues.

**Tradeoffs:** Procedural geometry requires significant engineering effort per model. Visual fidelity is bounded by what code can generate vs. artist-made meshes. High-fidelity precision models (`src/generators/`) exist for the most important models.

---

## ADR-005: occt-wasm excluded from Vite dependency pre-bundling

**Decision:** `occt-wasm` is listed in `vite.config.ts` `optimizeDeps.exclude`.

**Rationale:** OCCT ships WebAssembly with SIMD, tail-call, and exception-handling extensions. Vite's dependency pre-bundler (esbuild) cannot process WASM and would corrupt the package.

**Tradeoffs:** Vite cannot tree-shake OCCT — the full WASM binary is served as-is. Build target is forced to `esnext`.

---

## ADR-006: Workspace sessions stored in localStorage (not server)

**Decision:** `WorkspaceSessionStore.ts` serializes ~40 UI state fields to `localStorage` keyed by user-chosen name.

**Rationale:** No login system exists. Sessions are personal, device-local, and ephemeral by design. The server `.data/` filesystem is ephemeral on Vercel, making server storage unreliable for session data.

**Tradeoffs:** Sessions do not sync across devices. No backup if localStorage is cleared. Upgrade: migrate to a user-auth + cloud store when accounts are added.

---

## ADR-007: Theatre.js initialized in development only

**Decision:** `TheatreRuntime.ts` calls `getProject()` and Studio only when `import.meta.env.DEV` is true.

**Rationale:** Theatre Studio is a development authoring tool. Its overhead (UI panel, state hydration) is not appropriate for production. Presentation playback works in production via the bridge controllers without the Studio.

**Tradeoffs:** Presentation timelines must be authored in dev and their serialized state (`theatreState.ts`) committed to the repository.

---

## ADR-008: Scientific trust labels enforced by CI

**Decision:** A `validate:science` script runs in CI and fails the build if model metadata contains patterns flagged as unsourced exact specifications (e.g., exact HP/torque values claimed as OEM data).

**Rationale:** ADVIS is used for education. False precision in engineering data undermines trust. Labels like "relative teaching indicator" are mandated for simulation outputs.

**Tradeoffs:** Adds friction when adding new models — documentation and provenance metadata are required. This friction is intentional.

---

## ADR-009: Express 5 for dev server, Vercel serverless for production

**Decision:** `server.js` bundles into `dist/server.cjs` via esbuild for traditional Node hosting, and `api/advis.js` / `api/history.js` are Vercel serverless functions for cloud deployment.

**Rationale:** Dual deployment targets — the project can run on any VPS (esbuild bundle) or on Vercel (zero-config serverless). `vercel.json` routes all requests through the Express handler on Vercel.

**Tradeoffs:** Two code paths for API handlers. Vercel filesystem is ephemeral — `.data/` persistence is lost on redeployment.

---

## ADR-010: React 19 + TypeScript 7

**Decision:** Adopted bleeding-edge React 19 and TypeScript 7 from the initial scaffold.

**Rationale:** ADVIS is a forward-looking project with no legacy constraints. React 19 brings stable concurrent features; TypeScript 7 brings improved type inference.

**Tradeoffs:** Some third-party peer-dependency resolution requires `--legacy-peer-deps`. Documented in CI configuration (`7a4ed1e`).

---

## ADR-011: Vite base path auto-detection for GitHub Pages vs Vercel

**Decision:** `vite.config.ts` reads `VERCEL` / `VERCEL_ENV` / `VERCEL_URL` env vars to set `base: '/'` (Vercel) or `base: '/ADVIS-NCSC/'` (GitHub Pages).

**Rationale:** The two deployment targets serve from different URL roots. Hardcoding either breaks the other.

**Tradeoffs:** Environment variable detection must be kept in sync if more deployment targets are added.

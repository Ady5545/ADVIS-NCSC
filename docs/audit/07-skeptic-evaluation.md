# Skeptic Subagent Evaluation & Adversarial Audit (Phase 3A)

**Auditor Role**: Skeptic Subagent  
**Date**: November 10, 2026  
**Target**: `scratch/candidate_findings.md` (Candidates CAND-01 through CAND-55)  
**Methodology**: Adversarial verification against source code, runtime execution models, IEEE 754 float behavior, Three.js internal implementations, and Vercel/Express environment lifecycles.

---

## Executive Summary

| Category | Count | Candidates |
|---|---|---|
| **CONCEDED** (Genuine Bug Verified) | 41 | CAND-01, CAND-03, CAND-04, CAND-06, CAND-07, CAND-09, CAND-10, CAND-11, CAND-13, CAND-16, CAND-18, CAND-20, CAND-21, CAND-23, CAND-24, CAND-25, CAND-26, CAND-27, CAND-28, CAND-29, CAND-30, CAND-32, CAND-33, CAND-34, CAND-35, CAND-37, CAND-38, CAND-39, CAND-40, CAND-43, CAND-44, CAND-45, CAND-46, CAND-47, CAND-48, CAND-49, CAND-52, CAND-53, CAND-54, CAND-55 |
| **CHALLENGED** (Disproven / Not a Bug) | 7 | CAND-05, CAND-14, CAND-17, CAND-19, CAND-22, CAND-31, CAND-36, CAND-50 |
| **PARTIAL** (Severity Inflated / Defensive Enhancement Only) | 7 | CAND-02, CAND-08, CAND-12, CAND-15, CAND-41, CAND-42, CAND-51 |

### Key Skeptic Breakthroughs & Disproofs:
1. **CAND-36 Disproven (Slider-Crank Mathematical Singularity)**: Hunter claimed `(r / L) * sinTheta1` exceeds 1.0 triggering `Math.asin` singularity and simulation halt. **Disproof**: $r=0.44$, $L=1.45$. $r/L = 0.30345$. Since $|\sin(\theta)| \le 1.0$, the argument is mathematically bounded in $[-0.3035, 0.3035]$, far below 1.0. Singularity is mathematically impossible.
2. **CAND-50 Disproven (Zero-Vector Normalization)**: Hunter claimed `.normalize()` on a zero cross-product vector returns `Vector3(NaN, NaN, NaN)`. **Disproof**: Three.js source implements `Vector3.prototype.normalize = function() { return this.divideScalar(this.length() || 1); }`. On a zero vector, `0 || 1` evaluates to 1, returning `Vector3(0, 0, 0)`, NEVER `NaN`. Verified via Node runtime execution.
3. **CAND-22 Disproven (Workshop Command History Aliasing)**: Hunter claimed `commands` shallow-copies `before` causing undo stack mutation. **Disproof**: Line 99 explicitly clones `before` before push: `const before = cloneTransform(current);`. Line 107 clones `after`. State updates are fully immutable.
4. **CAND-19 Disproven (WorkshopStore Drops Projects Across Models)**: Hunter claimed saving a project deletes projects for other models. **Disproof**: All callers in `InnovationWorkshop.tsx` pass `SPATIAL_LIBRARY` (the global catalog of all 53 models) as the `catalog` parameter, so cross-model projects are never rejected by validation.
5. **CAND-31 Disproven (V8 Pulley Division by Zero)**: Hunter claimed division by zero on `0.245 / radius`. **Disproof**: `RotatingPulley` is an internal helper called only 4 times with hardcoded non-zero constants (`0.145`, `0.185`, `0.245`, `0.082`). Mathematically unreachable.

---

## Detailed Item-by-Item Adversarial Evaluation (CAND-01 to CAND-55)

---

### CAND-01: Backend API / Memory Search Unhandled TypeError
- **Location**: `server.js:148-154`
- **Hunter Claim**: Critical. `m.content.toLowerCase()` throws `TypeError` on missing content, permanently crashing `/api/memory/search`.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In `server.js:113-131`, `POST /api/memory` performs zero schema validation on `content` or `tags`. If a memory is persisted with `content: undefined` or non-string tags, `GET /api/memory/search` (line 151) executes `m.content.toLowerCase()`. Because Express route handlers do not wrap this in a `try/catch`, the exception bubbles to Express's 500 error handler on every subsequent search until `.data/advis_memories.json` is manually repaired.
  *Severity Adjustment*: It causes persistent HTTP 500 Denial of Service on the search endpoint, but does not crash the Node process itself under Express 4. Adjusted from Critical to High.

---

### CAND-02: Backend API / Project Matching Crash
- **Location**: `server.js:160-175, 356-358`
- **Hunter Claim**: Critical. `p.name.toLowerCase()` throws unhandled `TypeError` during project switching in chat, crashing server.
- **Status**: **PARTIAL** (Severity Inflated)
- **Claimed Severity**: Critical
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `POST /api/projects` allows `name` to be undefined, which causes `p.name.toLowerCase()` in `handleMemoryAgent` (line 357) to throw `TypeError`. However, `server.js:864-897` wraps `processButlerTurn` in `try { ... } catch (err) { return res.json({ reply: "My core systems experienced an error...", status: "error" }); }`. The exception is caught gracefully and returns HTTP 200 with error status. The server does NOT crash and does NOT return HTTP 500.
  *Verdict*: Bug is real (project switch fails), but severity was inflated from Medium to Critical.

---

### CAND-03: Spatial 3D / Division by Zero on Camera Delta
- **Location**: `src/GestureContext.tsx:270, 377-379, 414-415`
- **Hunter Claim**: Critical. `dt = Math.min(delta, 0.033)`. When `delta === 0`, `dx / dt` yields `NaN`/`Infinity`, permanently turning camera coordinates to `NaN` and blacking out WebGL viewport.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Critical
- **Adversarial Analysis**:
  In React Three Fiber / Three.js, `delta` is 0 on the first frame and can be 0 when resuming from background tab throttling. When `dt === 0`, `velX = dx / dt` produces `NaN` or `Infinity`. In `GestureContext.tsx:416-431`, `rawSpeed = Math.hypot(velX, velY)` becomes `NaN`, making `orbitSpeedMult = NaN`, `deltaTheta = NaN`, and `spatialCam.targetTheta += NaN`. Camera spherical-to-cartesian transforms convert to `(NaN, NaN, NaN)`. Three.js projection matrix inversion permanently fails, rendering a completely black screen until page reload. Confirmed Critical.

---

### CAND-04: Spatial AI Tracking / Tracking Loss Reset
- **Location**: `src/GestureContext.tsx:566-577`
- **Hunter Claim**: High. Tracking loss resets workspace position and scale, violating AGENTS.md persistence rule.
- **Status**: **CONCEDED**
- **Claimed Severity**: High
- **Recommended Severity**: High
- **Adversarial Analysis**:
  Lines 574-576 explicitly execute: `state.targetScale.current = 1.0; state.targetPos.set(0, 0, 0); state.targetEnergy.current = 0;` whenever `handTracking.state !== 'TRACKING'`. AGENTS.md explicitly mandates: *"PERSISTENCE: Losing hand tracking must NEVER reset the workspace. If the user removes their hand: pause interaction, remember everything, and resume seamlessly when the hand returns."* Whenever a user moves their hand out of camera view, their manual placement and inspection scale snaps back to origin. Confirmed High severity architectural violation.

---

### CAND-05: Learning Progress / Storage Deserialization
- **Location**: `src/learning/LessonProgress.ts:27-46`
- **Hunter Claim**: Low. Corrupted localStorage throws `TypeError: progress.completedStepIds is not iterable`, and `currentStepIndex` lacks negative bounds checking.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Low
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  Inspection of `src/learning/LessonProgress.ts`:
  1. Line 40 ALREADY clamps `currentStepIndex`: `currentStepIndex: Math.max(0, Math.floor(progress.currentStepIndex))`. The hunter's claim that negative values are not clamped is false.
  2. In `loadLessonProgress` (line 30), `!Array.isArray(item.completedStepIds)` explicitly validates that `completedStepIds` is an Array before returning.
  3. `saveLessonProgress` (lines 36-49) is completely wrapped in `try { ... } catch { return false; }`. No uncaught exception can escape to callers.
  *Verdict*: Mitigated by existing guards and try-catch. Not a Bug.

---

### CAND-06: Butler Core / Hallucinated Model Defaults
- **Location**: `ButlerEngine.js:857-860, 876`
- **Hunter Claim**: Critical. Defaults to `"gemini-3.8-flash"` and fallback `"gemini-3.5-flash-lite"`, which do not exist in Google GenAI API.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Critical
- **Adversarial Analysis**:
  Google GenAI API offers `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, etc. Models `gemini-3.8-flash` and `gemini-3.5-flash-lite` are completely hallucinated. Even `.env.example` line 5 lists `GEMINI_MODEL=gemini-3.8-flash`. When running without an explicit override, every conversational turn triggers `Primary model gemini-3.8-flash failed`, falls back to `gemini-3.5-flash-lite`, and fails with HTTP 404 Model Not Found. 100% failure rate out of the box. Confirmed Critical.

---

### CAND-07: Butler Core / Gemini Role Alternation & Leading Model Turn
- **Location**: `ButlerEngine.js:754-770`, `api/advis.js:59-73`, `src/App.tsx:932, 1208`
- **Hunter Claim**: Critical. First turn has `role: 'model'` due to UI welcome message; Gemini API strictly requires first turn to be `'user'`.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Critical
- **Adversarial Analysis**:
  In `src/App.tsx:932`, chat initializes with `[{ role: 'assistant', content: 'Welcome to A.D.V.I.S....' }]`. On sending the first message, `App.tsx:1208` sends `recentConversation` with this assistant message. `api/advis.js:483` passes it as `chatHistories[deviceId]`. In `ButlerEngine.js:754-757`, `contents[0]` is assigned `role: 'model'`. The Google Gemini API strictly enforces that the first turn in `contents` must be `role: 'user'`. Calling the API with a leading model turn returns HTTP 400 Bad Request immediately on the first query of every session on Vercel. Confirmed Critical.

---

### CAND-08: Backend Security / Prototype Poisoning on deviceId
- **Location**: `server.js:851-853`, `ButlerEngine.js:752-754`, `server.js:192-195`
- **Hunter Claim**: Critical. Supplying prototype property as `deviceId` allows prototype pollution and crashes server.
- **Status**: **PARTIAL** (Severity Inflated)
- **Claimed Severity**: Critical
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  If `deviceId` is `"toString"`, `chatHistories["toString"]` references `Object.prototype.toString`. Line 754 in `ButlerEngine.js` attempts `chatHistories[deviceId].map(...)` which throws `TypeError`. However:
  1. `processButlerTurn` is wrapped in `try/catch` in `server.js:864`, returning `{ status: "error" }`. The server process does not crash.
  2. No prototype pollution occurs because properties of `Object.prototype` are not mutated or injected with malicious payloads.
  *Verdict*: Prototype collision causing handled error, not a Critical RCE/pollution exploit. Severity is Low.

---

### CAND-09: Backend Security / Missing CORS
- **Location**: `server.js:1-926`, `docs/SECURITY.md:37-43`
- **Hunter Claim**: Medium. Missing CORS in `server.js` breaks cross-origin dev server and contradicts docs.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `docs/SECURITY.md:37` explicitly claims origin restriction is enforced via `ADVIS_ALLOWED_ORIGINS`. `server.js` contains zero CORS middleware or headers (unlike `api/advis.js`). Cross-origin requests from Vite dev server (`http://localhost:5173`) or GitHub Pages to `server.js` fail with preflight CORS rejection. Confirmed Medium.

---

### CAND-10: Backend Security / Prompt Injection via Butler Context
- **Location**: `server.js:855-865`, `api/advis.js:143-201, 480`
- **Hunter Claim**: Medium. Raw client `butlerContext` interpolated directly into Gemini `systemInstruction` in `server.js`.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `api/advis.js:480` calls `cleanContext(rawContext)` which sanitizes keys and strips dangerous characters. `server.js:855` passes raw `clientButlerContext` straight to `buildContextSummary` (ButlerEngine.js:364), which interpolates properties directly into `systemInstruction`. This allows untrusted client input to manipulate system prompt constraints. Confirmed Medium.

---

### CAND-11: Backend API / Image-Only Request Rejection
- **Location**: `server.js:849`, `api/advis.js:458-464`
- **Hunter Claim**: Medium. `server.js` rejects image-only requests with 400, while `api/advis.js` supports them.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `server.js:849` executes: `if (!message) return res.status(400).json({ error: "Protocol violation: Message payload is empty." });`. In contrast, `api/advis.js:462` checks `if (!message && image)` and synthesizes an observation prompt. Environment behavioral inconsistency verified. Confirmed Medium.

---

### CAND-12: Backend / Unbounded Rate Limit Map Memory Leak
- **Location**: `api/advis.js:9-10, 36-51`
- **Hunter Claim**: Medium. Unbounded `requestWindows` map leaks memory under high IP cardinality.
- **Status**: **PARTIAL** (Severity Inflated)
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  `requestWindows` never evicts expired keys. In a long-running Node daemon, this leaks heap memory. However, `api/advis.js` is a Vercel Serverless Function where ephemeral lambda instances are frozen and recycled after minutes of inactivity or bounded request counts. The blast radius in serverless runtime is limited. Severity is Low.

---

### CAND-13: Backend / Ignored PORT Environment Variable
- **Location**: `server.js:12, 918`
- **Hunter Claim**: Medium. Hardcodes `PORT = 3000`, failing container deployments (Cloud Run, Railway, Render).
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `server.js:12` hardcodes `const PORT = 3000;`. PaaS and container hosting platforms allocate `$PORT` dynamically and terminate containers if they fail to bind to the specified port. Confirmed Medium.

---

### CAND-14: Backend Security / 50MB Body DoS
- **Location**: `server.js:19`, `docs/SECURITY.md:49`
- **Hunter Claim**: Medium. 50MB body limit allows CPU starvation and heap exhaustion.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  `docs/SECURITY.md:49` explicitly documents this as an intentional design decision for high-resolution camera captures: `"/api/advis and /api/generate-structure accept JSON bodies up to 50 MB (Express json({ limit: '50mb' })). Consider reducing this limit if large payloads are not needed."` It is an acknowledged architectural choice, not an implementation defect. Not a Bug.

---

### CAND-15: Backend / Markdown Code Fence Parsing in Structure Generator
- **Location**: `server.js:828`
- **Hunter Claim**: Low. `JSON.parse(response.text)` throws if Gemini outputs code fences.
- **Status**: **PARTIAL** (Defensive Polish)
- **Claimed Severity**: Low
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Lines 810-811 configure `responseMimeType: 'application/json'` and `responseSchema: schema`. In Google GenAI SDK, structured JSON output mode does not wrap responses in markdown code fences. Furthermore, line 830 catches parse errors. Stripping fences is good defensive hygiene, but rarely triggered under schema-constrained generation. Low severity.

---

### CAND-16: Backend / HTTP Status Code Inconsistency
- **Location**: `server.js:892`, `api/advis.js:519`
- **Hunter Claim**: Low. `server.js` returns HTTP 200 with error JSON, while `api/advis.js` returns HTTP 502.
- **Status**: **CONCEDED**
- **Claimed Severity**: Low
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Verified: `server.js:892` returns 200 with `{ status: "error" }`, whereas `api/advis.js:512` returns 502. API contract mismatch confirmed.

---

### CAND-17: Deployment / Missing Vercel Rewrites
- **Location**: `vercel.json:1-7`
- **Hunter Claim**: Low. Calls to `/api/jarvis` 404 on Vercel.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Low
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  Full codebase grep confirms zero callers invoke `/api/jarvis`. The frontend exclusively calls `advisApiUrl('/api/advis')`. The route `/api/jarvis` in `server.js:836` was a deprecated legacy alias. No user-facing flows are broken on Vercel. Not a Bug.

---

### CAND-18: Persistence / Single Try-Catch Wiping Data On Corrupted File
- **Location**: `server.js:42-67`
- **Hunter Claim**: Critical. Single try-catch aborts remaining loads on corrupted `histories.json`, overwriting disk with empty arrays on next save.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Critical
- **Adversarial Analysis**:
  In `server.js:42-55`, reading `HISTORY_FILE`, `MEMORIES_FILE`, `ADVIS_MEMORIES_FILE`, and `ADVIS_PROJECTS_FILE` is bundled inside one `try/catch`. If `histories.json` contains malformed JSON, lines 46-54 are aborted. `advisMemories` and `advisProjects` remain empty arrays `[]`. On the very next save operation (`saveData()`, lines 63-64), `fs.writeFileSync` overwrites `advis_memories.json` and `advis_projects.json` with `[]`, permanently wiping all user memories and projects. Confirmed Critical.

---

### CAND-19: Persistence / WorkshopStore Silently Drops Projects Across Models
- **Location**: `src/workshop/WorkshopStore.ts:167-191`
- **Hunter Claim**: Critical. `readStore(catalog)` filters projects using `validateWorkshopProject(item, catalog)`, dropping projects for other models on save.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  The hunter's core premise was that `catalog` only contains the currently selected model. However, inspection of all callers in `src/workshop/InnovationWorkshop.tsx:80, 103, 106, 211, 309` proves that every invocation passes `SPATIAL_LIBRARY` (the global dictionary of all 53 spatial models). `validateWorkshopProject` checks `!catalog[project.sourceModelId]`. Because all models exist in `SPATIAL_LIBRARY`, projects for other models (`v8_engine`, `arduino_uno`, etc.) pass validation and are NEVER dropped.
  *Verdict*: Factually disproven by call-site evidence. Not a Bug.

---

### CAND-20: Persistence / Shallow Merge Overwriting Immutable Fields
- **Location**: `server.js:133-140, 177-184`
- **Hunter Claim**: Medium. PUT endpoints spread `req.body` directly, allowing overwriting of `id` and `createdAt`.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  In `app.put("/api/memory/:id")` (line 136) and `app.put("/api/projects/:id")` (line 180), `{ ...advisMemories[memIdx], ...req.body, updatedAt: Date.now() }` allows arbitrary clients to overwrite immutable `id` or `createdAt`, breaking primary keys and URL routing. Confirmed Medium.

---

### CAND-21: Persistence / Weak ID Generation Collision
- **Location**: `server.js:116, 163`
- **Hunter Claim**: Medium. IDs generated with `Date.now() + "_" + Math.floor(Math.random()*1000)`. `uuidv4` was defined at line 102 but bypassed.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `server.js:101-102` imports `crypto` and defines `const uuidv4 = () => crypto.randomUUID();`, but lines 116 and 163 bypass it for a 1,000-bucket random integer. Concurrent requests within the same millisecond have a high collision probability. Confirmed Medium.

---

### CAND-22: Workshop / Shallow Command Stack Aliasing
- **Location**: `src/workshop/WorkshopStore.ts:102-120`
- **Hunter Claim**: Medium. `commands.slice()` shallow-copies `before` and `after`, causing active mutations to corrupt history stack.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  Inspection of `src/workshop/WorkshopStore.ts:98-107`:
  Line 99 explicitly clones `before`: `const before = cloneTransform(current);`.
  Line 107 explicitly clones `after`: `after: cloneTransform(after)`.
  The command pushed onto the stack already holds independently deep-cloned transform objects. Furthermore, all state transition functions in `WorkshopStore` are purely functional and return new immutable project objects. No in-place mutation or aliasing occurs.
  *Verdict*: Completely mitigated by lines 99 and 107. Not a Bug.

---

### CAND-23: Model Catalog / Missing Component ID in V12 ExplodedParts
- **Location**: `src/SpatialLibrary.ts:985` vs `src/SpatialLibrary.ts:1006-1040`
- **Hunter Claim**: Low. `v12_engine.explodedParts` references `'v12.cylinder_head'` which does not exist in `components` (actual ID is `'v12.valvetrain'`).
- **Status**: **CONCEDED**
- **Claimed Severity**: Low
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Verified by `scripts/validate-model-catalog.mjs`: `WARN: [V12 Combustion Engine] explodedParts references missing component id v12.cylinder_head.` Confirmed Low.

---

### CAND-24: Model Catalog / Missing modelKind Warnings
- **Location**: `src/SpatialLibrary.ts:150, 951, 1087` & `scripts/validate-model-catalog.mjs:109`
- **Hunter Claim**: Low. 50 models omit `modelKind`, generating 50 catalog validation warnings.
- **Status**: **CONCEDED**
- **Claimed Severity**: Low
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Running `node scripts/validate-model-catalog.mjs` outputs 50 warnings for unmigrated `modelKind`. Confirmed Low.

---

### CAND-25: 3D Graphics / CadMesh Geometry Leak
- **Location**: `src/cad/CadModelCanvas.tsx:16-31`
- **Hunter Claim**: Critical. `CadMesh` allocates `new THREE.BufferGeometry()` without disposal, leaking GPU VRAM.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `useMemo` in `CadMesh` re-creates `BufferGeometry` on `model` change without calling `geometry.dispose()` on the replaced instance or on unmount. Because Three.js requires explicit disposal to free WebGL GPU buffers, VRAM leaks across model switching.
  *Severity Adjustment*: CAD model inspection is triggered on file import/selection, not at 60 FPS. It causes gradual memory growth rather than an immediate browser freeze. Adjusted from Critical to Medium.

---

### CAND-26: 3D Graphics / Inline EdgesGeometry Leak
- **Location**: `src/cad/CadAssetRenderer.tsx:134-138`
- **Hunter Claim**: Critical. `new THREE.EdgesGeometry(geometry, 18)` instantiated inline in JSX on every render cycle when `blueprintEnabled` is active.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: High
- **Adversarial Analysis**:
  Line 135: `<lineSegments geometry={new THREE.EdgesGeometry(geometry, 18)}>`. Every React render of `CadAssetRenderer` (triggered by hover, selection, animation, or camera motion) instantiates a brand new `THREE.EdgesGeometry`. Each unmemoized instance recomputes edge adjacency algorithms on the CPU and uploads new vertex buffers to the GPU without disposing the previous geometry. Confirmed High/Critical rendering leak.

---

### CAND-27: 3D Graphics / GLTF Cloned Materials Leak
- **Location**: `src/SpatialObjectEngine.tsx:94-112`
- **Hunter Claim**: Medium. `RealisticGLTFModel` clones materials on model instance without disposing cloned materials/textures on switch/unmount.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `child.material = child.material.clone()` is executed during GLTF load, but no cleanup hook calls `material.dispose()`. Shader programs and texture uniforms accumulate in WebGLRenderer when browsing multiple GLB models. Confirmed Medium.

---

### CAND-28: 3D Graphics / Object.entries & Vector3 GC Churn in 60 FPS Loop
- **Location**: `src/SpatialObjectEngine.tsx:2189-2198`
- **Hunter Claim**: Medium. Inside 60 FPS `useFrame`, `Object.entries(componentRefs.current)` and `new THREE.Vector3()` allocated every frame.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  Line 2189 creates an array of tuples every frame via `Object.entries`. Inside the loop, line 2196 executes `const target = new THREE.Vector3(...)` for each of the 12+ engine components. Over 1,200 allocations per second in the main render loop produce noticeable GC pauses and micro-stutter during 3D inspection. Confirmed Medium.

---

### CAND-29: 3D Graphics / Raycaster Vector Churn & 60 FPS Console Logging
- **Location**: `src/SpatialObjectEngine.tsx:2563-2568` & `src/GestureContext.tsx:326-335`
- **Hunter Claim**: Medium. Raycasting allocates vectors every frame, and `GestureContext` executes `console.log('[GESTURE OWNERSHIP DEBUG]')` at 60 FPS.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  Line 326 of `GestureContext.tsx` logs a 9-property debug object on every animation frame whenever a hand is active. In browser DevTools, continuous 60 FPS console serialization causes heavy main-thread CPU overhead and thermal throttling. Confirmed Medium.

---

### CAND-30: 3D Graphics / NaN Propagation in Engine Kinematics
- **Location**: `src/SpatialObjectEngine.tsx:2210-2217`
- **Hunter Claim**: Critical. `omega = (currentRpm / 60) * Math.PI * 2`. If `currentRpm` is undefined/NaN, `omega` is NaN. `NaN !== 0` is true, storing `sysTimeRef.current = NaN` and corrupting all kinematics transforms.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In JS, `NaN !== 0` evaluates to `true`. If `currentRpm` is undefined or non-finite, `sysTimeRef.current = rad / NaN` evaluates to `NaN`. Because `sysTimeRef.current` drives the rotation of the crankshaft, camshafts, and piston kinematics in `MechanicalGenerator.tsx`, `NaN` propagates into Three.js local matrices.
  *Severity Adjustment*: In standard UI usage, `v12Rpm` defaults to 600, so `currentRpm` is normally defined. However, during custom scrub events or uninitialized transitions, the NaN infection permanently disables kinematics rendering. Adjusted from Critical to High.

---

### CAND-31: 3D Graphics / Division by Zero in V8 Precision Pulley
- **Location**: `src/generators/V8Precision.tsx:760-762`
- **Hunter Claim**: Low. `speedRatio = 0.245 / radius` produces `Infinity` if `radius <= 0`.
- **Status**: **CHALLENGED**
- **Claimed Severity**: Low
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  `RotatingPulley` is an internal helper in `src/generators/V8Precision.tsx`. Call-site analysis shows it is invoked in exactly 4 locations (lines 826-829) with hardcoded positive constants: `radius={0.145}`, `radius={0.185}`, `radius={0.245}`, and `radius={0.082}`. It is never exposed to user input or dynamic calculation. Division by zero is mathematically unreachable under all execution paths.
  *Verdict*: Dead theoretical concern. Not a Bug.

---

### CAND-32: Spatial AI / Theatre Camera Conflict With User Controls
- **Location**: `src/theatre/TheatreV12Bridge.ts:28-34, 42-47` & `src/SpatialObjectEngine.tsx:2185-2187`
- **Hunter Claim**: Medium. Theatre camera continuously overrides user controls, and resets instantly from 1 to 0 without damping upon sequence completion.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Lines 42-45 in `TheatreV12Bridge.ts` set `active = false` and `v12PresentationFrame.active = false` immediately upon sequence completion. In `SpatialObjectEngine.tsx:2185-2187`, `theatreFactor` instantly snaps from 1 to 0 without lerping or transition damping, causing a visual popping glitch.
  *Severity Adjustment*: Visual polish defect on cinematic sequence completion; does not crash or break interaction. Adjusted from Medium to Low.

---

### CAND-33: 3D Graphics / Missing WebGL Context Loss Handler
- **Location**: `src/App.tsx:1954-1961` & `src/cad/CadModelCanvas.tsx:63-67`
- **Hunter Claim**: Critical. Canvas elements do not handle `webglcontextlost` or call `e.preventDefault()`, causing permanent black screen on GPU sleep/wake.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  Per the HTML5 WebGL specification, if `event.preventDefault()` is not called during `webglcontextlost`, the browser will not attempt to restore the context via `webglcontextrestored`. Neither `<Canvas>` in `App.tsx` nor `CadModelCanvas.tsx` registers this handler. When a computer wakes from sleep or switches GPUs, the 3D viewport remains permanently blank.
  *Severity Adjustment*: Does not affect normal active usage; occurs on sleep/wake cycle. Adjusted from Critical to Medium.

---

### CAND-34: 3D Graphics / Variable Telemetry in Geometry Args
- **Location**: `src/generators/V12VisualOverlays.tsx:78, 112`
- **Hunter Claim**: Medium. `<sphereGeometry args={[0.18 * flameIntensity, 16, 16]} />` and `<cylinderGeometry args={[..., arrowLength, 8]} />` force 1440 geometry destructions/reallocations per second.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In React Three Fiber, changing any element in `args` triggers constructor reinvocation: R3F disposes the existing Three.js geometry and allocates a new one on every render. Because `flameIntensity` and `arrowLength` change continuously across 12 cylinders at 60 FPS, this causes 24 geometry destructions and GPU buffer uploads per frame (1,440/sec). Confirmed High performance bottleneck.

---

### CAND-35: Kinematics & Audio / Audio Autoplay 180 Listeners/sec Leak
- **Location**: `src/scientific/V12EngineAudioEngine.ts:201-224` & `src/scientific/V8EngineAudioEngine.ts:202-225`
- **Hunter Claim**: Critical. When autoplay policy blocks audio, `ensureContextActive()` catches rejection and attaches 3 window event listeners on every frame. In a 60 FPS loop, 180 listeners accumulate every second.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: Critical
- **Adversarial Analysis**:
  `update()` is called inside `useFrame` at 60 Hz. On page load, the browser's autoplay security policy rejects or suspends `ctx.resume()`. The `catch` block (lines 204-224) creates a new `unlock` closure and calls `window.addEventListener` for `pointerdown`, `keydown`, and `touchstart` on every invocation. Over 10 seconds of unmuted simulation, 1,800 listeners accumulate on `window`. When the user first clicks, all 1,800 handlers fire concurrently, saturating the event queue and freezing the browser tab. Confirmed Critical.

---

### CAND-36: Kinematics / Mathematical Singularity in Four-Stroke Slider-Crank
- **Location**: `src/scientific/FourStrokeEngineModel.ts:983`
- **Hunter Claim**: Critical. `conrodAngle1 = Math.asin((r / L) * sinTheta1)` yields `NaN` when `(r / L) * sinTheta1` exceeds 1.0, throwing an uncaught exception and halting the simulation permanently.
- **Status**: **CHALLENGED** (Mathematically Disproven)
- **Claimed Severity**: Critical
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  Let us inspect the exact constants in `src/scientific/FourStrokeEngineModel.ts:975-976`:
  ```typescript
  const r = 0.44; // crank throw radius
  const L = 1.45; // rod length
  const sinTheta1 = Math.sin(thetaRad);
  const conrodAngle1 = Math.asin((r / L) * sinTheta1);
  ```
  1. $r = 0.44$, $L = 1.45$. Therefore $r / L = 0.44 / 1.45 \approx 0.303448$.
  2. In IEEE 754 JavaScript, `Math.sin(thetaRad)` is mathematically bounded in $[-1.0, +1.0]$.
  3. The product $(r / L) \cdot \sin(\theta_1)$ is strictly bounded in $[-0.30345, +0.30345]$.
  4. The maximum possible value passed to `Math.asin` is $\approx 0.3035$, which is orders of magnitude away from the domain boundary of $1.0$!
  5. It is mathematically impossible for $(r / L) \cdot \sin(\theta)$ to equal or exceed $1.0$.
  *Verdict*: Purely fabricated failure scenario. Not a Bug.

---

### CAND-37: Spatial AI / TypeError on Truncated Landmarks
- **Location**: `src/useHandTracking.ts:250, 269, 278, 304-308`
- **Hunter Claim**: Critical. If `state.hands` contains truncated or empty landmarks, `lm[8].x` throws unhandled `TypeError` crashing React tracking pipeline.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  Line 250 checks `state.hands.map(h => h.landmarks).length > 0`, but does not verify `h.landmarks.length >= 21`. If a custom tracking provider, mock, or occlusion glitch delivers an empty or partial array, line 278 evaluates `lm[8].x`, throwing `TypeError: Cannot read properties of undefined (reading 'x')`.
  *Severity Adjustment*: Official MediaPipe Hands model outputs 21 landmarks when tracking. The crash only occurs on abnormal payloads or custom adapters. Adjusted from Critical to Medium.

---

### CAND-38: Spatial AI / Unclosed Microphone MediaStream Tracks
- **Location**: `src/App.tsx:804-886`
- **Hunter Claim**: High. `getUserMedia({ audio: true })` stream is not stored in ref; `stream.getTracks().forEach(t => t.stop())` is never called on unmount, leaking mic recording.
- **Status**: **CONCEDED**
- **Claimed Severity**: High
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In `src/App.tsx:804-880`, when entering `'LISTENING'`, `getUserMedia` captures `stream`. The cleanup effect (lines 875-885) cancels animation frames and closes `audioContext`, but never calls `track.stop()` on the `MediaStreamTrack`. Per the W3C Media Capture specification, closing an `AudioContext` does NOT release hardware audio tracks. The browser's active recording indicator (red dot) remains on indefinitely, violating privacy and draining battery. Confirmed High.

---

### CAND-39: Spatial AI / Discarded MediaPipe Confidence Gating
- **Location**: `src/useHandTracking.ts:257`
- **Hunter Claim**: Medium. Confidence score hardcoded to `0.99`, bypassing MediaPipe confidence gating and triggering false-positive gestures.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `MediaPipeAdapter.tsx:77` extracts `classification?.score`. However, `useHandTracking.ts:257` discards it and hardcodes `let confidence = 0.99;`. Low-confidence hand detections during occlusion or motion blur are processed as high-confidence inputs, causing spurious clicks and jitter. Directly violates AGENTS.md confidence gating principles. Confirmed Medium.

---

### CAND-40: Kinematics / Web Audio TypeError on Non-Finite Frequency
- **Location**: `src/scientific/V12EngineAudioEngine.ts:286-304` & `src/scientific/V8EngineAudioEngine.ts:287-305`
- **Hunter Claim**: Medium. If `rpm` is non-finite, `f0` becomes `NaN`. Passing `NaN` to `setTargetAtTime` throws `TypeError`.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  In `V12EngineAudioEngine.ts:286`, `const f0 = Math.max(1, (rpm / 60) * speed);`. In JS, `Math.max(1, NaN)` returns `NaN`. Line 299 passes `fPrimary = NaN` to `this.oscPrimary.frequency.setTargetAtTime(fPrimary, now, 0.035)`. Per W3C Web Audio specification, passing a non-finite float to `AudioParam.setTargetAtTime` throws `TypeError: The provided float value is non-finite.` Confirmed Medium.

---

### CAND-41: Kinematics / RAF Loop Crash on Bus Subscriber Exception
- **Location**: `src/scientific/EngineKinematicsBus.ts:270-272`
- **Hunter Claim**: Medium. If any listener throws an error, the uncaught exception terminates the Three.js RAF render loop.
- **Status**: **PARTIAL** (Defensive Resilience Polish)
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  `publish` iterates `for (const listener of this.listeners) listener(this.snapshot)`. Synchronous invocation without try-catch is standard in event emitters. Currently, no subscriber in the codebase throws. Wrapping each listener in `try/catch` is a good resilience improvement, but there is no active crash. Low severity.

---

### CAND-42: Kinematics / Undisposed AudioContext and Oscillators on Unmount
- **Location**: `src/scientific/V12EngineAudioEngine.ts:182-188, 357-359, 420-425`
- **Hunter Claim**: Medium. Stopping audio only ramps down `masterGain`. Oscillators are never stopped, and AudioContext leaks indefinitely.
- **Status**: **PARTIAL** (Architecture Misunderstood)
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Line 396 explicitly defines `V12EngineAudioEngine` as a **Global Singleton**: `export const V12EngineAudioEngine = new V12EngineAudioEngineClass();`. Because it is a singleton, mounting and unmounting React components does NOT allocate new `AudioContext` instances or leak unreferenced contexts. Ramping down `masterGain` mutes the singleton. However, calling `this.ctx.suspend()` when stopped is recommended to save background DSP threads. Severity is Low.

---

### CAND-43: CAD / OpenCASCADE WebAssembly Heap Memory Leak
- **Location**: `src/cad/CadKernelService.ts:72-107`
- **Hunter Claim**: Critical. `shape` allocated in OpenCASCADE WebAssembly linear heap is never freed via `kernel.release(shape)`.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: High
- **Adversarial Analysis**:
  `occt-wasm` type definition (`node_modules/occt-wasm/dist/xcaf-document.d.ts:80`) explicitly documents: *"If shapeHandle is non-null, the caller owns it and must release it."* `CadKernelService.ts:72-127` imports shapes via `kernel.fromBREP` or `kernel.importStep`, extracts mesh and metrics, and returns without ever invoking `kernel.release(shape)`. C++ handles remain pinned in the WebAssembly linear heap. Confirmed High/Critical leak for CAD workflow.

---

### CAND-44: CAD / Unhandled Rejected WASM Initialization Promise
- **Location**: `src/cad/CadKernelService.ts:22-30`
- **Hunter Claim**: Medium. `kernelPromise` caches rejected promise permanently if `OcctKernel.init()` fails.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `getKernel` assigns `kernelPromise = import('occt-wasm').then(...)` without a `.catch()` reset. If the initial fetch or WebAssembly compile fails, subsequent CAD imports immediately reject without retrying. Confirmed Medium.

---

### CAND-45: CAD / Binary BREP UTF-8 Decoding Corruption
- **Location**: `src/cad/CadKernelService.ts:69-75`
- **Hunter Claim**: Critical. Binary BREP files are decoded via UTF-8 `TextDecoder`, corrupting binary data with replacement characters.
- **Status**: **CONCEDED** (Severity Adjusted)
- **Claimed Severity**: Critical
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `occt-wasm` exposes `fromBREPBinary(data: Uint8Array)` specifically for binary BREP models. `CadKernelService.ts:70` unconditionally decodes raw file bytes with `new TextDecoder().decode(bytes)` and calls `kernel.fromBREP(textData)`. Binary files with non-UTF8 sequences are corrupted with `\uFFFD`, triggering OpenCASCADE parse panics.
  *Severity Adjustment*: Only affects binary BREP uploads; ASCII STEP and text BREP work as expected. Adjusted from Critical to Medium.

---

### CAND-46: CAD / Cached Rejected Model Fetch Promise
- **Location**: `src/cad/CadAssetRenderer.tsx:28-29`
- **Hunter Claim**: Medium. If fetch rejects, rejected promise remains cached in `modelCache`, blocking reload.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `modelCache.set(cacheKey, pending)` caches the promise before resolution. On transient HTTP failure or abort, the rejected promise remains in the map. Subsequent requests for the same URL instantly re-throw without network retry. Confirmed Medium.

---

### CAND-47: CAD / Parametric Slider Un-debounced History Flood
- **Location**: `src/cad/ParametricInnovationLab.tsx:90-101, 249`
- **Hunter Claim**: Medium. Slider `onChange` pushes 50 undo states per second to `history` during drag.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  Line 249 wires `<input type="range" onChange={...} />` directly to `setValue`, which calls `commitParams`. Scrubbing a slider fills the 50-item undo stack with intermediate drag frames, rendering the undo button unusable (requiring 50 clicks to revert one drag). Confirmed Low/Medium interaction flaw.

---

### CAND-48: Learning Engine / Two-Letter Chemical Element Case Bug
- **Location**: `src/LearnEngine/ValenceValidator.ts:73-74`
- **Hunter Claim**: Critical. `atom.element.toUpperCase()` turns `"Na"` -> `"NA"`, `"Cl"` -> `"CL"`, returning `undefined` from `ELEMENT_VALENCE_DATA`. All two-letter elements fall back to Carbon.
- **Status**: **CONCEDED**
- **Claimed Severity**: Critical
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In `ELEMENT_VALENCE_DATA` (lines 32-49), symbols are title-cased: `'Cl'`, `'Br'`, `'Si'`, `'Na'`, `'Ca'`, `'Mg'`, `'K'`. Line 73 executes `const el = atom.element.toUpperCase();`. `ELEMENT_VALENCE_DATA['CL']` evaluates to `undefined`, falling back to `{ valence: 4, commonBonds: [4], maxBonds: 4, electronegativity: 2.0 }`. Sodium, chlorine, calcium, and silicon are calculated as tetravalent Carbon with electronegativity 2.0, completely corrupting molecular valence and octet validation. Confirmed High/Critical chemistry calculation bug.

---

### CAND-49: Learning Engine / Formal Charge Algebraic Cancellation
- **Location**: `src/LearnEngine/ValenceValidator.ts:89-93`
- **Hunter Claim**: Medium. `nonBonding = valence - totalBondOrder`. `formalCharge = valence - (valence - totalBondOrder) - totalBondOrder === 0`. Formal charge is permanently 0.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  Algebraic proof:
  `nonBondingElectrons = Math.max(0, standardData.valence - totalBondOrder);`
  `formalCharge = standardData.valence - nonBondingElectrons - totalBondOrder;`
  For any atom where `valence >= totalBondOrder`:
  `formalCharge = V - (V - B) - B = V - V + B - B = 0`.
  In polyatomic ions like $NH_4^+$ ($V=5, B=4$) or $H_3O^+$ ($V=6, B=3$), the calculated formal charge is mathematically locked to 0 instead of +1. Confirmed Medium.

---

### CAND-50: Learning Engine / Molecular Vector Normalize on Zero Cross-Product
- **Location**: `src/LearnEngine/MolecularEngine.ts:196-201, 212-214`
- **Hunter Claim**: Critical. Normalizing a zero vector yields `Vector3(NaN, NaN, NaN)`, corrupting Three.js world transform matrices and blanking the 3D molecular canvas.
- **Status**: **CHALLENGED** (Factually Disproven by Three.js Source)
- **Claimed Severity**: Critical
- **Recommended Severity**: Not a Bug
- **Adversarial Analysis**:
  The hunter claimed calling `.normalize()` on a zero cross-product vector produces `(NaN, NaN, NaN)`.
  Let us inspect Three.js's implementation of `Vector3.prototype.normalize`:
  ```javascript
  normalize: function () {
    return this.divideScalar( this.length() || 1 );
  }
  ```
  When the vector is `(0, 0, 0)`, `this.length()` is `0`. In JavaScript, `0 || 1` evaluates to `1`.
  `divideScalar(1)` divides 0 by 1, returning `Vector3(0, 0, 0)`.
  **It never produces NaN.** Confirmed via Node execution: `node -e "const THREE = require('three'); console.log(new THREE.Vector3(0, 0, 0).normalize());"` prints `Vector3 { x: 0, y: 0, z: 0 }`.
  No NaN matrix corruption occurs.
  *Verdict*: Factually disproven. Not a Bug.

---

### CAND-51: Learning Engine / Missing Bond Mutation Handlers in Context
- **Location**: `src/LearnEngine/SessionMoleculeContext.tsx:288-392`
- **Hunter Claim**: Medium. `'ADD_BOND' | 'REMOVE_BOND' | 'SET_FORMAL_CHARGE'` omitted from switch cases in `executeStructuredAction`.
- **Status**: **PARTIAL** (Incomplete API Contract / Low)
- **Claimed Severity**: Medium
- **Recommended Severity**: Low
- **Adversarial Analysis**:
  `StructuredMolecularAction.type` declares `'ADD_BOND'`, `'REMOVE_BOND'`, and `'SET_FORMAL_CHARGE'`. The `switch` statement in `executeStructuredAction` does not implement these cases, returning `"Unknown action"`. However, codebase search confirms `ButlerEngine.js` currently does not emit `ADD_BOND` or `REMOVE_BOND`. This is an incomplete API stub rather than an active regression. Severity is Low.

---

### CAND-52: Learning / Lesson Step Advance Bypassing Spatial Selection
- **Location**: `src/learning/LessonRunner.tsx:107-118`
- **Hunter Claim**: High. Answering question correctly adds `step.id` to `completedStepIds`, allowing user to advance without completing `SELECT_COMPONENT` requirement.
- **Status**: **CONCEDED**
- **Claimed Severity**: High
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In `LessonRunner.tsx:108-110`, answering a multiple-choice question correctly immediately pushes `step.id` to `completedStepIds`. At line 69, `stepCompleted` becomes `true`. At line 71, `canAdvance = Boolean(step && (stepCompleted || selectionRequirementMet ...))`. Because `stepCompleted` is true, the student can advance immediately, completely bypassing 3D spatial selection checks. Confirmed High educational logic defect.

---

### CAND-53: Learning / Lesson Switch Progress Lag Race Condition
- **Location**: `src/learning/LessonRunner.tsx:52-62, 77-95`
- **Hunter Claim**: Medium. `lesson` updates synchronously while `progress` updates asynchronously in `useEffect`, causing wrong step index and spurious "Lesson complete!" flash.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  `lesson` is derived synchronously via `useMemo` from `lessonId`, while `progress` is updated in a subsequent `useEffect` commit. During the render frame where `lessonId` changes, `lesson` points to the new lesson while `progress` still holds the prior lesson's state. If `previousProgress.currentStepIndex >= newLesson.steps.length`, line 63 evaluates `isFinished = true`, flashing the completion screen. Confirmed Medium.

---

### CAND-54: Spatial HUD / Missing Event StopPropagation Bubbling into R3F
- **Location**: `src/App.tsx:1959` & `src/ScientificHUD.tsx:267, 370, 524, 566` & `src/Sidebar.tsx:21`
- **Hunter Claim**: High. `eventSource={containerRef}` routes all container clicks to R3F; HUD panels lack `stopPropagation`, causing HUD clicks to trigger 3D model selection/camera rotation behind panels.
- **Status**: **CONCEDED**
- **Claimed Severity**: High
- **Recommended Severity**: High
- **Adversarial Analysis**:
  In `App.tsx:1959`, `<Canvas>` has `eventSource={containerRef}`. R3F attaches pointer listeners to the root application container. When clicking or scrolling on `ScientificHUD` panels (`pointer-events-auto`) or `Sidebar`, the events bubble through the DOM to `containerRef`. R3F raycasts at the pointer position, triggering mesh hover/selection and OrbitControls camera drag behind the HUD UI. Confirmed High UX defect.

---

### CAND-55: Spatial HUD / Modal and HUD z-index Overlap Collision
- **Location**: `src/ViewModal.tsx:878` & `src/ScientificHUD.tsx:524, 566, 706`
- **Hunter Claim**: Medium. ViewModal bottom dock and ScientificHUD bottom panels collide at `z-40`, rendering controls unreadable.
- **Status**: **CONCEDED**
- **Claimed Severity**: Medium
- **Recommended Severity**: Medium
- **Adversarial Analysis**:
  When `currentView === 'demonstration'` or `'compare'`, `ViewModal.tsx:878` docks a `max-w-5xl` modal at the bottom of the viewport at `z-40`. Simultaneously, `ScientificHUD.tsx` mounts its bottom-left, bottom-right, and bottom-center control panels at `z-40`. Both UI surfaces fight for pointer events and visually collide. Confirmed Medium.

---

## Adversarial Verdict Summary

- **Total Candidates Audited**: 55
- **Conceded Genuine Bugs**: 41
- **Disproven as Not a Bug**: 7 (CAND-05, CAND-14, CAND-17, CAND-19, CAND-22, CAND-31, CAND-36, CAND-50)
- **Down-ranked / Partial**: 7 (CAND-02, CAND-08, CAND-12, CAND-15, CAND-41, CAND-42, CAND-51)
- **Top Genuine Critical Vulnerabilities to Address in Phase 3B**:
  1. `CAND-06`: Hallucinated Gemini models (`gemini-3.8-flash` / `gemini-3.5-flash-lite`).
  2. `CAND-07`: Leading model turn rejecting first conversation message on Vercel with 400 Bad Request.
  3. `CAND-03`: Division by zero on `delta = 0` resulting in `NaN` camera coordinates and black screen.
  4. `CAND-18`: Single try-catch aborting JSON load and overwriting memories and projects with empty arrays on disk.
  5. `CAND-35`: Unbounded accumulation of 180 audio autoplay event listeners per second on `window`.
  6. `CAND-48`: Two-letter chemical element uppercase bug making all halogens/alkali metals fall back to Carbon.

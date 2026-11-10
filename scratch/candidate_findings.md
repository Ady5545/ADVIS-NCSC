# Consolidated Candidate Findings (Hunters 1–5 Deduplicated)

Total Unique Candidates: 55

---

### CAND-01 (Backend API / Memory Search)
- **Sources**: D1-03, D2-02
- **Severity**: Critical
- **Location**: `server.js:148-154`
- **Evidence & Root Cause**:
  `server.js:151`: `let results = advisMemories.filter(m => m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)));`
  `POST /api/memory` (line 114) does not validate `content` or `tags` (allowing `undefined`, `null`, numbers, or non-arrays). If any memory has `content: undefined`, `m.content.toLowerCase()` throws `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`. If `tags` contains a non-string or is non-array, `t.toLowerCase()` / `m.tags.some` throws `TypeError`.
- **Impact**: Permanent crash / HTTP 500 Denial of Service on `/api/memory/search` until `.data/advis_memories.json` is manually purged.
- **Minimal Fix**:
  ```javascript
  const c = typeof m.content === 'string' ? m.content.toLowerCase() : '';
  const matchTags = Array.isArray(m.tags) && m.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
  let results = advisMemories.filter(m => c.includes(q) || matchTags);
  ```

---

### CAND-02 (Backend API / Project Matching)
- **Sources**: D1-04, D2-03
- **Severity**: Critical
- **Location**: `server.js:160-175, 356-358`
- **Evidence & Root Cause**:
  `server.js:357`: `const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));`
  `POST /api/projects` (line 161) does not require or validate `name`. If a project exists with `name: undefined` or `null`, asking the assistant "switch to the X project" triggers `p.name.toLowerCase()`, throwing an unhandled `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Impact**: Server-side crash / HTTP 500 error during project switching in chat.
- **Minimal Fix**:
  In POST `/api/projects`, reject empty names (`if (!name || typeof name !== 'string') return res.status(400).json({ error: "Valid project name required" });`), and guard line 357 with `typeof p.name === 'string' && p.name.toLowerCase().includes(targetName)`.

---

### CAND-03 (Spatial 3D / Division by Zero on Camera Delta)
- **Sources**: D3-07, D4-02
- **Severity**: Critical
- **Location**: `src/GestureContext.tsx:270, 377-379, 414-415`
- **Evidence & Root Cause**:
  `const dt = Math.min(delta, 0.033);`
  `delta` can be `0` in Three.js/R3F on the initial frame or when the browser tab resumes from background throttling. When `dt === 0`, `dx / dt` evaluates to `Infinity` or `NaN`. This propagates into `rawSpeed`, `orbitSpeedMult`, `spatialCam.targetTheta += NaN`, and `state.cameraTarget.set(camX, camY, camZ)` with `NaN` coordinates.
- **Impact**: Three.js projection matrix evaluates to `NaN`, permanently turning the 3D viewport into a black/blank screen until page reload.
- **Minimal Fix**:
  `const dt = Math.max(0.001, Math.min(delta, 0.033));`

---

### CAND-04 (Spatial AI Tracking / Tracking Loss Reset)
- **Sources**: D3-10, D4-05
- **Severity**: High
- **Location**: `src/GestureContext.tsx:566-577`
- **Evidence & Root Cause**:
  When hand tracking is lost (`handTracking.state !== 'TRACKING'`), `state.targetScale.current = 1.0; state.targetPos.set(0, 0, 0); state.targetEnergy.current = 0;`.
  This directly violates the AGENTS.md invariant: *"PERSISTENCE: Losing hand tracking must NEVER reset the workspace. If the user removes their hand: pause interaction, remember everything, and resume seamlessly when the hand returns."*
- **Impact**: Jarring hologram snapback/reset, losing user's manual inspection placement and scale whenever hands leave the camera frame.
- **Minimal Fix**:
  Remove the reset lines, preserving existing `targetPos` and `targetScale`:
  `state.targetEnergy.current = 0;`

---

### CAND-05 (Learning Progress / Storage Deserialization)
- **Sources**: D2-08, D5-12
- **Severity**: Low
- **Location**: `src/learning/LessonProgress.ts:27-46`
- **Evidence & Root Cause**:
  In `loadLessonProgress` (line 30), `!item.answersByQuestionId` only checks truthiness; non-object types pass validation. In `saveLessonProgress` (line 41), `[...new Set(progress.completedStepIds)]` throws `TypeError: progress.completedStepIds is not iterable` if `completedStepIds` is `null`. `currentStepIndex` is not bounds-checked against negative values.
- **Impact**: Runtime exception when loading/saving lesson progress under corrupted localStorage.
- **Minimal Fix**:
  Validate `typeof item.answersByQuestionId === 'object' && !Array.isArray(item.answersByQuestionId)` and clamp `currentStepIndex = Math.max(0, Math.floor(item.currentStepIndex))`.

---

### CAND-06 (Butler Core / Hallucinated Model Defaults)
- **Sources**: D1-01
- **Severity**: Critical
- **Location**: `ButlerEngine.js:857-860, 876`
- **Evidence & Root Cause**:
  `let aiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";`
  `const fallbackModel = aiModel === "gemini-3.8-flash" ? "gemini-3.5-flash-lite" : "gemini-3.8-flash";`
  `gemini-3.8-flash` and `gemini-3.5-flash-lite` are non-existent model identifiers not offered by Google Gemini API. When `GEMINI_MODEL` is omitted, both primary and fallback calls fail with HTTP 404 Model Not Found.
- **Impact**: 100% failure rate for all conversational AI turns out of the box when `GEMINI_MODEL` is not explicitly set.
- **Minimal Fix**:
  ```javascript
  let aiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = aiModel === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";
  ```

---

### CAND-07 (Butler Core / Gemini Role Alternation & Leading Model Turn)
- **Sources**: D1-02
- **Severity**: Critical
- **Location**: `ButlerEngine.js:754-770`, `api/advis.js:59-73`
- **Evidence & Root Cause**:
  `ButlerEngine.js:754-757` maps `chatHistories[deviceId]` directly into `contents` (`role: msg.role === 'assistant' ? 'model' : 'user'`), followed by pushing the latest user message (`role: 'user'`). In `src/App.tsx:932, 1208`, the UI initializes chat with an assistant welcome message. When `cleanRecentConversation` slices the history, `contents[0]` has `role: 'model'`. The Gemini API strictly rejects conversations starting with a `model` turn (`400 Invalid Argument: First content must be from user`). Furthermore, if history ends with `user`, pushing another `user` creates consecutive turns with the same role, also rejected by the API.
- **Impact**: Gemini API throws HTTP 400 Bad Request on the very first turn when the UI supplies the initial assistant message or whenever turns do not strictly alternate.
- **Minimal Fix**:
  In `cleanRecentConversation` / `ButlerEngine.js`, drop leading `model`/`assistant` turns and trim trailing `user` turns:
  ```javascript
  while (history.length > 0 && history[0].role !== 'user') history.shift();
  if (history.length > 0 && history[history.length - 1].role === 'user') history.pop();
  ```

---

### CAND-08 (Backend Security / Prototype Poisoning on deviceId)
- **Sources**: D1-05
- **Severity**: Critical
- **Location**: `server.js:851-853`, `ButlerEngine.js:752-754`, `server.js:192-195`
- **Evidence & Root Cause**:
  `server.js:851`: `if (!chatHistories[deviceId]) { chatHistories[deviceId] = []; }`
  `chatHistories` is a plain `{}` object. If `deviceId` equals an `Object.prototype` property (e.g. `"toString"`, `"valueOf"`, `"__proto__"`), `chatHistories[deviceId]` evaluates to the inherited function (truthy). It is never initialized to `[]`, and `chatHistories[deviceId].push(...)` or `.map(...)` throws `TypeError: chatHistories[deviceId].push is not a function`.
- **Impact**: Server crash / 500 error for any request supplying `deviceId: "toString"` or prototype properties; prototype pollution risk.
- **Minimal Fix**:
  ```javascript
  const safeDeviceId = typeof deviceId === 'string' && !['__proto__', 'constructor', 'prototype'].includes(deviceId) ? deviceId.slice(0, 100) : 'default';
  ```

---

### CAND-09 (Backend Security / Missing CORS)
- **Sources**: D1-06
- **Severity**: Medium
- **Location**: `server.js:1-926`, `docs/SECURITY.md:37-43`
- **Evidence & Root Cause**:
  `docs/SECURITY.md:37` claims: *"The server enforces origin restriction via ADVIS_ALLOWED_ORIGINS"*. In reality, `server.js` contains zero CORS middleware or headers. Only `api/advis.js` and `api/history.js` implement `applyCors()`.
- **Impact**: Cross-origin requests from the GitHub Pages deployment or Vite dev server to `server.js` fail due to missing `Access-Control-Allow-Origin` and preflight rejection; security doc assertion is untrue.
- **Minimal Fix**: Add CORS middleware at top of `server.js`.

---

### CAND-10 (Backend Security / Prompt Injection via Butler Context)
- **Sources**: D1-07
- **Severity**: Medium
- **Location**: `server.js:855-865`, `api/advis.js:143-201, 480`
- **Evidence & Root Cause**:
  `api/advis.js` sanitizes incoming context using `cleanContext(rawContext)`. In contrast, `server.js:855-865` passes raw `clientButlerContext` directly to `processButlerTurn`.
- **Impact**: Unsanitized user content in `butlerContext` is interpolated verbatim into Gemini's system instruction, opening a direct prompt injection vector on `server.js`.
- **Minimal Fix**:
  Apply `cleanContext` to incoming context in `server.js`.

---

### CAND-11 (Backend API / Image-Only Request Rejection)
- **Sources**: D1-08
- **Severity**: Medium
- **Location**: `server.js:849`, `api/advis.js:458-464`
- **Evidence & Root Cause**:
  `server.js:849`: `if (!message) return res.status(400).json({ error: "Protocol violation: Message payload is empty." });`
  When a user attaches an image without a message, `api/advis.js:462` synthesizes an observation prompt. `server.js` unconditionally rejects the request with HTTP 400.
- **Impact**: Inconsistency between environments; image-only queries work on Vercel but break on `server.js`.
- **Minimal Fix**:
  If message is empty but image is present, set default message: `"Describe what can be directly observed in this image."`.

---

### CAND-12 (Backend / Unbounded Rate Limit Map Memory Leak)
- **Sources**: D1-09
- **Severity**: Medium
- **Location**: `api/advis.js:9-10, 36-51`
- **Evidence & Root Cause**:
  `const requestWindows = new Map();`
  Entries in `requestWindows` are never evicted or deleted. Expired windows are only overwritten if the exact same IP requests again.
- **Impact**: Unbounded Map growth causing memory leak / OOM under high-cardinality IP traffic.
- **Minimal Fix**: Prune expired entries when map size exceeds threshold.

---

### CAND-13 (Backend / Ignored PORT Environment Variable)
- **Sources**: D1-10
- **Severity**: Medium
- **Location**: `server.js:12, 918`
- **Evidence & Root Cause**:
  `const PORT = 3000;`
  `app.listen(PORT, "0.0.0.0", () => { ... });`
  `server.js` ignores `process.env.PORT`.
- **Impact**: Server fails to bind in container environments (Cloud Run, Railway, Render) that dynamically allocate PORT.
- **Minimal Fix**: `const PORT = parseInt(process.env.PORT, 10) || 3000;`

---

### CAND-14 (Backend Security / 50MB Body DoS)
- **Sources**: D1-11
- **Severity**: Medium
- **Location**: `server.js:19`, `docs/SECURITY.md:49`
- **Evidence & Root Cause**:
  `app.use(express.json({ limit: '50mb' }));`
  Accepting unauthenticated 50MB JSON bodies without rate limiting enables CPU starvation during JSON parsing and heap memory exhaustion.
- **Impact**: Event loop starvation and DoS on the Node process.
- **Minimal Fix**: Restrict limit to `'10mb'`.

---

### CAND-15 (Backend / Markdown Code Fence Parsing in Structure Generator)
- **Sources**: D1-12
- **Severity**: Low
- **Location**: `server.js:828`
- **Evidence & Root Cause**:
  `const result = JSON.parse(response.text);` in `/api/generate-structure`. If Gemini wraps valid JSON inside markdown code fences, `JSON.parse` throws `SyntaxError`.
- **Impact**: Structure generation fails with HTTP 500 despite valid structural JSON.
- **Minimal Fix**: Strip markdown fences before calling `JSON.parse`.

---

### CAND-16 (Backend / HTTP Status Code Inconsistency)
- **Sources**: D1-13
- **Severity**: Low
- **Location**: `server.js:892`, `api/advis.js:519`
- **Evidence & Root Cause**:
  When `processButlerTurn` errors, `server.js` returns HTTP 200 with `{ status: "error" }`, whereas `api/advis.js` returns HTTP 502 Bad Gateway.
- **Impact**: Status code contract mismatch.
- **Minimal Fix**: Return 502 Bad Gateway on error.

---

### CAND-17 (Deployment / Missing Vercel Rewrites)
- **Sources**: D1-14
- **Severity**: Low
- **Location**: `vercel.json:1-7`
- **Evidence & Root Cause**:
  `vercel.json` does not rewrite `/api/jarvis` to `/api/advis`.
- **Impact**: Calls to `/api/jarvis` 404 on Vercel.
- **Minimal Fix**: Add rewrite in `vercel.json`.

---

### CAND-18 (Persistence / Single Try-Catch Wiping Data On Corrupted File)
- **Sources**: D2-01
- **Severity**: Critical
- **Location**: `server.js:42-67`
- **Evidence & Root Cause**:
  Lines 42-55 wrap loading of `HISTORY_FILE`, `MEMORIES_FILE`, `ADVIS_MEMORIES_FILE`, and `ADVIS_PROJECTS_FILE` in a single `try/catch`. If `histories.json` contains corrupted JSON, the catch block aborts the remaining loads, leaving `advisMemories = []` and `advisProjects = []`. Subsequent `saveData()` immediately overwrites `advis_memories.json` and `advis_projects.json` with empty arrays `[]`, destroying all stored user projects and memories on disk.
- **Impact**: Permanent data loss of user memories and projects.
- **Minimal Fix**: Wrap each file load in an independent try-catch block and write via temporary atomic files.

---

### CAND-19 (Persistence / WorkshopStore Silently Drops Projects Across Models)
- **Sources**: D2-04
- **Severity**: Critical
- **Location**: `src/workshop/WorkshopStore.ts:167-191`
- **Evidence & Root Cause**:
  `readStore(catalog)` (line 174) filters projects using `validateWorkshopProject(item, catalog)`. In `saveWorkshopProject` (lines 184-186):
  `const projects = readStore(catalog).filter((candidate) => candidate.id !== project.id);`
  `window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_WORKSHOP_PROJECTS)));`
  All projects filtered out by `readStore` (e.g. for other models) are omitted when saving back to localStorage, permanently deleting them from the user's browser.
- **Impact**: Irreversible, silent deletion of user workshop projects across models.
- **Minimal Fix**: Read raw projects from localStorage without dropping unvalidated items during save; only filter when querying projects for the active model/UI.

---

### CAND-20 (Persistence / Shallow Merge Overwriting Immutable Fields)
- **Sources**: D2-05
- **Severity**: Medium
- **Location**: `server.js:133-140, 177-184`
- **Evidence & Root Cause**:
  `const updated = { ...advisMemories[memIdx], ...req.body, updatedAt: Date.now() };`
  Blind shallow merges with `req.body` allow client to overwrite immutable `id`, `createdAt`, or inject invalid data types.
- **Impact**: State pollution and foreign key breakage.
- **Minimal Fix**: Whitelist mutable properties and enforce `id: req.params.id` and immutable `createdAt`.

---

### CAND-21 (Persistence / Weak ID Generation Collision)
- **Sources**: D2-06
- **Severity**: Medium
- **Location**: `server.js:116, 163`
- **Evidence & Root Cause**:
  IDs are generated with `Date.now() + "_" + Math.floor(Math.random()*1000)`. Line 102 defines `uuidv4 = () => crypto.randomUUID();`, but it is bypassed. With only 1,000 random buckets, requests within the same millisecond have high collision probability.
- **Impact**: ID collisions causing existing memories or projects to be silently overwritten.
- **Minimal Fix**: Use `crypto.randomUUID()`.

---

### CAND-22 (Workshop / Shallow Command Stack Aliasing)
- **Sources**: D2-07
- **Severity**: Medium
- **Location**: `src/workshop/WorkshopStore.ts:102-120`
- **Evidence & Root Cause**:
  `let commands = project.commands.slice(0, project.cursor);` shallow copies command objects (`before`, `after`). Mutations to annotations or command properties in active states alias into past undo/redo history.
- **Impact**: Corrupted undo/redo stack.
- **Minimal Fix**: Deep clone command objects during slice.

---

### CAND-23 (Model Catalog / Missing Component ID in V12 ExplodedParts)
- **Sources**: D2-09
- **Severity**: Low
- **Location**: `src/SpatialLibrary.ts:985` vs `src/SpatialLibrary.ts:1006-1040`
- **Evidence & Root Cause**:
  `SPATIAL_LIBRARY['v12_engine']` defines `explodedParts: ['v12.piston_left_bank', 'v12.piston_right_bank', 'v12.crankshaft', 'v12.cylinder_head', 'v12.intake_plenum', 'v12.exhaust_manifold']`.
  However, `v12_engine.components` contains `id: 'v12.valvetrain'`, not `v12.cylinder_head`.
- **Impact**: Audit script warning and metadata inconsistency.
- **Minimal Fix**: Change `'v12.cylinder_head'` to `'v12.valvetrain'` in `src/SpatialLibrary.ts:985`.

---

### CAND-24 (Model Catalog / Missing modelKind Warnings)
- **Sources**: D2-10
- **Severity**: Low
- **Location**: `src/SpatialLibrary.ts:150, 951, 1087` & `scripts/validate-model-catalog.mjs:109`
- **Evidence & Root Cause**:
  Only 3 models out of 53 declare `modelKind`. The remaining 50 omit it, producing 50 warnings in `scripts/validate-model-catalog.mjs`.
- **Impact**: 50 persistent catalog validation warnings.
- **Minimal Fix**: Populate `modelKind` across all 50 catalog entries.

---

### CAND-25 (3D Graphics / CadMesh Geometry Leak)
- **Sources**: D3-01
- **Severity**: Critical
- **Location**: `src/cad/CadModelCanvas.tsx:16-31`
- **Evidence & Root Cause**:
  `CadMesh` allocates a `new THREE.BufferGeometry()` on every model change or re-evaluation without a disposal hook.
- **Impact**: Memory leak leading to WebGL GPU memory exhaustion and browser tab crash during CAD model inspection.
- **Minimal Fix**: Add `useEffect(() => () => geometry?.dispose(), [geometry]);`.

---

### CAND-26 (3D Graphics / Inline EdgesGeometry Leak)
- **Sources**: D3-02
- **Severity**: Critical
- **Location**: `src/cad/CadAssetRenderer.tsx:134-138`
- **Evidence & Root Cause**:
  `new THREE.EdgesGeometry(geometry, 18)` is instantiated inline in JSX on every render cycle of `CadAssetRenderer`. Unreferenced edge geometries are never disposed.
- **Impact**: Fast WebGL VRAM leak; thousands of edge buffer allocations cause GPU driver stutter and eventual WebGL context crash.
- **Minimal Fix**: Memoize `EdgesGeometry` and dispose on unmount/change.

---

### CAND-27 (3D Graphics / GLTF Cloned Materials Leak)
- **Sources**: D3-03
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:94-112`
- **Evidence & Root Cause**:
  `RealisticGLTFModel` clones materials on every GLB model instance without disposing cloned materials/textures when unmounting or switching models.
- **Impact**: Accumulating WebGLProgram shaders and texture bindings in WebGL context on every GLB model switch.
- **Minimal Fix**: Traverse and dispose materials in unmount effect.

---

### CAND-28 (3D Graphics / Object.entries & Vector3 GC Churn in 60 FPS Loop)
- **Sources**: D3-04
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:2189-2198`
- **Evidence & Root Cause**:
  Inside 60 FPS `useFrame` callback, `Object.entries(componentRefs.current)` allocates an array of tuples every frame, and line 2196 instantiates `new THREE.Vector3()` for every component on every frame.
- **Impact**: Excessive heap allocations triggering frequent GC pauses and frame-time spikes during model manipulation.
- **Minimal Fix**: Reuse a module-level or ref `tempTarget` Vector3 and use `for...in`.

---

### CAND-29 (3D Graphics / Raycaster Vector Churn & 60 FPS Console Logging)
- **Sources**: D3-05
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:2563-2568` & `src/GestureContext.tsx:326-335`
- **Evidence & Root Cause**:
  `new THREE.Vector2()` and `.clone()` allocated every frame in raycasting. `console.log('[GESTURE OWNERSHIP DEBUG]')` in `GestureContext` executes unconditionally at 60 FPS whenever a hand is active.
- **Impact**: GC pressure and main thread serialization lag.
- **Minimal Fix**: Module-level scratch vectors and throttle or remove debug `console.log`.

---

### CAND-30 (3D Graphics / NaN Propagation in Engine Kinematics)
- **Sources**: D3-06
- **Severity**: Critical
- **Location**: `src/SpatialObjectEngine.tsx:2210-2217`
- **Evidence & Root Cause**:
  `const currentRpm = isV8Active ? v8RpmRef.current : v12RpmRef.current;`
  If `v12RpmRef.current` or `v8RpmRef.current` is undefined, `currentRpm / 60` produces `NaN`. Since `NaN !== 0` is `true`, `sysTimeRef.current = rad / NaN` stores `NaN`. This `NaN` propagates to `getPistonStroke` and all kinematics transforms.
- **Impact**: Three.js `matrixWorld` transforms become `NaN`, resulting in models completely disappearing from the viewport.
- **Minimal Fix**: Guard `currentRpm ?? 0` and verify `Number.isFinite(omega) && omega !== 0`.

---

### CAND-31 (3D Graphics / Division by Zero in V8 Precision Pulley)
- **Sources**: D3-08
- **Severity**: Low
- **Location**: `src/generators/V8Precision.tsx:760-762`
- **Evidence & Root Cause**:
  `const speedRatio = 0.245 / radius;`
  Division by `radius` without zero-check produces `Infinity` if `radius <= 0`.
- **Impact**: Corrupts pulley rotation matrix if radius is invalid.
- **Minimal Fix**: `const speedRatio = radius > 0.001 ? 0.245 / radius : 1;`.

---

### CAND-32 (Spatial AI / Theatre Camera Conflict With User Controls)
- **Sources**: D3-09
- **Severity**: Medium
- **Location**: `src/theatre/TheatreV12Bridge.ts:28-34, 42-47` & `src/SpatialObjectEngine.tsx:2185-2187`
- **Evidence & Root Cause**:
  While Theatre presentation plays, `applyTheatreCamera` continuously dispatches `advis-camera-preset` every rAF tick, directly overwriting manual hand/orbit coordinates. Upon presentation completion, `theatreFactor` instantly snaps from `1` to `0` without damping.
- **Impact**: Violates AGENTS.md ("The user should never fight the interface; it should adapt to the user"). User controls fight presentation; visual popping occurs at sequence conclusion.
- **Minimal Fix**: Pause sequence if user interacts; lerp `theatreFactor` smoothly.

---

### CAND-33 (3D Graphics / Missing WebGL Context Loss Handler)
- **Sources**: D3-11
- **Severity**: Critical
- **Location**: `src/App.tsx:1954-1961` & `src/cad/CadModelCanvas.tsx:63-67`
- **Evidence & Root Cause**:
  Neither `<Canvas>` instance handles `webglcontextlost`. In the WebGL specification, if `event.preventDefault()` is not called during `webglcontextlost`, the browser will not attempt to restore the context via `webglcontextrestored`. Furthermore, the root `<Canvas>` in `App.tsx` is not wrapped in an isolated ErrorBoundary.
- **Impact**: Unrecoverable black screen upon GPU sleep/wake, driver timeout, or display disconnect.
- **Minimal Fix**: Call `e.preventDefault()` on `webglcontextlost` and wrap Canvas in ErrorBoundary.

---

### CAND-34 (3D Graphics / Variable Telemetry in Geometry Args)
- **Sources**: D3-12
- **Severity**: Medium
- **Location**: `src/generators/V12VisualOverlays.tsx:78, 112`
- **Evidence & Root Cause**:
  `<sphereGeometry args={[0.18 * flameIntensity, 16, 16]} />`
  `args` arrays containing variable telemetry values (`flameIntensity`, `arrowLength`) change every frame at 60 FPS. In R3F, mutating geometry `args` forces geometry destruction, buffer reallocation, and CPU-to-GPU re-uploads on every frame for 12 cylinders.
- **Impact**: Up to 1440 WebGL buffer allocations per second causing GC spikes and stutter.
- **Minimal Fix**: Use static unit geometries (`args={[1, 1, 1]}`) and modulate dimensions dynamically via `<mesh scale={...}>`.

---

### CAND-35 (Kinematics & Audio / Audio Autoplay 180 Listeners/sec Leak)
- **Sources**: D4-01
- **Severity**: Critical
- **Location**: `src/scientific/V12EngineAudioEngine.ts:201-224` & `src/scientific/V8EngineAudioEngine.ts:202-225`
- **Evidence & Root Cause**:
  When browser blocks audio autoplay, `ctx.resume()` rejects. In the catch block, a new closure is defined and 3 window listeners are registered on every invocation of `update()`. Since `update()` is called at ~60 Hz, **180 event listeners accumulate on `window` every second** (1,800 in 10s) without any guard against duplicate registration.
- **Impact**: Unbounded memory growth, event queue saturation, and browser thread lockup when user clicks.
- **Minimal Fix**: Guard registration with `if (!this.unlockAttached)`.

---

### CAND-36 (Kinematics / Mathematical Singularity in Four-Stroke Slider-Crank)
- **Sources**: D4-03
- **Severity**: Critical
- **Location**: `src/scientific/FourStrokeEngineModel.ts:983`
- **Evidence & Root Cause**:
  `const conrodAngle1 = Math.asin((r / L) * sinTheta1);`
  Mathematical singularity: `Math.asin` domain is strictly `[-1, 1]`. If `(r / L) * sinTheta1` exceeds 1.0 or -1.0 due to floating-point rounding or parameter variation, `Math.asin` returns `NaN`. `SimulationEngine` throws an uncaught error on non-finite values and calls `this.pause()`, halting the entire simulation permanently.
- **Impact**: Kinematics simulation crash and complete UI execution freeze.
- **Minimal Fix**: Clamp argument: `Math.asin(Math.max(-1, Math.min(1, (r / L) * sinTheta1)))`.

---

### CAND-37 (Spatial AI / TypeError on Truncated Landmarks)
- **Sources**: D4-04
- **Severity**: Critical
- **Location**: `src/useHandTracking.ts:250, 269, 278, 304-308`
- **Evidence & Root Cause**:
  `const lm = state.hands.map(h => h.landmarks)[0];`
  `rawCursor = { x: lm[8].x, y: lm[8].y, z: getDistance(lm[0], lm[9]) };`
  If `state.hands` contains an entry where `landmarks` is empty or has fewer than 21 landmarks, `lm[8]` evaluates to `undefined`, and `lm[8].x` throws `TypeError: Cannot read properties of undefined (reading 'x')`.
- **Impact**: Unhandled React runtime exception crashing hand tracking pipeline.
- **Minimal Fix**: Filter `state.hands.filter(h => h?.landmarks && h.landmarks.length >= 21)`.

---

### CAND-38 (Spatial AI / Unclosed Microphone MediaStream Tracks)
- **Sources**: D4-06
- **Severity**: High
- **Location**: `src/App.tsx:804-886`
- **Evidence & Root Cause**:
  `navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => { ... })`
  `stream` is captured inside `.then` and never stored in a component ref. On unmount, `stream.getTracks().forEach(t => t.stop())` is never called.
- **Impact**: Security/privacy violation (unstopped microphone access), recording indicator remains lit, CPU/battery drain.
- **Minimal Fix**: Store `stream` in ref and call `t.stop()` on unmount.

---

### CAND-39 (Spatial AI / Discarded MediaPipe Confidence Gating)
- **Sources**: D4-07
- **Severity**: Medium
- **Location**: `src/useHandTracking.ts:257`
- **Evidence & Root Cause**:
  `let confidence = 0.99;`
  MediaPipe detection confidence score is discarded and hardcoded to 0.99. Low-confidence detections during occlusion or poor lighting are treated as 99% certain, firing spurious pinches and clicks. Violates AGENTS.md confidence gating rule.
- **Impact**: False positive gestures, phantom clicks, and visual cursor jitter.
- **Minimal Fix**: Read actual score and gate if confidence < 0.65.

---

### CAND-40 (Kinematics / Web Audio TypeError on Non-Finite Frequency)
- **Sources**: D4-08
- **Severity**: Medium
- **Location**: `src/scientific/V12EngineAudioEngine.ts:286-304` & `src/scientific/V8EngineAudioEngine.ts:287-305`
- **Evidence & Root Cause**:
  If `rpm` or `speed` is non-finite (`NaN` or `Infinity`), `f0` becomes `NaN`. Passing `NaN` to Web Audio `setTargetAtTime` throws: `TypeError: Failed to execute 'setTargetAtTime' on 'AudioParam': The provided float value is non-finite.`
- **Impact**: Synthesizer tick crashes with unhandled TypeError.
- **Minimal Fix**: Sanitize `safeRpm` and `safeSpeed` with `Number.isFinite`.

---

### CAND-41 (Kinematics / RAF Loop Crash on Bus Subscriber Exception)
- **Sources**: D4-09
- **Severity**: Medium
- **Location**: `src/scientific/EngineKinematicsBus.ts:270-272`
- **Evidence & Root Cause**:
  `for (const listener of this.listeners) { listener(this.snapshot); }`
  Called inside 60 FPS Three.js `useFrame` render loop. If any subscriber throws an error, the uncaught exception terminates the loop and crashes the Three.js RAF render loop.
- **Impact**: Unhandled subscriber error halts 3D scene rendering.
- **Minimal Fix**: Wrap `listener(this.snapshot)` in `try...catch`.

---

### CAND-42 (Kinematics / Undisposed AudioContext and Oscillators on Unmount)
- **Sources**: D4-10
- **Severity**: Medium
- **Location**: `src/scientific/V12EngineAudioEngine.ts:182-188, 357-359, 420-425`
- **Evidence & Root Cause**:
  In `initAudio()`, 6 oscillators are started with `.start()`. When unmounting, `stop()` only ramps down `masterGain`. Oscillators are never stopped or disconnected, and `AudioContext` remains active indefinitely.
- **Impact**: Permanent background audio DSP thread consumption and memory leak.
- **Minimal Fix**: Suspend AudioContext on stop.

---

### CAND-43 (CAD / OpenCASCADE WebAssembly Heap Memory Leak)
- **Sources**: D5-01
- **Severity**: Critical
- **Location**: `src/cad/CadKernelService.ts:72-107`
- **Evidence & Root Cause**:
  `const shape = format === 'BREP' ? kernel.fromBREP(textData) : kernel.importStep(textData);`
  `shape` is an OpenCASCADE C++ handle allocated in the WebAssembly linear heap. `kernel.release(shape)` is never called on success or in a `finally` block on error.
- **Impact**: OpenCASCADE WASM heap memory exhaustion and browser tab OOM crash after importing CAD models or re-tessellating.
- **Minimal Fix**: Release shape in `finally` block (`kernel.release(shape)`).

---

### CAND-44 (CAD / Unhandled Rejected WASM Initialization Promise)
- **Sources**: D5-02
- **Severity**: Medium
- **Location**: `src/cad/CadKernelService.ts:22-30`
- **Evidence & Root Cause**:
  If `OcctKernel.init()` rejects, `kernelPromise` caches the rejected promise indefinitely.
- **Impact**: All subsequent CAD imports fail permanently without ever attempting re-initialization.
- **Minimal Fix**: Reset `kernelPromise = null` on `.catch()`.

---

### CAND-45 (CAD / Binary BREP UTF-8 Decoding Corruption)
- **Sources**: D5-03
- **Severity**: Critical
- **Location**: `src/cad/CadKernelService.ts:69-75`
- **Evidence & Root Cause**:
  Binary `.brep` or `.brp` files are decoded via UTF-8 `TextDecoder`, corrupting binary data with replacement characters. Missing try-catch around C++ WASM calls.
- **Impact**: Importing binary BREP or malformed STEP files triggers unhandled C++ runtime panics.
- **Minimal Fix**: Distinguish text vs binary BREP; pass buffer/bytes safely.

---

### CAND-46 (CAD / Cached Rejected Model Fetch Promise)
- **Sources**: D5-04
- **Severity**: Medium
- **Location**: `src/cad/CadAssetRenderer.tsx:28-29`
- **Evidence & Root Cause**:
  If `pending` fetch rejects (transient network failure), the rejection remains permanently cached in module-level `modelCache`.
- **Impact**: User cannot retry loading a CAD asset after a transient failure without a hard page reload.
- **Minimal Fix**: Delete entry from cache on error (`pending.catch(() => modelCache.delete(cacheKey))`).

---

### CAND-47 (CAD / Parametric Slider Un-debounced History Flood)
- **Sources**: D5-05
- **Severity**: Medium
- **Location**: `src/cad/ParametricInnovationLab.tsx:90-101, 249`
- **Evidence & Root Cause**:
  Continuous slider dragging fires `onChange` on every mouse/touch move, pushing 40-50 undo states per second to `history` and forcing synchronous 3D planetary gear mesh regenerations.
- **Impact**: UI jank/freezes during slider scrubbing; undo history filled with single-pixel drag micro-steps.
- **Minimal Fix**: Update params during drag, commit to undo history only on `onPointerUp`.

---

### CAND-48 (Learning Engine / Two-Letter Chemical Element Case Bug)
- **Sources**: D5-06
- **Severity**: Critical
- **Location**: `src/LearnEngine/ValenceValidator.ts:73-74`
- **Evidence & Root Cause**:
  Keys in `ELEMENT_VALENCE_DATA` are title-cased (`Na`, `Cl`, `Si`, `Br`, `Ca`, `Mg`, `K`). `atom.element.toUpperCase()` transforms `"Na"` -> `"NA"`, `"Cl"` -> `"CL"`, causing `ELEMENT_VALENCE_DATA['NA']` and `['CL']` to return `undefined`.
- **Impact**: All two-letter elements fall back to Carbon (valence 4, electronegativity 2.0). NaCl, PCl5, CaCl2, and Si structures calculate completely invalid octets and formal charges.
- **Minimal Fix**: Title-case multi-letter element symbols before lookup.

---

### CAND-49 (Learning Engine / Formal Charge Algebraic Cancellation)
- **Sources**: D5-07
- **Severity**: Medium
- **Location**: `src/LearnEngine/ValenceValidator.ts:89-93`
- **Evidence & Root Cause**:
  `let nonBondingElectrons = Math.max(0, standardData.valence - totalBondOrder);`
  `let formalCharge = atom.charge !== undefined ? atom.charge : (standardData.valence - nonBondingElectrons - totalBondOrder);`
  Algebraic cancellation: `valence - (valence - totalBondOrder) - totalBondOrder === 0`.
- **Impact**: `formalCharge` is hard-locked to `0` for all standard atoms. Polyatomic ions (NH4+, H3O+) calculate net formal charge of 0 instead of +1.
- **Minimal Fix**: Compute non-bonding electrons properly accounting for atom charge and bond valence electrons.

---

### CAND-50 (Learning Engine / Molecular Vector Normalize on Zero Cross-Product)
- **Sources**: D5-08
- **Severity**: Critical
- **Location**: `src/LearnEngine/MolecularEngine.ts:196-201, 212-214`
- **Evidence & Root Cause**:
  When `v0` and `v1` are collinear/parallel (common in linear molecules or 180° orientations), `v0.cross(v1)` produces `(0,0,0)`. Calling `.normalize()` on a zero vector yields `Vector3(NaN, NaN, NaN)`.
- **Impact**: The attached atom's position becomes `NaN`, corrupting Three.js world transform matrices and blanking the 3D molecular canvas.
- **Minimal Fix**: Fallback to orthogonal vector if cross product length is zero.

---

### CAND-51 (Learning Engine / Missing Bond Mutation Handlers in Context)
- **Sources**: D5-09
- **Severity**: Medium
- **Location**: `src/LearnEngine/SessionMoleculeContext.tsx:288-392`
- **Evidence & Root Cause**:
  `StructuredMolecularAction.type` explicitly defines `'ADD_BOND' | 'REMOVE_BOND' | 'SET_FORMAL_CHARGE'`. However, `executeStructuredAction`'s `switch` block omits all three cases, defaulting to `return { success: false, message: 'Unknown action: ADD_BOND' }`.
- **Impact**: Voice/AI core commands to add bonds between existing atoms or create cyclic rings fail with "Unknown action".
- **Minimal Fix**: Add cases in `executeStructuredAction`.

---

### CAND-52 (Learning / Lesson Step Advance Bypassing Spatial Selection)
- **Sources**: D5-10
- **Severity**: High
- **Location**: `src/learning/LessonRunner.tsx:107-118`
- **Evidence & Root Cause**:
  When a question is answered correctly, `saveAnswer` immediately adds `step.id` to `completedStepIds`. At line 69, `stepCompleted` becomes true, enabling `canAdvance` and allowing the user to skip required spatial operations (e.g. `SELECT_COMPONENT`).
- **Impact**: Students advance past guided learning checkpoints without performing the required 3D component inspection/selection.
- **Minimal Fix**: Check `meetsCriteria = isCorrect && (step.completionRule.type !== 'SELECT_COMPONENT' || selectedComponentId === step.completionRule.componentId);`.

---

### CAND-53 (Learning / Lesson Switch Progress Lag Race Condition)
- **Sources**: D5-11
- **Severity**: Medium
- **Location**: `src/learning/LessonRunner.tsx:52-62, 77-95`
- **Evidence & Root Cause**:
  When `chooseLesson` triggers `setLessonId`, `lesson` updates synchronously via `useMemo`, but `progress` remains from the prior lesson until `useEffect` loads the new progress on the next frame. If `progress.currentStepIndex >= newLesson.steps.length`, `isFinished` flashes true.
- **Impact**: Asynchronous race condition causing spurious "Lesson complete!" flash and incorrect 3D model actions executed when switching lessons.
- **Minimal Fix**: Verify `isLessonSynced = progress.lessonId === lesson?.id;` before evaluating step or completion.

---

### CAND-54 (Spatial HUD / Missing Event StopPropagation Bubbling into R3F)
- **Sources**: D5-13
- **Severity**: High
- **Location**: `src/App.tsx:1959` & `src/ScientificHUD.tsx:267, 370, 524, 566` & `src/Sidebar.tsx:21`
- **Evidence & Root Cause**:
  `App.tsx:1959` sets `eventSource={containerRef}` on `<Canvas>`, routing all pointer events on the root container through R3F. `ScientificHUD` panels (`z-40 pointer-events-auto`) and `Sidebar` (`z-10 pointer-events-auto`) do not call `e.stopPropagation()` on `pointerDown` / `pointerMove`.
- **Impact**: Clicking or dragging HUD controls/sidebar items bubbles to R3F, triggering unintended 3D model hover/selection and camera rotation behind HUD panels, violating AGENTS.md ("The user should never fight the interface; controls must feel invisible").
- **Minimal Fix**: Add `onPointerDown={(e) => e.stopPropagation()}` on HUD and Sidebar panel roots.

---

### CAND-55 (Spatial HUD / Modal and HUD z-index Overlap Collision)
- **Sources**: D5-14
- **Severity**: Medium
- **Location**: `src/ViewModal.tsx:878` & `src/ScientificHUD.tsx:524, 566, 706`
- **Evidence & Root Cause**:
  `ViewModal.tsx:878` docks at bottom (`items-end z-40 max-h-[50vh]`) when `currentView === 'compare'` or `'demonstration'`. Simultaneously, `ScientificHUD.tsx` mounts its bottom panels at `z-40`.
- **Impact**: Two overlapping UI systems at `z-40`, rendering controls unreadable and clicks misrouted.
- **Minimal Fix**: Hide ScientificHUD bottom panels when modal views (`currentView !== 'home'`) are active.

# Authoritative Referee Verdict Report (Phase 3B Arbitration)

**Role**: Chief Referee Agent  
**Date**: November 10, 2026  
**Pipeline**: `/bug-hunt` Phase 3B Final Adjudication  
**Inputs**: `scratch/candidate_findings.md` (55 candidates) & `scratch/skeptic_evaluation.md` (adversarial audit)  
**Governing Protocols**: `/precontext`, `/gravitas`, `/ponytail` (Lazy Senior Dev Mode)  
**Status**: Authoritative & Final

---

## 1. Executive Summary & Verdict Statistics

Between Phase 2 (Candidate Generation) and Phase 3A (Skeptic Adversarial Audit), 55 candidate defects were identified, analyzed, and stressed against source code, runtime specifications, Three.js engine mechanics, IEEE 754 floating-point mathematics, and Vercel/Express environment lifecycles.

As Chief Referee, an independent symbol-by-symbol and execution-trace review was conducted across all 55 candidates.

### Overall Arbitration Verdict

| Category | Count | Percentage | Candidates |
|---|---|---|---|
| **CONFIRMED REAL BUG** | **47** | **85.5%** | CAND-01, CAND-02, CAND-03, CAND-04, CAND-06, CAND-07, CAND-08, CAND-09, CAND-10, CAND-11, CAND-12, CAND-13, CAND-15, CAND-16, CAND-18, CAND-20, CAND-21, CAND-23, CAND-24, CAND-25, CAND-26, CAND-27, CAND-28, CAND-29, CAND-30, CAND-32, CAND-33, CAND-34, CAND-35, CAND-37, CAND-38, CAND-39, CAND-40, CAND-41, CAND-42, CAND-43, CAND-44, CAND-45, CAND-46, CAND-47, CAND-48, CAND-49, CAND-51, CAND-52, CAND-53, CAND-54, CAND-55 |
| **DISMISSED (FALSE POSITIVE)** | **8** | **14.5%** | CAND-05, CAND-14, CAND-17, CAND-19, CAND-22, CAND-31, CAND-36, CAND-50 |
| **Total Candidates Evaluated** | **55** | **100.0%** | |

### Domain Breakdown & Statistics

| Domain | Total Evaluated | Confirmed Bugs | Dismissed (FP) | Confirmed Critical | Confirmed High | Confirmed Medium | Confirmed Low |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **D1: Backend, Security & Butler Core** | 15 | 13 | 2 | 2 | 1 | 6 | 4 |
| **D2: Persistence & Catalog** | 6 | 4 | 2 | 1 | 0 | 2 | 1 |
| **D3: 3D Graphics & Spatial Interaction** | 12 | 11 | 1 | 1 | 4 | 5 | 1 |
| **D4: Kinematics, Audio & Tracking** | 8 | 7 | 1 | 1 | 2 | 3 | 1 |
| **D5: CAD, Learning Engine & HUD** | 14 | 12 | 2 | 0 | 3 | 5 | 4 |
| **Total** | **55** | **47** | **8** | **5** | **10** | **21** | **11** |

### Severity Distribution of Confirmed Real Bugs

```
  Critical (5) : [█████] 10.6%
  High    (10) : [██████████] 21.3%
  Medium  (21) : [█████████████████████] 44.7%
  Low     (11) : [███████████] 23.4%
  Total Confirmed = 47
```

### Referee Arbitration Findings on Adversarial Disagreements
1. **Mathematical Singularity Disproofs Upheld**: The Skeptic correctly demonstrated that `CAND-36` ($r/L \cdot \sin(\theta) \le 0.3035 < 1.0$) and `CAND-50` (Three.js `Vector3.normalize()` dividing by `length || 1` returning $(0,0,0)$ rather than `NaN`) were mathematically and structurally impossible. Both candidates are firmly dismissed.
2. **Context Scope Disproofs Upheld**: `CAND-19` was predicated on the false assumption that `catalog` only holds the active model. Call-site analysis confirmed all callers pass `SPATIAL_LIBRARY` (all 53 models), eliminating any risk of project dropping. Similarly, `CAND-22` was debunked as `WorkshopStore` explicitly clones transform tuples on every stack mutation.
3. **Intentional Architecture Trade-offs Upheld**: `CAND-14` (50MB body limit) is an explicitly documented operational requirement for high-resolution base64 camera frames in `docs/SECURITY.md:49`. `CAND-17` (`/api/jarvis`) is an uncalled legacy alias with zero live callers in production code. Both are dismissed as false positives.
4. **Severity Deflations Verified**: Candidates `CAND-02`, `CAND-08`, `CAND-12`, `CAND-25`, `CAND-30`, `CAND-32`, `CAND-33`, `CAND-37`, `CAND-41`, `CAND-42`, `CAND-45`, `CAND-47`, and `CAND-51` had their severities adjusted downward to reflect exact runtime blast radiuses under Express error handling, React boundaries, and singleton lifecycles.

---

## 2. Confirmed Real Bugs Ranked by Severity

---

### CRITICAL SEVERITY (5 Defects — Immediate System-Wide Crash or Total Out-of-the-Box Failure)

#### CAND-06: Butler Core / Hallucinated Gemini Model Identifiers
- **Target**: `ButlerEngine.js:857-860, 876` and `.env.example:5`
- **Root Cause**: `ButlerEngine.js` hardcodes fallback model strings `let aiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";` and fallback `"gemini-3.5-flash-lite"`. Neither model exists in Google's Gemini API catalog.
- **Blast Radius**: 100% failure rate for all conversational AI requests out-of-the-box when `GEMINI_MODEL` is not manually overridden in `.env`. Primary and secondary API calls both fail with HTTP 404 Model Not Found.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Critical)**.
- **Surgical Minimal Fix**:
  ```javascript
  // ButlerEngine.js:857
  let aiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = aiModel === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";
  ```
  Update `.env.example` line 5 to specify `GEMINI_MODEL=gemini-2.5-flash`.

---

#### CAND-07: Butler Core / Gemini Role Alternation Violation on Leading Model Turn
- **Target**: `ButlerEngine.js:754-770`, `api/advis.js:59-73`, `src/App.tsx:932, 1208`
- **Root Cause**: `src/App.tsx` initializes chat with an assistant welcome message (`role: 'assistant'`). When `api/advis.js` and `ButlerEngine.js` construct the Google GenAI `contents` payload, `contents[0]` is mapped to `role: 'model'`. The Gemini API strictly rejects conversations starting with a `model` turn (`400 Invalid Argument: First content must be from user`).
- **Blast Radius**: Every conversational session on Vercel/serverless fails on the user's very first query with HTTP 400 Bad Request.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Critical)**.
- **Surgical Minimal Fix**:
  In `cleanRecentConversation` (`api/advis.js:59`) and `ButlerEngine.js:754`:
  ```javascript
  // Drop leading model turns and trim trailing user turns before sending to Gemini API
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }
  if (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }
  ```

---

#### CAND-03: Spatial 3D / Division by Zero on Initial/Throttled Camera Delta
- **Target**: `src/GestureContext.tsx:270, 377-379, 414-415`
- **Root Cause**: `const dt = Math.min(delta, 0.033);`. In Three.js/R3F, `delta` is `0` on the initial frame and when the browser tab resumes from background throttling. When `dt === 0`, velocity calculation `velX = dx / dt` results in `NaN` or `Infinity`. This propagates into `rawSpeed`, `orbitSpeedMult`, `spatialCam.targetTheta += NaN`, and `cameraTarget.set(NaN, NaN, NaN)`.
- **Blast Radius**: Three.js projection and view matrices evaluate to `NaN`, permanently turning the WebGL canvas into an unrecoverable black screen until hard page reload.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Critical)**.
- **Surgical Minimal Fix**:
  ```typescript
  // src/GestureContext.tsx:270
  const dt = Math.max(0.001, Math.min(delta, 0.033));
  ```

---

#### CAND-18: Persistence / Single Try-Catch Wiping Data Files on Corrupted JSON Read
- **Target**: `server.js:42-67`
- **Root Cause**: Loading of `histories.json`, `memories.json`, `advis_memories.json`, and `advis_projects.json` is bundled inside a single `try/catch` block. If `histories.json` contains corrupted or partial JSON, the catch block aborts the remaining reads, leaving `advisMemories = []` and `advisProjects = []`. Subsequent `saveData()` calls immediately overwrite `advis_memories.json` and `advis_projects.json` with empty arrays `[]`.
- **Blast Radius**: Total irreversible loss of all user memories and custom spatial workshop projects upon a single transient read error in chat history.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Critical)**.
- **Surgical Minimal Fix**:
  Wrap each file read in an independent `try/catch` block so a failure in `histories.json` never prevents loading `advisMemories` or `advisProjects`. Never overwrite files on disk if their in-memory state failed to load.

---

#### CAND-35: Kinematics & Audio / Audio Autoplay 180 Listeners/sec Leak
- **Target**: `src/scientific/V12EngineAudioEngine.ts:201-224` & `src/scientific/V8EngineAudioEngine.ts:202-225`
- **Root Cause**: When the browser's autoplay policy suspends `AudioContext`, `ctx.resume()` rejects. In the `.catch()` block inside `update()` (called at 60 Hz in `useFrame`), a new closure is created and 3 event listeners (`pointerdown`, `keydown`, `touchstart`) are attached to `window` every frame without checking if unlock listeners are already bound.
- **Blast Radius**: 180 event listeners attach to `window` per second (1,800 in 10s). When the user clicks or presses a key, 1,800 listeners fire simultaneously, freezing the main thread and locking up the browser.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Critical)**.
- **Surgical Minimal Fix**:
  Add an instance boolean flag `private unlockAttached = false;` in both audio engines. Check `if (this.unlockAttached) return;` before attaching listeners, and set `this.unlockAttached = true;`.

---

### HIGH SEVERITY (10 Defects — Feature Breakdown, Privacy Violations, Core Rule Violations, Rapid Leaks)

#### CAND-01: Backend API / Memory Search Unhandled TypeError
- **Target**: `server.js:148-154`
- **Root Cause**: `POST /api/memory` allows `content` to be `undefined` and `tags` to be non-array. `server.js:151` executes `m.content.toLowerCase()` and `m.tags.some(t => t.toLowerCase().includes(q))`. If any memory entry has `content: undefined` or malformed tags, calling `/api/memory/search` throws `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Blast Radius**: Permanent HTTP 500 Denial of Service on `/api/memory/search` until `.data/advis_memories.json` is manually purged.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  ```javascript
  // server.js:151
  let results = advisMemories.filter(m => {
    const c = typeof m.content === 'string' ? m.content.toLowerCase() : '';
    const matchTags = Array.isArray(m.tags) && m.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
    return c.includes(q) || matchTags;
  });
  ```

---

#### CAND-04: Spatial AI Tracking / Tracking Loss Reset Violating AGENTS.md Invariant
- **Target**: `src/GestureContext.tsx:566-577`
- **Root Cause**: When hand tracking state transitions out of `'TRACKING'`, lines 574-576 execute: `state.targetScale.current = 1.0; state.targetPos.set(0, 0, 0); state.targetEnergy.current = 0;`.
- **Blast Radius**: Directly violates AGENTS.md: *"PERSISTENCE: Losing hand tracking must NEVER reset the workspace. If the user removes their hand: pause interaction, remember everything, and resume seamlessly when the hand returns."* Hologram position and scale snap back to origin whenever user moves hand out of camera frame.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Delete the reset assignments for `targetScale` and `targetPos`. Only reset active interaction energy:
  ```typescript
  // src/GestureContext.tsx:574
  state.targetEnergy.current = 0;
  // Preserve state.targetScale and state.targetPos across tracking loss
  ```

---

#### CAND-26: 3D Graphics / Inline EdgesGeometry Leak on Every Render Cycle
- **Target**: `src/cad/CadAssetRenderer.tsx:134-138`
- **Root Cause**: `<lineSegments geometry={new THREE.EdgesGeometry(geometry, 18)}>` instantiates a new `THREE.EdgesGeometry` inside the JSX render tree on every React render pass when `blueprintEnabled` is active.
- **Blast Radius**: Unreferenced edge geometries are never disposed, CPU recalculates edge adjacency on every render, and GPU vertex buffer allocations accumulate rapidly, causing frame drops and WebGL out-of-memory context crashes.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Memoize `EdgesGeometry` using `useMemo` and dispose old instances via a `useEffect` cleanup hook.

---

#### CAND-30: 3D Graphics / NaN Propagation in Engine Kinematics Transforms
- **Target**: `src/SpatialObjectEngine.tsx:2210-2217`
- **Root Cause**: `omega = (currentRpm / 60) * Math.PI * 2`. If `currentRpm` is undefined or `NaN`, `omega` becomes `NaN`. In JS, `NaN !== 0` evaluates to `true`, executing `sysTimeRef.current = rad / NaN = NaN`.
- **Blast Radius**: `sysTimeRef.current` drives crankshaft, camshaft, and piston kinematics in `MechanicalGenerator.tsx`. `NaN` propagates into Three.js local matrices, causing all engine moving parts to disappear from the viewport.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  ```typescript
  // src/SpatialObjectEngine.tsx:2210
  const safeRpm = Number.isFinite(currentRpm) ? currentRpm : 0;
  const omega = (safeRpm / 60) * Math.PI * 2;
  if (Number.isFinite(omega) && omega !== 0) { ... }
  ```

---

#### CAND-34: 3D Graphics / Variable Telemetry in Geometry Args Causing 1,440 Buffer Allocations/sec
- **Target**: `src/generators/V12VisualOverlays.tsx:78, 112`
- **Root Cause**: `<sphereGeometry args={[0.18 * flameIntensity, 16, 16]} />` and `<cylinderGeometry args={[..., arrowLength, 8]} />` receive dynamic telemetry variables in their constructor `args`. In React Three Fiber, mutating `args` destroys the Three.js geometry and constructs a new buffer geometry every frame.
- **Blast Radius**: For 12 cylinders at 60 FPS, this forces up to 1,440 WebGL buffer allocations and GPU re-uploads per second, generating extreme garbage collection churn and visual frame stutter.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Pass static unit dimensions in `args={[1, 1, 1]}` and apply dynamic scaling via mesh transform: `<mesh scale={[0.18 * flameIntensity, 0.18 * flameIntensity, 0.18 * flameIntensity]}>`.

---

#### CAND-38: Spatial AI / Unclosed Microphone MediaStream Tracks
- **Target**: `src/App.tsx:804-886`
- **Root Cause**: When voice listening is activated, `navigator.mediaDevices.getUserMedia({ audio: true })` captures the audio `stream`. The cleanup effect cancels animation frames and closes `AudioContext`, but never retains or invokes `stream.getTracks().forEach(t => t.stop())`.
- **Blast Radius**: Security/privacy violation: hardware microphone remains active indefinitely after voice mode is dismissed; browser tab displays a permanent recording indicator (red dot), draining battery and CPU.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Store `stream` in a ref (`micStreamRef.current = stream;`) and call `micStreamRef.current?.getTracks().forEach(track => track.stop());` on unmount or mode exit.

---

#### CAND-43: CAD / OpenCASCADE WebAssembly Heap Memory Leak
- **Target**: `src/cad/CadKernelService.ts:72-107`
- **Root Cause**: `const shape = format === 'BREP' ? kernel.fromBREP(textData) : kernel.importStep(textData);`. The OpenCASCADE WASM binding allocates `shape` on the WebAssembly linear heap. The caller owns the handle and must explicitly release it. `CadKernelService.ts` extracts meshes and metrics, but never invokes `kernel.release(shape)`.
- **Blast Radius**: Each CAD import or re-tessellation permanently pins tens of megabytes in the WASM heap, leading to browser tab crash (OOM) after inspecting 3-5 CAD models.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  ```typescript
  // src/cad/CadKernelService.ts:72
  let shape: any = null;
  try {
    shape = format === 'BREP' ? kernel.fromBREP(textData) : kernel.importStep(textData);
    // ... compute mesh & metrics ...
  } finally {
    if (shape && typeof kernel.release === 'function') {
      kernel.release(shape);
    }
  }
  ```

---

#### CAND-48: Learning Engine / Two-Letter Chemical Element Case Bug
- **Target**: `src/LearnEngine/ValenceValidator.ts:73-74`
- **Root Cause**: `ELEMENT_VALENCE_DATA` keys are title-cased (`'Cl'`, `'Br'`, `'Si'`, `'Na'`, `'Ca'`, `'Mg'`, `'K'`). Line 73 executes `const el = atom.element.toUpperCase();`. `ELEMENT_VALENCE_DATA['CL']` evaluates to `undefined`, silently falling back to Carbon (`valence: 4, electronegativity: 2.0`).
- **Blast Radius**: All multi-letter elements (halogens, alkali metals, silicon, calcium) are calculated as tetravalent Carbon. Sodium chloride, silane, calcium oxide, and phosphorus pentachloride produce invalid octet validations and incorrect chemistry feedback.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  ```typescript
  // src/LearnEngine/ValenceValidator.ts:73
  const raw = atom.element.trim();
  const el = raw.length > 1 ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : raw.toUpperCase();
  ```

---

#### CAND-52: Learning / Lesson Step Advance Bypassing Spatial Selection
- **Target**: `src/learning/LessonRunner.tsx:107-118`
- **Root Cause**: When a student answers a question correctly, `saveAnswer` immediately appends `step.id` to `completedStepIds`. At line 69, `stepCompleted` becomes `true`. Line 71 defines `canAdvance = Boolean(step && (stepCompleted || selectionRequirementMet ...))`. Because `stepCompleted` is true, the user can advance immediately without performing the required 3D component inspection/selection.
- **Blast Radius**: Core educational logic failure: students bypass 3D spatial interaction checkpoints, defeating the educational mandate of the spatial OS.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Ensure advancing requires both question completion AND spatial requirement satisfaction:
  ```typescript
  // src/learning/LessonRunner.tsx:71
  const spatialMet = step.completionRule.type !== 'SELECT_COMPONENT' || selectedComponentId === step.completionRule.componentId;
  const canAdvance = Boolean(step && stepCompleted && spatialMet);
  ```

---

#### CAND-54: Spatial HUD / Missing Event StopPropagation Bubbling into R3F
- **Target**: `src/App.tsx:1959` & `src/ScientificHUD.tsx:267, 370, 524, 566` & `src/Sidebar.tsx:21`
- **Root Cause**: `App.tsx:1959` configures `<Canvas eventSource={containerRef}>`. R3F captures pointer events on the root container. `ScientificHUD` panels (`z-40 pointer-events-auto`) and `Sidebar` (`z-10 pointer-events-auto`) handle clicks but do not call `e.stopPropagation()`.
- **Blast Radius**: Clicking or dragging buttons and sliders in the HUD or sidebar bubbles to R3F, triggering unintended 3D model selection and camera rotation behind HUD panels. Violates AGENTS.md ("The user should never fight the interface").
- **Arbitration Verdict**: **CONFIRMED REAL BUG (High)**.
- **Surgical Minimal Fix**:
  Add `onPointerDown={(e) => e.stopPropagation()}` on HUD root containers and sidebar container.

---

### MEDIUM SEVERITY (21 Defects — Secondary Flow Failures, Handled Errors, Partial Resource Leaks)

#### CAND-02: Backend API / Project Matching Crash
- **Target**: `server.js:160-175, 356-358`
- **Root Cause**: `POST /api/projects` permits `name` to be undefined. `handleMemoryAgent` (line 357) executes `p.name.toLowerCase()`, throwing `TypeError`. Caught by ButlerEngine try/catch, returning error status.
- **Blast Radius**: Project switching via voice/chat fails with generic error reply.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Guard line 357 with `typeof p.name === 'string' && p.name.toLowerCase().includes(targetName)`.

---

#### CAND-09: Backend Security / Missing CORS in server.js
- **Target**: `server.js:1-926`, `docs/SECURITY.md:37-43`
- **Root Cause**: `docs/SECURITY.md:37` claims origin restriction is enforced via `ADVIS_ALLOWED_ORIGINS`. In reality, `server.js` contains zero CORS middleware or headers (unlike `api/advis.js`).
- **Blast Radius**: Cross-origin requests from Vite dev server (`localhost:5173`) or GitHub Pages to `server.js` fail with preflight CORS rejection.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Add CORS middleware at top of `server.js` matching `api/advis.js`.

---

#### CAND-10: Backend Security / Prompt Injection via Butler Context
- **Target**: `server.js:855-865`, `ButlerEngine.js:364`
- **Root Cause**: `server.js` forwards un-sanitized client `butlerContext` directly to `processButlerTurn`, which interpolates fields into the Gemini system instruction without character stripping.
- **Blast Radius**: Malicious client payloads can manipulate system prompt instructions on `server.js`.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Apply `cleanContext(rawContext)` in `server.js` before calling `processButlerTurn`.

---

#### CAND-11: Backend API / Image-Only Request Rejection
- **Target**: `server.js:849`, `api/advis.js:458-464`
- **Root Cause**: `server.js:849` unconditionally rejects requests with empty message (`400 Protocol violation`). `api/advis.js` correctly synthesizes a default observation prompt if an image is attached.
- **Blast Radius**: Image-only queries work on Vercel but fail on `server.js`.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: If message is empty but image is present, set `message = "Describe what can be directly observed in this image."`.

---

#### CAND-13: Backend / Ignored PORT Environment Variable
- **Target**: `server.js:12, 918`
- **Root Cause**: Hardcoded `const PORT = 3000;`. Ignores `process.env.PORT`.
- **Blast Radius**: Server fails to bind and is terminated in container environments (Cloud Run, Railway, Render) that dynamically allocate `$PORT`.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: `const PORT = parseInt(process.env.PORT, 10) || 3000;`.

---

#### CAND-20: Persistence / Shallow Merge Overwriting Immutable Fields
- **Target**: `server.js:133-140, 177-184`
- **Root Cause**: `PUT /api/memory/:id` and `PUT /api/projects/:id` execute `{ ...existing, ...req.body, updatedAt: Date.now() }`.
- **Blast Radius**: Clients can overwrite immutable `id` or `createdAt`, corrupting primary keys.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Explicitly preserve `id: existing.id` and `createdAt: existing.createdAt`.

---

#### CAND-21: Persistence / Weak ID Generation Collision
- **Target**: `server.js:116, 163`
- **Root Cause**: IDs are generated with `Date.now() + "_" + Math.floor(Math.random()*1000)`. `uuidv4` was defined at line 102 but bypassed.
- **Blast Radius**: Concurrent requests within the same millisecond have high collision probability.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Use `crypto.randomUUID()`.

---

#### CAND-25: 3D Graphics / CadMesh BufferGeometry Leak Across Model Switches
- **Target**: `src/cad/CadModelCanvas.tsx:16-31`
- **Root Cause**: `useMemo` in `CadMesh` allocates `new THREE.BufferGeometry()` on model change without calling `geometry.dispose()` on previous geometry or unmount.
- **Blast Radius**: WebGL GPU buffer memory leaks across CAD model switches.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Add `useEffect(() => () => geometry?.dispose(), [geometry]);`.

---

#### CAND-27: 3D Graphics / RealisticGLTFModel Cloned Materials Leak
- **Target**: `src/SpatialObjectEngine.tsx:94-112`
- **Root Cause**: Clones materials on GLTF load (`child.material.clone()`) without disposing materials or textures on unmount or model change.
- **Blast Radius**: WebGL shader programs and textures accumulate in renderer.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Traverse scene and dispose cloned materials and textures in unmount cleanup effect.

---

#### CAND-28: 3D Graphics / Object.entries & Vector3 GC Churn in 60 FPS Loop
- **Target**: `src/SpatialObjectEngine.tsx:2189-2198`
- **Root Cause**: Inside `useFrame`, `Object.entries(componentRefs.current)` allocates an array of tuples and `new THREE.Vector3()` on every frame for 12 components.
- **Blast Radius**: 1,200+ allocations/sec trigger frequent GC pauses and frame-time spikes.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Use `for...in` loop and reuse a static/ref `targetVec` Vector3.

---

#### CAND-29: 3D Graphics / Raycaster Vector Churn & 60 FPS Console Logging
- **Target**: `src/SpatialObjectEngine.tsx:2563-2568` & `src/GestureContext.tsx:326-335`
- **Root Cause**: Raycasting allocates vectors every frame, and `GestureContext` executes `console.log('[GESTURE OWNERSHIP DEBUG]')` at 60 FPS whenever a hand is active.
- **Blast Radius**: Browser DevTools serialization causes main-thread CPU spikes and thermal throttling.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Reuse module-level scratch vectors and remove or throttle debug `console.log`.

---

#### CAND-33: 3D Graphics / Missing WebGL Context Loss Handler
- **Target**: `src/App.tsx:1954-1961` & `src/cad/CadModelCanvas.tsx:63-67`
- **Root Cause**: Neither `<Canvas>` registers `webglcontextlost` or calls `e.preventDefault()`.
- **Blast Radius**: Per WebGL spec, if `preventDefault()` is not called, the browser will not attempt to restore the context. Canvas remains permanently blank after GPU sleep/wake.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Add `onContextLost={(e) => { e.preventDefault(); }}` on Canvas elements.

---

#### CAND-37: Spatial AI / TypeError on Truncated Landmarks
- **Target**: `src/useHandTracking.ts:250, 269, 278, 304-308`
- **Root Cause**: Checks `hands.length > 0`, but does not verify `h.landmarks.length >= 21`. If a custom adapter or occlusion glitch delivers a truncated array, `lm[8].x` throws `TypeError`.
- **Blast Radius**: Unhandled React runtime error crashing hand tracking.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Filter hands with `state.hands.filter(h => h?.landmarks && h.landmarks.length >= 21)`.

---

#### CAND-39: Spatial AI / Discarded MediaPipe Confidence Gating
- **Target**: `src/useHandTracking.ts:257`
- **Root Cause**: Discards classification score from `MediaPipeAdapter` and hardcodes `let confidence = 0.99;`.
- **Blast Radius**: Low-confidence hand detections during occlusion or motion blur fire false positive clicks and erratic pinches. Violates AGENTS.md confidence gating rule.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Read `h.score ?? 0.8` and gate interaction if confidence < 0.65.

---

#### CAND-40: Kinematics / Web Audio TypeError on Non-Finite Frequency
- **Target**: `src/scientific/V12EngineAudioEngine.ts:286-304` & `src/scientific/V8EngineAudioEngine.ts:287-305`
- **Root Cause**: If `rpm` is non-finite, `f0 = Math.max(1, (rpm/60) * speed)` yields `NaN`. Passing `NaN` to `AudioParam.setTargetAtTime` throws `TypeError: The provided float value is non-finite`.
- **Blast Radius**: Unhandled TypeError terminating audio synthesis loop.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Sanitize `safeRpm = Number.isFinite(rpm) ? Math.max(0, rpm) : 0;`.

---

#### CAND-44: CAD / Unhandled Rejected WASM Initialization Promise
- **Target**: `src/cad/CadKernelService.ts:22-30`
- **Root Cause**: `kernelPromise = import('occt-wasm').then(...)` without a `.catch()` reset.
- **Blast Radius**: If the initial fetch or WebAssembly compile fails, `kernelPromise` caches the rejected promise indefinitely; all subsequent CAD imports fail without retry.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Add `.catch((err) => { kernelPromise = null; throw err; })`.

---

#### CAND-45: CAD / Binary BREP UTF-8 Decoding Corruption
- **Target**: `src/cad/CadKernelService.ts:69-75`
- **Root Cause**: Binary BREP files are decoded with `new TextDecoder().decode(bytes)` and passed to `kernel.fromBREP(textData)`.
- **Blast Radius**: Non-UTF8 byte sequences in binary BREP files are corrupted with `\uFFFD`, causing OpenCASCADE C++ parse panics.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Detect binary BREP headers and route to `kernel.fromBREPBinary(bytes)`.

---

#### CAND-46: CAD / Cached Rejected Model Fetch Promise
- **Target**: `src/cad/CadAssetRenderer.tsx:28-29`
- **Root Cause**: `modelCache.set(cacheKey, pending)` caches the promise before resolution without deleting on error.
- **Blast Radius**: Transient network error permanently caches rejection; CAD asset cannot be reloaded without hard refresh.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: `pending.catch(() => modelCache.delete(cacheKey));`.

---

#### CAND-49: Learning Engine / Formal Charge Algebraic Cancellation
- **Target**: `src/LearnEngine/ValenceValidator.ts:89-93`
- **Root Cause**: `nonBonding = Math.max(0, valence - totalBondOrder); formalCharge = valence - nonBonding - totalBondOrder;`.
- **Blast Radius**: For any standard atom with `valence >= totalBondOrder`, $V - (V - B) - B \equiv 0$. Formal charge is mathematically hardcoded to 0. Polyatomic ions ($NH_4^+$, $H_3O^+$) calculate formal charge of 0 instead of +1.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Account for valence electrons, free lone pairs, and bonded electrons correctly.

---

#### CAND-53: Learning / Lesson Switch Progress Lag Race Condition
- **Target**: `src/learning/LessonRunner.tsx:52-62, 77-95`
- **Root Cause**: `lesson` updates synchronously via `useMemo` from `lessonId`, while `progress` updates asynchronously in a subsequent `useEffect`.
- **Blast Radius**: For one render frame, `lesson` points to the new lesson while `progress` holds prior lesson data. If `priorProgress.currentStepIndex >= newLesson.steps.length`, `isFinished` flashes true, briefly rendering "Lesson complete!".
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Verify `progress.lessonId === lesson.id` before evaluating `isFinished` or `currentStepIndex`.

---

#### CAND-55: Spatial HUD / Modal and HUD z-index Overlap Collision
- **Target**: `src/ViewModal.tsx:878` & `src/ScientificHUD.tsx:524, 566, 706`
- **Root Cause**: When `currentView === 'demonstration'` or `'compare'`, `ViewModal` docks at bottom at `z-40`. Simultaneously, `ScientificHUD` renders its bottom controls at `z-40`.
- **Blast Radius**: Overlapping interactive controls at identical z-indices; buttons overlap and clicks are misrouted.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Medium)**.
- **Surgical Minimal Fix**: Suppress ScientificHUD bottom panels when `currentView !== 'home'`.

---

### LOW SEVERITY (11 Defects — Edge-Case Resilience, Telemetry/Catalog Warnings, Minor Polish)

#### CAND-08: Backend Security / Prototype Property Key Collision on deviceId
- **Target**: `server.js:851-853`, `ButlerEngine.js:752-754`
- **Root Cause**: Supplying `"toString"` as `deviceId` returns `Function.prototype.toString` from `chatHistories`. Calling `.map()` throws `TypeError` (handled gracefully by catch block).
- **Blast Radius**: Returns error status for requests with prototype property names as `deviceId`.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Sanitize `deviceId`: `const safeId = typeof deviceId === 'string' && !['__proto__', 'constructor', 'prototype'].includes(deviceId) ? deviceId : 'default';`.

---

#### CAND-12: Backend / Unbounded Rate Limit Map Memory Leak
- **Target**: `api/advis.js:9-10, 36-51`
- **Root Cause**: `requestWindows` map never evicts expired IP keys.
- **Blast Radius**: Minor memory growth across distinct IPs in warm serverless lambdas.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Evict expired entries when `requestWindows.size > 500`.

---

#### CAND-15: Backend / Markdown Code Fence Parsing in Structure Generator
- **Target**: `server.js:828`
- **Root Cause**: Direct `JSON.parse(response.text)` without stripping markdown fences if model wraps JSON in ````json.
- **Blast Radius**: Handled by catch block returning 500.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Strip markdown code fences before calling `JSON.parse`.

---

#### CAND-16: Backend / HTTP Status Code Inconsistency
- **Target**: `server.js:892`, `api/advis.js:519`
- **Root Cause**: `server.js` returns HTTP 200 with `{ status: "error" }`, whereas `api/advis.js` returns HTTP 502.
- **Blast Radius**: API status code contract inconsistency.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Standardize on HTTP 502 Bad Gateway for upstream engine failures.

---

#### CAND-23: Model Catalog / Missing Component ID in V12 ExplodedParts
- **Target**: `src/SpatialLibrary.ts:985` vs `src/SpatialLibrary.ts:1006-1040`
- **Root Cause**: `v12_engine.explodedParts` references `'v12.cylinder_head'` which does not exist in `components` (actual ID is `'v12.valvetrain'`).
- **Blast Radius**: Triggers validation script warning.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Replace `'v12.cylinder_head'` with `'v12.valvetrain'`.

---

#### CAND-24: Model Catalog / 50 Models Missing modelKind Warnings
- **Target**: `src/SpatialLibrary.ts:150, 951, 1087` & `scripts/validate-model-catalog.mjs:109`
- **Root Cause**: Only 3 models declare `modelKind`; remaining 50 omit it.
- **Blast Radius**: Produces 50 catalog validation warnings in build checks.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Add `modelKind: 'engineering' | 'scientific' | 'electronic'` across all catalog entries.

---

#### CAND-32: Spatial AI / Theatre Camera Conflict With User Controls & Instant Snapping
- **Target**: `src/theatre/TheatreV12Bridge.ts:28-34, 42-47` & `src/SpatialObjectEngine.tsx:2185-2187`
- **Root Cause**: When Theatre sequence ends, `theatreFactor` instantly resets from 1 to 0 without damping.
- **Blast Radius**: Visual camera pop/jump at sequence conclusion.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Smoothly interpolate `theatreFactor` towards 0.

---

#### CAND-41: Kinematics / RAF Loop Crash on Bus Subscriber Exception
- **Target**: `src/scientific/EngineKinematicsBus.ts:270-272`
- **Root Cause**: `publish` iterates `for (const listener of this.listeners) listener(this.snapshot)` without try-catch.
- **Blast Radius**: An uncaught error in any listener would halt the RAF loop.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Wrap listener execution in `try { listener(this.snapshot); } catch (e) { console.error(e); }`.

---

#### CAND-42: Kinematics / Undisposed AudioContext in Singleton Engine
- **Target**: `src/scientific/V12EngineAudioEngine.ts:182-188, 357-359`
- **Root Cause**: Singleton `V12EngineAudioEngine` ramps down gain on stop, but does not suspend `AudioContext`.
- **Blast Radius**: Keeps audio hardware thread running while stopped.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Call `this.ctx?.suspend()` on `stop()`.

---

#### CAND-47: CAD / Parametric Slider Un-debounced History Flood
- **Target**: `src/cad/ParametricInnovationLab.tsx:90-101, 249`
- **Root Cause**: Slider `onChange` pushes undo state on every mouse move during dragging.
- **Blast Radius**: Fills 50-item undo stack with micro-drag steps.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Commit undo state only on `onPointerUp`.

---

#### CAND-51: Learning Engine / Incomplete Action Switch for Declared Types
- **Target**: `src/LearnEngine/SessionMoleculeContext.tsx:288-392`
- **Root Cause**: `StructuredMolecularAction.type` declares `'ADD_BOND'`, `'REMOVE_BOND'`, `'SET_FORMAL_CHARGE'`, but `executeStructuredAction` switch statement omits them.
- **Blast Radius**: Returns "Unknown action" if dispatched.
- **Arbitration Verdict**: **CONFIRMED REAL BUG (Low)**.
- **Surgical Minimal Fix**: Add switch case stubs with appropriate success/failure responses.

---

## 3. Dismissed Candidate Adjudications (False Positives)

---

### CAND-05: Learning Progress / Storage Deserialization
- **Target**: `src/learning/LessonProgress.ts:27-46`
- **Hunter Allegation**: `saveLessonProgress` throws `TypeError: progress.completedStepIds is not iterable` if `completedStepIds` is `null`, and `currentStepIndex` lacks negative bounds checking.
- **Skeptic Counter-Analysis**: Line 40 ALREADY clamps `currentStepIndex`: `currentStepIndex: Math.max(0, Math.floor(progress.currentStepIndex))`. `loadLessonProgress` line 30 validates `Array.isArray(item.completedStepIds)`. The entire function is wrapped in `try { ... } catch { return false; }`.
- **Referee Adjudication**:
  1. `src/learning/LessonProgress.ts:40` contains the exact code:
     `currentStepIndex: Math.max(0, Math.floor(progress.currentStepIndex)),`
     This bounds-checks negative numbers to 0. Hunter's claim that negative values are un-clamped is demonstrably false.
  2. `src/learning/LessonProgress.ts:36-49` wraps the entire save in a `try...catch` block returning `false`. No unhandled exception can escape.
  3. `completedStepIds` loaded from store is verified by `!Array.isArray(item.completedStepIds) return null;` in `loadLessonProgress:30`.
- **Final Dismissal Rationale**: **Mitigated by Existing Guards & Try-Catch**.

---

### CAND-14: Backend Security / 50MB Body DoS
- **Target**: `server.js:19`, `docs/SECURITY.md:49`
- **Hunter Allegation**: `express.json({ limit: '50mb' })` creates a DoS vulnerability via memory starvation.
- **Skeptic Counter-Analysis**: Documented architectural requirement for base64 camera frame ingestion.
- **Referee Adjudication**:
  `docs/SECURITY.md:49` explicitly documents this as an intentional design decision:
  > `"/api/advis and /api/generate-structure accept JSON bodies up to 50 MB (Express json({ limit: '50mb' })). Consider reducing this limit if large payloads are not needed."`
  Base64 high-resolution camera streams require this payload limit. This is an acknowledged design choice, not an implementation bug.
- **Final Dismissal Rationale**: **Documented Architectural Choice / Not a Defect**.

---

### CAND-17: Deployment / Missing Vercel Rewrites
- **Target**: `vercel.json:1-7`, `server.js:836`
- **Hunter Allegation**: Calls to `/api/jarvis` 404 on Vercel because `vercel.json` does not rewrite to `/api/advis`.
- **Skeptic Counter-Analysis**: Zero callers invoke `/api/jarvis` in the entire codebase. Frontend exclusively uses `advisApiUrl('/api/advis')`.
- **Referee Adjudication**:
  Codebase-wide grep confirms:
  - `src/` has 0 occurrences of `/api/jarvis`.
  - Frontend exclusively invokes `/api/advis`.
  - `/api/jarvis` was a dead legacy route alias in `server.js:836`.
  No feature or user workflow is broken on Vercel.
- **Final Dismissal Rationale**: **Dead Legacy Alias / Zero Call Sites**.

---

### CAND-19: Persistence / WorkshopStore Drops Projects Across Models
- **Target**: `src/workshop/WorkshopStore.ts:167-191`, `src/workshop/InnovationWorkshop.tsx`
- **Hunter Allegation**: `readStore(catalog)` validates projects against `catalog`. When saving for one model, projects for other models are filtered out and permanently deleted from localStorage.
- **Skeptic Counter-Analysis**: Every caller in `src/workshop/InnovationWorkshop.tsx` passes `SPATIAL_LIBRARY` (the global dictionary of all 53 models) as the `catalog` parameter.
- **Referee Adjudication**:
  Grep of all call sites in `src/workshop/InnovationWorkshop.tsx`:
  - Line 80: `loadWorkshopProjects(SPATIAL_LIBRARY)`
  - Line 103: `loadWorkshopProjects(SPATIAL_LIBRARY)`
  - Line 106: `saveWorkshopProject(next, SPATIAL_LIBRARY)`
  - Line 211: `saveWorkshopProject(result.project, SPATIAL_LIBRARY)`
  - Line 228: `deleteWorkshopProject(activeProject.id, SPATIAL_LIBRARY)`
  - Line 309: `saveWorkshopProject(activeProject, SPATIAL_LIBRARY)`
  Because `SPATIAL_LIBRARY` contains all 53 models, `catalog[project.sourceModelId]` evaluates to truthy for all valid models. Projects for other models are NEVER dropped.
- **Final Dismissal Rationale**: **Factually Disproven by Call-Site Evidence**.

---

### CAND-22: Workshop / Shallow Command Stack Aliasing
- **Target**: `src/workshop/WorkshopStore.ts:102-120`
- **Hunter Allegation**: `commands.slice()` shallow-copies command objects (`before`, `after`), allowing active transform mutations to alias into past undo/redo history.
- **Skeptic Counter-Analysis**: Lines 99 and 107 explicitly deep-clone transforms before pushing to the stack.
- **Referee Adjudication**:
  Direct inspection of `src/workshop/WorkshopStore.ts`:
  - Line 99: `const before = cloneTransform(current);`
  - Line 107: `after: cloneTransform(after),`
  - Line 115: `componentTransforms: { ...project.componentTransforms, [componentId]: cloneTransform(after) },`
  - Line 129: `componentTransforms: { ...project.componentTransforms, [command.componentId]: cloneTransform(command.before) },`
  All transform tuples are deep-cloned via `cloneTransform()` on every push and transition. State updates are purely functional and immutable.
- **Final Dismissal Rationale**: **Mitigated by Explicit Deep Clones**.

---

### CAND-31: 3D Graphics / Division by Zero in V8 Precision Pulley
- **Target**: `src/generators/V8Precision.tsx:760-762`
- **Hunter Allegation**: `speedRatio = 0.245 / radius` produces `Infinity` if `radius <= 0`.
- **Skeptic Counter-Analysis**: `RotatingPulley` is an unexported private helper called only 4 times with hardcoded positive constants.
- **Referee Adjudication**:
  Inspection of `src/generators/V8Precision.tsx:826-829`:
  - Line 826: `<RotatingPulley ... radius={0.145} />`
  - Line 827: `<RotatingPulley ... radius={0.185} />`
  - Line 828: `<RotatingPulley ... radius={0.245} />`
  - Line 829: `<RotatingPulley ... radius={0.082} />`
  The component is never invoked with any dynamic, variable, or zero argument. Division by zero is mathematically and structurally impossible.
- **Final Dismissal Rationale**: **Mathematically Unreachable / Static Constant Invariant**.

---

### CAND-36: Kinematics / Mathematical Singularity in Four-Stroke Slider-Crank
- **Target**: `src/scientific/FourStrokeEngineModel.ts:983`
- **Hunter Allegation**: `conrodAngle1 = Math.asin((r / L) * sinTheta1)` yields `NaN` when `(r / L) * sinTheta1` exceeds 1.0, throwing an uncaught exception and halting the simulation permanently.
- **Skeptic Counter-Analysis**: Mathematical constants $r=0.44$, $L=1.45$ bound the argument strictly within $[-0.3035, +0.3035]$, far below 1.0.
- **Referee Adjudication**:
  Mathematical proof from source constants (`FourStrokeEngineModel.ts:975-976`):
  $$r = 0.44,\quad L = 1.45 \implies \frac{r}{L} = \frac{0.44}{1.45} \approx 0.303448$$
  $$\forall \theta \in \mathbb{R},\quad |\sin(\theta)| \le 1.0$$
  $$\implies \left| \frac{r}{L} \sin(\theta) \right| \le 0.30345 < 0.3035$$
  The domain of $\arcsin(x)$ is $[-1.0, +1.0]$. The maximum possible argument is $\approx 0.3035$, which is orders of magnitude away from the boundary of 1.0. Singularity is impossible.
- **Final Dismissal Rationale**: **Mathematically Impossible / Bounded Range Proof**.

---

### CAND-50: Learning Engine / Molecular Vector Normalize on Zero Cross-Product
- **Target**: `src/LearnEngine/MolecularEngine.ts:196-201, 212-214`
- **Hunter Allegation**: Calling `.normalize()` on a zero cross-product vector yields `Vector3(NaN, NaN, NaN)`, blanking the 3D canvas.
- **Skeptic Counter-Analysis**: Three.js implements `normalize` as `divideScalar(length || 1)`. On zero length, `0 || 1 === 1`, returning `Vector3(0, 0, 0)`, never `NaN`.
- **Referee Adjudication**:
  Three.js `Vector3.prototype.normalize` source code:
  ```javascript
  normalize: function () {
    return this.divideScalar( this.length() || 1 );
  }
  ```
  Verified via Node.js execution:
  `new THREE.Vector3(0, 0, 0).normalize()` outputs `Vector3 { x: 0, y: 0, z: 0 }`.
  `NaN` is never produced, and projection matrix corruption does not occur.
- **Final Dismissal Rationale**: **Factually Disproven by Three.js Source Guarantee**.

---

## 4. Surgical Remediation Action Matrix

Prioritized by execution tier for Phase 4 (Fix & Verify):

### Tier 1: Critical Emergency Patches (5 Fixes)

| ID | File | Line(s) | Defect | Surgical Ponytail Fix | Verification Command |
|---|---|---|---|---|---|
| **CAND-06** | `ButlerEngine.js`, `.env.example` | `857-860, 876` | Hallucinated Gemini models | Change defaults to `"gemini-2.5-flash"` and fallback to `"gemini-2.0-flash"` | `node -e "require('./ButlerEngine')"` |
| **CAND-07** | `ButlerEngine.js`, `api/advis.js` | `754-770`, `59-73` | Leading model turn 400 | In `cleanRecentConversation`, drop leading model turns and trim trailing user turn | `node -e "const {processButlerTurn}=require('./ButlerEngine');"` |
| **CAND-03** | `src/GestureContext.tsx` | `270` | `dt = 0` NaN camera blackout | Clamp `dt`: `Math.max(0.001, Math.min(delta, 0.033))` | `npm run build` |
| **CAND-18** | `server.js` | `42-67` | Corrupted JSON wipeout | Wrap each file load in isolated try-catch; preserve memory arrays on read failure | `node -c server.js` |
| **CAND-35** | `src/scientific/V12EngineAudioEngine.ts`, `V8EngineAudioEngine.ts` | `201-224`, `202-225` | 180 listeners/sec leak | Add `unlockAttached` boolean guard before registering window listeners | `npm run build` |

---

### Tier 2: High Reliability & Stability Patches (10 Fixes)

| ID | File | Line(s) | Defect | Surgical Ponytail Fix | Verification Command |
|---|---|---|---|---|---|
| **CAND-01** | `server.js` | `151` | Memory search TypeError | Safe-check `typeof m.content === 'string'` and `Array.isArray(m.tags)` | `node -c server.js` |
| **CAND-04** | `src/GestureContext.tsx` | `574-576` | Tracking loss resets workspace | Remove reset assignments for `targetScale` and `targetPos` | `npm run build` |
| **CAND-26** | `src/cad/CadAssetRenderer.tsx` | `134-138` | Inline EdgesGeometry leak | Memoize `EdgesGeometry` with `useMemo` and dispose old instance | `npm run build` |
| **CAND-30** | `src/SpatialObjectEngine.tsx` | `2210-2217` | NaN in engine kinematics | Guard `Number.isFinite(currentRpm)` and `Number.isFinite(omega)` | `npm run build` |
| **CAND-34** | `src/generators/V12VisualOverlays.tsx` | `78, 112` | Telemetry in geometry args | Use static unit geometry `args={[1, 1, 1]}` and modulate via mesh `scale` | `npm run build` |
| **CAND-38** | `src/App.tsx` | `804-886` | Unclosed microphone tracks | Store `stream` in ref and call `track.stop()` on unmount/mode exit | `npm run build` |
| **CAND-43** | `src/cad/CadKernelService.ts` | `72-107` | OpenCASCADE WASM leak | Release shape in `finally` block via `kernel.release(shape)` | `npm run build` |
| **CAND-48** | `src/LearnEngine/ValenceValidator.ts` | `73-74` | Two-letter element casing | Title-case multi-letter element symbol before map lookup | `npm run build` |
| **CAND-52** | `src/learning/LessonRunner.tsx` | `71, 107-118` | Lesson advance skips 3D | Require spatial rule satisfaction: `stepCompleted && spatialMet` | `npm run build` |
| **CAND-54** | `src/App.tsx`, `ScientificHUD.tsx`, `Sidebar.tsx` | Various | Pointer bubbling into R3F | Add `onPointerDown={(e) => e.stopPropagation()}` on HUD/Sidebar containers | `npm run build` |

---

### Tier 3: Medium Functional & Resource Leaks (21 Fixes)

| ID | File | Line(s) | Defect | Surgical Ponytail Fix | Verification Command |
|---|---|---|---|---|---|
| **CAND-02** | `server.js` | `357` | Project matching name crash | Guard `typeof p.name === 'string' && p.name.toLowerCase().includes(...)` | `node -c server.js` |
| **CAND-09** | `server.js` | `1-30` | Missing CORS in server.js | Add CORS origin restriction middleware matching `api/advis.js` | `node -c server.js` |
| **CAND-10** | `server.js` | `855` | Prompt injection via context | Sanitize incoming context using `cleanContext` | `node -c server.js` |
| **CAND-11** | `server.js` | `849` | Image-only request 400 | Synthesize observation prompt if image is present and message is empty | `node -c server.js` |
| **CAND-13** | `server.js` | `12` | Hardcoded PORT=3000 | `const PORT = parseInt(process.env.PORT, 10) || 3000;` | `node -c server.js` |
| **CAND-20** | `server.js` | `136, 180` | Overwriting immutable fields | Preserve immutable `id: existing.id` and `createdAt: existing.createdAt` | `node -c server.js` |
| **CAND-21** | `server.js` | `116, 163` | Weak random ID collision | Use `crypto.randomUUID()` | `node -c server.js` |
| **CAND-25** | `src/cad/CadModelCanvas.tsx` | `16-31` | CadMesh geometry leak | Add cleanup disposal effect for `geometry` | `npm run build` |
| **CAND-27** | `src/SpatialObjectEngine.tsx` | `94-112` | GLTF cloned material leak | Dispose materials/textures in unmount traversal | `npm run build` |
| **CAND-28** | `src/SpatialObjectEngine.tsx` | `2189-2198` | 60 FPS GC churn | Use `for...in` and module-level scratch Vector3 | `npm run build` |
| **CAND-29** | `src/GestureContext.tsx` | `326-335` | 60 FPS console.log | Remove continuous debug `console.log('[GESTURE OWNERSHIP DEBUG]')` | `npm run build` |
| **CAND-33** | `src/App.tsx`, `CadModelCanvas.tsx` | Canvas roots | Missing webglcontextlost | Attach `onContextLost={(e) => e.preventDefault()}` | `npm run build` |
| **CAND-37** | `src/useHandTracking.ts` | `250, 278` | Truncated landmarks crash | Filter hands by `h.landmarks && h.landmarks.length >= 21` | `npm run build` |
| **CAND-39** | `src/useHandTracking.ts` | `257` | Discarded confidence score | Use classification score and gate at confidence >= 0.65 | `npm run build` |
| **CAND-40** | `src/scientific/V12EngineAudioEngine.ts` | `286` | Web Audio NaN frequency | Sanitize `safeRpm` with `Number.isFinite` | `npm run build` |
| **CAND-44** | `src/cad/CadKernelService.ts` | `22-30` | Cached rejected WASM promise | Reset `kernelPromise = null` on `.catch()` | `npm run build` |
| **CAND-45** | `src/cad/CadKernelService.ts` | `69-75` | Binary BREP UTF-8 corruption | Check binary magic bytes and call `kernel.fromBREPBinary` | `npm run build` |
| **CAND-46** | `src/cad/CadAssetRenderer.tsx` | `28-29` | Cached rejected fetch promise | Evict rejected promise from `modelCache` on error | `npm run build` |
| **CAND-49** | `src/LearnEngine/ValenceValidator.ts` | `89-93` | Formal charge cancellation | Calculate non-bonding electrons and formal charge accurately | `npm run build` |
| **CAND-53** | `src/learning/LessonRunner.tsx` | `52-62` | Progress race condition | Guard evaluation with `progress.lessonId === lesson.id` | `npm run build` |
| **CAND-55** | `src/ScientificHUD.tsx` | `524, 566` | Modal HUD z-40 collision | Suppress bottom HUD panels when `currentView !== 'home'` | `npm run build` |

---

### Tier 4: Low Polish & Hygiene Improvements (11 Fixes)

| ID | File | Line(s) | Defect | Surgical Ponytail Fix | Verification Command |
|---|---|---|---|---|---|
| **CAND-08** | `server.js` | `851` | Prototype key collision | Sanitize `deviceId` to exclude prototype property names | `node -c server.js` |
| **CAND-12** | `api/advis.js` | `36-51` | Unbounded rate limit map | Evict oldest keys when `requestWindows.size > 500` | `node -c api/advis.js` |
| **CAND-15** | `server.js` | `828` | Markdown code fence parse | Strip ````json code fences before `JSON.parse` | `node -c server.js` |
| **CAND-16** | `server.js` | `892` | 200 vs 502 status code | Return HTTP 502 Bad Gateway on engine failure | `node -c server.js` |
| **CAND-23** | `src/SpatialLibrary.ts` | `985` | Missing exploded part ID | Change `'v12.cylinder_head'` to `'v12.valvetrain'` | `node scripts/validate-model-catalog.mjs` |
| **CAND-24** | `src/SpatialLibrary.ts` | Various | 50 models missing modelKind | Add `modelKind` to 50 models | `node scripts/validate-model-catalog.mjs` |
| **CAND-32** | `src/theatre/TheatreV12Bridge.ts` | `42` | Theatre camera instant snap | Lerp `theatreFactor` towards 0 smoothly | `npm run build` |
| **CAND-41** | `src/scientific/EngineKinematicsBus.ts` | `270` | Bus subscriber exception | Wrap listener in `try...catch` | `npm run build` |
| **CAND-42** | `src/scientific/V12EngineAudioEngine.ts` | `357` | Singleton AudioContext running | Call `this.ctx?.suspend()` on `stop()` | `npm run build` |
| **CAND-47** | `src/cad/ParametricInnovationLab.tsx` | `249` | Slider undo history flood | Commit undo history on `onPointerUp` | `npm run build` |
| **CAND-51** | `src/LearnEngine/SessionMoleculeContext.tsx` | `390` | Missing switch action cases | Add cases for `'ADD_BOND'`, `'REMOVE_BOND'`, `'SET_FORMAL_CHARGE'` | `npm run build` |

---

## 5. Conclusion & Authorization for Phase 4

The arbitration is complete and definitive:
- **47 Real Bugs Confirmed** (5 Critical, 10 High, 21 Medium, 11 Low).
- **8 Candidates Firmly Dismissed** as false positives with mathematical and structural proof.
- Phase 4 (Fix & Verify) is hereby authorized to proceed systematically using the Surgical Remediation Action Matrix above, starting with Tier 1 Emergency Patches.

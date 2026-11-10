# Hunter 5 Audit Report: CAD Lab, Innovation Workshop, Learning Engine & HUD Integration

Operating under `/precontext`, `/gravitas`, and `/ponytail`. Grounded in verified file:line evidence across `src/cad/*`, `src/workshop/*`, `src/learning/*`, `src/LearnEngine/*`, and spatial HUD layers.

---

### BUG-ID: D5-01
- **Severity**: Critical
- **Location**: `src/cad/CadKernelService.ts:72-107`
- **Evidence & Root Cause**:
  `const shape = format === 'BREP' ? kernel.fromBREP(textData) : kernel.importStep(textData);`
  `shape` is an OpenCASCADE C++ handle allocated in the WebAssembly linear heap. `kernel.release(shape)` is never called on success or in a `finally` block on error.
- **Impact**: OpenCASCADE WASM heap memory exhaustion and browser tab OOM crash after importing CAD models or repeatedly re-tessellating.
- **Minimal Fix**:
  ```ts
  try { /* tessellate, bbox, volume, surfaceArea */ }
  finally { if (shape) kernel.release(shape); }
  ```

---

### BUG-ID: D5-02
- **Severity**: Medium
- **Location**: `src/cad/CadKernelService.ts:22-30`
- **Evidence & Root Cause**:
  If `OcctKernel.init()` rejects (e.g. WASM binary fetch timeout, CSP restriction, or memory failure), `kernelPromise` caches the rejected promise indefinitely.
- **Impact**: All subsequent CAD imports fail permanently without ever attempting re-initialization.
- **Minimal Fix**:
  Reset `kernelPromise = null` on `.catch()`.

---

### BUG-ID: D5-03
- **Severity**: Critical
- **Location**: `src/cad/CadKernelService.ts:69-75`
- **Evidence & Root Cause**:
  Binary `.brep` or `.brp` files are decoded via UTF-8 `TextDecoder`, replacing invalid sequences with `\uFFFD` and corrupting binary data. Furthermore, neither `fromBREP` nor `importStep` is wrapped in exception handling, allowing OpenCASCADE C++ exceptions on corrupted inputs to crash the caller.
- **Impact**: Importing binary BREP or malformed STEP files triggers unhandled C++ runtime panics.
- **Minimal Fix**:
  Distinguish binary vs text BREP and wrap in try/catch.

---

### BUG-ID: D5-04
- **Severity**: Medium
- **Location**: `src/cad/CadAssetRenderer.tsx:28-29`
- **Evidence & Root Cause**:
  If `pending` fetch rejects (transient network failure, 503, or invalid CAD file), the rejection remains permanently cached in module-level `modelCache`.
- **Impact**: User cannot retry loading a CAD asset after a transient failure without a hard page reload.
- **Minimal Fix**:
  `pending.catch(() => { modelCache.delete(cacheKey); });`

---

### BUG-ID: D5-05
- **Severity**: Medium
- **Location**: `src/cad/ParametricInnovationLab.tsx:90-101, 249`
- **Evidence & Root Cause**:
  Continuous slider dragging fires `onChange` on every mouse/touch move, pushing 40-50 undo states per second to `history` and forcing synchronous 3D planetary gear mesh regenerations (`PlanetaryPreview`).
- **Impact**: UI jank/freezes during slider scrubbing; undo history filled with single-pixel drag micro-steps requiring 50 undo clicks to revert one drag.
- **Minimal Fix**:
  Update state on `onChange`, commit to undo history only on `onPointerUp` / `onBlur`.

---

### BUG-ID: D5-06
- **Severity**: Critical
- **Location**: `src/LearnEngine/ValenceValidator.ts:73-74`
- **Evidence & Root Cause**:
  Keys in `ELEMENT_VALENCE_DATA` are title-cased (`Na`, `Cl`, `Si`, `Br`, `Ca`, `Mg`, `K`). `atom.element.toUpperCase()` transforms `"Na"` -> `"NA"`, `"Cl"` -> `"CL"`, causing `ELEMENT_VALENCE_DATA['NA']` and `['CL']` to return `undefined`.
- **Impact**: All two-letter elements fall back to Carbon (valence 4, electronegativity 2.0). NaCl, PCl5, CaCl2, and Si structures calculate completely invalid octets and formal charges.
- **Minimal Fix**:
  ```ts
  const el = atom.element.length > 1 ? atom.element.charAt(0).toUpperCase() + atom.element.slice(1).toLowerCase() : atom.element.toUpperCase();
  ```

---

### BUG-ID: D5-07
- **Severity**: Medium
- **Location**: `src/LearnEngine/ValenceValidator.ts:89-93`
- **Evidence & Root Cause**:
  `let nonBondingElectrons = Math.max(0, standardData.valence - totalBondOrder);`
  `let formalCharge = atom.charge !== undefined ? atom.charge : (standardData.valence - nonBondingElectrons - totalBondOrder);`
  Algebraic cancellation: `valence - (valence - totalBondOrder) - totalBondOrder === 0`.
- **Impact**: `formalCharge` is hard-locked to `0` for all standard atoms. Polyatomic cations and anions (e.g. NH4+, H3O+) calculate net formal charge of 0 instead of +1.
- **Minimal Fix**:
  Account for atom charge and bond valence electrons properly.

---

### BUG-ID: D5-08
- **Severity**: Critical
- **Location**: `src/LearnEngine/MolecularEngine.ts:196-201, 212-214`
- **Evidence & Root Cause**:
  When `v0` and `v1` are collinear/parallel (common in linear molecules or 180° orientations), `v0.cross(v1)` produces `(0,0,0)`. Calling `.normalize()` on a zero vector yields `Vector3(NaN, NaN, NaN)`.
- **Impact**: The attached atom's position becomes `NaN`, corrupting Three.js world transform matrices and blanking the 3D molecular canvas.
- **Minimal Fix**:
  ```ts
  const cross = new THREE.Vector3().crossVectors(v0, v1);
  const normal = cross.lengthSq() < 1e-4 ? new THREE.Vector3(0, 1, 0) : cross.normalize();
  ```

---

### BUG-ID: D5-09
- **Severity**: Medium
- **Location**: `src/LearnEngine/SessionMoleculeContext.tsx:288-392`
- **Evidence & Root Cause**:
  `StructuredMolecularAction.type` explicitly defines `'ADD_BOND' | 'REMOVE_BOND' | 'SET_FORMAL_CHARGE'`. However, `executeStructuredAction`'s `switch` block omits all three cases, defaulting to `return { success: false, message: 'Unknown action: ADD_BOND' }`.
- **Impact**: AI agent and voice core commands to add bonds between existing atoms, create cyclic rings, or adjust charges fail silently with "Unknown action".
- **Minimal Fix**:
  Add implementation cases for `'ADD_BOND'`, `'REMOVE_BOND'`, and `'SET_FORMAL_CHARGE'`.

---

### BUG-ID: D5-10
- **Severity**: High
- **Location**: `src/learning/LessonRunner.tsx:107-118`
- **Evidence & Root Cause**:
  When a question is answered correctly, `saveAnswer` immediately adds `step.id` to `completedStepIds`. At line 69, `stepCompleted` becomes true, enabling `canAdvance` and allowing the user to skip required spatial operations (e.g. `SELECT_COMPONENT`).
- **Impact**: Students advance past guided learning checkpoints without performing the required 3D component inspection/selection.
- **Minimal Fix**:
  Verify both question answer correctness and completion rule criteria.

---

### BUG-ID: D5-11
- **Severity**: Medium
- **Location**: `src/learning/LessonRunner.tsx:52-62, 77-95`
- **Evidence & Root Cause**:
  When `chooseLesson` triggers `setLessonId`, `lesson` updates synchronously via `useMemo`, but `progress` remains from the prior lesson until `useEffect` loads the new progress on the next frame.
  If `progress.currentStepIndex >= newLesson.steps.length`, `isFinished` flashes true. If within range, `onAction(step.action)` at line 90 executes the action for the *wrong* step of the new lesson.
- **Impact**: Asynchronous race condition causing spurious "Lesson complete!" flash and incorrect 3D model actions executed when switching lessons.
- **Minimal Fix**:
  Verify `isLessonSynced = progress.lessonId === lesson?.id;` before evaluating step or completion.

---

### BUG-ID: D5-12
- **Severity**: Low
- **Location**: `src/learning/LessonProgress.ts:27-32`
- **Evidence & Root Cause**:
  `currentStepIndex` is not checked against lower bounds (`< 0`) or sanitized against integer truncation.
- **Impact**: Corrupted localStorage entries load negative or non-integer indices, breaking step indexing in `LessonRunner`.
- **Minimal Fix**:
  `item.currentStepIndex = Math.max(0, Math.floor(item.currentStepIndex));`

---

### BUG-ID: D5-13
- **Severity**: High
- **Location**: `src/App.tsx:1959` & `src/ScientificHUD.tsx:267, 370, 524, 566` & `src/Sidebar.tsx:21`
- **Evidence & Root Cause**:
  `App.tsx:1959` sets `eventSource={containerRef}` on `<Canvas>`, routing all pointer events on the root container through R3F. `ScientificHUD` panels (`z-40 pointer-events-auto`) and `Sidebar` (`z-10 pointer-events-auto`) do not call `e.stopPropagation()` on `pointerDown` / `pointerMove`.
- **Impact**: Clicking or dragging HUD controls/sidebar items bubbles to R3F, triggering unintended 3D model hover/selection and camera rotation behind HUD panels, violating AGENTS.md ("The user should never fight the interface; controls must feel invisible").
- **Minimal Fix**:
  Add `onPointerDown={(e) => e.stopPropagation()}` and `onPointerMove={(e) => e.stopPropagation()}` on HUD and Sidebar panel roots.

---

### BUG-ID: D5-14
- **Severity**: Medium
- **Location**: `src/ViewModal.tsx:878` & `src/ScientificHUD.tsx:524, 566, 706`
- **Evidence & Root Cause**:
  `ViewModal.tsx:878` docks at the bottom of the screen (`items-end z-40 max-h-[50vh]`) when `currentView === 'compare'` or `'demonstration'`.
  Simultaneously, `ScientificHUD.tsx` mounts its bottom-left panel (`bottom-28 z-40 max-h-[35vh]`), bottom-right panel (`bottom-28 z-40 max-h-[35vh]`), and bottom toolbar (`bottom-4 z-30`).
- **Impact**: Z-index and pointer-event fighting where the bottom half of the screen has two overlapping UI systems at `z-40`, rendering controls unreadable and clicks misrouted.
- **Minimal Fix**:
  Hide `ScientificHUD` bottom panels when modal views (`currentView !== 'home'`) are active.

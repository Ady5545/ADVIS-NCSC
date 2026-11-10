# Hunter 3 Audit Report: 3D Graphics, Three.js / R3F Canvas, Spatial Object Engine & Theatre Pipeline

---

- **BUG-ID**: D3-01
- **Severity**: Critical
- **Location**: `src/cad/CadModelCanvas.tsx:16-31`
- **Evidence & Root Cause**:
  `CadMesh` allocates a `new THREE.BufferGeometry()` on every model change or re-evaluation. Unlike `CadAssetRenderer.tsx:95`, there is no cleanup hook (`useEffect(() => () => geometry?.dispose(), [geometry])`). The unreferenced geometries and GPU VBOs remain allocated in GPU VRAM indefinitely.
- **Impact**: Memory leak leading to WebGL GPU memory exhaustion and browser tab crash (OOM) during CAD model inspection.
- **Minimal Fix**:
  ```tsx
  useEffect(() => () => geometry?.dispose(), [geometry]);
  ```

---

- **BUG-ID**: D3-02
- **Severity**: Critical
- **Location**: `src/cad/CadAssetRenderer.tsx:134-138`
- **Evidence & Root Cause**:
  `new THREE.EdgesGeometry(geometry, 18)` is instantiated inline in JSX on every render cycle of `CadAssetRenderer`. Unreferenced edge geometries are never disposed.
- **Impact**: Fast WebGL VRAM leak; thousands of edge buffer allocations cause GPU driver stutter and eventual WebGL context crash.
- **Minimal Fix**:
  Memoize `EdgesGeometry` and dispose on unmount/change.

---

- **BUG-ID**: D3-03
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:94-112`
- **Evidence & Root Cause**:
  `RealisticGLTFModel` clones materials on every GLB model instance. When `clonedScene` is recalculated or the component unmounts, there is no traversal disposing the cloned materials or their cloned emissive textures.
- **Impact**: Accumulating WebGLProgram shaders and texture bindings in WebGL context on every GLB model switch.
- **Minimal Fix**:
  Traverse and dispose materials in unmount effect.

---

- **BUG-ID**: D3-04
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:2189-2198`
- **Evidence & Root Cause**:
  Inside a 60/120 FPS `useFrame` callback, `Object.entries(componentRefs.current)` allocates an array of tuples every frame, and line 2196 instantiates `new THREE.Vector3()` for every component on every frame.
- **Impact**: Excessive heap allocations triggering frequent GC pauses and noticeable frame-time spikes during model manipulation.
- **Minimal Fix**:
  Use reusable vector ref and `for...in` traversal.

---

- **BUG-ID**: D3-05
- **Severity**: Medium
- **Location**: `src/SpatialObjectEngine.tsx:2563-2568` & `src/GestureContext.tsx:326-335`
- **Evidence & Root Cause**:
  Vector allocations in `SpatialObjectEngine` run every frame during pointing/hovering, and `console.log` in `GestureContext` unconditionally executes at 60 FPS whenever a hand is active, creating objects and serializing them to the browser devtools console.
- **Impact**: GC pressure and main thread serialization lag resulting in dropped frames and input lag.
- **Minimal Fix**:
  Use static module-level scratch vectors and remove or throttle debug logging.

---

- **BUG-ID**: D3-06
- **Severity**: Critical
- **Location**: `src/SpatialObjectEngine.tsx:2210-2217`
- **Evidence & Root Cause**:
  `const currentRpm = isV8Active ? v8RpmRef.current : v12RpmRef.current;`
  If `v12RpmRef.current` or `v8RpmRef.current` is undefined, `currentRpm / 60` produces `NaN`. Since `NaN !== 0` is `true`, `sysTimeRef.current = rad / NaN` stores `NaN`. This `NaN` propagates to `getPistonStroke` and all kinematics transforms.
- **Impact**: Three.js `matrixWorld` transforms become `NaN`, resulting in models completely disappearing from the viewport.
- **Minimal Fix**:
  ```tsx
  const currentRpm = (isV8Active ? v8RpmRef.current : v12RpmRef.current) ?? 0;
  const omega = (currentRpm / 60) * Math.PI * 2 * direction;
  sysTimeRef.current = Number.isFinite(omega) && omega !== 0 ? rad / omega : 0;
  ```

---

- **BUG-ID**: D3-07
- **Severity**: Critical
- **Location**: `src/GestureContext.tsx:270, 377-379, 414-415`
- **Evidence & Root Cause**:
  `const dt = Math.min(delta, 0.033);`
  On the first frame of `useFrame` or upon tab reactivation, `delta` can be `0`, making `dt === 0`. Dividing `dx / 0` produces `Infinity` or `NaN`, which poisons `rawSpeed`, `orbitSpeedMult`, `spatialCam.targetTheta`, and `state.cameraTarget`.
- **Impact**: Camera coordinates become `NaN`/`Infinity`, causing camera matrix calculation failure and a black screen.
- **Minimal Fix**:
  `const dt = Math.max(0.001, Math.min(delta, 0.033));`

---

- **BUG-ID**: D3-08
- **Severity**: Low
- **Location**: `src/generators/V8Precision.tsx:760-762`
- **Evidence & Root Cause**:
  `const speedRatio = 0.245 / radius;`
  Division by `radius` without zero-check produces `Infinity` if `radius <= 0`. Multiplying `0 * Infinity` produces `NaN`, corrupting `pulleyRef.current.rotation.z`.
- **Impact**: Pulley rotation matrix becomes `NaN`, breaking transformation hierarchy for accessory belts.
- **Minimal Fix**:
  `const speedRatio = radius > 0.001 ? 0.245 / radius : 1;`

---

- **BUG-ID**: D3-09
- **Severity**: Medium
- **Location**: `src/theatre/TheatreV12Bridge.ts:28-34, 42-47` & `src/SpatialObjectEngine.tsx:2185-2187`
- **Evidence & Root Cause**:
  While Theatre presentation plays, `applyTheatreCamera` continuously dispatches `advis-camera-preset` every rAF tick, directly overwriting manual hand/orbit coordinates in `CameraRig`/`GestureFrameUpdater`. Furthermore, upon presentation completion, `v12PresentationFrame.active` snaps immediately to `false`, causing `theatreFactor` to instantly snap from `1` to `0` without damping.
- **Impact**: Violates AGENTS.md ("The user should never fight the interface; it should adapt to the user"). User controls fight presentation; visual popping occurs at sequence conclusion.
- **Minimal Fix**:
  Pause sequence if manual interaction begins; lerp `theatreFactor` smoothly instead of hard ternary switching.

---

- **BUG-ID**: D3-10
- **Severity**: Medium
- **Location**: `src/GestureContext.tsx:567-577`
- **Evidence & Root Cause**:
  When hand tracking is lost in non-spatial mode, the engine resets `targetScale`, `targetPos`, and `targetEnergy` to defaults. This violates AGENTS.md: *"Losing hand tracking must NEVER reset the workspace... remember everything, and resume seamlessly when the hand returns."*
- **Impact**: Workspace state wipes and jumps abruptly whenever user momentarily removes hands.
- **Minimal Fix**:
  Retain previously established user transform state until explicit reset.

---

- **BUG-ID**: D3-11
- **Severity**: Critical
- **Location**: `src/App.tsx:1954-1961` & `src/cad/CadModelCanvas.tsx:63-67`
- **Evidence & Root Cause**:
  Neither `<Canvas>` instance handles the WebGL context loss event `webglcontextlost`. In the WebGL specification, if `event.preventDefault()` is not called during `webglcontextlost`, the browser will not attempt to restore the context via `webglcontextrestored`. Furthermore, the root `<Canvas>` in `App.tsx` is not wrapped in an isolated ErrorBoundary.
- **Impact**: Unrecoverable black screen upon GPU sleep/wake, driver timeout, or display disconnect; any uncaught Three.js shader/geometry exception crashes the entire React application.
- **Minimal Fix**:
  Add `onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault()); }}` to `<Canvas>`, and wrap `<Canvas>` in an isolated ErrorBoundary.

---

- **BUG-ID**: D3-12
- **Severity**: Medium
- **Location**: `src/generators/V12VisualOverlays.tsx:78, 112`
- **Evidence & Root Cause**:
  `args` arrays containing variable telemetry values (`flameIntensity`, `arrowLength`) change every frame at 60 FPS. In `@react-three/fiber`, mutating geometry `args` forces geometry destruction, buffer reallocation, and CPU-to-GPU re-uploads on every frame for 12 cylinders.
- **Impact**: Up to 1440 WebGL buffer allocations per second causing GC spikes and visible stutter during engine simulation.
- **Minimal Fix**:
  Use static unit geometries (`args={[1, 1, 1]}`) and modulate dimensions dynamically via `<mesh scale={[1, arrowLength, 1]}>` and `<mesh scale={flameIntensity}>`.

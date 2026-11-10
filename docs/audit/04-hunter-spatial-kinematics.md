# Hunter 4 Audit Report: Spatial AI Tracking, Gesture Recognition & Kinematics Engine

Operating under `/precontext`, `/gravitas`, and `/ponytail`. Grounded in exact file:line evidence.

---

### BUG-ID: D4-01
- **Severity**: Critical
- **Location**: `src/scientific/V12EngineAudioEngine.ts:201-224` (and `src/scientific/V8EngineAudioEngine.ts:202-225`)
- **Evidence & Root Cause**:
  When the browser blocks audio autoplay, `ctx.resume()` rejects. In the catch block, a new closure is defined and 3 window listeners are registered on every invocation of `update()`. Since `update()` is called at ~60 Hz, **180 event listeners accumulate on `window` every second** (1,800 in 10s), without any guard against duplicate registration.
- **Impact**: Unbounded memory growth, event queue saturation, and browser thread lockup when the user finally taps or clicks (all accumulated listeners execute concurrently).
- **Minimal Fix**:
  ```ts
  if (!this.unlockAttached && typeof window !== 'undefined') {
    this.unlockAttached = true;
    const unlock = () => { this.unlockAttached = false; ... };
  ```

---

### BUG-ID: D4-02
- **Severity**: Critical
- **Location**: `src/GestureContext.tsx:270, 377-379, 414-415`
- **Evidence & Root Cause**:
  `const dt = Math.min(delta, 0.033);`
  `delta` can be `0` in Three.js/R3F on the initial frame or when the browser tab resumes from background throttling. When `dt === 0`, `dx / dt` evaluates to `Infinity` or `NaN`. This propagates into `rawSpeed`, `orbitSpeedMult`, `spatialCam.targetTheta += NaN`, and ultimately `state.cameraTarget.set(camX, camY, camZ)` with `NaN` coordinates.
- **Impact**: Three.js projection matrix evaluates to `NaN`, permanently turning the 3D viewport into a black/blank screen until page reload.
- **Minimal Fix**:
  ```ts
  const dt = Math.max(0.001, Math.min(delta, 0.033));
  ```

---

### BUG-ID: D4-03
- **Severity**: Critical
- **Location**: `src/scientific/FourStrokeEngineModel.ts:983`
- **Evidence & Root Cause**:
  ```ts
  const conrodAngle1 = Math.asin((r / L) * sinTheta1);
  ```
  Mathematical singularity: `Math.asin` domain is strictly `[-1, 1]`. If `(r / L) * sinTheta1` exceeds 1.0 or -1.0 due to floating-point rounding or parameter variation, `Math.asin` returns `NaN`. In `SimulationEngine.ts:164-166`:
  `SimulationEngine` throws an uncaught error on non-finite values and calls `this.pause()`, halting the entire simulation permanently.
- **Impact**: Kinematics simulation crash and complete UI execution freeze.
- **Minimal Fix**:
  ```ts
  const conrodAngle1 = Math.asin(Math.max(-1, Math.min(1, (r / L) * sinTheta1)));
  ```

---

### BUG-ID: D4-04
- **Severity**: Critical
- **Location**: `src/useHandTracking.ts:250, 269, 278, 304-308`
- **Evidence & Root Cause**:
  `const hasHands = state.hands.map(h => h.landmarks) && state.hands.map(h => h.landmarks).length > 0;`
  If `state.hands` contains an entry where `landmarks` is empty or has fewer than 21 landmarks, `lm[8]` evaluates to `undefined`, and `lm[8].x` throws `TypeError: Cannot read properties of undefined (reading 'x')`.
- **Impact**: Unhandled React runtime exception crashing the hand tracking pipeline and parent UI tree.
- **Minimal Fix**:
  ```ts
  const validHands = state.hands.filter(h => h?.landmarks && h.landmarks.length >= 21);
  const hasHands = validHands.length > 0;
  ```

---

### BUG-ID: D4-05
- **Severity**: High
- **Location**: `src/GestureContext.tsx:566-577`
- **Evidence & Root Cause**:
  In the non-spatial pipeline, when hand tracking is lost (`handTracking.state !== 'TRACKING'`), `targetScale` is forcefully snapped to `1.0` and `targetPos` to `(0, 0, 0)`.
  This directly violates the AGENTS.md invariant: *"PERSISTENCE: Losing hand tracking must NEVER reset the workspace. If the user removes their hand: pause interaction, remember everything, and resume seamlessly when the hand returns."*
- **Impact**: Jarring hologram snapback/reset, losing user's manual inspection placement and scale whenever hands leave the camera frame.
- **Minimal Fix**:
  Preserve existing `targetPos` and `targetScale`:
  `state.targetEnergy.current = 0;`

---

### BUG-ID: D4-06
- **Severity**: High
- **Location**: `src/App.tsx:804-886`
- **Evidence & Root Cause**:
  `stream` is captured inside the `.then` callback and never saved in an outer reference. In the cleanup function, `audioContext.close()` is called, but `stream.getTracks().forEach(t => t.stop())` is NEVER called. If `systemState` leaves `'LISTENING'` before the promise resolves, an orphaned `AudioContext` and `requestAnimationFrame(updateAudio)` loop keep streaming the microphone in the background permanently.
- **Impact**: Security/privacy violation (unstopped microphone access), tab audio recording indicator remains permanently lit, and CPU/battery drain.
- **Minimal Fix**:
  Store `micStream` in ref and stop tracks on unmount.

---

### BUG-ID: D4-07
- **Severity**: Medium
- **Location**: `src/useHandTracking.ts:257`
- **Evidence & Root Cause**:
  Detection confidence from MediaPipe (`classification.score`) is completely discarded and hardcoded to `0.99`. No confidence gating is performed. AGENTS.md mandates: *"Infer the most likely intention using context, movement history, object state, and interaction confidence. When confidence is low, do nothing."* When MediaPipe produces low-confidence detections (< 0.65) during occlusion or poor lighting, `useHandTracking` treats them as 99% certain, firing spurious pinches, erratic pointer jumps, and unintended button click events.
- **Impact**: False positive gestures, phantom clicks, and visual cursor jitter under low lighting or occlusion.
- **Minimal Fix**:
  Read score from detection and gate if confidence < 0.65.

---

### BUG-ID: D4-08
- **Severity**: Medium
- **Location**: `src/scientific/V12EngineAudioEngine.ts:286-304` (and `src/scientific/V8EngineAudioEngine.ts:287-305`)
- **Evidence & Root Cause**:
  If `rpm` or `speed` is non-finite (`NaN` or `Infinity`), `f0` becomes `NaN`. Passing `NaN` to Web Audio `setTargetAtTime` throws: `TypeError: Failed to execute 'setTargetAtTime' on 'AudioParam': The provided float value is non-finite.`
- **Impact**: Synthesizer tick crashes with unhandled TypeError, stopping audio synthesis for the session.
- **Minimal Fix**:
  Sanitize `rpm` and `speed` with `Number.isFinite`.

---

### BUG-ID: D4-09
- **Severity**: Medium
- **Location**: `src/scientific/EngineKinematicsBus.ts:270-272`
- **Evidence & Root Cause**:
  `EngineKinematicsBus.update` is called inside the 60 FPS Three.js `useFrame` render loop in `src/SpatialObjectEngine.tsx:2967`. If any subscribed component throws an unhandled error during state update, the uncaught exception terminates the loop and crashes the Three.js RAF render loop.
- **Impact**: Unhandled subscriber error halts 3D scene rendering, freezing the entire spatial engine.
- **Minimal Fix**:
  Wrap subscriber execution in `try...catch`.

---

### BUG-ID: D4-10
- **Severity**: Medium
- **Location**: `src/scientific/V12EngineAudioEngine.ts:182-188, 357-359, 420-425` (and `src/scientific/V8EngineAudioEngine.ts:183-189, 358-360, 421-426`)
- **Evidence & Root Cause**:
  In `initAudio()`, 6 oscillators are started with `.start()`. When `useV12EngineAudio` unmounts, `stop()` only ramps down `masterGain` to 0.0001. The oscillators are never stopped or disconnected, and `AudioContext` remains active in `'running'` state indefinitely.
- **Impact**: Permanent background audio DSP thread consumption and memory leak on client hardware after leaving the 3D model view.
- **Minimal Fix**:
  Suspend AudioContext and disconnect nodes on stop.

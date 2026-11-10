# ADVIS Multi-Domain Bug Hunt & Adversarial Audit Reports

**Date:** 2026-11-10  
**Repository:** ADVIS (Spatial AI Operating System)  
**Base Commit:** `645c14f91421c6e3fd7a2e68a11fe84f3b5cae35`  
**Governing Protocols:** `/precontext`, `/gravitas`, `/ponytail`

---

## Executive Summary

A comprehensive, adversarial multi-domain bug hunt was performed across the entire ADVIS codebase.
The audit pipeline executed across 5 parallel domain hunters, consolidated 55 unique candidate defects, subjected them to rigorous counter-proof and defense evaluation via an independent **Skeptic Agent**, and reached authoritative adjudication via the **Referee Agent**.

- **Total Candidates Audited:** 55
- **Authoritative Confirmed Real Bugs:** 47 (85.5%)
  - **Critical:** 5
  - **High:** 10
  - **Medium:** 21
  - **Low:** 11
- **Dismissed False Positives (Disproven):** 8 (14.5%)

---

## Report Directory Structure

| File | Title | Description | Findings |
|---|---|---|---|
| [`01-hunter-backend-security.md`](./01-hunter-backend-security.md) | Hunter 1 Report | Backend Services, Express Middleware, Gemini Live/Butler Core, Security Boundaries & Vercel | 14 candidates |
| [`02-hunter-persistence-data.md`](./02-hunter-persistence-data.md) | Hunter 2 Report | Server `.data` JSON Persistence, WorkshopStore, Model Catalog & LocalStorage Integrity | 10 candidates |
| [`03-hunter-3d-graphics-engine.md`](./03-hunter-3d-graphics-engine.md) | Hunter 3 Report | 3D Graphics, Three.js / R3F Canvas, WebGL Memory Leaks, Frame Pacing & Spatial Engine | 12 candidates |
| [`04-hunter-spatial-kinematics.md`](./04-hunter-spatial-kinematics.md) | Hunter 4 Report | MediaPipe Spatial Tracking, Gesture Gating, Audio Synthesis & Kinematics Bus | 10 candidates |
| [`05-hunter-cad-learning.md`](./05-hunter-cad-learning.md) | Hunter 5 Report | OpenCASCADE WASM Lifecycle, Parametric CAD, Molecular Chemistry & Spatial HUD | 14 candidates |
| [`06-candidate-findings-consolidated.md`](./06-candidate-findings-consolidated.md) | Consolidated Candidates | Master registry of all 55 deduplicated candidate findings across the 5 domains | 55 candidates |
| [`07-skeptic-evaluation.md`](./07-skeptic-evaluation.md) | Skeptic Evaluation | Adversarial counter-analysis, caller tracing, floating-point proofs, and false-positive filtering | 55 evaluations |
| [`08-referee-verdict-report.md`](./08-referee-verdict-report.md) | Authoritative Referee Report | Final definitive verdicts, root-cause dossiers, disproof rationales, and surgical remediation plan | 47 confirmed, 8 dismissed |

---

## Top 5 Critical Vulnerabilities Identified

1. **CAND-06 (`ButlerEngine.js:857-860`) — Hallucinated Gemini Model Identifier:**
   Defaults to non-existent `gemini-3.8-flash` / `gemini-3.5-flash-lite`, failing 100% of out-of-the-box conversational turns with HTTP 404 Model Not Found when `GEMINI_MODEL` is unset.
2. **CAND-07 (`ButlerEngine.js:754`, `api/advis.js:59`) — Gemini Role Alternation & Leading Model Turn:**
   First message payload includes assistant greeting as turn 0; Google Gemini API strictly rejects conversations starting with a `model` turn with HTTP 400 Bad Request.
3. **CAND-03 (`src/GestureContext.tsx:270`) — Camera Division by Zero on Delta:**
   `dt = Math.min(delta, 0.033)` evaluates to 0 on initial frame or background tab resume, producing `dx / dt = NaN/Infinity`, poisoning projection matrices and causing a permanent black screen.
4. **CAND-18 (`server.js:42-67`) — Catastrophic Data Wipe on Corrupted Chat History:**
   Loading all 4 `.data` files is wrapped in a single try/catch; any JSON syntax error in chat history aborts remaining loads and subsequently overwrites `advis_memories.json` and `advis_projects.json` with empty arrays `[]`.
5. **CAND-35 (`V12EngineAudioEngine.ts:201`, `V8EngineAudioEngine.ts:202`) — Window Event Listener Saturation (180/sec):**
   When browser autoplay policy suspends audio, 3 un-guarded window event listeners are registered every frame inside the 60 Hz audio tick, leaking 1,800 listeners in 10s and locking up the main thread on user click.

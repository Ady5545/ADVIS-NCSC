# Phase 4 Implementation Report — 15 October 2026

**Repository:** `Ady5545/ADVIS-NCSC`  
**Stacked on Quarter 3:** `fb801647ed8b6ddd5b156a3ddd6b0314132d1156`  
**Scope:** Versioned V8 lesson/assessment and diagnosis of the existing Playwright launch failure.

## Implemented in this diagnostic tranche

1. **Canonical model route.** The scientific launchpad selects `v8_engine`, the registered spatial model key that has the guided-lesson capability, rather than the stale `v8_engine_scientific` ID.
2. **Versioned authored lesson.** Ports the V8 guided lesson version 2, including answer-gated checks, reset/reassembly state, clear educational-model limitations, and the local progress contract.
3. **Lesson contract test.** `scripts/test-v8-guided-lesson.mjs` validates lesson schema, versioned progress reset, answer gating, the 720-degree objective and model-limit wording. It runs as part of `validate:lessons`.
4. **More diagnostic browser failure.** The prior Playwright run failed before opening the lesson dialog because the `Guided Lesson` button could not be clicked after selecting the model. The previous test's log did not capture the relevant console errors at that point. The updated test now captures page errors, console errors, launcher count/visibility/bounds and visible page text; launcher waits are bounded to 15 seconds so a failure can provide actionable evidence instead of spending the full 90-second test timeout.

## Acceptance status

This tranche is **not complete yet**. The new current-head CI must reveal whether the launcher is absent, blocked or the app has thrown during V8 activation. The real fix must address that observed cause and the entire lesson walkthrough must pass in Chromium. Unit/catalog lesson checks alone are not enough.

## Trust limits

The lesson remains educational draft content until subject-matter review; its kinematics/audio are not validated engine performance or OEM geometry. Protected live-production visuals remain unverified because the connected Vercel project access returns 403.

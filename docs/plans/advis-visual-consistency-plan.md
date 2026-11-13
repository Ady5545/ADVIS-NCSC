# ADVIS visual consistency plan

## Objective
Make every interactive and informational interface surface feel like one deliberate ADVIS product: deep charcoal/black foundations, restrained crimson accents, clear neutral typography, and consistent control states. Remove accidental light-mode remnants without flattening scientific meaning.

## Design tokens
- Canvas: near-black graphite.
- Surface levels: charcoal, raised charcoal, and elevated charcoal; each has a predictable contrast step.
- Accent: ADVIS signal crimson for primary actions, active navigation, focus, and selected UI states.
- Typography: bright neutral for primary content, soft neutral for supporting content, muted neutral for metadata.
- Borders: low-contrast neutral by default; crimson only for selected/active emphasis.
- Status colors: restrained dark-tinted success, warning, and error states. Keep them semantic.

## Implementation sequence
1. **Central theme layer:** create a single theme stylesheet and import it after the existing stylesheet so it can normalize legacy utility classes consistently.
2. **Legacy surface normalization:** convert leftover white, pale slate, pale blue, cyan, and rose UI surfaces into the same charcoal/crimson system, including opacity variants and hover/active states.
3. **Control normalization:** standardize native inputs, textareas, selects, options, checkboxes, radios, range controls, focus rings, disabled states, and scrollbars.
4. **Component primitives:** publish reusable ADVIS panel, field, primary/secondary button, icon-button, and status primitives for all future screens.
5. **Core screen coverage:** apply the shared mapping to navigation, command/chat surfaces, scientific HUDs, engineering cockpit panels, quick starts, and modals.
6. **Visual QA:** verify key legacy class coverage, responsive behavior, readable contrast, semantic statuses, and that scientific model/data colors are not accidentally recolored.

## Guardrails
- No light-mode buttons or form controls in the application UI.
- No per-screen palette inventions; new UI must use the shared ADVIS tokens/primitives.
- Preserve layout, functionality, scientific model colors, graph encodings, and semantic success/warning/error distinctions.
- Do not treat a blocked deployment as a successful production release; run the repository checks and verify the deployed result when CI/deployment capacity allows.


## Implementation status — 13 November 2026

### Implemented on `main`
- Added `src/advis-theme.css` as the shared ADVIS theme layer and loaded it after `src/index.css`.
- Established common charcoal surface tiers, crimson accent, neutral typography, borders, focus treatment, and restrained semantic status surfaces.
- Added reusable panel, button, icon-button, field, and status primitives.
- Added compatibility mappings for legacy white opacity variants and older pale blue, cyan, indigo, rose, slate, gray, and one-off pale cockpit surfaces.
- Normalized control states, form controls, native button fallback styling, focus rings, and scrollbars.
- Audited the styling vocabulary in the eight main UI surfaces: engineering cockpit, scientific HUD, modal, command dock, chat panel, sidebar, mobile navigation, and home launchpad. The audit found 63 distinct background utility tokens; legacy light/accent tokens in those surfaces are covered by the shared theme layer.
- Kept warning, success, error, and scientific visualization/data colors semantically distinct instead of flattening every color into crimson.

### Verification still required
- Source-level checks passed for stylesheet import order, required theme selectors, reusable primitives, and balanced CSS braces.
- A full Vite/TypeScript/browser visual run has not been confirmed.
- The latest Vercel check reports the account's `build-rate-limit`; therefore this implementation is pushed to GitHub `main`, but production activation and live visual QA are not yet verified.

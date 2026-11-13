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

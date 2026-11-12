# ADVIS Chemistry Workstation — Unification & Capability Plan

**Status:** Phase 0 foundation implemented on `main`; Phases 1–4 are the staged roadmap.  
**Product:** ADVIS NCSC  
**Primary constraint:** Improve consistency and capability without redesigning the current chemistry experience.

---

## 1. Product direction

ADVIS Chemistry should feel like one coherent, independent scientific workstation, regardless of whether a user opens a molecule from chat, the launchpad, a guided lesson, or the Molecular Builder.

The chemistry workstation is **not** an engineering spatial workstation with chemical labels. Its native object is a molecular graph: atoms, bonds, charges, stereochemistry, coordinates, and chemical relationships. Its tools, feedback, and presentation should be built around those concepts.

### Preserve the current experience

Keep the recognizable chemistry environment:

- The current molecular canvas and atom/bond visual language.
- The existing light surface, blue chemistry accents, compact technical typography, and translucent panels.
- The Molecular Builder panel and its present placement.
- The guided lesson overlay, step navigation, replay behavior, and educational explanations.
- The existing chemistry-specific orbital, Lewis-structure, VSEPR, and ionic-bonding teaching visuals.

Improve alignment, responsiveness, accuracy feedback, and capability inside this experience. Do not replace it with a new shell.

### Explicit non-goals

- Do not copy the Engineering Spatial Workstation layout, HUD, component hierarchy, explode controls, mechanical kinematics, or inspection metaphors.
- Do not redesign the overall ADVIS home screen or navigation.
- Do not remove the current guided teaching experience.
- Do not force every chemistry lesson into an interactive molecular editing session.
- Do not fabricate coordinates, bonds, charges, stereochemistry, or structure provenance to make a model appear complete.
- Do not claim support for every possible compound until the resolver and validation pipeline can actually provide it.

---

## 2. Target architecture

The intended flow is:

```text
Chat / Launchpad / Scientific Display / Guided Lesson / Builder
                         |
              Chemistry Entry Router
                         |
             Chemistry Domain Services
              /          |           \
       Resolver      Graph Model    Validation
              \          |           /
                Chemistry Session
                       |
              Chemistry Presentation
                 /             \
        Molecular Canvas     Teaching Visuals
                 \             /
              Chemistry HUD + Inspector
```

The shared chemistry domain layer owns identity, structure data, load state, validation, and provenance. The presentation layer decides how that data is taught or inspected. This keeps chemistry consistent without making it dependent on engineering.

### Domain model

The authoritative structure remains `MoleculeData`, expanded deliberately as requirements are implemented:

- **Atom:** stable ID, normalized element symbol, 3D position, formal charge, isotope, stereochemical annotation, and source metadata.
- **Bond:** stable ID, endpoint IDs, bond order, aromaticity/type, stereochemical direction, and measured coordinate length.
- **Molecule:** canonical identity, display name, molecular formula, net charge, atom/bond arrays, functional-group annotations, coordinates/conformer metadata, and provenance.
- **Session:** active molecule, source, loading status, selected atom/bond, measurements, edit history, validation results, and current presentation mode.

Do not let the UI independently infer or rewrite the chemical graph. The graph is the source of truth; the 3D renderer and HUD read from it.

### Independent chemistry UI system

Use a chemistry-specific shared UI language rather than importing engineering UI components. Common components should cover:

- Chemistry panel, header, typography, labels, formula rendering, and spacing.
- Status indicators: resolving, ready, incomplete, unsupported, and validation warning.
- Compound identity and source/provenance display.
- Consistent selected atom, selected bond, measurement, and error presentation.

The guided lesson and builder can arrange those primitives differently. Consistency means consistent visual language and meaning—not forcing every screen into identical layout.

---

## 3. Entry-point consistency

All structure-opening requests should pass through the same chemistry entry function and resolver.

| Entry point | Expected behavior |
|---|---|
| Natural-language molecule request | Resolve compound, load verified graph, open Molecular Builder |
| Chemistry launchpad selection | Use the same resolver and molecular canvas |
| Structured `DISPLAY_SCIENTIFIC` action | Use the same resolver and molecular canvas |
| Guided “teach me” request | Keep the current lesson sequence and teaching visuals |
| Guided “show me” request | Prefer the shared molecular graph; use existing lesson visualization only where it is the appropriate educational fallback |
| Builder edits | Mutate the active graph, revalidate it, and update the same canvas/HUD |

A supported educational lesson is a useful fallback when a full verified 3D conformer is unavailable. It must be presented as a teaching visualization, not mislabeled as a complete canonical 3D structure.

An unknown compound must produce a clear resolution message, not an unrelated placeholder molecule.

---

## 4. Molecular resolution strategy

The first resolver implementation uses the local structure registry and a PubChem-backed remote lookup. This is a good first layer, not the final universal chemistry engine.

### Resolver order

1. **Local verified registry** for fast, deterministic structures already included in ADVIS.
2. **PubChem reference resolution** by name, CID, or supported structure string; request structure records and a genuine 3D conformer where available.
3. **Future conformer generation provider** for valid molecular graphs that do not have a suitable PubChem 3D conformer. Evaluate an RDKit-based service or WASM integration, including its deployment size, performance, and licensing.
4. **Specialized macromolecule provider** for protein and biomolecular structures, using appropriate PDB/mmCIF sources rather than pretending they are ordinary small molecules.

### Input forms to support incrementally

- Common compound name and IUPAC name.
- Molecular formula only when identity is unambiguous; a formula can represent multiple isomers, so do not guess.
- PubChem CID and other supported structure identifiers.
- SMILES, then canonical/isomeric SMILES.
- InChI and InChIKey.
- Protein structure identifiers and uploaded structure files in the macromolecule phase.

### Resolution rules

- Resolve identity before rendering.
- Keep source ID, source URL, retrieval time, and coordinate type with the structure.
- Preserve element symbols with correct case (`Cl`, `Na`, `Co`, not ambiguous all-caps strings).
- Preserve formal charges, isotopes, aromatic bonds, stereochemistry, and coordination information when supplied.
- Detect ambiguous names and ask the user to choose among grounded candidates.
- Validate atom/bond references and coordinate finiteness before accepting a structure.
- If only a 2D graph is available, label it as 2D or generate a conformer through an explicit geometry provider. Never describe it as a verified source 3D conformer.
- If no reliable structure can be produced, fail clearly and retain the reason.

---

## 5. Molecular visualization consistency

Every molecule—small or large—should use the same renderer and the same basic interactions.

### Shared rendering behavior

- Auto-center the structure around its geometric bounds.
- Auto-fit the molecule to the available canvas while preserving its proportions.
- Use consistent element colors, atom sizing, bond widths, aromatic rendering, and selection states.
- Keep rotation, zoom, atom selection, bond selection, and measurement behavior consistent.
- Ensure the HUD and canvas always describe the same active graph.

### Scale and performance

- Use the same molecular coordinate system and a predictable world-to-view fit calculation.
- Reduce expensive per-atom materials, animation, and annotation density for large graphs.
- Retain atom and bond picking for large structures.
- Avoid per-frame layout work when a structure is static.
- Introduce explicit quality tiers only where needed; do not alter the visual style for ordinary molecules.
- Add camera-fit and selection-focus actions without importing engineering camera presets or component isolation semantics.

### Scientific view modes to add gradually

- Current molecular presentation (default).
- Ball-and-stick.
- Space-filling / van der Waals.
- Wireframe / bond framework.
- Electron-density or molecular-surface display only when suitable data exists.

These are chemistry representation choices, not engineering inspection modes.

---

## 6. Validation and scientific trust

The current valence analyzer is useful educational feedback, but it is not a full chemistry toolkit. Do not use a simple octet validator to certify organometallic compounds, hypervalent systems, radicals, coordination complexes, or biomolecules.

### Graph checks

- Every bond endpoint references an existing atom.
- No duplicate atom or bond identifiers.
- Valid element symbols and consistent capitalization.
- Finite coordinates for every rendered atom.
- Valid bond order/type and supported aromatic representation.
- Formula and net charge agree with the graph/source metadata.
- Connectivity is reported, including disconnected fragments and salts.
- Source atom and bond counts match the accepted graph.

### Chemical validation

- Use a chemistry toolkit such as RDKit for robust sanitization, valence, aromaticity, stereochemistry, SMILES/InChI, and graph-level validation where applicable.
- Keep educational VSEPR and high-school explanations as a separate interpretation layer.
- Distinguish **source-verified**, **tool-validated**, **educationally inferred**, and **not verified** claims.
- Show warnings without silently modifying the user's structure.

---

## 7. Workbench capabilities roadmap

These are chemistry-first improvements that build on the present builder instead of replacing it.

### Atom and bond inspector

When an atom is selected, expose element, atomic number, formal charge, isotope, local connectivity, and source stereochemical metadata when available.

When a bond is selected, expose endpoints, order, aromaticity/type, and coordinate-derived length. Do not guess unavailable hybridization values.

### Editing and undo

- Preserve the current add/remove and bond-order controls.
- Add explicit bond creation/deletion and formal-charge/isotope editing.
- Validate after every edit and show local warnings.
- Add reliable undo/redo snapshots and reset-to-source.
- Clearly distinguish a source structure from a user-edited derivative.

### Measurements and structure tools

- Atom-to-atom distance.
- Three-atom bond angle.
- Four-atom dihedral angle.
- Formula, atom count, bond count, and net charge.
- Center/focus selected atom, bond, ring, or functional group.
- Functional-group identification when the graph supports it.

### Save and export

Introduce after the graph model and edit history are stable:

- Save an editable ADVIS molecular session.
- Export validated structure as supported formats (e.g. SDF/MOL and canonical SMILES).
- Preserve source/provenance and note user modifications.
- Never export unsupported stereochemistry or coordinates as if they were verified.

---

## 8. Macromolecules and advanced chemistry

Large organic molecules, coordination compounds, and proteins should not be forced through the same assumptions.

### Large organic molecules

Support ring systems, multiple functional groups, stereocentres, aromaticity, isotopes, formal charges, and realistic conformers. Test with compounds such as caffeine, paclitaxel, and vancomycin.

### Coordination chemistry

Represent metal centres, coordination bonds, coordination number and geometry, oxidation-state metadata, and ligand connectivity explicitly. A generic single/double/triple covalent-bond model is insufficient.

### Proteins and biomolecular assemblies

Protein structures need a dedicated mode with chain, residue, ligand, and atom-level hierarchy. Use PDB/mmCIF structural data and provide appropriate representations (cartoon/ribbon, backbone, sticks, surface). Keep the user inside the same chemistry workstation shell, but do not display an entire protein as a dense ball-and-stick cloud by default.

---

## 9. Implementation phases and acceptance criteria

### Phase 0 — Consistency foundation (implemented in this change set)

- Shared chemistry UI tokens, status indicator, and formula formatter.
- Align guided Chemistry HUD, Molecular Builder HUD, and Learn Workspace styling.
- Fix mixed-case multi-letter element normalization in the chemistry validator.
- Auto-center and auto-fit molecules in the shared 3D renderer.
- Reduce animation/material/annotation overhead for large molecular graphs while preserving selection.
- Route direct chat structure requests, launchpad structure selection, `DISPLAY_SCIENTIFIC`, and explicit `SHOW_ME + SHOW_STRUCTURE` learning actions through one chemistry structure-opening function.
- Hide the builder overlay while the guided lesson overlay is the active chemistry presentation.

**Acceptance:** existing chemistry screens remain recognizable; all three structure entry points call the same resolver; guided lessons still work; large structures no longer depend on the old fixed 1.2 renderer scale; a failed resolver never reports a successful molecular load.

### Phase 1 — Resolver and graph quality

- Introduce provider interfaces so local, PubChem, and future conformer providers return one validated result shape.
- Add identity normalization and explicit ambiguity resolution.
- Add robust graph validation and richer metadata fields.
- Add a conformer provider for valid SMILES/graphs with no remote 3D conformer.
- Preserve aromaticity, formal charges, stereochemistry, salts, and isotope data end-to-end.

**Acceptance:** supported name/SMILES/CID inputs resolve consistently; invalid graphs are rejected with useful reasons; provider/source metadata is visible; generated coordinates are explicitly labeled as generated rather than source-supplied.

### Phase 2 — Advanced molecules and coordination compounds

- Validate and render larger multi-ring organic molecules.
- Add dedicated coordination-bond and metal-centre metadata.
- Improve large-structure selection, focus, and representation modes.
- Add regression fixtures for Vitamin B12, paclitaxel, and vancomycin.

**Acceptance:** complex structures preserve all source atoms, bonds, charges, and stereochemical annotations; the UI remains responsive; unavailable features are identified rather than silently approximated.

### Phase 3 — Biomolecular structures

- Add PDB/mmCIF provider support.
- Add chain/residue/ligand metadata.
- Add protein-friendly cartoon/ribbon, backbone, stick, and surface representations.
- Preserve selection and inspection at atom, residue, ligand, and chain levels.

**Acceptance:** test a multi-chain protein such as hemoglobin with source-matched structural counts and a usable default view.

### Phase 4 — Workbench depth and regression suite

- Expand atom/bond inspector.
- Add reliable undo/redo, source reset, save, and export.
- Add bond-angle and dihedral measurements.
- Add molecule comparison and representation settings.
- Automate visual, graph, and performance regression checks.

**Acceptance:** every chemistry entry point opens the same active molecule/session; edits, validation, measurements, and export refer to that exact graph; the test suite covers small molecules, rings, charged species, complex organics, coordination compounds, and macromolecules.

---

## 10. Regression test matrix

Use a deliberately varied test set rather than only easy textbook examples.

| Test structure | What it checks |
|---|---|
| Water, methane, carbon dioxide | Existing small-molecule baseline |
| Ethanol and benzene | Functional group and aromatic bond rendering |
| Citric acid and caffeine | Multiple functional groups and organic connectivity |
| Vitamin B12 | Large corrin framework and cobalt coordination |
| Paclitaxel | Multiple rings and stereochemistry |
| Vancomycin | Large, interconnected natural-product structure |
| Hemoglobin | Protein chains and macromolecule representation |

For every test, record:

- Resolved compound identity and identifier.
- Molecular formula and net charge where defined.
- Source atom and bond counts.
- Rendered atom and bond counts.
- Connected components and source graph agreement.
- Coordinate provenance and conformer type.
- Stereochemical/coordination metadata retained or explicitly unavailable.
- Render time and interaction performance.
- Whether the result is source-verified, toolkit-validated, generated, educational-only, or unsupported.

A test only passes when the expected graph and provenance conditions pass—not merely because something appeared on the canvas.

---

## 11. Current limitations to keep visible

The currently implemented remote path depends on PubChem supplying a suitable 3D conformer for the requested structure. It does not yet create a reliable conformer for every valid compound, and it is not a protein/macromolecule pipeline. The present valence analyzer is educational feedback, not a universal chemistry validator.

The roadmap closes these gaps in stages. Until each capability is implemented and tested, ADVIS should describe the limitation honestly rather than claim universal support.

---

## 12. Definition of done

The Chemistry Workstation is considered unified when users can move between chat, launchpad, guided teaching, and the Molecular Builder without encountering inconsistent molecule identity, conflicting structure data, mismatched formulas, different atom/bond selection behavior, or contradictory validation status.

It should still look and feel like the current ADVIS Chemistry experience—just more coherent, capable, accurate, and dependable.

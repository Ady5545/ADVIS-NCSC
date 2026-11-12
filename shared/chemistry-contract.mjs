const MAX_QUERY_LENGTH = 220;
const MAX_ATOMS = 1200;
const MAX_BONDS = 2400;

const ELEMENTS = new Set((
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
  "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce " +
  "Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn " +
  "Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
).split(/\s+/));

const COORDINATE_KINDS = new Set([
  "source_3d",
  "generated_3d",
  "local_library_3d",
  "source_2d"
]);

const BOND_TYPES = new Set(["covalent", "ionic", "hydrogen", "aromatic"]);
const BOND_ORDERS = new Set([1, 1.5, 2, 3]);

export function normalizeElementSymbol(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[A-Za-z]{1,2}$/.test(trimmed)) return null;
  const symbol = trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
  return ELEMENTS.has(symbol) ? symbol : null;
}

export function isMolecularFormula(value) {
  if (typeof value !== "string") return false;
  let formula = value.trim().replace(/\s+/g, "");
  if (!formula || formula.length > 80) return false;
  formula = formula.replace(/(?:\d+)?[+-]$/, "");
  if (!formula || !/^[A-Z][A-Za-z0-9()[\]]*$/.test(formula)) return false;

  // Formula parser with nested groups and element/count pairs.
  const parse = (input, offset = 0, closing = "") => {
    let i = offset;
    let count = 0;
    while (i < input.length) {
      const ch = input[i];
      if (closing && ch === closing) return count > 0 ? i + 1 : -1;
      if (ch === "(" || ch === "[") {
        const end = ch === "(" ? ")" : "]";
        const next = parse(input, i + 1, end);
        if (next < 0) return -1;
        i = next;
        while (/\d/.test(input[i] || "")) i++;
        count++;
        continue;
      }
      if (ch === ")" || ch === "]" || !/[A-Z]/.test(ch)) return -1;
      let symbol = ch;
      i++;
      if (/[a-z]/.test(input[i] || "")) symbol += input[i++];
      if (!ELEMENTS.has(symbol)) return -1;
      while (/\d/.test(input[i] || "")) i++;
      count++;
    }
    return closing ? -1 : count > 0 ? i : -1;
  };

  return parse(formula) === formula.length;
}

export function normalizeCompoundInput(value) {
  if (typeof value !== "string") throw new Error("Enter a compound name, formula, CID, InChIKey, InChI, or SMILES string.");
  const query = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) throw new Error("The compound identifier is empty.");

  const cid = /^(?:(?:pubchem\s*)?cid\s*:\s*|pubchem\s+cid\s+)(\d+)$/i.exec(query);
  if (cid) {
    const number = Number(cid[1]);
    if (!Number.isSafeInteger(number) || number <= 0) throw new Error("The PubChem CID must be a positive integer.");
    return { original: query, kind: "cid", identifier: String(number) };
  }

  const smiles = /^smiles\s*:\s*(.+)$/is.exec(query);
  if (smiles) return { original: query, kind: "smiles", identifier: smiles[1].trim() };

  const inchi = /^inchi\s*:\s*(InChI=.+)$/is.exec(query) || /^(InChI=.+)$/is.exec(query);
  if (inchi) return { original: query, kind: "inchi", identifier: inchi[1].trim() };

  const inchiKey = /^inchikey\s*:\s*([A-Z]{14}-[A-Z]{10}-[A-Z])$/i.exec(query)
    || /^([A-Z]{14}-[A-Z]{10}-[A-Z])$/i.exec(query);
  if (inchiKey) return { original: query, kind: "inchikey", identifier: inchiKey[1].toUpperCase() };

  const explicitFormula = /^formula\s*:\s*(.+)$/i.exec(query);
  if (explicitFormula) {
    const formula = explicitFormula[1].replace(/\s+/g, "");
    if (!isMolecularFormula(formula)) throw new Error("The supplied molecular formula is not in a supported formula format.");
    return { original: query, kind: "formula", identifier: formula };
  }

  if (isMolecularFormula(query)) return { original: query, kind: "formula", identifier: query.replace(/\s+/g, "") };
  return { original: query, kind: "name", identifier: query };
}

function atomCoordinates(atom) {
  if (atom && atom.position && typeof atom.position === "object") {
    return {
      x: Number(atom.position.x),
      y: Number(atom.position.y),
      z: Number(atom.position.z)
    };
  }
  return { x: Number(atom?.x), y: Number(atom?.y), z: Number(atom?.z) };
}

export function calculateMolecularFormula(atoms) {
  const counts = Object.create(null);
  for (const atom of atoms || []) {
    const element = normalizeElementSymbol(atom.element);
    if (!element) continue;
    counts[element] = (counts[element] || 0) + 1;
  }

  const ordered = [];
  if (counts.C) ordered.push("C");
  if (counts.H) ordered.push("H");
  for (const symbol of Object.keys(counts).filter(s => s !== "C" && s !== "H").sort()) ordered.push(symbol);
  return ordered.map(symbol => symbol + (counts[symbol] > 1 ? counts[symbol] : "")).join("") || "Empty Molecule";
}

export function countConnectedComponents(atoms, bonds) {
  const adjacency = new Map((atoms || []).map(atom => [atom.id, []]));
  for (const bond of bonds || []) {
    if (adjacency.has(bond.atomA) && adjacency.has(bond.atomB)) {
      adjacency.get(bond.atomA).push(bond.atomB);
      adjacency.get(bond.atomB).push(bond.atomA);
    }
  }

  const visited = new Set();
  let components = 0;
  for (const atom of atoms || []) {
    if (visited.has(atom.id)) continue;
    components += 1;
    const stack = [atom.id];
    visited.add(atom.id);
    while (stack.length) {
      const current = stack.pop();
      for (const next of adjacency.get(current) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
  }
  return components;
}

export function validateMolecularGraph(graph, identity = {}, provenance = {}) {
  const errors = [];
  const warnings = [];
  const atoms = Array.isArray(graph?.atoms) ? graph.atoms : [];
  const bonds = Array.isArray(graph?.bonds) ? graph.bonds : [];

  if (!atoms.length) errors.push("The molecular graph contains no atoms.");
  if (atoms.length > MAX_ATOMS) errors.push("The molecular graph exceeds the supported atom limit.");
  if (bonds.length > MAX_BONDS) errors.push("The molecular graph exceeds the supported bond limit.");

  const atomIds = new Set();
  const canonicalAtoms = [];
  for (let index = 0; index < atoms.length; index++) {
    const atom = atoms[index];
    const id = typeof atom?.id === "string" ? atom.id.trim() : "";
    if (!id) errors.push("Atom " + (index + 1) + " has no stable identifier.");
    else if (atomIds.has(id)) errors.push("Duplicate atom identifier: " + id + ".");
    atomIds.add(id);

    const element = normalizeElementSymbol(atom?.element);
    if (!element) errors.push("Atom " + (id || index + 1) + " has an unknown element symbol.");
    const coordinates = atomCoordinates(atom);
    if (![coordinates.x, coordinates.y, coordinates.z].every(Number.isFinite)) {
      errors.push("Atom " + (id || index + 1) + " has non-finite coordinates.");
    }

    const charge = atom?.charge === undefined || atom?.charge === null ? 0 : Number(atom.charge);
    if (!Number.isInteger(charge)) errors.push("Atom " + (id || index + 1) + " has an invalid formal charge.");
    const isotope = atom?.isotope === undefined || atom?.isotope === null ? undefined : Number(atom.isotope);
    if (isotope !== undefined && (!Number.isInteger(isotope) || isotope <= 0)) {
      errors.push("Atom " + (id || index + 1) + " has an invalid isotope mass.");
    }

    canonicalAtoms.push({ ...atom, id, element: element || atom?.element, ...coordinates, charge, isotope });
  }

  const bondIds = new Set();
  const endpointPairs = new Set();
  const canonicalBonds = [];
  for (let index = 0; index < bonds.length; index++) {
    const bond = bonds[index];
    const id = typeof bond?.id === "string" ? bond.id.trim() : "";
    if (!id) errors.push("Bond " + (index + 1) + " has no stable identifier.");
    else if (bondIds.has(id)) errors.push("Duplicate bond identifier: " + id + ".");
    bondIds.add(id);

    const atomA = typeof bond?.atomA === "string" ? bond.atomA : "";
    const atomB = typeof bond?.atomB === "string" ? bond.atomB : "";
    if (!atomIds.has(atomA) || !atomIds.has(atomB)) errors.push("Bond " + (id || index + 1) + " references a missing atom.");
    if (atomA && atomA === atomB) errors.push("Bond " + (id || index + 1) + " connects an atom to itself.");

    const pair = [atomA, atomB].sort().join("\u0000");
    if (endpointPairs.has(pair)) errors.push("The graph contains more than one bond between the same atom pair.");
    endpointPairs.add(pair);

    const order = Number(bond?.order);
    if (!BOND_ORDERS.has(order)) errors.push("Bond " + (id || index + 1) + " has an unsupported bond order.");
    const type = BOND_TYPES.has(bond?.type) ? bond.type : "covalent";
    if (!BOND_TYPES.has(bond?.type)) errors.push("Bond " + (id || index + 1) + " has an unsupported bond type.");
    if (type === "aromatic" && order !== 1.5) warnings.push("Aromatic bond " + (id || index + 1) + " is not normalized to bond order 1.5.");

    let length = Number(bond?.length);
    const a = canonicalAtoms.find(atom => atom.id === atomA);
    const b = canonicalAtoms.find(atom => atom.id === atomB);
    if (a && b && [a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite)) {
      const coordinateLength = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (!Number.isFinite(length) || length < 0) length = coordinateLength;
    }
    canonicalBonds.push({ ...bond, id, atomA, atomB, order, type, length });
  }

  const formula = calculateMolecularFormula(canonicalAtoms);
  const totalFormalCharge = canonicalAtoms.reduce((total, atom) => total + (Number.isInteger(atom.charge) ? atom.charge : 0), 0);
  const connectedComponents = countConnectedComponents(canonicalAtoms, canonicalBonds);

  if (identity?.formula && formula !== identity.formula) {
    warnings.push("The graph-derived formula (" + formula + ") differs from the source formula (" + identity.formula + ").");
  }
  if (identity?.formalCharge !== undefined && Number(identity.formalCharge) !== totalFormalCharge) {
    warnings.push("The graph-derived net charge differs from the source charge.");
  }
  if (connectedComponents > 1) {
    warnings.push("The structure contains " + connectedComponents + " disconnected components; this can be valid for salts or multi-fragment records.");
  }
  if (Number.isInteger(provenance?.sourceAtomCount) && provenance.sourceAtomCount !== atoms.length) {
    errors.push("The accepted atom count does not match the source record.");
  }
  if (Number.isInteger(provenance?.sourceBondCount) && provenance.sourceBondCount !== bonds.length) {
    errors.push("The accepted bond count does not match the source record.");
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    atomCount: atoms.length,
    bondCount: bonds.length,
    connectedComponents,
    formulaFromGraph: formula,
    formalChargeFromGraph: totalFormalCharge
  };
}

export function buildStructureResult(input) {
  const normalizedAtoms = (input.graph?.atoms || []).map(atom => {
    const coordinates = atomCoordinates(atom);
    return {
      id: String(atom.id || ""),
      element: normalizeElementSymbol(atom.element) || atom.element,
      ...coordinates,
      charge: atom.charge === undefined ? 0 : Number(atom.charge),
      ...(atom.isotope !== undefined ? { isotope: Number(atom.isotope) } : {}),
      ...(atom.stereo ? { stereo: String(atom.stereo) } : {}),
      ...(atom.sourceIndex !== undefined ? { sourceIndex: Number(atom.sourceIndex) } : {}),
      ...(atom.metadata ? { metadata: atom.metadata } : {})
    };
  });
  const normalizedAtomById = new Map(normalizedAtoms.map(atom => [atom.id, atom]));
  const graph = {
    atoms: normalizedAtoms,
    bonds: (input.graph?.bonds || []).map(bond => {
      const atomA = normalizedAtomById.get(String(bond.atomA || ""));
      const atomB = normalizedAtomById.get(String(bond.atomB || ""));
      const measuredLength = atomA && atomB
        ? Math.hypot(atomA.x - atomB.x, atomA.y - atomB.y, atomA.z - atomB.z)
        : undefined;
      return {
        id: String(bond.id || ""),
        atomA: String(bond.atomA || ""),
        atomB: String(bond.atomB || ""),
        order: Number(bond.order),
        type: bond.type || "covalent",
        ...(bond.stereo ? { stereo: String(bond.stereo) } : {}),
        ...(Number.isFinite(Number(bond.length)) ? { length: Number(bond.length) } :
          Number.isFinite(measuredLength) ? { length: measuredLength } : {})
      };
    }),
    functionalGroups: Array.isArray(input.graph?.functionalGroups) ? input.graph.functionalGroups : []
  };

  const identity = {
    query: String(input.identity?.query || ""),
    name: String(input.identity?.name || input.identity?.query || "Unknown compound"),
    formula: String(input.identity?.formula || calculateMolecularFormula(graph.atoms)),
    ...(input.identity?.cid !== undefined && input.identity?.cid !== null ? { cid: Number(input.identity.cid) } : {}),
    ...(input.identity?.canonicalSmiles ? { canonicalSmiles: String(input.identity.canonicalSmiles) } : {}),
    ...(input.identity?.isomericSmiles ? { isomericSmiles: String(input.identity.isomericSmiles) } : {}),
    ...(input.identity?.inchi ? { inchi: String(input.identity.inchi) } : {}),
    ...(input.identity?.inchiKey ? { inchiKey: String(input.identity.inchiKey) } : {}),
    ...(input.identity?.formalCharge !== undefined ? { formalCharge: Number(input.identity.formalCharge) } : {})
  };

  const coordinates = {
    dimension: Number(input.coordinates?.dimension || 3),
    kind: input.coordinates?.kind || "source_3d",
    units: input.coordinates?.units || "angstrom",
    ...(input.coordinates?.method ? { method: String(input.coordinates.method) } : {})
  };

  const provenance = {
    provider: String(input.provenance?.provider || "unknown"),
    providerLabel: String(input.provenance?.providerLabel || input.provenance?.provider || "Unknown source"),
    sourceId: input.provenance?.sourceId === undefined ? null : String(input.provenance.sourceId),
    ...(input.provenance?.sourceUrl ? { sourceUrl: String(input.provenance.sourceUrl) } : {}),
    retrievedAt: String(input.provenance?.retrievedAt || new Date().toISOString()),
    ...(Number.isInteger(input.provenance?.sourceAtomCount) ? { sourceAtomCount: input.provenance.sourceAtomCount } : {}),
    ...(Number.isInteger(input.provenance?.sourceBondCount) ? { sourceBondCount: input.provenance.sourceBondCount } : {})
  };

  const validation = validateMolecularGraph(graph, identity, provenance);
  const result = {
    schemaVersion: "1.0.0",
    status: validation.valid ? (validation.warnings.length ? "VALID_WITH_WARNINGS" : "VALID") : "INVALID",
    identity,
    graph,
    coordinates,
    provenance,
    validation,
    ...(input.geometry ? { geometry: String(input.geometry) } : {})
  };

  const structureErrors = validateStructureResult(result, { allowInvalidStatus: true });
  if (structureErrors.length) {
    result.validation.valid = false;
    result.validation.errors = [...new Set([...result.validation.errors, ...structureErrors])];
    result.status = "INVALID";
  }
  return result;
}

export function validateStructureResult(result, options = {}) {
  const errors = [];
  if (!result || typeof result !== "object") return ["The structure result is not an object."];
  if (result.schemaVersion !== "1.0.0") errors.push("Unsupported structure result schema version.");
  if (!result.identity || typeof result.identity !== "object") errors.push("The structure identity block is missing.");
  if (!result.graph || !Array.isArray(result.graph.atoms) || !Array.isArray(result.graph.bonds)) {
    errors.push("The molecular graph block is incomplete.");
  }
  if (!result.coordinates || !COORDINATE_KINDS.has(result.coordinates.kind)) {
    errors.push("The coordinate provenance kind is missing or unsupported.");
  }
  if (result.coordinates && result.coordinates.dimension !== 2 && result.coordinates.dimension !== 3) {
    errors.push("The coordinate dimensionality must be 2 or 3.");
  }
  if (result.coordinates?.dimension === 3 && result.coordinates?.kind === "source_2d") {
    errors.push("A 2D source cannot be labeled as a 3D coordinate set.");
  }
  if (result.coordinates?.dimension === 2 && result.coordinates?.kind !== "source_2d") {
    errors.push("A non-2D coordinate kind cannot be labeled as 2D.");
  }
  if (result.coordinates && result.coordinates.units !== "angstrom") {
    errors.push("Molecular coordinates must declare angstrom units.");
  }
  if (!result.provenance || typeof result.provenance.provider !== "string" || !result.provenance.provider) {
    errors.push("Structure source provenance is missing.");
  }
  if (result.identity && (!result.identity.name || !result.identity.formula)) {
    errors.push("The structure identity must include a name and molecular formula.");
  }
  if (result.validation && result.validation.valid === false && !options.allowInvalidStatus) {
    errors.push(...(result.validation.errors || ["The molecular graph did not pass validation."]));
  }
  return [...new Set(errors)];
}

export function assertValidStructureResult(result) {
  const contractErrors = validateStructureResult(result);
  const graphValidation = result?.graph
    ? validateMolecularGraph(result.graph, result.identity, result.provenance)
    : { valid: false, errors: [] };
  const allErrors = [...new Set([...contractErrors, ...graphValidation.errors])];
  if (allErrors.length) throw new Error(allErrors.join(" "));
  return { ...result, validation: graphValidation, status: graphValidation.warnings.length ? "VALID_WITH_WARNINGS" : "VALID" };
}

export const CHEMISTRY_CONTRACT_LIMITS = Object.freeze({ maxQueryLength: MAX_QUERY_LENGTH, maxAtoms: MAX_ATOMS, maxBonds: MAX_BONDS });

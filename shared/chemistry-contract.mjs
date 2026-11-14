const MAX_QUERY_LENGTH = 220;
const MAX_ATOMS = 1200;
const MAX_BONDS = 2400;

const ELEMENTS = new Set((
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
  "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce " +
  "Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn " +
  "Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
).split(/\\s+/));

const COORDINATE_KINDS = new Set(["source_3d", "generated_3d", "local_library_3d", "source_2d"]);
const COORDINATE_ORIGINS = new Set(["source_supplied", "generated", "local_library", "unknown"]);
const EVIDENCE_KINDS = new Set(["source_record", "generated", "local_library", "not_verified"]);
const BOND_TYPES = new Set(["covalent", "ionic", "hydrogen", "aromatic"]);
const BOND_ORDERS = new Set([1, 1.5, 2, 3]);

export function normalizeElementSymbol(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[A-Za-z]{1,2}$/.test(trimmed)) return null;
  const symbol = trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
  return ELEMENTS.has(symbol) ? symbol : null;
}

function normalizeFormulaDigits(value) {
  return String(value || "").normalize("NFKC").replace(/[₀-₉]/g, digit =>
    String("₀₁₂₃₄₅₆₇₈₉".indexOf(digit))
  );
}

function parseFormulaSegment(segment) {
  let index = 0;
  const readCount = () => {
    const start = index;
    while (/[0-9]/.test(segment[index] || "")) index += 1;
    if (start === index) return 1;
    const count = Number(segment.slice(start, index));
    return Number.isSafeInteger(count) && count > 0 && count <= 100000 ? count : null;
  };

  const parseGroup = closing => {
    const counts = new Map();
    let hasTerms = false;
    while (index < segment.length) {
      const char = segment[index];
      if (closing && char === closing) {
        index += 1;
        return hasTerms ? counts : null;
      }
      if (char === "(" || char === "[") {
        index += 1;
        const nested = parseGroup(char === "(" ? ")" : "]");
        if (!nested) return null;
        const multiplier = readCount();
        if (!multiplier) return null;
        for (const [element, count] of nested) {
          counts.set(element, (counts.get(element) || 0) + count * multiplier);
        }
        hasTerms = true;
        continue;
      }
      if (!/[A-Z]/.test(char)) return null;
      let element = char;
      index += 1;
      if (/[a-z]/.test(segment[index] || "")) element += segment[index++];
      if (!ELEMENTS.has(element)) return null;
      const multiplier = readCount();
      if (!multiplier) return null;
      counts.set(element, (counts.get(element) || 0) + multiplier);
      hasTerms = true;
    }
    return closing || !hasTerms ? null : counts;
  };

  const parsed = parseGroup("");
  return parsed && index === segment.length ? parsed : null;
}

function parseMolecularFormulaCounts(value) {
  if (typeof value !== "string") return null;
  let formula = normalizeFormulaDigits(value).replace(/\\s+/g, "");
  if (!formula || formula.length > 100) return null;

  // Explicit caret charge notation is unambiguous. A terminal sign is also
  // accepted; for a single-element ion such as Fe3+, the trailing number is charge.
  formula = formula.replace(/\\^\\d*[+-]$/, "").replace(/[+-]$/, "");
  const singleElementIon = /^([A-Z][a-z]?)(\\d+)$/.exec(formula);
  if (singleElementIon && ELEMENTS.has(singleElementIon[1])) formula = singleElementIon[1];
  if (!formula) return null;

  const total = new Map();
  const segments = formula.split(/[·.]/);
  if (segments.some(segment => !segment)) return null;
  for (const segment of segments) {
    const multiplierMatch = /^(\\d+)(?=[A-Z[(])/.exec(segment);
    const multiplier = multiplierMatch ? Number(multiplierMatch[1]) : 1;
    const body = multiplierMatch ? segment.slice(multiplierMatch[1].length) : segment;
    if (!Number.isSafeInteger(multiplier) || multiplier <= 0 || multiplier > 100000) return null;
    const counts = parseFormulaSegment(body);
    if (!counts) return null;
    for (const [element, count] of counts) {
      total.set(element, (total.get(element) || 0) + count * multiplier);
    }
  }
  return total.size ? total : null;
}

function formulaCountsEqual(left, right) {
  if (!left || !right || left.size !== right.size) return false;
  for (const [element, count] of left) {
    if (right.get(element) !== count) return false;
  }
  return true;
}

export function normalizeCompoundName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\\u2010-\\u2015]/g, "-")
    .replace(/\\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isMolecularFormula(value) {
  return parseMolecularFormulaCounts(value) !== null;
}

export function normalizeCompoundInput(value) {
  if (typeof value !== "string") throw new Error("Enter a compound name, formula, CID, InChIKey, InChI, or SMILES string.");
  const query = value.normalize("NFKC").replace(/[\\u0000-\\u001f\\u007f]/g, "").trim().replace(/\\s+/g, " ");
  if (!query) throw new Error("The compound identifier is empty.");
  if (query.length > MAX_QUERY_LENGTH) throw new Error("The compound identifier exceeds the supported 220-character limit.");

  const cid = /^(?:cid\\s*:?\\s*|pubchem\\s+cid\\s+|pubchem\\s*:\\s*)(\\d+)$/i.exec(query);
  if (cid) {
    const number = Number(cid[1]);
    if (!Number.isSafeInteger(number) || number <= 0) throw new Error("The PubChem CID must be a positive integer.");
    return { original: query, kind: "cid", identifier: String(number) };
  }

  const smiles = /^smiles\\s*:\\s*(.*)$/is.exec(query);
  if (smiles) {
    const identifier = smiles[1].trim();
    if (!identifier) throw new Error("The SMILES identifier is empty.");
    return { original: query, kind: "smiles", identifier };
  }

  const inchi = /^inchi\\s*:\\s*(InChI=.+)$/is.exec(query) || /^(InChI=.+)$/is.exec(query);
  if (inchi) return { original: query, kind: "inchi", identifier: inchi[1].trim() };

  const inchiKey = /^inchikey\\s*:\\s*([A-Z]{14}-[A-Z]{10}-[A-Z])$/i.exec(query)
    || /^([A-Z]{14}-[A-Z]{10}-[A-Z])$/i.exec(query);
  if (inchiKey) return { original: query, kind: "inchikey", identifier: inchiKey[1].toUpperCase() };

  const explicitFormula = /^formula\\s*:\\s*(.+)$/i.exec(query);
  if (explicitFormula) {
    const formula = normalizeFormulaDigits(explicitFormula[1]).replace(/\\s+/g, "");
    if (!isMolecularFormula(formula)) throw new Error("The supplied molecular formula is not in a supported formula format.");
    return { original: query, kind: "formula", identifier: formula };
  }

  const formula = normalizeFormulaDigits(query).replace(/\\s+/g, "");
  if (isMolecularFormula(formula)) return { original: query, kind: "formula", identifier: formula };
  return {
    original: query,
    kind: "name",
    identifier: query,
    lookupKey: normalizeCompoundName(query)
  };
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

function getConnectedComponentDetails(atoms, bonds) {
  const adjacency = new Map((atoms || []).map(atom => [atom.id, []]));
  for (const bond of bonds || []) {
    if (adjacency.has(bond.atomA) && adjacency.has(bond.atomB)) {
      adjacency.get(bond.atomA).push(bond.atomB);
      adjacency.get(bond.atomB).push(bond.atomA);
    }
  }

  const atomById = new Map((atoms || []).map(atom => [atom.id, atom]));
  const visited = new Set();
  const components = [];
  for (const atom of atoms || []) {
    if (visited.has(atom.id)) continue;
    const stack = [atom.id];
    const component = [];
    visited.add(atom.id);
    while (stack.length) {
      const current = stack.pop();
      component.push(atomById.get(current));
      for (const next of adjacency.get(current) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
    components.push(component);
  }

  return {
    count: components.length,
    atomCounts: components.map(component => component.length),
    formulas: components.map(component => calculateMolecularFormula(component))
  };
}

export function countConnectedComponents(atoms, bonds) {
  return getConnectedComponentDetails(atoms, bonds).count;
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
  const atomById = new Map();
  const canonicalAtoms = [];
  for (let index = 0; index < atoms.length; index++) {
    const atom = atoms[index];
    const id = typeof atom?.id === "string" ? atom.id.trim() : "";
    if (!id) errors.push("Atom " + (index + 1) + " has no stable identifier.");
    else if (atomIds.has(id)) errors.push("Duplicate atom identifier: " + id + ".");
    if (id && !atomById.has(id)) atomById.set(id, atom);
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

  const canonicalAtomById = new Map(canonicalAtoms.map(atom => [atom.id, atom]));
  const bondIds = new Set();
  const endpointPairs = new Set();
  const canonicalBonds = [];
  for (let index = 0; index < bonds.length; index++) {
    const bond = bonds[index];
    const id = typeof bond?.id === "string" ? bond.id.trim() : "";
    if (!id) errors.push("Bond " + (index + 1) + " has no stable identifier.");
    else if (bondIds.has(id)) errors.push("Duplicate bond identifier: " + id + ".");
    bondIds.add(id);

    const atomA = typeof bond?.atomA === "string" ? bond.atomA.trim() : "";
    const atomB = typeof bond?.atomB === "string" ? bond.atomB.trim() : "";
    const atomAExists = atomIds.has(atomA) && !!atomA;
    const atomBExists = atomIds.has(atomB) && !!atomB;
    if (!atomAExists || !atomBExists) errors.push("Bond " + (id || index + 1) + " references a missing atom.");
    if (atomA && atomA === atomB) errors.push("Bond " + (id || index + 1) + " connects an atom to itself.");

    if (atomA && atomB) {
      const pair = [atomA, atomB].sort().join("\\u0000");
      if (endpointPairs.has(pair)) errors.push("The graph contains more than one bond between the same atom pair.");
      endpointPairs.add(pair);
    }

    const order = Number(bond?.order);
    if (!BOND_ORDERS.has(order)) errors.push("Bond " + (id || index + 1) + " has an unsupported bond order.");
    const type = bond?.type;
    if (!BOND_TYPES.has(type)) errors.push("Bond " + (id || index + 1) + " has an unsupported bond type.");
    if (type === "aromatic" && order !== 1.5) errors.push("Aromatic bond " + (id || index + 1) + " must use normalized bond order 1.5.");
    if (order === 1.5 && type !== "aromatic") errors.push("Bond " + (id || index + 1) + " uses aromatic bond order without aromatic type.");

    const suppliedLength = bond?.length === undefined || bond?.length === null ? undefined : Number(bond.length);
    if (suppliedLength !== undefined && (!Number.isFinite(suppliedLength) || suppliedLength <= 0)) {
      errors.push("Bond " + (id || index + 1) + " has an invalid coordinate-derived length.");
    }
    const a = canonicalAtomById.get(atomA);
    const b = canonicalAtomById.get(atomB);
    const coordinateLength = a && b && [a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite)
      ? Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
      : undefined;
    if (coordinateLength !== undefined && coordinateLength <= 1e-6) {
      errors.push("Bond " + (id || index + 1) + " joins atoms with coincident coordinates.");
    }
    const length = suppliedLength === undefined ? coordinateLength : suppliedLength;
    canonicalBonds.push({ ...bond, id, atomA, atomB, order, type, ...(length !== undefined ? { length } : {}) });
  }

  for (const group of Array.isArray(graph?.functionalGroups) ? graph.functionalGroups : []) {
    if (!Array.isArray(group?.atomIds) || group.atomIds.some(id => !atomIds.has(id))) {
      errors.push("Functional group " + (group?.id || "unnamed") + " references a missing atom.");
    }
  }

  const formula = calculateMolecularFormula(canonicalAtoms);
  const totalFormalCharge = canonicalAtoms.reduce((total, atom) => total + (Number.isInteger(atom.charge) ? atom.charge : 0), 0);
  const components = getConnectedComponentDetails(canonicalAtoms, canonicalBonds);
  const expectedFormula = parseMolecularFormulaCounts(identity?.formula);
  const actualFormula = parseMolecularFormulaCounts(formula);
  const formulaConsistent = !!expectedFormula && formulaCountsEqual(expectedFormula, actualFormula);
  if (!identity?.formula || !expectedFormula) {
    errors.push("The source molecular formula is missing or cannot be parsed.");
  } else if (!formulaConsistent) {
    errors.push("The graph-derived formula (" + formula + ") does not match the source formula (" + identity.formula + ").");
  }

  const hasSourceCharge = identity?.formalCharge !== undefined && identity?.formalCharge !== null;
  const expectedCharge = hasSourceCharge ? Number(identity.formalCharge) : undefined;
  const chargeConsistent = !hasSourceCharge || (Number.isInteger(expectedCharge) && expectedCharge === totalFormalCharge);
  if (hasSourceCharge && !Number.isInteger(expectedCharge)) {
    errors.push("The source net formal charge is not an integer.");
  } else if (hasSourceCharge && !chargeConsistent) {
    errors.push("The graph-derived net charge (" + totalFormalCharge + ") does not match the source charge (" + expectedCharge + ").");
  }

  if (components.count > 1) {
    warnings.push("The structure contains " + components.count + " disconnected components; this can be valid for salts or multi-fragment records.");
  }
  if (Number.isInteger(provenance?.sourceAtomCount) && provenance.sourceAtomCount !== atoms.length) {
    errors.push("The accepted atom count does not match the provider record.");
  }
  if (Number.isInteger(provenance?.sourceBondCount) && provenance.sourceBondCount !== bonds.length) {
    errors.push("The accepted bond count does not match the provider record.");
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    atomCount: atoms.length,
    bondCount: bonds.length,
    connectedComponents: components.count,
    componentAtomCounts: components.atomCounts,
    componentFormulas: components.formulas,
    formulaFromGraph: formula,
    formulaConsistent,
    formalChargeFromGraph: totalFormalCharge,
    chargeConsistent
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
        type: bond.type,
        ...(bond.stereo ? { stereo: String(bond.stereo) } : {}),
        ...(bond.sourceIndex !== undefined ? { sourceIndex: Number(bond.sourceIndex) } : {}),
        ...(bond.metadata ? { metadata: bond.metadata } : {}),
        ...(bond.length !== undefined && bond.length !== null ? { length: Number(bond.length) } :
          Number.isFinite(measuredLength) ? { length: measuredLength } : {})
      };
    }),
    functionalGroups: Array.isArray(input.graph?.functionalGroups) ? input.graph.functionalGroups : [],
    ...(input.graph?.metadata ? { metadata: input.graph.metadata } : {})
  };

  const identity = {
    query: String(input.identity?.query || ""),
    name: String(input.identity?.name || ""),
    formula: String(input.identity?.formula || ""),
    ...(input.identity?.cid !== undefined && input.identity?.cid !== null ? { cid: Number(input.identity.cid) } : {}),
    ...(input.identity?.canonicalSmiles ? { canonicalSmiles: String(input.identity.canonicalSmiles) } : {}),
    ...(input.identity?.isomericSmiles ? { isomericSmiles: String(input.identity.isomericSmiles) } : {}),
    ...(input.identity?.inchi ? { inchi: String(input.identity.inchi) } : {}),
    ...(input.identity?.inchiKey ? { inchiKey: String(input.identity.inchiKey) } : {}),
    ...(input.identity?.formalCharge !== undefined && input.identity?.formalCharge !== null ? { formalCharge: Number(input.identity.formalCharge) } : {})
  };

  const coordinates = {
    dimension: Number(input.coordinates?.dimension ?? 0),
    kind: input.coordinates?.kind || "unknown",
    origin: input.coordinates?.origin || "unknown",
    units: input.coordinates?.units || "",
    ...(input.coordinates?.method ? { method: String(input.coordinates.method) } : {})
  };

  const provenance = {
    provider: String(input.provenance?.provider || ""),
    providerLabel: String(input.provenance?.providerLabel || ""),
    evidence: input.provenance?.evidence || "not_verified",
    sourceId: input.provenance?.sourceId === undefined ? null : String(input.provenance.sourceId),
    ...(input.provenance?.sourceUrl ? { sourceUrl: String(input.provenance.sourceUrl) } : {}),
    retrievedAt: String(input.provenance?.retrievedAt || ""),
    ...(Number.isInteger(input.provenance?.sourceAtomCount) ? { sourceAtomCount: input.provenance.sourceAtomCount } : {}),
    ...(Number.isInteger(input.provenance?.sourceBondCount) ? { sourceBondCount: input.provenance.sourceBondCount } : {})
  };

  const validation = validateMolecularGraph(graph, identity, provenance);
  const result = {
    schemaVersion: "1.1.0",
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
  if (result.schemaVersion !== "1.1.0") errors.push("Unsupported structure result schema version.");
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
  if (!result.coordinates?.method) errors.push("The coordinate-generation or source method is missing.");

  const expectedOrigin = {
    source_3d: "source_supplied",
    source_2d: "source_supplied",
    generated_3d: "generated",
    local_library_3d: "local_library"
  }[result.coordinates?.kind];
  if (expectedOrigin && result.coordinates?.origin !== expectedOrigin) {
    errors.push("The coordinate origin does not match the declared coordinate kind.");
  }

  if (!result.provenance || typeof result.provenance.provider !== "string" || !result.provenance.provider) {
    errors.push("Structure provider provenance is missing.");
  }
  if (!result.provenance?.providerLabel) errors.push("The structure provider label is missing.");
  if (!EVIDENCE_KINDS.has(result.provenance?.evidence)) errors.push("The structure evidence classification is missing or unsupported.");
  const expectedEvidence = {
    source_3d: "source_record",
    source_2d: "source_record",
    generated_3d: "generated",
    local_library_3d: "local_library"
  }[result.coordinates?.kind];
  if (expectedEvidence && result.provenance?.evidence !== expectedEvidence) {
    errors.push("The provenance evidence does not match the coordinate origin.");
  }
  if (!result.provenance?.retrievedAt || !Number.isFinite(Date.parse(result.provenance.retrievedAt))) {
    errors.push("The provider retrieval timestamp is missing or invalid.");
  }
  if (result.identity && (!result.identity.name || !result.identity.formula)) {
    errors.push("The structure identity must include a name and molecular formula.");
  }
  if (result.identity?.formalCharge !== undefined && !Number.isInteger(Number(result.identity.formalCharge))) {
    errors.push("The source net formal charge must be an integer.");
  }
  if (result.validation && result.validation.valid === false && !options.allowInvalidStatus) {
    errors.push(...(result.validation.errors || ["The molecular graph did not pass validation."]));
  }
  if (!["VALID", "VALID_WITH_WARNINGS", "INVALID"].includes(result.status)) {
    errors.push("The structure result status is missing or unsupported.");
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
  if (result?.validation?.valid !== true) throw new Error("The provider result was not marked as a validated molecular structure.");
  return {
    ...result,
    validation: graphValidation,
    status: graphValidation.warnings.length ? "VALID_WITH_WARNINGS" : "VALID"
  };
}

export const CHEMISTRY_CONTRACT_LIMITS = Object.freeze({ maxQueryLength: MAX_QUERY_LENGTH, maxAtoms: MAX_ATOMS, maxBonds: MAX_BONDS });

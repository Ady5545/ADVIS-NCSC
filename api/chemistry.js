"use strict";

let chemistryContractPromise;
function getChemistryContract() {
  if (!chemistryContractPromise) chemistryContractPromise = import("../shared/chemistry-contract.mjs");
  return chemistryContractPromise;
}

const MAX_QUERY_LENGTH = 220;
const MAX_ATOMS = 1200;
const MAX_BONDS = 2400;
const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUBCHEM_PROPERTIES = "IUPACName,MolecularFormula,CanonicalSMILES,IsomericSMILES,InChI,InChIKey";

function cleanQuery(value) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_QUERY_LENGTH)
    : "";
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Accept: "chemical/x-mdl-sdfile, application/json;q=0.9, */*;q=0.5",
      "User-Agent": "ADVIS-Molecular-Workbench/1.0",
      ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(options.headers || {})
    },
    ...(options.body ? { body: options.body } : {}),
    signal: AbortSignal.timeout(18000)
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error("PubChem request failed (" + response.status + ").");
    error.status = response.status;
    throw error;
  }
  return body;
}

async function fetchJson(url, options = {}) {
  const raw = await fetchText(url, options);
  try { return JSON.parse(raw); }
  catch (_) { throw new Error("The chemical reference returned an unreadable response."); }
}

function parseSdf(sdf) {
  const records = String(sdf || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n\$\$\$\$\s*(?:\n|$)/);
  const lines = records[0].split("\n");
  if (lines.length < 5) throw new Error("The chemical reference returned an incomplete SDF record.");

  const countsLine = lines[3] || "";
  const sourceAtoms = [];
  const sourceBonds = [];
  let expectedAtomCount = null;
  let expectedBondCount = null;

  if (countsLine.includes("V3000")) {
    const counts = lines.find(line => /^M\s+V30\s+COUNTS\s+/i.test(line));
    const countMatch = counts && /^M\s+V30\s+COUNTS\s+(\d+)\s+(\d+)/i.exec(counts);
    if (!countMatch) throw new Error("The V3000 structure is missing its atom and bond counts.");
    expectedAtomCount = Number(countMatch[1]);
    expectedBondCount = Number(countMatch[2]);
    if (!Number.isInteger(expectedAtomCount) || expectedAtomCount < 1 || expectedAtomCount > MAX_ATOMS ||
        !Number.isInteger(expectedBondCount) || expectedBondCount < 0 || expectedBondCount > MAX_BONDS) {
      throw new Error("The 3D structure exceeds supported atom or bond limits.");
    }

    let section = "";
    for (const line of lines) {
      if (/^M\s+V30\s+BEGIN\s+ATOM/i.test(line)) { section = "atom"; continue; }
      if (/^M\s+V30\s+END\s+ATOM/i.test(line)) { section = ""; continue; }
      if (/^M\s+V30\s+BEGIN\s+BOND/i.test(line)) { section = "bond"; continue; }
      if (/^M\s+V30\s+END\s+BOND/i.test(line)) { section = ""; continue; }
      if (!/^M\s+V30\s+/.test(line) || section === "") continue;

      const parts = line.trim().split(/\s+/).slice(2);
      if (section === "atom") {
        if (parts.length < 5) throw new Error("The V3000 structure contains an incomplete atom record.");
        const sourceIndex = Number(parts[0]);
        const element = normalizeElementSymbol(parts[1]);
        const x = Number(parts[2]), y = Number(parts[3]), z = Number(parts[4]);
        if (!Number.isInteger(sourceIndex) || sourceIndex < 1 || !element ||
            ![x, y, z].every(Number.isFinite)) {
          throw new Error("The V3000 structure contains an invalid atom or coordinate.");
        }
        const attributes = parts.slice(5);
        const chargeAttribute = attributes.find(value => /^CHG=/i.test(value));
        const massAttribute = attributes.find(value => /^MASS=/i.test(value));
        const stereoAttribute = attributes.find(value => /^CFG=/i.test(value));
        const charge = chargeAttribute ? Number(chargeAttribute.split("=")[1]) : 0;
        const isotope = massAttribute ? Number(massAttribute.split("=")[1]) : undefined;
        if (!Number.isInteger(charge) || (isotope !== undefined && (!Number.isInteger(isotope) || isotope < 1))) {
          throw new Error("The V3000 structure contains invalid charge or isotope metadata.");
        }
        sourceAtoms.push({
          sourceIndex, element, x, y, z, charge,
          ...(isotope !== undefined ? { isotope } : {}),
          ...(stereoAttribute ? { stereo: "V3000_CFG_" + stereoAttribute.split("=")[1] } : {})
        });
      } else if (section === "bond") {
        if (parts.length < 4) throw new Error("The V3000 structure contains an incomplete bond record.");
        const sourceIndex = Number(parts[0]);
        const orderToken = String(parts[1]).toUpperCase();
        const order = orderToken === "AROMATIC" || orderToken === "AROM" ? 4 : Number(orderToken);
        const sourceA = Number(parts[2]), sourceB = Number(parts[3]);
        const stereoAttribute = parts.slice(4).find(value => /^CFG=/i.test(value));
        if (!Number.isInteger(sourceIndex) || ![order, sourceA, sourceB].every(Number.isFinite)) {
          throw new Error("The V3000 structure contains an invalid bond record.");
        }
        sourceBonds.push({
          sourceIndex, sourceA, sourceB, order,
          ...(stereoAttribute ? { stereo: "V3000_CFG_" + stereoAttribute.split("=")[1] } : {})
        });
      }
    }
  } else {
    expectedAtomCount = Number.parseInt(countsLine.slice(0, 3).trim(), 10);
    expectedBondCount = Number.parseInt(countsLine.slice(3, 6).trim(), 10);
    if (!Number.isInteger(expectedAtomCount) || !Number.isInteger(expectedBondCount) ||
        expectedAtomCount < 1 || expectedAtomCount > MAX_ATOMS ||
        expectedBondCount < 0 || expectedBondCount > MAX_BONDS) {
      throw new Error("The V2000 structure has invalid or unsupported atom/bond counts.");
    }

    for (let index = 0; index < expectedAtomCount; index++) {
      const line = lines[4 + index] || "";
      const x = Number(line.slice(0, 10).trim());
      const y = Number(line.slice(10, 20).trim());
      const z = Number(line.slice(20, 30).trim());
      const element = normalizeElementSymbol(line.slice(31, 34).trim());
      const chargeCode = Number(line.slice(36, 39).trim()) || 0;
      const parity = Number(line.slice(39, 42).trim()) || 0;
      const chargeMap = { 1: 3, 2: 2, 3: 1, 5: -1, 6: -2, 7: -3 };
      if (!element || ![x, y, z].every(Number.isFinite)) {
        throw new Error("The V2000 structure contains an invalid atom or coordinate.");
      }
      sourceAtoms.push({
        sourceIndex: index + 1, element, x, y, z, charge: chargeMap[chargeCode] || 0,
        ...(parity === 1 ? { stereo: "TETRAHEDRAL_CW" } :
          parity === 2 ? { stereo: "TETRAHEDRAL_CCW" } :
          parity === 3 ? { stereo: "TETRAHEDRAL_UNSPECIFIED" } : {})
      });
    }

    for (let index = 0; index < expectedBondCount; index++) {
      const line = lines[4 + expectedAtomCount + index] || "";
      const sourceA = Number(line.slice(0, 3).trim());
      const sourceB = Number(line.slice(3, 6).trim());
      const order = Number(line.slice(6, 9).trim());
      const stereoCode = Number(line.slice(9, 12).trim()) || 0;
      if (![sourceA, sourceB, order].every(Number.isFinite)) {
        throw new Error("The V2000 structure contains an invalid bond record.");
      }
      sourceBonds.push({
        sourceIndex: index + 1, sourceA, sourceB, order,
        ...(stereoCode === 1 ? { stereo: "UP" } :
          stereoCode === 6 ? { stereo: "DOWN" } :
          stereoCode === 3 ? { stereo: "EITHER" } : {})
      });
    }

    for (const line of lines) {
      const match = /^M\s+(CHG|ISO)\s+(\d+)\s+(.+)$/i.exec(line.trim());
      if (!match) continue;
      const kind = match[1].toUpperCase();
      const pairCount = Number(match[2]);
      const values = match[3].trim().split(/\s+/);
      if (!Number.isInteger(pairCount) || values.length < pairCount * 2) {
        throw new Error("The V2000 structure contains an incomplete charge/isotope property block.");
      }
      for (let pair = 0; pair < pairCount; pair++) {
        const sourceIndex = Number(values[pair * 2]);
        const value = Number(values[pair * 2 + 1]);
        const atom = sourceAtoms.find(item => item.sourceIndex === sourceIndex);
        if (!atom || !Number.isInteger(value)) throw new Error("The V2000 structure contains invalid atom charge/isotope metadata.");
        if (kind === "CHG") atom.charge = value;
        else atom.isotope = value;
      }
    }
  }

  if (sourceAtoms.length !== expectedAtomCount || sourceBonds.length !== expectedBondCount) {
    throw new Error("The parsed atom/bond counts do not match the source SDF record.");
  }
  if (!sourceAtoms.length || sourceAtoms.length > MAX_ATOMS || sourceBonds.length > MAX_BONDS) {
    throw new Error("The SDF record exceeds supported molecular graph limits.");
  }

  const sourceIndexSet = new Set();
  for (const atom of sourceAtoms) {
    if (sourceIndexSet.has(atom.sourceIndex)) throw new Error("The SDF record contains duplicate source atom indices.");
    sourceIndexSet.add(atom.sourceIndex);
  }

  const idBySource = new Map(sourceAtoms.map(atom => [atom.sourceIndex, "atom_" + atom.sourceIndex]));
  const atoms = sourceAtoms.map(atom => ({
    id: idBySource.get(atom.sourceIndex),
    element: atom.element,
    x: atom.x, y: atom.y, z: atom.z,
    charge: atom.charge || 0,
    ...(atom.isotope !== undefined ? { isotope: atom.isotope } : {}),
    ...(atom.stereo ? { stereo: atom.stereo } : {}),
    sourceIndex: atom.sourceIndex
  }));

  const bonds = sourceBonds.map((bond, index) => {
    const atomA = idBySource.get(bond.sourceA);
    const atomB = idBySource.get(bond.sourceB);
    if (!atomA || !atomB) throw new Error("The SDF record contains a bond to a missing atom.");
    if (atomA === atomB) throw new Error("The SDF record contains a self-referential bond.");
    if (![1, 2, 3, 4].includes(bond.order)) throw new Error("The SDF record contains an unsupported bond order.");
    const aromatic = bond.order === 4;
    return {
      id: "bond_" + (bond.sourceIndex || index + 1),
      atomA, atomB,
      order: aromatic ? 1.5 : bond.order,
      type: aromatic ? "aromatic" : "covalent",
      ...(bond.stereo ? { stereo: bond.stereo } : {})
    };
  });

  return {
    atoms, bonds,
    sourceAtomCount: expectedAtomCount,
    sourceBondCount: expectedBondCount
  };
}

async function resolveCids(input) {
  const encoded = encodeURIComponent(input.identifier);
  if (input.kind === "cid") {
    return { IdentifierList: { CID: [Number(input.identifier)] } };
  }
  if (input.kind === "formula") {
    return fetchJson(PUBCHEM_BASE + "/compound/fastformula/" + encoded + "/cids/JSON?MaxRecords=6");
  }
  if (input.kind === "inchi") {
    return fetchJson(PUBCHEM_BASE + "/compound/inchi/cids/JSON", {
      method: "POST",
      body: "inchi=" + encodeURIComponent(input.identifier)
    });
  }
  return fetchJson(PUBCHEM_BASE + "/compound/" + input.kind + "/" + encoded + "/cids/JSON");
}

async function fetchCandidates(cids) {
  const candidateIds = cids.slice(0, 6).join(",");
  const payload = await fetchJson(
    PUBCHEM_BASE + "/compound/cid/" + candidateIds + "/property/IUPACName,MolecularFormula,CanonicalSMILES,IsomericSMILES,InChIKey/JSON"
  );
  return (payload.PropertyTable?.Properties || []).map(property => ({
    cid: property.CID,
    name: property.IUPACName || ("PubChem compound " + property.CID),
    formula: property.MolecularFormula || "",
    ...(property.CanonicalSMILES ? { canonicalSmiles: property.CanonicalSMILES } : {}),
    ...(property.IsomericSMILES ? { isomericSmiles: property.IsomericSMILES } : {}),
    ...(property.InChIKey ? { inchiKey: property.InChIKey } : {})
  }));
}

async function resolveCompound(query) {
  const { normalizeCompoundInput, buildStructureResult, assertValidStructureResult } = await getChemistryContract();
  const input = normalizeCompoundInput(cleanQuery(query));
  if ((input.kind === "smiles" || input.kind === "inchi") && !input.identifier) {
    const error = new Error("The supplied structure identifier is empty.");
    error.status = 400;
    throw error;
  }

  const cidPayload = await resolveCids(input);
  const cids = cidPayload?.IdentifierList?.CID;
  if (!Array.isArray(cids) || !cids.length) {
    const error = new Error("No matching compound was found in PubChem. Use a precise name, a valid CID, InChIKey, InChI, or an exact SMILES string prefixed with SMILES:.");
    error.status = 404;
    throw error;
  }

  if (cids.length > 1) {
    const candidates = await fetchCandidates(cids);
    const error = new Error(input.kind === "formula"
      ? "This molecular formula matches multiple compounds. Choose a specific candidate or enter its CID; ADVIS will not guess which isomer you intended."
      : "This identifier matches multiple compounds. Choose a specific candidate or enter its CID.");
    error.status = 409;
    error.candidates = candidates;
    error.inputKind = input.kind;
    throw error;
  }

  const cid = Number(cids[0]);
  if (!Number.isSafeInteger(cid) || cid <= 0) throw new Error("PubChem returned an invalid compound identifier.");

  const propertyPayload = await fetchJson(
    PUBCHEM_BASE + "/compound/cid/" + cid + "/property/" + PUBCHEM_PROPERTIES + "/JSON"
  );
  const property = propertyPayload.PropertyTable?.Properties?.[0];
  if (!property) throw new Error("PubChem did not return compound identity metadata.");

  let sdf;
  try {
    sdf = await fetchText(PUBCHEM_BASE + "/compound/cid/" + cid + "/SDF?record_type=3d");
  } catch (error) {
    if (error.status === 404) {
      const unavailable = new Error("PubChem identifies this compound, but no source-supplied 3D conformer is available. ADVIS has not generated or invented coordinates.");
      unavailable.status = 422;
      unavailable.compound = { cid, name: property.IUPACName || query, formula: property.MolecularFormula || "" };
      throw unavailable;
    }
    throw error;
  }

  const graph = parseSdf(sdf);
  const result = buildStructureResult({
    identity: {
      query: input.original,
      name: property.IUPACName || input.identifier,
      formula: property.MolecularFormula || "",
      cid,
      canonicalSmiles: property.CanonicalSMILES,
      isomericSmiles: property.IsomericSMILES,
      inchi: property.InChI,
      inchiKey: property.InChIKey
    },
    graph,
    coordinates: {
      dimension: 3,
      kind: "source_3d",
      units: "angstrom",
      method: "PubChem 3D SDF record"
    },
    provenance: {
      provider: "pubchem",
      providerLabel: "PubChem",
      sourceId: String(cid),
      sourceUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/" + cid,
      retrievedAt: new Date().toISOString(),
      sourceAtomCount: graph.sourceAtomCount,
      sourceBondCount: graph.sourceBondCount
    }
  });

  return assertValidStructureResult(result);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const origin = req.headers?.origin;
  const allowedOrigins = new Set([
    "https://advis-ncsc.vercel.app",
    "https://advis-ncsc-ady19.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ]);
  if (origin && allowedOrigins.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const query = cleanQuery(req.body && (req.body.query || req.body.compound));
  if (!query) return res.status(400).json({ error: "Enter a compound name, formula, CID, InChIKey, InChI, or SMILES structure." });

  try {
    const structure = await resolveCompound(query);
    return res.status(200).json(structure);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    if (status >= 500) console.error("[Molecular Resolver]", error);
    return res.status(status).json({
      error: error.message || "Unable to resolve this compound right now.",
      ...(Array.isArray(error.candidates) ? { candidates: error.candidates } : []),
      ...(error.compound ? { compound: error.compound } : {}),
      ...(error.inputKind ? { inputKind: error.inputKind } : {})
    });
  }
};

module.exports.parseSdf = parseSdf;
module.exports.resolveCompound = resolveCompound;
module.exports.normalizeCompoundInput = async value => (await getChemistryContract()).normalizeCompoundInput(value);

"use strict";

const MAX_QUERY_LENGTH = 220;
const MAX_ATOMS = 1200;
const MAX_BONDS = 2400;

function cleanQuery(value) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_QUERY_LENGTH)
    : "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: "chemical/x-mdl-sdfile, application/json;q=0.9, */*;q=0.5", "User-Agent": "ADVIS-Molecular-Workbench/1.0" },
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

async function fetchJson(url) {
  const raw = await fetchText(url);
  try { return JSON.parse(raw); }
  catch (_) { throw new Error("The chemical reference returned an unreadable response."); }
}

function parseSdf(sdf) {
  const lines = String(sdf || "").replace(/\r/g, "").split("\\n");
  const countsLine = lines[3] || "";
  const atoms = [];
  const bonds = [];

  if (countsLine.includes("V3000")) {
    let section = "";
    for (const line of lines) {
      if (line.includes("M  V30 BEGIN ATOM")) { section = "atom"; continue; }
      if (line.includes("M  V30 END ATOM")) { section = ""; continue; }
      if (line.includes("M  V30 BEGIN BOND")) { section = "bond"; continue; }
      if (line.includes("M  V30 END BOND")) { section = ""; continue; }
      if (!line.includes("M  V30 ")) continue;
      const parts = line.trim().split(/\s+/).slice(2);
      if (section === "atom" && parts.length >= 6) {
        const index = Number(parts[0]);
        const element = parts[1];
        const x = Number(parts[2]), y = Number(parts[3]), z = Number(parts[4]);
        if (!Number.isInteger(index) || !element || ![x,y,z].every(Number.isFinite)) continue;
        const chargeToken = parts.find(p => p.startsWith("CHG="));
        atoms.push({ sourceIndex: index, element, x, y, z, charge: chargeToken ? Number(chargeToken.slice(4)) : 0 });
      } else if (section === "bond" && parts.length >= 4) {
        const order = Number(parts[1]), a = Number(parts[2]), b = Number(parts[3]);
        if ([order,a,b].every(Number.isFinite)) bonds.push({ sourceA: a, sourceB: b, order });
      }
    }
  } else {
    const atomCount = Number.parseInt(countsLine.slice(0, 3).trim(), 10);
    const bondCount = Number.parseInt(countsLine.slice(3, 6).trim(), 10);
    if (!Number.isInteger(atomCount) || !Number.isInteger(bondCount) || atomCount < 1 || atomCount > MAX_ATOMS || bondCount < 0 || bondCount > MAX_BONDS) {
      throw new Error("The 3D structure uses an unsupported or invalid atom/bond block.");
    }
    for (let i = 0; i < atomCount; i++) {
      const line = lines[4 + i] || "";
      const x = Number(line.slice(0, 10).trim());
      const y = Number(line.slice(10, 20).trim());
      const z = Number(line.slice(20, 30).trim());
      const element = line.slice(31, 34).trim();
      if (!element || ![x,y,z].every(Number.isFinite)) throw new Error("The 3D structure contains an invalid atom coordinate.");
      const chargeCode = Number(line.slice(36, 39).trim()) || 0;
      const chargeMap = { 1: 3, 2: 2, 3: 1, 5: -1, 6: -2, 7: -3 };
      atoms.push({ sourceIndex: i + 1, element, x, y, z, charge: chargeMap[chargeCode] || 0 });
    }
    for (const line of lines) {
      if (!/^M  CHG\s/.test(line)) continue;
      const values = line.trim().split(/\s+/);
      const pairCount = Number(values[2]) || 0;
      for (let pair = 0; pair < pairCount; pair++) {
        const sourceIndex = Number(values[3 + pair * 2]);
        const formalCharge = Number(values[4 + pair * 2]);
        const atom = atoms.find(item => item.sourceIndex === sourceIndex);
        if (atom && Number.isFinite(formalCharge)) atom.charge = formalCharge;
      }
    }
    for (let i = 0; i < bondCount; i++) {
      const line = lines[4 + atomCount + i] || "";
      const a = Number(line.slice(0, 3).trim());
      const b = Number(line.slice(3, 6).trim());
      const order = Number(line.slice(6, 9).trim());
      if (![a,b,order].every(Number.isFinite)) throw new Error("The 3D structure contains an invalid bond record.");
      bonds.push({ sourceA: a, sourceB: b, order });
    }
  }

  if (!atoms.length || atoms.length > MAX_ATOMS || bonds.length > MAX_BONDS) throw new Error("No usable 3D molecular coordinates were found.");
  const idBySource = new Map(atoms.map((atom, index) => [atom.sourceIndex, "atom_" + index]));
  const normalizedAtoms = atoms.map((atom, index) => ({
    id: "atom_" + index,
    element: atom.element,
    x: atom.x, y: atom.y, z: atom.z,
    charge: atom.charge || 0
  }));
  const normalizedBonds = bonds.map((bond, index) => {
    const atomA = idBySource.get(bond.sourceA);
    const atomB = idBySource.get(bond.sourceB);
    if (!atomA || !atomB) return null;
    const aromatic = bond.order === 4;
    return {
      id: "bond_" + index,
      atomA, atomB,
      order: aromatic ? 1.5 : bond.order,
      type: aromatic ? "aromatic" : "covalent"
    };
  }).filter(Boolean);
  if (normalizedBonds.length !== bonds.length) throw new Error("The molecular graph contains a bond to a missing atom.");
  return { atoms: normalizedAtoms, bonds: normalizedBonds };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const origin = req.headers.origin;
  const allowedOrigins = new Set(["https://advis-ncsc.vercel.app", "https://advis-ncsc-ady19.vercel.app", "http://localhost:5173", "http://localhost:3000"]);
  if (origin && allowedOrigins.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const query = cleanQuery(req.body && (req.body.query || req.body.compound));
  if (!query) return res.status(400).json({ error: "Enter a compound name or a SMILES structure." });

  // A molecular formula alone cannot identify a unique structure when isomers exist.
  if (/^[A-Z][A-Za-z]?(?:\d+(?:[A-Z][A-Za-z]?\d*)?)+[+-]?$/.test(query.replace(/\s/g, "")) && !/[\s]/.test(query)) {
    return res.status(422).json({ error: "A molecular formula can describe multiple isomers. Enter the compound's name or an exact SMILES string to identify its structure." });
  }

  try {
    const isSmiles = /^smiles:/i.test(query);
    const directCid = /^(?:pubchem\s*)?cid\s*:\s*(\d+)$/i.exec(query);
    const identifier = isSmiles ? query.replace(/^smiles:/i, "").trim() : query;
    if (!identifier) return res.status(400).json({ error: "The SMILES string is empty." });
    const namespace = isSmiles ? "smiles" : "name";
    const encoded = encodeURIComponent(identifier);
    const cidPayload = directCid
      ? { IdentifierList: { CID: [Number(directCid[1])] } }
      : await fetchJson("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/" + namespace + "/" + encoded + "/cids/JSON");
    const cids = cidPayload && cidPayload.IdentifierList && cidPayload.IdentifierList.CID;
    if (!Array.isArray(cids) || !cids.length) return res.status(404).json({ error: "No matching compound was found in PubChem. Try a more precise name or prefix an exact SMILES string with SMILES:." });
    if (cids.length > 1) {
      const candidateIds = cids.slice(0, 5).join(",");
      const candidatePayload = await fetchJson("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + candidateIds + "/property/IUPACName,MolecularFormula,CanonicalSMILES/JSON");
      const candidates = (candidatePayload.PropertyTable && candidatePayload.PropertyTable.Properties || []).map(p => ({
        cid: p.CID, name: p.IUPACName || ("PubChem compound " + p.CID), formula: p.MolecularFormula || ""
      }));
      return res.status(409).json({ error: "This input matches more than one compound. Choose a specific name or SMILES structure, or enter one of the returned CID values as CID:123.", candidates });
    }

    const cid = cids[0];
    const propertyPayload = await fetchJson("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + cid + "/property/IUPACName,MolecularFormula,CanonicalSMILES,InChIKey/JSON");
    const property = propertyPayload.PropertyTable && propertyPayload.PropertyTable.Properties && propertyPayload.PropertyTable.Properties[0];
    if (!property) throw new Error("PubChem did not return compound identity metadata.");

    let sdf;
    try {
      sdf = await fetchText("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + cid + "/SDF?record_type=3d");
    } catch (error) {
      if (error.status === 404) {
        return res.status(422).json({ error: "PubChem identifies this compound, but it has no available 3D conformer. ADVIS will not invent 3D coordinates for it.", compound: { cid, name: property.IUPACName, formula: property.MolecularFormula } });
      }
      throw error;
    }
    const graph = parseSdf(sdf);
    return res.status(200).json({
      ...graph,
      metadata: {
        cid,
        name: property.IUPACName || query,
        formula: property.MolecularFormula || "",
        canonicalSmiles: property.CanonicalSMILES || "",
        inchiKey: property.InChIKey || "",
        source: "PubChem",
        sourceUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/" + cid,
        coordinateType: "PUBCHEM_3D_CONFORMER",
        coordinateUnits: "angstrom"
      }
    });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    console.error("[Molecular Resolver]", error);
    return res.status(status).json({ error: error.message || "Unable to resolve this compound right now." });
  }
};

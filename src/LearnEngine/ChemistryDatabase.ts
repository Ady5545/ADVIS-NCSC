export interface ChemicalEntity {
  formula: string;
  name: string;
  centralAtom?: string;
  ligands?: { atom: string, count: number }[];
  valenceElectrons: number;
  geometry: string;
  hybridization?: string;
  bondType: 'COVALENT' | 'IONIC';
  lonePairs?: number;
}

export const CHEMISTRY_DATABASE: Record<string, ChemicalEntity> = {
  "O2": {
    formula: "O2",
    name: "Oxygen Gas",
    valenceElectrons: 12,
    geometry: "Linear",
    bondType: "COVALENT",
  },
  "N2": {
    formula: "N2",
    name: "Nitrogen Gas",
    valenceElectrons: 10,
    geometry: "Linear",
    bondType: "COVALENT",
  },
  "C2H5OH": {
    formula: "C2H5OH",
    name: "Ethanol",
    valenceElectrons: 20,
    geometry: "Chain",
    bondType: "COVALENT",
  },
  "C6H12O6": {
    formula: "C6H12O6",
    name: "Glucose",
    valenceElectrons: 72,
    geometry: "Pyranose Ring",
    bondType: "COVALENT",
  },
  "C6H6": {
    formula: "C6H6",
    name: "Benzene",
    valenceElectrons: 30,
    geometry: "Planar Ring",
    bondType: "COVALENT",
  },

  "H2O": {
    formula: "H2O",
    name: "Water",
    centralAtom: "O",
    ligands: [{ atom: "H", count: 2 }],
    valenceElectrons: 8,
    geometry: "Bent",
    hybridization: "sp3",
    bondType: "COVALENT",
    lonePairs: 2
  },
  "CO2": {
    formula: "CO2",
    name: "Carbon Dioxide",
    centralAtom: "C",
    ligands: [{ atom: "O", count: 2 }],
    valenceElectrons: 16,
    geometry: "Linear",
    hybridization: "sp",
    bondType: "COVALENT",
    lonePairs: 0 // on central atom
  },
  "CH4": {
    formula: "CH4",
    name: "Methane",
    centralAtom: "C",
    ligands: [{ atom: "H", count: 4 }],
    valenceElectrons: 8,
    geometry: "Tetrahedral",
    hybridization: "sp3",
    bondType: "COVALENT",
    lonePairs: 0
  },
  "BF3": {
    formula: "BF3",
    name: "Boron Trifluoride",
    centralAtom: "B",
    ligands: [{ atom: "F", count: 3 }],
    valenceElectrons: 24,
    geometry: "Trigonal Planar",
    hybridization: "sp2",
    bondType: "COVALENT",
    lonePairs: 0
  },
  "NH3": {
    formula: "NH3",
    name: "Ammonia",
    centralAtom: "N",
    ligands: [{ atom: "H", count: 3 }],
    valenceElectrons: 8,
    geometry: "Trigonal Pyramidal",
    hybridization: "sp3",
    bondType: "COVALENT",
    lonePairs: 1
  },
  "NaCl": {
    formula: "NaCl",
    name: "Sodium Chloride",
    valenceElectrons: 8,
    geometry: "Lattice", // simplistic
    bondType: "IONIC"
  }
};

export function normalizeChemicalInput(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();
  // Strip unicode subscripts
  str = str.replace(/₀/g, '0')
           .replace(/₁/g, '1')
           .replace(/₂/g, '2')
           .replace(/₃/g, '3')
           .replace(/₄/g, '4')
           .replace(/₅/g, '5')
           .replace(/₆/g, '6')
           .replace(/₇/g, '7')
           .replace(/₈/g, '8')
           .replace(/₉/g, '9');
  
  // Clean unmatched trailing bracket/paren typos like "C2)" or "c2h5oh)"
  str = str.replace(/[\)\}\]\s]+$/, '');
  
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ');
  return str;
}

const ALIAS_MAP: Record<string, string> = {
  "glucose": "C6H12O6",
  "d-glucose": "C6H12O6",
  "sugar": "C6H12O6",
  "c6h12o6": "C6H12O6",
  
  "water": "H2O",
  "h2o": "H2O",
  "dihydrogen monoxide": "H2O",
  
  "boron trifluoride": "BF3",
  "bf3": "BF3",
  
  "benzene": "C6H6",
  "c6h6": "C6H6",
  "benzol": "C6H6",
  
  "ethanol": "C2H5OH",
  "c2h5oh": "C2H5OH",
  "ethyl alcohol": "C2H5OH",
  "alcohol": "C2H5OH",
  "c2": "C2H5OH",
  "c2)": "C2H5OH",
  
  "methane": "CH4",
  "ch4": "CH4",
  "natural gas": "CH4",
  
  "ammonia": "NH3",
  "nh3": "NH3",
  
  "carbon dioxide": "CO2",
  "co2": "CO2",
  
  "sodium chloride": "NaCl",
  "nacl": "NaCl",
  "table salt": "NaCl",
  "salt": "NaCl",
  
  "oxygen": "O2",
  "oxygen gas": "O2",
  "o2": "O2",
  
  "nitrogen": "N2",
  "nitrogen gas": "N2",
  "n2": "N2"
};

export function resolveChemicalEntity(input: string): ChemicalEntity | null {
  if (!input) return null;
  const clean = normalizeChemicalInput(input);
  const lower = clean.toLowerCase();

  // 1. Direct Alias Match
  if (ALIAS_MAP[lower]) {
    const key = ALIAS_MAP[lower];
    if (CHEMISTRY_DATABASE[key]) return CHEMISTRY_DATABASE[key];
  }

  // 2. Direct Formula Match (case-insensitive)
  const dbKey = Object.keys(CHEMISTRY_DATABASE).find(
    k => k.toLowerCase() === lower || CHEMISTRY_DATABASE[k].formula.toLowerCase() === lower
  );
  if (dbKey) return CHEMISTRY_DATABASE[dbKey];

  // 3. Direct Name Match (case-insensitive)
  const dbNameKey = Object.keys(CHEMISTRY_DATABASE).find(
    k => CHEMISTRY_DATABASE[k].name.toLowerCase() === lower
  );
  if (dbNameKey) return CHEMISTRY_DATABASE[dbNameKey];

  // 4. Substring Match inside Name/Formula
  const subKey = Object.keys(CHEMISTRY_DATABASE).find(
    k => lower.includes(k.toLowerCase()) || lower.includes(CHEMISTRY_DATABASE[k].name.toLowerCase())
  );
  if (subKey) return CHEMISTRY_DATABASE[subKey];

  return null;
}


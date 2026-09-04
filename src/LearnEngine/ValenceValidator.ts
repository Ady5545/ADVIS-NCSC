import { MoleculeData, AtomData, BondData } from './MolecularEngine';

export interface AtomValenceAnalysis {
  atomId: string;
  element: string;
  valenceElectrons: number;
  totalBondOrder: number;
  bondedNeighborCount: number;
  estimatedLonePairs: number;
  formalCharge: number;
  hybridization?: string;
  isCommonValence: boolean;
  notes: string[];
}

export interface MolecularAnalysisResult {
  formula: string;
  totalAtoms: number;
  totalBonds: number;
  totalValenceElectrons: number;
  totalFormalCharge: number;
  centralAtomId?: string;
  stericNumber?: number;
  estimatedGeometry?: string;
  estimatedHybridization?: string;
  warnings: string[];
  atomAnalyses: Record<string, AtomValenceAnalysis>;
  educationalSummary: string;
}

// Elemental properties
const ELEMENT_VALENCE_DATA: Record<string, { valence: number; commonBonds: number[]; maxBonds: number; electronegativity: number }> = {
  H: { valence: 1, commonBonds: [1], maxBonds: 1, electronegativity: 2.20 },
  C: { valence: 4, commonBonds: [4], maxBonds: 4, electronegativity: 2.55 },
  N: { valence: 5, commonBonds: [3, 4], maxBonds: 4, electronegativity: 3.04 },
  O: { valence: 6, commonBonds: [2, 1, 3], maxBonds: 3, electronegativity: 3.44 },
  F: { valence: 7, commonBonds: [1], maxBonds: 1, electronegativity: 3.98 },
  B: { valence: 3, commonBonds: [3, 4], maxBonds: 4, electronegativity: 2.04 },
  P: { valence: 5, commonBonds: [3, 5], maxBonds: 6, electronegativity: 2.19 },
  S: { valence: 6, commonBonds: [2, 4, 6], maxBonds: 6, electronegativity: 2.58 },
  Cl: { valence: 7, commonBonds: [1], maxBonds: 3, electronegativity: 3.16 },
  Br: { valence: 7, commonBonds: [1], maxBonds: 3, electronegativity: 2.96 },
  I: { valence: 7, commonBonds: [1], maxBonds: 3, electronegativity: 2.66 },
  Si: { valence: 4, commonBonds: [4], maxBonds: 6, electronegativity: 1.90 },
  Na: { valence: 1, commonBonds: [1], maxBonds: 1, electronegativity: 0.93 },
  K: { valence: 1, commonBonds: [1], maxBonds: 1, electronegativity: 0.82 },
  Mg: { valence: 2, commonBonds: [2], maxBonds: 2, electronegativity: 1.31 },
  Ca: { valence: 2, commonBonds: [2], maxBonds: 2, electronegativity: 1.00 },
};

/**
 * Validates a molecular graph and derives educational chemistry insights.
 * Educational design: Does NOT block experimentation; provides clear physical feedback.
 */
export function validateMolecularGraph(molecule: MoleculeData): MolecularAnalysisResult {
  const atomAnalyses: Record<string, AtomValenceAnalysis> = {};
  const warnings: string[] = [];
  let totalValenceElectrons = 0;

  // 1. Build adjacency map
  const bondsByAtom: Record<string, BondData[]> = {};
  molecule.atoms.forEach(a => {
    bondsByAtom[a.id] = [];
  });

  molecule.bonds.forEach(b => {
    if (bondsByAtom[b.atomA]) bondsByAtom[b.atomA].push(b);
    if (bondsByAtom[b.atomB]) bondsByAtom[b.atomB].push(b);
  });

  // 2. Analyze each atom
  molecule.atoms.forEach(atom => {
    const el = atom.element.toUpperCase();
    const standardData = ELEMENT_VALENCE_DATA[el] || { valence: 4, commonBonds: [4], maxBonds: 4, electronegativity: 2.0 };
    totalValenceElectrons += standardData.valence;

    const incidentBonds = bondsByAtom[atom.id] || [];
    const totalBondOrder = incidentBonds.reduce((acc, b) => acc + (b.order || 1), 0);
    const bondedNeighborCount = incidentBonds.length;

    // Estimate lone pairs based on common valence shell electrons:
    // For main group elements: Octet target = 8 (except H = 2, B = 6)
    let targetElectrons = 8;
    if (el === 'H') targetElectrons = 2;
    if (el === 'B') targetElectrons = 6;
    if (el === 'P' || el === 'S') targetElectrons = Math.max(8, totalBondOrder * 2);

    const bondingElectrons = totalBondOrder * 2;
    let nonBondingElectrons = Math.max(0, standardData.valence - totalBondOrder);
    
    // Formal Charge = Valence - Non-bonding e- - Bond Order
    let formalCharge = atom.charge !== undefined ? atom.charge : (standardData.valence - nonBondingElectrons - totalBondOrder);
    const estimatedLonePairs = Math.max(0, Math.floor((standardData.valence - totalBondOrder - formalCharge) / 2));

    const notes: string[] = [];
    let isCommonValence = standardData.commonBonds.includes(totalBondOrder);

    // Chemical Rules and Educational Feedback
    if (el === 'H') {
      if (totalBondOrder > 1) {
        warnings.push(`Hydrogen atom (${atom.id}) has ${totalBondOrder} bonds. Neutral hydrogen normally forms only 1 single bond.`);
        notes.push("Exceeds 1s duet capacity");
        isCommonValence = false;
      }
    } else if (el === 'C') {
      if (totalBondOrder > 4) {
        warnings.push(`Carbon atom (${atom.id}) currently has ${totalBondOrder} bond-order units. This exceeds the standard octet valence of 4.`);
        notes.push("Hypervalent carbon configuration");
        isCommonValence = false;
      } else if (totalBondOrder < 4 && totalBondOrder > 0) {
        notes.push(`Under-coordinated carbon (${totalBondOrder}/4 bonds) - potential radical or cation.`);
      }
    } else if (el === 'O') {
      if (totalBondOrder === 1) {
        notes.push("Terminal oxygen (hydroxyl or oxide ligand).");
      } else if (totalBondOrder === 3) {
        notes.push("Oxonium trivalent species (+1 formal charge equivalent).");
      } else if (totalBondOrder > 3) {
        warnings.push(`Oxygen atom (${atom.id}) has ${totalBondOrder} bonds, which exceeds normal oxygen coordination.`);
        isCommonValence = false;
      }
    } else if (el === 'N') {
      if (totalBondOrder === 4) {
        notes.push("Quaternary ammonium configuration (positive formal charge).");
      } else if (totalBondOrder > 4) {
        warnings.push(`Nitrogen atom (${atom.id}) has ${totalBondOrder} bonds, which exceeds second-row octet capacity.`);
        isCommonValence = false;
      }
    } else if (el === 'B') {
      if (totalBondOrder === 3) {
        notes.push("Stable electron-deficient sextet (Lewis acid behavior with empty unhybridized 2p orbital).");
        isCommonValence = true; // Boron with 3 bonds is completely valid
      }
    }

    atomAnalyses[atom.id] = {
      atomId: atom.id,
      element: atom.element,
      valenceElectrons: standardData.valence,
      totalBondOrder,
      bondedNeighborCount,
      estimatedLonePairs,
      formalCharge,
      hybridization: atom.hybridization,
      isCommonValence,
      notes
    };
  });

  // 3. Compute empirical formula
  const counts: Record<string, number> = {};
  molecule.atoms.forEach(a => {
    const el = a.element;
    counts[el] = (counts[el] || 0) + 1;
  });

  let formula = '';
  // Standard Hill system: C first, then H, then alphabetical
  if (counts['C']) {
    formula += `C${counts['C'] > 1 ? counts['C'] : ''}`;
    delete counts['C'];
    if (counts['H']) {
      formula += `H${counts['H'] > 1 ? counts['H'] : ''}`;
      delete counts['H'];
    }
  }
  Object.keys(counts).sort().forEach(el => {
    formula += `${el}${counts[el] > 1 ? counts[el] : ''}`;
  });
  if (!formula) formula = 'Empty Molecule';

  // 4. Identify central atom and VSEPR geometry
  let centralAtomId: string | undefined = undefined;
  let maxNeighbors = -1;
  molecule.atoms.forEach(a => {
    const n = (bondsByAtom[a.id] || []).length;
    if (n > maxNeighbors && a.element !== 'H') {
      maxNeighbors = n;
      centralAtomId = a.id;
    }
  });

  if (!centralAtomId && molecule.atoms.length > 0) {
    centralAtomId = molecule.atoms[0].id;
  }

  let stericNumber: number | undefined = undefined;
  let estimatedGeometry: string | undefined = molecule.geometry;
  let estimatedHybridization: string | undefined = undefined;

  if (centralAtomId && atomAnalyses[centralAtomId]) {
    const central = atomAnalyses[centralAtomId];
    const neighbors = central.bondedNeighborCount;
    const lps = central.estimatedLonePairs;
    stericNumber = neighbors + lps;

    if (!estimatedGeometry) {
      if (neighbors === 0) {
        estimatedGeometry = "Single Atom";
        estimatedHybridization = "s";
      } else if (neighbors === 1) {
        estimatedGeometry = "Diatomic / Linear";
        estimatedHybridization = "sp";
      } else if (stericNumber === 2) {
        estimatedGeometry = "Linear (180.0°)";
        estimatedHybridization = "sp";
      } else if (stericNumber === 3) {
        estimatedGeometry = lps === 0 ? "Trigonal Planar (120.0°)" : "Bent (120.0°)";
        estimatedHybridization = "sp²";
      } else if (stericNumber === 4) {
        if (lps === 0) estimatedGeometry = "Tetrahedral (109.5°)";
        else if (lps === 1) estimatedGeometry = "Trigonal Pyramidal (107.3°)";
        else estimatedGeometry = "Bent (104.5°)";
        estimatedHybridization = "sp³";
      } else if (stericNumber === 5) {
        estimatedGeometry = "Trigonal Bipyramidal (90° / 120°)";
        estimatedHybridization = "sp³d";
      } else if (stericNumber >= 6) {
        estimatedGeometry = "Octahedral (90.0°)";
        estimatedHybridization = "sp³d²";
      }
    }
  }

  // 5. Generate concise educational summary

  let totalFormalCharge = 0;
  for (const id in atomAnalyses) {
    totalFormalCharge += atomAnalyses[id].formalCharge || 0;
  }
  let educationalSummary = `Formula: ${formula}. Total atoms: ${molecule.atoms.length}, Total bonds: ${molecule.bonds.length}.`;
  if (estimatedGeometry) {
    educationalSummary += ` Geometry: ${estimatedGeometry} (${estimatedHybridization || 'Standard orbital'}).`;
  }
  if (warnings.length > 0) {
    educationalSummary += ` Note: ${warnings[0]}`;
  }

  return {
    formula,
    totalAtoms: molecule.atoms.length,
    totalBonds: molecule.bonds.length,
    totalValenceElectrons,
    totalFormalCharge,
    centralAtomId,
    stericNumber,
    estimatedGeometry: estimatedGeometry || "Custom Configuration",
    estimatedHybridization: estimatedHybridization || "sp³",
    warnings,
    atomAnalyses,
    educationalSummary
  };
}

import * as THREE from 'three';

export interface AtomData {
  id: string;
  element: string;
  position: THREE.Vector3;
  charge?: number;
  hybridization?: string;
  metadata?: any;
}

export interface BondData {
  id: string;
  atomA: string;
  atomB: string;
  order: number;
  length: number;
  type: 'covalent' | 'ionic' | 'hydrogen' | 'aromatic';
}

export interface FunctionalGroupData {
  id: string;
  type: string;
  atomIds: string[];
  metadata?: any;
}

export interface MoleculeData {
  atoms: AtomData[];
  bonds: BondData[];
  functionalGroups: FunctionalGroupData[];
  geometry?: string;
  metadata?: any;
  animationProfile?: string;
}

export class MoleculeBuilder {
  private atoms: AtomData[] = [];
  private bonds: BondData[] = [];
  private fgs: FunctionalGroupData[] = [];
  private nextId = 0;

  addAtom(element: string, x: number, y: number, z: number, hybridization?: string): string {
    const id = `atom_${this.nextId++}`;
    this.atoms.push({
      id, element, position: new THREE.Vector3(x, y, z), hybridization
    });
    return id;
  }

  addBond(atomA: string, atomB: string, order: number = 1, type: 'covalent' | 'ionic' | 'hydrogen' | 'aromatic' = 'covalent'): string {
    const a1 = this.atoms.find(a => a.id === atomA);
    const a2 = this.atoms.find(a => a.id === atomB);
    const id = `bond_${atomA}_${atomB}`;
    this.bonds.push({
      id, atomA, atomB, order, length: a1 && a2 ? a1.position.distanceTo(a2.position) : 0, type
    });
    return id;
  }
  
  addFunctionalGroup(type: string, atomIds: string[]) {
    this.fgs.push({ id: `fg_${this.nextId++}`, type, atomIds });
  }

  build(geometry?: string, animationProfile: string = 'NORMAL'): MoleculeData {
    return {
      atoms: this.atoms,
      bonds: this.bonds,
      functionalGroups: this.fgs,
      geometry,
      animationProfile
    };
  }
}

// -------------------------------------------------------------
// GRAPH MUTATION & VSEPR POSITIONAL ENGINE
// -------------------------------------------------------------

// Typical covalent bond lengths in Angstroms
const BOND_LENGTH_MAP: Record<string, number> = {
  'C-H': 1.09, 'H-C': 1.09,
  'O-H': 0.96, 'H-O': 0.96,
  'N-H': 1.01, 'H-N': 1.01,
  'C-C': 1.54,
  'C-O': 1.43, 'O-C': 1.43,
  'C=O': 1.20, 'O=C': 1.20,
  'C-N': 1.47, 'N-C': 1.47,
  'B-F': 1.30, 'F-B': 1.30,
  'O-O': 1.21,
  'N-N': 1.10,
  'DEFAULT': 1.35
};

export function getBondLength(elA: string, elB: string, order: number = 1): number {
  const key = `${elA.toUpperCase()}-${elB.toUpperCase()}`;
  if (order === 2 && (key === 'C-O' || key === 'O-C')) return 1.20;
  if (order === 3 && (key === 'C-N' || key === 'N-C')) return 1.16;
  if (order === 3 && (key === 'C-C')) return 1.20;
  if (order === 2 && (key === 'C-C')) return 1.34;
  return BOND_LENGTH_MAP[key] || BOND_LENGTH_MAP['DEFAULT'];
}

/**
 * Deep clones a MoleculeData structure with fresh THREE.Vector3 instances.
 */
export function cloneMoleculeData(source: MoleculeData): MoleculeData {
  return {
    atoms: source.atoms.map(a => ({
      ...a,
      position: a.position.clone()
    })),
    bonds: source.bonds.map(b => ({ ...b })),
    functionalGroups: source.functionalGroups.map(fg => ({
      ...fg,
      atomIds: [...fg.atomIds]
    })),
    geometry: source.geometry,
    metadata: source.metadata ? { ...source.metadata } : undefined,
    animationProfile: source.animationProfile
  };
}

/**
 * Calculate deterministic VSEPR 3D position for a new atom attaching to a parent.
 */
export function calculateVSEPRPosition(
  molecule: MoleculeData,
  parentAtomId: string,
  newElement: string,
  bondOrder: number = 1
): THREE.Vector3 {
  const parent = molecule.atoms.find(a => a.id === parentAtomId);
  if (!parent) return new THREE.Vector3(1.3, 0, 0);

  const length = getBondLength(parent.element, newElement, bondOrder);

  // Find all existing bonds connected to this parent
  const existingBonds = molecule.bonds.filter(b => b.atomA === parentAtomId || b.atomB === parentAtomId);
  const neighborVectors: THREE.Vector3[] = [];

  for (const b of existingBonds) {
    const neighborId = b.atomA === parentAtomId ? b.atomB : b.atomA;
    const neighbor = molecule.atoms.find(a => a.id === neighborId);
    if (neighbor) {
      const v = new THREE.Vector3().subVectors(neighbor.position, parent.position).normalize();
      neighborVectors.push(v);
    }
  }

  // 1. If parent has NO existing bonds
  if (neighborVectors.length === 0) {
    return parent.position.clone().add(new THREE.Vector3(length, 0, 0));
  }

  // 2. If parent has 1 existing bond:
  // For linear/CO2: collinear 180° opposite (-v0)
  // For water/bent/tetrahedral: angle 109.5° or 120°
  if (neighborVectors.length === 1) {
    const v0 = neighborVectors[0];
    
    // If parent is Carbon or central atom in linear systems (e.g. CO2), test if it should be linear
    const isLinearCandidate = parent.element === 'C' && (bondOrder >= 2 || existingBonds[0].order >= 2);
    
    if (isLinearCandidate) {
      // 180 degrees opposite
      const dir = v0.clone().negate();
      return parent.position.clone().add(dir.multiplyScalar(length));
    } else {
      // Tetrahedral angle ~ 109.5° (cos θ = -1/3 ≈ -0.333, sin θ ≈ 0.943)
      let perp = new THREE.Vector3(0, 1, 0);
      if (Math.abs(v0.dot(perp)) > 0.9) {
        perp = new THREE.Vector3(1, 0, 0);
      }
      const ortho = new THREE.Vector3().crossVectors(v0, perp).normalize();
      const dir = v0.clone().multiplyScalar(-0.333).add(ortho.clone().multiplyScalar(0.943)).normalize();
      return parent.position.clone().add(dir.multiplyScalar(length));
    }
  }

  // 3. If parent has 2 existing bonds:
  if (neighborVectors.length === 2) {
    const v0 = neighborVectors[0];
    const v1 = neighborVectors[1];
    
    // Check if 180 degrees apart (linear)
    if (v0.dot(v1) < -0.9) {
      // Perpendicular to line
      let perp = new THREE.Vector3(0, 1, 0);
      if (Math.abs(v0.dot(perp)) > 0.9) perp = new THREE.Vector3(0, 0, 1);
      const dir = new THREE.Vector3().crossVectors(v0, perp).normalize();
      return parent.position.clone().add(dir.multiplyScalar(length));
    }

    // Otherwise, find the bisector pointing away
    const bisector = new THREE.Vector3().addVectors(v0, v1).normalize().negate();
    const normal = new THREE.Vector3().crossVectors(v0, v1).normalize();
    
    // Tetrahedral or trigonal planar 3rd domain
    const dir = bisector.clone().multiplyScalar(0.7).add(normal.clone().multiplyScalar(0.7)).normalize();
    return parent.position.clone().add(dir.multiplyScalar(length));
  }

  // 4. If parent has 3 existing bonds:
  if (neighborVectors.length === 3) {
    // Sum opposing directions to find open 4th vertex of tetrahedron
    const sum = new THREE.Vector3();
    neighborVectors.forEach(v => sum.add(v));
    const dir = sum.negate().normalize();
    if (dir.lengthSq() < 0.01) {
      // In plane, go along normal
      const n = new THREE.Vector3().crossVectors(neighborVectors[0], neighborVectors[1]).normalize();
      return parent.position.clone().add(n.multiplyScalar(length));
    }
    return parent.position.clone().add(dir.multiplyScalar(length));
  }

  // 5. Fallback for 4+ bonds: choose direction furthest from all existing neighbors
  const testCandidates = [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0)
  ];

  let bestDir = testCandidates[0];
  let maxMinAngle = -1;

  for (const cand of testCandidates) {
    let minDot = 1;
    for (const v of neighborVectors) {
      const dot = cand.dot(v);
      if (dot > minDot) minDot = dot;
    }
    // We want minimal maximum dot product (maximum angular separation)
    if (1 - minDot > maxMinAngle) {
      maxMinAngle = 1 - minDot;
      bestDir = cand;
    }
  }

  return parent.position.clone().add(bestDir.normalize().multiplyScalar(length));
}

/**
 * Creates a single-atom initial molecule.
 */
export function createSingleAtomMolecule(element: string = 'C'): MoleculeData {
  return {
    atoms: [
      {
        id: 'atom_0',
        element: element.toUpperCase(),
        position: new THREE.Vector3(0, 0, 0),
        hybridization: element.toUpperCase() === 'C' ? 'sp3' : 's'
      }
    ],
    bonds: [],
    functionalGroups: [],
    geometry: 'Single Atom',
    animationProfile: 'NORMAL'
  };
}

/**
 * Safe graph operation: Add an atom to the active molecule and optionally bond it.
 */
export function addAtomToMolecule(
  current: MoleculeData,
  element: string,
  parentAtomId?: string,
  bondOrder: number = 1
): { updatedMolecule: MoleculeData; addedAtomId: string; addedBondId?: string } {
  const molecule = cloneMoleculeData(current);
  const nextIdx = molecule.atoms.length > 0 
    ? Math.max(...molecule.atoms.map(a => parseInt(a.id.replace(/\D/g, '')) || 0)) + 1 
    : 0;
  const newAtomId = `atom_${nextIdx}`;

  let targetParent = parentAtomId;
  if (!targetParent && molecule.atoms.length > 0) {
    // Prefer central non-hydrogen atom with available valence, else first atom
    const nonH = molecule.atoms.find(a => a.element !== 'H');
    targetParent = nonH ? nonH.id : molecule.atoms[0].id;
  }

  let newPos = new THREE.Vector3(0, 0, 0);
  let addedBondId: string | undefined = undefined;

  if (targetParent && molecule.atoms.length > 0) {
    newPos = calculateVSEPRPosition(molecule, targetParent, element, bondOrder);
    
    // Add new atom
    molecule.atoms.push({
      id: newAtomId,
      element: element.toUpperCase(),
      position: newPos
    });

    // Add bond between target parent and new atom
    const parentAtom = molecule.atoms.find(a => a.id === targetParent)!;
    const bondId = `bond_${targetParent}_${newAtomId}`;
    const len = parentAtom.position.distanceTo(newPos);
    molecule.bonds.push({
      id: bondId,
      atomA: targetParent,
      atomB: newAtomId,
      order: bondOrder,
      length: len,
      type: 'covalent'
    });
    addedBondId = bondId;
  } else {
    // Graph was empty, place at origin
    molecule.atoms.push({
      id: newAtomId,
      element: element.toUpperCase(),
      position: newPos
    });
  }

  return { updatedMolecule: molecule, addedAtomId: newAtomId, addedBondId };
}

/**
 * Safe graph operation: Remove an atom and automatically cascade-remove all connected bonds.
 */
export function removeAtomFromMolecule(
  current: MoleculeData,
  atomIdToRemove: string
): { updatedMolecule: MoleculeData; removedAtom: AtomData | null; removedBonds: BondData[] } {
  const molecule = cloneMoleculeData(current);
  const atomToRemove = molecule.atoms.find(a => a.id === atomIdToRemove) || null;

  if (!atomToRemove) {
    return { updatedMolecule: molecule, removedAtom: null, removedBonds: [] };
  }

  const removedBonds = molecule.bonds.filter(b => b.atomA === atomIdToRemove || b.atomB === atomIdToRemove);
  
  // Filter out the atom
  molecule.atoms = molecule.atoms.filter(a => a.id !== atomIdToRemove);
  // Cascade filter out all connected bonds
  molecule.bonds = molecule.bonds.filter(b => b.atomA !== atomIdToRemove && b.atomB !== atomIdToRemove);
  // Clean up functional groups
  molecule.functionalGroups = molecule.functionalGroups
    .map(fg => ({ ...fg, atomIds: fg.atomIds.filter(id => id !== atomIdToRemove) }))
    .filter(fg => fg.atomIds.length > 0);

  return { updatedMolecule: molecule, removedAtom: atomToRemove, removedBonds };
}

/**
 * Safe graph operation: Change bond order for specific bond or all bonds between elements.
 */
export function setBondOrderInMolecule(
  current: MoleculeData,
  target: { bondId?: string; atomA?: string; atomB?: string; allBonds?: boolean; elementPair?: [string, string] },
  newOrder: number
): MoleculeData {
  const molecule = cloneMoleculeData(current);

  molecule.bonds = molecule.bonds.map(b => {
    let match = false;
    if (target.allBonds) {
      match = true;
    } else if (target.bondId && b.id === target.bondId) {
      match = true;
    } else if (target.atomA && target.atomB && ((b.atomA === target.atomA && b.atomB === target.atomB) || (b.atomA === target.atomB && b.atomB === target.atomA))) {
      match = true;
    } else if (target.elementPair) {
      const a = molecule.atoms.find(at => at.id === b.atomA);
      const atB = molecule.atoms.find(at => at.id === b.atomB);
      if (a && atB) {
        const p1 = `${a.element}-${atB.element}`.toUpperCase();
        const p2 = `${atB.element}-${a.element}`.toUpperCase();
        const targetPair1 = `${target.elementPair[0]}-${target.elementPair[1]}`.toUpperCase();
        const targetPair2 = `${target.elementPair[1]}-${target.elementPair[0]}`.toUpperCase();
        if (p1 === targetPair1 || p1 === targetPair2 || p2 === targetPair1 || p2 === targetPair2) {
          match = true;
        }
      }
    }

    if (match) {
      return { ...b, order: newOrder };
    }
    return b;
  });

  return molecule;
}


// Registry for molecules
export const MOLECULE_REGISTRY: Record<string, () => MoleculeData> = {};

// Generator functions
MOLECULE_REGISTRY['H2O'] = () => {
  const m = new MoleculeBuilder();
  const o = m.addAtom('O', 0, 0, 0, 'sp3');
  const h1 = m.addAtom('H', 0.75, -0.58, 0, 's');
  const h2 = m.addAtom('H', -0.75, -0.58, 0, 's');
  m.addBond(o, h1, 1);
  m.addBond(o, h2, 1);
  return m.build('Bent');
};

MOLECULE_REGISTRY['CO2'] = () => {
  const m = new MoleculeBuilder();
  const c = m.addAtom('C', 0, 0, 0, 'sp');
  const o1 = m.addAtom('O', 1.16, 0, 0, 'sp2');
  const o2 = m.addAtom('O', -1.16, 0, 0, 'sp2');
  m.addBond(c, o1, 2);
  m.addBond(c, o2, 2);
  return m.build('Linear');
};

MOLECULE_REGISTRY['CH4'] = () => {
  const m = new MoleculeBuilder();
  const c = m.addAtom('C', 0, 0, 0, 'sp3');
  const d = 1.09;
  const h1 = m.addAtom('H', d * 0, d * 1, d * 0);
  const h2 = m.addAtom('H', d * 0.94, d * -0.33, d * 0);
  const h3 = m.addAtom('H', d * -0.47, d * -0.33, d * 0.81);
  const h4 = m.addAtom('H', d * -0.47, d * -0.33, d * -0.81);
  m.addBond(c, h1, 1);
  m.addBond(c, h2, 1);
  m.addBond(c, h3, 1);
  m.addBond(c, h4, 1);
  return m.build('Tetrahedral');
};

MOLECULE_REGISTRY['NH3'] = () => {
  const m = new MoleculeBuilder();
  const n = m.addAtom('N', 0, 0.3, 0, 'sp3');
  const d = 1.01;
  const h1 = m.addAtom('H', d * 0, -0.2, d * 0.94);
  const h2 = m.addAtom('H', d * 0.81, -0.2, d * -0.47);
  const h3 = m.addAtom('H', d * -0.81, -0.2, d * -0.47);
  m.addBond(n, h1, 1);
  m.addBond(n, h2, 1);
  m.addBond(n, h3, 1);
  return m.build('Trigonal Pyramidal');
};

MOLECULE_REGISTRY['O2'] = () => {
  const m = new MoleculeBuilder();
  const o1 = m.addAtom('O', -0.6, 0, 0);
  const o2 = m.addAtom('O', 0.6, 0, 0);
  m.addBond(o1, o2, 2);
  return m.build('Linear');
};

MOLECULE_REGISTRY['N2'] = () => {
  const m = new MoleculeBuilder();
  const n1 = m.addAtom('N', -0.55, 0, 0);
  const n2 = m.addAtom('N', 0.55, 0, 0);
  m.addBond(n1, n2, 3);
  return m.build('Linear');
};

MOLECULE_REGISTRY['C2H5OH'] = () => { // Ethanol
  const m = new MoleculeBuilder();
  const c1 = m.addAtom('C', -1.2, -0.2, 0);
  const c2 = m.addAtom('C', 0, 0.5, 0);
  const o = m.addAtom('O', 1.1, -0.3, 0);
  m.addBond(c1, c2, 1);
  m.addBond(c2, o, 1);
  m.addFunctionalGroup('hydroxyl', [o]);
  
  const h1 = m.addAtom('H', -1.2, -0.8, 0.8);
  const h2 = m.addAtom('H', -1.2, -0.8, -0.8);
  const h3 = m.addAtom('H', -2.0, 0.4, 0);
  m.addBond(c1, h1, 1); m.addBond(c1, h2, 1); m.addBond(c1, h3, 1);
  
  const h4 = m.addAtom('H', 0, 1.1, 0.8);
  const h5 = m.addAtom('H', 0, 1.1, -0.8);
  m.addBond(c2, h4, 1); m.addBond(c2, h5, 1);
  
  const h6 = m.addAtom('H', 1.8, 0.2, 0);
  m.addBond(o, h6, 1);
  
  return m.build('Chain');
};

MOLECULE_REGISTRY['C6H12O6'] = () => { // Glucose (chain/ring simplified)
  // We'll create a simplified pyranose ring for D-glucose
  const m = new MoleculeBuilder();
  // Coordinates approximate for chair conformation
  const o = m.addAtom('O', 0, 1.4, -0.7);
  const c1 = m.addAtom('C', 1.2, 0.6, -0.5);
  const c2 = m.addAtom('C', 1.2, -0.6, 0.5);
  const c3 = m.addAtom('C', 0, -1.4, 0.7);
  const c4 = m.addAtom('C', -1.2, -0.6, 0.5);
  const c5 = m.addAtom('C', -1.2, 0.6, -0.5);
  const c6 = m.addAtom('C', -2.4, 1.4, 0.2); // CH2OH group

  m.addBond(o, c1, 1);
  m.addBond(c1, c2, 1);
  m.addBond(c2, c3, 1);
  m.addBond(c3, c4, 1);
  m.addBond(c4, c5, 1);
  m.addBond(c5, o, 1);
  m.addBond(c5, c6, 1);
  
  // Add OH groups
  const o1 = m.addAtom('O', 2.3, 1.4, -0.1);
  const o2 = m.addAtom('O', 2.3, -1.4, 0.1);
  const o3 = m.addAtom('O', 0, -2.4, -0.3);
  const o4 = m.addAtom('O', -2.3, -1.4, 0.1);
  const o6 = m.addAtom('O', -3.4, 0.6, 0.8);
  
  m.addBond(c1, o1, 1); m.addFunctionalGroup('hydroxyl', [o1]);
  m.addBond(c2, o2, 1); m.addFunctionalGroup('hydroxyl', [o2]);
  m.addBond(c3, o3, 1); m.addFunctionalGroup('hydroxyl', [o3]);
  m.addBond(c4, o4, 1); m.addFunctionalGroup('hydroxyl', [o4]);
  m.addBond(c6, o6, 1); m.addFunctionalGroup('hydroxyl', [o6]);

  // Hydrogen atoms are omitted for brevity in this simple test model, 
  // but can be added for completeness. We add a few to c6:
  m.addBond(o1, m.addAtom('H', 3.0, 1.0, 0), 1);
  m.addBond(o2, m.addAtom('H', 3.0, -1.0, 0), 1);
  m.addBond(o3, m.addAtom('H', 0, -3.0, 0), 1);
  m.addBond(o4, m.addAtom('H', -3.0, -1.0, 0), 1);
  m.addBond(o6, m.addAtom('H', -4.0, 1.0, 0.5), 1);

  return m.build('Pyranose Ring');
};

MOLECULE_REGISTRY['C6H6'] = () => { // Benzene
  const m = new MoleculeBuilder();
  const radius = 1.4;
  const c = [];
  const h = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    c.push(m.addAtom('C', Math.cos(angle) * radius, Math.sin(angle) * radius, 0, 'sp2'));
    h.push(m.addAtom('H', Math.cos(angle) * (radius + 1.08), Math.sin(angle) * (radius + 1.08), 0, 's'));
  }
  for (let i = 0; i < 6; i++) {
    m.addBond(c[i], h[i], 1);
    // Alternating single/double (or aromatic type 1.5, we'll use aromatic type for rendering)
    m.addBond(c[i], c[(i + 1) % 6], 1.5, 'aromatic'); 
  }
  return m.build('Planar Ring');
};


MOLECULE_REGISTRY['BF3'] = () => {
  const m = new MoleculeBuilder();
  const b = m.addAtom('B', 0, 0, 0, 'sp2');
  const d = 1.30;
  const f1 = m.addAtom('F', 0, d, 0, 'sp3');
  const f2 = m.addAtom('F', d * Math.cos(Math.PI/6), -d * Math.sin(Math.PI/6), 0, 'sp3');
  const f3 = m.addAtom('F', -d * Math.cos(Math.PI/6), -d * Math.sin(Math.PI/6), 0, 'sp3');
  m.addBond(b, f1, 1);
  m.addBond(b, f2, 1);
  m.addBond(b, f3, 1);
  return m.build('Trigonal Planar');
};

MOLECULE_REGISTRY['H2S'] = () => {
  const m = new MoleculeBuilder();
  const s = m.addAtom('S', 0, 0, 0, 'sp3');
  const h1 = m.addAtom('H', 0.95, -0.9, 0, 's');
  const h2 = m.addAtom('H', -0.95, -0.9, 0, 's');
  m.addBond(s, h1, 1);
  m.addBond(s, h2, 1);
  return m.build('Bent');
};

MOLECULE_REGISTRY['SF6'] = () => {
  const m = new MoleculeBuilder();
  const s = m.addAtom('S', 0, 0, 0, 'sp3d2');
  const d = 1.56;
  const f1 = m.addAtom('F', d, 0, 0, 'sp3');
  const f2 = m.addAtom('F', -d, 0, 0, 'sp3');
  const f3 = m.addAtom('F', 0, d, 0, 'sp3');
  const f4 = m.addAtom('F', 0, -d, 0, 'sp3');
  const f5 = m.addAtom('F', 0, 0, d, 'sp3');
  const f6 = m.addAtom('F', 0, 0, -d, 'sp3');
  m.addBond(s, f1, 1);
  m.addBond(s, f2, 1);
  m.addBond(s, f3, 1);
  m.addBond(s, f4, 1);
  m.addBond(s, f5, 1);
  m.addBond(s, f6, 1);
  return m.build('Octahedral');
};

MOLECULE_REGISTRY['PCl5'] = () => {
  const m = new MoleculeBuilder();
  const p = m.addAtom('P', 0, 0, 0, 'sp3d');
  const eqD = 2.02;
  const axD = 2.14;
  // 3 equatorial at 120 deg
  const cl1 = m.addAtom('Cl', eqD * Math.cos(0), eqD * Math.sin(0), 0);
  const cl2 = m.addAtom('Cl', eqD * Math.cos(2*Math.PI/3), eqD * Math.sin(2*Math.PI/3), 0);
  const cl3 = m.addAtom('Cl', eqD * Math.cos(4*Math.PI/3), eqD * Math.sin(4*Math.PI/3), 0);
  // 2 axial at +- Z
  const cl4 = m.addAtom('Cl', 0, 0, axD);
  const cl5 = m.addAtom('Cl', 0, 0, -axD);
  m.addBond(p, cl1, 1);
  m.addBond(p, cl2, 1);
  m.addBond(p, cl3, 1);
  m.addBond(p, cl4, 1);
  m.addBond(p, cl5, 1);
  return m.build('Trigonal Bipyramidal');
};

MOLECULE_REGISTRY['C2H4'] = () => {
  const m = new MoleculeBuilder();
  const c1 = m.addAtom('C', -0.67, 0, 0, 'sp2');
  const c2 = m.addAtom('C', 0.67, 0, 0, 'sp2');
  m.addBond(c1, c2, 2);
  const h1 = m.addAtom('H', -1.23, 0.92, 0);
  const h2 = m.addAtom('H', -1.23, -0.92, 0);
  const h3 = m.addAtom('H', 1.23, 0.92, 0);
  const h4 = m.addAtom('H', 1.23, -0.92, 0);
  m.addBond(c1, h1, 1);
  m.addBond(c1, h2, 1);
  m.addBond(c2, h3, 1);
  m.addBond(c2, h4, 1);
  return m.build('Planar');
};

MOLECULE_REGISTRY['C2H2'] = () => {
  const m = new MoleculeBuilder();
  const c1 = m.addAtom('C', -0.60, 0, 0, 'sp');
  const c2 = m.addAtom('C', 0.60, 0, 0, 'sp');
  m.addBond(c1, c2, 3);
  const h1 = m.addAtom('H', -1.66, 0, 0);
  const h2 = m.addAtom('H', 1.66, 0, 0);
  m.addBond(c1, h1, 1);
  m.addBond(c2, h2, 1);
  return m.build('Linear');
};

MOLECULE_REGISTRY['NH4+'] = () => {
  const m = new MoleculeBuilder();
  const n = m.addAtom('N', 0, 0, 0, 'sp3');
  const d = 1.02;
  const h1 = m.addAtom('H', d * 0, d * 1, d * 0);
  const h2 = m.addAtom('H', d * 0.94, d * -0.33, d * 0);
  const h3 = m.addAtom('H', d * -0.47, d * -0.33, d * 0.81);
  const h4 = m.addAtom('H', d * -0.47, d * -0.33, d * -0.81);
  m.addBond(n, h1, 1);
  m.addBond(n, h2, 1);
  m.addBond(n, h3, 1);
  m.addBond(n, h4, 1);
  return m.build('Tetrahedral');
};

MOLECULE_REGISTRY['H3O+'] = () => {
  const m = new MoleculeBuilder();
  const o = m.addAtom('O', 0, 0.2, 0, 'sp3');
  const d = 0.98;
  const h1 = m.addAtom('H', d * 0, -0.2, d * 0.94);
  const h2 = m.addAtom('H', d * 0.81, -0.2, d * -0.47);
  const h3 = m.addAtom('H', d * -0.81, -0.2, d * -0.47);
  m.addBond(o, h1, 1);
  m.addBond(o, h2, 1);
  m.addBond(o, h3, 1);
  return m.build('Trigonal Pyramidal');
};

MOLECULE_REGISTRY['NaCl'] = () => {
  const m = new MoleculeBuilder();
  const na = m.addAtom('Na', -1.18, 0, 0);
  const cl = m.addAtom('Cl', 1.18, 0, 0);
  m.addBond(na, cl, 1, 'ionic');
  return m.build('Lattice');
};


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

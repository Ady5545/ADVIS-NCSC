export interface ChemicalEntity {
  formula: string;
  description?: string;
  name: string;
  iupacName?: string;
  category: 'VSEPR' | 'Organic' | 'Inorganic' | 'Ions' | 'Biomolecules' | 'Common compounds';
  centralAtom?: string;
  ligands?: { atom: string; count: number }[];
  valenceElectrons: number;
  electronDomainGeometry: string;
  molecularGeometry: string;
  geometry: string; // for backward compat
  vseprClass: string; // e.g. "AX2E2"
  hybridization: string;
  bondAngles: string;
  lonePairsCentral: number;
  totalLonePairs: number;
  lonePairs?: number; // for backward compat
  formalCharges: Record<string, number>;
  bondTypes: string;
  polarity: string;
  dipoleMoment?: string;
  lewisStructure: {
    diagram: string;
    description: string;
    bonds: { from: string; to: string; order: number }[];
    lonePairsOn: { atom: string; count: number }[];
  };
  vseprExplanation: string;
  bondType: 'COVALENT' | 'IONIC';
}

export const CHEMISTRY_DATABASE: Record<string, ChemicalEntity> = {
  "H2O": {
    formula: "H2O",
    name: "Water",
    iupacName: "Oxidane",
    category: "VSEPR",
    centralAtom: "O",
    ligands: [{ atom: "H", count: 2 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Bent",
    geometry: "Bent",
    vseprClass: "AX₂E₂",
    hybridization: "sp³",
    bondAngles: "104.5°",
    lonePairsCentral: 2,
    totalLonePairs: 2,
    lonePairs: 2,
    formalCharges: { "O": 0, "H": 0 },
    bondTypes: "2 Single Covalent σ Bonds (O–H)",
    polarity: "Polar (Dipole Moment: 1.85 D)",
    dipoleMoment: "1.85 D",
    lewisStructure: {
      diagram: "  H — :Ö: — H\n       ¨",
      description: "Central oxygen with 2 single bonds to hydrogens and 2 non-bonding lone pairs.",
      bonds: [{ from: "O", to: "H1", order: 1 }, { from: "O", to: "H2", order: 1 }],
      lonePairsOn: [{ atom: "O", count: 2 }]
    },
    vseprExplanation: "Oxygen has 4 electron domains (2 bonding pairs + 2 lone pairs) arranged in a tetrahedral electron geometry. Due to greater electrostatic repulsion of non-bonding lone pairs compared to bonding pairs, the H–O–H angle is compressed from 109.5° down to 104.5°.",
    bondType: "COVALENT"
  },

  "CO2": {
    formula: "CO2",
    name: "Carbon Dioxide",
    iupacName: "Carbon Dioxide",
    category: "VSEPR",
    centralAtom: "C",
    ligands: [{ atom: "O", count: 2 }],
    valenceElectrons: 16,
    electronDomainGeometry: "Linear (2 Domains)",
    molecularGeometry: "Linear",
    geometry: "Linear",
    vseprClass: "AX₂",
    hybridization: "sp",
    bondAngles: "180.0°",
    lonePairsCentral: 0,
    totalLonePairs: 4,
    lonePairs: 0,
    formalCharges: { "C": 0, "O": 0 },
    bondTypes: "2 Double Covalent Bonds (2σ + 2π)",
    polarity: "Non-polar (Symmetric linear cancellation, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: " :Ö = C = Ö:",
      description: "Central carbon doubly bonded to two oxygen atoms; each oxygen possesses two non-bonding lone pairs.",
      bonds: [{ from: "C", to: "O1", order: 2 }, { from: "C", to: "O2", order: 2 }],
      lonePairsOn: [{ atom: "O1", count: 2 }, { atom: "O2", count: 2 }]
    },
    vseprExplanation: "Carbon has 2 electron domains (two double bonds) and 0 lone pairs. To minimize electrostatic repulsion between the two σ-electron domains, they orient 180° apart, yielding sp-hybridization and a linear geometry.",
    bondType: "COVALENT"
  },

  "CH4": {
    formula: "CH4",
    name: "Methane",
    iupacName: "Methane",
    category: "VSEPR",
    centralAtom: "C",
    ligands: [{ atom: "H", count: 4 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Tetrahedral",
    geometry: "Tetrahedral",
    vseprClass: "AX₄",
    hybridization: "sp³",
    bondAngles: "109.5°",
    lonePairsCentral: 0,
    totalLonePairs: 0,
    lonePairs: 0,
    formalCharges: { "C": 0, "H": 0 },
    bondTypes: "4 Single Covalent σ Bonds (C–H)",
    polarity: "Non-polar (Spherical tetrahedral symmetry, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "      H\n      |\n  H — C — H\n      |\n      H",
      description: "Central carbon single-bonded to 4 hydrogen atoms with an octet of 8 shared electrons.",
      bonds: [
        { from: "C", to: "H1", order: 1 },
        { from: "C", to: "H2", order: 1 },
        { from: "C", to: "H3", order: 1 },
        { from: "C", to: "H4", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "The central carbon hybridizes one 2s and three 2p orbitals into four equivalent sp³ hybrid orbitals. With 4 identical bonding domains and 0 lone pairs, symmetric steric repulsion creates a regular tetrahedron with 109.5° bond angles.",
    bondType: "COVALENT"
  },

  "NH3": {
    formula: "NH3",
    name: "Ammonia",
    iupacName: "Azane",
    category: "VSEPR",
    centralAtom: "N",
    ligands: [{ atom: "H", count: 3 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Trigonal Pyramidal",
    geometry: "Trigonal Pyramidal",
    vseprClass: "AX₃E",
    hybridization: "sp³",
    bondAngles: "107.3°",
    lonePairsCentral: 1,
    totalLonePairs: 1,
    lonePairs: 1,
    formalCharges: { "N": 0, "H": 0 },
    bondTypes: "3 Single Covalent σ Bonds (N–H)",
    polarity: "Polar (Dipole Moment: 1.47 D)",
    dipoleMoment: "1.47 D",
    lewisStructure: {
      diagram: "     :N\n    / | \\\n   H  H  H",
      description: "Central nitrogen with 1 non-bonding lone pair and 3 single bonds to hydrogens.",
      bonds: [
        { from: "N", to: "H1", order: 1 },
        { from: "N", to: "H2", order: 1 },
        { from: "N", to: "H3", order: 1 }
      ],
      lonePairsOn: [{ atom: "N", count: 1 }]
    },
    vseprExplanation: "Nitrogen has 4 electron domains (3 bonding pairs + 1 lone pair) in an sp³ arrangement. The localized lone pair exerts greater steric repulsion on the bonding pairs, compressing the bond angle from 109.5° to 107.3° in a trigonal pyramid.",
    bondType: "COVALENT"
  },

  "BF3": {
    formula: "BF3",
    name: "Boron Trifluoride",
    iupacName: "Trifluoroborane",
    category: "VSEPR",
    centralAtom: "B",
    ligands: [{ atom: "F", count: 3 }],
    valenceElectrons: 24,
    electronDomainGeometry: "Trigonal Planar (3 Domains)",
    molecularGeometry: "Trigonal Planar",
    geometry: "Trigonal Planar",
    vseprClass: "AX₃",
    hybridization: "sp²",
    bondAngles: "120.0°",
    lonePairsCentral: 0,
    totalLonePairs: 9,
    lonePairs: 0,
    formalCharges: { "B": 0, "F": 0 },
    bondTypes: "3 Single Covalent σ Bonds (B–F)",
    polarity: "Non-polar (Trigonal planar symmetry, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "      :F:\n       |\n       B\n     /   \\\n  :F:     :F:",
      description: "Central boron with 6 valence electrons (incomplete octet) surrounded by three fluorine atoms.",
      bonds: [
        { from: "B", to: "F1", order: 1 },
        { from: "B", to: "F2", order: 1 },
        { from: "B", to: "F3", order: 1 }
      ],
      lonePairsOn: [{ atom: "F1", count: 3 }, { atom: "F2", count: 3 }, { atom: "F3", count: 3 }]
    },
    vseprExplanation: "Boron uses sp² hybridization with three electron domains lying in a single 2D plane at 120° angles to minimize repulsion. The unhybridized 2p orbital on Boron is empty, making BF₃ a potent Lewis acid.",
    bondType: "COVALENT"
  },

  "H2S": {
    formula: "H2S",
    name: "Hydrogen Sulfide",
    iupacName: "Sulfane",
    category: "Inorganic",
    centralAtom: "S",
    ligands: [{ atom: "H", count: 2 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Bent",
    geometry: "Bent",
    vseprClass: "AX₂E₂",
    hybridization: "sp³ (mostly pure p-bonding)",
    bondAngles: "92.1°",
    lonePairsCentral: 2,
    totalLonePairs: 2,
    lonePairs: 2,
    formalCharges: { "S": 0, "H": 0 },
    bondTypes: "2 Single Covalent σ Bonds (S–H)",
    polarity: "Polar (Dipole Moment: 0.97 D)",
    dipoleMoment: "0.97 D",
    lewisStructure: {
      diagram: "  H — :S̈: — H",
      description: "Central sulfur with 2 single bonds to hydrogen and 2 non-bonding lone pairs in large 3p/3s orbitals.",
      bonds: [{ from: "S", to: "H1", order: 1 }, { from: "S", to: "H2", order: 1 }],
      lonePairsOn: [{ atom: "S", count: 2 }]
    },
    vseprExplanation: "Sulfur's larger 3p orbitals undergo minimal s-p hybridization compared to oxygen. The S–H bonds use almost pure 3p orbitals (~90° ideal), resulting in an observed 92.1° angle.",
    bondType: "COVALENT"
  },

  "SF6": {
    formula: "SF6",
    name: "Sulfur Hexafluoride",
    iupacName: "Sulfur Hexafluoride",
    category: "Inorganic",
    centralAtom: "S",
    ligands: [{ atom: "F", count: 6 }],
    valenceElectrons: 48,
    electronDomainGeometry: "Octahedral (6 Domains)",
    molecularGeometry: "Octahedral",
    geometry: "Octahedral",
    vseprClass: "AX₆",
    hybridization: "sp³d²",
    bondAngles: "90.0°, 180.0°",
    lonePairsCentral: 0,
    totalLonePairs: 18,
    lonePairs: 0,
    formalCharges: { "S": 0, "F": 0 },
    bondTypes: "6 Single Covalent σ Bonds (S–F)",
    polarity: "Non-polar (Octahedral symmetry, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "     :F: :F:\n       \\ /\n   :F:— S —:F:\n       / \\\n     :F: :F:",
      description: "Hypervalent sulfur with expanded valence shell (12 electrons in 6 S–F bonds).",
      bonds: [
        { from: "S", to: "F1", order: 1 }, { from: "S", to: "F2", order: 1 },
        { from: "S", to: "F3", order: 1 }, { from: "S", to: "F4", order: 1 },
        { from: "S", to: "F5", order: 1 }, { from: "S", to: "F6", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "Sulfur coordinates 6 fluorine atoms via an expanded octet. Six equivalent bonding domains arrange symmetrically along the Cartesian axes at 90° and 180°, creating an octahedral geometry with sp³d² hybridization.",
    bondType: "COVALENT"
  },

  "PCl5": {
    formula: "PCl5",
    name: "Phosphorus Pentachloride",
    iupacName: "Pentachloro-λ⁵-phosphane",
    category: "Inorganic",
    centralAtom: "P",
    ligands: [{ atom: "Cl", count: 5 }],
    valenceElectrons: 40,
    electronDomainGeometry: "Trigonal Bipyramidal (5 Domains)",
    molecularGeometry: "Trigonal Bipyramidal",
    geometry: "Trigonal Bipyramidal",
    vseprClass: "AX₅",
    hybridization: "sp³d",
    bondAngles: "120.0° (equatorial), 90.0° / 180.0° (axial)",
    lonePairsCentral: 0,
    totalLonePairs: 15,
    lonePairs: 0,
    formalCharges: { "P": 0, "Cl": 0 },
    bondTypes: "5 Single Covalent σ Bonds (P–Cl)",
    polarity: "Non-polar (Symmetric trigonal bipyramidal cancellation)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "      :Cl:\n        |\n  :Cl:— P —:Cl:\n       / \\\n    :Cl: :Cl:",
      description: "Central phosphorus with 10 valence electrons forming 3 equatorial and 2 axial P-Cl bonds.",
      bonds: [
        { from: "P", to: "Cl1", order: 1 }, { from: "P", to: "Cl2", order: 1 },
        { from: "P", to: "Cl3", order: 1 }, { from: "P", to: "Cl4", order: 1 },
        { from: "P", to: "Cl5", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "Five electron domains arrange into a trigonal bipyramid. The three equatorial bonds experience 120° separation, while two axial bonds point at 90° to the equatorial plane.",
    bondType: "COVALENT"
  },

  "O2": {
    formula: "O2",
    name: "Oxygen Gas",
    iupacName: "Molecular Oxygen",
    category: "Common compounds",
    valenceElectrons: 12,
    electronDomainGeometry: "Linear (Diatomic)",
    molecularGeometry: "Linear",
    geometry: "Linear",
    vseprClass: "Diatomic",
    hybridization: "sp² (Molecular Orbital: (σ2p)²(π2p)⁴(π*2p)²)",
    bondAngles: "180.0°",
    lonePairsCentral: 2,
    totalLonePairs: 4,
    lonePairs: 4,
    formalCharges: { "O": 0 },
    bondTypes: "1 Covalent Double Bond (1σ + 1π)",
    polarity: "Non-polar (Homodiatomic, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: " :Ö = Ö:",
      description: "Diatomic oxygen with a double covalent bond and 2 non-bonding lone pairs per oxygen.",
      bonds: [{ from: "O1", to: "O2", order: 2 }],
      lonePairsOn: [{ atom: "O1", count: 2 }, { atom: "O2", count: 2 }]
    },
    vseprExplanation: "Molecular oxygen features two unpaired electrons in degenerate π* antibonding orbitals according to Molecular Orbital theory, resulting in a bond order of 2 and paramagnetism.",
    bondType: "COVALENT"
  },

  "N2": {
    formula: "N2",
    name: "Nitrogen Gas",
    iupacName: "Molecular Dinitrogen",
    category: "Common compounds",
    valenceElectrons: 10,
    electronDomainGeometry: "Linear (Diatomic)",
    molecularGeometry: "Linear",
    geometry: "Linear",
    vseprClass: "Diatomic",
    hybridization: "sp (Molecular Orbital)",
    bondAngles: "180.0°",
    lonePairsCentral: 1,
    totalLonePairs: 2,
    lonePairs: 2,
    formalCharges: { "N": 0 },
    bondTypes: "1 Covalent Triple Bond (1σ + 2π)",
    polarity: "Non-polar (Homodiatomic, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: " :N ≡ N:",
      description: "Diatomic nitrogen sharing 6 electrons across a triple bond with one lone pair per nitrogen.",
      bonds: [{ from: "N1", to: "N2", order: 3 }],
      lonePairsOn: [{ atom: "N1", count: 1 }, { atom: "N2", count: 1 }]
    },
    vseprExplanation: "The two sp-hybridized nitrogen atoms share one σ-bond and two mutually perpendicular π-bonds (bond energy 945 kJ/mol), resulting in a linear, inert molecule.",
    bondType: "COVALENT"
  },

  "C2H4": {
    formula: "C2H4",
    name: "Ethylene",
    iupacName: "Ethene",
    category: "Organic",
    valenceElectrons: 12,
    electronDomainGeometry: "Trigonal Planar at each Carbon",
    molecularGeometry: "Planar",
    geometry: "Planar",
    vseprClass: "Planar Alkene",
    hybridization: "sp²",
    bondAngles: "121.3° (H-C-H: 117.4°)",
    lonePairsCentral: 0,
    totalLonePairs: 0,
    lonePairs: 0,
    formalCharges: { "C": 0, "H": 0 },
    bondTypes: "1 C=C Double Bond (σ + π), 4 C–H σ Bonds",
    polarity: "Non-polar (Planar symmetry, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "   H     H\n    \\   /\n     C = C\n    /   \\\n   H     H",
      description: "Two sp² carbons linked by a double bond with coplanar hydrogen atoms.",
      bonds: [
        { from: "C1", to: "C2", order: 2 },
        { from: "C1", to: "H1", order: 1 }, { from: "C1", to: "H2", order: 1 },
        { from: "C2", to: "H3", order: 1 }, { from: "C2", to: "H4", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "Each carbon possesses 3 electron domains (2 single C–H bonds + 1 double C=C bond) oriented in a flat plane with ~120° angles to minimize steric repulsion.",
    bondType: "COVALENT"
  },

  "C2H2": {
    formula: "C2H2",
    name: "Acetylene",
    iupacName: "Ethyne",
    category: "Organic",
    valenceElectrons: 10,
    electronDomainGeometry: "Linear at each Carbon",
    molecularGeometry: "Linear",
    geometry: "Linear",
    vseprClass: "Linear Alkyne",
    hybridization: "sp",
    bondAngles: "180.0°",
    lonePairsCentral: 0,
    totalLonePairs: 0,
    lonePairs: 0,
    formalCharges: { "C": 0, "H": 0 },
    bondTypes: "1 C≡C Triple Bond (1σ + 2π), 2 C–H σ Bonds",
    polarity: "Non-polar (Linear symmetry, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: " H — C ≡ C — H",
      description: "Linear carbon chain with a triple bond between carbons.",
      bonds: [
        { from: "C1", to: "C2", order: 3 },
        { from: "C1", to: "H1", order: 1 },
        { from: "C2", to: "H2", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "Each carbon has 2 electron domains (1 C–H σ-bond + 1 C≡C triple bond) with sp hybridization oriented at 180°, maintaining cylindrical symmetry.",
    bondType: "COVALENT"
  },

  "C2H5OH": {
    formula: "C2H5OH",
    name: "Ethanol",
    iupacName: "Ethanol",
    category: "Organic",
    valenceElectrons: 20,
    electronDomainGeometry: "Tetrahedral (at Carbons & Oxygen)",
    molecularGeometry: "Aliphatic Chain",
    geometry: "Chain",
    vseprClass: "Chain",
    hybridization: "sp³",
    bondAngles: "109.5° (C-C-H), 104.5° (C-O-H)",
    lonePairsCentral: 2,
    totalLonePairs: 2,
    lonePairs: 2,
    formalCharges: { "C": 0, "H": 0, "O": 0 },
    bondTypes: "C–C σ, C–H σ, C–O σ, O–H σ Bonds",
    polarity: "Polar (Hydroxyl group dipole, μ = 1.69 D)",
    dipoleMoment: "1.69 D",
    lewisStructure: {
      diagram: "    H   H\n    |   |\n  H—C — C — :Ö̈ — H\n    |   |\n    H   H",
      description: "Ethyl hydrocarbon backbone linked to a polar hydroxyl functional group.",
      bonds: [
        { from: "C1", to: "C2", order: 1 },
        { from: "C2", to: "O", order: 1 },
        { from: "O", to: "H_oh", order: 1 }
      ],
      lonePairsOn: [{ atom: "O", count: 2 }]
    },
    vseprExplanation: "Ethanol contains sp³-hybridized carbons with tetrahedral 109.5° angles and an sp³-hybridized oxygen with 2 lone pairs yielding a bent C–O–H geometry at 104.5°.",
    bondType: "COVALENT"
  },

  "C6H12O6": {
    formula: "C6H12O6",
    name: "D-Glucose",
    iupacName: "(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal / β-D-Glucopyranose",
    category: "Biomolecules",
    valenceElectrons: 72,
    electronDomainGeometry: "Tetrahedral at each ring vertex (sp³)",
    molecularGeometry: "Pyranose Ring (Chair Conformation)",
    geometry: "Pyranose Ring",
    vseprClass: "Chair Ring",
    hybridization: "sp³",
    bondAngles: "109.5° (Tetrahedral ring vertices)",
    lonePairsCentral: 2,
    totalLonePairs: 12,
    lonePairs: 12,
    formalCharges: { "C": 0, "H": 0, "O": 0 },
    bondTypes: "C–C, C–O, C–H, O–H Covalent σ Bonds",
    polarity: "Highly Polar (Multiple -OH hydrogen bonding donors/acceptors)",
    dipoleMoment: "3.2 D",
    lewisStructure: {
      diagram: "      HO—CH₂\n          \\   O\n           \\ / \\\n            C---C\n           / \\ / \\\n          OH  OH  OH",
      description: "6-membered pyranose ring (5 carbons + 1 oxygen) with alternating equatorial and axial hydroxyl groups.",
      bonds: [],
      lonePairsOn: []
    },
    vseprExplanation: "The six-membered pyranose ring puckers into the chair conformation to maintain ideal 109.5° tetrahedral angles at all 5 carbons and the ring oxygen, placing all bulky –OH groups in equatorial orientations to minimize 1,3-diaxial steric strain.",
    bondType: "COVALENT"
  },

  "C6H6": {
    formula: "C6H6",
    name: "Benzene",
    iupacName: "Benzene",
    category: "Organic",
    valenceElectrons: 30,
    electronDomainGeometry: "Trigonal Planar (at all 6 Carbons)",
    molecularGeometry: "Planar Ring (Aromatic)",
    geometry: "Planar Ring",
    vseprClass: "Planar Ring",
    hybridization: "sp²",
    bondAngles: "120.0°",
    lonePairsCentral: 0,
    totalLonePairs: 0,
    lonePairs: 0,
    formalCharges: { "C": 0, "H": 0 },
    bondTypes: "6 Delocalized Aromatic C-C Bonds (Bond Order 1.5), 6 C-H σ Bonds",
    polarity: "Non-polar (Centrosymmetric planar cancellation, μ = 0 D)",
    dipoleMoment: "0.0 D",
    lewisStructure: {
      diagram: "    H     H\n     \\   /\n      C=C\n     /   \\\n  H-C     C-H\n     \\   /\n      C=C\n     /   \\\n    H     H",
      description: "Hexagonal planar ring with 6 delocalized π-electrons obeying Hückel's 4n+2 rule.",
      bonds: [],
      lonePairsOn: []
    },
    vseprExplanation: "Each carbon atom is sp²-hybridized with three σ-bonds at 120.0° in a flat plane. The remaining unhybridized 2p orbitals overlap continuously around the ring, creating a doughnut-shaped delocalized π-electron cloud.",
    bondType: "COVALENT"
  },

  "NH4+": {
    formula: "NH4+",
    name: "Ammonium Cation",
    iupacName: "Ammonium",
    category: "Ions",
    centralAtom: "N",
    ligands: [{ atom: "H", count: 4 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Tetrahedral",
    geometry: "Tetrahedral",
    vseprClass: "AX₄",
    hybridization: "sp³",
    bondAngles: "109.5°",
    lonePairsCentral: 0,
    totalLonePairs: 0,
    lonePairs: 0,
    formalCharges: { "N": 1, "H": 0 },
    bondTypes: "4 Single Covalent σ Bonds (N–H) including 1 coordinate covalent bond",
    polarity: "Charged Polyatomic Ion (+1 Net Charge)",
    dipoleMoment: "0.0 D (Symmetric)",
    lewisStructure: {
      diagram: "       H\n       |\n   H — N⁺ — H\n       |\n       H",
      description: "Nitrogen with 4 N–H single bonds and a formal charge of +1.",
      bonds: [
        { from: "N", to: "H1", order: 1 }, { from: "N", to: "H2", order: 1 },
        { from: "N", to: "H3", order: 1 }, { from: "N", to: "H4", order: 1 }
      ],
      lonePairsOn: []
    },
    vseprExplanation: "Protonation of ammonia's lone pair creates four equivalent N–H σ-bonds. With 4 bonding domains and 0 lone pairs on nitrogen, the geometry is a regular tetrahedron with 109.5° angles and a +1 formal charge on Nitrogen.",
    bondType: "COVALENT"
  },

  "H3O+": {
    formula: "H3O+",
    name: "Hydronium Cation",
    iupacName: "Oxonium",
    category: "Ions",
    centralAtom: "O",
    ligands: [{ atom: "H", count: 3 }],
    valenceElectrons: 8,
    electronDomainGeometry: "Tetrahedral (4 Domains)",
    molecularGeometry: "Trigonal Pyramidal",
    geometry: "Trigonal Pyramidal",
    vseprClass: "AX₃E",
    hybridization: "sp³",
    bondAngles: "113.0°",
    lonePairsCentral: 1,
    totalLonePairs: 1,
    lonePairs: 1,
    formalCharges: { "O": 1, "H": 0 },
    bondTypes: "3 Single Covalent σ Bonds (O–H)",
    polarity: "Polar Polyatomic Cation (+1 Net Charge)",
    dipoleMoment: "1.4 D",
    lewisStructure: {
      diagram: "     :O⁺\n    / | \\\n   H  H  H",
      description: "Central oxygen with 3 single bonds to hydrogen, 1 lone pair, and a formal charge of +1.",
      bonds: [
        { from: "O", to: "H1", order: 1 },
        { from: "O", to: "H2", order: 1 },
        { from: "O", to: "H3", order: 1 }
      ],
      lonePairsOn: [{ atom: "O", count: 1 }]
    },
    vseprExplanation: "Oxygen is sp³-hybridized with 3 O–H bonds and 1 lone pair. The positive formal charge increases proton-proton repulsion, opening the bond angle slightly to ~113°.",
    bondType: "COVALENT"
  },

  "NaCl": {
    formula: "NaCl",
    name: "Sodium Chloride",
    iupacName: "Sodium Chloride",
    category: "Common compounds",
    valenceElectrons: 8,
    electronDomainGeometry: "FCC Crystal Lattice (Octahedral 6:6 Coordination)",
    molecularGeometry: "Cubic Lattice",
    geometry: "Lattice",
    vseprClass: "Ionic Lattice",
    hybridization: "Ionic (Non-directional electrostatic potential)",
    bondAngles: "90.0°",
    lonePairsCentral: 4,
    totalLonePairs: 4,
    lonePairs: 4,
    formalCharges: { "Na": 1, "Cl": -1 },
    bondTypes: "Ionic Electrostatic Coulombic Lattice",
    polarity: "Ionic Compound (High lattice energy: 786 kJ/mol)",
    dipoleMoment: "9.0 D (in vapor)",
    lewisStructure: {
      diagram: " [Na]⁺ [:C̈l:]⁻\n         ¨",
      description: "Full electron transfer from sodium 3s to chlorine 3p, yielding Na⁺ and Cl⁻ with complete octets.",
      bonds: [],
      lonePairsOn: [{ atom: "Cl", count: 4 }]
    },
    vseprExplanation: "Sodium completely transfers its single 3s valence electron to Chlorine's 3p orbital. The resulting Na⁺ and Cl⁻ spherical ions stack into an alternating face-centered cubic (FCC) lattice with 6:6 octahedral coordination.",
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
  
  // Clean unmatched trailing bracket/paren typos
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
  
  "hydrogen sulfide": "H2S",
  "h2s": "H2S",
  
  "sulfur hexafluoride": "SF6",
  "sf6": "SF6",
  
  "phosphorus pentachloride": "PCl5",
  "pcl5": "PCl5",
  
  "ethylene": "C2H4",
  "ethene": "C2H4",
  "c2h4": "C2H4",
  
  "acetylene": "C2H2",
  "ethyne": "C2H2",
  "c2h2": "C2H2",
  
  "ammonium": "NH4+",
  "ammonium ion": "NH4+",
  "nh4+": "NH4+",
  "nh4": "NH4+",
  
  "hydronium": "H3O+",
  "hydronium ion": "H3O+",
  "h3o+": "H3O+",
  "h3o": "H3O+",
  
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

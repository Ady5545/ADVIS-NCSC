import { LearningSession, LearnStep } from '../LearnTypes';

export const BF3_TEACH_STEPS: LearnStep[] = [
  {
    id: 'bf3_step_1',
    title: 'Identify the central atom',
    explanation: 'Boron (B) is the central atom because it is less electronegative than Fluorine (F).',
    reasoning: 'In most molecules, the least electronegative atom is placed in the center. Boron forms the core of BF₃, surrounded by three Fluorine atoms.',
    visualStateId: 'bf3_central_atom'
  },
  {
    id: 'bf3_step_2',
    title: 'Boron Electronic Configuration',
    explanation: 'The ground state electronic configuration of Boron (Z=5) is 1s² 2s² 2p¹.',
    reasoning: 'The valence shell is n=2, containing three electrons (two in 2s, one in 2p). Only valence electrons participate in bonding.',
    visualStateId: 'bf3_ground_state'
  },
  {
    id: 'bf3_step_3',
    title: 'Valence Electrons',
    explanation: 'Boron has 3 valence electrons in the 2s and 2p orbitals.',
    reasoning: 'To form three bonds with three Fluorine atoms, Boron needs three unpaired electrons. Currently, it only has one unpaired electron in the 2p subshell.',
    visualStateId: 'bf3_valence_electrons'
  },
  {
    id: 'bf3_step_4',
    title: 'Excitation',
    explanation: 'One of the 2s electrons is promoted to the empty 2p orbital.',
    reasoning: 'This excitation creates three unpaired electrons (one in 2s, two in 2p), making it possible to form three covalent bonds. (Note: This is a pedagogical model to explain the equal bonding we observe).',
    visualStateId: 'bf3_excitation'
  },
  {
    id: 'bf3_step_5',
    title: 'Hybridisation',
    explanation: 'The one 2s orbital and two 2p orbitals mix to form three equivalent sp² hybrid orbitals.',
    reasoning: 'These three hybrid orbitals are degenerate (equal in energy) and orient themselves as far apart as possible to minimize electron repulsion, leading to a trigonal planar geometry.',
    visualStateId: 'bf3_hybridisation'
  },
  {
    id: 'bf3_step_6',
    title: 'Remaining p Orbital',
    explanation: 'One 2p orbital remains unhybridized and empty.',
    reasoning: 'Since only two p orbitals were used in the sp² hybridisation, the third p orbital is perpendicular to the plane of the hybrid orbitals.',
    visualStateId: 'bf3_empty_p'
  },
  {
    id: 'bf3_step_7',
    title: 'Fluorine Bonding Orbitals',
    explanation: 'Each Fluorine atom has seven valence electrons, with one unpaired electron in a 2p orbital.',
    reasoning: 'Fluorine (1s² 2s² 2p⁵) needs one electron to complete its octet. Its half-filled 2p orbital will overlap with Borons hybrid orbitals.',
    visualStateId: 'bf3_fluorine_atoms'
  },
  {
    id: 'bf3_step_8',
    title: 'Orbital Overlap (Sigma Bonding)',
    explanation: 'The three sp² hybrid orbitals of Boron overlap axially with the 2p orbitals of three Fluorine atoms.',
    reasoning: 'This axial overlap forms three strong single covalent bonds (sigma bonds).',
    visualStateId: 'bf3_sigma_bonds'
  },
  {
    id: 'bf3_step_9',
    title: 'Molecular Geometry',
    explanation: 'The final molecule is trigonal planar, with bond angles of 120°.',
    reasoning: 'The three electron domains (the B-F bonds) repel each other equally, resulting in the most stable arrangement: a flat triangle.',
    visualStateId: 'bf3_geometry'
  },
  {
    id: 'bf3_step_10',
    title: 'Summary',
    explanation: 'Boron forms three sp² hybrid orbitals to create three sigma bonds with Fluorine, resulting in a trigonal planar BF₃ molecule.',
    reasoning: 'Central atom (Boron) → 3 valence electrons → Excitation for 3 unpaired electrons → sp² hybridisation → 3 sigma bonds → Trigonal Planar (120°).',
    visualStateId: 'bf3_summary'
  }
];

export const createBF3Session = (mode: 'SHOW_ME' | 'TEACH_ME'): LearningSession => ({
  id: `session_bf3_${Date.now()}`,
  context: {
    classLevel: '11',
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    topic: 'Hybridisation'
  },
  mode: mode,
  difficulty: 'Beginner',
  steps: mode === 'TEACH_ME' ? BF3_TEACH_STEPS : [BF3_TEACH_STEPS[BF3_TEACH_STEPS.length - 1]], // Show me just shows the summary
  currentStepIndex: 0,
  completed: false
});

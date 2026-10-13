export type DomainModuleKey =
  | 'chemistry'
  | 'anatomy'
  | 'electrical'
  | 'structures'
  | 'fluid-mechanics'
  | 'aerospace'
  | 'robotics';

export type DomainValidationLevel =
  | 'CONCEPTUAL_VISUALIZATION'
  | 'PRESENTATION_ANIMATION'
  | 'KINEMATIC_EDUCATIONAL_APPROXIMATION'
  | 'ANALYTICAL_EDUCATIONAL_APPROXIMATION';

export interface DomainLearningModule {
  id: DomainModuleKey;
  title: string;
  domain: string;
  modelId: string;
  lessonId: string;
  validationLevel: DomainValidationLevel;
  analyticalTools: string[];
  supportedWorkflows: string[];
  limitations: string[];
  publicationStatus: 'EDUCATIONAL_DRAFT';
}

export const DOMAIN_LEARNING_MODULES: DomainLearningModule[] = [
  {
    id: 'chemistry',
    title: 'Molecular and Atomic Structure',
    domain: 'CHEMISTRY',
    modelId: 'hydrogen_atom',
    lessonId: 'hydrogen-atom-probability-cloud',
    validationLevel: 'CONCEPTUAL_VISUALIZATION',
    analyticalTools: ['atom and bond exploration', 'authored concept explanations'],
    supportedWorkflows: ['inspect', 'rotate', 'guided lesson'],
    limitations: [
      'The hydrogen cloud in the catalog is conceptual and is not a wavefunction-derived density field.',
      'This manifest does not supply molecular dynamics, orbital computation, or quantum chemistry.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'anatomy',
    title: 'Human Anatomy and Organ Systems',
    domain: 'ANATOMY',
    modelId: 'human_heart',
    lessonId: 'anatomy-heart-flow-basics',
    validationLevel: 'PRESENTATION_ANIMATION',
    analyticalTools: ['anatomical component explanation', 'conceptual blood-flow paths'],
    supportedWorkflows: ['inspect', 'hide and isolate where supported', 'guided lesson'],
    limitations: [
      'The model is educational and not patient-specific.',
      'No clinical diagnosis, surgical planning, or validated hemodynamic prediction is provided.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'electrical',
    title: 'Electrical Engineering Foundations',
    domain: 'ELECTRICAL_ENGINEERING',
    modelId: 'arduino_uno',
    lessonId: 'arduino-circuit-basics',
    validationLevel: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    analyticalTools: ['Ohm’s law and power calculator'],
    supportedWorkflows: ['inspect', 'read component descriptions', 'guided lesson'],
    limitations: [
      'The 3D board is a visual aid; no circuit schematic is automatically inferred from rendered appearance.',
      'The Ohm-law calculator is a separate ideal lumped-element calculation, not a board-level simulator.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'structures',
    title: 'Structures, Loads, and Materials',
    domain: 'STRUCTURES_AND_MATERIALS',
    modelId: 'suspension',
    lessonId: 'suspension-load-paths',
    validationLevel: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    analyticalTools: ['Euler–Bernoulli cantilever beam formula'],
    supportedWorkflows: ['inspect load-path concepts', 'run independent textbook beam calculation'],
    limitations: [
      'The beam calculator is not finite-element analysis and is not coupled to the suspension mesh.',
      'No catalog material grade, strength, fatigue life, or safety factor is assumed or certified.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'fluid-mechanics',
    title: 'Fluid Paths and Pressure',
    domain: 'FLUID_MECHANICS',
    modelId: 'hydraulic_pump',
    lessonId: 'hydraulic-pump-flow-path',
    validationLevel: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    analyticalTools: ['continuity and ideal Bernoulli calculator'],
    supportedWorkflows: ['inspect flow-path concepts', 'run ideal steady-flow calculation'],
    limitations: [
      'The equations are not a CFD solver and are not coupled to this pump’s geometry.',
      'The calculator neglects friction, pump work, elevation changes, and many real-flow effects.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'aerospace',
    title: 'Aerospace and Jet-Engine Concepts',
    domain: 'AEROSPACE',
    modelId: 'jet_engine_core',
    lessonId: 'jet-engine-energy-path',
    validationLevel: 'CONCEPTUAL_VISUALIZATION',
    analyticalTools: ['Mach and dynamic-pressure formulas using supplied inputs'],
    supportedWorkflows: ['inspect energy-path concepts', 'run independent formula calculations'],
    limitations: [
      'The jet engine is a concept model, not a validated engine cycle or thrust prediction.',
      'No aerodynamics, CFD, flight dynamics, or airworthiness computation is performed.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
  {
    id: 'robotics',
    title: 'Robotics and Mechanism Kinematics',
    domain: 'ROBOTICS',
    modelId: 'sg90_servo',
    lessonId: 'servo-motion-controls',
    validationLevel: 'KINEMATIC_EDUCATIONAL_APPROXIMATION',
    analyticalTools: ['planar two-link forward kinematics'],
    supportedWorkflows: ['inspect servo concepts', 'calculate a separate two-link endpoint'],
    limitations: [
      'Forward kinematics is a separate ideal planar linkage model, not a calibrated simulation of the SG90 asset.',
      'No inverse kinematics, torque dynamics, collision checking, or physical robot safety controller is claimed.',
    ],
    publicationStatus: 'EDUCATIONAL_DRAFT',
  },
];

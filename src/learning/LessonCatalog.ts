import type { LearningLesson } from './LessonSchema';

/**
 * Authored, free fallback lessons. These require no AI service or account.
 * They are marked EDUCATIONAL_DRAFT until the planned subject-matter review is completed.
 */
export const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: 'v8-four-stroke-explorer',
    version: 1,
    title: 'Inside a Cross-Plane V8',
    domain: 'MECHANICAL_ENGINEERING',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Identify the major V8 assemblies, inspect the cranktrain, and explore the four-stroke cycle without confusing animation with validated engine simulation.',
    modelId: 'v8_engine',
    prerequisites: ['Basic idea of a piston and a rotating shaft'],
    learningObjectives: [
      'Identify the block, crankshaft, piston banks, valvetrain and intake/exhaust systems.',
      'Explain how connecting rods link piston motion to crankshaft rotation.',
      'Describe a four-stroke cycle across 720 crank degrees.',
      'Distinguish illustrative kinematics from a validated thermodynamic performance simulation.'
    ],
    estimatedMinutes: 8,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The V8 is a representative educational assembly, not an exact OEM engine.',
      'The crank-angle, valve motion and audio controls are illustrative; this lesson makes no validated torque, power, fuel consumption or combustion prediction.',
      'The firing sequence shown in the HUD is an example and is not universal to all V8 engines.'
    ],
    steps: [
      {
        id: 'orientation',
        title: 'Meet the engine',
        objective: 'Recognize that a V8 contains two banks of four cylinders arranged around a common cranktrain.',
        explanation: 'This is a representative 90-degree, cross-plane, overhead-valve (OHV) V8. The central crankcase supports the crankshaft, the two banks hold the pistons and cylinder heads, and the intake and exhaust systems route gases.',
        learnerTask: 'Rotate the engine with the mouse or trackpad. Find the central block and both cylinder banks.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Start with the largest casting at the centre; the crankshaft and cylinder banks attach to it.',
        estimatedMinutes: 1
      },
      {
        id: 'identify-block',
        title: 'Find the engine block',
        objective: 'Connect the engine block to the structure that supports the cylinders and crankshaft bearings.',
        explanation: 'The block/crankcase forms the main structure. In a real engine it contains cylinder bores or liners, bearing supports and passages. The present model illustrates these features but is not dimensionally authoritative.',
        learnerTask: 'Select “Deep-Skirt V8 Engine Block” in the component explorer or click it in the 3D scene.',
        action: { type: 'SELECT_COMPONENT', componentId: 'v8_block' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'v8_block' },
        hint: 'Use the component explorer if selecting the block in the 3D view is difficult.',
        estimatedMinutes: 1
      },
      {
        id: 'separate-assemblies',
        title: 'Disassemble the engine',
        objective: 'See that an engine is an assembly of distinct subsystems, not one solid object.',
        explanation: 'An exploded view is a spatial teaching aid. Parts are moved away from their assembled positions so their identities and relationships are easier to inspect. The offsets in this educational model are presentation positions, not service-removal trajectories.',
        learnerTask: 'Move the explosion control to fully separated, then select the crankshaft, heads and intake separately.',
        action: { type: 'SET_EXPLOSION', factor: 1 },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'If parts are hidden, use Show All in the component explorer.',
        estimatedMinutes: 1
      },
      {
        id: 'crankshaft',
        title: 'Follow the crankshaft',
        objective: 'Explain how connecting rods transfer piston force to offset crankpins.',
        explanation: 'The connecting rod links the piston wrist pin to a crankpin. As the crankshaft rotates, the rod converts reciprocating piston travel into rotary motion. Real crankshaft loads and vibration depend on geometry, mass, combustion pressure and balancing—none are inferred from this visual model alone.',
        learnerTask: 'Select the “Four-Throw Cross-Plane Crankshaft” and inspect its position relative to the two piston banks.',
        action: { type: 'SELECT_COMPONENT', componentId: 'v8_crankshaft' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'v8_crankshaft' },
        question: {
          id: 'crankshaft-role',
          prompt: 'What is the crankshaft’s primary role in the piston mechanism?',
          choices: [
            { id: 'a', text: 'Convert linked reciprocating motion into rotary motion' },
            { id: 'b', text: 'Filter oil before it reaches the bearings' },
            { id: 'c', text: 'Meter all intake air by itself' }
          ],
          correctChoiceId: 'a',
          explanation: 'Correct. Offset crankpins and connecting rods translate piston travel into crankshaft rotation. The oil filter and throttle have different functions.',
          hint: 'Think about which part turns continuously while the pistons travel up and down.'
        },
        estimatedMinutes: 1
      },
      {
        id: 'four-stroke-cycle',
        title: 'Explore the four-stroke cycle',
        objective: 'Relate crank angle to intake, compression, power and exhaust over two crankshaft revolutions.',
        explanation: 'A four-stroke cycle spans 720 degrees of crankshaft rotation: intake, compression, power and exhaust. The valves must be timed relative to piston position. The current V8 animation is a kinematic teaching representation, not a validated combustion simulation.',
        learnerTask: 'Set the crank angle to 180 degrees, then scrub to 360, 540 and 720 degrees. Observe the phase display.',
        action: { type: 'SCRUB_CYCLE', angleDeg: 180 },
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'cycle-angle',
          prompt: 'How many crankshaft degrees are in one complete four-stroke cycle?',
          choices: [
            { id: '360', text: '360 degrees (one crankshaft revolution)' },
            { id: '720', text: '720 degrees (two crankshaft revolutions)' },
            { id: '90', text: '90 degrees for the entire cycle' }
          ],
          correctChoiceId: '720',
          explanation: 'A four-stroke cycle uses two crankshaft revolutions, so its cycle angle is 720 degrees. Individual firing intervals in an even-fire eight-cylinder four-stroke engine average 90 crank degrees.',
          hint: 'Each revolution is 360 degrees; a four-stroke cycle spans two revolutions.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'rpm-experiment',
        title: 'Change RPM and observe',
        objective: 'Understand that RPM controls rotational rate, not the canonical dimensions of the engine.',
        explanation: 'RPM is revolutions per minute. Increasing RPM increases the rate of the animation and the frequency content of the synthesized sound. This control does not calculate real power, torque, temperature, fuel use or mechanical durability.',
        learnerTask: 'Set the model to 1,000 RPM, observe briefly, then increase it to 2,400 RPM. Compare how quickly the crank angle changes.',
        action: { type: 'SET_RPM', rpm: 1000 },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Compare the time taken to complete the same angular interval at both settings.',
        estimatedMinutes: 1
      },
      {
        id: 'reassemble',
        title: 'Restore the assembly',
        objective: 'Return the model to its canonical state and summarize what each subsystem contributes.',
        explanation: 'A good engineering explanation links parts into a system: the block supports the assembly, pistons and rods move, the crankshaft rotates, the valvetrain controls gas exchange, and intake/exhaust systems route the working gases. Different engines use different layouts and specifications.',
        learnerTask: 'Reassemble the engine, restore the solid view, and name one part that supports structure and one that transmits motion.',
        action: { type: 'RESET_VIEW' },
        completionRule: { type: 'ACKNOWLEDGE' },
        estimatedMinutes: 1
      }
    ]
  },
  {
    id: 'hydrogen-atom-probability-cloud',
    version: 1,
    title: 'Understanding the Hydrogen Atom',
    domain: 'CHEMISTRY',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Explore the nucleus and electron probability-density representation while separating a scientific visualization from a literal picture of a tiny planetary system.',
    modelId: 'hydrogen_atom',
    prerequisites: ['Atoms contain a nucleus and electrons'],
    learningObjectives: [
      'Distinguish the nucleus from the electron probability-density representation.',
      'Explain why the cloud is not a fixed circular electron orbit.',
      'Read a scientific concept model with scale and representation limitations in mind.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The displayed cloud is an illustrative probability-density visualization and is not a source-calculated orbital for a declared quantum state.',
      'The geometry is not to physical scale; visual particle size should not be interpreted as actual relative atomic dimensions.'
    ],
    steps: [
      {
        id: 'look-at-model',
        title: 'Observe the whole atom',
        objective: 'Identify the central nucleus and surrounding cloud representation.',
        explanation: 'The nucleus contains protons and, for most atoms, neutrons. Electrons are described quantum mechanically; many educational diagrams use a probability-density cloud to communicate where a measurement is more likely to find an electron.',
        learnerTask: 'Rotate and zoom the model. Notice the centre and the surrounding translucent cloud.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        estimatedMinutes: 1
      },
      {
        id: 'probability-density',
        title: 'What does the cloud mean?',
        objective: 'Avoid interpreting the electron cloud as a fixed orbit or a painted physical shell.',
        explanation: 'A probability-density visualization communicates a distribution of measurement outcomes for a quantum state. This particular cloud is an educational concept rendering; it is not a numerical solution for a specified wavefunction.',
        learnerTask: 'Look at the cloud from different directions, then answer the question.',
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'electron-cloud' },
        question: {
          id: 'electron-cloud',
          prompt: 'What should the cloud be understood to represent?',
          choices: [
            { id: 'orbit', text: 'A tiny electron following a fixed circular track like a planet' },
            { id: 'probability', text: 'An illustrative representation of electron probability density' },
            { id: 'shell', text: 'A solid material shell with a sharp outer surface' }
          ],
          correctChoiceId: 'probability',
          explanation: "Correct. The cloud is a representation of probability density, not a fixed planetary path or a hard shell. This model's specific cloud remains conceptual, not a validated plotted quantum state.",
          hint: 'Think about where an electron may be found when measured, rather than an exact path.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'scale-and-evidence',
        title: 'Read the limits of a model',
        objective: 'Understand that a useful visualization may be conceptual rather than geometrically or quantitatively exact.',
        explanation: 'A 3D picture can help explain a concept without containing source-validated dimensions or a computed scientific field. The evidence and limitations panel is part of learning the model responsibly.',
        learnerTask: 'Find the model description and explain one thing the visualization does not claim.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Consider whether the cloud was calculated from a stated wavefunction or is a conceptual representation.',
        estimatedMinutes: 2
      }
    ]
  }
];

export function getLessonById(lessonId: string): LearningLesson | undefined {
  return LEARNING_LESSONS.find((lesson) => lesson.id === lessonId);
}

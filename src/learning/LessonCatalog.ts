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
  },

  {
    id: 'arduino-circuit-basics',
    version: 1,
    title: 'Electrical Foundations with a Microcontroller Board',
    domain: 'ELECTRICAL_ENGINEERING',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Inspect a representative controller board and use Ohm’s law as a separate ideal-circuit calculation without assuming that a rendered board is a wired schematic.',
    modelId: 'arduino_uno',
    prerequisites: ['Voltage, current, and resistance as distinct quantities'],
    learningObjectives: [
      'Distinguish the rendered controller board from an electrical schematic.',
      'Use V = I R to relate voltage, current, and resistance in an ideal element.',
      'Explain why a visual component label is not proof that a complete circuit has been solved.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The component geometry is an educational visual asset; pin voltages and circuit topology are not inferred from the rendered mesh.',
      'The platform does not model board-level electrical transients or certify hardware wiring.',
      'Lesson content requires independent subject-matter review before publication.'
    ],
    steps: [
      {
        id: 'board-overview',
        title: 'Inspect the board as a system',
        objective: 'Recognize the controller, connectors, and supporting components as distinct parts of a larger electronic system.',
        explanation: 'A microcontroller board packages a processor and supporting circuits behind accessible connectors. A 3D model helps orient you to physical layout, but schematic symbols and net connections describe the electrical relationships.',
        learnerTask: 'Rotate the board and identify the main controller and at least one connector in the component explorer.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Look for the main integrated circuit and the headers around the board edge.',
        estimatedMinutes: 2
      },
      {
        id: 'ohms-law',
        title: 'Connect voltage, current, and resistance',
        objective: 'Calculate the current through an ideal resistor using Ohm’s law.',
        explanation: 'For a linear resistor under the idealized conditions assumed here, I = V/R. With 5 volts across 10 ohms, the current is 0.5 amperes. This is a textbook calculation, not a claim about the selected board’s actual pin or load.',
        learnerTask: 'Answer the question using I = V/R and check the units before selecting an answer.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'ohms-law-current',
          prompt: 'An ideal 10 Ω resistor has 5 V across it. What current follows from Ohm’s law?',
          choices: [
            { id: 'a', text: '0.5 A' },
            { id: 'b', text: '2 A' },
            { id: 'c', text: '50 A' }
          ],
          correctChoiceId: 'a',
          explanation: 'I = V/R = 5 V / 10 Ω = 0.5 A. The equation describes the ideal resistor in the example, not an inferred board measurement.',
          hint: 'Divide voltage by resistance. One volt per ohm is one ampere.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'read-limits',
        title: 'Separate a model from a circuit solution',
        objective: 'Explain what additional evidence is needed to calculate actual circuit behavior.',
        explanation: 'A solved circuit needs a defined topology, component values, supply conditions, and the appropriate analysis method. A detailed-looking board render does not supply all of that information.',
        learnerTask: 'State one electrical property that cannot be determined from the 3D board appearance alone.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Consider an exact net connection, loaded pin voltage, or transient current.',
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'suspension-load-paths',
    version: 1,
    title: 'Load Paths in a Suspension Assembly',
    domain: 'STRUCTURES_AND_MATERIALS',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Follow how a suspension assembly transfers loads while distinguishing structural principles from uncomputed stress or fatigue results.',
    modelId: 'suspension',
    prerequisites: ['Force as an interaction that can change motion'],
    learningObjectives: [
      'Identify the difference between a component shape and a load path.',
      'Explain why loads, supports, geometry, and material properties are all needed for stress analysis.',
      'Distinguish an illustrative beam equation from a validated finite-element result.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The suspension geometry is illustrative and not tied to an OEM revision or dimensioned drawing.',
      'The workshop does not calculate suspension stress, fatigue life, crashworthiness, or vehicle safety.',
      'The independent cantilever formula in the analytical module is not coupled to this mesh.'
    ],
    steps: [
      {
        id: 'trace-assembly',
        title: 'Trace the assembly',
        objective: 'Understand that force is transmitted through connected structural components.',
        explanation: 'Suspension components guide wheel motion and transmit forces between the wheel assembly and the vehicle structure. The real load path depends on joints, contact conditions, applied loads, and boundary constraints.',
        learnerTask: 'Rotate the model and use the component explorer to identify one link and one spring/damper-related component.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Look for an elongated arm or linkage and a component associated with compliance or damping.',
        estimatedMinutes: 2
      },
      {
        id: 'stress-evidence',
        title: 'What does a stress result require?',
        objective: 'Recognize the evidence required before interpreting stresses or allowable limits.',
        explanation: 'Stress analysis depends on loads, restraints, dimensions, constitutive material data, and the chosen numerical or analytical method. Colouring a mesh does not by itself establish a valid stress result.',
        learnerTask: 'Choose the answer that lists the key inputs needed before structural stresses can be trusted.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'stress-inputs',
          prompt: 'Which set of information is needed for a defensible structural stress calculation?',
          choices: [
            { id: 'a', text: 'Applied loads, boundary conditions, geometry, material properties, and a documented method' },
            { id: 'b', text: 'Only a high-resolution render and a dramatic heat map' },
            { id: 'c', text: 'Only the part’s displayed colour' }
          ],
          correctChoiceId: 'a',
          explanation: 'Stress depends on the loads and constraints as well as geometry, material behavior, and the calculation method. No such validated analysis is implied by this visual assembly.',
          hint: 'Ask what determines the equations and the boundary-value problem.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'beam-assumptions',
        title: 'Use a simplified beam model carefully',
        objective: 'Recognize when the cantilever equation is and is not applicable.',
        explanation: 'The independent beam calculator uses Euler–Bernoulli theory for a straight, prismatic, linearly elastic cantilever with a free-end point load and small deflection. It is not an FEA solver and is not a model of this suspension assembly.',
        learnerTask: 'Name one assumption of the simplified beam formula and one reason a real suspension needs a more complete analysis.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Think about linear elasticity, small deflection, joint loads, or changing cross-sections.',
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'hydraulic-pump-flow-path',
    version: 1,
    title: 'Flow Paths Through a Hydraulic Pump',
    domain: 'FLUID_MECHANICS',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Learn how a pump contributes to a fluid system and use continuity/Bernoulli only within their stated ideal-flow assumptions.',
    modelId: 'hydraulic_pump',
    prerequisites: ['Pressure and velocity as different fluid properties'],
    learningObjectives: [
      'Trace an inlet-to-outlet flow-path concept.',
      'Explain continuity for steady incompressible flow.',
      'Identify limitations of an ideal Bernoulli calculation for a real pump.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The pump render is a concept model and does not define internal clearances or authoritative flow passages.',
      'The calculator uses a steady, incompressible, same-elevation ideal-flow model with no pump work or losses between stations.',
      'No CFD or real pump-performance curve is included.'
    ],
    steps: [
      {
        id: 'pump-overview',
        title: 'Orient to the fluid system',
        objective: 'Identify why an inlet, an outlet, and a pump’s energy input matter to a fluid system.',
        explanation: 'A pump supplies mechanical energy to a fluid. A complete analysis also needs flow rate, pressure conditions, fluid properties, losses, and the particular pump design.',
        learnerTask: 'Rotate the pump model and inspect the major assembly labels.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Start by finding the main body and the visible inlet/outlet features.',
        estimatedMinutes: 2
      },
      {
        id: 'continuity',
        title: 'Relate area and velocity',
        objective: 'Use the steady incompressible continuity equation in a simple passage.',
        explanation: 'For a steady, incompressible stream with no side branches, A₁v₁ = A₂v₂. If a passage area halves, the ideal average speed doubles for the same volume flow rate.',
        learnerTask: 'Choose the result that follows from halving passage area while holding volume flow rate constant.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'continuity-area',
          prompt: 'For steady incompressible flow, if the passage area halves and flow rate remains constant, what happens to average velocity?',
          choices: [
            { id: 'a', text: 'It doubles' },
            { id: 'b', text: 'It halves' },
            { id: 'c', text: 'It remains unchanged' }
          ],
          correctChoiceId: 'a',
          explanation: 'Since Q = A v is constant, reducing A by a factor of two increases v by a factor of two. This is the ideal continuity relation, not a prediction of flow inside the displayed pump.',
          hint: 'Solve Q = A v for v while keeping Q constant.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'bernoulli-limit',
        title: 'Read the assumptions',
        objective: 'Explain why the simplest Bernoulli equation is not a complete pump simulation.',
        explanation: 'The ideal Bernoulli equation assumes steady incompressible flow along a streamline and neglects losses and energy added by pumps between the compared points. Real systems need those effects and measured or sourced boundary conditions.',
        learnerTask: 'Name one real-pump effect that the ideal between-stations calculation omits.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Consider friction losses, the pump head curve, fluid viscosity, or changing elevation.',
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'jet-engine-energy-path',
    version: 1,
    title: 'Energy Flow Through a Jet Engine',
    domain: 'AEROSPACE',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Trace the conceptual compressor–combustor–turbine path and distinguish a visualization from a validated engine-cycle or thrust calculation.',
    modelId: 'jet_engine_core',
    prerequisites: ['Energy can be transferred between thermal and mechanical forms'],
    learningObjectives: [
      'Order the major flow-path stages in a simple gas-turbine engine.',
      'Explain the roles of compressor and turbine.',
      'Identify the data required for a quantitative thrust or cycle prediction.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'This catalog object is a representative educational engine-core visualization, not a specified certified engine variant.',
      'The lesson does not calculate thrust, fuel flow, pressure ratio, turbine temperature, or aircraft performance.',
      'The geometry and materials are not source-validated for engineering design.'
    ],
    steps: [
      {
        id: 'flow-path',
        title: 'Follow the engine flow path',
        objective: 'Recognize the compressor, combustor, and turbine as connected stages.',
        explanation: 'A simple gas-turbine core compresses incoming air, adds energy by burning fuel, and expands hot gas through a turbine. The turbine drives the compressor; the remaining flow may contribute to useful output depending on engine design.',
        learnerTask: 'Inspect the engine core and locate the major stage labels.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Look for successive compressor, combustion, and turbine regions along the flow direction.',
        estimatedMinutes: 2
      },
      {
        id: 'compressor-turbine',
        title: 'Connect turbine work to compression',
        objective: 'Explain why the turbine and compressor are mechanically coupled.',
        explanation: 'The turbine extracts work from expanding gas and provides shaft power to drive the compressor. The energy balance depends on mass flow, thermodynamic state, component efficiency, and the engine configuration.',
        learnerTask: 'Choose the statement that describes the turbine’s relationship to the compressor.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'turbine-compressor',
          prompt: 'In a basic gas-turbine core, what does the turbine principally do for the compressor?',
          choices: [
            { id: 'a', text: 'Extracts shaft work from hot gas to drive the compressor' },
            { id: 'b', text: 'Removes the need for compression' },
            { id: 'c', text: 'Measures thrust without any flow data' }
          ],
          correctChoiceId: 'a',
          explanation: 'The turbine converts part of the gas energy into shaft work that drives the compressor. The actual work balance is model-specific and is not computed by this visual asset.',
          hint: 'Think about which rotating stage supplies mechanical power to the upstream compressor.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'performance-evidence',
        title: 'Know what a thrust estimate needs',
        objective: 'Distinguish a conceptual engine diagram from a quantitative aerospace model.',
        explanation: 'A defensible thrust or engine-cycle calculation requires model-specific inlet and outlet conditions, mass flow, pressure/temperature states, and appropriate component and nozzle models. None are inferable from the picture alone.',
        learnerTask: 'List one state variable or reference datum that would be needed before reporting numerical thrust.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Consider mass flow, exhaust velocity, pressure, temperature, or inlet flight conditions.',
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'servo-motion-controls',
    version: 1,
    title: 'Servo Motion and Joint Angles',
    domain: 'ROBOTICS',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Explore an educational servo model and understand the difference between a component render and calibrated mechanism kinematics.',
    modelId: 'sg90_servo',
    prerequisites: ['An angle describes orientation about an axis'],
    learningObjectives: [
      'Identify the servo housing, shaft, and output horn as distinct physical concepts.',
      'Distinguish a commanded joint angle from measured shaft position.',
      'Use planar forward kinematics for a separate ideal two-link example.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The catalog servo is a visual learning asset and is not a measured calibration of a particular physical unit.',
      'The two-link forward-kinematics helper is a separate ideal planar mechanism and is not coupled to the servo mesh.',
      'No inverse kinematics, torque simulation, collisions, or safe hardware-control interface is included.'
    ],
    steps: [
      {
        id: 'servo-parts',
        title: 'Find the output shaft',
        objective: 'Identify the physical output through which a servo transfers rotary motion.',
        explanation: 'A hobby servo combines a motor, gears, position feedback and control electronics. Its external horn attaches to the output shaft, while the housing supports the mechanism. Exact travel limits depend on the device and its calibration.',
        learnerTask: 'Rotate the model and locate the housing and output-shaft region.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'The output shaft is where an arm or horn would be attached.',
        estimatedMinutes: 2
      },
      {
        id: 'command-versus-measurement',
        title: 'Commanded angle is not proof of motion',
        objective: 'Recognize the difference between a control input and a verified physical output.',
        explanation: 'A command expresses the target angle. Actual motion depends on feedback, mechanical limits, load, power, and calibration. A static render cannot confirm the position of a real servo.',
        learnerTask: 'Choose the statement that properly distinguishes target angle from measured position.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'servo-command',
          prompt: 'What does a commanded servo angle represent?',
          choices: [
            { id: 'a', text: 'A requested target, not proof that a physical shaft reached that angle' },
            { id: 'b', text: 'A direct measurement of torque and shaft position' },
            { id: 'c', text: 'A certification that the linkage cannot collide' }
          ],
          correctChoiceId: 'a',
          explanation: 'A command is an input. Confirmation requires feedback or measurement, and safe mechanical operation needs limits and collision checks.',
          hint: 'Separate what the controller requests from what a sensor measures.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'forward-kinematics',
        title: 'Extend the idea to a two-link arm',
        objective: 'Understand what planar forward kinematics can tell you when link lengths and joint angles are known.',
        explanation: 'The educational two-link formula sums the Cartesian contributions of two rigid links. It calculates an ideal endpoint for supplied geometry and angles, not a trajectory, motor load, or validated representation of this servo.',
        learnerTask: 'Explain why a forward-kinematics result changes when a joint angle changes.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Each link contributes a vector oriented by the cumulative joint angle.',
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'anatomy-heart-flow-basics',
    version: 1,
    title: 'Heart Chambers and Blood-Flow Direction',
    domain: 'ANATOMY',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Follow the heart’s chamber-to-vessel flow path while distinguishing an educational anatomy model from a patient-specific clinical representation.',
    modelId: 'human_heart',
    prerequisites: ['Blood circulates between the heart and the lungs/body'],
    learningObjectives: [
      'Describe the right-heart and left-heart flow paths at a high level.',
      'Explain why valves help maintain one-way flow.',
      'Identify the limits of a 3D anatomical visualization.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [],
    limitations: [
      'The model is an educational visual reference, not a patient-specific anatomical reconstruction.',
      'No diagnosis, procedural planning, or clinically validated physiological result is produced.',
      'Component appearance and proportions must not be interpreted as an individualized measurement.'
    ],
    steps: [
      {
        id: 'heart-overview',
        title: 'Orient to the heart',
        objective: 'Recognize the four-chamber organization of the heart.',
        explanation: 'The right side receives systemic venous blood and sends it to the pulmonary circulation. The left side receives blood returning from the lungs and pumps it into the systemic circulation.',
        learnerTask: 'Rotate the heart model and identify the major chamber and vessel labels available in the catalog.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Follow the incoming and outgoing vessel connections around each side.',
        estimatedMinutes: 2
      },
      {
        id: 'flow-direction',
        title: 'Follow one-way flow',
        objective: 'Explain why cardiac valves are part of the flow pathway.',
        explanation: 'Valves open and close as pressure differences change, helping direct blood through the chambers and vessels. A concept model can explain the pathway, but it does not establish an individual's valve function.',
        learnerTask: 'Choose the normal high-level order for blood leaving the right ventricle.',
        completionRule: { type: 'ACKNOWLEDGE' },
        question: {
          id: 'right-ventricle-flow',
          prompt: 'Where does blood flow from the right ventricle next in normal circulation?',
          choices: [
            { id: 'a', text: 'Through the pulmonary artery toward the lungs' },
            { id: 'b', text: 'Directly into the aorta' },
            { id: 'c', text: 'Back into the vena cava without passing a valve' }
          ],
          correctChoiceId: 'a',
          explanation: 'The right ventricle pumps blood through the pulmonary valve and pulmonary artery toward the lungs. This is a general anatomical principle, not a patient-specific finding.',
          hint: 'The right heart supplies the pulmonary circulation.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'clinical-boundary',
        title: 'Respect the model boundary',
        objective: 'Distinguish learning content from diagnosis or clinical measurements.',
        explanation: 'Clinical interpretation needs suitable patient data, validated acquisition and analysis, and professional judgment. A teaching render or illustrative animation is not diagnostic evidence.',
        learnerTask: 'Name one clinical question that this general-purpose model cannot answer reliably.',
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Consider an individual’s valve function, measured pressure, or diagnosis.',
        estimatedMinutes: 2
      }
    ]
  }
];

export function getLessonById(lessonId: string): LearningLesson | undefined {
  return LEARNING_LESSONS.find((lesson) => lesson.id === lessonId);
}

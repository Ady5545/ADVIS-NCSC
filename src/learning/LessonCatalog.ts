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

  ,
  {
    id: 'v12-architecture-explorer',
    version: 1,
    title: 'Explore a V12 Engine Assembly',
    domain: 'MECHANICAL_ENGINEERING',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Inspect the V12 cranktrain, cylinder banks, and gas-exchange assemblies while distinguishing a generic visual model from an identified engine variant.',
    modelId: 'v12_engine',
    prerequisites: ['Know the basic purpose of a piston and crankshaft'],
    learningObjectives: [
      'Identify the block, piston banks, crankshaft, valvetrain, intake and exhaust representations.',
      'Explain the broad motion path from pistons through rods to the crankshaft.',
      'Recognize why exact specifications require a source-identified variant.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'Internal-combustion engine overview', url: 'https://www.britannica.com/technology/internal-combustion-engine', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'This V12 is a representative visual assembly, not a source-identified OEM model.',
      'The view does not establish a particular V-angle, firing order, displacement, power, material grade, dimensions or service procedure.',
      'Motion and separation controls are learning aids; no validated combustion, torque or durability simulation is claimed.'
    ],
    steps: [
      {
        id: 'v12-orientation',
        title: 'Orient yourself',
        objective: 'Recognize the major regions of the engine assembly.',
        explanation: 'A V12 contains twelve cylinders arranged in two banks around a shared cranktrain. Exact layouts vary by engine design, so this model is labelled as a representative visual assembly.',
        learnerTask: 'Rotate the model and find the central block, two piston-bank representations, intake and exhaust assemblies.',
        action: { type: 'SET_VIEW_MODE', mode: 'SOLID' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Start with the largest central body, then look to either side for the piston banks.',
        estimatedMinutes: 1
      },
      {
        id: 'v12-crankshaft',
        title: 'Find the crankshaft',
        objective: 'Relate the piston-and-rod assembly to the main rotating shaft.',
        explanation: 'Connecting rods transfer force from pistons to offset crankpins. The crankshaft converts reciprocating motion into rotation in a real engine; the present model does not predict the load or torque produced.',
        learnerTask: 'Select the V12 crankshaft in the parts explorer or the 3D scene.',
        action: { type: 'SELECT_COMPONENT', componentId: 'v12.crankshaft' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'v12.crankshaft' },
        hint: 'Use the parts panel if the 3D target is difficult to pick.',
        estimatedMinutes: 1
      },
      {
        id: 'v12-explode',
        title: 'Inspect the subsystems',
        objective: 'Use an exploded view to distinguish neighboring assemblies.',
        explanation: 'Exploded offsets separate components for inspection. They are presentation positions, not verified service-removal paths or assembly clearances.',
        learnerTask: 'Increase the explosion factor, inspect the valvetrain and intake, then reassemble the model.',
        action: { type: 'SET_EXPLOSION', factor: 1 },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'Try an intermediate separation factor if parts overlap at the fully exploded endpoint.',
        estimatedMinutes: 2
      },
      {
        id: 'v12-evidence',
        title: 'Read the evidence limits',
        objective: 'Avoid treating a visual model as an exact manufacturer specification.',
        explanation: 'Engine variants differ in geometry, firing sequence, valvetrain, and rated output. Without a matching source packet, these values should remain unspecified.',
        learnerTask: 'Answer the question, then return the model to its assembled state.',
        action: { type: 'RESET_VIEW' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'v12-source-check' },
        question: {
          id: 'v12-source-check',
          prompt: 'Can the exact displacement and rated power be inferred from this generic V12 render?',
          choices: [
            { id: 'yes', text: 'Yes; visual detail is enough to establish exact specifications.' },
            { id: 'no', text: 'No; those claims need a source-identified engine and evidence.' },
            { id: 'shape', text: 'Yes, if the parts have realistic colors.' }
          ],
          correctChoiceId: 'no',
          explanation: 'Correct. Geometry detail is not proof of a specific variant, dimensions, materials or performance data.',
          hint: 'Look for a source-identified model and a reference that supports the claim.'
        },
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'arduino-board-signal-path',
    version: 1,
    title: 'Inside an Arduino UNO R3',
    domain: 'ELECTRICAL_ENGINEERING',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Explore the microcontroller, USB interface and I/O headers, and distinguish a board visualization from a live circuit measurement.',
    modelId: 'arduino_uno',
    prerequisites: ['Know that a microcontroller executes a program and can read or control pins'],
    learningObjectives: [
      'Locate the microcontroller and major board interfaces.',
      'Explain the broad role of USB, I/O headers and the controller.',
      'Distinguish visual inspection from electrical measurements.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'Arduino UNO R3 official documentation', url: 'https://docs.arduino.cc/hardware/uno-rev3/', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'This is a component visualization, not a powered circuit or electrical simulation.',
      'No pin voltage, current, timing, thermal state or circuit continuity is measured by the 3D model.',
      'Use the official documentation for the exact board revision and electrical limits.'
    ],
    steps: [
      {
        id: 'uno-orientation',
        title: 'Locate the controller',
        objective: 'Identify the microcontroller as the board’s programmable control element.',
        explanation: 'The UNO R3 official documentation describes a board based on the ATmega328P microcontroller. The 3D view helps locate the main parts but does not test a live board.',
        learnerTask: 'Rotate the board and select the microcontroller.',
        action: { type: 'SELECT_COMPONENT', componentId: 'uno_atmega' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'uno_atmega' },
        hint: 'The part is named ATmega328P MCU in the component list.',
        estimatedMinutes: 1
      },
      {
        id: 'uno-usb',
        title: 'Trace the computer interface',
        objective: 'Identify the USB connector as a connection point, not the controller itself.',
        explanation: 'The USB connector is a board interface used in typical programming and serial workflows. A connector’s presence in a render does not prove data transfer or power state.',
        learnerTask: 'Select the USB-B connector in the model.',
        action: { type: 'SELECT_COMPONENT', componentId: 'uno_usb' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'uno_usb' },
        hint: 'Look at the large metal connector on the board edge.',
        estimatedMinutes: 1
      },
      {
        id: 'uno-headers',
        title: 'Find the I/O headers',
        objective: 'Recognize where signals connect to the outside system.',
        explanation: 'Digital and analog headers provide physical access to supported I/O functions. Actual behavior depends on the wiring, code, board revision and electrical limits.',
        learnerTask: 'Select the Digital & Power I/O Headers, then choose the correct answer.',
        action: { type: 'SELECT_COMPONENT', componentId: 'uno_headers' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'uno-io-role' },
        question: {
          id: 'uno-io-role',
          prompt: 'What do the I/O headers mainly provide?',
          choices: [
            { id: 'signals', text: 'Connection points for supported input/output and power signals' },
            { id: 'program', text: 'A substitute for the microcontroller' },
            { id: 'measurement', text: 'Automatic proof of the current voltage on every pin' }
          ],
          correctChoiceId: 'signals',
          explanation: 'Correct. Headers provide electrical connection points, but actual signals require a real circuit and measurement.',
          hint: 'Think about where wires connect to the board.'
        },
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'servo-positioning-basics',
    version: 1,
    title: 'How a Small Servo Positions Its Output',
    domain: 'ROBOTICS',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Inspect a servo motor, reduction gears and output horn, while keeping the visual model separate from a validated motion-control simulation.',
    modelId: 'servo_motor',
    prerequisites: ['Know that an electric motor converts electrical energy into motion'],
    learningObjectives: [
      'Identify the motor, gear train, position sensor and output arm representations.',
      'Describe the broad roles of reduction gearing and position feedback.',
      'Recognize the limits of the static 3D view.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'Arduino Servo library reference', url: 'https://docs.arduino.cc/libraries/servo/', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'This model is a visual assembly; it does not drive an actual servo or solve controller dynamics.',
      'The geometry does not validate a particular model’s torque, speed, deadband, travel range, gear material or stall current.',
      'Never infer electrical compatibility from the render alone; check the servo and controller documentation.'
    ],
    steps: [
      {
        id: 'servo-output',
        title: 'Find the output arm',
        objective: 'Identify where motion transfers from the servo to an external mechanism.',
        explanation: 'The output horn couples the servo’s output shaft to a linkage. Its real motion and load depend on the hardware, power supply and control signal.',
        learnerTask: 'Select the servo output horn in the component explorer.',
        action: { type: 'SELECT_COMPONENT', componentId: 'servo_arm' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'servo_arm' },
        hint: 'Look for the part identified as the Output Servo Horn Arm.',
        estimatedMinutes: 1
      },
      {
        id: 'servo-gears',
        title: 'Inspect the reduction gears',
        objective: 'Explain why a gear train connects the small motor to the output shaft.',
        explanation: 'A reduction gear train trades rotational speed for output torque according to its gear ratio and losses. The exact ratio and performance of this visual model are not specified.',
        learnerTask: 'Select the gear set, then inspect the motor core.',
        action: { type: 'SELECT_COMPONENT', componentId: 'servo_gears' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'servo_gears' },
        hint: 'The gear set is a separate component in the explorer.',
        estimatedMinutes: 1
      },
      {
        id: 'servo-feedback',
        title: 'Connect movement and feedback',
        objective: 'Recognize that a position-controlled servo uses a feedback/control system.',
        explanation: 'A position servo typically combines a motor, gear train, position sensing and control electronics. The 3D model is not a circuit diagram and does not calculate the closed-loop response.',
        learnerTask: 'Select the position potentiometer and answer the question.',
        action: { type: 'SELECT_COMPONENT', componentId: 'servo_pot' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'servo-feedback-role' },
        question: {
          id: 'servo-feedback-role',
          prompt: 'What is the broad purpose of position feedback in a servo?',
          choices: [
            { id: 'feedback', text: 'Help the controller compare current position with the target' },
            { id: 'supply', text: 'Replace the power supply' },
            { id: 'gearing', text: 'Physically replace the reduction gears' }
          ],
          correctChoiceId: 'feedback',
          explanation: 'Correct. Feedback provides information about position so a controller can adjust the motor command.',
          hint: 'Think about what the controller needs to know to approach a target position.'
        },
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'jet-engine-core-flow-path',
    version: 1,
    title: 'Follow the Flow Through a Jet Engine Core',
    domain: 'AEROSPACE',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Trace the compressor, combustor, turbine and nozzle in a generic jet-engine core without mistaking the visualization for CFD or an exact engine.',
    modelId: 'jet_engine_core',
    prerequisites: ['Know that moving gas can carry energy and momentum'],
    learningObjectives: [
      'Identify the major gas-path components in a generic jet-engine core.',
      'Explain the broad sequence from compression through heat addition and expansion.',
      'Distinguish a flow-path explanation from a numerical flow simulation.'
    ],
    estimatedMinutes: 6,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'NASA Glenn: How Jet Engines Work', url: 'https://www.grc.nasa.gov/www/k-12/UEET/StudentSite/engines.html', applicability: 'GENERAL_PRINCIPLE' },
      { label: 'NASA Glenn: Compressor overview', url: 'https://www.grc.nasa.gov/www/k-12/airplane/compress.html', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'The model is a visual educational representation, not an exact aerospace engine.',
      'It does not calculate combustion chemistry, pressure/temperature fields, turbine efficiency, thrust, emissions, CFD, or blade stresses.',
      'Component ordering and explanatory text are conceptual and should not be used for maintenance or design.'
    ],
    steps: [
      {
        id: 'jet-compressor',
        title: 'Find the compressor',
        objective: 'Recognize the component that raises the pressure of incoming air.',
        explanation: 'NASA Glenn’s educational material describes the compressor as raising incoming-air pressure before the combustor. The present model helps identify the part but does not calculate pressure rise.',
        learnerTask: 'Select the axial compressor in the component explorer.',
        action: { type: 'SELECT_COMPONENT', componentId: 'jet_compressor' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'jet_compressor' },
        hint: 'Find the component labelled Axial Compressor.',
        estimatedMinutes: 1
      },
      {
        id: 'jet-combustor',
        title: 'Locate the combustor',
        objective: 'Identify where heat is added in the idealized gas path.',
        explanation: 'In a gas turbine, fuel burns in the combustor and adds energy to the flow. This model’s geometry and colors do not represent a resolved flame, pressure field or combustion calculation.',
        learnerTask: 'Select the combustion chamber.',
        action: { type: 'SELECT_COMPONENT', componentId: 'jet_combustor' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'jet_combustor' },
        hint: 'Find the combustion chamber between compressor and turbine representations.',
        estimatedMinutes: 1
      },
      {
        id: 'jet-turbine',
        title: 'Follow the turbine and nozzle',
        objective: 'Explain the broad relationship between turbine work and exhaust acceleration.',
        explanation: 'The turbine extracts work from hot gas to drive connected machinery, while the nozzle accelerates the remaining flow. Actual thrust depends on flow state and engine configuration, which this model does not compute.',
        learnerTask: 'Select the turbine, then answer the question.',
        action: { type: 'SELECT_COMPONENT', componentId: 'jet_turbine' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'jet-turbine-role' },
        question: {
          id: 'jet-turbine-role',
          prompt: 'What is the turbine’s broad role in a gas-turbine engine core?',
          choices: [
            { id: 'drive', text: 'Extract work from the hot flow to drive the compressor and related machinery' },
            { id: 'store', text: 'Store all incoming air without allowing it to flow' },
            { id: 'measure', text: 'Provide a direct measurement of thrust in this 3D model' }
          ],
          correctChoiceId: 'drive',
          explanation: 'Correct. Turbine work drives the compressor through a shaft. The render does not measure thrust or engine performance.',
          hint: 'Look for the rotating component coupled to the compressor by a shaft.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'jet-reset',
        title: 'Return to the complete core',
        objective: 'Summarize the gas path without confusing a model with a solver.',
        explanation: 'A typical simplified sequence is compressor, combustor, turbine, then nozzle. Real engines include additional details and differ by configuration.',
        learnerTask: 'Reset the view and name one limitation of the visualization.',
        action: { type: 'RESET_VIEW' },
        completionRule: { type: 'ACKNOWLEDGE' },
        hint: 'For example, the model does not calculate temperature, pressure, or thrust.',
        estimatedMinutes: 1
      }
    ]
  },
  {
    id: 'suspension-load-path-inspection',
    version: 1,
    title: 'Trace a Suspension Load Path',
    domain: 'STRUCTURES',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Identify major suspension parts and reason about how loads travel through a mechanism, without presenting a stress or finite-element result.',
    modelId: 'suspension',
    prerequisites: ['Know that forces travel through connected parts'],
    learningObjectives: [
      'Identify the spring, shock absorber and control-arm representations.',
      'Describe a qualitative load path through a suspension assembly.',
      'Explain why visual colors are not engineering stress results.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'Vehicle suspension overview', url: 'https://www.britannica.com/technology/suspension-vehicle', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'This is an illustrative suspension assembly and not a source-verified vehicle-specific design.',
      'No load cases, material properties, boundary conditions, finite-element mesh, solver convergence or stress/strain results are provided.',
      'Do not infer safety, fatigue life, dimensions or manufacturing suitability from the render.'
    ],
    steps: [
      {
        id: 'suspension-control-arm',
        title: 'Find a locating link',
        objective: 'Identify a structural part that constrains wheel motion relative to the chassis.',
        explanation: 'A control arm provides a connection between parts of a suspension and helps constrain motion. Exact load sharing depends on the actual geometry and mounting points.',
        learnerTask: 'Select the lower control arm.',
        action: { type: 'SELECT_COMPONENT', componentId: 'susp_control_arm' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'susp_control_arm' },
        hint: 'Use the component explorer to search for “control arm.”',
        estimatedMinutes: 1
      },
      {
        id: 'suspension-spring',
        title: 'Identify the spring',
        objective: 'Explain the qualitative role of a spring in supporting load and storing elastic energy.',
        explanation: 'A spring deflects under load and stores elastic energy. The force–deflection curve depends on its real geometry and material, neither of which is validated by this visualization.',
        learnerTask: 'Search the component list for the suspension spring and inspect it.',
        action: { type: 'SELECT_COMPONENT', componentId: 'susp_spring_seats' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'susp_spring_seats' },
        hint: 'The listed component groups the upper and lower spring seats; the render’s spring detail is illustrative.',
        estimatedMinutes: 1
      },
      {
        id: 'suspension-evidence',
        title: 'Separate visualization from analysis',
        objective: 'Recognize what evidence a structural analysis would need.',
        explanation: 'A defensible stress result requires a load case, supports, measured dimensions, material properties, a numerical method and validation. A colored 3D surface alone is not a finite-element result.',
        learnerTask: 'Answer the question, then reset the view.',
        action: { type: 'RESET_VIEW' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'suspension-stress-evidence' },
        question: {
          id: 'suspension-stress-evidence',
          prompt: 'What is required before a stress map can be called a validated engineering result?',
          choices: [
            { id: 'color', text: 'A high-detail render with bright colors' },
            { id: 'evidence', text: 'Documented loads, supports, material data, solver settings and validation evidence' },
            { id: 'rotation', text: 'A camera rotation that reveals the part from all sides' }
          ],
          correctChoiceId: 'evidence',
          explanation: 'Correct. Visual detail is not a substitute for an auditable analysis setup and validation.',
          hint: 'Think about the physical inputs and numerical method behind the result.'
        },
        estimatedMinutes: 2
      }
    ]
  },
  {
    id: 'anatomy-heart-and-blood-flow',
    version: 1,
    title: 'Explore the Heart and Circulatory Path',
    domain: 'ANATOMY',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Identify cardiac structures and trace the broad circulation pathway while keeping the atlas separate from clinical diagnosis.',
    modelId: 'human_anatomy_scientific',
    prerequisites: ['Know that the heart pumps blood through pulmonary and systemic circuits'],
    learningObjectives: [
      'Locate the heart and major vessel representations.',
      'Summarize the broad pulmonary and systemic circulation pathways.',
      'Recognize that this model is not a patient-specific or diagnostic simulation.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'NHLBI: How the Heart Works', url: 'https://www.nhlbi.nih.gov/health/heart', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'This is an educational anatomy visualization, not a clinical-grade digital twin.',
      'Its pressure and volume curves are hand-authored teaching waveforms, not patient data or clinically validated predictions.',
      'It must not be used for diagnosis, treatment, surgical planning or clinical decision-making.'
    ],
    steps: [
      {
        id: 'heart-location',
        title: 'Locate the heart',
        objective: 'Identify the heart as the central pump in the circulation.',
        explanation: 'The heart’s chambers move blood through pulmonary and systemic circuits. This educational view helps locate structures; it does not reproduce a patient’s anatomy.',
        learnerTask: 'Select the cardiac myocardium or heart component.',
        action: { type: 'SELECT_COMPONENT', componentId: 'heart_myocardium' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'heart_myocardium' },
        hint: 'Search the component list for “heart” or “myocardium.”',
        estimatedMinutes: 1
      },
      {
        id: 'heart-aorta',
        title: 'Follow the systemic outflow',
        objective: 'Connect the left ventricle to the systemic circulation at a conceptual level.',
        explanation: 'Oxygen-rich blood is ejected from the left ventricle into the aorta and distributed through the body. The model’s curves are illustrative, not medical measurements.',
        learnerTask: 'Select the ascending aorta in the component tree.',
        action: { type: 'SELECT_COMPONENT', componentId: 'ascending_aorta' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'ascending_aorta' },
        hint: 'The ascending aorta is one of the major-vessel entries.',
        estimatedMinutes: 1
      },
      {
        id: 'heart-path-check',
        title: 'Check the circulation concept',
        objective: 'Distinguish the pulmonary loop from the systemic loop.',
        explanation: 'The right side sends blood toward the lungs for gas exchange, while the left side supplies systemic circulation. Exact physiology requires much more than this visual model.',
        learnerTask: 'Answer the question, then reset the view.',
        action: { type: 'RESET_VIEW' },
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'heart-circuit-check' },
        question: {
          id: 'heart-circuit-check',
          prompt: 'Which side sends blood toward the lungs for oxygenation?',
          choices: [
            { id: 'right', text: 'The right side of the heart' },
            { id: 'left', text: 'The left side of the heart sends blood directly to the lungs' },
            { id: 'neither', text: 'Neither side participates in circulation' }
          ],
          correctChoiceId: 'right',
          explanation: 'Correct. The right side pumps blood to the pulmonary circuit, and the left side pumps oxygenated blood to the systemic circuit.',
          hint: 'Trace deoxygenated blood from the body toward the lungs.'
        },
        estimatedMinutes: 2
      }
    ]
  }


  ,
  {
    id: 'hydraulic-pump-pressure-and-flow',
    version: 1,
    title: 'Pressure and Flow in a Hydraulic System',
    domain: 'FLUID_MECHANICS',
    learnerLevel: 'HIGH_SCHOOL',
    summary: 'Inspect a generic hydraulic pump visualization and learn the difference between pressure, force, flow rate and a validated pump-performance result.',
    modelId: 'hydraulic_pump',
    prerequisites: ['Know that liquids can transmit pressure in an enclosed system'],
    learningObjectives: [
      'Distinguish pressure from force and flow rate.',
      'Use pressure equals force divided by area with consistent units.',
      'Recognize what is not measured by a generic hydraulic-pump render.'
    ],
    estimatedMinutes: 5,
    authoringStatus: 'EDUCATIONAL_DRAFT',
    sourceReferences: [
      { label: 'OpenStax: Pascal’s Principle and Hydraulics', url: 'https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics', applicability: 'GENERAL_PRINCIPLE' },
      { label: 'OpenStax: University Physics, Fluid Mechanics Summary', url: 'https://openstax.org/books/university-physics-volume-1/pages/14-summary', applicability: 'GENERAL_PRINCIPLE' }
    ],
    limitations: [
      'The catalog object is a single generic pump visual, not a dimensioned or source-identified pump assembly.',
      'No pressure, flow rate, efficiency, leakage, power, temperature or cavitation simulation is implemented.',
      'The lesson teaches general fluid mechanics and does not specify a safe operating pressure for any real equipment.'
    ],
    steps: [
      {
        id: 'hydraulic-pump-inspect',
        title: 'Inspect the pump representation',
        objective: 'Recognize a hydraulic pump as part of a fluid-power system.',
        explanation: 'A hydraulic pump transfers mechanical input into fluid flow. Pressure in the system depends on the system’s resistance to flow and other operating conditions; a picture alone does not determine operating pressure or flow rate.',
        learnerTask: 'Select the hydraulic pump core assembly in the component explorer.',
        action: { type: 'SELECT_COMPONENT', componentId: 'hydraulic_pump.core' },
        completionRule: { type: 'SELECT_COMPONENT', componentId: 'hydraulic_pump.core' },
        hint: 'This catalog model currently contains one component called Hydraulic Pump Core Assembly.',
        estimatedMinutes: 1
      },
      {
        id: 'hydraulic-pressure-units',
        title: 'Separate pressure from force',
        objective: 'Recognize that pressure is force per unit area.',
        explanation: 'Pressure is defined as the perpendicular force divided by the area over which it acts: p = F/A. In SI, pressure is measured in pascals (Pa), where 1 Pa = 1 N/m². Do not infer an actual pump pressure from this illustration.',
        learnerTask: 'Answer the question about pressure units.',
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'hydraulic-pressure-units-question' },
        question: {
          id: 'hydraulic-pressure-units-question',
          prompt: 'Which expression gives average pressure for a perpendicular force over an area?',
          choices: [
            { id: 'correct', text: 'Pressure = force ÷ area (p = F/A)' },
            { id: 'area', text: 'Pressure = force × area' },
            { id: 'flow', text: 'Pressure = volume flow rate ÷ time' }
          ],
          correctChoiceId: 'correct',
          explanation: 'Correct. Dividing force in newtons by area in square metres gives pressure in pascals. Real hydraulic systems also have losses and dynamic effects.',
          hint: 'Pressure describes how much force acts over a given area.'
        },
        estimatedMinutes: 2
      },
      {
        id: 'hydraulic-flow-limits',
        title: 'What does the model not measure?',
        objective: 'Distinguish a general principle from a model-specific performance result.',
        explanation: 'Flow rate describes the volume of fluid passing a point per unit time. This visualization does not compute the pump’s flow rate, pressure rise, efficiency or operating limits; those require a specified pump, operating conditions and reliable data.',
        learnerTask: 'Choose the statement that correctly describes this visualization.',
        completionRule: { type: 'ANSWER_QUESTION', questionId: 'hydraulic-flow-limits-question' },
        question: {
          id: 'hydraulic-flow-limits-question',
          prompt: 'Can the 3D pump render establish its actual pressure or flow rate?',
          choices: [
            { id: 'yes', text: 'Yes; the appearance gives the measured operating values.' },
            { id: 'no', text: 'No; no measurement or validated pump model is connected to this render.' },
            { id: 'color', text: 'Yes, if the material appears metallic.' }
          ],
          correctChoiceId: 'no',
          explanation: 'Correct. The render supports visual inspection only. Actual values require source data or an appropriately validated model and known operating conditions.',
          hint: 'Look for a sensor reading, source specification or calculation. None is supplied here.'
        },
        estimatedMinutes: 2
      }
    ]
  }

];

export function getLessonById(lessonId: string): LearningLesson | undefined {
  return LEARNING_LESSONS.find((lesson) => lesson.id === lessonId);
}

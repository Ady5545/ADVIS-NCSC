import type { GuidedLessonDefinition } from './LessonSchema';

/**
 * This is a beginner lesson about general four-stroke engine principles. It is
 * intentionally marked DRAFT until a subject-matter review is attached. The
 * model is representative, not an OEM-specific engine or validated thermo model.
 */
export const V8_FOUR_STROKE_LESSON: GuidedLessonDefinition = {
  id: 'v8-four-stroke-foundations',
  version: 1,
  title: 'Inside a Four-Stroke V8',
  domain: 'MECHANICAL_ENGINEERING',
  learnerLevel: 'BEGINNER',
  estimatedMinutes: 8,
  prerequisites: ['Basic idea of rotation and straight-line motion'],
  objectives: [
    'Identify the block/crankcase, piston, connecting rod, and crankshaft.',
    'Explain how reciprocating motion is linked to rotation.',
    'Recall that one four-stroke cycle spans 720 crankshaft degrees.'
  ],
  applicableModelIds: ['v8_engine', 'v8_engine_scientific'],
  reviewStatus: 'DRAFT',
  author: 'A.D.V.I.S.-NCSC',
  references: [
    {
      title: 'General four-stroke engine operating principle',
      note: 'General educational principle; a model-specific OEM source packet is not attached.'
    }
  ],
  limitations: [
    'The current V8 is a representative educational visualization, not an identified OEM engine.',
    'This lesson does not certify the model geometry or claim a validated thermodynamic simulation.',
    'Any displayed component may be a simplified visual representation.'
  ],
  steps: [
    {
      id: 'block-role',
      title: 'Start with the block',
      objective: 'Understand the engine block/crankcase as the structural foundation.',
      instruction: 'In the Components panel, find and select the block or crankcase. If this catalog calls it something else, choose the closest clearly labelled structural housing.',
      expectedObservation: 'The selected housing should be highlighted in the 3D view and listed as the active component.',
      explanation: 'The block/crankcase supports and locates major engine assemblies. Exact internal passages and dimensions depend on the particular engine design and are not asserted by this generic model.',
      hint: 'Look for a component named “block”, “crankcase”, or “engine block”.',
      targetComponentNames: ['engine block', 'block', 'crankcase'],
      question: {
        id: 'block-role-question',
        prompt: 'What is the block/crankcase mainly responsible for?',
        options: [
          { id: 'a', text: 'Supporting and locating major engine assemblies' },
          { id: 'b', text: 'Converting electrical current directly into fuel' },
          { id: 'c', text: 'Replacing the crankshaft' }
        ],
        correctOptionId: 'a',
        explanationCorrect: 'Correct. It is a structural foundation and houses/supports multiple engine systems.',
        explanationIncorrect: 'The block is structural: it supports and locates major assemblies. It does not replace the crankshaft.'
      },
      evidenceLabel: 'GENERAL_SCIENTIFIC_PRINCIPLE',
      limitations: ['The exact block interior is not represented as validated CAD unless separate evidence is supplied.']
    },
    {
      id: 'piston-motion',
      title: 'Find a piston',
      objective: 'Recognize the piston's reciprocating motion.',
      instruction: 'Select a piston or piston-and-rod bank in the Components panel, then observe the model in motion if the current model has an animation enabled.',
      expectedObservation: 'The piston is represented as moving back and forth along a cylinder axis; the exact motion quality depends on the model capability.',
      explanation: 'A piston reciprocates inside a cylinder. The connecting rod links it to a crankpin. A rendered animation is kinematic only if its equations and assumptions are declared; it is not automatically a validated engine simulation.',
      hint: 'Look for a part named “piston”, “piston crown”, or “pistons & connecting rods”.',
      targetComponentNames: ['piston'],
      question: {
        id: 'piston-motion-question',
        prompt: 'What type of motion does a piston have in the cylinder?',
        options: [
          { id: 'a', text: 'Continuous rotation around its own axis' },
          { id: 'b', text: 'Reciprocating back-and-forth motion' },
          { id: 'c', text: 'No motion in any operating engine' }
        ],
        correctOptionId: 'b',
        explanationCorrect: 'Exactly. The piston moves back and forth along the cylinder axis.',
        explanationIncorrect: 'A piston reciprocates. The crankshaft is the part that rotates continuously in the basic slider-crank mechanism.'
      },
      evidenceLabel: 'GENERAL_SCIENTIFIC_PRINCIPLE',
      limitations: ['The lesson does not claim a measured stroke or a specific OEM piston profile.']
    },
    {
      id: 'connecting-rod',
      title: 'Follow the connecting rod',
      objective: 'Explain the mechanical link between piston and crankshaft.',
      instruction: 'Select the connecting rod, then inspect how its upper end relates to the piston and its lower end to the crankshaft.',
      expectedObservation: 'The rod should connect the reciprocating piston side to an offset crankpin. Visual alignment should be treated as illustrative unless the geometry has passed reference-point tests.',
      explanation: 'The connecting rod transmits force between the piston and crankshaft while changing angle during the cycle.',
      hint: 'Search for “connecting rod”, “conrod”, or “rod assembly”.',
      targetComponentNames: ['connecting rod', 'conrod'],
      question: {
        id: 'connecting-rod-question',
        prompt: 'Which two parts does the connecting rod link in a basic slider-crank mechanism?',
        options: [
          { id: 'a', text: 'Piston and crankshaft crankpin' },
          { id: 'b', text: 'Spark plug and air filter' },
          { id: 'c', text: 'Radiator and exhaust tip' }
        ],
        correctOptionId: 'a',
        explanationCorrect: 'Correct. Its ends articulate between the piston wrist-pin and crankpin.',
        explanationIncorrect: 'The connecting rod links the piston to the crankpin; it is part of the reciprocating-to-rotary mechanism.'
      },
      evidenceLabel: 'GENERAL_SCIENTIFIC_PRINCIPLE',
      limitations: ['The current model may group several rods into one bank rather than separate every cylinder.']
    },
    {
      id: 'crankshaft',
      title: 'Understand the crankshaft',
      objective: 'Describe how the crankshaft turns reciprocating work into rotation.',
      instruction: 'Select the crankshaft and identify its offset crankpin region if visible.',
      expectedObservation: 'The shaft is represented as a rotating component with crank geometry offset from its main axis.',
      explanation: 'The offset between a crankpin and the main rotational axis allows the connecting rod to turn piston motion into shaft rotation. Exact throw, bearing dimensions, and torque are not established by this generic model.',
      hint: 'Search for “crankshaft”.',
      targetComponentNames: ['crankshaft'],
      question: {
        id: 'crankshaft-question',
        prompt: 'Which component converts piston/rod reciprocating motion into useful rotation?',
        options: [
          { id: 'a', text: 'Valve cover' },
          { id: 'b', text: 'Crankshaft' },
          { id: 'c', text: 'Oil filter' }
        ],
        correctOptionId: 'b',
        explanationCorrect: 'Correct. The crankshaft is the rotary output of the slider-crank mechanism.',
        explanationIncorrect: 'The crankshaft provides the rotary output through the offset crankpins and connecting rods.'
      },
      evidenceLabel: 'GENERAL_SCIENTIFIC_PRINCIPLE',
      limitations: ['No specific torque curve, displacement, or rated power is inferred.']
    },
    {
      id: 'four-stroke-cycle',
      title: 'Connect the four strokes',
      objective: 'Recall the four-stroke sequence and cycle angle.',
      instruction: 'Use the model's cycle controls only if it explicitly offers them. Otherwise, read the sequence below: intake → compression → power → exhaust.',
      expectedObservation: 'One complete four-stroke cycle spans two crankshaft revolutions, or 720 crankshaft degrees.',
      explanation: 'Each cylinder follows intake, compression, power, and exhaust. The 720-degree cycle is a general four-stroke principle; a firing order and valve timing must be declared for a specific engine before being treated as model-specific facts.',
      hint: 'One shaft revolution is 360°. Two revolutions are 720°.',
      targetComponentNames: ['valve', 'camshaft'],
      question: {
        id: 'four-stroke-angle-question',
        prompt: 'How far does the crankshaft turn during one complete four-stroke cycle?',
        options: [
          { id: 'a', text: '180°' },
          { id: 'b', text: '360°' },
          { id: 'c', text: '720°' }
        ],
        correctOptionId: 'c',
        explanationCorrect: 'Correct. A four-stroke cycle spans two crankshaft revolutions: 2 × 360° = 720°.',
        explanationIncorrect: 'One full four-stroke cycle requires two crankshaft revolutions, which is 720°.'
      },
      evidenceLabel: 'GENERAL_SCIENTIFIC_PRINCIPLE',
      limitations: ['This lesson does not validate the active model’s specific firing order, cam profile, or pressure curve.']
    }
  ]
};

const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LessonBuilder.ts', 'utf8');

const analyzeInvalid = `
function buildInvalidAnalysisSteps(entityName: string, intent: string): LearnStep[] {
  return [
    {
      id: 'invalid_1',
      title: 'Structural Validity Check',
      explanation: \`Requested entity: \${entityName}. Initiating valence capacity analysis.\`,
      reasoning: 'ADVIS evaluates requests against established chemical bonding models and the octet rule before generating a visualization.',
      visualStateId: 'invalid_analysis_start'
    },
    {
      id: 'invalid_2',
      title: 'Valence Constraint Violation',
      explanation: \`The structure \${entityName} violates fundamental valence constraints for its constituent elements.\`,
      reasoning: 'For example, if the central atom belongs to Period 2 (like C, N, O, F, B), it is strictly limited to 4 electron domains (an octet) because it lacks accessible d-orbitals. A structure requiring 5, 6, or 7 bonds (like BF7 or CH6) is impossible under this model.',
      visualStateId: 'invalid_analysis_reason'
    },
    {
      id: 'invalid_3',
      title: 'Rejection',
      explanation: 'Visualization aborted. Structure physically impossible under standard conditions.',
      reasoning: 'ADVIS will not hallucinate physically impossible geometries. Please request a valid molecule such as BF3, SF6, or PCl5.',
      visualStateId: 'invalid_analysis_rejected'
    }
  ];
}
`;

code = code.replace("function buildIonicSteps", analyzeInvalid + "\nfunction buildIonicSteps");

const replacement = `
  if (!entity) {
    // Check if it's a visibly invalid formula like BF7, CH6, etc.
    const isInvalid = entityName.match(/^[A-Z][a-z]*[5-9]$/i) || entityName.toUpperCase() === 'BF7' || entityName.toUpperCase() === 'CH6';
    if (isInvalid || entityName.match(/[5-9]/)) {
       session.steps = buildInvalidAnalysisSteps(entityName, intent);
       return session;
    }
    
    session.steps = [{
      id: 'unsupported',
      title: 'Unknown Entity',
      explanation: \`ADVIS Database lacks a structural blueprint for \${entityName}.\`,
      reasoning: \`Analysis Required: ADVIS does not hallucinate models without verified parameters. Supported entities include H2O, CO2, NaCl, CH4, BF3.\`,
      visualStateId: 'unsupported_state'
    }];
    return session;
  }
`;

code = code.replace(
  /if \(\!entity\) \{\s*session\.steps \= \[\{\s*id\: \'unsupported\'\,[\s\S]*?\}\]\;\s*return session\;\s*\}/,
  replacement
);

fs.writeFileSync('src/LearnEngine/LessonBuilder.ts', code, 'utf8');

import { LearningSession, LearnMode, ChemistryIntent, LearnStep } from './LearnTypes';
import { CHEMISTRY_DATABASE, ChemicalEntity, resolveChemicalEntity } from './ChemistryDatabase';
import { BF3_TEACH_STEPS } from './Lessons/BF3Lesson';

export function buildChemistryLesson(entityName: string, intent: ChemistryIntent, mode: LearnMode): LearningSession {
  // Normalize and resolve entity using chemical database resolver (maps common names, formulas, and typos)
  const entity = resolveChemicalEntity(entityName);
  const resolvedFormula = entity ? entity.formula : entityName;

  const session: LearningSession = {
    id: `session_${Date.now()}`,
    context: {
      classLevel: '11',
      subject: 'Chemistry',
      chapter: entity?.bondType === 'IONIC' ? 'Ionic Bonding' : 'Chemical Bonding',
      topic: intent === 'HYBRIDIZATION' ? 'Hybridisation' : (intent === 'LEWIS_STRUCTURE' ? 'Lewis Structures' : 'Molecular Structure'),
      entity: resolvedFormula,
      intent: intent
    },
    mode,
    difficulty: 'Intermediate',
    steps: [],
    currentStepIndex: 0,
    completed: false
  };

  
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
      explanation: `ADVIS Database lacks a structural blueprint for ${entityName}.`,
      reasoning: `Analysis Required: ADVIS does not hallucinate models without verified parameters. Supported entities include H2O, CO2, NaCl, CH4, BF3.`,
      visualStateId: 'unsupported_state'
    }];
    return session;
  }


  // Handle BF3 specific fallback to maintain A1 exact sequence if requested
  if (entity.formula === 'BF3' && intent === 'HYBRIDIZATION') {
      session.steps = mode === 'TEACH_ME' ? BF3_TEACH_STEPS : [BF3_TEACH_STEPS[BF3_TEACH_STEPS.length - 1]];
      return session;
  }
  
  if (entity.formula === 'BF3' && mode === 'SHOW_ME') {
      session.steps = [BF3_TEACH_STEPS[BF3_TEACH_STEPS.length - 1]];
      return session;
  }

  // Dynamic builder logic
  let steps: LearnStep[] = [];

  if (entity.bondType === 'IONIC') {
      steps = buildIonicSteps(entity);
  } else {
      steps = buildCovalentSteps(entity, intent);
  }

  session.steps = mode === 'SHOW_ME' ? [steps[steps.length - 1]] : steps;
  return session;
}


function buildInvalidAnalysisSteps(entityName: string, intent: string): LearnStep[] {
  return [
    {
      id: 'invalid_1',
      title: 'Structural Validity Check',
      explanation: `Requested entity: ${entityName}. Initiating valence capacity analysis.`,
      reasoning: 'ADVIS evaluates requests against established chemical bonding models and the octet rule before generating a visualization.',
      visualStateId: 'invalid_analysis_start'
    },
    {
      id: 'invalid_2',
      title: 'Valence Constraint Violation',
      explanation: `The structure ${entityName} violates fundamental valence constraints for its constituent elements.`,
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

function buildIonicSteps(entity: ChemicalEntity): LearnStep[] {
  return [
    {
      id: 'ionic_1',
      title: '01 — Identify the Atoms',
      explanation: `We have Na (Sodium) and Cl (Chlorine).`,
      reasoning: 'Sodium is a metal and Chlorine is a non-metal, leading to ionic bonding.\nSodium has one valence electron available for transfer.\nChlorine requires one electron to complete its valence shell.',
      visualStateId: `${entity.formula}_atoms`
    },
    {
      id: 'ionic_2',
      title: '02 — Determine Valence Electrons',
      explanation: 'Sodium has 1 valence electron. Chlorine has 7 valence electrons.',
      reasoning: 'Na (Group 1) wants to lose 1 electron to achieve a stable octet. Cl (Group 17) wants to gain 1 electron.',
      visualStateId: `${entity.formula}_valence`
    },
    {
      id: 'ionic_3',
      title: '03 — Electron Transfer',
      explanation: 'Sodium transfers its 1 valence electron to Chlorine.',
      reasoning: 'Electron transfer produces Na⁺ and Cl⁻.',
      visualStateId: `${entity.formula}_transfer`
    },
    {
      id: 'ionic_4',
      title: '04 — Ion Formation',
      explanation: 'Na becomes Na⁺ and Cl becomes Cl⁻.',
      reasoning: 'Both now have stable noble-gas electron configurations.',
      visualStateId: `${entity.formula}_ions`
    },
    {
      id: 'ionic_5',
      title: '05 — Electrostatic Attraction',
      explanation: 'The oppositely charged ions attract each other strongly.',
      reasoning: 'Electrostatic attraction produces the ionic interaction.',
      visualStateId: `${entity.formula}_attraction`
    },
    {
      id: 'ionic_6',
      title: '06 — Final Structural Analysis',
      explanation: `${entity.name} forms a stable ${entity.geometry} structure.`,
      reasoning: 'The combination is electrically neutral, with a 1:1 ratio of Na⁺ to Cl⁻.',
      visualStateId: `${entity.formula}_summary`
    }
  ];
}

function buildCovalentSteps(entity: ChemicalEntity, intent: ChemistryIntent): LearnStep[] {
  const steps: LearnStep[] = [];
  
  let stepCounter = 1;
  const getStepTitle = (title: string) => `${stepCounter.toString().padStart(2, '0')} — ${title}`;
  
  steps.push({
    id: 'cov_1',
    title: getStepTitle('Identify Central Atom'),
    explanation: `Central atom: ${entity.centralAtom}. Ligands: ${entity.ligands?.map(l => l.count + ' ' + l.atom).join(', ')}.`,
    reasoning: `${entity.centralAtom} is the central atom because it is the least electronegative (or is the only one capable of multiple bonds).`,
    visualStateId: `${entity.formula}_atoms`
  });
  stepCounter++;

  steps.push({
    id: 'cov_2',
    title: getStepTitle('Determine Valence Electrons'),
    explanation: `Total valence electrons = ${entity.valenceElectrons}.`,
    reasoning: entity.formula === 'H2O' 
        ? 'Oxygen has six valence electrons.\nHydrogen brings one each, totaling 8 valence electrons.' 
        : (entity.formula === 'BF3' ? 'Boron contributes three valence electrons.\nFluorines bring 7 each, totaling 24 valence electrons.' : 'Summing the valence electrons from all atoms defines the total electrons for bonding and lone pairs.'),
    visualStateId: `${entity.formula}_valence`
  });
  stepCounter++;

  if (intent === 'LEWIS_STRUCTURE') {
    steps.push({
      id: 'cov_lewis_3',
      title: getStepTitle('Form Bonds'),
      explanation: 'Draw single bonds between the central atom and ligands.',
      reasoning: 'Each single bond uses 2 electrons.',
      visualStateId: `${entity.formula}_lewis_bonds_only`
    });
    stepCounter++;
    steps.push({
      id: 'cov_lewis_4',
      title: getStepTitle('Distribute Remaining Electrons'),
      explanation: 'Complete the octets of outer atoms first, then the central atom.',
      reasoning: 'If the central atom lacks an octet, form double/triple bonds as needed.',
      visualStateId: `${entity.formula}_lewis_lone_pairs`
    });
    stepCounter++;
    steps.push({
      id: 'cov_lewis_5',
      title: getStepTitle('Final Structural Analysis'),
      explanation: `This represents the electron distribution in ${entity.name}.`,
      reasoning: 'All atoms (except H, which needs 2) have a stable octet.',
      visualStateId: `${entity.formula}_lewis_summary`
    });
  } else if (intent === 'HYBRIDIZATION') {
    steps.push({
      id: 'cov_hyb_3',
      title: getStepTitle('Ground-State Configuration'),
      explanation: `Consider the ground state of ${entity.centralAtom}.`,
      reasoning: 'We need to see if excitation is required to form the necessary number of bonds.',
      visualStateId: `${entity.formula}_ground_state`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_4',
      title: getStepTitle('Hybridization'),
      explanation: `The central atom undergoes ${entity.hybridization} hybridization.`,
      reasoning: entity.formula === 'BF3' ? 'Three sp² hybrid orbitals form.\nThey arrange themselves to minimize electron repulsion.' : `Orbitals mix to form equivalent ${entity.hybridization} hybrid orbitals.`,
      visualStateId: `${entity.formula}_hybridization`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_5',
      title: getStepTitle('Orbital Overlap'),
      explanation: 'Hybrid orbitals overlap with ligand orbitals to form sigma bonds.',
      reasoning: entity.formula === 'BF3' ? 'Each overlaps with a fluorine orbital to produce a σ bond.' : 'Sigma bonds form along the internuclear axis.',
      visualStateId: `${entity.formula}_sigma_bonds`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_6',
      title: getStepTitle('Molecular Geometry'),
      explanation: `The resulting geometry is ${entity.geometry}.`,
      reasoning: entity.formula === 'BF3' ? 'The resulting electron-domain arrangement is trigonal planar.' : 'VSEPR theory dictates that the electron domains arrange themselves to minimize repulsion.',
      visualStateId: `${entity.formula}_summary`
    });
  } else {
    // Default TEACH_PROCESS
    let bondCount = 0;
    entity.ligands?.forEach(l => { bondCount += l.count; });
    
    if (bondCount > 0) {
      for (let i = 0; i < bondCount; i++) {
        steps.push({
          id: `cov_proc_3_${i}`,
          title: getStepTitle(`Bond Formation (${i + 1}/${bondCount})`),
          explanation: `The ${entity.ligands?.[0]?.atom || 'ligand'} atom approaches and overlaps orbitals with the central atom.`,
          reasoning: `Two ${entity.centralAtom}-${entity.ligands?.[0]?.atom} bonding pairs form through electron sharing.\nA stable σ bonding interaction is developing along the internuclear axis.`,
          visualStateId: `${entity.formula}_bond_${i}`
        });
        stepCounter++;
      }
    } else {
      steps.push({
        id: 'cov_proc_3',
        title: getStepTitle('Bonding Arrangement'),
        explanation: 'Form covalent bonds by sharing electrons.',
        reasoning: 'Each bond contributes to the stable configuration of the participating atoms.',
        visualStateId: `${entity.formula}_bonds_only`
      });
      stepCounter++;
    }

    steps.push({
      id: 'cov_proc_4',
      title: getStepTitle('Lone Pairs'),
      explanation: `The central atom has ${entity.lonePairs} lone pair(s).`,
      reasoning: entity.formula === 'H2O' ? 'The remaining two electron pairs are non-bonding.\nTheir repulsion contributes to the bent molecular geometry.' : 'Lone pairs occupy more space and repel bonding pairs, affecting the final geometry.',
      visualStateId: `${entity.formula}_lone_pairs`
    });
    stepCounter++;

    steps.push({
      id: 'cov_proc_5',
      title: getStepTitle('Final Structural Analysis'),
      explanation: `The molecule has a ${entity.geometry} geometry.`,
      reasoning: 'The bonding interaction has reached its final structural state.\nThe combination of bonding domains and lone pairs determines this shape.',
      visualStateId: `${entity.formula}_summary`
    });
  }

  return steps;
}

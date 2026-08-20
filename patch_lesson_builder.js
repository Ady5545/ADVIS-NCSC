const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LessonBuilder.ts', 'utf8');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

code = code.replace(/function buildIonicSteps[\s\S]*?function buildCovalentSteps/g, `function buildIonicSteps(entity: ChemicalEntity): LearnStep[] {
  return [
    {
      id: 'ionic_1',
      title: '01 — Identify the Atoms',
      explanation: \`We have Na (Sodium) and Cl (Chlorine).\`,
      reasoning: 'Sodium is a metal and Chlorine is a non-metal, leading to ionic bonding.\\nSodium has one valence electron available for transfer.\\nChlorine requires one electron to complete its valence shell.',
      visualStateId: \`\${entity.formula}_atoms\`
    },
    {
      id: 'ionic_2',
      title: '02 — Determine Valence Electrons',
      explanation: 'Sodium has 1 valence electron. Chlorine has 7 valence electrons.',
      reasoning: 'Na (Group 1) wants to lose 1 electron to achieve a stable octet. Cl (Group 17) wants to gain 1 electron.',
      visualStateId: \`\${entity.formula}_valence\`
    },
    {
      id: 'ionic_3',
      title: '03 — Electron Transfer',
      explanation: 'Sodium transfers its 1 valence electron to Chlorine.',
      reasoning: 'Electron transfer produces Na⁺ and Cl⁻.',
      visualStateId: \`\${entity.formula}_transfer\`
    },
    {
      id: 'ionic_4',
      title: '04 — Ion Formation',
      explanation: 'Na becomes Na⁺ and Cl becomes Cl⁻.',
      reasoning: 'Both now have stable noble-gas electron configurations.',
      visualStateId: \`\${entity.formula}_ions\`
    },
    {
      id: 'ionic_5',
      title: '05 — Electrostatic Attraction',
      explanation: 'The oppositely charged ions attract each other strongly.',
      reasoning: 'Electrostatic attraction produces the ionic interaction.',
      visualStateId: \`\${entity.formula}_attraction\`
    },
    {
      id: 'ionic_6',
      title: '06 — Final Structural Analysis',
      explanation: \`\${entity.name} forms a stable \${entity.geometry} structure.\`,
      reasoning: 'The combination is electrically neutral, with a 1:1 ratio of Na⁺ to Cl⁻.',
      visualStateId: \`\${entity.formula}_summary\`
    }
  ];
}

function buildCovalentSteps`);

code = code.replace(/function buildCovalentSteps[\s\S]*?return steps;\n}/g, `function buildCovalentSteps(entity: ChemicalEntity, intent: ChemistryIntent): LearnStep[] {
  const steps: LearnStep[] = [];
  
  let stepCounter = 1;
  const getStepTitle = (title: string) => \`\${stepCounter.toString().padStart(2, '0')} — \${title}\`;
  
  steps.push({
    id: 'cov_1',
    title: getStepTitle('Identify Central Atom'),
    explanation: \`Central atom: \${entity.centralAtom}. Ligands: \${entity.ligands?.map(l => l.count + ' ' + l.atom).join(', ')}.\`,
    reasoning: \`\${entity.centralAtom} is the central atom because it is the least electronegative (or is the only one capable of multiple bonds).\`,
    visualStateId: \`\${entity.formula}_atoms\`
  });
  stepCounter++;

  steps.push({
    id: 'cov_2',
    title: getStepTitle('Determine Valence Electrons'),
    explanation: \`Total valence electrons = \${entity.valenceElectrons}.\`,
    reasoning: entity.formula === 'H2O' 
        ? 'Oxygen has six valence electrons.\\nHydrogen brings one each, totaling 8 valence electrons.' 
        : (entity.formula === 'BF3' ? 'Boron contributes three valence electrons.\\nFluorines bring 7 each, totaling 24 valence electrons.' : 'Summing the valence electrons from all atoms defines the total electrons for bonding and lone pairs.'),
    visualStateId: \`\${entity.formula}_valence\`
  });
  stepCounter++;

  if (intent === 'LEWIS_STRUCTURE') {
    steps.push({
      id: 'cov_lewis_3',
      title: getStepTitle('Form Bonds'),
      explanation: 'Draw single bonds between the central atom and ligands.',
      reasoning: 'Each single bond uses 2 electrons.',
      visualStateId: \`\${entity.formula}_lewis_bonds_only\`
    });
    stepCounter++;
    steps.push({
      id: 'cov_lewis_4',
      title: getStepTitle('Distribute Remaining Electrons'),
      explanation: 'Complete the octets of outer atoms first, then the central atom.',
      reasoning: 'If the central atom lacks an octet, form double/triple bonds as needed.',
      visualStateId: \`\${entity.formula}_lewis_lone_pairs\`
    });
    stepCounter++;
    steps.push({
      id: 'cov_lewis_5',
      title: getStepTitle('Final Structural Analysis'),
      explanation: \`This represents the electron distribution in \${entity.name}.\`,
      reasoning: 'All atoms (except H, which needs 2) have a stable octet.',
      visualStateId: \`\${entity.formula}_lewis_summary\`
    });
  } else if (intent === 'HYBRIDIZATION') {
    steps.push({
      id: 'cov_hyb_3',
      title: getStepTitle('Ground-State Configuration'),
      explanation: \`Consider the ground state of \${entity.centralAtom}.\`,
      reasoning: 'We need to see if excitation is required to form the necessary number of bonds.',
      visualStateId: \`\${entity.formula}_ground_state\`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_4',
      title: getStepTitle('Hybridization'),
      explanation: \`The central atom undergoes \${entity.hybridization} hybridization.\`,
      reasoning: entity.formula === 'BF3' ? 'Three sp² hybrid orbitals form.\\nThey arrange themselves to minimize electron repulsion.' : \`Orbitals mix to form equivalent \${entity.hybridization} hybrid orbitals.\`,
      visualStateId: \`\${entity.formula}_hybridization\`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_5',
      title: getStepTitle('Orbital Overlap'),
      explanation: 'Hybrid orbitals overlap with ligand orbitals to form sigma bonds.',
      reasoning: entity.formula === 'BF3' ? 'Each overlaps with a fluorine orbital to produce a σ bond.' : 'Sigma bonds form along the internuclear axis.',
      visualStateId: \`\${entity.formula}_sigma_bonds\`
    });
    stepCounter++;
    steps.push({
      id: 'cov_hyb_6',
      title: getStepTitle('Molecular Geometry'),
      explanation: \`The resulting geometry is \${entity.geometry}.\`,
      reasoning: entity.formula === 'BF3' ? 'The resulting electron-domain arrangement is trigonal planar.' : 'VSEPR theory dictates that the electron domains arrange themselves to minimize repulsion.',
      visualStateId: \`\${entity.formula}_summary\`
    });
  } else {
    // Default TEACH_PROCESS
    let bondCount = 0;
    entity.ligands?.forEach(l => { bondCount += l.count; });
    
    if (bondCount > 0) {
      for (let i = 0; i < bondCount; i++) {
        steps.push({
          id: \`cov_proc_3_\${i}\`,
          title: getStepTitle(\`Bond Formation (\${i + 1}/\${bondCount})\`),
          explanation: \`The \${entity.ligands?.[0]?.atom || 'ligand'} atom approaches and overlaps orbitals with the central atom.\`,
          reasoning: \`Two \${entity.centralAtom}-\${entity.ligands?.[0]?.atom} bonding pairs form through electron sharing.\\nA stable σ bonding interaction is developing along the internuclear axis.\`,
          visualStateId: \`\${entity.formula}_bond_\${i}\`
        });
        stepCounter++;
      }
    } else {
      steps.push({
        id: 'cov_proc_3',
        title: getStepTitle('Bonding Arrangement'),
        explanation: 'Form covalent bonds by sharing electrons.',
        reasoning: 'Each bond contributes to the stable configuration of the participating atoms.',
        visualStateId: \`\${entity.formula}_bonds_only\`
      });
      stepCounter++;
    }

    steps.push({
      id: 'cov_proc_4',
      title: getStepTitle('Lone Pairs'),
      explanation: \`The central atom has \${entity.lonePairs} lone pair(s).\`,
      reasoning: entity.formula === 'H2O' ? 'The remaining two electron pairs are non-bonding.\\nTheir repulsion contributes to the bent molecular geometry.' : 'Lone pairs occupy more space and repel bonding pairs, affecting the final geometry.',
      visualStateId: \`\${entity.formula}_lone_pairs\`
    });
    stepCounter++;

    steps.push({
      id: 'cov_proc_5',
      title: getStepTitle('Final Structural Analysis'),
      explanation: \`The molecule has a \${entity.geometry} geometry.\`,
      reasoning: 'The bonding interaction has reached its final structural state.\\nThe combination of bonding domains and lone pairs determines this shape.',
      visualStateId: \`\${entity.formula}_summary\`
    });
  }

  return steps;
}`);

fs.writeFileSync('src/LearnEngine/LessonBuilder.ts', code, 'utf8');

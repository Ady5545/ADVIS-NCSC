const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LessonBuilder.ts', 'utf8');

const newSteps = `    // Default TEACH_PROCESS
    let bondCount = 0;
    entity.ligands?.forEach(l => { bondCount += l.count; });
    
    if (bondCount > 0) {
      for (let i = 0; i < bondCount; i++) {
        steps.push({
          id: \`cov_proc_3_\${i}\`,
          title: \`Bond Formation (\${i + 1}/\${bondCount})\`,
          explanation: \`The \${entity.ligands?.[0]?.atom || 'ligand'} atom approaches and overlaps orbitals with the central atom.\`,
          reasoning: \`Electrons are shared to form bond \${i + 1}.\`,
          visualStateId: \`\${entity.formula}_bond_\${i}\`
        });
      }
    } else {
      steps.push({
        id: 'cov_proc_3',
        title: 'Bonding Arrangement',
        explanation: 'Form covalent bonds by sharing electrons.',
        reasoning: 'Each bond contributes to the stable configuration of the participating atoms.',
        visualStateId: \`\${entity.formula}_bonds_only\`
      });
    }`;

code = code.replace(/steps\.push\(\{\s*id: 'cov_proc_3',[\s\S]*?visualStateId: \`\$\{entity\.formula\}_bonds_only\`\s*\}\);/, newSteps);
fs.writeFileSync('src/LearnEngine/LessonBuilder.ts', code, 'utf8');

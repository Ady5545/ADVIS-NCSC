const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LessonBuilder.ts', 'utf8');

const replacement = `if (intent === 'LEWIS_STRUCTURE') {
    steps.push({
      id: 'cov_lewis_3',
      title: 'Form Bonds',
      explanation: 'Draw single bonds between the central atom and ligands.',
      reasoning: 'Each single bond uses 2 electrons.',
      visualStateId: \`\${entity.formula}_lewis_bonds_only\`
    });
    steps.push({
      id: 'cov_lewis_4',
      title: 'Distribute Remaining Electrons',
      explanation: 'Complete the octets of outer atoms first, then the central atom.',
      reasoning: 'If the central atom lacks an octet, form double/triple bonds as needed.',
      visualStateId: \`\${entity.formula}_lewis_lone_pairs\`
    });
    steps.push({
      id: 'cov_lewis_5',
      title: 'Final Lewis Structure',
      explanation: \`This represents the electron distribution in \${entity.name}.\`,
      reasoning: 'All atoms (except H, which needs 2) have a stable octet.',
      visualStateId: \`\${entity.formula}_lewis_summary\`
    });
  }`;

code = code.replace(/if \(intent === 'LEWIS_STRUCTURE'\) \{[\s\S]*?\} else if/m, replacement + " else if");
fs.writeFileSync('src/LearnEngine/LessonBuilder.ts', code, 'utf8');

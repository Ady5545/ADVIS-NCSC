import re

with open('src/LearnEngine/ValenceValidator.ts', 'r') as f:
    content = f.read()

content = content.replace("totalValenceElectrons: number;", "totalValenceElectrons: number;\n  totalFormalCharge: number;")

# Compute totalFormalCharge
content = content.replace("  let educationalSummary", """
  let totalFormalCharge = 0;
  for (const id in atomAnalyses) {
    totalFormalCharge += atomAnalyses[id].formalCharge || 0;
  }
  let educationalSummary""")

content = content.replace("totalValenceElectrons,", "totalValenceElectrons,\n    totalFormalCharge,")

with open('src/LearnEngine/ValenceValidator.ts', 'w') as f:
    f.write(content)


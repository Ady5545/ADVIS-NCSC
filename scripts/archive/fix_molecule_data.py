import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const moleculeKey = activeLearningSession?.context?.entity || null;",
                          "  const moleculeKey = activeLearningSession?.context?.entity || null;\n  const moleculeData = moleculeKey ? SCIENTIFIC_ENTITIES[moleculeKey.toLowerCase()] || SCIENTIFIC_ENTITIES[moleculeKey] : null;\n  const moleculeSpec = moleculeData ? MOLECULE_SPECS[moleculeData.formula] : null;")

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


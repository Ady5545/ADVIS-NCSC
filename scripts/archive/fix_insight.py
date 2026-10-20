import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const activeKey = moleculeKey || activeSpatialObjectsArray[0] || null;",
                          "  const activeKey = moleculeKey || activeSpatialObjectsArray[0] || null;\n  const educationalInsight = activeKey ? EDUCATIONAL_INSIGHTS[activeKey] : null;")

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


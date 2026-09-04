import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

content = content.replace("analysis?.atomAnalyses?.[selectedAtom.id]?.geometry", "analysis?.atomAnalyses?.[selectedAtom.id]?.hybridization")
content = content.replace("analysis.atomAnalyses[selectedAtom.id]?.geometry", "analysis.atomAnalyses[selectedAtom.id]?.hybridization")
content = content.replace("analysis?.geometry", "analysis?.estimatedGeometry")
content = content.replace("analysis.geometry", "analysis.estimatedGeometry")

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


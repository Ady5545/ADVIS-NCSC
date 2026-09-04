import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"analysis\.formalCharges\[selectedAtom\.id\]", r"analysis.atomAnalyses[selectedAtom.id]?.formalCharge", content)
content = re.sub(r"analysis\.localGeometries\?\.\[selectedAtom\.id\]", r"analysis.atomAnalyses[selectedAtom.id]?.estimatedGeometry", content)
content = re.sub(r"analysis\.vseprGeometry", r"analysis.estimatedGeometry", content)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


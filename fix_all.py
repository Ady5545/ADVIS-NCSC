import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("radialModulation={false}", "")
content = content.replace("modulationOffset={0}", "")

with open('src/App.tsx', 'w') as f:
    f.write(content)


with open('src/LearnEngine/ChemistryDatabase.ts', 'r') as f:
    content = f.read()

content = content.replace("category: string;", "category: string;\n  description?: string;")

with open('src/LearnEngine/ChemistryDatabase.ts', 'w') as f:
    f.write(content)


with open('src/ScientificComparator.tsx', 'r') as f:
    content = f.read()

content = content.replace("parseFloat(entityA_chem.dipoleMoment || \"0\") > 0", "parseFloat((entityA_chem.dipoleMoment || '0') as string) > 0")
content = content.replace("parseFloat(entityB_chem.dipoleMoment || \"0\") > 0", "parseFloat((entityB_chem.dipoleMoment || '0') as string) > 0")

with open('src/ScientificComparator.tsx', 'w') as f:
    f.write(content)


with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("parseFloat(item.dipoleMoment || \"0\") > 0", "parseFloat((item.dipoleMoment || '0') as string) > 0")

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)


with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"analysis\.formalCharges\[selectedAtom\.id\]", r"analysis.atomAnalyses[selectedAtom.id]?.formalCharge", content)
content = re.sub(r"analysis\.localGeometries\?\.\[selectedAtom\.id\]", r"analysis.atomAnalyses[selectedAtom.id]?.geometry", content)
content = re.sub(r"analysis\.vseprGeometry", r"analysis.estimatedGeometry", content)
content = content.replace("analysis.formalCharges", "analysis.atomAnalyses")
content = content.replace("analysis.localGeometries", "analysis.atomAnalyses")

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


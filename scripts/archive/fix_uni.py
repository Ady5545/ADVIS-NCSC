import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# Fix DigitalTwinInspector missing import
if "import { DigitalTwinInspector }" not in content:
    content = content.replace("import { Atom, Cpu, Network, Info, Zap } from 'lucide-react';", "import { Atom, Cpu, Network, Info, Zap } from 'lucide-react';\nimport { DigitalTwinInspector } from './DigitalTwinInspector';")

# Fix analysis.formalCharges
content = re.sub(r"analysis\.formalCharges\[selectedAtom\.id\]", r"analysis.atomAnalyses[selectedAtom.id]?.formalCharge", content)

# Fix analysis.localGeometries
content = re.sub(r"analysis\.localGeometries\?\.\[selectedAtom\.id\] \|\| 'N/A'", r"analysis.atomAnalyses[selectedAtom.id]?.geometry || 'N/A'", content)

# Fix analysis.vseprGeometry
content = re.sub(r"analysis\.vseprGeometry", r"analysis.estimatedGeometry", content)

# Fix analysis.netCharge
content = re.sub(r"analysis\?.netCharge", r"analysis?.totalFormalCharge", content)
content = re.sub(r"analysis\.netCharge", r"analysis.totalFormalCharge", content)

# Fix analysis.isValid
content = re.sub(r"analysis\.isValid", r"(analysis.warnings.length === 0)", content)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


with open('src/LearnEngine/MolecularBuilderHUD.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"analysis\?\.totalFormalCharge", r"(analysis?.totalFormalCharge ?? 0)", content)
content = re.sub(r"analysis\.totalFormalCharge", r"(analysis?.totalFormalCharge ?? 0)", content)

with open('src/LearnEngine/MolecularBuilderHUD.tsx', 'w') as f:
    f.write(content)


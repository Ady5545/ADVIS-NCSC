import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

# Fix imports
if "SCIENTIFIC_ENTITIES" not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { SCIENTIFIC_ENTITIES, EDUCATIONAL_INSIGHTS, MOLECULE_SPECS } from './ChemistryDatabase';")

# Fix implicit any for pt, idx
content = content.replace("educationalInsight.keyPoints.map((pt, idx)", "educationalInsight.keyPoints.map((pt: string, idx: number)")

# Fix selectedComp is possibly null
content = content.replace("selectedComp.name", "selectedComp?.name")
content = content.replace("selectedComp.description", "selectedComp?.description")

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


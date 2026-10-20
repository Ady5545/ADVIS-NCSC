import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { SCIENTIFIC_ENTITIES, EDUCATIONAL_INSIGHTS, MOLECULE_SPECS } from './LearnEngine/ChemistryDatabase';", "import { CHEMISTRY_DATABASE } from './LearnEngine/ChemistryDatabase';")
content = re.sub(r"const moleculeData = moleculeKey \? SCIENTIFIC_ENTITIES[^;]+;", r"const moleculeData = moleculeKey ? CHEMISTRY_DATABASE[moleculeKey] : null;", content)
content = re.sub(r"const moleculeSpec = moleculeData \? MOLECULE_SPECS[^;]+;", "", content)
content = re.sub(r"const educationalInsight = activeKey \? EDUCATIONAL_INSIGHTS\[activeKey\] \: null;", "", content)

# I will just remove the whole educational insight block in ScientificHUD.tsx because it's invented
content = re.sub(r"\{/\* ─────────────────────────────────────────────────────────────\s*3\. BOTTOM-LEFT WIDGET: CONTEXTUAL EDUCATIONAL INSIGHT\s*───────────────────────────────────────────────────────────── \*/\}.*?(?=</>|</div>\s*</div>\s*$|{/\* ─────────────────────────────────────────────────────────────\s*4\. KINEMATICS & TRACE WORKSTATION CONTROLS)", "", content, flags=re.DOTALL)


with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


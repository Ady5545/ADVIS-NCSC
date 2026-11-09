import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

# Remove duplicate imports
lines = content.split('\n')
filtered_lines = []
import_db = False
for line in lines:
    if "import { CHEMISTRY_DATABASE" in line:
        if import_db:
            continue
        import_db = True
    filtered_lines.append(line)

content = '\n'.join(filtered_lines)

# Remove moleculeSpec usage
content = re.sub(r'\{moleculeSpec \? moleculeSpec\.weight \: '"'"'N/A'"'"'\}', "{'N/A'}", content)
content = re.sub(r'\{moleculeSpec\.weight\}', "{'N/A'}", content)
content = re.sub(r'moleculeSpec \? ', "false ? ", content)

# Replace educationalInsight blocks with nothing
content = re.sub(r'\{educationalInsight \? educationalInsight\.title \: '"'"'SCIENTIFIC PRINCIPLES'"'"'\}', "{'SCIENTIFIC PRINCIPLES'}", content)
content = re.sub(r'\{educationalInsight \? \(.*?\) \: \(', "{(", content, flags=re.DOTALL)

# In case the block above fails, let's just make educationalInsight a dummy variable.
if "const moleculeData" in content and "educationalInsight =" not in content:
    content = content.replace("const moleculeData =", "const educationalInsight: any = null;\n  const moleculeSpec: any = null;\n  const moleculeData =")

# Fix isolatedComponentId toggle null
content = content.replace("onToggleIsolate(isolatedComponentId === selectedComp.id ? null : selectedComp.id)", "onToggleIsolate(isolatedComponentId === selectedComp?.id ? null : (selectedComp?.id || null))")

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


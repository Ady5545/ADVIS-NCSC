import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. formula
content = content.replace("sessionMolecule.molecule.formula", "sessionMolecule.molecule.metadata?.name")

# 2. setActiveModal
content = content.replace("setActiveModal(compare);", "setCurrentView('compare');")

# 3. BlendFunction
content = content.replace("blendFunction={BlendFunction.NORMAL}", "")

# 4. ChemistryIntent
content = content.replace("onStartLesson={(subject, intent) => {", "onStartLesson={(subject, intent: any) => {")
content = content.replace("onStartLesson={(subject, intent) =>", "onStartLesson={(subject, intent: any) =>")

with open('src/App.tsx', 'w') as f:
    f.write(content)


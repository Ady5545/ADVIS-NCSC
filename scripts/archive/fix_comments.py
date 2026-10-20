import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# I will just remove those commented out blocks entirely
content = re.sub(r'/\* \{isEngineering && selectedComp.*?\*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* \{isEngineering && !selectedComp.*?\*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* \{isEngineering && engineeringMeta &&.*?\*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* \{isEngineering && engineeringMeta\?\.educationalInformation &&.*?\*/', '', content, flags=re.DOTALL)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


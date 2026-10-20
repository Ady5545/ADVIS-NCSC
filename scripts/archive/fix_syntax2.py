import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# I will just write a completely valid ending from the chemistry parts.
# To do this safely, I will replace the end of the file from "{/* Engineering: No component selected */}" downwards.
content = re.sub(r'\{\/\* Engineering: No component selected \*\/.*?\}\);', '', content, flags=re.DOTALL)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


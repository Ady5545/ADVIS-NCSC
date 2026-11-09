import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# I will just write a regex to replace everything from the first "          {/* Engineering: No component selected */}"
# down to "{/* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW */}"
content = re.sub(r'          \{/\* Engineering: No component selected \*/\}.*?\{/\* TAB 2:', 
                 '          </div>\n      )}\n      {/* TAB 2:', content, flags=re.DOTALL)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


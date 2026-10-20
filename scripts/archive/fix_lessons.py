import re

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

# Fix the lesson engineering launch
content = re.sub(
    r"if \(lesson\.isEngineering\) \{\s*if \(onSelectSpatialObject\) onSelectSpatialObject\(lesson\.subject, 'INSPECTION'\);\s*\}",
    "if (lesson.isEngineering) {\n                        setView('demonstration');\n                      }",
    content
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)

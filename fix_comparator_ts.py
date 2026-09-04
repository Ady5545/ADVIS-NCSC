import re

with open('src/ScientificComparator.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "onSelectSpatialObject: (id: string) => void;",
    "onSelectSpatialObject: (id: string | string[]) => void;"
)

with open('src/ScientificComparator.tsx', 'w') as f:
    f.write(content)

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id, 'INSPECTION');
              setView('home');
            }}""",
    """onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
              setView('home');
            }}"""
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)

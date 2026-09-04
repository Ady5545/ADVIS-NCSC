import re

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """<DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />""",
    """<DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'DEMO');
            }}
            onClose={() => setView('home')}
          />"""
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)

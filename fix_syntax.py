import re

# ViewModal.tsx
with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()
    
content = content.replace("""<DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'DEMO');
            }}
            onClose={() => setView('home')}
          />
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'DEMO');
            }}
            onClose={() => setView('home')}
          />""", """<DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'DEMO');
            }}
            onClose={() => setView('home')}
          />""")

content = content.replace("""<ScientificComparator
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
              setView('home');
            }}
            onClose={() => setView('home')}
          />""", """<ScientificComparator
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
              setView('home');
            }}
            onClose={() => setView('home')}
          />""")

content = content.replace("""<div className="space-y-1.5 text-[11px] font-mono text-cyan-400/80">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🤏 PINCH (1 Hand):</span>
                    <span>Component Selection / Manipulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🖐️ OPEN PALM (1 Hand):</span>
                    <span>Rotate / Orbit Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">👐 PINCH (2 Hands):</span>
                    <span>Scale / Zoom Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">☝️ INDEX POINTER:</span>
                    <span>Raycast Hover / Inspect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">✊ FIST:</span>
                    <span>Isolate Focused Component (Coming Soon)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }""", """<div className="space-y-1.5 text-[11px] font-mono text-cyan-400/80">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🤏 PINCH (1 Hand):</span>
                    <span>Component Selection / Manipulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🖐️ OPEN PALM (1 Hand):</span>
                    <span>Rotate / Orbit Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">👐 PINCH (2 Hands):</span>
                    <span>Scale / Zoom Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">☝️ INDEX POINTER:</span>
                    <span>Raycast Hover / Inspect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">✊ FIST:</span>
                    <span>Isolate Focused Component</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }""")

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)


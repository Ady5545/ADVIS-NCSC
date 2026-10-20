import re

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

# Replace the false UI with the actual gestures supported
actual_gestures_ui = """                <div className="space-y-1.5 text-[11px] font-mono text-cyan-400/80">
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
                </div>"""

content = re.sub(
    r'<div className="space-y-1\.5 text-\[11px\] font-mono text-cyan-400/80">.*?</div\s*>\s*</div\s*>',
    actual_gestures_ui + "\n              </div>",
    content,
    flags=re.DOTALL
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)

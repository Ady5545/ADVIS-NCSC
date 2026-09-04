import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

hud_gestures = """            <div className="text-[9px] text-cyan-400/60 space-y-0.5 border-t border-cyan-500/10 pt-1.5">
              <div className="flex justify-between">
                <span>1-Hand Pinch:</span>
                <span className="text-cyan-300">Manipulate</span>
              </div>
              <div className="flex justify-between">
                <span>2-Hand Pinch:</span>
                <span className="text-cyan-300">Zoom / Scale</span>
              </div>
              <div className="flex justify-between">
                <span>Open Palm:</span>
                <span className="text-cyan-300">Rotate / Orbit</span>
              </div>
              <div className="flex justify-between">
                <span>Clap:</span>
                <span className="text-cyan-300">Reset Workspace</span>
              </div>
            </div>"""

content = re.sub(
    r'<div className="text-\[9px\] text-cyan-400/60 space-y-0\.5 border-t border-cyan-500/10 pt-1\.5">.*?</div\s*>',
    hud_gestures,
    content,
    flags=re.DOTALL
)

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)

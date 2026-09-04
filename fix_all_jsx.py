import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# I will replace the end of TAB 1 entirely.
target = """          )}
          {/* Engineering: No component selected */}
            <div className="text-center py-4 text-cyan-400/60 text-[11px] font-sans">
              Click any mechanical module or subsystem in the 3D model to inspect kinematic specs.
            </div>
        </div>
      )}
      {/* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW */}"""

replacement = """          </div>
      )}
      {/* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW */}"""

content = content.replace(target, replacement)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


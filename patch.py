import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# Hide tabs if engineering
content = content.replace("      {/* Tabs */}", "      {/* Tabs */}\n      {!isEngineering && (")
content = content.replace("          Analysis\n        </button>\n      </div>", "          Analysis\n        </button>\n      </div>\n      )}")

# Wrap the tab contents in !isEngineering and add the digital twin
content = content.replace("      {/* TAB 1: SELECTION FOCUS (Atom, Bond, or Component) */}", 
"""      {isEngineering && primaryEngId && (
        <DigitalTwinInspector 
          objectId={primaryEngId as string} 
          selectedComponentId={selectedComponentId} 
          onSelectComponent={onSelectComponent} 
        />
      )}
      {!isEngineering && (
        <>
      {/* TAB 1: SELECTION FOCUS (Atom, Bond, or Component) */}""")

content = content.replace("    </div>\n  );\n};", "        </>\n      )}\n    </div>\n  );\n};")

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


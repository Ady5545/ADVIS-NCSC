import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# The dangling JSX starts right after:
# Click any atom or bond in the 3D workspace to inspect local orbital geometry, formal charge, and bonding state.
#             </div>
#           )}
target_start_regex = r'          \{isChemistry && !selectedAtom && !selectedBond && \(\n            <div className="text-center py-4 text-cyan-400/60 text-\[11px\] font-sans\">\n              Click any atom or bond in the 3D workspace to inspect local orbital geometry, formal charge, and bonding state\.\n            </div>\n          \)\}'
match = re.search(target_start_regex, content)

if match:
    # Delete everything from the end of the chemistry tab 1 up to TAB 2
    # But keep the closing div for the tab!
    start_pos = match.end()
    tab2_match = re.search(r'      \{/\* TAB 2:', content)
    if tab2_match:
        end_pos = tab2_match.start()
        
        new_content = content[:start_pos] + '\n        </div>\n      )}\n' + content[end_pos:]
        
        with open('src/UniversalScientificInspector.tsx', 'w') as f:
            f.write(new_content)


import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# Replace the closing tag that has no opening tag
content = content.replace("""              </button>
            </div>
          )}
          </div>
      )}""", """              </button>
            </div>
          </div>
      )}""")

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


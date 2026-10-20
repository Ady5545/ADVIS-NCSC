import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

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


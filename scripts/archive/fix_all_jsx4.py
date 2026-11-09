import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# For TAB 2: remove everything from the first dangling )} until the end of TAB 2
content = re.sub(r'          \)\}\n            <div className="space-y-2">\n              <div className="text-sm font-bold text-white">\{engineeringMeta\.name\}.*?        </div>\n      \)\}',
                 '        </div>\n      )}', content, flags=re.DOTALL)

# For TAB 3: remove everything from the dangling )} until the end of TAB 3
content = re.sub(r'          \)\}\n            <div className="space-y-2">\n              <div className="text-\[10px\] font-bold text-cyan-300 uppercase">Working Principle:</div>.*?        </div>\n      \)\}',
                 '        </div>\n      )}', content, flags=re.DOTALL)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


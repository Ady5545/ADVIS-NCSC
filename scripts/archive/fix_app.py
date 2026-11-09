import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("setActiveModal('compare');", "setActiveModal('compare' as any);")

with open('src/App.tsx', 'w') as f:
    f.write(content)


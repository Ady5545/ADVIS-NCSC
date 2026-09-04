import re

with open('src/SpatialObjectEngine.tsx', 'r') as f:
    content = f.read()

content = content.replace("sysTimeRef: kinematicAngleRef", "sysTimeRef: null")

with open('src/SpatialObjectEngine.tsx', 'w') as f:
    f.write(content)


import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

content = content.replace("engineeringData?.animations", "engineeringDatas[0]?.animations")
content = content.replace("engineeringData.animations.length", "engineeringDatas[0].animations.length")
content = content.replace("{engineeringData.name}", "{engineeringDatas[0]?.name || ''}")

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)


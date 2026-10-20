import re

with open('src/generators/MechanicalGenerator.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const t = state.sysTimeRef.current;",
    "const t = state.sysTimeRef?.current ?? sysState.clock.elapsedTime;"
)

content = content.replace(
    "state.sysTimeRef.current * (600 / 60)",
    "(state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (600 / 60)"
)

content = content.replace(
    "state.sysTimeRef.current * (600 / 60 / 2)",
    "(state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (600 / 60 / 2)"
)

content = content.replace(
    "state.sysTimeRef.current * 15",
    "(state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * 15"
)

with open('src/generators/MechanicalGenerator.tsx', 'w') as f:
    f.write(content)

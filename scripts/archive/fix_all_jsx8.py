import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

content = content.replace("""import { Atom, Cpu, Network, Info, Zap } from 'lucide-react';""", """import { Atom, Cpu, Network, Info, Zap } from 'lucide-react';
import { DigitalTwinInspector } from './DigitalTwinInspector';""")

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


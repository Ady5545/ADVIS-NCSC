import re

with open('src/DigitalTwin.ts', 'r') as f:
    content = f.read()

content = content.replace("  category?: string;", "  category?: string;\n  description?: string;")

with open('src/DigitalTwin.ts', 'w') as f:
    f.write(content)


with open('src/DigitalTwinAdapter.ts', 'r') as f:
    content = f.read()

content = content.replace("DiagnosticState, ProvenanceLevel", "DiagnosticRecord, DataProvenance")
content = content.replace("function createDiagnosticState(compId: string): DiagnosticState {", "function createDiagnosticState(compId: string): DiagnosticRecord {")
content = content.replace("let dataProvenance: ProvenanceLevel = 'LIT';", "let dataProvenance: DataProvenance = 'LIT';")

with open('src/DigitalTwinAdapter.ts', 'w') as f:
    f.write(content)


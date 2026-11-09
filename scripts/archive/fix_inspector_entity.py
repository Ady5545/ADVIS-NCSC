import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """<span className="text-cyan-400/70">Geometry:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Geometry <ProvenanceBadge source="LIT" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Total Valence e⁻:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Total Valence e⁻ <ProvenanceBadge source="DERIVED" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Net Formal Charge:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Net Formal Charge <ProvenanceBadge source="DERIVED" /></span>"""
)

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)

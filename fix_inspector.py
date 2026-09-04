import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# Add ProvenanceBadge component to UniversalScientificInspector
badge_def = """  const ProvenanceBadge = ({ source }: { source: 'LIT' | 'DERIVED' | 'LIVE' }) => {
    let color = 'bg-slate-900 text-slate-300 border-slate-500';
    if (source === 'LIT') color = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (source === 'DERIVED') color = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (source === 'LIVE') color = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
    return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${color} ml-1 uppercase tracking-widest`} title="Data Provenance">{source}</span>;
  };"""

content = content.replace("export function UniversalScientificInspector({", badge_def + "\n\nexport function UniversalScientificInspector({")


# Add it to Atom section
content = content.replace(
    """<span className="text-cyan-400/70">Coordinates:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Coordinates <ProvenanceBadge source="LIVE" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Valence e⁻:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Valence e⁻ <ProvenanceBadge source="LIT" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Formal Charge:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Formal Charge <ProvenanceBadge source="DERIVED" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Local Geometry:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Local Geometry <ProvenanceBadge source="DERIVED" /></span>"""
)

# Bond section
content = content.replace(
    """<span className="text-cyan-400/70">Classification:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Classification <ProvenanceBadge source="DERIVED" /></span>"""
)

content = content.replace(
    """<span className="text-cyan-400/70">Est. Bond Length:</span>""",
    """<span className="text-cyan-400/70 flex items-center">Est. Bond Length <ProvenanceBadge source="LIVE" /></span>"""
)


with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)

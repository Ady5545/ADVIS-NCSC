import re

with open('src/UniversalScientificInspector.tsx', 'r') as f:
    content = f.read()

# Clean up all duplicates. Find the first occurrence of "TAB 2" and delete everything after it.
match = re.search(r'\{/\* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW \*/\}', content)
if match:
    content = content[:match.start()]

valid_ending = """      {/* TAB 2: OVERALL ASSEMBLY / STRUCTURE OVERVIEW */}
      {activeTab === 'entity' && (
        <div className="space-y-2 text-xs">
          {isChemistry && molecule && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-cyan-500/10">
                <span className="text-cyan-400/70">Formula:</span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.formula || 'Custom'}</span>
                <span className="text-cyan-400/70">Geometry:</span>
                <span className="text-cyan-200 font-bold text-right">{molecule.geometry || analysis?.vseprGeometry || 'Dynamic'}</span>
                <span className="text-cyan-400/70">Atom Count:</span>
                <span className="text-cyan-200 font-bold text-right">{molecule.atoms.length} atoms</span>
                <span className="text-cyan-400/70">Bond Count:</span>
                <span className="text-cyan-200 font-bold text-right">{molecule.bonds.length} bonds</span>
                <span className="text-cyan-400/70">Total Valence e⁻:</span>
                <span className="text-cyan-200 font-bold text-right">{analysis?.totalValenceElectrons || 0} e⁻</span>
                <span className="text-cyan-400/70">Net Formal Charge:</span>
                <span className="text-cyan-200 font-bold text-right">
                  {analysis?.netCharge !== undefined ? (analysis.netCharge > 0 ? `+${analysis.netCharge}` : analysis.netCharge) : 0}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB 3: SCIENTIFIC ANALYSIS & VALIDATION */}
      {activeTab === 'analysis' && (
        <div className="space-y-2 text-xs">
          {isChemistry && analysis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                <span className="text-[11px] text-cyan-400/70">Structure Validity:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  analysis.isValid
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}>
                  {analysis.isValid ? '✓ STABLE OCTET' : '⚠ VALENCE WARNING'}
                </span>
              </div>
              {analysis.warnings.length > 0 ? (
                <div className="space-y-1 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20 text-[10px] text-amber-200">
                  {analysis.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-cyan-200/80 font-sans font-light leading-relaxed">
                  All valence electron counts and formal charges satisfy thermodynamic equilibrium.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
};
"""

content += valid_ending

with open('src/UniversalScientificInspector.tsx', 'w') as f:
    f.write(content)


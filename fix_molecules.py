import re

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("onSelectMolecule?: (formulaOrKey: string) => void,", "onSelectMolecule?: (formulaOrKey: string) => void,\n  onLoadMoleculeBuilder?: (formulaOrKey: string) => void,")
content = content.replace("onSelectMolecule,", "onSelectMolecule,\n  onLoadMoleculeBuilder,")

# Now change the second button ("In Builder") to call onLoadMoleculeBuilder
content = re.sub(
    r"""onClick=\{\(\) => \{\s*if \(onSelectMolecule\) onSelectMolecule\(item\.formula \|\| key\);\s*setView\('home'\);\s*\}\}\s*className="flex items-center justify-center gap-1\.5 py-1\.5 px-2 bg-slate-900 hover:bg-cyan-950 text-cyan-300 text-xs font-mono rounded border border-cyan-500/30 hover:border-cyan-400 transition-all font-medium cursor-pointer"\s*>\s*<Wrench size=\{13\} />\s*<span>In Builder</span>""",
    """onClick={() => {
                          if (onLoadMoleculeBuilder) onLoadMoleculeBuilder(item.formula || key);
                          setView('home');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-cyan-950 text-cyan-300 text-xs font-mono rounded border border-cyan-500/30 hover:border-cyan-400 transition-all font-medium cursor-pointer"
                      >
                        <Wrench size={13} />
                        <span>In Builder</span>""",
    content
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)


with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "onSelectMolecule={(formulaOrKey) => {\n        sessionMolecule.closeSession();\n        setCurrentSpatialObject(null);\n        setActiveLearningSession(buildChemistryLesson(formulaOrKey, 'SHOW_STRUCTURE', 'SHOW_ME'));\n      }}",
    "onSelectMolecule={(formulaOrKey) => {\n        sessionMolecule.closeSession();\n        setCurrentSpatialObject(null);\n        setActiveLearningSession(buildChemistryLesson(formulaOrKey, 'SHOW_STRUCTURE', 'SHOW_ME'));\n      }}\n      onLoadMoleculeBuilder={(formulaOrKey) => {\n        setActiveLearningSession(null);\n        setCurrentSpatialObject(null);\n        sessionMolecule.loadCanonical(formulaOrKey);\n      }}"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)


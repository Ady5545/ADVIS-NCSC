import re

with open('src/ScientificComparator.tsx', 'r') as f:
    content = f.read()

bad_block = """        </div>
        <div className="md:col-span-2 mt-4">
          <button
            onClick={() => onSelectSpatialObject([engA, engB])}
            className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-sm font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <Eye size={16} />
            <span>Project {entityA_eng.name} vs {entityB_eng.name} in 3D</span>
          </button>
        </div>
      )}
      {/* ENGINEERING COMPARISON MATRIX */}"""

good_block = """        </div>
      )}
      {/* ENGINEERING COMPARISON MATRIX */}"""

content = content.replace(bad_block, good_block)

with open('src/ScientificComparator.tsx', 'w') as f:
    f.write(content)

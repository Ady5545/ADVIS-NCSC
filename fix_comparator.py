import re

with open('src/ScientificComparator.tsx', 'r') as f:
    content = f.read()

# Replace individual project buttons with a unified one for Engineering
content = re.sub(
    r"<button\s+onClick=\{\(\) => onSelectSpatialObject\(eng[AB]\)\}.*?</button>",
    "",
    content,
    flags=re.DOTALL
)

# Insert the unified button at the bottom of the engineering block
eng_button = """
        <div className="md:col-span-2 mt-4">
          <button
            onClick={() => onSelectSpatialObject([engA, engB])}
            className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-sm font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <Eye size={16} />
            <span>Project {entityA_eng.name} vs {entityB_eng.name} in 3D</span>
          </button>
        </div>
"""

# I need to find the end of the grid for engineering
content = content.replace(
    '        </div>\n      )}',
    '        </div>\n' + eng_button + '      )}'
)

with open('src/ScientificComparator.tsx', 'w') as f:
    f.write(content)


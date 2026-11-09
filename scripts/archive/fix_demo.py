import re

with open('src/ViewModal.tsx', 'r') as f:
    content = f.read()

# Make the modal backdrop transparent and moved to the bottom for 'demonstration'
content = content.replace(
    'className="absolute inset-0 z-40 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8 pointer-events-auto"',
    'className={`absolute inset-0 z-40 flex p-4 md:p-8 ${currentView === \'demonstration\' || currentView === \'compare\' ? \'items-end justify-center pointer-events-none\' : \'items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto\'}`}'
)

content = content.replace(
    'className="w-full max-w-5xl max-h-[90vh] bg-black/90 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col overflow-hidden"',
    'className={`w-full max-w-5xl pointer-events-auto bg-black/90 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col overflow-hidden ${currentView === \'demonstration\' || currentView === \'compare\' ? \'max-h-[50vh]\' : \'max-h-[90vh]\'}`}'
)

# Fix DemonstrationMode in ViewModal so it doesn't close the modal
content = re.sub(
    r"<DemonstrationMode[^>]+>",
    """<DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />""",
    content
)

# Wait, the compare mode was also closing the modal! Let's fix that.
content = re.sub(
    r"<ScientificComparator[^>]+>",
    """<ScientificComparator
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />""",
    content
)

with open('src/ViewModal.tsx', 'w') as f:
    f.write(content)


# Also in DemonstrationMode, ensure it updates the spatial object immediately on script change
with open('src/DemonstrationMode.tsx', 'r') as f:
    demo = f.read()

# Add useEffect to handleApplyStep when script changes
new_effect = """
  useEffect(() => {
    handleApplyStep(currentStep);
  }, [activeScriptId, currentStepIndex]);
"""

demo = demo.replace("const handleApplyStep = (step: DemoStep) => {", new_effect + "\n  const handleApplyStep = (step: DemoStep) => {")

with open('src/DemonstrationMode.tsx', 'w') as f:
    f.write(demo)


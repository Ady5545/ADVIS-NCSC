const fs = require('fs');
let code = fs.readFileSync('ButlerEngine.js', 'utf8');

const target = `      // Default "this" / "that" / "it" resolution
      if (activeMolecule || activeVisualization) {
        resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : null);
        resolvedType = 'MOLECULE';
      } else if (activeSpatial) {
        resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
        resolvedType = 'SPATIAL';
      }`;

const rep = `      // Default "this" / "that" / "it" resolution
      if (ctx.selectedComponentId) {
        resolvedTarget = ctx.selectedComponentId;
        resolvedType = 'COMPONENT';
      } else if (activeWorkspace === 'MOLECULES' || activeWorkspace === 'CHEMISTRY') {
        resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : null);
        resolvedType = 'MOLECULE';
      } else if (activeWorkspace === 'SPATIAL' || activeWorkspace === 'ENGINEERING') {
        resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
        resolvedType = 'SPATIAL';
      } else {
        if (activeMolecule || activeVisualization) {
          resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : null);
          resolvedType = 'MOLECULE';
        } else if (activeSpatial) {
          resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
          resolvedType = 'SPATIAL';
        }
      }`;

if (code.includes(target)) {
  code = code.replace(target, rep);
  fs.writeFileSync('ButlerEngine.js', code);
  console.log("Patched ButlerEngine");
} else {
  console.error("Target not found!");
}

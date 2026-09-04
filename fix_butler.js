const fs = require('fs');
let code = fs.readFileSync('ButlerEngine.js', 'utf8');
code = code.replace(
  `        } else if (activeSpatial) {
          resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
          resolvedType = 'SPATIAL';
        }
      } else if (lastAction && lastAction.target) {`,
  `        } else if (activeSpatial) {
          resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
          resolvedType = 'SPATIAL';
        } else if (lastAction && lastAction.target) {
          resolvedTarget = lastAction.target;
          resolvedType = lastAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
        }
      }`
);
// wait, the easiest is to just fix the whole block.

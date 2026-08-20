const fs = require('fs');
let content = fs.readFileSync('src/useHandTracking.ts', 'utf8');

content = content.replace(
  "} else if (activeGesture === 'OPEN PALM') {\n            interactionState = 'TRACKING';\n          } else {\n            interactionState = 'TRACKING';\n          }",
  "} else if (activeGesture === 'OPEN PALM') {\n            interactionState = 'TRACKING';\n          } else if (activeGesture === 'FIST') {\n            interactionState = 'IDLE';\n          } else {\n            interactionState = 'TRACKING';\n          }"
);

fs.writeFileSync('src/useHandTracking.ts', content, 'utf8');
console.log("Patched fist");

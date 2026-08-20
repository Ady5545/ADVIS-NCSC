const fs = require('fs');
let content = fs.readFileSync('src/SpatialObjectEngine.tsx', 'utf8');

content = content.replace(
  "const isPinchActive = Boolean(gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START') || handTrackingRef.current?.gesture === 'PINCH');",
  "const isPinchActive = Boolean(gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || handTrackingRef.current?.gesture === 'PINCH');"
);

content = content.replace(
  "const isPinchActive = gEngine.isPinch || \n                               gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START') || \n                               handTrackingRef.current?.gesture === 'PINCH';",
  "const isPinchActive = gEngine.isPinch || \n                               gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || \n                               handTrackingRef.current?.gesture === 'PINCH';"
);

fs.writeFileSync('src/SpatialObjectEngine.tsx', content, 'utf8');
console.log("Patched syntax");

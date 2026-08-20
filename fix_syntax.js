const fs = require('fs');
let content = fs.readFileSync('src/SpatialObjectEngine.tsx', 'utf8');

// Line 1892
content = content.replace(
  "gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START');",
  "gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG';"
);

// Line 2101
content = content.replace(
  "(gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START') || currentGesture === 'PINCH') &&",
  "(gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || currentGesture === 'PINCH') &&"
);

fs.writeFileSync('src/SpatialObjectEngine.tsx', content, 'utf8');

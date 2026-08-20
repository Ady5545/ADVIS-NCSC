const fs = require('fs');
let content = fs.readFileSync('src/HolographicCursor.tsx', 'utf8');

const oldLines = `  const isScrolling = handTracking.interactionState === 'SCROLL';
  const isHoverState = handTracking.interactionState === 'HOVERING';
  const isSelectState = handTracking.interactionState === 'HOVERING';
  const isTrackingState = handTracking.state === 'TRACKING';
  const progress = handTracking.hoverProgress || 0;`;

const newLines = `  const isScrolling = handTracking.interactionState === 'SCROLL';
  const isHoverState = handTracking.interactionState === 'HOVERING';
  const isSelectState = handTracking.interactionState === 'PINCH_HOLD' || handTracking.interactionState === 'PINCH_DRAG' || handTracking.interactionState === 'PINCH_START';
  const isTrackingState = handTracking.state === 'TRACKING' && !isHoverState && !isSelectState && !isScrolling;
  const progress = handTracking.hoverProgress || 0;`;

content = content.replace(oldLines, newLines);
fs.writeFileSync('src/HolographicCursor.tsx', content, 'utf8');
console.log("Patched cursor states");

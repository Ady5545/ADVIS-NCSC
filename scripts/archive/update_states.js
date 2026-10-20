const fs = require('fs');

function replaceInFile(path) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace string literals cautiously
  content = content.replace(/'NO HAND'/g, "'IDLE'");
  content = content.replace(/'HAND DETECTED'/g, "'TRACKING'");
  content = content.replace(/'POINTING'/g, "'HOVERING'");
  content = content.replace(/'GRABBING OBJECT'/g, "'PINCH_DRAG'");
  content = content.replace(/'TWO HAND CONTROL'/g, "'TWO_HAND_INTERACTION'");
  
  // Note: 'PAUSED' remains 'PAUSED', 'IDLE' remains 'IDLE'
  fs.writeFileSync(path, content, 'utf8');
}

const files = [
  'src/useHandTracking.ts',
  'src/SpatialObjectEngine.tsx',
  'src/HolographicCursor.tsx',
  'src/useGestureEngine.ts',
  'src/GestureContext.tsx',
  'src/App.tsx'
];

files.forEach(replaceInFile);
console.log("Updated state names.");

const fs = require('fs');

function replaceInFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(path, content, 'utf8');
}

// SpatialObjectEngine.tsx
replaceInFile('src/SpatialObjectEngine.tsx', [
  [/interactionState === 'PINCH_DRAG'/g, "(gEngine.interactionState === 'PINCH_DRAG' || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START')"],
  [/gEngine.interactionState === 'PINCH_DRAG' \|\| /g, ""], // Clean up if any
  [/gEngine.interactionState === 'PINCH_DRAG'/g, "gEngine.interactionState.startsWith('PINCH_')"]
]);

// useGestureEngine.ts
replaceInFile('src/useGestureEngine.ts', [
  [/interactionState === 'PINCH_DRAG'/g, "interactionState.startsWith('PINCH_') && interactionState !== 'PINCH_RELEASE'"]
]);

// HolographicCursor.tsx
replaceInFile('src/HolographicCursor.tsx', [
  [/interactionState === 'PINCH_DRAG'/g, "interactionState === 'PINCH_DRAG' || interactionState === 'PINCH_HOLD' || interactionState === 'PINCH_START'"],
]);

// GestureContext.tsx
replaceInFile('src/GestureContext.tsx', [
  [/interactionState === 'PINCH_DRAG'/g, "(interactionState === 'PINCH_DRAG' || interactionState === 'PINCH_HOLD' || interactionState === 'PINCH_START')"]
]);

console.log("Patched other files");

const fs = require('fs');

const src = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

// We will just do a logical explode in ComponentRegistry.ts.
// And we will use the dynamic reparenting but we will fix the animation by using GlobalComponentRegistry in useFrame!

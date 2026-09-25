const fs = require('fs');
const src = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

// Just print the length
console.log(src.length);

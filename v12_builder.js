const fs = require('fs');
let code = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

// I will output a new file that keeps all the geometries but restructures the React tree.

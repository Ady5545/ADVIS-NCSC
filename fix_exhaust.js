const fs = require('fs');
let content = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

// The replacement added `import { Tube } ...` in the middle of the file
content = content.replace("import { Tube } from '@react-three/drei';", "");

fs.writeFileSync('src/generators/MechanicalGenerator.tsx', content, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LearnWorkspace.tsx', 'utf8');

code = code.replace(/'7': '⇷'/g, "'7': '₇'");

fs.writeFileSync('src/LearnEngine/LearnWorkspace.tsx', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const newPrompt = `As an expert mechanical engineer and 3D technical artist, decompose the physical object "\${objectQuery}" into a hierarchical structural assembly of 3D primitive geometric components.
Ensure:
1. Generate exactly 5 to 10 components. Do not exceed 10.
2. Realistic proportions and correct spatial relationships.
3. Components must physically connect (no floating parts).
4. The model must be fully assembled at the origin.
5. Use realistic material types and colors.
6. The size should be relative to 1.0 = 1 meter.

Format: position, size, and rotation MUST be a string like "0,1.2,0".
Allowed geometry values: box, roundedBox, cylinder, sphere, tube, torus, cone, spokeWheel.
Allowed materialType values: PBR_MATTE, PBR_METALLIC, PBR_GLASS, THERMAL_HEATMAP, XRAY_GLASS.
`;

code = code.replace(/const prompt = `As an expert mechanical engineer[\s\S]*?3-element arrays of numbers.\n`;/m, 'const prompt = `' + newPrompt + '`;');
code = code.replace(/position: \{ \n                  type: Type\.ARRAY,\n                  items: \{ type: Type\.NUMBER \},\n                \},/g, 'position: { type: Type.STRING },');
code = code.replace(/size: \{ \n                  type: Type\.ARRAY,\n                  items: \{ type: Type\.NUMBER \},\n                \},/g, 'size: { type: Type.STRING },');
code = code.replace(/rotation: \{ \n                  type: Type\.ARRAY,\n                  items: \{ type: Type\.NUMBER \},\n                \},/g, 'rotation: { type: Type.STRING },');

fs.writeFileSync('server.js', code);

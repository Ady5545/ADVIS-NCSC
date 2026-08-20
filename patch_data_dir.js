const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  'const dataDir = process.env.NODE_ENV === "production" ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");',
  'const dataDir = path.join(process.cwd(), ".data"); // Fixed: Always use workspace root for persistence in AI Studio.'
);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Fixed data directory persistence.");

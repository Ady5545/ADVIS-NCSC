const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(/const PORT = process\.env\.PORT \|\| 3000;/g, "const PORT = 3001;");
code = code.replace(/app\.listen\(PORT,/g, "app.listen(3001,");
fs.writeFileSync('server_test.js', code);

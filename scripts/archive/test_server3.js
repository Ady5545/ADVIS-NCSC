const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(/const PORT = process\.env\.PORT \|\| 3000;/g, "const PORT = 3003;");
code = code.replace(/app\.listen\(PORT,/g, "app.listen(3003,");
fs.writeFileSync('server_test3.js', code);

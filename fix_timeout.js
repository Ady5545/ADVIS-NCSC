const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// The API endpoint hangs or fails silently in server.js?
// Wait, if an error happens, we have a catch (err) block:
// catch (err) { console.error("Structure Gen Error:", err); res.status(500).json({ error: "Failed to generate structure" }); }

code = code.replace(/console\.error\("Structure Gen Error:", err\);/g, 'console.error("Structure Gen Error:", err.message, err.stack);');
fs.writeFileSync('server.js', code);

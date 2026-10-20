const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('let chatHistories = {};')) {
     lines.splice(i + 1, 0, '  const ADVIS_MEMORIES_FILE = path.join(dataDir, "advis_memories.json");');
     lines.splice(i + 2, 0, '  const ADVIS_PROJECTS_FILE = path.join(dataDir, "advis_projects.json");');
     lines.splice(i + 3, 0, '  let advisMemories = [];');
     lines.splice(i + 4, 0, '  let advisProjects = [];');
     replaced = true;
     break;
  }
}

if(replaced) {
   fs.writeFileSync('server.js', lines.join('\n'), 'utf8');
   console.log("Rewrote top of server");
} else {
   console.log("Failed to find injection point");
}

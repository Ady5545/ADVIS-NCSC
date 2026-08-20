const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  `  const HISTORY_FILE = path.join(dataDir, "histories.json");
  const MEMORIES_FILE = path.join(dataDir, "memories.json");
  let chatHistories = {};
  let globalMemories = [];`,
  `  const HISTORY_FILE = path.join(dataDir, "histories.json");
  const MEMORIES_FILE = path.join(dataDir, "memories.json");
  const ADVIS_MEMORIES_FILE = path.join(dataDir, "advis_memories.json");
  const ADVIS_PROJECTS_FILE = path.join(dataDir, "advis_projects.json");
  let chatHistories = {};
  let globalMemories = [];
  let advisMemories = [];
  let advisProjects = [];`
);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Fixed server.js declarations for real");

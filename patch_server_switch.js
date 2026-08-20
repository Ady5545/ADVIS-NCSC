const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  `      // extractAndSaveMemories(message); /* Disabled per Phase M1 */ // Background extraction
      return res.json({ reply: localReply, mode: mode || "normal", status: "online" });`,
  `      // extractAndSaveMemories(message); /* Disabled per Phase M1 */ // Background extraction
      let overrideReply = localReply;
      let newProjectId = undefined;
      if (typeof localReply === 'string' && localReply.startsWith('PROJECT_SWITCH:')) {
          newProjectId = localReply.split(':')[1];
          overrideReply = "I have switched the active context to that project, Sir.";
      }
      return res.json({ reply: overrideReply, mode: mode || "normal", status: "online", activeProjectId: newProjectId });`
);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Patched server project switch");

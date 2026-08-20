const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// We need to inject the activeProjectId processing into the endpoint
server = server.replace(
  "const { message, mode, deviceId = 'default', image, currentSpatialObject, selectedComponentId, hoveredComponentId } = req.body;",
  "const { message, mode, deviceId = 'default', image, currentSpatialObject, selectedComponentId, hoveredComponentId, activeProjectId } = req.body;"
);

// We replace the handleMemoryAgent with a smarter intent parser or we just do it in the main flow.
// Actually, let's just make the MEMORY_AGENT detection stronger in masterBrainRoute.
server = server.replace(
  `    const memoryKeywords = ["remember that ", "what do you remember", "what is my schedule", "do i have any", "have you saved", "forget that"];
    if (memoryKeywords.some(k => lower.includes(k) || lower.startsWith(k))) {
      return "MEMORY_AGENT";
    }`,
  `    const memoryKeywords = ["remember that ", "save this ", "forget that", "what do you remember", "show my memories", "remember this for", "switch to the ", "what is my active project"];
    if (memoryKeywords.some(k => lower.includes(k) || lower.startsWith(k))) {
      return "MEMORY_AGENT";
    }`
);

// For handleMemoryAgent, let's replace it entirely. It will be async now.
const newHandleMemoryAgent = `
  async function handleMemoryAgent(message, activeProjectId) {
    const lower = message.toLowerCase();
    
    if (lower.includes("what is my active project")) {
       if (!activeProjectId) return "You currently have no active project set, Sir.";
       const proj = advisProjects.find(p => p.id === activeProjectId);
       if (proj) return \`Your current active project is \${proj.name} (\${proj.description}).\`;
       return "You have an active project ID, but I cannot find its details in the database, Sir.";
    }
    
    if (lower.startsWith("switch to the ")) {
       const targetName = lower.replace("switch to the ", "").replace(" project", "").trim();
       const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));
       if (proj) {
         return \`PROJECT_SWITCH:\${proj.id}\`; // Special signal to UI to change state, handled later
       }
       return \`I could not find a project matching "\${targetName}", Sir. Please create it first.\`;
    }

    const client = getGeminiClient();
    if (!client) return "My memory banks are currently offline due to a missing AI connection.";

    // Let's use Gemini to parse the memory intent
    const prompt = \`
You are the ADVIS Memory Intent Parser.
Analyze the following user command: "\${message}"

Current Active Project ID: \${activeProjectId || 'NONE'}

Available Categories: PERSONAL, PROJECT, HARDWARE, ENGINEERING, DEVELOPMENT, GOAL, PREFERENCE, WORKSPACE

Decide what action to take:
1. STORE: If the user wants to remember a new fact.
2. DELETE: If the user wants to forget a fact.
3. RETRIEVE: If the user is asking what is remembered.

Output JSON only, in this exact format:
{
  "action": "STORE" | "DELETE" | "RETRIEVE",
  "category": "ONE_OF_THE_CATEGORIES",
  "content": "The fact to store, delete, or retrieve query",
  "tags": ["relevant", "tags"],
  "targetProjectName": "Optional name of project if mentioned (e.g. 'V12 project')"
}
\`;
    
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { temperature: 0.1, responseMimeType: "application/json" }
      });
      
      const intent = JSON.parse(response.text.trim());
      
      if (intent.action === "STORE") {
         let pId = activeProjectId;
         if (intent.targetProjectName) {
            const proj = advisProjects.find(p => p.name.toLowerCase().includes(intent.targetProjectName.toLowerCase()));
            if (proj) pId = proj.id;
         }
         const newMemory = {
           id: "mem_" + Date.now() + "_" + Math.floor(Math.random()*1000),
           category: intent.category,
           content: intent.content,
           source: 'USER',
           createdAt: Date.now(),
           updatedAt: Date.now(),
           importance: 5,
           tags: intent.tags,
           projectId: pId,
           pinned: false,
           metadata: {}
         };
         advisMemories.push(newMemory);
         saveData();
         return \`I have saved that to my memory banks, Sir. (Category: \${intent.category})\`;
      } 
      else if (intent.action === "DELETE") {
         // Simple exact or partial match delete
         const idx = advisMemories.findIndex(m => m.content.toLowerCase().includes(intent.content.toLowerCase()) || intent.content.toLowerCase().includes(m.content.toLowerCase()));
         if (idx !== -1) {
            advisMemories.splice(idx, 1);
            saveData();
            return "I have purged that information from my memory banks, Sir.";
         }
         return "I could not find a matching memory to delete, Sir.";
      }
      else if (intent.action === "RETRIEVE") {
         let results = advisMemories.filter(m => m.content.toLowerCase().includes(intent.content.toLowerCase()) || m.tags.some(t => intent.content.toLowerCase().includes(t.toLowerCase())));
         if (results.length === 0) {
            // fallback to returning active project memories or all
            if (activeProjectId) {
               results = advisMemories.filter(m => m.projectId === activeProjectId);
            } else {
               results = advisMemories.slice(-5);
            }
         }
         if (results.length === 0) return "I have no specific memories regarding that, Sir.";
         return \`Based on my memory databanks:\\n\${results.map((m, i) => \`\${i+1}. \${m.content}\`).join('\\n')}\`;
      }
    } catch (e) {
      console.error(e);
      return "I encountered an error accessing my memory banks, Sir.";
    }
    return "Memory operation completed.";
  }
`;

server = server.replace(/function handleMemoryAgent\(message, globalMemories\) \{[\s\S]*?\n  \}/, newHandleMemoryAgent);

// Update where handleMemoryAgent is called
server = server.replace(
  "localReply = handleMemoryAgent(message, globalMemories);",
  "localReply = await handleMemoryAgent(message, activeProjectId);"
);

// Update the AI context injection
const newContextInjection = `
      // M1 Memory Context Retrieval
      let memoryContext = '';
      if (advisMemories.length > 0) {
         // Filter to relevant memories based on active project or global pinned
         let relevant = advisMemories.filter(m => m.pinned);
         if (activeProjectId) {
             relevant = relevant.concat(advisMemories.filter(m => m.projectId === activeProjectId && !m.pinned));
         } else {
             // Just add a few recent ones
             relevant = relevant.concat(advisMemories.slice(-10).filter(m => !m.pinned));
         }
         
         // Deduplicate
         relevant = [...new Map(relevant.map(item => [item.id, item])).values()];
         
         if (relevant.length > 0) {
             memoryContext = '\\n\\n[ADVIS MEMORY CONTEXT]:\\n' + relevant.map(m => \`- [\${m.category}] \${m.content}\`).join('\\n');
         }
      }
`;

server = server.replace(
  /let memoryContext = globalMemories\.length > 0 \?[\s\S]*?join\('\\n'\)\}\` \: '';/,
  newContextInjection
);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Patched server.js for memory intent");

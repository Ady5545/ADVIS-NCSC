const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const newMemoryEngine = `
  async function evaluateAndStoreMemory(userMessage, activeProjectId) {
    const client = getGeminiClient();
    if (!client) return;
    
    // Quick heuristic: Skip very short non-informational messages or greetings
    const lower = userMessage.toLowerCase();
    const isGreeting = ["hello", "hi", "hey", "good morning", "good evening"].includes(lower.trim());
    
    if (lower.includes("don't remember this") || lower.includes("do not remember this")) {
        console.log("[MEMORY_EVENT] Explicitly instructed NOT to remember.");
        return; 
    }
    
    if (userMessage.split(' ').length < 3 && !lower.includes("use") && !lower.includes("prefer") && !lower.includes("project")) {
        return; // Too short to be a meaningful persistent memory
    }
    if (isGreeting) return;

    try {
      // Gather relevant existing memories to let the LLM detect duplicates/contradictions
      let existingContext = advisMemories.map(m => \`ID: \${m.id} | Project: \${m.projectId || 'GLOBAL'} | Category: \${m.category} | Content: \${m.content}\`).join('\\n');
      if (!existingContext) existingContext = "NONE";

      const prompt = \`
You are the ADVIS Intelligence Context Evaluator.
Analyze the user's message and determine if it contains information worth committing to LONG-TERM persistent memory.

Active Project ID: \${activeProjectId || 'NONE'}

DO SAVE:
- Stable preferences, workflow preferences, architecture decisions, hardware specs, recurring goals.

DO NOT SAVE (Ignore):
- Casual chatter, jokes, transient emotions ("I'm tired", "That's cool"), temporary debugging states, general questions.

If you decide to save, review the existing memories below. If the new information conflicts with or updates an existing memory, you must UPDATE the existing one instead of creating a duplicate. If it's identical to an existing memory, IGNORE it.

EXISTING MEMORIES:
\${existingContext}

Output JSON exactly like this:
{
  "action": "SAVE" | "UPDATE" | "IGNORE",
  "updateId": "The ID of the memory to update, if action is UPDATE",
  "category": "PERSONAL|PROJECT|HARDWARE|ENGINEERING|DEVELOPMENT|GOAL|PREFERENCE|WORKSPACE",
  "content": "A clear, standalone statement of fact.",
  "importance": <number 1-10>,
  "confidence": "HIGH|MEDIUM|LOW",
  "tags": ["relevant", "keywords"],
  "targetProjectName": "Name of project if explicitly mentioned, or null"
}

User Message: "\${userMessage}"
\`;
      
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { temperature: 0.1, responseMimeType: "application/json" }
      });
      
      let evalData;
      try {
        evalData = JSON.parse(response.text.trim());
      } catch (e) {
        return;
      }

      if ((evalData.action === "SAVE" || evalData.action === "UPDATE") && (evalData.confidence === "HIGH" || evalData.confidence === "MEDIUM")) {
         // Determine projectId
         let pId = activeProjectId || null;
         if (evalData.targetProjectName) {
            const proj = advisProjects.find(p => p.name.toLowerCase().includes(evalData.targetProjectName.toLowerCase()));
            if (proj) pId = proj.id;
         }

         if (evalData.action === "UPDATE" && evalData.updateId) {
             const existingIdx = advisMemories.findIndex(m => m.id === evalData.updateId);
             if (existingIdx !== -1) {
                 console.log("[MEMORY_EVENT] MEMORY_UPDATED:", evalData.updateId);
                 advisMemories[existingIdx].content = evalData.content;
                 advisMemories[existingIdx].updatedAt = Date.now();
                 advisMemories[existingIdx].importance = Math.max(advisMemories[existingIdx].importance, evalData.importance);
                 if (evalData.tags && evalData.tags.length > 0) {
                     advisMemories[existingIdx].tags = Array.from(new Set([...advisMemories[existingIdx].tags, ...evalData.tags]));
                 }
                 saveData();
                 return;
             }
         }
         
         // Create new memory
         const newMemory = {
           id: "mem_" + Date.now() + "_" + Math.floor(Math.random()*1000),
           category: evalData.category || 'PERSONAL',
           content: evalData.content,
           source: 'INFERENCE', // Automatically extracted
           createdAt: Date.now(),
           updatedAt: Date.now(),
           importance: evalData.importance || 5,
           tags: evalData.tags || [],
           projectId: pId,
           pinned: false,
           metadata: { confidence: evalData.confidence }
         };
         advisMemories.push(newMemory);
         saveData();
         console.log("[MEMORY_EVENT] MEMORY_CREATED:", newMemory.id);
      }

    } catch (e) {
      console.error("Memory extraction error:", e);
    }
  }
`;

server = server.replace(/async function evaluateAndStoreMemory\(userMessage, activeProjectId\) \{[\s\S]*?console\.error\("Memory extraction error:", e\);\n    \}\n  \}/, newMemoryEngine);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Memory evaluation logic upgraded to V2.");

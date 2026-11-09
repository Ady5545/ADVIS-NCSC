const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const newMemoryEngine = `
  async function evaluateAndStoreMemory(userMessage, activeProjectId) {
    const client = getGeminiClient();
    if (!client) return;
    
    // Quick heuristic: If it's too short and has no informational keywords, skip immediately to save API calls
    const lower = userMessage.toLowerCase();
    const isQuestion = lower.includes("?");
    const isGreeting = ["hello", "hi", "hey", "good morning", "good evening"].includes(lower.trim());
    if (userMessage.split(' ').length < 3 && !lower.includes("use") && !lower.includes("prefer") && !lower.includes("project")) {
        return; // Too short to be a meaningful persistent memory
    }
    if (isGreeting) return;

    try {
      const prompt = \`
You are the ADVIS Intelligence Context Evaluator.
Analyze the user's message and determine if it contains information worth committing to LONG-TERM persistent memory.

Active Project ID: \${activeProjectId || 'NONE'}

DO SAVE:
- Stable preferences (e.g., "I prefer dark mode", "I use React")
- Hardware specs/configurations (e.g., "HelioMotion uses an Arduino UNO", "I have an RTX 4090")
- Project architecture decisions (e.g., "We decided to use MongoDB")
- Recurring goals or constraints.

DO NOT SAVE (Ignore):
- Casual chatter, jokes, transient emotions ("I'm tired", "That's cool")
- Temporary debugging states ("I'm fixing a bug on line 42")
- General questions ("What time is it?", "How do I reverse a string?")
- Commands that just navigate the UI ("Show me the library")

If the information is worth saving, output JSON exactly like this:
{
  "action": "SAVE",
  "category": "PERSONAL|PROJECT|HARDWARE|ENGINEERING|DEVELOPMENT|GOAL|PREFERENCE|WORKSPACE",
  "content": "A clear, standalone statement of fact (e.g., 'The user is using React and Three.js for the ADVIS project.')",
  "importance": <number 1-10>,
  "confidence": "HIGH|MEDIUM|LOW",
  "tags": ["relevant", "keywords"],
  "targetProjectName": "Name of project if explicitly mentioned, or null"
}

If the information is NOT worth saving, output JSON exactly like this:
{
  "action": "IGNORE"
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
        return; // invalid JSON
      }

      if (evalData.action === "SAVE" && (evalData.confidence === "HIGH" || evalData.confidence === "MEDIUM")) {
         // Determine projectId
         let pId = activeProjectId || null;
         if (evalData.targetProjectName) {
            const proj = advisProjects.find(p => p.name.toLowerCase().includes(evalData.targetProjectName.toLowerCase()));
            if (proj) pId = proj.id;
         }

         // Duplicate / Contradiction Check (Semantic Search via exact/partial matching)
         // Check if a highly similar memory already exists.
         // A basic check: check if there's an existing memory that shares the exact same tags, or has >50% word overlap.
         const words = evalData.content.toLowerCase().split(' ').filter(w => w.length > 3);
         let duplicateIndex = -1;
         let contradictionIndex = -1;

         for (let i = 0; i < advisMemories.length; i++) {
             const existing = advisMemories[i];
             // If same project and highly similar
             if ((existing.projectId === pId || !existing.projectId || !pId) && existing.category === evalData.category) {
                 const existingWords = existing.content.toLowerCase().split(' ');
                 let overlap = 0;
                 words.forEach(w => {
                    if (existingWords.includes(w)) overlap++;
                 });
                 // High overlap -> Duplicate or Update
                 if (overlap >= Math.min(3, words.length)) {
                     duplicateIndex = i;
                     break;
                 }
                 
                 // Contradiction Check logic could be sophisticated, but for now we replace if it's the same general topic/tags
                 let tagOverlap = 0;
                 evalData.tags.forEach(t => {
                     if (existing.tags.includes(t)) tagOverlap++;
                 });
                 if (tagOverlap >= 2) {
                     contradictionIndex = i;
                     break;
                 }
             }
         }

         if (duplicateIndex !== -1) {
             // Just update the updated timestamp and maybe the content if it's longer
             advisMemories[duplicateIndex].updatedAt = Date.now();
             saveData();
         } else if (contradictionIndex !== -1) {
             // Overwrite old contradiction
             advisMemories[contradictionIndex].content = evalData.content;
             advisMemories[contradictionIndex].updatedAt = Date.now();
             advisMemories[contradictionIndex].importance = Math.max(advisMemories[contradictionIndex].importance, evalData.importance);
             saveData();
         } else {
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
         }
      }

    } catch (e) {
      console.error("Memory extraction error:", e);
    }
  }
`;

server = server.replace(/async function extractAndSaveMemories\(userMessage\) \{[\s\S]*?console\.error\("Memory extraction error:", e\);\n    \}\n  \}/, newMemoryEngine);

server = server.replace(/\/\/ extractAndSaveMemories\(message\); \/\* Disabled per Phase M1 \*\//g, "evaluateAndStoreMemory(message, activeProjectId);");
server = server.replace(/\/\/ extractAndSaveMemories\(message\); \/\* Disabled per Phase M1 \*\//g, "evaluateAndStoreMemory(message, activeProjectId);");

fs.writeFileSync('server.js', server, 'utf8');
console.log("Memory evaluation logic updated.");

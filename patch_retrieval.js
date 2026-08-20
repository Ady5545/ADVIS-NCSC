const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const retrievalLogic = `
  function getRelevantMemories(userMessage, activeProjectId) {
      if (advisMemories.length === 0) return '';
      
      const words = userMessage.toLowerCase().split(' ').filter(w => w.length > 3);
      
      // Score each memory
      const scored = advisMemories.map(m => {
          let score = 0;
          const memStr = (m.content + " " + m.tags.join(" ")).toLowerCase();
          
          // Semantic overlap
          words.forEach(w => {
              if (memStr.includes(w)) score += 2;
          });
          
          // Project relevance
          if (activeProjectId && m.projectId === activeProjectId) score += 3;
          if (!activeProjectId && !m.projectId) score += 1;
          
          // Importance
          score += (m.importance || 5) * 0.2;
          
          // Pinned
          if (m.pinned) score += 5;
          
          // Recency (boost recent memories slightly)
          const ageHours = (Date.now() - m.updatedAt) / (1000 * 60 * 60);
          if (ageHours < 24) score += 1;
          
          return { memory: m, score };
      });
      
      // Filter out low scores unless pinned or project exact match
      const relevant = scored.filter(s => s.score > 2 || s.memory.pinned || (activeProjectId && s.memory.projectId === activeProjectId));
      
      // Sort by score descending
      relevant.sort((a, b) => b.score - a.score);
      
      // Take top 10 to avoid context bloat
      const topMemories = relevant.slice(0, 10).map(s => s.memory);
      
      if (topMemories.length > 0) {
          return '\\n\\n[ADVIS MEMORY CONTEXT]:\\n' + topMemories.map(m => \`- [\${m.category}] \${m.content}\`).join('\\n');
      }
      return '';
  }
`;

// Inject function
server = server.replace(
  "  function getGeminiClient() {",
  retrievalLogic + "\\n  function getGeminiClient() {"
);

// Replace M1 retrieval logic
const oldRetrievalRegex = /\/\/ M1 Memory Context Retrieval[\s\S]*?if \(relevant\.length > 0\) \{[\s\S]*?\}\n      \}/;
server = server.replace(
  oldRetrievalRegex,
  "let memoryContext = getRelevantMemories(message, activeProjectId);"
);

// We should also replace the old fallback for globalMemories if any
server = server.replace(
  /let memoryContext = globalMemories\.length > 0[\s\S]*?join\('\\n'\)\}\` \: '';/g,
  "let memoryContext = getRelevantMemories(message, activeProjectId);"
);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Memory retrieval updated");

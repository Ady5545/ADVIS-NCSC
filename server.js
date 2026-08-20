const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const { processButlerTurn } = require("./ButlerEngine");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use('/models', express.static(path.join(process.cwd(), 'public', 'models'), { 
    maxAge: '1d', 
    etag: true, 
    lastModified: true,
    fallthrough: false
  }));


  const dataDir = path.join(process.cwd(), ".data"); // Fixed: Always use workspace root for persistence in AI Studio.
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const HISTORY_FILE = path.join(dataDir, "histories.json");
  const MEMORIES_FILE = path.join(dataDir, "memories.json");

  let chatHistories = {};
  const ADVIS_MEMORIES_FILE = path.join(dataDir, "advis_memories.json");
  const ADVIS_PROJECTS_FILE = path.join(dataDir, "advis_projects.json");
  let advisMemories = [];
  let advisProjects = [];
  let globalMemories = [];

  try {
    if (fs.existsSync(HISTORY_FILE)) {
      chatHistories = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
    if (fs.existsSync(MEMORIES_FILE)) {
      globalMemories = JSON.parse(fs.readFileSync(MEMORIES_FILE, "utf-8"));
    }
    if (fs.existsSync(ADVIS_MEMORIES_FILE)) {
      advisMemories = JSON.parse(fs.readFileSync(ADVIS_MEMORIES_FILE, "utf-8"));
    }
    if (fs.existsSync(ADVIS_PROJECTS_FILE)) {
      advisProjects = JSON.parse(fs.readFileSync(ADVIS_PROJECTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }

  function saveData() {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(chatHistories, null, 2), "utf-8");
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(globalMemories, null, 2), "utf-8");
      fs.writeFileSync(ADVIS_MEMORIES_FILE, JSON.stringify(advisMemories, null, 2), "utf-8");
      fs.writeFileSync(ADVIS_PROJECTS_FILE, JSON.stringify(advisProjects, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  }

  let aiInstance = null;

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
          return '\n\n[ADVIS MEMORY CONTEXT]:\n' + topMemories.map(m => `- [${m.category}] ${m.content}`).join('\n');
      }
      return '';
  }
  function getGeminiClient() {
    if (aiInstance) return aiInstance;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      const { GoogleGenAI } = require("@google/genai");
      aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      return aiInstance;
    } catch (err) {
      console.error("SDK Error:", err);
      return null;
    }
  }

  
  
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
      let existingContext = advisMemories.map(m => `ID: ${m.id} | Project: ${m.projectId || 'GLOBAL'} | Category: ${m.category} | Content: ${m.content}`).join('\n');
      if (!existingContext) existingContext = "NONE";

      const prompt = `
You are the ADVIS Intelligence Context Evaluator.
Analyze the user's message and determine if it contains information worth committing to LONG-TERM persistent memory.

Active Project ID: ${activeProjectId || 'NONE'}

DO SAVE:
- Stable preferences, workflow preferences, architecture decisions, hardware specs, recurring goals.

DO NOT SAVE (Ignore):
- Casual chatter, jokes, transient emotions ("I'm tired", "That's cool"), temporary debugging states, general questions.

If you decide to save, review the existing memories below. If the new information conflicts with or updates an existing memory, you must UPDATE the existing one instead of creating a duplicate. If it's identical to an existing memory, IGNORE it.

EXISTING MEMORIES:
${existingContext}

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

User Message: "${userMessage}"
`;
      
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




  // --- ADVIS MEMORY SERVICE ---
  const { v4: uuidv4 } = require('crypto');
  
  app.get("/api/memory", (req, res) => {
    const { projectId } = req.query;
    if (projectId) {
      res.json(advisMemories.filter(m => m.projectId === projectId));
    } else {
      res.json(advisMemories);
    }
  });

  app.post("/api/memory", (req, res) => {
    const { category, content, source, importance, tags, projectId, pinned, metadata } = req.body;
    const newMemory = {
      id: "mem_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      category: category || 'PERSONAL',
      content,
      source: source || 'USER',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      importance: importance || 5,
      tags: tags || [],
      projectId: projectId || null,
      pinned: pinned || false,
      metadata: metadata || {}
    };
    advisMemories.push(newMemory);
    saveData();
    res.json(newMemory);
  });

  app.put("/api/memory/:id", (req, res) => {
    const memIdx = advisMemories.findIndex(m => m.id === req.params.id);
    if (memIdx === -1) return res.status(404).json({error: "Not found"});
    const updated = { ...advisMemories[memIdx], ...req.body, updatedAt: Date.now() };
    advisMemories[memIdx] = updated;
    saveData();
    res.json(updated);
  });

  app.delete("/api/memory/:id", (req, res) => {
    advisMemories = advisMemories.filter(m => m.id !== req.params.id);
    saveData();
    res.json({ success: true });
  });

  app.get("/api/memory/search", (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const pid = req.query.projectId;
    let results = advisMemories.filter(m => m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)));
    if (pid) results = results.filter(m => m.projectId === pid);
    res.json(results);
  });

  app.get("/api/projects", (req, res) => {
    res.json(advisProjects);
  });

  app.post("/api/projects", (req, res) => {
    const { name, description, status, tags } = req.body;
    const newProject = {
      id: "proj_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      name,
      description,
      status: status || 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: tags || [],
      associatedMemories: []
    };
    advisProjects.push(newProject);
    saveData();
    res.json(newProject);
  });

  app.put("/api/projects/:id", (req, res) => {
    const pIdx = advisProjects.findIndex(p => p.id === req.params.id);
    if (pIdx === -1) return res.status(404).json({error: "Not found"});
    const updated = { ...advisProjects[pIdx], ...req.body, updatedAt: Date.now() };
    advisProjects[pIdx] = updated;
    saveData();
    res.json(updated);
  });

  app.delete("/api/projects/:id", (req, res) => {
    advisProjects = advisProjects.filter(p => p.id !== req.params.id);
    saveData();
    res.json({ success: true });
  });

  app.get("/api/history", (req, res) => {
    const deviceId = req.query.deviceId || 'default';
    res.json(chatHistories[deviceId] || []);
  });

  
  const responseCache = {};

  // AGENT KNOWLEDGE BASES
  const heliomotionKnowledge = {
    "working principle": "HelioMotion uses a dual-axis tracking system. Four Light Dependent Resistors (LDRs) detect the sun's position. The Arduino Uno reads these sensors and commands two servo motors to adjust the solar panel's tilt and pan, ensuring it always faces the sun directly.",
    "arduino uno": "The Arduino Uno serves as the central microcontroller for HelioMotion. It reads analog values from the LDRs, calculates the difference in light intensity, and sends PWM signals to the servo motors to adjust the panel.",
    "servo": "HelioMotion uses two micro servo motors for dual-axis movement: one for horizontal tracking (azimuth) and one for vertical tracking (elevation).",
    "ldr": "Four Light Dependent Resistors are arranged in a cross pattern to detect light intensity differences across four quadrants.",
    "advantages": "By continuously tracking the sun, HelioMotion generates up to 40% more power compared to a fixed solar panel. It maximizes energy capture throughout the entire day.",
    "limitations": "Current limitations include the power consumption of the servo motors themselves, and the lack of weatherproofing for outdoor deployment.",
    "circuit": "The circuit consists of an Arduino Uno, two servo motors, and four LDRs connected with 10k ohm pull-down resistors to form voltage dividers.",
    "esp32": "Future iterations of HelioMotion will integrate an ESP32 microchip to enable Wi-Fi connectivity, IoT capabilities, and remote web-based monitoring.",
    "presentation": "HelioMotion is designed as an interactive science exhibition model to demonstrate renewable energy principles and automated control systems.",
    "dual-axis": "Dual-axis tracking means the system can follow the sun from east to west (azimuth) and adjust for the sun's height in the sky (elevation) across different seasons.",
    "exhibition": "For a science exhibition, you can explain that HelioMotion actively mimics how sunflowers track the sun, increasing solar yield significantly compared to static panels."
  };

  const localIntelKnowledge = {
    "who created you": "I was created by you, Sir, as an autonomous multi-agent AI operating system.",
    "who made you": "I was developed by you, Sir, to serve as your personal A.D.V.I.S. intelligence core.",
    "what are you": "I am A.D.V.I.S. (Ady's Digital Virtual Intelligence System), a multi-agent AI operating system designed to assist you with computer control, research, and technical diagnostics.",
    "hello": "Hello, Sir. How may I assist you today?",
    "hi": "Greetings, Sir. I am online and ready.",
    "good morning": "Good morning, Sir. All systems are operating at optimal capacity.",
    "good evening": "Good evening, Sir. I am standing by for your directives.",
    "how are you": "I am operating at 100% efficiency, Sir. Thank you for asking."
  };

  // DECISION ENGINE (MASTER BRAIN)
  function masterBrainRoute(message, hasImage) {
    const lower = message.toLowerCase().trim();
    if (hasImage) return "VISION_AGENT";

    // 1. Hardcoded / System Commands
    if (lower === "clear chat" || lower === "clear console" || lower === "clear screen" || lower === "clear history") {
      return "SYSTEM_CLEAR";
    }

    // Bypass execution/host controls for 3D Holographic / Spatial Actions
    if (detectSpatialAction(message)) {
      return "CONVERSATION_AGENT";
    }

    // 2. Computer Control Agent (Execution)
    const execKeywords = ["open ", "launch ", "start ", "close ", "increase ", "decrease ", "mute ", "take a screenshot", "lock the computer", "create a new folder", "search google for "];
    if (execKeywords.some(k => lower.includes(k) || lower.startsWith(k))) {
      return "EXECUTION_AGENT";
    }

    // 3. HelioMotion Knowledge Agent
    const helioKeywords = ["heliomotion", "arduino", "solar tracker", "servo", "ldr", "dual-axis", "esp32", "science exhibition"];
    if (helioKeywords.some(k => lower.includes(k))) {
      return "HELIOMOTION_AGENT";
    }

    // 4. Planning Agent
    const planKeywords = ["timer", "alarm", "remind", "schedule"];
    if (planKeywords.some(k => lower.startsWith("set a " + k) || lower.startsWith(k))) {
      return "PLANNING_AGENT";
    }

    // 5. Diagnostics Agent
    const diagKeywords = ["battery", "system health", "status", "diagnostic", "cpu", "ram"];
    if (diagKeywords.some(k => lower.includes("what is my " + k) || lower === k || lower.includes("check " + k))) {
      return "DIAGNOSTICS_AGENT";
    }

    // 6. Local Intelligence (FAQ / Identity)
    if (Object.keys(localIntelKnowledge).some(k => lower.includes(k))) {
      return "LOCAL_INTEL_AGENT";
    }

    // 7. Memory Agent
    if (lower.includes("what did i say") || lower.includes("what are my preferences") || lower.startsWith("remember ")) {
      return "MEMORY_AGENT";
    }

    // 8. Search Agent (Time sensitive / Live info)
    const searchKeywords = ["weather", "news", "time", "stock", "score", "latest", "current", "today", "who won", "price of"];
    if (searchKeywords.some(k => lower.includes(k))) {
      return "SEARCH_AGENT";
    }

    // 9. Default Conversation (Gemini)
    return "CONVERSATION_AGENT";
  }

  function handleExecutionAgent(message) {
    const lower = message.toLowerCase();
    
    // Explicit internet search delegation
    if (lower.startsWith("search google for ")) {
      const query = message.substring(18);
      return `Initiating Google Search for "${query}", Sir.`;
    }

    // OS Controls
    if (lower.includes("increase volume") || lower.includes("volume up")) return "I have adjusted the internal media volume, Sir. Note that host system volume cannot be modified directly from this environment.";
    if (lower.includes("decrease volume") || lower.includes("volume down")) return "I have adjusted the internal media volume, Sir.";
    if (lower.includes("mute audio") || lower.includes("mute volume") || lower.includes("mute")) return "Audio muted internally, Sir.";
    if (lower.includes("decrease brightness") || lower.includes("increase brightness")) return "I cannot directly adjust your physical monitor brightness from this environment, Sir.";
    if (lower.includes("screenshot") || lower.includes("take a screen shot")) return "I do not have host file system access to save a screenshot, Sir. Please use your operating system's screenshot utility.";
    if (lower.includes("lock the computer") || lower.includes("lock computer") || lower.includes("lock screen")) return "I cannot lock your host operating system from this sandbox, Sir.";
    if (lower.includes("create a new folder") || lower.includes("new folder")) return "I cannot write directly to your host file system to create folders, Sir.";

    // App/File Launching
    if (lower.includes("chrome") || lower.includes("browser")) return "I am unable to launch external applications like Chrome from this web-based environment, Sir.";
    if (lower.includes("whatsapp")) return "I cannot launch desktop applications like WhatsApp directly from here, Sir.";
    if (lower.includes("arduino ide")) return "I cannot open the Arduino IDE directly, Sir, but I am ready to assist with any code you need.";
    if (lower.includes("vs code") || lower.includes("visual studio code")) return "I am restricted from launching external IDEs, Sir.";
    if (lower.includes("youtube")) return "I cannot open external applications, Sir, but you can navigate to YouTube in a new tab.";
    if (lower.includes("downloads")) return "I do not have access to your local Downloads folder for security reasons, Sir.";
    if (lower.includes("presentation")) return "I am unable to access local files to open your presentation, Sir.";
    if (lower.includes("calculator")) return "I cannot open the OS calculator, Sir, but I can perform any calculations you need right here.";
    if (lower.includes("terminal") || lower.includes("command prompt")) return "I cannot open a system terminal on your machine, Sir, for security reasons.";
    if (lower.includes("documents")) return "I am restricted from accessing your local Documents folder, Sir.";
    if (lower.includes("camera")) return "I am already utilizing the camera feed for my vision systems, Sir.";
    if (lower.includes("settings")) return "I do not have access to your host operating system settings, Sir.";

    return "I am currently running in a sandboxed environment and cannot execute host operating system commands, Sir.";
  }

  function handleHelioMotionAgent(message) {
    const lower = message.toLowerCase();
    let response = "";
    for (const [key, value] of Object.entries(heliomotionKnowledge)) {
      if (lower.includes(key)) {
        response += value + " ";
      }
    }
    if (!response) {
      return "HelioMotion is our dual-axis solar tracking system powered by an Arduino Uno. It utilizes LDRs to detect light and servos to adjust the panel for maximum efficiency.";
    }
    return response.trim();
  }

  function handleLocalIntelAgent(message) {
    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(localIntelKnowledge)) {
      if (lower.includes(key)) {
        return value;
      }
    }
    return "I am processing that locally, Sir.";
  }

  
  async function handleMemoryAgent(message, activeProjectId) {
    const lower = message.toLowerCase();
    
    if (lower.includes("what is my active project")) {
       if (!activeProjectId) return "You currently have no active project set, Sir.";
       const proj = advisProjects.find(p => p.id === activeProjectId);
       if (proj) return `Your current active project is ${proj.name} (${proj.description}).`;
       return "You have an active project ID, but I cannot find its details in the database, Sir.";
    }
    
    if (lower.startsWith("switch to the ")) {
       const targetName = lower.replace("switch to the ", "").replace(" project", "").trim();
       const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));
       if (proj) {
         return `PROJECT_SWITCH:${proj.id}`; // Special signal to UI to change state, handled later
       }
       return `I could not find a project matching "${targetName}", Sir. Please create it first.`;
    }

    const client = getGeminiClient();
    if (!client) return "My memory banks are currently offline due to a missing AI connection.";

    // Let's use Gemini to parse the memory intent
    const prompt = `
You are the ADVIS Memory Intent Parser.
Analyze the following user command: "${message}"

Current Active Project ID: ${activeProjectId || 'NONE'}

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
`;
    
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
         return `I have saved that to my memory banks, Sir. (Category: ${intent.category})`;
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
         return `Based on my memory databanks:\n${results.map((m, i) => `${i+1}. ${m.content}`).join('\n')}`;
      }
    } catch (e) {
      console.error(e);
      return "I encountered an error accessing my memory banks, Sir.";
    }
    return "Memory operation completed.";
  }


  const SPATIAL_REGISTRY = {
    arduino_uno: 'AVAILABLE',
    esp32: 'AVAILABLE',
    raspberry_pi: 'AVAILABLE',
    sg90_servo: 'AVAILABLE',
    stepper_motor: 'AVAILABLE',
    dc_motor: 'AVAILABLE',
    brushless_motor: 'AVAILABLE',
    breadboard: 'AVAILABLE',
    relay_module: 'AVAILABLE',
    ultrasonic_sensor: 'AVAILABLE',
    ldr_sensor: 'AVAILABLE',
    resistor_10k: 'AVAILABLE',
    solar_panel: 'AVAILABLE',
    silicon_pv_cell: 'AVAILABLE',
    solar_semiconductor: 'AVAILABLE',
    lcd_display: 'AVAILABLE',
    v12_engine: 'AVAILABLE',
    inline4_engine: 'AVAILABLE',
    v8_engine: 'AVAILABLE',
    turbocharger: 'AVAILABLE',
    differential: 'AVAILABLE',
    gearbox: 'AVAILABLE',
    suspension: 'AVAILABLE',
    brake_disc: 'AVAILABLE',
    steering_assembly: 'AVAILABLE',
    human_heart: 'AVAILABLE',
    human_brain: 'AVAILABLE',
    human_lungs: 'AVAILABLE',
    human_eye: 'AVAILABLE',
    human_skeleton: 'AVAILABLE',
    electron: 'AVAILABLE',
    hydrogen_atom: 'AVAILABLE',
    atomic_nucleus: 'AVAILABLE',
    magnetic_field: 'AVAILABLE',
    earth: 'AVAILABLE',
    moon: 'AVAILABLE',
    solar_system: 'AVAILABLE',
    iss: 'AVAILABLE',
    satellite: 'AVAILABLE',
    heliomotion: 'AVAILABLE'
  };

  const MODEL_SYNONYMS = {
    arduino_uno: ['arduino', 'uno', 'microcontroller', 'arduino board', 'arduino uno'],
    esp32: ['esp32', 'esp', 'esp 32', 'esp-32'],
    raspberry_pi: ['raspberry pi', 'rpi', 'raspberry', 'pi 4'],
    sg90_servo: ['servo motor', 'servo', 'sg90', 'micro servo'],
    stepper_motor: ['stepper motor', 'stepper', 'nema 17', 'nema17'],
    dc_motor: ['dc motor', 'direct current motor', 'brushed motor'],
    brushless_motor: ['brushless motor', 'bldc', 'brushless', 'bldc motor'],
    breadboard: ['breadboard', 'solderless breadboard', 'prototyping board'],
    relay_module: ['relay', 'relay module', '5v relay'],
    ultrasonic_sensor: ['ultrasonic', 'ultrasonic sensor', 'hc-sr04', 'hcsr04', 'distance sensor'],
    ldr_sensor: ['ldr', 'ldr sensor', 'photoresistor', 'light sensor'],
    resistor_10k: ['resistor', '10k resistor', 'pull down resistor'],
    solar_panel: ['solar panel', 'photovoltaic panel', 'pv panel'],
    silicon_pv_cell: ['silicon cell', 'silicon photovoltaic cell', 'photovoltaic cell', 'pv cell'],
    solar_semiconductor: ['solar semiconductor', 'semiconductor structure', 'silicon semiconductor', 'p-n junction', 'pn junction'],
    lcd_display: ['lcd', 'lcd display', '16x2 lcd', 'character lcd'],
    v12_engine: ['v12 engine', 'v12', 'v12 model', 'engine model', 'engine'],
    inline4_engine: ['inline 4', 'inline-4', 'i4 engine', '4 cylinder'],
    v8_engine: ['v8 engine', 'v8', 'v8 combustion'],
    turbocharger: ['turbocharger', 'turbo', 'twin scroll turbo'],
    differential: ['differential', 'lsd', 'limited slip differential'],
    gearbox: ['gearbox', 'transmission', '6 speed transmission'],
    suspension: ['suspension', 'macpherson', 'strut suspension', 'coil spring'],
    brake_disc: ['brake disc', 'brake', 'carbon brake', 'rotor'],
    steering_assembly: ['steering', 'rack and pinion', 'steering rack'],
    human_heart: ['human heart', 'heart', 'cardiac'],
    human_brain: ['human brain', 'brain', 'cerebrum'],
    human_lungs: ['human lungs', 'lungs', 'respiratory'],
    human_eye: ['human eye', 'eye', 'eyeball'],
    human_skeleton: ['human skeleton', 'skeleton', 'bones', 'skull'],
    electron: ['electron', 'electron cloud', 'orbital cloud'],
    hydrogen_atom: ['hydrogen', 'hydrogen atom', 'bohr atom'],
    atomic_nucleus: ['nucleus', 'atomic nucleus', 'carbon-12', 'carbon 12'],
    magnetic_field: ['magnetic field', 'magnet', 'dipole', 'flux lines'],
    earth: ['earth', 'planet earth', 'globe'],
    moon: ['moon', 'lunar'],
    solar_system: ['solar system', 'planets'],
    iss: ['iss', 'space station', 'international space station'],
    satellite: ['satellite', 'communication satellite', 'comsat'],
    heliomotion: ['heliomotion', 'solar tracker']
  };

  const SCIENTIFIC_ENTITIES = {
    "glucose": { formula: "C6H12O6", name: "Glucose" },
    "c6h12o6": { formula: "C6H12O6", name: "Glucose" },
    "d-glucose": { formula: "C6H12O6", name: "Glucose" },
    "sugar": { formula: "C6H12O6", name: "Glucose" },
    
    "water": { formula: "H2O", name: "Water" },
    "h2o": { formula: "H2O", name: "Water" },
    "dihydrogen monoxide": { formula: "H2O", name: "Water" },
    
    "boron trifluoride": { formula: "BF3", name: "Boron Trifluoride" },
    "bf3": { formula: "BF3", name: "Boron Trifluoride" },
    
    "benzene": { formula: "C6H6", name: "Benzene" },
    "c6h6": { formula: "C6H6", name: "Benzene" },
    "benzol": { formula: "C6H6", name: "Benzene" },
    
    "ethanol": { formula: "C2H5OH", name: "Ethanol" },
    "c2h5oh": { formula: "C2H5OH", name: "Ethanol" },
    "ethyl alcohol": { formula: "C2H5OH", name: "Ethanol" },
    "alcohol": { formula: "C2H5OH", name: "Ethanol" },
    "c2": { formula: "C2H5OH", name: "Ethanol" },
    "c2)": { formula: "C2H5OH", name: "Ethanol" },
    
    "methane": { formula: "CH4", name: "Methane" },
    "ch4": { formula: "CH4", name: "Methane" },
    "natural gas": { formula: "CH4", name: "Methane" },
    
    "ammonia": { formula: "NH3", name: "Ammonia" },
    "nh3": { formula: "NH3", name: "Ammonia" },
    
    "carbon dioxide": { formula: "CO2", name: "Carbon Dioxide" },
    "co2": { formula: "CO2", name: "Carbon Dioxide" },
    
    "sodium chloride": { formula: "NaCl", name: "Sodium Chloride" },
    "nacl": { formula: "NaCl", name: "Sodium Chloride" },
    "table salt": { formula: "NaCl", name: "Sodium Chloride" },
    "salt": { formula: "NaCl", name: "Sodium Chloride" },
    
    "oxygen": { formula: "O2", name: "Oxygen Gas" },
    "oxygen gas": { formula: "O2", name: "Oxygen Gas" },
    "o2": { formula: "O2", name: "Oxygen Gas" },
    
    "nitrogen": { formula: "N2", name: "Nitrogen Gas" },
    "nitrogen gas": { formula: "N2", name: "Nitrogen Gas" },
    "n2": { formula: "N2", name: "Nitrogen Gas" }
  };

  function resolveScientificEntityServer(msg) {
    if (!msg) return null;
    let str = msg.trim().toLowerCase();
    str = str.replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3')
             .replace(/₄/g, '4').replace(/₅/g, '5').replace(/₆/g, '6').replace(/₇/g, '7')
             .replace(/₈/g, '8').replace(/₉/g, '9');
    str = str.replace(/[\)\}\]\s]+$/, '');

    for (const [key, obj] of Object.entries(SCIENTIFIC_ENTITIES)) {
      const regex = new RegExp(`\\b${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(str) || str === key) {
        return obj;
      }
    }
    return null;
  }

  function detectSpatialAction(message) {
    const lower = message.toLowerCase().trim();
    if (lower === "stop" || lower === "close" || lower === "hide" || lower === "remove" || lower === "clear" || lower === "stop visualization" || lower === "hide molecule" || lower === "close molecule" || lower === "remove molecule" || lower === "clear visualization" || lower === "remove this" || lower.includes("close the model") || lower.includes("hide the model") || lower.includes("remove the model") || lower.includes("close model") || lower.includes("hide model") || lower.includes("remove model") || lower.includes("clear spatial") || lower.includes("unload model") || lower.includes("close visualization") || lower.includes("hide visualization")) {
      return { type: "CLOSE" };
    }
    
    if (lower.includes("showcase mode") || lower.includes("showcase view") || lower.includes("showcase") || lower.includes("cinematic view") || lower.includes("auto rotate") || lower.includes("cinematic mode")) {
      return { type: "SHOWCASE" };
    }
    if (lower.includes("inspection mode") || lower.includes("inspect mode") || lower.includes("manual control") || lower.includes("stop rotation") || lower.includes("stop auto") || lower.includes("interactive mode")) {
      return { type: "INSPECTION" };
    }
    if (lower.includes("demo mode") || lower.includes("demonstration mode") || lower.includes("guided tour") || lower.includes("guided demo")) {
      return { type: "DEMO" };
    }

    if (lower.includes("explode heliomotion") || lower.includes("separate the components") || lower.includes("separate components") || lower.includes("exploded view") || lower.includes("explode the model") || lower.includes("separate the parts") || lower.includes("separate parts") || lower.includes("exploded visualization")) {
      return { type: "EXPLODE", value: true };
    }
    if (lower.includes("assemble heliomotion") || lower.includes("assemble the components") || lower.includes("assemble components") || lower.includes("re-assemble") || lower.includes("normal view") || lower.includes("assemble the parts") || lower.includes("assemble parts") || lower.includes("collapse view") || lower.includes("collapse parts")) {
      return { type: "EXPLODE", value: false };
    }
    if (lower.includes("label heliomotion") || lower.includes("show labels") || lower.includes("enable labels") || lower.startsWith("label")) {
      return { type: "LABEL", value: true };
    }
    if (lower.includes("hide labels") || lower.includes("remove labels")) {
      return { type: "LABEL", value: false };
    }
    if (lower.includes("explain this") || lower.includes("what is this part") || lower.includes("tell me about this") || lower.includes("explain the selected") || lower.includes("explain component")) {
      return { type: "EXPLAIN" };
    }

    if (lower.includes("move component") || lower.includes("shift component")) {
      let axis = 'z';
      if (lower.includes(" x ") || lower.includes("left") || lower.includes("right")) axis = 'x';
      if (lower.includes(" y ") || lower.includes("up") || lower.includes("down")) axis = 'y';
      if (lower.includes("z") || lower.includes("forward") || lower.includes("backward")) axis = 'z';
      
      let delta = 0.2;
      const numMatch = message.match(/[-+]?[0-9]*\.?[0-9]+/);
      if (numMatch) delta = parseFloat(numMatch[0]);
      if (lower.includes("left") || lower.includes("down") || lower.includes("back")) delta = -Math.abs(delta);
      else if (lower.includes("right") || lower.includes("up") || lower.includes("forward")) delta = Math.abs(delta);

      return { type: "ENGINEERING_TRANSFORM", actionType: "MOVE", axis, delta };
    }
    if (lower.includes("rotate component")) {
      let axis = 'y';
      if (lower.includes(" x ")) axis = 'x';
      if (lower.includes(" y ")) axis = 'y';
      if (lower.includes(" z ")) axis = 'z';

      let angle = 0.5;
      const numMatch = message.match(/[-+]?[0-9]*\.?[0-9]+/);
      if (numMatch) {
        let val = parseFloat(numMatch[0]);
        if (lower.includes("deg")) val = val * (Math.PI / 180);
        angle = val;
      }
      return { type: "ENGINEERING_TRANSFORM", actionType: "ROTATE", axis, angle };
    }
    if (lower.includes("scale component") || lower.includes("resize component")) {
      let factor = 1.2;
      const numMatch = message.match(/[-+]?[0-9]*\.?[0-9]+/);
      if (numMatch) factor = parseFloat(numMatch[0]);
      return { type: "ENGINEERING_TRANSFORM", actionType: "SCALE", factor };
    }
    if (lower.includes("reset component") || lower.includes("reset transform")) {
      return { type: "ENGINEERING_TRANSFORM", actionType: "RESET" };
    }

    const isDisplay = lower.includes("show") || lower.includes("display") || lower.includes("project") || lower.includes("hologram") || lower.includes("load") || lower.includes("and") || lower.includes(",");
    const isPresent = lower.includes("present") || lower.includes("demonstrate");

    if (isDisplay || isPresent || Object.values(MODEL_SYNONYMS).some(syns => syns.some(s => lower.includes(s)))) {
      const foundIds = [];
      for (const [id, synonyms] of Object.entries(MODEL_SYNONYMS)) {
        if (synonyms.some(s => lower.includes(s))) {
          if (!foundIds.includes(id)) {
            foundIds.push(id);
          }
        }
      }
      if (foundIds.length > 0) {
        const mode = (lower.includes("showcase mode") || lower.includes("showcase")) ? "SHOWCASE" : (isPresent ? "DEMO" : undefined);
        return {
          type: isPresent ? "PRESENT" : "DISPLAY",
          objectIds: foundIds.length > 1 ? foundIds : undefined,
          objectId: foundIds.length === 1 ? foundIds[0] : undefined,
          mode: mode
        };
      }
    }
    return null;
  }

  app.post(["/api/advis", "/api/jarvis"], async (req, res) => {
    const { 
      message, 
      mode, 
      deviceId = 'default', 
      image, 
      currentSpatialObject, 
      selectedComponentId, 
      hoveredComponentId, 
      activeProjectId,
      butlerContext: clientButlerContext
    } = req.body;

    if (!message) return res.status(400).json({ error: "Protocol violation: Message payload is empty." });

    if (!chatHistories[deviceId]) {
      chatHistories[deviceId] = [];
    }

    const butlerContext = clientButlerContext || {
      activeProjectId,
      activeWorkspace: currentSpatialObject ? 'SPATIAL' : 'HUD',
      activeSpatialObject: currentSpatialObject,
      selectedComponentId,
      hoveredComponentId,
      recentActions: []
    };

    try {
      const result = await processButlerTurn({
        message,
        mode,
        deviceId,
        image,
        butlerContext,
        advisMemories,
        advisProjects,
        chatHistories,
        saveData,
        evaluateAndStoreMemory,
        getGeminiClient,
        SPATIAL_REGISTRY,
        MODEL_SYNONYMS,
        SCIENTIFIC_ENTITIES,
        detectSpatialAction,
        resolveScientificEntityServer,
        handleMemoryAgent,
        handleExecutionAgent,
        handleHelioMotionAgent,
        handleLocalIntelAgent,
        masterBrainRoute
      });

      return res.json(result);
    } catch (err) {
      console.error("[Butler API] Core Exception:", err);
      return res.json({
        reply: "My core systems experienced an error processing that request.",
        mode: mode || "normal",
        status: "error"
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("===================================================");
    console.log("STARK INDUSTRIES A.D.V.I.S. HUD SERVER ONLINE");
    console.log("Holographic frequencies broadcasted on Port " + PORT);
    console.log("===================================================");
  });
}

startServer();

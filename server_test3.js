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
        
      });
      return aiInstance;
    } catch (err) {
      console.error("SDK Error:", err);
      return null;
    }
  }

  async function evaluateAndStoreMemory(userMessage, activeProjectId) {
    // Persistent personal memory extraction is disconnected in the Educational Platform (Phase 1).
    return;
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
    "who created you": "I was developed as A.D.V.I.S. (Aadyant's Digital Virtual Intelligence System) for the NCSC / INSPIRE-MANAK scientific exploration and STEM learning platform.",
    "who made you": "I was developed as A.D.V.I.S., an interactive AI-powered scientific visualization and STEM learning assistant for NCSC / INSPIRE-MANAK.",
    "what are you": "I am A.D.V.I.S. (Aadyant's Digital Virtual Intelligence System), an interactive educational scientific assistant designed for STEM learning, 3D molecular visualization, engineering assembly inspection, and laboratory demonstrations.",
    "hello": "Hello! How can I help you explore scientific or engineering concepts today?",
    "hi": "Greetings! I am online and ready to assist with scientific demonstrations and 3D visualizations.",
    "good morning": "Good morning. All educational simulation and visualization systems are online.",
    "good evening": "Good evening. Ready to assist with science lessons and 3D model exploration.",
    "how are you": "All systems are operating nominally. How can I assist with your science exploration?"
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
    if (Object.keys(localIntelKnowledge).some(k => new RegExp(`\\b${k}\\b`, 'i').test(lower))) {
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
      return `Searching Google for "${query}".`;
    }

    // OS Controls
    if (lower.includes("increase volume") || lower.includes("volume up")) return "Adjusted internal audio volume. Note that host system volume cannot be modified directly from this environment.";
    if (lower.includes("decrease volume") || lower.includes("volume down")) return "Adjusted internal audio volume.";
    if (lower.includes("mute audio") || lower.includes("mute volume") || lower.includes("mute")) return "Audio muted internally.";
    if (lower.includes("decrease brightness") || lower.includes("increase brightness")) return "Physical monitor brightness cannot be adjusted directly from this browser environment.";
    if (lower.includes("screenshot") || lower.includes("take a screen shot")) return "Direct host file system screenshot saving is not supported from this web environment. Please use your operating system's screenshot shortcut.";
    if (lower.includes("lock the computer") || lower.includes("lock computer") || lower.includes("lock screen")) return "Cannot lock host operating system from this sandbox environment.";
    if (lower.includes("create a new folder") || lower.includes("new folder")) return "Cannot write directly to host file system to create directories.";

    // App/File Launching
    if (lower.includes("chrome") || lower.includes("browser")) return "External applications cannot be launched directly from this web environment.";
    if (lower.includes("whatsapp")) return "Desktop applications cannot be launched directly from here.";
    if (lower.includes("arduino ide")) return "The standalone Arduino IDE cannot be launched directly from here, but I can assist with any Arduino code or circuit explanations.";
    if (lower.includes("vs code") || lower.includes("visual studio code")) return "Cannot launch external IDEs from this web environment.";
    if (lower.includes("youtube")) return "External web applications cannot be opened directly from this frame.";
    if (lower.includes("downloads")) return "Access to local Downloads folder is restricted in this sandboxed environment.";
    if (lower.includes("presentation")) return "Access to local presentation files is restricted.";
    if (lower.includes("calculator")) return "External OS calculator cannot be launched, but I can calculate values and formulas directly.";
    if (lower.includes("terminal") || lower.includes("command prompt")) return "System terminal access is restricted for security.";
    if (lower.includes("documents")) return "Access to local Documents folder is restricted.";
    if (lower.includes("camera")) return "Camera feed is currently active for vision and gesture input.";
    if (lower.includes("settings")) return "Host operating system settings cannot be accessed from this sandbox.";

    return "Currently running in a sandboxed web environment and cannot execute host operating system commands.";
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
      return "HelioMotion is a dual-axis solar tracking system powered by an Arduino Uno. It utilizes LDRs to detect sunlight angles and servos to align the solar panel perpendicular to incoming light for maximum energy efficiency.";
    }
    return response.trim();
  }

  function handleLocalIntelAgent(message) {
    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(localIntelKnowledge)) {
      if (new RegExp(`\\b${key}\\b`, 'i').test(lower)) {
        return value;
      }
    }
    return "Processing request locally.";
  }

  
  async function handleMemoryAgent(message, activeProjectId) {
    const lower = message.toLowerCase();
    
    if (lower.includes("what is my active project")) {
       if (!activeProjectId) return "There is currently no active project selected.";
       const proj = advisProjects.find(p => p.id === activeProjectId);
       if (proj) return `Current active project is ${proj.name} (${proj.description}).`;
       return "An active project ID is set, but its details were not found in the database.";
    }
    
    if (lower.startsWith("switch to the ")) {
       const targetName = lower.replace("switch to the ", "").replace(" project", "").trim();
       const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));
       if (proj) {
         return `PROJECT_SWITCH:${proj.id}`; // Special signal to UI to change state, handled later
       }
       return `Could not find a project matching "${targetName}".`;
    }

    return "Persistent personal memory is disconnected in this educational platform.";
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

  function detectSpatialAction(message, butlerContext) {
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
    if (lower.includes("demo mode") || lower.includes("demonstration mode") || lower.includes("guided tour") || lower.includes("guided demo") || lower.includes("demonstrate the power stroke") || lower.includes("demonstrate how it works") || lower === "demonstrate" || lower.includes("demonstrate the engine")) {
      return { type: "DEMO" };
    }

    if (lower === "explode" || lower === "explode it" || lower.includes("explode heliomotion") || lower.includes("separate the components") || lower.includes("separate components") || lower.includes("exploded view") || lower.includes("explode the model") || lower.includes("explode the engine") || lower.includes("separate the parts") || lower.includes("separate parts") || lower.includes("exploded visualization")) {
      return { type: "EXPLODE", value: true };
    }
    if (lower === "assemble" || lower === "assemble it" || lower.includes("assemble heliomotion") || lower.includes("assemble the components") || lower.includes("assemble components") || lower.includes("re-assemble") || lower.includes("normal view") || lower.includes("assemble the parts") || lower.includes("assemble parts") || lower.includes("collapse view") || lower.includes("collapse parts") || lower.includes("assemble engine")) {
      return { type: "EXPLODE", value: false };
    }

    // Kinematics Controls
    if (lower.includes("speed to") || lower.includes("set speed") || lower.match(/speed\s+(0\.\d+|[1-4])x?/)) {
      let speed = 1.0;
      if (lower.includes("0.25")) speed = 0.25;
      else if (lower.includes("0.5")) speed = 0.5;
      else if (lower.includes("2x") || lower.includes("2.0") || lower.includes(" 2")) speed = 2.0;
      else if (lower.includes("1x") || lower.includes("1.0") || lower.includes(" 1")) speed = 1.0;
      return { type: "KINEMATICS", speed };
    }
    if (lower === "pause" || lower === "pause animation" || lower === "pause engine" || lower === "stop engine" || lower === "pause kinematics" || lower === "pause it") {
      return { type: "KINEMATICS", playing: false };
    }
    if (lower === "play" || lower === "resume" || lower === "play animation" || lower === "start engine" || lower === "resume engine" || lower === "play kinematics" || lower === "play it") {
      return { type: "KINEMATICS", playing: true };
    }

    // Component Isolation
    if (lower === "isolate" || lower === "isolate it" || lower === "isolate this" || lower === "isolate component" || lower === "isolate part" || lower.startsWith("isolate ")) {
      let compId = undefined;
      if ((lower === "isolate it" || lower === "isolate this" || lower === "isolate") && butlerContext && butlerContext.selectedComponentId) {
        compId = butlerContext.selectedComponentId;
      }
      if (lower.includes("piston")) compId = "piston_left_bank";
      else if (lower.includes("crankshaft") || lower.includes("crank")) compId = "crankshaft";
      else if (lower.includes("rod") || lower.includes("connecting")) compId = "connecting_rods";
      else if (lower.includes("block")) compId = "engine_block";
      else if (lower.includes("valve") || lower.includes("camshaft")) compId = "valvetrain";
      else if (lower.includes("intake") || lower.includes("plenum")) compId = "intake_plenum";
      else if (lower.includes("exhaust") || lower.includes("header")) compId = "exhaust_manifold";
      else if (lower.includes("cooling") || lower.includes("water pump")) compId = "cooling_system";
      else if (lower.includes("lubrication") || lower.includes("oil pan")) compId = "lubrication_system";
      return { type: "ISOLATE", componentId: compId, value: true };
    }
    if (lower === "exit isolation" || lower === "un-isolate" || lower === "show all parts" || lower === "unisolate" || lower === "stop isolation" || lower === "cancel isolation") {
      return { type: "ISOLATE", value: false };
    }

    // Engineering Component Selection
    if (lower.startsWith("select ") || lower.includes("select the ")) {
      if (lower.includes("piston")) {
        const isSecond = lower.includes("second") || lower.includes("2nd") || lower.includes("right") || lower.includes("bank 2");
        return {
          type: "SELECT_COMPONENT",
          componentId: isSecond ? "piston_right_bank" : "piston_left_bank",
          componentName: isSecond ? "Bank 2 Forged Pistons" : "Bank 1 Forged Pistons"
        };
      }
      if (lower.includes("crankshaft") || lower.includes("crank")) {
        return { type: "SELECT_COMPONENT", componentId: "crankshaft", componentName: "7-Bearing Forged Steel Crankshaft" };
      }
      if (lower.includes("connecting rod") || lower.includes("rods") || lower.includes("rod")) {
        return { type: "SELECT_COMPONENT", componentId: "connecting_rods", componentName: "H-Beam Titanium Connecting Rods" };
      }
      if (lower.includes("engine block") || lower.includes("block") || lower.includes("cylinder block")) {
        return { type: "SELECT_COMPONENT", componentId: "engine_block", componentName: "60° V12 Cast Aluminum Block" };
      }
      if (lower.includes("valvetrain") || lower.includes("camshaft") || lower.includes("valve")) {
        return { type: "SELECT_COMPONENT", componentId: "valvetrain", componentName: "DOHC 48-Valve Valvetrain & Camshafts" };
      }
      if (lower.includes("intake") || lower.includes("plenum") || lower.includes("manifold")) {
        return { type: "SELECT_COMPONENT", componentId: "intake_plenum", componentName: "Dual Plenum Intake Manifold" };
      }
      if (lower.includes("exhaust") || lower.includes("header")) {
        return { type: "SELECT_COMPONENT", componentId: "exhaust_manifold", componentName: "Equal-Length Exhaust Headers" };
      }
      if (lower.includes("cooling") || lower.includes("water pump")) {
        return { type: "SELECT_COMPONENT", componentId: "cooling_system", componentName: "Integrated Water Jackets & Coolant Pump" };
      }
      if (lower.includes("lubrication") || lower.includes("oil pan")) {
        return { type: "SELECT_COMPONENT", componentId: "lubrication_system", componentName: "Dry-Sump Oil Pan & Scavenge Pump" };
      }
      if (lower.includes("gear") || lower.includes("servo gear")) {
        return { type: "SELECT_COMPONENT", componentId: "servo_gears", componentName: "Nylon Reduction Gear Set" };
      }
      if (lower.includes("potentiometer") || lower.includes("servo pot")) {
        return { type: "SELECT_COMPONENT", componentId: "servo_pot", componentName: "Position Potentiometer" };
      }
      if (lower.includes("servo horn") || lower.includes("servo arm")) {
        return { type: "SELECT_COMPONENT", componentId: "servo_arm", componentName: "Output Servo Horn Arm" };
      }
      if (lower.includes("servo case") || lower.includes("servo shell")) {
        return { type: "SELECT_COMPONENT", componentId: "servo_case", componentName: "Blue ABS Outer Shell" };
      }
      if (lower.includes("dc motor") || lower.includes("servo core")) {
        return { type: "SELECT_COMPONENT", componentId: "servo_motor_core", componentName: "Internal Coreless DC Motor" };
      }
    }

    if (lower.includes("label heliomotion") || lower.includes("show labels") || lower.includes("enable labels") || lower.startsWith("label")) {
      return { type: "LABEL", value: true };
    }
    if (lower.includes("hide labels") || lower.includes("remove labels")) {
      return { type: "LABEL", value: false };
    }
    if (lower.includes("compare")) {
      return { type: "COMPARE" };
    }
    if (lower.includes("diagnose") || lower.includes("check diagnostics") || lower.includes("diagnostic")) {
      return { type: "DIAGNOSE" };
    }

    if (lower.includes("explain this") || lower.includes("what is this part") || lower.includes("tell me about this") || lower.includes("explain the selected") || lower.includes("explain component")) {
      return { type: "EXPLAIN" };
    }

    if (lower.includes("trace") || lower.includes("power path") || lower.includes("how does this work") || lower.includes("what drives this") || lower.includes("what does this connect to")) {
      let functionKey = null;
      if (lower.includes("combustion") || lower.includes("fire") || lower.includes("bang")) functionKey = "combustion";
      else if (lower.includes("cooling") || lower.includes("water") || lower.includes("coolant")) functionKey = "cooling";
      else if (lower.includes("crank") || lower.includes("power") || lower.includes("drive")) functionKey = "crankshaft";
      else if (lower.includes("fuel") || lower.includes("intake") || lower.includes("air")) functionKey = "fuel";
      else if (lower.includes("gear") || lower.includes("transmission")) functionKey = "gears";
      else if (lower.includes("feedback") || lower.includes("sensor")) functionKey = "feedback";
      
      return { type: "TRACE_FUNCTION", functionKey: functionKey || "power" };
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


  
  app.post("/api/generate-structure", async (req, res) => {
    try {
      const { objectQuery } = req.body;
      if (!objectQuery) return res.status(400).json({ error: "Missing objectQuery" });

      const ai = getGeminiClient();
      if (!ai) return res.status(500).json({ error: "Gemini client not initialized" });

      const { Type } = require("@google/genai");
      const schema = {
        type: Type.OBJECT,
        properties: {
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                geometry: { 
                  type: Type.STRING,
                },
                position: { type: Type.STRING },
                size: { type: Type.STRING },
                rotation: { type: Type.STRING },
                color: { type: Type.STRING },
                materialType: { 
                  type: Type.STRING,
                }
              }
            }
          }
        }
      };

      const prompt = `As an expert mechanical engineer and 3D technical artist, decompose the physical object "${objectQuery}" into a hierarchical structural assembly of 3D primitive geometric components.
Ensure:
1. Generate exactly 5 to 10 components. Do not exceed 10.
2. Realistic proportions and correct spatial relationships.
3. Components must physically connect (no floating parts).
4. The model must be fully assembled at the origin.
5. Use realistic material types and colors.
6. The size should be relative to 1.0 = 1 meter.

Format: position, size, and rotation MUST be a string like "0,1.2,0".
Allowed geometry values: box, roundedBox, cylinder, sphere, tube, torus, cone, spokeWheel.
Allowed materialType values: PBR_MATTE, PBR_METALLIC, PBR_GLASS, THERMAL_HEATMAP, XRAY_GLASS.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-pro',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1
        }
      });
      
      const result = JSON.parse(response.text);
      res.json(result);
    } catch (err) {
      console.error("Structure Gen Error:", err.message, err.stack);
      res.status(500).json({ error: "Failed to generate structure" });
    }
  });

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

  app.listen(3003, "0.0.0.0", () => {
    console.log("===================================================");
    console.log("STARK INDUSTRIES A.D.V.I.S. HUD SERVER ONLINE");
    console.log("Holographic frequencies broadcasted on Port " + PORT);
    console.log("===================================================");
  });
}

startServer();

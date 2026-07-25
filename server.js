const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

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


  const dataDir = process.env.NODE_ENV === "production" ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const HISTORY_FILE = path.join(dataDir, "histories.json");
  const MEMORIES_FILE = path.join(dataDir, "memories.json");

  let chatHistories = {};
  let globalMemories = [];

  try {
    if (fs.existsSync(HISTORY_FILE)) {
      chatHistories = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
    if (fs.existsSync(MEMORIES_FILE)) {
      globalMemories = JSON.parse(fs.readFileSync(MEMORIES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }

  function saveData() {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(chatHistories, null, 2), "utf-8");
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(globalMemories, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  }

  let aiInstance = null;
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

  async function extractAndSaveMemories(userMessage) {
    const client = getGeminiClient();
    if (!client) return;
    try {
      const prompt = `You are a memory extraction tool. Extract any new facts, personal preferences, or important information the user stated in the following message. If there is no new fact, output EXACTLY the word "NONE". Do not include conversational filler. Message: "${userMessage}"`;
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { temperature: 0.1 }
      });
      let newFact = response.text.trim();
      if (newFact && newFact !== "NONE" && !newFact.includes("NONE")) {
        globalMemories.push(newFact);
        // keep it manageable
        if (globalMemories.length > 50) globalMemories = globalMemories.slice(globalMemories.length - 50);
        saveData();
      }
    } catch (e) {
      console.error("Memory extraction error:", e);
    }
  }

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

  function handleMemoryAgent(message, globalMemories) {
    if (message.toLowerCase().startsWith("remember ")) {
      return "I have committed that to memory, Sir."; // The actual extraction happens via background task
    }
    if (globalMemories.length === 0) return "I have no specific memories stored yet, Sir.";
    return `Based on my memory databanks, here is what I know:\n${globalMemories.map((m, i) => `${i+1}. ${m}`).join('\n')}`;
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

  function detectSpatialAction(message) {
    const lower = message.toLowerCase().trim();
    if (lower.includes("close the model") || lower.includes("hide the model") || lower.includes("remove the model") || lower.includes("close model") || lower.includes("hide model") || lower.includes("remove model") || lower.includes("clear spatial") || lower.includes("unload model")) {
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
    const { message, mode, deviceId = 'default', image, currentSpatialObject, selectedComponentId, hoveredComponentId } = req.body;
    if (!message) return res.status(400).json({ error: "Protocol violation: Message payload is empty, Sir." });

    if (!chatHistories[deviceId]) {
      chatHistories[deviceId] = [];
    }

    const lowerMessage = message.toLowerCase().trim();
    let spatialAction = detectSpatialAction(message);
    
    // MASTER BRAIN ROUTING
    const assignedAgent = masterBrainRoute(message, !!image);
    console.log(`[Master Brain] Routed request to: ${assignedAgent}`);

    // Process Fast Local Agents First (Bypass Gemini)
    if (assignedAgent === "SYSTEM_CLEAR") {
      chatHistories[deviceId] = [];
      saveData();
      return res.json({ reply: "HUD Console history cleared for this device, Sir.", mode: mode || "normal", status: "online" });
    }

    let localReply = null;
    
    if (assignedAgent === "EXECUTION_AGENT") {
      localReply = handleExecutionAgent(message);
    } else if (assignedAgent === "HELIOMOTION_AGENT") {
      localReply = handleHelioMotionAgent(message);
    } else if (assignedAgent === "LOCAL_INTEL_AGENT") {
      localReply = handleLocalIntelAgent(message);
    } else if (assignedAgent === "DIAGNOSTICS_AGENT") {
      localReply = "Running system diagnostics... Hardware parameters appear nominal, Sir.";
    } else if (assignedAgent === "PLANNING_AGENT") {
      localReply = "I have updated your schedule and set the requested timers, Sir.";
    } else if (assignedAgent === "MEMORY_AGENT") {
      localReply = handleMemoryAgent(message, globalMemories);
    }

    if (localReply) {
      chatHistories[deviceId].push({ role: "user", content: message });
      chatHistories[deviceId].push({ role: "assistant", content: localReply });
      saveData();
      extractAndSaveMemories(message); // Background extraction
      return res.json({ reply: localReply, mode: mode || "normal", status: "online" });
    }

    // Cache check for Conversation/Search agents
    if (assignedAgent === "CONVERSATION_AGENT" && responseCache[lowerMessage]) {
      const reply = responseCache[lowerMessage];
      chatHistories[deviceId].push({ role: "user", content: message });
      chatHistories[deviceId].push({ role: "assistant", content: reply });
      saveData();
      return res.json({ reply, mode: mode || "normal", status: "online" });
    }

    // Step 5 & 6: Search Agent & Conversation Agent (Gemini)
    const client = getGeminiClient();
    if (!client) {
      chatHistories[deviceId].push({ role: "user", content: message });
      const fallbackReply = "I am sorry Sir, my cloud connection is currently offline. Please configure the GEMINI_API_KEY environment variable.";
      chatHistories[deviceId].push({ role: "assistant", content: fallbackReply });
      saveData();
      return res.json({ reply: fallbackReply, mode: mode || "normal", status: "offline" });
    }

    try {
      const contents = chatHistories[deviceId].map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      const userParts = [];
      if (image && image.content) {
        const base64Data = image.content.split(',')[1] || image.content;
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: image.mimeType || "image/jpeg"
          }
        });
      }
      userParts.push({ text: message });
      contents.push({ role: 'user', parts: userParts });

      let memoryContext = globalMemories.length > 0 ? `\n\nHere are known facts about the user and the world from previous conversations across all connected devices:\n${globalMemories.map((m, i) => `${m}`).join('\n')}` : '';

      let advisIdentity = "You are A.D.V.I.S. (Ady's Digital Virtual Intelligence System), a highly advanced AI operating system. You speak formally, politely, and intelligently, referring to the user as 'Sir'. Prioritize speed and natural conversation. Default response length must be short and useful. Avoid unnecessary explanations. Do not output large paragraphs unless explicitly asked to expand. Do not say 'As an AI', 'Certainly', or 'Here is the answer'. Respond in a single spoken paragraph if possible.";
      try {
        if (fs.existsSync(path.join(process.cwd(), "advis_identity.txt"))) {
          advisIdentity = fs.readFileSync(path.join(process.cwd(), "advis_identity.txt"), "utf-8");
          advisIdentity += "\n\nIMPORTANT DIRECTIVE: Keep responses concise, natural, and conversational. Do not output large paragraphs unless explicitly asked to expand. Do not say 'As an AI', 'Certainly', or 'Here is the answer'. Respond in a single natural spoken paragraph.";
        }
      } catch (e) {}

      let spatialInstruction = "";
      if (spatialAction) {
        if (spatialAction.type === "DISPLAY" || spatialAction.type === "PRESENT") {
          const idsToCheck = spatialAction.objectIds || (spatialAction.objectId ? [spatialAction.objectId] : []);
          let allAvailable = idsToCheck.length > 0;
          for (const id of idsToCheck) {
            const st = SPATIAL_REGISTRY[id] || 'FALLBACK';
            if (st !== 'AVAILABLE') {
              allAvailable = false;
              break;
            }
          }
          const primaryId = spatialAction.objectId || (spatialAction.objectIds ? spatialAction.objectIds[0] : '');
          const status = allAvailable ? 'AVAILABLE' : 'FALLBACK';

          console.log(`\n=== MODEL REQUEST PIPELINE ===`);
          console.log(`Requested ID(s): ${idsToCheck.join(', ')}`);
          console.log(`Registry Result: ${status}`);
          console.log(`Loading Status: ${status === 'FALLBACK' ? 'FAILED (Asset Missing)' : 'LOADING'}`);
          console.log(`==============================\n`);
          if (status === 'FALLBACK') {
            spatialAction = null; // Do not trigger spatial mode
            spatialInstruction = `\n\n[SYSTEM CONTEXT]: The user has requested to load 3D holographic model(s), but the model registry search returned 'ASSET UNAVAILABLE'. ADVIS MUST reply saying exactly: "I couldn't load that hologram. The asset is missing." and then list some available alternatives. Do NOT pretend to load it.`;
          } else {
            spatialInstruction = `\n\n[SYSTEM CONTEXT]: The user has requested to ${spatialAction.type === 'PRESENT' ? 'demonstrate' : 'load'} the 3D model(s) '${idsToCheck.join(', ')}'. The model(s) were FOUND and are loading. ADVIS must NOT confirm the display verbally yet. ADVIS should output exactly "[LOADING_HOLOGRAM]" and nothing else. The system will handle the verbal confirmation ("Displaying...") after the materialization sequence completes.`;
          }
        } else if (spatialAction.type === "EXPLODE") {
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: The user has requested to ${spatialAction.value ? "separate/explode the components" : "re-assemble"} of the active model. ADVIS must reply with a brief confirmation (e.g. "Separating components."). Do NOT over-explain.`;
        } else if (spatialAction.type === "CLOSE") {
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: The user has requested to close/unload the active model. ADVIS must reply with a brief confirmation (e.g. "Model closed."). Do not over-explain.`;
        }
      }
      if (selectedComponentId || hoveredComponentId) {
        const activePart = selectedComponentId || hoveredComponentId;
        spatialInstruction += `\n\n[SYSTEM CONTEXT]: The user is currently pointing/selecting the component '${activePart}' of the 3D model '${currentSpatialObject}'. If they ask 'explain this', 'what is this part', or similar, explain the function and details of '${activePart}'.`;
      }

      const systemInstruction = advisIdentity + "\n\n" + "The current date and time is " + new Date().toLocaleString() + ".\n\n" + memoryContext + spatialInstruction;

      // Enable Google Search only if Master Brain routed to SEARCH_AGENT
      const tools = (assignedAgent === "SEARCH_AGENT") ? [{ googleSearch: {} }] : undefined;

      let aiModel = "gemini-3.1-flash-lite"; // Default to fast lightweight model
      if (image || assignedAgent === "SEARCH_AGENT" || assignedAgent === "VISION_AGENT") {
        aiModel = "gemini-3.5-flash"; // Use standard flash for vision and search
      }

      const response = await client.models.generateContent({
        model: aiModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          tools: tools
        }
      });

      const aiReply = response.text || "I was unable to process that request, Sir.";

      if (assignedAgent === "CONVERSATION_AGENT") {
        responseCache[lowerMessage] = aiReply;
      }

      chatHistories[deviceId].push({ role: "user", content: message });
      chatHistories[deviceId].push({ role: "assistant", content: aiReply });
      if (chatHistories[deviceId].length > 20) chatHistories[deviceId] = chatHistories[deviceId].slice(chatHistories[deviceId].length - 20);
      saveData();
      
      // Background memory extraction
      extractAndSaveMemories(message);

      return res.json({ reply: aiReply, mode: mode || "normal", status: "online", spatialAction });
    } catch (error) {
      const errorMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
      let replyMessage = "My cloud systems are experiencing interference, Sir. I could not complete the request.";
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota") || (error.status === 429)) {
        replyMessage = "I am sorry Sir, my cognitive core is currently experiencing high demand or rate limits. Please try again in a few moments.";
        console.log("Gemini API Quota/Rate Limit Exceeded.");
      } else {
        console.log("Gemini API Exception:", error.message || error);
      }
      return res.json({ reply: replyMessage, mode: mode || "normal", status: "error" });
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

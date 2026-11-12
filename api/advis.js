"use strict";

const { processButlerTurn } = require("../ButlerEngine");

const MAX_MESSAGE_CHARS = 16000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_CHARS = 4000;
const MAX_IMAGE_CHARS = 3500000;
const REQUESTS_PER_MINUTE = 18;
const requestWindows = new Map();

let geminiClient;

function applyCors(req, res) {
  const origin = req.headers.origin;
  const configuredOrigins = (process.env.ADVIS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(function (value) { return value.trim(); })
    .filter(Boolean);
  const allowedOrigins = new Set([
    "https://ady5545.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    ...configuredOrigins
  ]);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function rateLimitExceeded(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : "") ||
    (req.socket && req.socket.remoteAddress) ||
    "unknown";
  const key = String(ip).slice(0, 100);
  const now = Date.now();
  const current = requestWindows.get(key);

  if (!current || now - current.startedAt >= 60000) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > REQUESTS_PER_MINUTE;
}

function cleanText(value, maxLength) {
  const limit = Number.isInteger(maxLength) ? maxLength : 240;
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, limit);
}

function cleanRecentConversation(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(function (item) {
      return item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
    })
    .map(function (item) {
      return {
        role: item.role,
        content: cleanText(item.content, MAX_HISTORY_MESSAGE_CHARS)
      };
    })
    .filter(function (item) { return item.content.length > 0; });
}

function cleanModelEvidence(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value;
  const evidenceInput = input.evidence && typeof input.evidence === "object" && !Array.isArray(input.evidence) ? input.evidence : {};
  const allowedKinds = ["PHYSICAL_REFERENCE", "SOURCED_VISUAL_ASSET", "CAD_BREP_ASSEMBLY", "PROCEDURAL_EDUCATIONAL_MODEL", "SCIENTIFIC_CONCEPT_MODEL", "SCHEMATIC"];
  const allowedGeometry = ["SOURCE_CAD", "SOURCED_VISUAL", "PROCEDURAL", "SCIENTIFIC_APPROXIMATION", "SCHEMATIC"];
  const allowedDimensions = ["UNSPECIFIED", "NOMINAL", "SOURCE_SUPPORTED", "VALIDATED"];
  const allowedSimulation = ["NONE", "PRESENTATION_ANIMATION", "KINEMATIC", "ANALYTICAL", "NUMERICAL", "BENCHMARK_VALIDATED"];
  const allowedLevels = ["MIDDLE_SCHOOL", "HIGH_SCHOOL", "UNDERGRADUATE", "ADVANCED"];
  const capabilitiesInput = input.capabilities && typeof input.capabilities === "object" && !Array.isArray(input.capabilities) ? input.capabilities : {};
  const allowedCapabilities = ["inspect", "componentHierarchy", "hideShow", "isolate", "explode", "transparency", "blueprint", "sectionPlane", "measure", "kinematics", "validatedSimulation", "parameterEditing", "guidedLessons", "saveProject", "exportGlb", "exportStep", "deepZoom", "interiorGeometry"];
  const capabilities = {};
  for (const key of allowedCapabilities) {
    if (typeof capabilitiesInput[key] === "boolean") capabilities[key] = capabilitiesInput[key];
  }
  const references = Array.isArray(evidenceInput.references) ? evidenceInput.references.slice(0, 5).map(function (reference) {
    if (!reference || typeof reference !== "object") return null;
    const label = cleanText(reference.label, 160);
    const rawUrl = cleanText(reference.url, 500);
    return {
      label,
      url: /^https?:\/\//i.test(rawUrl) ? rawUrl : "",
      citation: cleanText(reference.citation, 240),
      applicability: ["EXACT_MODEL", "RELATED_MODEL", "GENERAL_PRINCIPLE", "ILLUSTRATIVE"].includes(reference.applicability) ? reference.applicability : "ILLUSTRATIVE"
    };
  }).filter(function (reference) { return reference && reference.label; }) : [];
  const limitations = Array.isArray(evidenceInput.limitations) ? evidenceInput.limitations.slice(0, 6).map(function (item) {
    return cleanText(item, 240);
  }).filter(Boolean) : [];
  let selectedComponent = null;
  if (input.selectedComponent && typeof input.selectedComponent === "object" && !Array.isArray(input.selectedComponent)) {
    const component = input.selectedComponent;
    const specsInput = component.specifications && typeof component.specifications === "object" && !Array.isArray(component.specifications) ? component.specifications : {};
    const specifications = {};
    for (const [key, val] of Object.entries(specsInput).slice(0, 8)) {
      const safeKey = cleanText(key, 80);
      const safeValue = cleanText(val, 180);
      if (safeKey && safeValue) specifications[safeKey] = safeValue;
    }
    selectedComponent = {
      id: cleanText(component.id, 120),
      name: cleanText(component.name, 160),
      description: cleanText(component.description, 500),
      category: cleanText(component.category, 100),
      specifications
    };
  }
  return {
    id: cleanText(input.id, 120),
    name: cleanText(input.name, 160),
    category: cleanText(input.category, 100),
    description: cleanText(input.description, 500),
    modelKind: allowedKinds.includes(input.modelKind) ? input.modelKind : null,
    modelVersion: cleanText(input.modelVersion, 80) || null,
    unitSystem: ["SI", "IMPERIAL", "MIXED", "UNSPECIFIED"].includes(input.unitSystem) ? input.unitSystem : "UNSPECIFIED",
    evidence: {
      geometryAuthority: allowedGeometry.includes(evidenceInput.geometryAuthority) ? evidenceInput.geometryAuthority : null,
      dimensionsStatus: allowedDimensions.includes(evidenceInput.dimensionsStatus) ? evidenceInput.dimensionsStatus : null,
      simulationStatus: allowedSimulation.includes(evidenceInput.simulationStatus) ? evidenceInput.simulationStatus : null,
      educationalLevel: allowedLevels.includes(evidenceInput.educationalLevel) ? evidenceInput.educationalLevel : null,
      references,
      limitations
    },
    capabilities,
    selectedComponent
  };
}

function cleanContext(value) {
  const input = value && typeof value === "object" ? value : {};
  const allowedWorkspaces = ["HUD", "SPATIAL", "CHEMISTRY", "ENGINEERING"];
  const workspace = allowedWorkspaces.includes(input.activeWorkspace) ? input.activeWorkspace : "HUD";

  let activeSpatialObject = null;
  if (Array.isArray(input.activeSpatialObject)) {
    activeSpatialObject = input.activeSpatialObject.slice(0, 4)
      .map(function (item) { return cleanText(String(item), 120); })
      .filter(Boolean);
  } else {
    activeSpatialObject = cleanText(typeof input.activeSpatialObject === "string" ? input.activeSpatialObject : "", 160) || null;
  }

  let molecule = null;
  if (input.activeMolecule && typeof input.activeMolecule === "object") {
    molecule = {
      formula: cleanText(input.activeMolecule.formula, 80),
      totalAtoms: Number.isFinite(input.activeMolecule.totalAtoms) ? Math.max(0, Math.min(5000, input.activeMolecule.totalAtoms)) : 0,
      totalBonds: Number.isFinite(input.activeMolecule.totalBonds) ? Math.max(0, Math.min(5000, input.activeMolecule.totalBonds)) : 0,
      estimatedGeometry: cleanText(input.activeMolecule.estimatedGeometry, 120),
      estimatedHybridization: cleanText(input.activeMolecule.estimatedHybridization, 120),
      selectedAtomId: cleanText(input.activeMolecule.selectedAtomId, 120),
      warnings: Array.isArray(input.activeMolecule.warnings)
        ? input.activeMolecule.warnings.slice(0, 6).map(function (warning) {
            return { message: cleanText(warning && warning.message, 180) };
          }).filter(function (warning) { return warning.message; })
        : []
    };
  }

  return {
    activeProjectId: cleanText(input.activeProjectId, 120) || null,
    activeProjectName: cleanText(input.activeProjectName, 120) || null,
    activeWorkspace: workspace,
    activeSpatialObject: activeSpatialObject,
    activeScientificVisualization: cleanText(input.activeScientificVisualization, 160) || null,
    selectedComponentId: cleanText(input.selectedComponentId, 120) || null,
    hoveredComponentId: cleanText(input.hoveredComponentId, 120) || null,
    spatialMode: cleanText(input.spatialMode, 80),
    showLabels: typeof input.showLabels === "boolean" ? input.showLabels : undefined,
    isEngineeringMode: Boolean(input.isEngineeringMode),
    systemState: cleanText(input.systemState, 40),
    activeMolecule: molecule,
    activeModelEvidence: cleanModelEvidence(input.activeModelEvidence),
    recentActions: Array.isArray(input.recentActions)
      ? input.recentActions.slice(-6).map(function (action) {
          return {
            type: cleanText(action && action.type, 80),
            target: cleanText(action && action.target, 120) || null,
            name: cleanText(action && action.name, 120) || null,
            timestamp: Number.isFinite(action && action.timestamp) ? action.timestamp : Date.now()
          };
        })
      : [],
    // Transcript is supplied as conversation history, not copied into the system prompt.
    recentConversation: []
  };
}

function cleanImage(value) {
  if (!value || typeof value !== "object" || typeof value.content !== "string") return null;
  if (value.content.length > MAX_IMAGE_CHARS) {
    const tooLarge = new Error("That image is too large for chat. Please attach a smaller image.");
    tooLarge.statusCode = 413;
    throw tooLarge;
  }

  const dataUrlMatch = value.content.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (dataUrlMatch) {
    return {
      content: "data:" + dataUrlMatch[1] + ";base64," + dataUrlMatch[2].replace(/\s/g, ""),
      mimeType: dataUrlMatch[1].toLowerCase()
    };
  }

  const mimeType = cleanText(value.mimeType, 80).toLowerCase();
  if (!/^image\/(jpeg|png|webp|gif)$/.test(mimeType) || !/^[A-Za-z0-9+/=\r\n]+$/.test(value.content)) {
    const invalid = new Error("Please attach a valid PNG, JPEG, WebP, or GIF image.");
    invalid.statusCode = 400;
    throw invalid;
  }
  return { content: value.content.replace(/\s/g, ""), mimeType: mimeType };
}

function getGeminiClient() {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) return null;

  try {
    const GoogleGenAI = require("@google/genai").GoogleGenAI;
    geminiClient = new GoogleGenAI({ apiKey: String(apiKey).trim() });
    return geminiClient;
  } catch (error) {
    console.error("[ADVIS Gemini API] Gemini SDK initialization failed:", error && error.message ? error.message : error);
    return null;
  }
}

const SPATIAL_REGISTRY = {
  arduino_uno: "AVAILABLE", esp32: "AVAILABLE", raspberry_pi: "AVAILABLE",
  sg90_servo: "AVAILABLE", stepper_motor: "AVAILABLE", dc_motor: "AVAILABLE",
  brushless_motor: "AVAILABLE", breadboard: "AVAILABLE", relay_module: "AVAILABLE",
  ultrasonic_sensor: "AVAILABLE", ldr_sensor: "AVAILABLE", resistor_10k: "AVAILABLE",
  solar_panel: "AVAILABLE", silicon_pv_cell: "AVAILABLE", solar_semiconductor: "AVAILABLE",
  lcd_display: "AVAILABLE", v12_engine: "AVAILABLE", inline4_engine: "AVAILABLE",
  v8_engine: "AVAILABLE", turbocharger: "AVAILABLE", differential: "AVAILABLE",
  gearbox: "AVAILABLE", suspension: "AVAILABLE", brake_disc: "AVAILABLE",
  steering_assembly: "AVAILABLE", human_heart: "AVAILABLE", human_brain: "AVAILABLE",
  human_lungs: "AVAILABLE", human_eye: "AVAILABLE", human_skeleton: "AVAILABLE",
  electron: "AVAILABLE", hydrogen_atom: "AVAILABLE", atomic_nucleus: "AVAILABLE",
  magnetic_field: "AVAILABLE", earth: "AVAILABLE", moon: "AVAILABLE",
  solar_system: "AVAILABLE", iss: "AVAILABLE", satellite: "AVAILABLE", heliomotion: "AVAILABLE"
};

const MODEL_SYNONYMS = {
  arduino_uno: ["arduino uno", "arduino board", "microcontroller", "arduino"],
  esp32: ["esp32", "esp 32", "esp-32"],
  raspberry_pi: ["raspberry pi", "rpi"],
  sg90_servo: ["sg90 servo", "micro servo", "servo motor", "servo"],
  stepper_motor: ["stepper motor", "nema 17", "stepper"],
  dc_motor: ["dc motor", "direct current motor"],
  brushless_motor: ["brushless motor", "bldc motor", "bldc"],
  breadboard: ["breadboard", "solderless breadboard"],
  relay_module: ["relay module", "5v relay", "relay"],
  ultrasonic_sensor: ["ultrasonic sensor", "hc-sr04", "distance sensor"],
  ldr_sensor: ["ldr sensor", "photoresistor", "light sensor"],
  resistor_10k: ["10k resistor", "resistor"],
  solar_panel: ["solar panel", "photovoltaic panel", "pv panel"],
  silicon_pv_cell: ["silicon photovoltaic cell", "photovoltaic cell", "pv cell"],
  solar_semiconductor: ["solar semiconductor", "semiconductor structure", "pn junction", "p-n junction"],
  lcd_display: ["lcd display", "16x2 lcd", "lcd"],
  v12_engine: ["v12 engine", "v12 model", "v12", "engine model", "engine"],
  inline4_engine: ["inline-4 engine", "inline 4 engine", "i4 engine", "four cylinder engine"],
  v8_engine: ["v8 engine", "v8 combustion", "v8"],
  turbocharger: ["turbocharger", "turbo"],
  differential: ["limited slip differential", "differential"],
  gearbox: ["gearbox", "transmission"],
  suspension: ["strut suspension", "suspension"],
  brake_disc: ["brake disc", "brake rotor", "brake"],
  steering_assembly: ["steering assembly", "rack and pinion", "steering rack"],
  human_heart: ["human heart", "heart"],
  human_brain: ["human brain", "brain"],
  human_lungs: ["human lungs", "lungs", "respiratory system"],
  human_eye: ["human eye", "eyeball"],
  human_skeleton: ["human skeleton", "skeleton"],
  electron: ["electron cloud", "electron"],
  hydrogen_atom: ["hydrogen atom", "bohr atom"],
  atomic_nucleus: ["atomic nucleus", "nucleus"],
  magnetic_field: ["magnetic field", "magnet"],
  earth: ["planet earth", "earth globe", "earth"],
  moon: ["moon", "lunar"],
  solar_system: ["solar system", "planets"],
  iss: ["international space station", "space station", "iss"],
  satellite: ["communication satellite", "satellite"],
  heliomotion: ["heliomotion", "solar tracker"]
};

const SCIENTIFIC_ENTITIES = {
  glucose: { formula: "C6H12O6", name: "Glucose" },
  c6h12o6: { formula: "C6H12O6", name: "Glucose" },
  sugar: { formula: "C6H12O6", name: "Glucose" },
  water: { formula: "H2O", name: "Water" },
  h2o: { formula: "H2O", name: "Water" },
  "boron trifluoride": { formula: "BF3", name: "Boron Trifluoride" },
  bf3: { formula: "BF3", name: "Boron Trifluoride" },
  benzene: { formula: "C6H6", name: "Benzene" },
  c6h6: { formula: "C6H6", name: "Benzene" },
  ethanol: { formula: "C2H5OH", name: "Ethanol" },
  c2h5oh: { formula: "C2H5OH", name: "Ethanol" },
  methane: { formula: "CH4", name: "Methane" },
  ch4: { formula: "CH4", name: "Methane" },
  ammonia: { formula: "NH3", name: "Ammonia" },
  nh3: { formula: "NH3", name: "Ammonia" },
  "carbon dioxide": { formula: "CO2", name: "Carbon Dioxide" },
  co2: { formula: "CO2", name: "Carbon Dioxide" },
  "sodium chloride": { formula: "NaCl", name: "Sodium Chloride" },
  nacl: { formula: "NaCl", name: "Sodium Chloride" },
  "oxygen gas": { formula: "O2", name: "Oxygen Gas" },
  o2: { formula: "O2", name: "Oxygen Gas" },
  "nitrogen gas": { formula: "N2", name: "Nitrogen Gas" },
  n2: { formula: "N2", name: "Nitrogen Gas" }
};

function resolveScientificEntityServer(message) {
  if (!message) return null;
  const normalized = String(message).toLowerCase()
    .replace(/₀/g, "0").replace(/₁/g, "1").replace(/₂/g, "2").replace(/₃/g, "3")
    .replace(/₄/g, "4").replace(/₅/g, "5").replace(/₆/g, "6").replace(/₇/g, "7")
    .replace(/₈/g, "8").replace(/₉/g, "9");
  const keys = Object.keys(SCIENTIFIC_ENTITIES).sort(function (a, b) { return b.length - a.length; });
  for (const key of keys) {
    // Entity names are plain words/formulas, so word-boundary matching is sufficient.
    if (new RegExp("\\b" + key + "\\b", "i").test(normalized)) return SCIENTIFIC_ENTITIES[key];
  }
  return null;
}

function detectSpatialAction(message, butlerContext) {
  const lower = message.toLowerCase().trim();
  if (/^(close|hide|remove|stop visualization|clear visualization|close model|hide model|remove model|unload model|close visualization)$/.test(lower) ||
      lower.includes("close the model") || lower.includes("close the visualization") ||
      lower.includes("hide the model") || lower.includes("unload model")) return { type: "CLOSE" };
  if (lower.includes("showcase") || lower.includes("cinematic view") || lower.includes("auto rotate")) return { type: "SHOWCASE" };
  if (lower.includes("inspection mode") || lower.includes("inspect mode") || lower.includes("manual control") || lower.includes("stop rotation") || lower.includes("interactive mode")) return { type: "INSPECTION" };
  if (lower.includes("demo mode") || lower.includes("demonstration mode") || lower.includes("guided tour") || lower.includes("guided demo") || lower === "demonstrate") return { type: "DEMO" };
  if (lower === "explode" || lower === "explode it" || lower.includes("exploded view") || lower.includes("explode the model") || lower.includes("explode the engine") || lower.includes("separate the components") || lower.includes("separate the parts")) return { type: "EXPLODE", value: true };
  if (lower === "assemble" || lower.includes("reassemble") || lower.includes("re-assemble") || lower.includes("normal view") || lower.includes("assemble the components") || lower.includes("assemble the parts") || lower.includes("collapse parts")) return { type: "EXPLODE", value: false };
  if (lower === "pause" || lower === "pause animation" || lower === "pause engine" || lower === "stop engine" || lower === "pause kinematics" || lower === "pause it") return { type: "KINEMATICS", playing: false };
  if (lower === "play" || lower === "resume" || lower === "play animation" || lower === "start engine" || lower === "resume engine" || lower === "play kinematics" || lower === "play it") return { type: "KINEMATICS", playing: true };
  if (lower.includes("hide labels") || lower.includes("remove labels")) return { type: "LABEL", value: false };
  if (lower.includes("show labels") || lower.includes("enable labels") || lower.startsWith("label ")) return { type: "LABEL", value: true };
  if (lower.includes("compare")) return { type: "COMPARE" };
  if (lower.includes("diagnose") || lower.includes("check diagnostics")) return { type: "DIAGNOSE" };

  if (lower.startsWith("select ") || lower.includes("select the ")) {
    const rules = [
      [/piston/, "piston_left_bank", "Piston"],
      [/crankshaft|crank\b/, "crankshaft", "Crankshaft"],
      [/connecting rod|connecting rods|\brod\b/, "connecting_rods", "Connecting Rods"],
      [/engine block|cylinder block|\bblock\b/, "engine_block", "Engine Block"],
      [/valvetrain|camshaft|\bvalve\b/, "valvetrain", "Valvetrain"],
      [/intake|plenum/, "intake_plenum", "Intake Plenum"],
      [/exhaust|header/, "exhaust_manifold", "Exhaust Manifold"],
      [/cooling|water pump/, "cooling_system", "Cooling System"],
      [/lubrication|oil pan/, "lubrication_system", "Lubrication System"],
      [/servo gear|\bgears?\b/, "servo_gears", "Servo Gears"],
      [/potentiometer|servo pot/, "servo_pot", "Position Potentiometer"],
      [/servo horn|servo arm/, "servo_arm", "Servo Arm"],
      [/dc motor|servo core/, "servo_motor_core", "Motor Core"]
    ];
    for (const rule of rules) {
      if (rule[0].test(lower)) {
        const isRight = rule[1] === "piston_left_bank" && /(second|2nd|right|bank 2)/.test(lower);
        return {
          type: "SELECT_COMPONENT",
          componentId: isRight ? "piston_right_bank" : rule[1],
          componentName: isRight ? "Second Bank Piston" : rule[2]
        };
      }
    }
  }

  if (lower === "isolate" || lower === "isolate it" || lower === "isolate this" || lower.startsWith("isolate ")) {
    let componentId = (butlerContext && butlerContext.selectedComponentId) || undefined;
    if (lower.includes("piston")) componentId = "piston_left_bank";
    else if (lower.includes("crank")) componentId = "crankshaft";
    else if (lower.includes("rod")) componentId = "connecting_rods";
    else if (lower.includes("block")) componentId = "engine_block";
    else if (lower.includes("valve") || lower.includes("camshaft")) componentId = "valvetrain";
    return { type: "ISOLATE", componentId: componentId, value: true };
  }
  if (lower === "exit isolation" || lower === "un-isolate" || lower === "show all parts" || lower === "unisolate" || lower === "stop isolation") return { type: "ISOLATE", value: false };

  if (lower.includes("trace") || lower.includes("power path") || lower.includes("what drives this") || lower.includes("what does this connect to")) {
    let functionKey = "power";
    if (lower.includes("combustion")) functionKey = "combustion";
    else if (lower.includes("cooling") || lower.includes("coolant")) functionKey = "cooling";
    else if (lower.includes("crank") || lower.includes("power") || lower.includes("drive")) functionKey = "crankshaft";
    else if (lower.includes("fuel") || lower.includes("intake") || lower.includes("air")) functionKey = "fuel";
    else if (lower.includes("gear") || lower.includes("transmission")) functionKey = "gears";
    else if (lower.includes("feedback") || lower.includes("sensor")) functionKey = "feedback";
    return { type: "TRACE_FUNCTION", functionKey: functionKey };
  }

  const displayIntent = /^(show|display|visualize|render|load|project|open|present|demonstrate)\b/.test(lower);
  if (displayIntent) {
    const foundIds = [];
    for (const entry of Object.entries(MODEL_SYNONYMS)) {
      if (entry[1].some(function (synonym) { return lower.includes(synonym); }) && SPATIAL_REGISTRY[entry[0]] === "AVAILABLE") {
        if (!foundIds.includes(entry[0])) foundIds.push(entry[0]);
      }
    }
    if (foundIds.length) {
      const isPresent = /^(present|demonstrate)\b/.test(lower);
      const mode = lower.includes("showcase") ? "SHOWCASE" : (isPresent ? "DEMO" : undefined);
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

function chooseAgent(message, hasImage) {
  if (hasImage) return "VISION_AGENT";
  const lower = message.toLowerCase();
  if (/^(clear chat|clear console|clear screen|clear history)$/.test(lower.trim())) return "SYSTEM_CLEAR";
  if (/\b(weather|latest|current|today|right now|breaking news|recent news|stock price|exchange rate|live score|who won)\b/.test(lower)) return "SEARCH_AGENT";
  return "CONVERSATION_AGENT";
}

function sendJson(res, statusCode, body) {
  return res.status(statusCode).json(body);
}

module.exports = async function advisHandler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { reply: "Use POST to send an educational question.", status: "error" });
  }

  if (rateLimitExceeded(req)) {
    return sendJson(res, 429, {
      reply: "ADVIS is receiving requests too quickly. Please wait a minute and try again.",
      status: "error"
    });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const image = cleanImage(body.image);
    let message = cleanText(body.message, MAX_MESSAGE_CHARS);

    if (!message && !image) {
      return sendJson(res, 400, { reply: "Please enter a question or attach an image.", status: "error" });
    }

    if (!message && image) {
      message = "Describe what can be directly observed in this image. Separate visible evidence from uncertain interpretation, and explain relevant scientific concepts without guessing at hidden details.";
    }

    if (/^(clear chat|clear console|clear screen|clear history)$/i.test(message.trim())) {
      return sendJson(res, 200, { reply: "Console cleared.", mode: "normal", status: "online" });
    }

    const rawContext = body.butlerContext && typeof body.butlerContext === "object" ? body.butlerContext : {};
    const recentConversation = cleanRecentConversation(rawContext.recentConversation);
    const butlerContext = cleanContext(rawContext);
    const deviceId = cleanText(body.deviceId, 100) || "browser-session";
    const chatHistories = {};
    chatHistories[deviceId] = recentConversation;
    const allowedModes = ["normal", "spatial", "engineering", "chemistry"];
    const safeMode = allowedModes.includes(body.mode) ? body.mode : "normal";

    const result = await processButlerTurn({
      message: message,
      mode: safeMode,
      deviceId: deviceId,
      image: image,
      butlerContext: butlerContext,
      advisMemories: [],
      advisProjects: [],
      chatHistories: chatHistories,
      saveData: function () {},
      evaluateAndStoreMemory: function () {},
      getGeminiClient: getGeminiClient,
      SPATIAL_REGISTRY: SPATIAL_REGISTRY,
      MODEL_SYNONYMS: MODEL_SYNONYMS,
      SCIENTIFIC_ENTITIES: SCIENTIFIC_ENTITIES,
      detectSpatialAction: detectSpatialAction,
      resolveScientificEntityServer: resolveScientificEntityServer,
      handleMemoryAgent: async function () { return null; },
      handleExecutionAgent: function () { return null; },
      handleHelioMotionAgent: function () { return null; },
      handleLocalIntelAgent: function () { return null; },
      masterBrainRoute: chooseAgent
    });

    if (!result || typeof result.reply !== "string") {
      return sendJson(res, 502, {
        reply: "ADVIS received an invalid response from the reasoning service. Please rephrase the question and try again.",
        mode: safeMode,
        status: "error"
      });
    }

    // Report provider readiness without exposing the credential or blocking local responses.
    result.aiProviderStatus = result.aiProviderStatus ||
      (process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim() ? "configured" : "not_configured");
    result.reasoningAvailable = typeof result.reasoningAvailable === "boolean"
      ? result.reasoningAvailable
      : result.aiProviderStatus === "configured";

    if (result.status === "error") return sendJson(res, 502, result);
    return sendJson(res, 200, result);
  } catch (error) {
    const statusCode = Number.isInteger(error && error.statusCode) ? error.statusCode : 500;
    console.error("[ADVIS Gemini API]", error && error.message ? error.message : error);
    return sendJson(res, statusCode, {
      reply: statusCode === 413 || statusCode === 400
        ? error.message
        : "ADVIS could not complete that request because the reasoning service encountered an error. Please try again; if it persists, check the server logs and Gemini API configuration.",
      mode: "normal",
      status: "error"
    });
  }
};

// Export the sanitizer for deterministic contract tests; the serverless default remains the handler.
module.exports.cleanContext = cleanContext;

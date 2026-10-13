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
  if (!apiKey) return null;
  const GoogleGenAI = require("@google/genai").GoogleGenAI;
  geminiClient = new GoogleGenAI({ apiKey: apiKey });
  return geminiClient;
}

function chooseAgent(message, hasImage) {
  if (hasImage) return "VISION_AGENT";
  const lower = message.toLowerCase();
  if (/^(clear chat|clear console|clear screen|clear history)$/.test(lower.trim())) return "SYSTEM_CLEAR";
  if (/\b(weather|latest|current|today|right now|breaking news|recent news|stock price|exchange rate|live score|who won)\b/.test(lower)) {
    return "SEARCH_AGENT";
  }
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

    if (!process.env.GEMINI_API_KEY) {
      return sendJson(res, 503, {
        reply: "The Gemini backend is not configured yet. Add GEMINI_API_KEY to the deployment's server-side environment variables, then redeploy. Do not put the key in frontend code.",
        mode: body.mode || "normal",
        status: "offline"
      });
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
      SPATIAL_REGISTRY: new Proxy({}, {
        get: function (_target, property) {
          return typeof property === "string" ? "AVAILABLE" : undefined;
        }
      }),
      MODEL_SYNONYMS: {},
      SCIENTIFIC_ENTITIES: {},
      detectSpatialAction: function () { return null; },
      resolveScientificEntityServer: function () { return null; },
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

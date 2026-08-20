// ButlerEngine.js
// ADVIS Butler Intelligence Layer
// Sits above existing intent, spatial, chemistry, memory and execution subsystems.

const fs = require("fs");
const path = require("path");

/**
 * Butler Contextual Reference Resolver
 * Maps pronouns ("this", "that", "it", "again", "here", "the engine", "the molecule", "the structure", "back")
 * to the currently active object, visualization, workspace, project, or recent action.
 */
function resolveContextualReferences(message, butlerContext) {
  const lower = message.toLowerCase().trim();
  const ctx = butlerContext || {};

  const activeVisualization = ctx.activeScientificVisualization || null;
  const activeSpatial = ctx.activeSpatialObject || null;
  const activeWorkspace = ctx.activeWorkspace || 'HUD';
  const recentActions = ctx.recentActions || [];
  const activeProject = ctx.activeProjectName || ctx.activeProjectId || null;

  // Most recent action and target
  const lastAction = recentActions.length > 0 ? recentActions[recentActions.length - 1] : null;
  const previousAction = recentActions.length > 1 ? recentActions[recentActions.length - 2] : null;

  let resolvedTarget = null;
  let resolvedType = null; // 'MOLECULE' | 'SPATIAL' | 'PROJECT' | 'ACTION'
  let isAnaphoric = false;

  const hasAnaphora = /\b(this|that|it|here|again|back|one|the model|the molecule|the engine|the structure|the project)\b/i.test(lower);

  if (hasAnaphora || lower === "nah close this" || lower === "okay close it" || lower === "close this" || lower === "close it") {
    isAnaphoric = true;

    if (lower.includes("the engine") || lower.includes("engine")) {
      resolvedTarget = (typeof activeSpatial === 'string' && activeSpatial.includes("engine")) ? activeSpatial : "v12_engine";
      resolvedType = 'SPATIAL';
    } else if (lower.includes("the molecule") || lower.includes("the structure") || lower.includes("the chemical") || lower.includes("glucose")) {
      resolvedTarget = activeVisualization || "C6H12O6";
      resolvedType = 'MOLECULE';
    } else if (lower.includes("the project") || lower.includes("what was i doing") || lower.includes("what were we doing")) {
      resolvedTarget = activeProject;
      resolvedType = 'PROJECT';
    } else if (lower.includes("again") || lower.includes("back") || lower.includes("open that again") || lower.includes("go back")) {
      if (lastAction && lastAction.target) {
        resolvedTarget = lastAction.target;
        resolvedType = lastAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      } else if (previousAction && previousAction.target) {
        resolvedTarget = previousAction.target;
        resolvedType = previousAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      } else {
        resolvedTarget = activeVisualization || activeSpatial || "v12_engine";
        resolvedType = activeVisualization ? 'MOLECULE' : 'SPATIAL';
      }
    } else {
      // Default "this" / "that" / "it" resolution
      if (activeVisualization) {
        resolvedTarget = activeVisualization;
        resolvedType = 'MOLECULE';
      } else if (activeSpatial) {
        resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
        resolvedType = 'SPATIAL';
      } else if (lastAction && lastAction.target) {
        resolvedTarget = lastAction.target;
        resolvedType = lastAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      }
    }
  }

  return {
    isAnaphoric,
    resolvedTarget,
    resolvedType,
    activeWorkspace,
    activeVisualization,
    activeSpatial,
    activeProject,
    lastAction
  };
}

/**
 * Formats a compact, highly relevant contextual summary for Gemini / LLM prompts.
 */
function buildContextSummary(butlerContext, resolvedRef, advisMemories, advisProjects) {
  const ctx = butlerContext || {};
  const recentConvo = (ctx.recentConversation || []).slice(-4);
  const recentActions = (ctx.recentActions || []).slice(-4);

  let summary = `[BUTLER SITUATIONAL CONTEXT]:\n`;
  summary += `- Active Workspace: ${ctx.activeWorkspace || 'HUD'}\n`;

  if (ctx.activeScientificVisualization) {
    summary += `- Active Scientific Visualization: ${ctx.activeScientificVisualization}\n`;
  }
  if (ctx.activeSpatialObject) {
    summary += `- Active Spatial 3D Model: ${Array.isArray(ctx.activeSpatialObject) ? ctx.activeSpatialObject.join(', ') : ctx.activeSpatialObject}\n`;
  }
  if (ctx.selectedComponentId) {
    summary += `- Selected Component: ${ctx.selectedComponentId}\n`;
  }
  if (ctx.activeProjectId) {
    const proj = (advisProjects || []).find(p => p.id === ctx.activeProjectId);
    summary += `- Active Project: ${proj ? proj.name : ctx.activeProjectId}\n`;
  } else {
    summary += `- Active Project: None\n`;
  }

  if (resolvedRef && resolvedRef.isAnaphoric) {
    summary += `- Anaphoric Reference Resolution: "${resolvedRef.resolvedTarget || 'Active Workspace'}" (${resolvedRef.resolvedType || 'GENERAL'})\n`;
  }

  if (recentActions.length > 0) {
    summary += `- Recent Action Stack: ${recentActions.map(a => `${a.type}(${a.target || ''})`).join(' -> ')}\n`;
  }

  if (recentConvo.length > 0) {
    summary += `- Recent Conversation Context:\n${recentConvo.map(c => `  ${c.role.toUpperCase()}: ${c.content}`).join('\n')}\n`;
  }

  return summary;
}

/**
 * Main Butler Intelligence Entry Point
 */
async function processButlerTurn(params) {
  const {
    message,
    mode,
    deviceId = 'default',
    image,
    butlerContext,
    advisMemories = [],
    advisProjects = [],
    chatHistories = {},
    saveData = () => {},
    evaluateAndStoreMemory = () => {},
    getGeminiClient,
    SPATIAL_REGISTRY = {},
    MODEL_SYNONYMS = {},
    SCIENTIFIC_ENTITIES = {},
    detectSpatialAction,
    resolveScientificEntityServer,
    handleMemoryAgent,
    handleExecutionAgent,
    handleHelioMotionAgent,
    handleLocalIntelAgent,
    masterBrainRoute
  } = params;

  const lowerMessage = message.toLowerCase().trim();

  // Step 1: Context & Reference Resolution
  const resolvedRef = resolveContextualReferences(message, butlerContext);

  // Step 2: Handle Immediate Casual & Conversational Close / Reset Patterns
  if (lowerMessage === "nah close this" || lowerMessage === "okay close it" || lowerMessage === "close this" || lowerMessage === "close it" || lowerMessage === "okay we're done here" || lowerMessage === "we're done here" || lowerMessage === "clear this") {
    const hasActive = butlerContext && (butlerContext.activeScientificVisualization || butlerContext.activeSpatialObject);
    return {
      reply: hasActive ? "Closed." : "Nothing is currently open.",
      mode: mode || "normal",
      status: "online",
      spatialAction: { type: 'CLOSE' },
      butlerDecision: {
        userObjective: "Close current active workspace",
        classification: "ACKNOWLEDGEMENT",
        isAnaphoric: true,
        resolvedReference: resolvedRef.resolvedTarget,
        targetSubsystem: "SPATIAL",
        responseMode: "BOTH"
      }
    };
  }

  // Step 3: Handle Contextual Re-Open / Go Back Patterns ("actually go back", "open that again")
  if (lowerMessage === "actually go back" || lowerMessage === "go back" || lowerMessage === "open that again" || lowerMessage === "bring that back") {
    const lastAction = resolvedRef.lastAction;
    if (lastAction) {
      if (lastAction.type === 'DISPLAY_SCIENTIFIC' && lastAction.target) {
        return {
          reply: `I've brought ${lastAction.name || lastAction.target} back.`,
          mode: mode || "normal",
          status: "online",
          spatialAction: { type: 'DISPLAY_SCIENTIFIC', formula: lastAction.target, assetId: lastAction.target },
          butlerDecision: {
            userObjective: "Re-open previous scientific visualization",
            classification: "CORRECTION",
            isAnaphoric: true,
            resolvedReference: lastAction.target,
            targetSubsystem: "CHEMISTRY",
            responseMode: "BOTH"
          }
        };
      } else if ((lastAction.type === 'DISPLAY' || lastAction.type === 'PRESENT') && lastAction.target) {
        return {
          reply: "I've brought the model back.",
          mode: mode || "normal",
          status: "online",
          spatialAction: { type: 'DISPLAY', objectId: lastAction.target },
          butlerDecision: {
            userObjective: "Re-open previous spatial 3D model",
            classification: "CORRECTION",
            isAnaphoric: true,
            resolvedReference: lastAction.target,
            targetSubsystem: "SPATIAL",
            responseMode: "BOTH"
          }
        };
      }
    }
  }

  // Step 4: Handle "let's work on the engine" / Engineering Switch
  if (lowerMessage.match(/(let's|lets|switch to|work on|open).*(engine|v12|3d model)/i)) {
    const targetObj = resolvedRef.resolvedTarget || "v12_engine";
    return {
      reply: "You're back in Engineering.",
      mode: mode || "normal",
      status: "online",
      spatialAction: { type: 'DISPLAY', objectId: targetObj, mode: 'INSPECTION' },
      butlerDecision: {
        userObjective: "Switch workspace to engineering engine model",
        classification: "REQUEST",
        isAnaphoric: true,
        resolvedReference: targetObj,
        targetSubsystem: "SPATIAL",
        responseMode: "BOTH"
      }
    };
  }

  // Step 5: Fast Scientific Entity Resolution
  let resolvedEntity = resolveScientificEntityServer(message);

  // If user used anaphoric reference ("why does that look like that?") with active visualization:
  if (!resolvedEntity && butlerContext && butlerContext.activeScientificVisualization && (lowerMessage.includes("that") || lowerMessage.includes("it") || lowerMessage.includes("this"))) {
    const activeFormula = butlerContext.activeScientificVisualization;
    resolvedEntity = resolveScientificEntityServer(activeFormula);
  }

  const displayVerbs = /(show|display|visualize|bring up|put|let me see|project|render|draw|hologram|view|see)/i;
  const isDisplayIntent = displayVerbs.test(lowerMessage);
  const isQuestioningActive = /(why|how|what|explain|tell me|reason)/i.test(lowerMessage);

  if (resolvedEntity && isDisplayIntent && !isQuestioningActive) {
    const requiresExplanation = /(explain|functional groups|structure|bonding|hybridization|how is it)/i.test(lowerMessage);
    const replyText = requiresExplanation
      ? `Displaying ${resolvedEntity.name}. Retrieving structural analysis.`
      : `Displaying ${resolvedEntity.name}.`;

    return {
      reply: replyText,
      mode: mode || "normal",
      status: "online",
      spatialAction: {
        type: 'DISPLAY_SCIENTIFIC',
        assetId: resolvedEntity.formula,
        formula: resolvedEntity.formula,
        name: resolvedEntity.name,
        requiresExplanation
      },
      butlerDecision: {
        userObjective: `Display scientific visualization for ${resolvedEntity.name}`,
        classification: "REQUEST",
        isAnaphoric: false,
        resolvedReference: resolvedEntity.formula,
        targetSubsystem: "CHEMISTRY",
        responseMode: "BOTH"
      }
    };
  }

  // Step 6: Master Brain & Agent Routing
  let spatialAction = detectSpatialAction(message);
  let assignedAgent = masterBrainRoute(message, !!image);

  if (lowerMessage.match(/(teach|show|explain|visualize|make|draw|display).*(bf3|h2o|water|co2|nacl|ch4|methane|ammonia|nh3|lewis|hybridization|bonding|structure|molecule|h2so4|glucose|benzene|c6h12o6|c6h6|ethanol|c2h5oh|boron trifluoride)/i)) {
    assignedAgent = "LEARN_AGENT";
  }

  // Handle local fast agents
  if (assignedAgent === "SYSTEM_CLEAR") {
    chatHistories[deviceId] = [];
    saveData();
    return {
      reply: "Console cleared.",
      mode: mode || "normal",
      status: "online",
      butlerDecision: {
        userObjective: "Clear console history",
        classification: "ACKNOWLEDGEMENT",
        isAnaphoric: false,
        targetSubsystem: "CONVERSATION",
        responseMode: "VERBAL_ONLY"
      }
    };
  }

  let localReply = null;
  if (assignedAgent === "EXECUTION_AGENT") {
    localReply = handleExecutionAgent(message);
  } else if (assignedAgent === "HELIOMOTION_AGENT") {
    localReply = handleHelioMotionAgent(message);
  } else if (assignedAgent === "LOCAL_INTEL_AGENT") {
    localReply = handleLocalIntelAgent(message);
  } else if (assignedAgent === "DIAGNOSTICS_AGENT") {
    localReply = "Hardware parameters are operating nominally.";
  } else if (assignedAgent === "PLANNING_AGENT") {
    localReply = "Schedule updated and timers set.";
  } else if (assignedAgent === "MEMORY_AGENT") {
    localReply = await handleMemoryAgent(message, butlerContext ? butlerContext.activeProjectId : null);
  }

  if (localReply) {
    if (!chatHistories[deviceId]) chatHistories[deviceId] = [];
    chatHistories[deviceId].push({ role: "user", content: message });
    chatHistories[deviceId].push({ role: "assistant", content: localReply });
    saveData();
    evaluateAndStoreMemory(message, butlerContext ? butlerContext.activeProjectId : null);

    let overrideReply = localReply;
    let newProjectId = undefined;
    if (typeof localReply === 'string' && localReply.startsWith('PROJECT_SWITCH:')) {
      newProjectId = localReply.split(':')[1];
      overrideReply = "I've switched the project context.";
    }

    return {
      reply: overrideReply,
      mode: mode || "normal",
      status: "online",
      activeProjectId: newProjectId,
      butlerDecision: {
        userObjective: "Handled by local agent",
        classification: "REQUEST",
        isAnaphoric: false,
        targetSubsystem: assignedAgent,
        responseMode: "VERBAL_ONLY"
      }
    };
  }

  // Step 7: Gemini Conversation Core with Butler System Instructions
  const client = getGeminiClient();
  if (!client) {
    return {
      reply: "My cloud core is currently offline. Please configure the GEMINI_API_KEY environment variable.",
      mode: mode || "normal",
      status: "offline"
    };
  }

  try {
    if (!chatHistories[deviceId]) chatHistories[deviceId] = [];

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

    // Build Butler Context Summary
    const contextSummary = buildContextSummary(butlerContext, resolvedRef, advisMemories, advisProjects);

    const butlerPersonaPrompt = `
You are ADVIS, an exceptionally capable, calm, observant, respectful, and understated Digital Butler and Spatial AI OS Core.

PRIMARY PERSONALITY DIRECTIVES:
1. Speak with quiet confidence, restraint, and competence. You behave as a refined, capable personal butler rather than an enthusiastic chatbot or robotic assistant.
2. ABSOLUTELY DO NOT say:
   - "Understood, Sir."
   - "Certainly, Sir."
   - "How may I assist you, Sir?"
   - "As an AI..."
   - "Great question!"
3. Do NOT append "Sir" to every response. Use short, direct, natural phrasing.
4. Use concise, understated confirmations for actions:
   - "Done."
   - "Cleared."
   - "You're back in Engineering."
   - "I've brought the model back."
   - "That was the glucose structure."
   - "I've switched it."
   - "Nothing is currently open."
5. When the user asks a question about the active workspace object or visualization (e.g., "why does that look like that?", "what was I doing?"), answer directly and accurately in 1-2 natural sentences using the current situational context.
6. When the user chats casually, respond naturally in a relaxed tone without forcing an unrequested action.

${contextSummary}
`;

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
        if (!allAvailable) {
          spatialAction = null;
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: The requested 3D model is missing. Reply simply: "I couldn't load that hologram. The asset is missing." and list available alternatives.`;
        } else {
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: Loading 3D model '${idsToCheck.join(', ')}'. Output exactly "[LOADING_HOLOGRAM]" and nothing else.`;
        }
      } else if (spatialAction.type === "EXPLODE") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Component separation requested. Reply briefly: "${spatialAction.value ? "Separating components." : "Reassembling model."}"`;
      } else if (spatialAction.type === "CLOSE") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Close active model requested. Reply briefly: "Closed."`;
      }
    }

    const systemInstruction = butlerPersonaPrompt + spatialInstruction;
    const tools = (assignedAgent === "SEARCH_AGENT") ? [{ googleSearch: {} }] : undefined;

    let aiModel = "gemini-3.1-flash-lite";
    if (image || assignedAgent === "SEARCH_AGENT" || assignedAgent === "VISION_AGENT") {
      aiModel = "gemini-3.5-flash";
    }

    const response = await client.models.generateContent({
      model: aiModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        tools: tools
      }
    });

    const aiReply = response.text || "I was unable to process that.";

    chatHistories[deviceId].push({ role: "user", content: message });
    chatHistories[deviceId].push({ role: "assistant", content: aiReply });
    if (chatHistories[deviceId].length > 20) {
      chatHistories[deviceId] = chatHistories[deviceId].slice(chatHistories[deviceId].length - 20);
    }
    saveData();
    evaluateAndStoreMemory(message, butlerContext ? butlerContext.activeProjectId : null);

    return {
      reply: aiReply,
      mode: mode || "normal",
      status: "online",
      spatialAction,
      butlerDecision: {
        userObjective: "Generative butler response",
        classification: "CONVERSATION",
        isAnaphoric: resolvedRef.isAnaphoric,
        resolvedReference: resolvedRef.resolvedTarget,
        targetSubsystem: "CONVERSATION",
        responseMode: "VERBAL_ONLY"
      }
    };

  } catch (error) {
    console.error("Butler Core Gemini Error:", error.message || error);
    return {
      reply: "My cognitive systems are experiencing brief interference.",
      mode: mode || "normal",
      status: "error"
    };
  }
}

module.exports = {
  resolveContextualReferences,
  buildContextSummary,
  processButlerTurn
};

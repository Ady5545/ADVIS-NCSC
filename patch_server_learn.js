const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const oldRouting = `let assignedAgent = masterBrainRoute(message, !!image);
    if (message.toLowerCase().includes("teach me bf3") || message.toLowerCase().includes("bf3") || message.toLowerCase().includes("explain bf3") || message.toLowerCase().includes("show bf3")) {
        assignedAgent = "LEARN_AGENT";
    }`;

const newRouting = `let assignedAgent = masterBrainRoute(message, !!image);
    // Dynamic Learn Agent Routing
    if (message.toLowerCase().match(/(teach|show|explain|visualize|make|draw).*(bf3|h2o|water|co2|nacl|ch4|methane|ammonia|nh3|lewis|hybridization|bonding|structure)/i) && !message.toLowerCase().match(/(what is|who discovered)/i)) {
        assignedAgent = "LEARN_AGENT";
    }`;

server = server.replace(oldRouting, newRouting);

const oldLearnReply = `    if (assignedAgent === "LEARN_AGENT") {
        const isShowMe = message.toLowerCase().includes("show");
        const learnSessionType = isShowMe ? 'SHOW_ME' : 'TEACH_ME';
        return res.json({ 
            reply: isShowMe ? "I have projected the structural summary of BF3 for you, Sir." : "Initializing learning session for Boron Trifluoride hybridization.", 
            mode: "normal", 
            status: "online", 
            learnAction: { type: 'START_SESSION', subject: 'BF3', learnMode: learnSessionType }
        });
    }`;

const newLearnReply = `    if (assignedAgent === "LEARN_AGENT") {
        // We will call the Gemini API directly here to parse the intent
        const client = getGeminiClient();
        if (!client) {
             return res.json({ reply: "My learning engine is offline without a cloud connection.", mode: "normal", status: "offline" });
        }
        try {
            const prompt = \`Analyze this chemistry request: "\${message}"
Extract:
1. isLearningRequest: boolean (true if visual structure, step-by-step process, diagram, or specific rendering is requested. false if it's a general text question).
2. entity: The recognized chemical formula (e.g. H2O, CO2, NaCl, CH4, BF3, NH3) or null. If common name like "water", output "H2O".
3. intent: One of SHOW_STRUCTURE, TEACH_PROCESS, LEWIS_STRUCTURE, IONIC_BOND_FORMATION, HYBRIDIZATION.
4. learnMode: "SHOW_ME" or "TEACH_ME". "SHOW_ME" if they just say "show me [molecule]". "TEACH_ME" if they say "teach me", "explain how", "make the process".

Output strict JSON.\`;
            const response = await client.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: { temperature: 0.1, responseMimeType: "application/json" }
            });
            const data = JSON.parse(response.text.trim());
            
            if (!data.isLearningRequest) {
                assignedAgent = "CONVERSATION_AGENT"; // fallback to standard chat
            } else {
                return res.json({
                    reply: data.learnMode === "SHOW_ME" ? \`I have projected the structural summary of \${data.entity || 'the molecule'} for you, Sir.\` : \`Initializing learning session for \${data.entity || 'the requested topic'}.\`,
                    mode: "normal",
                    status: "online",
                    learnAction: { type: 'START_SESSION', subject: data.entity || 'UNKNOWN', intent: data.intent, learnMode: data.learnMode }
                });
            }
        } catch (e) {
            console.error("Learn Agent JSON Parse Error:", e);
            assignedAgent = "CONVERSATION_AGENT";
        }
    }`;

server = server.replace(oldLearnReply, newLearnReply);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Patched server.js logic.");

const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

const apiEndpoint = `
  app.post("/api/generate-structure", async (req, res) => {
    try {
      const { objectQuery } = req.body;
      if (!objectQuery) return res.status(400).json({ error: "Missing objectQuery" });

      const ai = getGeminiClient();
      if (!ai) return res.status(500).json({ error: "Gemini client not initialized" });

      const schema = {
        type: require("@google/genai").Type.OBJECT,
        properties: {
          components: {
            type: require("@google/genai").Type.ARRAY,
            items: {
              type: require("@google/genai").Type.OBJECT,
              properties: {
                id: { type: require("@google/genai").Type.STRING },
                name: { type: require("@google/genai").Type.STRING },
                description: { type: require("@google/genai").Type.STRING },
                geometry: { 
                  type: require("@google/genai").Type.STRING,
                  description: "Geometry type. Examples: box, roundedBox, cylinder, sphere, tube, torus, cone"
                },
                position: { 
                  type: require("@google/genai").Type.ARRAY,
                  items: { type: require("@google/genai").Type.NUMBER },
                  description: "[x, y, z] in meters"
                },
                size: { 
                  type: require("@google/genai").Type.ARRAY,
                  items: { type: require("@google/genai").Type.NUMBER },
                  description: "[width, height, depth] or [radius, height, radius] in meters"
                },
                rotation: { 
                  type: require("@google/genai").Type.ARRAY,
                  items: { type: require("@google/genai").Type.NUMBER },
                  description: "[x, y, z] Euler rotation in radians"
                },
                color: { type: require("@google/genai").Type.STRING, description: "Hex color" },
                materialType: { 
                  type: require("@google/genai").Type.STRING,
                  enum: ["PBR_MATTE", "PBR_METALLIC", "PBR_GLASS", "THERMAL_HEATMAP", "XRAY_GLASS"]
                }
              }
            }
          }
        }
      };

      const prompt = \`As an expert mechanical engineer and 3D technical artist, decompose the physical object "\${objectQuery}" into a hierarchical structural assembly of 3D primitive geometric components.
Ensure:
1. Realistic proportions and correct spatial relationships.
2. Components must physically connect (no floating parts).
3. Generate multiple levels of detail: main body, mechanical systems, controls, joints, base, handles, etc.
4. The model must be fully assembled at the origin.
5. Use realistic material types and colors.
6. The size should be relative to 1.0 = 1 meter.\`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
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
      console.error("Structure Gen Error:", err);
      res.status(500).json({ error: "Failed to generate structure" });
    }
  });
`;

if (!serverCode.includes('/api/generate-structure')) {
  // Insert before app.post(["/api/advis", "/api/jarvis"]
  serverCode = serverCode.replace('  app.post(["/api/advis", "/api/jarvis"]', apiEndpoint + '\n  app.post(["/api/advis", "/api/jarvis"]');
  fs.writeFileSync('server.js', serverCode);
}

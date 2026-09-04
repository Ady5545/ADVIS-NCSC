const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(/httpOptions: \{ headers: \{ "User-Agent": "aistudio-build" \} \}/g, '');

const newEndpoint = `
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
                position: { 
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
                size: { 
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
                rotation: { 
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
                color: { type: Type.STRING },
                materialType: { 
                  type: Type.STRING,
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
6. The size should be relative to 1.0 = 1 meter.

Allowed geometry values: box, roundedBox, cylinder, sphere, tube, torus, cone, spokeWheel.
Allowed materialType values: PBR_MATTE, PBR_METALLIC, PBR_GLASS, THERMAL_HEATMAP, XRAY_GLASS.
Position, size, and rotation should be 3-element arrays of numbers.
\`;

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
      console.error("Structure Gen Error:", err.message, err.stack);
      res.status(500).json({ error: "Failed to generate structure" });
    }
  });
`;

// replace the old endpoint
const startStr = 'app.post("/api/generate-structure"';
const endStr = 'app.post(["/api/advis", "/api/jarvis"]';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newEndpoint + '\n  ' + code.substring(endIndex);
  fs.writeFileSync('server.js', code);
}

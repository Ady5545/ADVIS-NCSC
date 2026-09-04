const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

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
          reasoning: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              functionalSystems: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING }
            }
          },
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                geometry: { type: Type.STRING },
                position: { 
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } }
                },
                size: { 
                  type: Type.OBJECT,
                  properties: { w: { type: Type.NUMBER }, h: { type: Type.NUMBER }, d: { type: Type.NUMBER } }
                },
                rotation: { 
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } }
                },
                color: { type: Type.STRING },
                materialType: { type: Type.STRING },
                parentId: { type: Type.STRING }
              }
            }
          }
        }
      };

      const prompt = \`As an expert mechanical engineer and 3D technical artist, decompose the physical object "\${objectQuery}" into a hierarchical structural assembly of 3D primitive geometric components.

Process:
1. UNIVERSAL OBJECT UNDERSTANDING: Determine what the object is, its category, primary function, and physical domain.
2. FUNCTIONAL SYSTEM ANALYSIS: Identify major systems (e.g. Mechanical, Electrical, Optical).
3. STRUCTURAL DECOMPOSITION: Break it down into 8 to 15 major and secondary components.
4. COMPONENT HIERARCHY: Establish parent-child relationships between components (using parentId).
5. ASSEMBLY RELATIONSHIPS: Ensure components physically connect. Define position and rotation relative to the object's origin.
6. GEOMETRY STRATEGY SELECTION: Choose the most accurate procedural shape.
7. MATERIAL ASSIGNMENT: Assign realistic physical materials.

Ensure:
- The model must be fully assembled at the origin.
- Use realistic material types and colors.
- Size is in meters (e.g., 1.0 = 1 meter). 

Allowed geometry values: box, roundedBox, cylinder, sphere, tube, torus, cone, spokeWheel.
Allowed materialType values: PBR_MATTE, PBR_METALLIC, PBR_GLASS, THERMAL_HEATMAP, XRAY_GLASS, CARBON_FIBER, PLASTIC_ROUGH, ALUMINUM_ANODIZED, STEEL_MACHINED.
\`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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

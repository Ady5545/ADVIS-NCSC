const { GoogleGenAI, Type } = require("@google/genai");
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
            geometryStrategy: { type: Type.STRING },
            position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            size: { type: Type.OBJECT, properties: { w: { type: Type.NUMBER }, h: { type: Type.NUMBER }, d: { type: Type.NUMBER } } },
            rotation: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            color: { type: Type.STRING },
            materialType: { type: Type.STRING },
            parentId: { type: Type.STRING }
          }
        }
      }
    }
  };

  const prompt = `Decompose a "cordless power drill" into a hierarchical structural assembly of 3D primitive components.
Output 10-15 components (e.g., motor housing, grip, battery, trigger, chuck, chuck jaws, etc).
Allowed geometryStrategy values: box, roundedBox, cylinder, sphere, tube, torus, cone, spokeWheel.
Allowed materialType values: PBR_MATTE, PBR_METALLIC, PBR_GLASS.
Coordinates should be relative to origin. Size in meters (e.g. w: 0.1, h: 0.2, d: 0.05).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2
      }
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();

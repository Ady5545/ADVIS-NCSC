const { GoogleGenAI, Type } = require("@google/genai");
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
            geometry: { type: Type.STRING },
            position: { type: Type.STRING },
            size: { type: Type.STRING },
            rotation: { type: Type.STRING },
            color: { type: Type.STRING },
            materialType: { type: Type.STRING }
          }
        }
      }
    }
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate a 3D structural decomposition for a microphone. Format position, size, and rotation as comma-separated strings like "0,1.2,0".',
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.1
      }
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();

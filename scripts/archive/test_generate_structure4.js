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
            position: { type: Type.STRING, description: "format: x,y,z" },
            size: { type: Type.STRING, description: "format: w,h,d or r,h,r" },
            rotation: { type: Type.STRING, description: "format: x,y,z" },
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
      contents: 'Generate a 3D structural decomposition for a microphone.',
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

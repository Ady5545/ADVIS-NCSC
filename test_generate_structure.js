const { GoogleGenAI, Type } = require("@google/genai");
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      components: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            geometry: { type: Type.STRING, enum: ["box", "cylinder", "sphere", "tube"] },
            position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            size: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            color: { type: Type.STRING }
          }
        }
      }
    }
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: 'Generate a 3D structural decomposition for a microscope.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1
    }
  });
  console.log(response.text);
}
test();

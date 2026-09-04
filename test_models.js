const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'hello'
  });
  console.log(response.text);
}
test().catch(console.error);

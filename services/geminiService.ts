import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getConstructionAdvice = async (query: string): Promise<string> => {
  if (!apiKey) return "Please configure your API Key to use the AI Assistant.";

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are Tumbi's expert AI construction consultant. 
    Your goal is to help users calculate materials (e.g., how many bricks for a wall), suggest construction services, or explain the difference between materials.
    Keep answers concise, practical, and formatted with simple Markdown. 
    If they ask about prices, give estimates but clarify they should check the Tumbi marketplace listings.`;

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to the construction database right now.";
  }
};

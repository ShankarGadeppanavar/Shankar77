
import { GoogleGenAI } from "@google/genai";
import { Pig, PigGroup } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNutritionAdvice = async (pigs: Pig[]) => {
  const underfedCount = pigs.filter(p => p.status === 'Underfed').length;
  const avgWeight = pigs.reduce((acc, p) => acc + p.weight, 0) / pigs.length;

  const prompt = `
    Analyze the following pig farm feeding data:
    - Total Pigs: ${pigs.length}
    - Underfed Pigs: ${underfedCount}
    - Average Weight: ${avgWeight.toFixed(2)} kg
    - Groups: ${Array.from(new Set(pigs.map(p => p.group))).join(', ')}

    Provide 3 concise management tips for the farm manager to optimize feed efficiency and reduce wastage in a group feeding environment. 
    Format as short bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini advice error:", error);
    return "Ensure regular weighing and check for trough dominance issues.";
  }
};

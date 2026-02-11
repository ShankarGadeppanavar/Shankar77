
import { GoogleGenAI } from "@google/genai";
import { Pig, FeedStatus } from "../types.ts";

// Initialize AI with the environment-provided API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches AI-generated nutrition and management advice based on current herd state.
 * Uses gemini-3-pro-preview for complex reasoning over agricultural metrics.
 */
export const getNutritionAdvice = async (pigs: Pig[]) => {
  if (!pigs || pigs.length === 0) return "Add livestock to the registry to receive AI-powered insights.";

  const underfedCount = pigs.filter(p => p.status === FeedStatus.UNDERFED).length;
  const totalWeight = pigs.reduce((acc, p) => acc + p.weight, 0);
  const avgWeight = totalWeight / pigs.length;
  const groups = Array.from(new Set(pigs.map(p => p.group))).join(', ');

  const prompt = `
    Context: You are a professional livestock nutritionist analyzing a pig farm's current data.
    
    Herd Data:
    - Total Population: ${pigs.length} animals
    - Underfeeding Incident Rate: ${((underfedCount / pigs.length) * 100).toFixed(1)}% (${underfedCount} pigs)
    - Average Body Weight: ${avgWeight.toFixed(2)} kg
    - Active Management Groups: ${groups}

    Task: Provide exactly 3 high-impact, actionable management tips to optimize feed conversion ratios (FCR) and reduce waste in group-feeding troughs. 
    Focus on behavioral monitoring, formulation adjustments, or environment calibration.
    Format your response as a bulleted list using standard markdown (* Item). Use bold text (**text**) for key terms.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    return response.text || "Ensure regular weighing and check for trough dominance issues.";
  } catch (error) {
    console.error("Gemini advice error:", error);
    return "System offline. Recommended: Perform manual inspection of trough distribution and verify metabolic requirements for the **Grower** group.";
  }
};

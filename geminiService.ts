
import { GoogleGenAI } from "@google/genai";
import { ComparisonData, FilterState } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIInsights = async (comparison: ComparisonData, filters: FilterState, locationPerformance: any[]) => {
  const prompt = `
    Act as a professional retail auditor. Analyze the following store audit data comparison:
    
    Context:
    Location: ${filters.location}
    Section: ${filters.section}
    Current Score: ${comparison.currentScore.toFixed(1)}%
    Previous Score: ${comparison.previousScore.toFixed(1)}%
    Change: ${comparison.difference.toFixed(1)} percentage points (${comparison.percentageChange.toFixed(1)}%)
    Current Rating: ${comparison.rating}

    Key Performers (Locations): ${JSON.stringify(locationPerformance.map(l => ({ name: l.name, score: l.score.toFixed(1) })))}

    Please provide:
    1. A concise summary of the performance change.
    2. One highlight about locations showing significant improvement or being top performers.
    3. One critical observation about areas that need attention.
    4. A strategic recommendation for the next audit cycle.
    
    Format the output as a JSON object with keys: "summary", "improvement", "declining", "bestWorst", "recommendation".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Failed to fetch insights", error);
    return null;
  }
};

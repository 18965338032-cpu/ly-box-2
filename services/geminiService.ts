import { GoogleGenAI, Type } from "@google/genai";
import { DailyEvent } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDailyEvent = async (day: number, currentMoney: number): Promise<DailyEvent> => {
  if (!apiKey) {
    return {
      message: "The town radio is silent today. (API Key missing)",
      weather: 'Sunny',
    };
  }

  try {
    const prompt = `
      You are the narrator of a cozy farming simulation game called "Gemini Valley". 
      It is Day ${day}. The player has ${currentMoney} coins.
      
      Generate a daily morning report with:
      1. A random weather condition (Sunny, Rainy, or Cloudy).
      2. A short, charming, 1-sentence note about town news, a farming tip, or a horoscope.
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: { type: Type.STRING, enum: ['Sunny', 'Rainy', 'Cloudy'] },
            message: { type: Type.STRING },
          },
          required: ['weather', 'message']
        }
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return {
            weather: data.weather as 'Sunny' | 'Rainy' | 'Cloudy',
            message: data.message
        };
    }
    throw new Error("No text response");

  } catch (error) {
    console.error("Failed to fetch daily event:", error);
    return {
      message: "A quiet day in the valley.",
      weather: 'Sunny',
    };
  }
};
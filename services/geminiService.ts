import { GoogleGenAI } from "@google/genai";
import { NewsSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchNews = async (settings: NewsSettings) => {
  if (!process.env.API_KEY) {
      return "Błąd: Brak klucza API. Sprawdź zmienne środowiskowe.";
  }

  const model = "gemini-3-flash-preview";
  const topicsStr = settings.topics.join(', ');
  const lengthDesc = settings.length === 'short' ? 'bardzo krótkie punkty' : settings.length === 'medium' ? 'zwięzłe akapity' : 'szczegółowe podsumowania';

  const prompt = `
    Jesteś agregatorem wiadomości. Proszę wygeneruj podsumowanie bieżących wydarzeń na dziś.
    
    Tematy: ${topicsStr}
    Format: ${lengthDesc}
    Język: Cała treść musi być w języku polskim.
    
    Zwróć wynik jako tablicę JSON obiektów z kluczami: "id", "title" (tytuł), "excerpt" (streszczenie), "topic" (temat). 
    Nie używaj bloków kodu markdown. Zwróć tylko czysty ciąg znaków JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return JSON.stringify([{ id: 'err', title: 'Błąd pobierania wiadomości', excerpt: 'Nie udało się połączyć z usługą AI.', topic: 'System' }]);
  }
};
import { GoogleGenAI } from "@google/genai";
import { NewsSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchNews = async (settings: NewsSettings) => {
  if (!process.env.API_KEY) {
      return JSON.stringify([{ 
        id: 'err', 
        title: 'Błąd: Brak klucza API', 
        excerpt: 'Upewnij się, że klucz API jest skonfigurowany w zmiennych środowiskowych.', 
        topic: 'System',
        url: '#',
        source: 'System',
        date: new Date().toLocaleDateString()
      }]);
  }

  // Use a model capable of search grounding
  const model = "gemini-3-pro-preview";
  
  const topicsStr = settings.topics.join(', ');
  const lengthDesc = settings.length === 'short' ? 'bardzo krótki, 1 zdanie' : settings.length === 'medium' ? '2-3 zdania' : 'krótki akapit';
  
  // Map timeRange to human readable instruction
  let timeInstruction = "z ostatnich 24 godzin";
  if (settings.timeRange === 'week') timeInstruction = "z ostatniego tygodnia";
  if (settings.timeRange === 'month') timeInstruction = "z ostatniego miesiąca";

  const prompt = `
    Działasz jako agregator wiadomości. Użyj Google Search, aby znaleźć najnowsze, prawdziwe wiadomości na tematy: ${topicsStr}.
    Zakres czasu: ${timeInstruction}.
    
    Twoim zadaniem jest stworzenie listy JSON.
    Dla każdego znalezionego artykułu zwróć obiekt zawierający:
    - "title": Dokładny tytuł artykułu.
    - "url": Prawdziwy, bezpośredni link do artykułu (wyciągnij go z wyników wyszukiwania).
    - "source": Nazwa portalu/źródła (np. Onet, BBC, TechCrunch).
    - "date": Data publikacji (jeśli dostępna, lub "Dzisiaj"/"Wczoraj").
    - "excerpt": Krótki cytat lub streszczenie (${lengthDesc}).
    - "topic": Kategoria (jeden z tematów: ${topicsStr}).
    - "id": Unikalny losowy string.

    Ważne:
    1. Nie wymyślaj newsów. Bazuj tylko na wynikach wyszukiwania.
    2. Zwróć CZYSTY JSON (tablicę obiektów). Nie używaj markdowna (backticks).
    3. Język treści: Polski.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    // Sometimes the model might wrap response in markdown code blocks despite instructions, simplistic cleanup:
    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return text;

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return JSON.stringify([{ 
        id: 'err-net', 
        title: 'Błąd pobierania wiadomości', 
        excerpt: 'Wystąpił problem z połączeniem z usługą Google Search lub limitem zapytań.', 
        topic: 'System', 
        url: '#', 
        source: 'LifeOS', 
        date: new Date().toLocaleDateString() 
    }]);
  }
};
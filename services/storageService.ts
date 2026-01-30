import { Note, Task, CalendarEvent } from '../types';

// This service now communicates with the Netlify Serverless Function
// which acts as a secure proxy to the Neon Postgres database.

const API_URL = '/api'; // Redirects to /.netlify/functions/api configured in netlify.toml

const apiRequest = async <T>(type: 'notes' | 'tasks' | 'events', method: 'GET' | 'POST', data?: any): Promise<T[]> => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Append type as query param
    const response = await fetch(`${API_URL}?type=${type}`, options);

    if (!response.ok) {
      console.warn(`API Error for ${type}: ${response.statusText}. Falling back to empty state/local cache logic if implemented.`);
      // On connection error or offline, you might want to return an empty array or handle retry logic.
      // For this implementation, we throw to alert the app.
      throw new Error(`Server error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`Storage Service Error (${type}):`, error);
    // Fallback: If API fails (e.g. dev mode without Netlify Dev), return empty array to prevent crash
    return [];
  }
};

export const storageService = {
  notes: {
    getAll: () => apiRequest<Note>('notes', 'GET'),
    saveAll: (notes: Note[]) => apiRequest<Note>('notes', 'POST', notes),
  },
  tasks: {
    getAll: () => apiRequest<Task>('tasks', 'GET'),
    saveAll: (tasks: Task[]) => apiRequest<Task>('tasks', 'POST', tasks),
  },
  events: {
    getAll: () => apiRequest<CalendarEvent>('events', 'GET'),
    saveAll: (events: CalendarEvent[]) => apiRequest<CalendarEvent>('events', 'POST', events),
  }
};
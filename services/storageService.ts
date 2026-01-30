import { Note, Task, CalendarEvent } from '../types';

// This service communicates with the Netlify Serverless Function.
// It includes a robust fallback to LocalStorage if the backend is unreachable
// or if the database is not configured (missing DATABASE_URL).

const API_URL = '/api'; 
const USE_LOCAL_STORAGE_FALLBACK = true;

const getFromLocalStorage = <T>(key: string): T[] => {
  try {
    const item = localStorage.getItem(`lifeos_${key}`);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error('Local Storage Read Error', e);
    return [];
  }
};

const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`lifeos_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Local Storage Write Error', e);
  }
};

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

    // Attempt API fetch with a timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${API_URL}?type=${type}`, {
        ...options,
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
       // Throw to trigger fallback
       throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // On successful GET, cache data to LocalStorage for future offline use
    if (method === 'GET' && result.data) {
        saveToLocalStorage(type, result.data);
    }
    
    return result.data || [];

  } catch (error) {
    console.warn(`Backend connection failed for ${type}. Switching to Local Storage Mode.`);
    
    if (USE_LOCAL_STORAGE_FALLBACK) {
        if (method === 'GET') {
            return getFromLocalStorage<T>(type);
        } else if (method === 'POST' && data) {
            // In fallback mode, we save directly to local storage
            saveToLocalStorage(type, data);
            return data;
        }
    }
    
    // If fallback is disabled and API fails, return empty to prevent crash
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
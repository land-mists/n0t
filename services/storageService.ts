import { Note, Task, CalendarEvent } from '../types';

// In a real production app, this would make fetch() calls to the Google Sheets API
// or a serverless function acting as a proxy.
// For this standalone artifact, we mimic the "Cloud" async nature using LocalStorage.

const DELAY = 300; // Mimic network latency

const get = <T>(key: string): Promise<T[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = localStorage.getItem(key);
      resolve(data ? JSON.parse(data) : []);
    }, DELAY);
  });
};

const save = <T>(key: string, data: T[]): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(data));
      resolve();
    }, DELAY);
  });
};

export const storageService = {
  notes: {
    getAll: () => get<Note>('lifeos_notes'),
    saveAll: (notes: Note[]) => save('lifeos_notes', notes),
  },
  tasks: {
    getAll: () => get<Task>('lifeos_tasks'),
    saveAll: (tasks: Task[]) => save('lifeos_tasks', tasks),
  },
  events: {
    getAll: () => get<CalendarEvent>('lifeos_events'),
    saveAll: (events: CalendarEvent[]) => save('lifeos_events', events),
  }
};

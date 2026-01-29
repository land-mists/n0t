export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'To Do' | 'In Progress' | 'Done';

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: Status;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string; // ISO String or YYYY-MM-DDTHH:mm
  end: string;
  isRecurring: boolean;
  isTaskLinked?: boolean; // If true, this came from ToDo
}

export interface NewsSettings {
  topics: string[];
  length: 'short' | 'medium' | 'long';
  language: string;
}

export interface WeatherDataPoint {
  time: string;
  temp: number;
  humidity: number;
  wind: number;
}

export interface AppSettings {
  googleSheetId: string;
  googleClientId: string;
  weatherLocation: string;
}
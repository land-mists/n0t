export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'To Do' | 'In Progress' | 'Done';
export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  color?: string; // Hex code for sticky note color
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: Status;
  color?: string; // Hex code for sticky note color
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

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  topic: string;
  url: string;      // Link to source
  source: string;   // e.g., "Onet", "BBC"
  date: string;     // Publication date string
}

export interface NewsSettings {
  topics: string[];
  length: 'short' | 'medium' | 'long';
  language: string;
  timeRange: '24h' | 'week' | 'month'; // New filter
}

export interface WeatherDataPoint {
  time: string;
  temp: number;
  humidity: number;
  wind: number;
}

export interface AppSettings {
  googleSheetId: string;
  googleClientId: string; // OAuth Client ID
  weatherLocation: string;
  notificationsEnabled?: boolean; // New setting
  notificationTiming?: 'same-day' | '24h' | '48h'; // Configurable timing
}
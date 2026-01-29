import React from 'react';
import { LayoutDashboard, Newspaper, CloudSun, NotebookPen, CheckSquare, CalendarDays, Settings } from 'lucide-react';

export const PAGES = {
  DASHBOARD: 'dashboard',
  NEWS: 'news',
  WEATHER: 'weather',
  NOTES: 'notes',
  TODO: 'todo',
  CALENDAR: 'calendar',
  SETTINGS: 'settings',
} as const;

export const NAV_ITEMS = [
  { id: PAGES.DASHBOARD, label: 'Pulpit', icon: <LayoutDashboard size={20} /> },
  { id: PAGES.NEWS, label: 'Wiadomości', icon: <Newspaper size={20} /> },
  { id: PAGES.WEATHER, label: 'Pogoda', icon: <CloudSun size={20} /> },
  { id: PAGES.NOTES, label: 'Notatki', icon: <NotebookPen size={20} /> },
  { id: PAGES.TODO, label: 'Zadania', icon: <CheckSquare size={20} /> },
  { id: PAGES.CALENDAR, label: 'Kalendarz', icon: <CalendarDays size={20} /> },
  { id: PAGES.SETTINGS, label: 'Ustawienia', icon: <Settings size={20} /> },
];

export const NEWS_TOPICS = ['Świat', 'Polska', 'Nauka', 'AI', 'Sport', 'Biznes', 'Technologia'];

export const ADMIN_PASS = "14play14";
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, PAGES, ADMIN_PASS } from './constants.tsx';
import { Note, Task, CalendarEvent } from './types';
import { storageService } from './services/storageService';
import { LayoutDashboard, LogOut, Menu, X, Sparkles } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Weather from './pages/Weather';
import Notes from './pages/Notes';
import Todo from './pages/Todo';
import CalendarPage from './pages/Calendar';
import Login from './pages/Login';
import SettingsPage from './pages/Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>(PAGES.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global State
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialization
  useEffect(() => {
    // Always force dark mode in this theme
    document.documentElement.classList.add('dark');

    const initData = async () => {
      const [fetchedNotes, fetchedTasks, fetchedEvents] = await Promise.all([
        storageService.notes.getAll(),
        storageService.tasks.getAll(),
        storageService.events.getAll(),
      ]);
      setNotes(fetchedNotes);
      setTasks(fetchedTasks);
      setEvents(fetchedEvents);
      setLoading(false);
    };
    initData();
  }, []);

  const getCombinedEvents = () => {
    const taskEvents: CalendarEvent[] = tasks
      .filter(t => t.dueDate)
      .map(t => ({
        id: `task-${t.id}`,
        title: `[Zadanie] ${t.title}`,
        description: t.description,
        start: t.dueDate,
        end: t.dueDate,
        isRecurring: false,
        isTaskLinked: true
      }));
    return [...events, ...taskEvents];
  };

  const handleLogin = (pass: string) => {
    if (pass === ADMIN_PASS) {
      setIsAuthenticated(true);
    } else {
      alert("Nieprawidłowe hasło");
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isDarkMode={true} toggleTheme={() => {}} />;
  }

  const renderPage = () => {
    if (loading) return <div className="flex h-screen items-center justify-center text-primary font-mono text-sm tracking-widest">SYSTEM LOADING...</div>;

    switch (currentPage) {
      case PAGES.DASHBOARD:
        return <Dashboard notesCount={notes.length} tasks={tasks} events={events} onNavigate={setCurrentPage} />;
      case PAGES.NEWS:
        return <News />;
      case PAGES.WEATHER:
        return <Weather />;
      case PAGES.NOTES:
        return <Notes notes={notes} setNotes={(n) => { setNotes(n); storageService.notes.saveAll(n); }} />;
      case PAGES.TODO:
        return <Todo tasks={tasks} setTasks={(t) => { setTasks(t); storageService.tasks.saveAll(t); }} />;
      case PAGES.CALENDAR:
        return <CalendarPage events={events} setEvents={(e) => { setEvents(e); storageService.events.saveAll(e); }} combinedEvents={getCombinedEvents()} />;
      case PAGES.SETTINGS:
        return <SettingsPage />;
      default:
        return <Dashboard notesCount={notes.length} tasks={tasks} events={events} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-200 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden bg-black">
      
      {/* === STATIC SPATIAL BACKGROUND === */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Main Gradient Field */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#020617] to-black"></div>
         
         {/* Static Color Spots for Depth */}
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute top-[20%] left-[30%] w-[30vw] h-[30vw] bg-indigo-900/10 rounded-full blur-[80px]"></div>

         {/* Tech Mesh Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* === HEADER === */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 rounded-xl shadow-neon">
               <div className="bg-black p-2.5 rounded-[10px] flex items-center justify-center">
                 <LayoutDashboard size={20} className="text-cyan-400" />
               </div>
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  LifeOS <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded bg-cyan-500/10">v3.0</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Personal Core</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, { 
                    size: 16, 
                    className: currentPage === item.id ? 'text-white' : 'opacity-70' 
                })}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-white/10 mx-1 hidden md:block"></div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
              title="Wyloguj"
            >
              <LogOut size={20} />
            </button>
            <button 
              className="md:hidden p-2.5 text-slate-300 bg-white/5 rounded-xl border border-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
               {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 p-4 absolute w-full left-0 top-full z-50">
             <div className="grid grid-cols-2 gap-3">
               {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentPage(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      currentPage === item.id 
                      ? 'border-cyan-500/50 bg-cyan-900/20 text-cyan-400' 
                      : 'border-white/5 bg-white/5 text-slate-400'
                    }`}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, { className: 'mb-2' })}
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  </button>
               ))}
             </div>
          </div>
        )}
      </header>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-7xl mt-2 animate-fade-in">
        {renderPage()}
      </main>

      {/* === FOOTER === */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-black/40">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-500 tracking-wide">
            Dario Elzenberg © 2026
          </p>
          <div className="flex justify-center gap-2 mt-2 items-center opacity-50 hover:opacity-100 transition-opacity">
             <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
             <p className="text-[10px] font-mono text-cyan-500 uppercase">System Stable</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
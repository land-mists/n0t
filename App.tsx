import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, PAGES, ADMIN_PASS } from './constants.tsx';
import { Note, Task, CalendarEvent, AppSettings, SyncStatus } from './types';
import { storageService } from './services/storageService';
import { googleIntegration } from './services/googleIntegration';
import { notificationService } from './services/notificationService';
import { LayoutDashboard, LogOut, Menu, X, Cloud, CloudOff, RefreshCw, AlertTriangle, Database, Server, User, Activity, ShieldCheck, Wifi, Link } from 'lucide-react';
import { Modal } from './components/Modal';

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
  
  // Connection Status & Modal
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [dbDetails, setDbDetails] = useState<{ host: string; user: string } | null>(null);

  // Initialization
  useEffect(() => {
    // Always force dark mode in this theme
    document.documentElement.classList.add('dark');

    // Check for persistent session
    const storedAuth = localStorage.getItem('lifeos_auth_session');
    if (storedAuth === 'active') {
        setIsAuthenticated(true);
    }

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

      // Attempt Google Init if config exists
      const savedConfig = localStorage.getItem('lifeos_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as AppSettings;
        if (parsed.googleClientId) {
            setSyncStatus('connecting');
            googleIntegration.init(parsed.googleClientId, (success) => {
                if(success) {
                   setSyncStatus('disconnected'); // Ready to connect
                }
            });
        }
        
        // Parse DB details for status modal (PlanetScale)
        if (parsed.psHost && parsed.psUsername) {
             setDbDetails({
                 host: parsed.psHost,
                 user: parsed.psUsername
             });
             setSyncStatus('connected');
        }
      }
    };
    initData();
  }, []);

  // Notification Watcher
  useEffect(() => {
    if (loading || tasks.length === 0) return;

    const checkNotifications = () => {
       const savedConfig = localStorage.getItem('lifeos_config');
       if (!savedConfig) return;
       
       const config = JSON.parse(savedConfig) as AppSettings;
       if (!config.notificationsEnabled) return;

       const timing = config.notificationTiming || '24h';
       
       // Load notification log: { taskId: lastNotifiedDateString(YYYY-MM-DD) }
       // This ensures we notify once per day, but allow re-notification on subsequent days (e.g. tomorrow, then today)
       const logJson = localStorage.getItem('lifeos_notification_log');
       const notificationLog: Record<string, string> = logJson ? JSON.parse(logJson) : {};
       
       const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
       let logUpdated = false;

       // Helper: Parse YYYY-MM-DD to Local Date Midnight to avoid timezone shifts
       const parseLocalDate = (dateStr: string) => {
           const [y, m, d] = dateStr.split('-').map(Number);
           return new Date(y, m - 1, d);
       };

       // Get Today at Midnight Local Time
       const now = new Date();
       const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

       tasks.forEach(task => {
          if (task.status === 'Done') return;
          if (!task.dueDate) return;

          const taskDate = parseLocalDate(task.dueDate);
          
          // Calculate difference in Days
          const diffTime = taskDate.getTime() - todayMidnight.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          let shouldNotify = false;
          let urgencyMsg = "";

          // Skip past tasks (diffDays < 0)
          if (diffDays < 0) return;

          if (timing === 'same-day') {
              if (diffDays === 0) {
                  shouldNotify = true;
                  urgencyMsg = "Termin: Dziś!";
              }
          } 
          else if (timing === '24h') {
              if (diffDays === 0) {
                  shouldNotify = true;
                  urgencyMsg = "Termin: Dziś!";
              } else if (diffDays === 1) {
                  shouldNotify = true;
                  urgencyMsg = "Termin: Jutro";
              }
          } 
          else if (timing === '48h') {
              if (diffDays === 0) {
                  shouldNotify = true;
                  urgencyMsg = "Termin: Dziś!";
              } else if (diffDays === 1) {
                  shouldNotify = true;
                  urgencyMsg = "Termin: Jutro";
              } else if (diffDays === 2) {
                  shouldNotify = true;
                  urgencyMsg = `Termin: ${task.dueDate}`;
              }
          }

          // Check if already notified TODAY for this task
          if (shouldNotify) {
              const lastNotifiedDate = notificationLog[task.id];
              
              if (lastNotifiedDate !== todayStr) {
                  notificationService.send(`🔔 ${task.title}`, {
                     body: `${urgencyMsg}\nPriorytet: ${task.priority}`,
                     tag: `${task.id}-${todayStr}`, // Unique tag per day
                     requireInteraction: true 
                  });
                  
                  notificationLog[task.id] = todayStr;
                  logUpdated = true;
              }
          }
       });

       if (logUpdated) {
           localStorage.setItem('lifeos_notification_log', JSON.stringify(notificationLog));
       }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);

  }, [tasks, loading]);

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

  const handleLogin = (pass: string): boolean => {
    if (pass === ADMIN_PASS) {
      setIsAuthenticated(true);
      localStorage.setItem('lifeos_auth_session', 'active'); // Persist session
      return true;
    } else {
      return false;
    }
  };
  
  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('lifeos_auth_session');
      setCurrentPage(PAGES.DASHBOARD);
  };

  // Status Indicator Component
  const ConnectionIndicator = () => {
    const statusConfig = {
      disconnected: { 
        icon: <CloudOff size={14} />, 
        text: 'LOCAL', 
        className: 'text-slate-400 bg-slate-900/50 border-white/5 hover:bg-slate-800' 
      },
      connecting: { 
        icon: <RefreshCw size={14} className="animate-spin" />, 
        text: 'CONNECTING...', 
        className: 'text-cyan-400 bg-cyan-900/20 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse' 
      },
      connected: { 
        icon: <Cloud size={14} />, 
        text: 'PLANETSCALE', 
        className: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)] hover:bg-emerald-900/40 cursor-pointer' 
      },
      syncing: { 
        icon: <RefreshCw size={14} className="animate-spin" />, 
        text: 'SYNCING...', 
        className: 'text-blue-400 bg-blue-900/20 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
      },
      error: { 
        icon: <AlertTriangle size={14} />, 
        text: 'ERROR', 
        className: 'text-red-400 bg-red-900/20 border-red-500/20 hover:bg-red-900/30 cursor-pointer' 
      },
    };

    const current = statusConfig[syncStatus];

    return (
      <button 
        onClick={() => setIsStatusModalOpen(true)}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ease-in-out backdrop-blur-md ${current.className}`}
        title="Kliknij, aby zobaczyć szczegóły"
      >
        <span>{current.icon}</span>
        <span className="text-[9px] font-bold tracking-widest">{current.text}</span>
      </button>
    );
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isDarkMode={true} toggleTheme={() => {}} />;
  }

  const renderPage = () => {
    if (loading) return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-neon-cyan"></div>
        <div className="text-cyan-500 font-mono text-xs tracking-[0.3em] animate-pulse">SYSTEM LOADING...</div>
      </div>
    );

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
        return <SettingsPage syncStatus={syncStatus} setSyncStatus={setSyncStatus} />;
      default:
        return <Dashboard notesCount={notes.length} tasks={tasks} events={events} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-200 font-sans relative overflow-x-hidden bg-black selection:bg-cyan-500/30 selection:text-white">
      
      {/* === DEEP SPACE BACKGROUND === */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Base Radial Gradient */}
         <div className="absolute inset-0 bg-deep-space"></div>
         
         {/* Top Spotlight */}
         <div className="absolute top-[-20%] left-[30%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[180px] mix-blend-screen"></div>
         {/* Bottom Spotlight */}
         <div className="absolute bottom-[-20%] right-[10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
         
         {/* Noise Texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]"></div>
      </div>

      {/* === HEADER === */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl transition-all duration-300 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-[1px] rounded-xl shadow-neon-cyan group cursor-pointer hover:scale-105 transition-transform">
               <div className="bg-black/80 backdrop-blur-xl p-2.5 rounded-[10px] flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                 <LayoutDashboard size={20} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
               </div>
            </div>
            <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight flex items-center gap-3">
                  LifeOS <span className="text-[9px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded bg-cyan-500/5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">PRO</span>
                  <ConnectionIndicator />
                </h1>
                <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase">Personal Command Center</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-full border border-white/[0.08] backdrop-blur-xl shadow-inner">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative overflow-hidden flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 group ${
                  currentPage === item.id
                    ? 'text-white shadow-neon-blue border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {/* Active Background Gradient */}
                {currentPage === item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 backdrop-blur-sm"></div>
                )}
                
                {/* Content */}
                <div className="relative z-10 flex items-center gap-2">
                    {React.cloneElement(item.icon as React.ReactElement, { 
                        size: 16, 
                        className: currentPage === item.id ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'group-hover:text-cyan-400 transition-colors' 
                    })}
                    <span className="tracking-wide">{item.label}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-1 hidden md:block"></div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Wyloguj"
            >
              <LogOut size={20} />
            </button>
            <button 
              className="md:hidden p-2.5 text-slate-300 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
               {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 p-4 absolute w-full left-0 top-full z-50 shadow-2xl">
             <div className="grid grid-cols-2 gap-3">
               {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentPage(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      currentPage === item.id 
                      ? 'border-cyan-500/30 bg-cyan-900/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                      : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
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
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-7xl pt-28 animate-fade-in">
        {renderPage()}
      </main>

      {/* === FOOTER === */}
      <footer className="border-t border-white/[0.05] py-8 mt-12 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-600 tracking-wide">
            Dario Elzenberg © 2026
          </p>
          <div className="flex justify-center gap-2 mt-2 items-center opacity-50 hover:opacity-100 transition-opacity">
             <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></span>
             <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">System Active</p>
          </div>
        </div>
      </footer>

      {/* === DB STATUS MODAL === */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Szczegóły Połączenia">
         <div className="space-y-6">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
                 
                 <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-full border ${syncStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 border-white/10 text-slate-500'}`}>
                        {syncStatus === 'connected' ? <Activity size={32} className="drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> : <CloudOff size={32} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Status: {syncStatus === 'connected' ? 'POŁĄCZONO' : 'ROZŁĄCZONO'}</h3>
                        <p className="text-sm text-slate-400">{syncStatus === 'connected' ? 'Synchronizacja z PlanetScale (MySQL) aktywna.' : 'Działanie w trybie lokalnym.'}</p>
                    </div>
                 </div>

                 {dbDetails && syncStatus === 'connected' ? (
                     <div className="space-y-4">
                         <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-cyan-500/30 transition-colors">
                             <div className="flex items-center gap-3">
                                 <Database size={18} className="text-cyan-400" />
                                 <div className="flex flex-col">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Typ Bazy</span>
                                     <span className="text-sm text-white font-mono">MySQL (Vitess)</span>
                                 </div>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_lime]"></div>
                         </div>
                         
                         <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-blue-500/30 transition-colors">
                             <div className="flex items-center gap-3">
                                 <Server size={18} className="text-blue-400" />
                                 <div className="flex flex-col">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Host</span>
                                     <span className="text-sm text-white font-mono truncate max-w-[200px]" title={dbDetails.host}>{dbDetails.host}</span>
                                 </div>
                             </div>
                             <Wifi size={14} className="text-blue-500" />
                         </div>

                         <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-purple-500/30 transition-colors">
                             <div className="flex items-center gap-3">
                                 <User size={18} className="text-purple-400" />
                                 <div className="flex flex-col">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Username</span>
                                     <span className="text-sm text-white font-mono">{dbDetails.user}</span>
                                 </div>
                             </div>
                             <ShieldCheck size={14} className="text-purple-500" />
                         </div>
                     </div>
                 ) : (
                     <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                         <Database size={24} className="mx-auto text-slate-600 mb-2 opacity-50" />
                         <p className="text-sm text-slate-500">Brak skonfigurowanego połączenia PlanetScale.</p>
                         <button onClick={() => { setIsStatusModalOpen(false); setCurrentPage(PAGES.SETTINGS); }} className="mt-3 text-cyan-400 text-xs font-bold hover:underline">
                             Przejdź do Ustawień
                         </button>
                     </div>
                 )}
            </div>
            
            <div className="flex justify-end pt-2">
                <button 
                    onClick={() => setIsStatusModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl border border-white/10 text-sm font-bold uppercase tracking-wider transition-all"
                >
                    Zamknij
                </button>
            </div>
         </div>
      </Modal>

    </div>
  );
}
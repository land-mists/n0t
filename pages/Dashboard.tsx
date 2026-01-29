import React, { useState, useEffect } from 'react';
import { Note, Task, CalendarEvent, AppSettings } from '../types';
import { ArrowRight, CheckCircle2, Clock, StickyNote, CloudSun, Zap, List } from 'lucide-react';
import { PAGES } from '../constants';

interface DashboardProps {
  notesCount: number;
  tasks: Task[];
  events: CalendarEvent[];
  onNavigate: (page: string) => void;
}

const getWeatherDesc = (code: number) => {
  const codes: Record<number, string> = {
    0: 'Czyste niebo', 1: 'Pogodnie', 2: 'Częściowe zachmurzenie', 3: 'Pochmurno',
    45: 'Mgła', 48: 'Szadź', 51: 'Mżawka', 53: 'Mżawka', 55: 'Gęsta mżawka',
    61: 'Lekki deszcz', 63: 'Deszcz', 65: 'Ulewa', 
    71: 'Lekki śnieg', 73: 'Śnieg', 75: 'Silny śnieg',
    80: 'Przelotne opady', 81: 'Ulewa', 82: 'Gwałtowna ulewa',
    95: 'Burza', 96: 'Burza z gradem', 99: 'Silna burza'
  };
  return codes[code] || 'Nieznane';
};

const Dashboard: React.FC<DashboardProps> = ({ notesCount, tasks, events, onNavigate }) => {
  const [weather, setWeather] = useState<{ temp: number; city: string; desc: string } | null>(null);

  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const highPriority = pendingTasks.filter(t => t.priority === 'High');
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.start).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  useEffect(() => {
    const fetchDashboardWeather = async () => {
        const savedConfig = localStorage.getItem('lifeos_config');
        let loc = 'Skierniewice, PL';
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig) as AppSettings;
            if (parsed.weatherLocation) loc = parsed.weatherLocation;
        }

        try {
            let geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=pl&format=json`;
            let geoRes = await fetch(geoUrl);
            let geoData = await geoRes.json();

            if ((!geoData.results || geoData.results.length === 0) && loc.includes(',')) {
                const cityOnly = loc.split(',')[0].trim();
                geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOnly)}&count=1&language=pl&format=json`;
                geoRes = await fetch(geoUrl);
                geoData = await geoRes.json();
            }

            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude, name } = geoData.results[0];
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
                const wRes = await fetch(weatherUrl);
                const wData = await wRes.json();
                
                setWeather({
                    temp: Math.round(wData.current.temperature_2m),
                    city: name,
                    desc: getWeatherDesc(wData.current.weather_code)
                });
            }
        } catch (e) {
            console.error("Dashboard weather fetch error:", e);
        }
    };

    fetchDashboardWeather();
  }, []);

  const StatCard = ({ title, count, subtext, icon, gradient, onClick }: any) => (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-white/10 hover:border-cyan-500/50 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.06] shadow-lg shadow-black/50"
    >
      {/* Top Gradient Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-white/5 text-slate-200 border border-white/10 shadow-inner group-hover:text-white transition-colors">
            {icon}
          </div>
          <div className="p-2 rounded-full text-slate-500 group-hover:text-cyan-400 transition-colors">
              <ArrowRight size={18} />
          </div>
        </div>
        
        <div>
           <h3 className="text-4xl font-bold mb-1 text-white tracking-tight">{count}</h3>
           <p className="text-slate-400 font-medium tracking-wide text-sm">{title}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-cyan-400/80 flex items-center gap-1.5 font-bold uppercase tracking-wider">
               <Zap size={12} /> {subtext}
            </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Pulpit <span className="text-cyan-500">Główny</span>
          </h2>
          <p className="text-slate-400 mt-2 font-light">Centrum dowodzenia. Wszystkie systemy sprawne.</p>
        </div>
        <div className="text-right bg-white/5 p-3 rounded-xl border border-white/10">
          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1">Data</p>
          <p className="text-lg font-bold text-white">
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Zadania do zrobienia" 
          count={pendingTasks.length} 
          subtext={`${highPriority.length} Priorytetowych`}
          icon={<CheckCircle2 size={24} className="text-blue-400" />}
          gradient="from-blue-600 to-cyan-500"
          onClick={() => onNavigate(PAGES.TODO)}
        />
        <StatCard 
          title="Wydarzenia dzisiaj" 
          count={todayEvents.length} 
          subtext="Sprawdź kalendarz"
          icon={<Clock size={24} className="text-purple-400" />}
          gradient="from-purple-500 to-pink-500"
          onClick={() => onNavigate(PAGES.CALENDAR)}
        />
        <StatCard 
          title="Notatki w bazie" 
          count={notesCount} 
          subtext="Ostatnia aktualizacja"
          icon={<StickyNote size={24} className="text-emerald-400" />}
          gradient="from-emerald-500 to-teal-500"
          onClick={() => onNavigate(PAGES.NOTES)}
        />
        
        {/* Weather Card */}
        <div 
           onClick={() => onNavigate(PAGES.WEATHER)}
           className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-white/10 hover:border-cyan-500/50 transition-all duration-300 bg-gradient-to-br from-slate-900 to-black hover:from-slate-800 hover:to-black shadow-lg"
        >
          {/* Static decoration */}
          <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
                <CloudSun className="text-cyan-400" size={20} />
                <p className="text-cyan-200/70 text-xs font-bold uppercase tracking-widest">Live Weather</p>
            </div>
            
            <div className="mt-2">
                <h3 className="text-xl font-bold truncate text-white">{weather ? weather.city : 'Lokalizacja...'}</h3>
                {weather && <p className="text-sm text-slate-400 font-medium">{weather.desc}</p>}
            </div>
            
            <div className="flex items-end justify-between mt-4">
               <div>
                  {weather ? (
                      <>
                          <span className="text-5xl font-bold tracking-tighter text-white">{weather.temp}</span>
                          <span className="text-xl text-slate-500 ml-1">°C</span>
                      </>
                  ) : (
                      <div className="h-12 w-24 bg-white/10 rounded-lg"></div>
                  )}
               </div>
               <div className="p-2 bg-white/10 rounded-lg group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                   <ArrowRight size={16} />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tasks List */}
        <div className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <List size={18} className="text-blue-500" /> 
                Kolejka Zadań
            </h3>
            <button onClick={() => onNavigate(PAGES.TODO)} className="text-xs text-blue-400 hover:text-white transition-colors font-bold uppercase tracking-wider">Zobacz wszystkie</button>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {highPriority.length === 0 ? (
              <div className="p-10 text-center text-slate-600 flex flex-col items-center">
                 <CheckCircle2 size={32} className="mb-3 opacity-20" />
                 Wszystko zrobione.
              </div>
            ) : (
              highPriority.slice(0, 5).map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    <div>
                        <p className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors text-sm">{task.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{task.dueDate || 'Bez terminu'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                    Wysoki
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events List */}
        <div className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Clock size={18} className="text-purple-500" />
                Oś Czasu
            </h3>
            <button onClick={() => onNavigate(PAGES.CALENDAR)} className="text-xs text-purple-400 hover:text-white transition-colors font-bold uppercase tracking-wider">Kalendarz</button>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {events.length === 0 ? (
              <div className="p-10 text-center text-slate-600 flex flex-col items-center">
                 <Clock size={32} className="mb-3 opacity-20" />
                 Brak planów.
              </div>
            ) : (
              events.slice(0, 5).map(event => (
                <div key={event.id} className="p-4 flex items-start gap-4 hover:bg-white/[0.03] transition-colors group">
                  <div className="bg-purple-900/20 text-purple-400 p-2 rounded-lg text-center min-w-[50px] border border-purple-500/20">
                    <span className="block text-[8px] font-bold uppercase tracking-wider opacity-70">{new Date(event.start).toLocaleDateString('pl-PL', { month: 'short' })}</span>
                    <span className="block text-lg font-bold">{new Date(event.start).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 group-hover:text-purple-400 transition-colors text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
                           {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
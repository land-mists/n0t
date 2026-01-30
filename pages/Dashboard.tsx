import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, AppSettings, Priority } from '../types';
import { 
  ArrowRight, CheckCircle2, Clock, 
  CloudSun, Zap, ListTodo, CalendarDays, 
  FileStack, Activity, PieChart as PieChartIcon,
  Wind, Droplets, Thermometer, MapPin
} from 'lucide-react';
import { PAGES } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Dzień dobry";
    if (hour < 18) return "Dobrego popołudnia";
    return "Dobry wieczór";
};

const Dashboard: React.FC<DashboardProps> = ({ notesCount, tasks, events, onNavigate }) => {
  const [weather, setWeather] = useState<{ temp: number; city: string; desc: string; wind: number; humidity: number } | null>(null);

  // Filter pending tasks
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  
  // Data for Chart
  const priorityData = [
    { name: 'Wysoki', value: pendingTasks.filter(t => t.priority === 'High').length, color: '#ef4444' }, // Red-500
    { name: 'Średni', value: pendingTasks.filter(t => t.priority === 'Medium').length, color: '#06b6d4' }, // Cyan-500
    { name: 'Niski', value: pendingTasks.filter(t => t.priority === 'Low').length, color: '#64748b' }, // Slate-500
  ].filter(d => d.value > 0);

  // Sort tasks
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const priorityWeight: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (diff !== 0) return diff;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

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
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`;
                const wRes = await fetch(weatherUrl);
                const wData = await wRes.json();
                
                setWeather({
                    temp: Math.round(wData.current.temperature_2m),
                    city: name,
                    desc: getWeatherDesc(wData.current.weather_code),
                    wind: wData.current.wind_speed_10m,
                    humidity: wData.current.relative_humidity_2m
                });
            }
        } catch (e) {
            console.error("Dashboard weather fetch error:", e);
        }
    };

    fetchDashboardWeather();
  }, []);

  const getPriorityStyle = (p: Priority) => {
    switch(p) {
        case 'High': return 'bg-red-500/10 text-red-400 border-red-500/30';
        case 'Medium': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        case 'Low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* === HERO SECTION === */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                System Online
             </div>
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Operatorze</span>.
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg text-sm leading-relaxed">
             Oto podsumowanie Twojego osobistego centrum dowodzenia. Systemy działają w normie.
          </p>
        </div>
        
        {/* Date Display */}
        <div className="text-right hidden md:block">
            <p className="text-3xl font-bold text-white font-mono tracking-tighter">
                {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">
                {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>

      {/* === BENTO GRID - TOP SECTION === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        
        {/* 1. Task Distribution Chart (Large Card) */}
        <div className="lg:col-span-2 bg-[#050505]/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 relative overflow-hidden group shadow-lg flex flex-col sm:flex-row items-center gap-6">
            <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400 border border-blue-500/20">
                        <PieChartIcon size={18} />
                    </div>
                    <h3 className="font-bold text-white text-lg">Analiza Zadań</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 pl-11">Rozkład priorytetów zadań aktywnych.</p>
                
                <div className="grid grid-cols-3 gap-2">
                     <div className="bg-red-900/10 border border-red-500/10 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-white">{pendingTasks.filter(t => t.priority === 'High').length}</span>
                        <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">High</span>
                     </div>
                     <div className="bg-cyan-900/10 border border-cyan-500/10 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-white">{pendingTasks.filter(t => t.priority === 'Medium').length}</span>
                        <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">Med</span>
                     </div>
                     <div className="bg-slate-800/20 border border-slate-500/10 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-white">{pendingTasks.filter(t => t.priority === 'Low').length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Low</span>
                     </div>
                </div>
            </div>

            <div className="w-[160px] h-[160px] relative shrink-0">
                 {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={priorityData}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="w-full h-full rounded-full border-4 border-slate-800 border-dashed flex items-center justify-center">
                        <span className="text-[10px] text-slate-600">NO DATA</span>
                    </div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                     <span className="text-2xl font-bold text-white">{pendingTasks.length}</span>
                     <span className="text-[9px] text-slate-500 uppercase tracking-widest">Total</span>
                 </div>
            </div>
        </div>

        {/* 2. Quick Stats Column */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:col-span-1">
             {/* Notes Stat */}
             <div 
                onClick={() => onNavigate(PAGES.NOTES)}
                className="bg-[#050505]/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 cursor-pointer hover:border-purple-500/30 hover:bg-purple-900/5 transition-all group flex flex-col justify-between"
             >
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                        <FileStack size={18} />
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-purple-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <div className="mt-4">
                    <span className="text-3xl font-bold text-white tracking-tight">{notesCount}</span>
                    <p className="text-xs text-slate-400 font-medium">Notatki w Bazie</p>
                </div>
             </div>

             {/* Events Stat */}
             <div 
                onClick={() => onNavigate(PAGES.CALENDAR)}
                className="bg-[#050505]/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 cursor-pointer hover:border-blue-500/30 hover:bg-blue-900/5 transition-all group flex flex-col justify-between"
             >
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                        <CalendarDays size={18} />
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <div className="mt-4">
                    <span className="text-3xl font-bold text-white tracking-tight">{todayEvents.length}</span>
                    <p className="text-xs text-slate-400 font-medium">Dzisiejsze Wydarzenia</p>
                </div>
             </div>
        </div>

        {/* 3. Weather Widget (Vertical) */}
        <div 
           onClick={() => onNavigate(PAGES.WEATHER)}
           className="bg-gradient-to-br from-[#0f172a] to-black rounded-3xl border border-white/10 p-6 relative overflow-hidden group cursor-pointer lg:row-span-1 xl:col-span-1 flex flex-col justify-between min-h-[220px]"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>

            {weather ? (
                <>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400">
                             <MapPin size={14} />
                             <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[100px]">{weather.city}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                            LIVE
                        </div>
                    </div>

                    <div className="relative z-10 my-4 flex items-center justify-between">
                         <div>
                            <span className="text-5xl font-bold text-white tracking-tighter">{weather.temp}°</span>
                            <p className="text-sm text-emerald-100/60 mt-1 capitalize">{weather.desc}</p>
                         </div>
                         <CloudSun size={48} className="text-emerald-400 opacity-80 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 relative z-10 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Wind size={12} className="text-emerald-500" /> {weather.wind} km/h
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Droplets size={12} className="text-blue-500" /> {weather.humidity}%
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-xs font-mono uppercase">Skanowanie...</span>
                </div>
            )}
        </div>
      </div>

      {/* === BOTTOM LISTS === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* TASKS LIST */}
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden flex flex-col min-h-[350px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-xl text-white flex items-center gap-3">
                    <ListTodo className="text-cyan-400" size={20} /> 
                    Kolejka Operacyjna
                </h3>
                <button onClick={() => onNavigate(PAGES.TODO)} className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-white transition-colors">
                    View All
                </button>
            </div>
            
            <div className="flex-1 p-2 space-y-1">
                {sortedTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <CheckCircle2 size={32} className="mb-2" />
                        <p className="text-xs uppercase tracking-widest">Wszystkie systemy sprawne</p>
                    </div>
                ) : (
                    sortedTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="group flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5 cursor-pointer">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-1.5 h-8 rounded-full ${task.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_red]' : task.priority === 'Medium' ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-slate-600'}`}></div>
                                <div className="truncate">
                                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                                         {task.dueDate && <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Clock size={10} /> {task.dueDate}</span>}
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 text-slate-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* EVENTS LIST */}
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden flex flex-col min-h-[350px]">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-xl text-white flex items-center gap-3">
                    <CalendarDays className="text-blue-400" size={20} /> 
                    Timeline
                </h3>
                <button onClick={() => onNavigate(PAGES.CALENDAR)} className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-white transition-colors">
                    Kalendarz
                </button>
            </div>

            <div className="flex-1 p-2 space-y-1">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <Activity size={32} className="mb-2" />
                        <p className="text-xs uppercase tracking-widest">Brak sygnatur czasowych</p>
                    </div>
                ) : (
                    events.slice(0, 5).map(event => (
                        <div key={event.id} className="group flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5 cursor-pointer">
                            <div className="bg-blue-900/10 border border-blue-500/10 text-blue-400 rounded-lg p-2 text-center min-w-[50px]">
                                <span className="block text-[9px] font-bold uppercase opacity-70">{new Date(event.start).toLocaleDateString('pl-PL', {month: 'short'}).replace('.', '')}</span>
                                <span className="block text-lg font-bold leading-none mt-0.5">{new Date(event.start).getDate()}</span>
                            </div>
                            <div className="flex-1 truncate">
                                <h4 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{event.title}</h4>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
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

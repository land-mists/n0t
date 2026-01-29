import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  CloudRain, Wind, Droplets, MapPin, Edit2, Check, Sun, Sunrise, Sunset, 
  Thermometer, Gauge, SearchX, Cloud, CloudFog, CloudLightning, CloudSnow, 
  Moon, CloudSun, CloudMoon 
} from 'lucide-react';
import { AppSettings } from '../types';

interface WeatherData {
  current: {
    temp: number;
    code: number;
    windSpeed: number;
    humidity: number;
    pressure: number;
    feelsLike: number;
    desc: string;
    isDay: number;
  };
  daily: {
    sunrise: string;
    sunset: string;
    uvIndex: number;
    precipProbMax: number;
  };
  hourlyChart: any[];
  weeklyChart: any[];
}

const getWeatherDesc = (code: number) => {
  const codes: Record<number, string> = {
    0: 'Czyste niebo', 1: 'Głównie bezchmurnie', 2: 'Częściowe zachmurzenie', 3: 'Pochmurno',
    45: 'Mgła', 48: 'Szadź', 51: 'Lekka mżawka', 53: 'Mżawka', 55: 'Gęsta mżawka',
    56: 'Marznąca mżawka', 57: 'Gęsta marznąca mżawka',
    61: 'Lekki deszcz', 63: 'Deszcz', 65: 'Ulewny deszcz', 
    66: 'Marznący deszcz', 67: 'Silny marznący deszcz',
    71: 'Lekki śnieg', 73: 'Śnieg', 75: 'Silny śnieg', 77: 'Ziarnisty śnieg', 
    80: 'Przelotne opady', 81: 'Ulewne przelotne opady', 82: 'Gwałtowne ulewy',
    85: 'Przelotny śnieg', 86: 'Silny przelotny śnieg',
    95: 'Burza', 96: 'Burza z gradem', 99: 'Silna burza z gradem'
  };
  return codes[code] || 'Nieznane';
};

const getWeatherIcon = (code: number, isDay: number) => {
  const size = 120;
  const className = "text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"; 

  if (code === 0 || code === 1) return isDay ? <Sun size={size} className={className} /> : <Moon size={size} className={className} />;
  if (code === 2) return isDay ? <CloudSun size={size} className={className} /> : <CloudMoon size={size} className={className} />;
  if (code === 3) return <Cloud size={size} className={className} />;
  if (code === 45 || code === 48) return <CloudFog size={size} className={className} />;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain size={size} className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow size={size} className={className} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={size} className={className} />;
  
  return <Sun size={size} className={className} />;
};

const Weather: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [location, setLocation] = useState('Skierniewice, PL');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('lifeos_config');
    let initLoc = 'Skierniewice, PL';
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig) as AppSettings;
      if (parsed.weatherLocation) initLoc = parsed.weatherLocation;
    }
    setLocation(initLoc);
    setTempLocation(initLoc);
    fetchWeatherData(initLoc);
  }, []);

  const fetchWeatherData = async (loc: string) => {
    setLoading(true);
    setError(null);
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

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Nie znaleziono lokalizacji: ${loc}`);
      }

      const { latitude, longitude } = geoData.results[0];

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
      
      const res = await fetch(weatherUrl);
      const data = await res.json();

      const current = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      const hourlyChartData = hourly.time.slice(0, 25).map((t: string, i: number) => ({
        time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(hourly.temperature_2m[i]),
        rain: hourly.precipitation_probability[i]
      }));

      const weeklyChartData = daily.time.map((t: string, i: number) => ({
        day: new Date(t).toLocaleDateString('pl-PL', { weekday: 'short' }),
        high: Math.round(daily.temperature_2m_max[i]),
        low: Math.round(daily.temperature_2m_min[i])
      }));

      setWeather({
        current: {
          temp: Math.round(current.temperature_2m),
          code: current.weather_code,
          windSpeed: current.wind_speed_10m,
          humidity: current.relative_humidity_2m,
          pressure: Math.round(current.pressure_msl),
          feelsLike: Math.round(current.apparent_temperature),
          desc: getWeatherDesc(current.weather_code),
          isDay: current.is_day
        },
        daily: {
          sunrise: new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sunset: new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          uvIndex: daily.uv_index_max[0],
          precipProbMax: daily.precipitation_probability_max[0]
        },
        hourlyChart: hourlyChartData,
        weeklyChart: weeklyChartData
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Nie udało się pobrać danych pogodowych.");
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = () => {
    setLocation(tempLocation);
    setIsEditingLocation(false);
    fetchWeatherData(tempLocation);
    
    const savedConfig = localStorage.getItem('lifeos_config');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    config.weatherLocation = tempLocation;
    localStorage.setItem('lifeos_config', JSON.stringify(config));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveLocation();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
           <div className="flex items-center gap-3">
             <CloudSun className="text-cyan-500" size={32} />
             {isEditingLocation ? (
                 <div className="flex items-center gap-2">
                     <input 
                        type="text" 
                        value={tempLocation}
                        onChange={(e) => setTempLocation(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-b border-cyan-500 text-2xl font-bold text-white focus:outline-none min-w-[200px]"
                        autoFocus
                     />
                     <button onClick={saveLocation} className="text-green-500 hover:text-green-400 bg-green-900/20 p-1 rounded transition-colors">
                         <Check size={20} />
                     </button>
                 </div>
             ) : (
                <div className="flex items-center gap-2 group">
                    <h2 className="text-3xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors tracking-tight" onClick={() => setIsEditingLocation(true)}>
                        {location}
                    </h2>
                    <button onClick={() => setIsEditingLocation(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-400 transition-all">
                        <Edit2 size={16} />
                    </button>
                </div>
             )}
           </div>
           <p className="text-slate-400 ml-11">Stacja meteorologiczna Live.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
           <button 
             onClick={() => setPeriod('today')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === 'today' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             24 Godziny
           </button>
           <button 
             onClick={() => setPeriod('week')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === 'week' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             Tydzień
           </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-500">
            <CloudRain size={48} className="mb-4 text-cyan-500 opacity-50" />
            <p className="font-mono text-sm tracking-widest text-cyan-400">KALIBRACJA CZUJNIKÓW...</p>
        </div>
      ) : error ? (
        <div className="h-96 flex flex-col items-center justify-center text-red-400 bg-red-900/10 rounded-3xl border border-red-900/20">
            <SearchX size={48} className="mb-4" />
            <p className="font-bold">{error}</p>
            <button onClick={() => fetchWeatherData(location)} className="mt-4 px-4 py-2 bg-red-900/20 rounded-lg hover:bg-red-900/40 transition-colors text-sm border border-red-900/30">Ponów próbę</button>
        </div>
      ) : weather ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
           {/* Unified Main Card - Static Deep Space */}
           <div className="rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between min-h-[400px] relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#050505] to-[#0a0a0a] border border-white/10">
              
              <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-cyan-400 font-bold text-xs tracking-[0.2em] uppercase mb-1 border-l-2 border-cyan-500 pl-2">Teraz</p>
                        <p className="text-white/90 font-medium text-lg">
                            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', month: 'long', day: 'numeric'})}
                        </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                       {getWeatherIcon(weather.current.code, weather.current.isDay)}
                    </div>
                 </div>

                 <div className="flex items-start mt-8">
                    <h3 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">{weather.current.temp}</h3>
                    <span className="text-4xl mt-4 font-light text-cyan-400">°C</span>
                 </div>
                 <p className="text-2xl mt-2 font-medium text-cyan-100 tracking-tight">{weather.current.desc}</p>
                 <div className="flex items-center gap-2 mt-4 text-slate-300 text-sm">
                    <Thermometer size={16} className="text-cyan-400" />
                    <span>Odczuwalna: <strong className="text-white">{weather.current.feelsLike}°C</strong></span>
                 </div>
              </div>
              
              {/* Mini Details Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 mt-8 relative z-10 bg-white/[0.02] rounded-2xl p-4">
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <Wind size={12} className="text-cyan-400" /> Wiatr
                    </div>
                    <p className="text-lg font-bold">{weather.current.windSpeed} <span className="text-xs font-normal text-slate-600">km/h</span></p>
                 </div>
                 <div className="text-center border-l border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <Droplets size={12} className="text-cyan-400" /> Wilgoć
                    </div>
                    <p className="text-lg font-bold">{weather.current.humidity}<span className="text-xs font-normal text-slate-600">%</span></p>
                 </div>
                 <div className="text-center border-l border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-500 text-xs uppercase font-bold tracking-wider">
                         <Gauge size={12} className="text-cyan-400" /> Ciśnienie
                    </div>
                    <p className="text-lg font-bold">{weather.current.pressure} <span className="text-xs font-normal text-slate-600">hPa</span></p>
                 </div>
              </div>
           </div>

           {/* Detailed Metrics Grid - Glass Tiles */}
           <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                      { icon: <Sun />, label: 'Indeks UV', value: weather.daily.uvIndex },
                      { icon: <CloudRain />, label: 'Opady Max', value: `${weather.daily.precipProbMax}%` },
                      { icon: <Sunrise />, label: 'Wschód', value: weather.daily.sunrise },
                      { icon: <Sunset />, label: 'Zachód', value: weather.daily.sunset },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#050505] p-5 rounded-2xl border border-white/10 flex flex-col justify-center items-center gap-2 hover:bg-white/[0.03] transition-colors shadow-lg">
                        <div className="text-cyan-500 mb-1 opacity-80">{React.cloneElement(item.icon, { size: 20 })}</div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</span>
                        <span className="text-lg font-bold text-white">{item.value}</span>
                    </div>
                  ))}
              </div>

              {/* Chart Section */}
              <div className="bg-[#050505] rounded-3xl p-6 border border-white/10 shadow-lg h-[320px]">
                <h3 className="text-sm font-bold mb-6 text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                  {period === 'today' ? 'Wykres Temperatury (24h)' : 'Prognoza na Tydzień'}
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {period === 'today' ? (
                      <AreaChart data={weather.hourlyChart}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#22d3ee' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area type="monotone" dataKey="temp" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" name="Temperatura (°C)" />
                      </AreaChart>
                    ) : (
                        <LineChart data={weather.weeklyChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: '#ef4444'}} name="Max" />
                        <Line type="monotone" dataKey="low" stroke="#38bdf8" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: '#38bdf8'}} name="Min" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
           </div>
        </div>
      ) : null}
    </div>
  );
};

export default Weather;
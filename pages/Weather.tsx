import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  CloudRain, Wind, Droplets, MapPin, Edit2, Check, Sun, Sunrise, Sunset, 
  Thermometer, Gauge, SearchX, Cloud, CloudFog, CloudLightning, CloudSnow, 
  Moon, CloudSun, CloudMoon, Eye, Tornado, Droplet
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
    visibility: number;
    dewPoint: number;
    windGusts: number;
    cloudCover: number;
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

const WeatherIcon = ({ code, isDay }: { code: number, isDay: number }) => {
  const size = 120;
  
  let icon = <Sun size={size} />;
  let className = "text-yellow-400";

  if (code === 0 || code === 1) { // Clear
      if (isDay) {
          icon = <Sun size={size} />;
          className = "text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)]";
      } else {
          icon = <Moon size={size} />;
          className = "text-cyan-200 drop-shadow-[0_0_50px_rgba(165,243,252,0.4)]";
      }
  } else if (code === 2) { // Partly Cloudy
      if (isDay) {
          icon = <CloudSun size={size} />;
          className = "text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]";
      } else {
          icon = <CloudMoon size={size} />;
          className = "text-cyan-600 drop-shadow-[0_0_30px_rgba(8,145,178,0.3)]";
      }
  } else if (code === 3) { // Cloudy
      icon = <Cloud size={size} />;
      className = "text-slate-300 drop-shadow-[0_0_30px_rgba(203,213,225,0.2)]";
  } else if (code === 45 || code === 48) { // Fog
      icon = <CloudFog size={size} />;
      className = "text-slate-400 drop-shadow-[0_0_30px_rgba(148,163,184,0.3)]";
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) { // Rain
      icon = <CloudRain size={size} />;
      className = "text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.4)]";
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) { // Snow
      icon = <CloudSnow size={size} />;
      className = "text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]";
  } else if ([95, 96, 99].includes(code)) { // Thunder
      icon = <CloudLightning size={size} />;
      className = "text-purple-400 drop-shadow-[0_0_40px_rgba(192,132,252,0.5)]";
  }

  return (
    <div className={`${className} filter transition-all duration-1000`}>
       {icon}
    </div>
  );
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

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,visibility,dew_point_2m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
      
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
          isDay: current.is_day,
          visibility: current.visibility,
          dewPoint: current.dew_point_2m,
          windGusts: current.wind_gusts_10m,
          cloudCover: current.cloud_cover
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-900/20 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <CloudSun className="text-blue-400" size={32} />
             </div>
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
                     <button onClick={saveLocation} className="text-green-500 hover:text-green-400 bg-green-900/20 p-2 rounded-lg transition-colors border border-green-500/20">
                         <Check size={20} />
                     </button>
                 </div>
             ) : (
                <div className="flex items-center gap-2 group">
                    <h2 className="text-4xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400" onClick={() => setIsEditingLocation(true)}>
                        {location}
                    </h2>
                    <button onClick={() => setIsEditingLocation(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-400 transition-all">
                        <Edit2 size={16} />
                    </button>
                </div>
             )}
           </div>
           <p className="text-slate-400 ml-[60px] text-sm">Stacja meteorologiczna Live.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
           <button 
             onClick={() => setPeriod('today')}
             className={`px-6 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${period === 'today' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-slate-400 hover:text-white'}`}
           >
             24H
           </button>
           <button 
             onClick={() => setPeriod('week')}
             className={`px-6 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${period === 'week' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-slate-400 hover:text-white'}`}
           >
             Tydzień
           </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-3xl border border-white/5 animate-pulse">
            <CloudRain size={48} className="mb-4 text-cyan-500 opacity-50" />
            <p className="font-mono text-sm tracking-widest text-cyan-400">ANALIZA ATMOSFERYCZNA...</p>
        </div>
      ) : error ? (
        <div className="h-96 flex flex-col items-center justify-center text-red-400 bg-red-900/10 rounded-3xl border border-red-900/20 shadow-neon-red">
            <SearchX size={48} className="mb-4" />
            <p className="font-bold">{error}</p>
            <button onClick={() => fetchWeatherData(location)} className="mt-4 px-4 py-2 bg-red-900/20 rounded-lg hover:bg-red-900/40 transition-colors text-sm border border-red-900/30">Ponów próbę</button>
        </div>
      ) : weather ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
           {/* Unified Main Card - Futuristic Cockpit */}
           <div className="rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between min-h-[450px] relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] border border-white/10 group">
              
              {/* Dynamic Background */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
              <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] group-hover:bg-blue-600/30 transition-colors duration-1000"></div>
              <div className="absolute bottom-[-30%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] group-hover:bg-purple-600/20 transition-colors duration-1000"></div>

              <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-cyan-400 font-bold text-xs tracking-[0.3em] uppercase mb-1 border-l-2 border-cyan-500 pl-3">Live Feed</p>
                        <p className="text-white/90 font-medium text-lg tracking-wide">
                            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', month: 'long', day: 'numeric'})}
                        </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 shadow-glass-inset backdrop-blur-md">
                       <WeatherIcon code={weather.current.code} isDay={weather.current.isDay} />
                    </div>
                 </div>

                 <div className="flex items-start mt-10 relative">
                    <h3 className="text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl">{weather.current.temp}</h3>
                    <span className="text-5xl mt-6 font-thin text-cyan-400">°C</span>
                 </div>
                 <p className="text-3xl mt-4 font-medium text-cyan-100 tracking-tight drop-shadow-md">{weather.current.desc}</p>
                 <div className="flex items-center gap-3 mt-6 text-slate-300 text-sm bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                    <Thermometer size={16} className="text-cyan-400" />
                    <span>Odczuwalna: <strong className="text-white">{weather.current.feelsLike}°C</strong></span>
                 </div>
              </div>
              
              {/* Mini Details Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 mt-8 relative z-10 bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                 <div className="text-center group/item">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                         <Wind size={12} className="text-cyan-400" /> Wiatr
                    </div>
                    <p className="text-xl font-bold group-hover/item:text-cyan-300 transition-colors">{weather.current.windSpeed} <span className="text-xs font-normal text-slate-600">km/h</span></p>
                 </div>
                 <div className="text-center border-l border-white/10 group/item">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                         <Droplets size={12} className="text-blue-400" /> Wilgoć
                    </div>
                    <p className="text-xl font-bold group-hover/item:text-blue-300 transition-colors">{weather.current.humidity}<span className="text-xs font-normal text-slate-600">%</span></p>
                 </div>
                 <div className="text-center border-l border-white/10 group/item">
                    <div className="flex items-center justify-center gap-1 mb-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                         <Gauge size={12} className="text-purple-400" /> Ciśnienie
                    </div>
                    <p className="text-xl font-bold group-hover/item:text-purple-300 transition-colors">{weather.current.pressure} <span className="text-xs font-normal text-slate-600">hPa</span></p>
                 </div>
              </div>
           </div>

           {/* Detailed Metrics Grid - Glass Tiles */}
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                      { icon: <Sun />, label: 'Indeks UV', value: weather.daily.uvIndex, color: 'text-yellow-400' },
                      { icon: <CloudRain />, label: 'Opady Max', value: `${weather.daily.precipProbMax}%`, color: 'text-blue-400' },
                      { icon: <Sunrise />, label: 'Wschód', value: weather.daily.sunrise, color: 'text-orange-400' },
                      { icon: <Sunset />, label: 'Zachód', value: weather.daily.sunset, color: 'text-indigo-400' },
                      { icon: <Eye />, label: 'Widoczność', value: `${(weather.current.visibility / 1000).toFixed(1)} km`, color: 'text-teal-400' },
                      { icon: <Droplet />, label: 'Punkt Rosy', value: `${weather.current.dewPoint}°C`, color: 'text-cyan-400' },
                      { icon: <Tornado />, label: 'Porywy', value: `${weather.current.windGusts} km/h`, color: 'text-slate-200' },
                      { icon: <Cloud />, label: 'Chmury', value: `${weather.current.cloudCover}%`, color: 'text-slate-400' },
                  ].map((item, i) => (
                    <div key={i} className="glass-panel p-5 rounded-2xl flex flex-col justify-center items-center gap-2 hover:bg-white/[0.05] transition-all hover:scale-105 shadow-lg group bg-gradient-to-br from-slate-900/40 to-black/60">
                        <div className={`${item.color} mb-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-300 drop-shadow-md`}>{React.cloneElement(item.icon, { size: 24 })}</div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</span>
                        <span className="text-lg font-bold text-white">{item.value}</span>
                    </div>
                  ))}
              </div>

              {/* Chart Section */}
              <div className="glass-panel rounded-3xl p-6 shadow-xl h-[340px] bg-gradient-to-br from-slate-900/60 to-black/80 border border-white/10 relative overflow-hidden">
                {/* Background Grid Accent */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

                <h3 className="text-xs font-bold mb-6 text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></span>
                  {period === 'today' ? 'Wykres Temperatury (24h)' : 'Prognoza na Tydzień'}
                </h3>
                <div className="h-[250px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    {period === 'today' ? (
                      <AreaChart data={weather.hourlyChart}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#22d3ee' }}
                            labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Area type="monotone" dataKey="temp" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" name="Temperatura (°C)" />
                      </AreaChart>
                    ) : (
                        <LineChart data={weather.weeklyChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                             contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#cbd5e1' }}
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
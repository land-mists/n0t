import React, { useState, useEffect } from 'react';
import { NEWS_TOPICS } from '../constants';
import { NewsSettings, NewsItem } from '../types';
import { fetchNews } from '../services/geminiService';
import { Modal } from '../components/Modal';
import { Settings, RefreshCw, Globe2, ExternalLink, Calendar, Plus, X, Search } from 'lucide-react';

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Custom topic input state
  const [customTopic, setCustomTopic] = useState('');
  
  const [settings, setSettings] = useState<NewsSettings>({
    topics: ['Świat', 'Polska', 'Technologia'],
    length: 'medium',
    language: 'Polish',
    timeRange: '24h'
  });

  const loadNews = async () => {
    setLoading(true);
    const jsonString = await fetchNews(settings);
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        setNews(parsed);
      }
    } catch (e) {
      console.error("Failed to parse news", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleTopicToggle = (topic: string) => {
    setSettings(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) 
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !settings.topics.includes(customTopic.trim())) {
        setSettings(prev => ({
            ...prev,
            topics: [...prev.topics, customTopic.trim()]
        }));
        setCustomTopic('');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-white flex items-center gap-2">
             <Globe2 className="text-cyan-500" /> Globalny Wywiad
           </h2>
           <p className="text-slate-400 mt-1">Agregator wiadomości z Google Search.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadNews}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-cyan-400/20"
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            {loading ? 'Wyszukiwanie...' : 'Odśwież'}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 border border-white/10 rounded-xl hover:bg-white/10 bg-white/5 text-slate-300 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-[#0a0a0a] h-64 rounded-2xl p-6 border border-white/5">
                    <div className="flex justify-between mb-6">
                        <div className="h-4 bg-white/5 rounded w-1/4"></div>
                        <div className="h-4 bg-white/5 rounded w-1/4"></div>
                    </div>
                    <div className="h-5 bg-white/10 rounded w-full mb-3"></div>
                    <div className="h-5 bg-white/10 rounded w-2/3 mb-6"></div>
                    <div className="h-3 bg-white/5 rounded w-full mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-full mb-2"></div>
                </div>
            ))
        ) : news.length > 0 ? (
            news.map((item, idx) => (
                <article key={idx} className="bg-[#050505] rounded-2xl p-0 border border-white/10 shadow-lg hover:shadow-neon hover:border-cyan-500/30 transition-all duration-300 flex flex-col group relative overflow-hidden h-full">
                    {/* Header Info */}
                    <div className="p-6 pb-2">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/20">
                                {item.topic}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Calendar size={10} /> {item.date}
                            </span>
                        </div>
                        
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block group-hover:text-cyan-400 transition-colors"
                        >
                            <h3 className="text-lg font-bold leading-tight text-white mb-1">{item.title}</h3>
                        </a>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 font-mono">
                            <span>Źródło:</span>
                            <span className="text-slate-300 font-bold">{item.source}</span>
                        </div>
                    </div>

                    {/* Excerpt Body */}
                    <div className="px-6 pb-6 flex-grow">
                        <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-white/10 pl-3">
                            "{item.excerpt}"
                        </p>
                    </div>

                    {/* Footer Action */}
                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-cyan-500 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                            Czytaj więcej <ExternalLink size={12} />
                        </a>
                    </div>
                </article>
            ))
        ) : (
             <div className="col-span-3 text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                 <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                 <p className="text-slate-500">Nie znaleziono wiadomości dla wybranych kryteriów.</p>
                 <button onClick={() => setIsSettingsOpen(true)} className="mt-4 text-cyan-500 hover:underline text-sm">Zmień ustawienia</button>
             </div>
        )}
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Konfiguracja Źródeł">
         <div className="space-y-6">
            
            {/* Custom Topics Input */}
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Dodaj Własny Temat</label>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTopic()}
                        placeholder="np. Astronomia, Real Madryt..."
                        className="flex-1 p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-sm placeholder:text-slate-700"
                    />
                    <button 
                        onClick={handleAddCustomTopic}
                        className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors border border-white/10"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Aktywne Tematy</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {/* Predefined Constants */}
                    {NEWS_TOPICS.map(topic => (
                        <button
                            key={topic}
                            onClick={() => handleTopicToggle(topic)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                settings.topics.includes(topic)
                                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'
                                : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            {topic}
                        </button>
                    ))}
                    {/* User Added Topics (showing if active but not in CONSTANT list) */}
                    {settings.topics.filter(t => !NEWS_TOPICS.includes(t)).map(topic => (
                         <div key={topic} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border bg-cyan-900/30 text-cyan-400 border-cyan-500/50">
                            {topic}
                            <button onClick={() => handleTopicToggle(topic)} className="hover:text-white ml-1"><X size={12} /></button>
                         </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Długość Excerpt</label>
                    <select 
                        value={settings.length}
                        onChange={(e) => setSettings({...settings, length: e.target.value as any})}
                        className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-sm"
                    >
                        <option value="short">Krótkie (1 zdanie)</option>
                        <option value="medium">Średnie (2-3 zdania)</option>
                        <option value="long">Długie (Akapit)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Data Publikacji</label>
                    <select 
                        value={settings.timeRange}
                        onChange={(e) => setSettings({...settings, timeRange: e.target.value as any})}
                        className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-sm"
                    >
                        <option value="24h">Ostatnie 24h</option>
                        <option value="week">Ostatni Tydzień</option>
                        <option value="month">Ostatni Miesiąc</option>
                    </select>
                </div>
            </div>
            
            <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                    onClick={() => { setIsSettingsOpen(false); loadNews(); }}
                    className="bg-cyan-600 text-white px-6 py-2.5 rounded-xl hover:bg-cyan-500 font-bold transition-all shadow-lg shadow-cyan-900/20 text-sm border border-cyan-400/20"
                >
                    Zapisz i Szukaj
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default News;
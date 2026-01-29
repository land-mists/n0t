import React, { useState, useEffect } from 'react';
import { NEWS_TOPICS } from '../constants';
import { NewsSettings } from '../types';
import { fetchNews } from '../services/geminiService';
import { Modal } from '../components/Modal';
import { Settings, RefreshCw, Globe2 } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  topic: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<NewsSettings>({
    topics: ['Świat', 'Nauka', 'Technologia'],
    length: 'medium',
    language: 'Polish'
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white flex items-center gap-2">
             <Globe2 className="text-cyan-500" /> Globalny Wywiad
           </h2>
           <p className="text-slate-400 mt-1">Przegląd informacji AI dobrany do Twoich zainteresowań.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadNews}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-cyan-400/20"
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            {loading ? 'Analizowanie...' : 'Odśwież'}
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
                <div key={i} className="animate-pulse bg-[#0a0a0a] h-56 rounded-2xl p-6 border border-white/5">
                    <div className="h-4 bg-white/5 rounded w-1/4 mb-6"></div>
                    <div className="h-4 bg-white/10 rounded w-full mb-3"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3 mb-6"></div>
                    <div className="h-3 bg-white/5 rounded w-full mb-2"></div>
                </div>
            ))
        ) : news.length > 0 ? (
            news.map((item, idx) => (
                <div key={idx} className="bg-[#050505] rounded-2xl p-7 border border-white/10 shadow-lg hover:shadow-neon hover:border-cyan-500/30 transition-all duration-300 flex flex-col group relative overflow-hidden">
                    {/* Gradient Overlay */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>
                    
                    <div className="mb-4 flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/20">
                            {item.topic}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold mb-3 line-clamp-2 text-slate-100 group-hover:text-cyan-400 transition-colors relative z-10">{item.title}</h3>
                    <p className="text-slate-400 text-sm flex-grow leading-relaxed relative z-10">
                        {item.excerpt}
                    </p>
                    <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-600 flex justify-between font-mono relative z-10">
                         <span>AI GENERATED</span>
                         <span>{new Date().toLocaleDateString('pl-PL')}</span>
                    </div>
                </div>
            ))
        ) : (
             <div className="col-span-3 text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                 <p className="text-slate-500">Nie udało się pobrać wiadomości. Sprawdź klucz API.</p>
             </div>
        )}
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Konfiguracja Wiadomości">
         <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Interesujące Tematy</label>
                <div className="flex flex-wrap gap-2">
                    {NEWS_TOPICS.map(topic => (
                        <button
                            key={topic}
                            onClick={() => handleTopicToggle(topic)}
                            className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                                settings.topics.includes(topic)
                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-900/40'
                                : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Długość Streszczenia</label>
                <select 
                    value={settings.length}
                    onChange={(e) => setSettings({...settings, length: e.target.value as any})}
                    className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
                >
                    <option value="short">Krótkie (Punkty)</option>
                    <option value="medium">Średnie (Podsumowanie)</option>
                    <option value="long">Długie (Szczegółowa analiza)</option>
                </select>
            </div>
            
            <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                    onClick={() => { setIsSettingsOpen(false); loadNews(); }}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-500 font-bold transition-all shadow-lg shadow-cyan-900/20 text-sm"
                >
                    Zapisz i Wygeneruj
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default News;
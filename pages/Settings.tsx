import React, { useState, useEffect } from 'react';
import { AppSettings, SyncStatus } from '../types';
import { googleIntegration } from '../services/googleIntegration';
import { Save, Shield, Database, Cloud, Key, CheckCircle2, AlertTriangle, RefreshCcw, Settings, Link2, Unlink } from 'lucide-react';

interface SettingsProps {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ syncStatus, setSyncStatus }) => {
  const [config, setConfig] = useState<AppSettings>({
    googleSheetId: '',
    googleClientId: '',
    weatherLocation: 'Skierniewice, PL'
  });
  const [isSaved, setIsSaved] = useState(false);

  // Check if Gemini API Key is present in environment (read-only)
  const hasApiKey = !!process.env.API_KEY;

  useEffect(() => {
    // Load from local storage on mount
    const savedConfig = localStorage.getItem('lifeos_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('lifeos_config', JSON.stringify(config));
    
    // Re-initialize Google if Client ID changed
    if (config.googleClientId) {
       googleIntegration.init(config.googleClientId, (success) => {
         if(success && syncStatus === 'disconnected') {
           // Ready to connect
         }
       });
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleGoogleConnect = () => {
    setSyncStatus('connecting');
    googleIntegration.login(
      () => {
        setSyncStatus('connected');
      },
      (error) => {
        console.error(error);
        setSyncStatus('error');
      }
    );
  };

  const handleGoogleDisconnect = () => {
    googleIntegration.logout();
    setSyncStatus('disconnected');
  };

  const handleResetData = () => {
    if (confirm("Jesteś pewien? To usunie wszystkie lokalne dane (Notatki, Zadania, Kalendarz) i przywróci ustawienia domyślne. Tej operacji nie można cofnąć.")) {
      localStorage.removeItem('lifeos_notes');
      localStorage.removeItem('lifeos_tasks');
      localStorage.removeItem('lifeos_events');
      localStorage.removeItem('lifeos_config');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Settings size={32} className="text-cyan-500" /> Konfiguracja Systemu
        </h2>
        <p className="text-slate-400 mt-1">Zarządzaj połączeniami chmurowymi i kluczami dostępu.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Gemini API Status Card */}
        <div className="bg-[#050505] rounded-2xl border border-white/10 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-900/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex gap-4">
              <div className="p-3 bg-purple-900/20 rounded-xl text-purple-400 h-fit border border-purple-500/20">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Google Gemini AI</h3>
                <p className="text-sm text-slate-400 mt-1">Status klucza API do generowania wiadomości i analizy.</p>
                
                <div className="mt-4 flex items-center gap-2">
                  {hasApiKey ? (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20">
                      <CheckCircle2 size={16} /> Klucz API Aktywny
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20">
                      <AlertTriangle size={16} /> Brak Klucza API
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono ml-2">process.env.API_KEY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Cloud / Sheets Config */}
        <div className="bg-[#050505] rounded-2xl border border-white/10 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-900/10 rounded-bl-full"></div>
           
           <div className="flex justify-between items-start relative z-10 mb-6">
               <div className="flex gap-4">
                  <div className="p-3 bg-green-900/20 rounded-xl text-green-400 h-fit border border-green-500/20">
                    <Cloud size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Google Workspace</h3>
                    <p className="text-sm text-slate-400 mt-1">Konfiguracja połączenia z Arkuszami Google i Kalendarzem.</p>
                    
                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                        {syncStatus === 'connected' ? (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/30">
                                <Link2 size={12} /> POŁĄCZONO Z KONTEM
                             </span>
                        ) : syncStatus === 'error' ? (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
                                <AlertTriangle size={12} /> BŁĄD AUTORYZACJI
                             </span>
                        ) : (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
                                <Unlink size={12} /> NIEPOŁĄCZONY
                             </span>
                        )}
                    </div>
                  </div>
               </div>
               
               {/* Connect Buttons */}
               <div className="flex flex-col gap-2">
                   {syncStatus === 'connected' ? (
                       <button onClick={handleGoogleDisconnect} className="px-4 py-2 text-sm text-red-400 hover:text-white border border-red-900/30 hover:bg-red-900/20 rounded-lg transition-colors font-medium">
                           Rozłącz Konto
                       </button>
                   ) : (
                       <button 
                           onClick={handleGoogleConnect} 
                           disabled={!config.googleClientId}
                           className="px-4 py-2 text-sm bg-white text-black hover:bg-slate-200 rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                       >
                           <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                           Zaloguj przez Google
                       </button>
                   )}
               </div>
           </div>

           <div className="space-y-5 border-t border-white/5 pt-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Identyfikator Klienta (OAuth 2.0 Client ID)</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={config.googleClientId}
                    onChange={(e) => setConfig({...config, googleClientId: e.target.value})}
                    placeholder="np. 123456789-abc.apps.googleusercontent.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-white font-mono text-sm transition-all placeholder:text-slate-700"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Wymagane do logowania. Utwórz w <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-cyan-500 hover:underline">Google Cloud Console</a>.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">ID Arkusza Google (Spreadsheet ID)</label>
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={config.googleSheetId}
                    onChange={(e) => setConfig({...config, googleSheetId: e.target.value})}
                    placeholder="np. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-white font-mono text-sm transition-all placeholder:text-slate-700"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">ID arkusza z paska adresu URL, w którym przechowywane będą dane.</p>
              </div>
           </div>
        </div>

        {/* Data Management */}
        <div className="bg-[#050505] rounded-2xl border border-white/10 p-8 border-l-4 border-l-red-500/50">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-white">Zarządzanie Danymi</h3>
               <p className="text-sm text-slate-400 mt-1">Operacje na lokalnej bazie danych przeglądarki.</p>
             </div>
             <button 
               onClick={handleResetData}
               className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors border border-red-500/20"
             >
               <RefreshCcw size={16} /> Resetuj Dane
             </button>
           </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-105 ${
            isSaved 
            ? 'bg-green-600 text-white' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-cyan-900/50'
          }`}
        >
          {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {isSaved ? 'Zapisano!' : 'Zapisz Konfigurację'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
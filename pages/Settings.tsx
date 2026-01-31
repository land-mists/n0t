import React, { useState, useEffect } from 'react';
import { AppSettings, SyncStatus } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { Save, Key, CheckCircle2, AlertTriangle, RefreshCcw, Settings, Bell, BellRing, Clock, ShieldAlert, Database, Eye, EyeOff, Link, Fingerprint, Smartphone, Copy, ArrowDownCircle, Check, Server } from 'lucide-react';

interface SettingsProps {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ syncStatus, setSyncStatus }) => {
  const [config, setConfig] = useState<AppSettings>({
    googleSheetId: '',
    googleClientId: '',
    weatherLocation: 'Skierniewice, PL',
    notificationsEnabled: false,
    notificationTiming: '24h',
    psHost: '',
    psUsername: '',
    psPassword: ''
  });
  
  const [originalConfig, setOriginalConfig] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [permissionState, setPermissionState] = useState(notificationService.getPermissionState());
  const [showKey, setShowKey] = useState(false);
  const [dbConnectionCheck, setDbConnectionCheck] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  
  // Mobile Sync State
  const [transferToken, setTransferToken] = useState('');
  const [importError, setImportError] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);

  const hasApiKey = !!process.env.API_KEY;
  const hasUnsavedChanges = JSON.stringify(config) !== originalConfig;

  useEffect(() => {
    const savedConfig = localStorage.getItem('lifeos_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const loadedConfig = { 
            ...parsed, 
            notificationsEnabled: parsed.notificationsEnabled === true,
            notificationTiming: parsed.notificationTiming || '24h',
            weatherLocation: parsed.weatherLocation || 'Skierniewice, PL',
            psHost: parsed.psHost || '',
            psUsername: parsed.psUsername || '',
            psPassword: parsed.psPassword || ''
        };
        setConfig(loadedConfig);
        setOriginalConfig(JSON.stringify(loadedConfig));
      } catch (e) {
        console.error("Error parsing config", e);
        setOriginalConfig(JSON.stringify(config));
      }
    } else {
        setOriginalConfig(JSON.stringify(config));
    }
    setPermissionState(notificationService.getPermissionState());
  }, []);

  const handleSave = () => {
    localStorage.setItem('lifeos_config', JSON.stringify(config));
    setOriginalConfig(JSON.stringify(config));
    setIsSaved(true);
    
    if (config.notificationsEnabled) {
        notificationService.send("Ustawienia Zapisane", { body: "System powiadomień jest aktywny." });
    }
    
    // Reset DB check status on save
    setDbConnectionCheck('idle');

    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (confirm("Jesteś pewien? To usunie wszystkie lokalne dane (Notatki, Zadania, Kalendarz) i przywróci ustawienia domyślne.")) {
      localStorage.removeItem('lifeos_notes');
      localStorage.removeItem('lifeos_tasks');
      localStorage.removeItem('lifeos_events');
      localStorage.removeItem('lifeos_config');
      localStorage.removeItem('lifeos_notification_log');
      window.location.reload();
    }
  };

  const toggleNotifications = async () => {
    if (!config.notificationsEnabled) {
      // Trying to enable - Request Permission
      if (Notification.permission === 'denied') {
          alert("Uprawnienia do powiadomień są zablokowane w przeglądarce. Odblokuj je w ustawieniach strony.");
          setPermissionState('denied');
          return;
      }

      const granted = await notificationService.requestPermission();
      setPermissionState(Notification.permission);
      
      if (granted) {
        setConfig(prev => ({ ...prev, notificationsEnabled: true }));
      } else {
        alert("Brak zgody na powiadomienia.");
      }
    } else {
      // Disabling
      setConfig(prev => ({ ...prev, notificationsEnabled: false }));
    }
  };

  const testNotification = async () => {
    if (Notification.permission !== 'granted') {
        const granted = await notificationService.requestPermission();
        if (!granted) return;
    }
    
    notificationService.send("Test Systemu LifeOS", {
      body: "Powiadomienia działają poprawnie!",
      tag: "test-notification"
    });
  };

  const testDbConnection = async () => {
    setDbConnectionCheck('checking');
    
    // We need to save to LS for the storage service to pick it up immediately during this test
    const tempConfig = { ...config };
    localStorage.setItem('lifeos_config', JSON.stringify(tempConfig));

    try {
        const res = await storageService.notes.getAll();
        // If we get an array (even empty), connection is good.
        if (Array.isArray(res)) {
            setDbConnectionCheck('success');
            setSyncStatus('connected');
        } else {
            setDbConnectionCheck('error');
            setSyncStatus('error');
        }
    } catch (e) {
        console.error(e);
        setDbConnectionCheck('error');
        setSyncStatus('error');
    }
  };

  // --- MOBILE SYNC LOGIC ---

  const generateTransferToken = () => {
    try {
        const payload = JSON.stringify(config);
        // Create base64 string
        const token = btoa(payload);
        navigator.clipboard.writeText(token);
        setTokenCopied(true);
        setTimeout(() => setTokenCopied(false), 3000);
    } catch (e) {
        alert("Błąd generowania tokenu.");
    }
  };

  const handleImportToken = () => {
      if (!transferToken) return;
      setImportError('');
      
      try {
          // Decode
          const decoded = atob(transferToken);
          const parsed = JSON.parse(decoded);
          
          // Basic validation
          if (typeof parsed === 'object') {
              setConfig(prev => ({ ...prev, ...parsed }));
              setTransferToken('');
              alert("Konfiguracja wczytana pomyślnie! Kliknij 'Zapisz Zmiany' na dole.");
          } else {
              setImportError("Nieprawidłowy format tokenu.");
          }
      } catch (e) {
          setImportError("Nieprawidłowy token (Base64 Error).");
      }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Settings size={32} className="text-cyan-500" /> Konfiguracja Systemu
        </h2>
        <p className="text-slate-400 mt-1">Dostosuj zachowanie aplikacji LifeOS.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* --- MOBILE SYNC SECTION (NEW) --- */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-cyan-500/20">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/30">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Szybka Konfiguracja (Mobile)</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Zamiast wpisywać klucze ręcznie na telefonie, wygeneruj token na komputerze i wklej go tutaj.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Export Button */}
                    <button 
                        onClick={generateTransferToken}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:text-white"
                        title="Skopiuj wszystkie obecne ustawienia do schowka"
                    >
                        {tokenCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        {tokenCopied ? 'Skopiowano!' : 'Kopiuj Ustawienia'}
                    </button>
                </div>
            </div>

            {/* Import Input */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <ArrowDownCircle size={12} /> Wklej Token Tutaj
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={transferToken}
                        onChange={(e) => setTransferToken(e.target.value)}
                        placeholder="Wklej długi ciąg znaków tutaj..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-white font-mono text-xs shadow-inner"
                    />
                    <button 
                        onClick={handleImportToken}
                        disabled={!transferToken}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20"
                    >
                        Wczytaj
                    </button>
                </div>
                {importError && <p className="text-red-400 text-xs mt-2 font-mono">{importError}</p>}
            </div>
        </div>

        {/* Cloud Database Config */}
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-105"></div>
           
           <div className="flex flex-col gap-6 relative z-10">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-white h-fit border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <Database size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">PlanetScale (MySQL)</h3>
                            <p className="text-sm text-slate-400 mt-1">Skonfiguruj połączenie z bazą danych PlanetScale.</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            dbConnectionCheck === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            dbConnectionCheck === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            dbConnectionCheck === 'checking' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-slate-800 text-slate-500 border-white/10'
                        }`}>
                            {dbConnectionCheck === 'checking' && <RefreshCcw size={12} className="animate-spin" />}
                            {dbConnectionCheck === 'success' && <CheckCircle2 size={12} />}
                            {dbConnectionCheck === 'error' && <AlertTriangle size={12} />}
                            {dbConnectionCheck === 'idle' ? 'Rozłączono' : dbConnectionCheck === 'checking' ? 'Testowanie...' : dbConnectionCheck === 'success' ? 'Połączono' : 'Błąd'}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                <Server size={12} /> Host
                            </label>
                            <input 
                                type="text"
                                value={config.psHost}
                                onChange={(e) => setConfig({...config, psHost: e.target.value})}
                                placeholder="aws.connect.psdb.cloud"
                                className="w-full pl-4 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/20 outline-none text-white font-mono text-sm transition-all shadow-inner"
                            />
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                    <Fingerprint size={12} /> Username
                                </label>
                                <input 
                                    type="text"
                                    value={config.psUsername}
                                    onChange={(e) => setConfig({...config, psUsername: e.target.value})}
                                    placeholder="username"
                                    className="w-full pl-4 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/20 outline-none text-white font-mono text-sm transition-all shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                    <Key size={12} /> Password
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showKey ? "text" : "password"}
                                        value={config.psPassword}
                                        onChange={(e) => setConfig({...config, psPassword: e.target.value})}
                                        placeholder="pscale_pw_..."
                                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/20 outline-none text-white font-mono text-sm transition-all shadow-inner"
                                    />
                                    <button 
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                         </div>

                        <p className="text-[10px] text-slate-600 mt-2">
                            Pobierz te dane z panelu PlanetScale (przycisk &quot;Connect&quot; &rarr; &quot;Connect with Node.js&quot;).
                        </p>
                        
                        <div className="mt-4 flex justify-end">
                             <button 
                                onClick={testDbConnection}
                                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                             >
                                 <RefreshCcw size={14} className={dbConnectionCheck === 'checking' ? 'animate-spin' : ''} />
                                 Testuj Połączenie
                             </button>
                        </div>
                    </div>
                  </div>
               </div>
           </div>
        </div>
        
        {/* API Status */}
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden flex items-center justify-between">
           <div className="flex gap-4">
              <div className="p-3 bg-purple-900/20 rounded-xl text-purple-400 h-fit border border-purple-500/20">
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Google Gemini AI</h3>
                <p className="text-sm text-slate-400 mt-1">Status integracji z modelem językowym.</p>
                <div className="mt-2 text-xs font-mono text-slate-500">
                    {hasApiKey ? 'API KEY PRESENT' : 'MISSING API KEY (Check .env)'}
                </div>
              </div>
            </div>
            {hasApiKey ? (
                <CheckCircle2 className="text-emerald-500" size={32} />
            ) : (
                <AlertTriangle className="text-red-500" size={32} />
            )}
        </div>

        {/* Notifications Config */}
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
           
           <div className="flex flex-col gap-6 relative z-10">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400 h-fit border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <BellRing size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">Powiadomienia Zadań</h3>
                            <p className="text-sm text-slate-400 mt-1">Alerty o nadchodzących terminach (Deadline).</p>
                        </div>
                        <button 
                            onClick={toggleNotifications}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none border border-white/10 ${config.notificationsEnabled ? 'bg-cyan-600 shadow-[0_0_15px_cyan]' : 'bg-slate-800'}`}
                          >
                              <span className={`${config.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md`} />
                        </button>
                    </div>

                    {/* Permission Warning */}
                    {config.notificationsEnabled && permissionState === 'denied' && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-200 text-xs">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span>System wykrył blokadę powiadomień. Kliknij ikonę kłódki w pasku adresu przeglądarki i zezwól na powiadomienia dla tej strony.</span>
                        </div>
                    )}
                    
                    {/* Settings Body */}
                    <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${config.notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                       <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                           <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                               <Clock size={12} /> Czas Powiadomienia
                           </label>
                           <select 
                              value={config.notificationTiming} 
                              onChange={(e) => setConfig({...config, notificationTiming: e.target.value as any})}
                              className="w-full bg-transparent text-white font-medium text-sm outline-none cursor-pointer"
                           >
                               <option value="same-day">Tylko w dniu terminu</option>
                               <option value="24h">1 dzień przed + w dniu terminu</option>
                               <option value="48h">2 dni przed + w dniu terminu</option>
                           </select>
                           <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                               {config.notificationTiming === 'same-day' && "Otrzymasz powiadomienie tylko w dniu, w którym mija termin zadania."}
                               {config.notificationTiming === '24h' && "Otrzymasz powiadomienie dzień przed terminem oraz w dniu terminu."}
                               {config.notificationTiming === '48h' && "Otrzymasz powiadomienia 2 dni przed, 1 dzień przed oraz w dniu terminu."}
                           </p>
                       </div>

                       <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col justify-center items-center">
                           <button 
                             onClick={testNotification}
                             disabled={!config.notificationsEnabled}
                             className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/10 text-xs font-bold uppercase tracking-wide"
                           >
                             <Bell size={14} /> Wyślij Test
                           </button>
                           <p className="text-[10px] text-slate-600 mt-2">Sprawdź czy przeglądarka wyświetla alerty.</p>
                       </div>
                    </div>
                  </div>
               </div>
           </div>
        </div>

        {/* Data Management */}
        <div className="glass-panel rounded-2xl p-8 border-l-4 border-l-red-500/50">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <div>
               <h3 className="text-lg font-bold text-white">Strefa Niebezpieczna</h3>
               <p className="text-sm text-slate-400 mt-1">Resetowanie bazy danych aplikacji.</p>
             </div>
             <button 
               onClick={handleResetData}
               className="flex items-center gap-2 px-5 py-2.5 bg-red-950/30 text-red-400 rounded-xl hover:bg-red-900/50 transition-colors border border-red-500/20 hover:border-red-500/40 shadow-lg hover:shadow-red-900/20"
             >
               <RefreshCcw size={16} /> Fabryczny Reset
             </button>
           </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${hasUnsavedChanges ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all transform hover:scale-105 ${
            isSaved 
            ? 'bg-emerald-600 text-white shadow-emerald-900/50 ring-2 ring-emerald-400/50' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-cyan-500/40 ring-1 ring-white/20'
          }`}
        >
          {isSaved ? <CheckCircle2 size={24} className="animate-bounce" /> : <Save size={24} />}
          <span className="text-lg">{isSaved ? 'Zapisano!' : 'Zapisz Zmiany'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
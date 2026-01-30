import React, { useState } from 'react';
import { Lock, ShieldCheck, Fingerprint, ScanEye, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (pass: string) => boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    
    // Call parent handler, expect boolean return for success/fail
    const success = onLogin(pass);
    
    if (!success) {
      setError(true);
      setPass(''); // Clear password on error
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white relative overflow-hidden font-sans">
      
      {/* Static Spatial Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a]"></div>
          
          {/* Static Glows */}
          <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
          
          {/* Static Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
          <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-cyan-900/10 to-transparent"></div>
      </div>
      
      <div className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black border border-white/10 relative z-10 overflow-hidden mb-8">
        
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-[1px] opacity-50 transition-colors duration-300 ${error ? 'bg-red-500' : 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent'}`}></div>

        <div className="p-10 text-center relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border transition-all duration-300 ${error ? 'bg-red-900/20 border-red-500/30 shadow-red-900/20' : 'bg-gradient-to-br from-slate-900 to-black shadow-cyan-900/20 border-white/10'}`}>
            {error ? <AlertCircle className="text-red-500 w-8 h-8" /> : <Lock className="text-cyan-500 w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-mono">SYSTEM ACCESS</h2>
          <div className={`flex items-center justify-center gap-2 mt-3 ${error ? 'text-red-400' : 'text-cyan-500/60'}`}>
             <ShieldCheck size={14} />
             <p className="text-[10px] font-mono tracking-widest uppercase">
                 {error ? 'Access Denied' : 'Secure Protocol v4.0'}
             </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-10 pb-10">
          <div className="mb-8 relative">
            <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] font-mono transition-colors ${error ? 'text-red-400' : 'text-slate-500'}`}>
                {error ? 'Invalid Credential' : 'Identity Key'}
            </label>
            <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''} ${error ? 'animate-pulse' : ''}`}>
               <Fingerprint className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-slate-600'}`} size={18} />
               <input
                type="password"
                value={pass}
                onFocus={() => { setIsFocused(true); setError(false); }}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-black border outline-none transition-all text-white text-center tracking-[0.5em] font-mono text-lg placeholder:tracking-normal placeholder:text-slate-700
                    ${error 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
                        : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
                    }
                `}
                placeholder="PASSWORD"
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg uppercase tracking-widest text-xs border 
                ${error 
                    ? 'bg-red-900/30 text-red-400 border-red-500/30 hover:bg-red-900/50 shadow-red-900/20' 
                    : 'bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white border-white/10 shadow-cyan-900/30'
                }`}
          >
            {error ? 'Retry' : 'Authenticate'}
          </button>
        </form>
        <div className="py-3 bg-black/50 text-center border-t border-white/5 flex justify-between px-8">
           <span className="text-[9px] text-slate-600 font-mono">STATUS: {error ? 'BREACH' : 'LOCKED'}</span>
           <span className="text-[9px] text-slate-600 font-mono">ID: 14-PL-OS</span>
        </div>
      </div>

      <div className="relative z-10 text-slate-600 text-[10px] font-mono tracking-widest uppercase">
        Dario Elzenberg © 2026 // Neural Link Established
      </div>
    </div>
  );
};

export default Login;
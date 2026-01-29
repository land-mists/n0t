import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      {/* Holographic Container */}
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-3xl shadow-2xl shadow-cyan-900/20 border border-white/10 relative overflow-hidden">
        
        {/* Top Glow Gradient */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-white/10 border border-transparent transition-all p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};
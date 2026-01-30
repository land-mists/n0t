import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Glass Card Container */}
      <div className="w-full max-w-lg rounded-3xl shadow-[0_0_80px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] border border-white/20 dark:border-white/[0.08] relative overflow-hidden animate-fade-in bg-white/80 dark:bg-[#030712]/90 backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/[0.05] z-10 flex flex-col max-h-[85vh]">
        
        {/* Subtle Blue/Cyan Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>
        
        {/* Floating Gradient Blobs */}
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[300px] h-[300px] bg-cyan-500/20 dark:bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

        {/* Top Shine Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-70"></div>

        {/* Header */}
        <div className="relative flex justify-between items-center p-6 border-b border-black/5 dark:border-white/[0.06] bg-white/[0.01] shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 drop-shadow-sm dark:drop-shadow-md z-10">
            {/* Accent Pill */}
            <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
            {title}
          </h2>
          
          {/* Prominent Close Button */}
          <button 
            onClick={onClose} 
            className="group relative p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-red-500 dark:hover:bg-red-500 border border-black/10 dark:border-white/10 hover:border-red-400 dark:hover:border-red-400 transition-all duration-300 active:scale-90 flex items-center justify-center z-10 shadow-lg hover:shadow-red-500/30"
            title="Zamknij"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="relative p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20 text-slate-700 dark:text-slate-200 leading-relaxed z-10">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

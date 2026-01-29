import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { Modal } from '../components/Modal';
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, CalendarDays } from 'lucide-react';

interface CalendarProps {
  events: CalendarEvent[]; // Raw events
  combinedEvents: CalendarEvent[]; // Events + Tasks
  setEvents: (events: CalendarEvent[]) => void;
}

const CalendarPage: React.FC<CalendarProps> = ({ events, combinedEvents, setEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({});

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const days = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCurrentEvent({ start: dateStr + 'T09:00', end: dateStr + 'T10:00' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (currentEvent.id) {
        setEvents(events.map(e => e.id === currentEvent.id ? currentEvent as CalendarEvent : e));
    } else {
        const newEvent: CalendarEvent = {
            id: Math.random().toString(36).substr(2, 9),
            title: currentEvent.title || 'Nowe Wydarzenie',
            description: currentEvent.description || '',
            start: currentEvent.start || '',
            end: currentEvent.end || '',
            isRecurring: currentEvent.isRecurring || false,
            isTaskLinked: false
        };
        setEvents([...events, newEvent]);
    }
    setIsModalOpen(false);
    setCurrentEvent({});
  };

  const handleDelete = (id: string) => {
      if(confirm("Usunąć to wydarzenie?")) {
          setEvents(events.filter(e => e.id !== id));
          setIsModalOpen(false);
      }
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return combinedEvents.filter(e => e.start.startsWith(dateStr));
  };

  const getHolidayName = (day: number, month: number) => {
    const holidays: Record<string, string> = {
        "01-01": "Nowy Rok",
        "01-06": "Trzech Króli",
        "05-01": "Święto Pracy",
        "05-03": "3 Maja",
        "08-15": "Wniebowzięcie",
        "11-01": "Wszystkich Św.",
        "11-11": "Niepodległości",
        "12-24": "Wigilia",
        "12-25": "Boże Narodzenie",
        "12-26": "Drugi dzień św.",
    };
    const dateKey = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays[dateKey] || null;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center bg-[#050505] p-6 rounded-2xl shadow-lg border border-white/10">
        <div className="flex items-center gap-4">
           <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft /></button>
           <h2 className="text-xl font-bold w-48 text-center text-white flex items-center justify-center gap-2">
             <CalendarDays className="text-cyan-500" />
             {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
           </h2>
           <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight /></button>
        </div>
        <button 
           onClick={() => { setCurrentEvent({start: new Date().toISOString().slice(0,16)}); setIsModalOpen(true); }}
           className="mt-4 md:mt-0 bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-500 flex items-center gap-2 shadow-lg shadow-cyan-900/20 font-bold transition-all border border-cyan-400/20"
        >
           <Plus size={18} /> Dodaj Wydarzenie
        </button>
      </div>

      <div className="bg-[#050505] rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5">
          {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(day => (
            <div key={day} className={`py-4 text-center text-xs font-bold uppercase tracking-wider ${day === 'Sob' || day === 'Ndz' ? 'text-red-400' : 'text-slate-400'}`}>
                {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid Body */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {blanks.map(i => <div key={`blank-${i}`} className="h-32 border-b border-r border-white/5 bg-white/[0.01]" />)}
          
          {days.map(day => {
            const dayObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === dayObj.toDateString();
            const dayOfWeek = dayObj.getDay(); 
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const holidayName = getHolidayName(day, currentDate.getMonth());
            const isFreeDay = isWeekend || holidayName;

            const dayEvents = getEventsForDay(day);

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`min-h-[140px] border-b border-r border-white/5 p-2 cursor-pointer transition-colors relative group 
                    ${isFreeDay 
                        ? 'bg-red-900/5 hover:bg-red-900/10' 
                        : 'hover:bg-cyan-500/[0.03]'
                    }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg 
                        ${isToday 
                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                            : isFreeDay 
                                ? 'text-red-400' 
                                : 'text-slate-400'
                        }`
                    }>
                    {day}
                    </span>
                    {holidayName && <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter opacity-80 text-right leading-tight max-w-[70px]">{holidayName}</span>}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                  {dayEvents.map((ev, i) => (
                    <div 
                      key={i}
                      onClick={(e) => {
                          e.stopPropagation();
                          if(!ev.isTaskLinked) {
                             setCurrentEvent(ev);
                             setIsModalOpen(true);
                          }
                      }}
                      className={`text-[10px] p-1.5 rounded-md border truncate flex items-center gap-1.5 transition-all hover:translate-x-1 ${
                        ev.isTaskLinked 
                        ? 'bg-white/5 text-slate-400 border-white/10 opacity-70' 
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      }`}
                    >
                      {ev.isTaskLinked ? "✓" : <Clock size={10} />}
                      {ev.title}
                    </div>
                  ))}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} className="text-slate-500 hover:text-cyan-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentEvent.id ? 'Szczegóły Wydarzenia' : 'Zaplanuj'}>
        <div className="space-y-5">
             {currentEvent.isTaskLinked && (
                 <div className="bg-blue-900/20 text-blue-300 p-4 rounded-xl text-xs font-mono mb-4 border border-blue-500/20 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                     SYNC: To zadanie pochodzi z listy ToDo.
                 </div>
             )}
            
            <div className={`${currentEvent.isTaskLinked ? 'opacity-50 pointer-events-none' : ''} space-y-5`}>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Tytuł</label>
                    <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                    value={currentEvent.title || ''}
                    onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                    placeholder="Nazwa wydarzenia"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Opis</label>
                    <textarea 
                    className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 h-24 transition-all placeholder:text-slate-700"
                    value={currentEvent.description || ''}
                    onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                    placeholder="Szczegóły..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Start</label>
                        <input 
                            type="datetime-local" 
                            className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-xs transition-all"
                            value={currentEvent.start || ''}
                            onChange={(e) => setCurrentEvent({...currentEvent, start: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Koniec</label>
                        <input 
                            type="datetime-local" 
                            className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-xs transition-all"
                            value={currentEvent.end || ''}
                            onChange={(e) => setCurrentEvent({...currentEvent, end: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            {!currentEvent.isTaskLinked && (
                <div className="flex justify-between pt-6 border-t border-white/10 mt-4">
                    {currentEvent.id && (
                         <button onClick={() => handleDelete(currentEvent.id!)} className="text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors text-xs font-bold uppercase tracking-wider"><Trash2 size={16} /> Usuń</button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">Anuluj</button>
                        <button onClick={handleSave} className="bg-cyan-600 text-white px-8 py-2.5 rounded-xl hover:bg-cyan-500 font-bold shadow-lg shadow-cyan-900/20 transition-all">Zapisz</button>
                    </div>
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
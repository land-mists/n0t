import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from '../types';
import { Modal } from '../components/Modal';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LayoutList, Columns, Edit, AlertCircle, CalendarRange, PartyPopper, MapPin, AlignLeft, Clock } from 'lucide-react';

interface CalendarProps {
  events: CalendarEvent[]; // Raw events
  combinedEvents: CalendarEvent[]; // Events + Tasks
  setEvents: (events: CalendarEvent[]) => void;
}

type ViewType = 'month' | 'week' | 'day' | 'year';

const CalendarPage: React.FC<CalendarProps> = ({ events, combinedEvents, setEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenuEvent, setActionMenuEvent] = useState<CalendarEvent | null>(null); 
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({});
  
  // Tooltip State
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 8 AM
  useEffect(() => {
    if ((view === 'week' || view === 'day') && scrollRef.current) {
        scrollRef.current.scrollTop = 480; 
    }
  }, [view]);

  // --- Helpers ---

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  };

  const navigate = (direction: 'prev' | 'next') => {
      const val = direction === 'next' ? 1 : -1;
      const newDate = new Date(currentDate);
      
      if (view === 'month') {
          newDate.setMonth(newDate.getMonth() + val);
      } else if (view === 'week') {
          newDate.setDate(newDate.getDate() + (val * 7));
      } else if (view === 'year') {
          newDate.setFullYear(newDate.getFullYear() + val);
      } else {
          newDate.setDate(newDate.getDate() + val);
      }
      setCurrentDate(newDate);
  };

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };

  const getHolidayName = (date: Date) => {
    const holidays: Record<string, string> = {
        "01-01": "Nowy Rok", "01-06": "Trzech Króli", "05-01": "Święto Pracy", "05-03": "3 Maja",
        "08-15": "Wniebowzięcie", "11-01": "Wszystkich Św.", "11-11": "Niepodległości",
        "12-24": "Wigilia", "12-25": "Boże Narodzenie", "12-26": "Drugi dzień św.",
    };
    const dateKey = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays[dateKey] || null;
  };

  // --- Interaction Handlers ---

  const handleEventMouseEnter = (e: React.MouseEvent, ev: CalendarEvent) => {
      setHoveredEvent(ev);
      updateTooltipPos(e);
  };

  const handleHolidayMouseEnter = (e: React.MouseEvent, holidayName: string, date: Date) => {
      const fakeEvent: CalendarEvent = {
          id: 'holiday-tooltip', title: holidayName, description: 'Święto państwowe',
          start: date.toISOString(), end: date.toISOString(), isRecurring: false, isTaskLinked: false
      };
      setHoveredEvent(fakeEvent);
      updateTooltipPos(e);
  }

  const handleEventMouseMove = (e: React.MouseEvent) => updateTooltipPos(e);
  const handleEventMouseLeave = () => setHoveredEvent(null);
  const updateTooltipPos = (e: React.MouseEvent) => setTooltipPos({ x: e.clientX + 20, y: e.clientY + 20 });

  const handleEventClick = (e: React.MouseEvent, ev: CalendarEvent) => {
      e.stopPropagation();
      setActionMenuEvent(ev);
  };

  const handleDayClick = (date: Date, hour: number = 9) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const startHourStr = String(hour).padStart(2, '0');
    const endHourStr = String(hour + 1).padStart(2, '0');
    
    setCurrentEvent({ 
        start: `${dateStr}T${startHourStr}:00`, 
        end: `${dateStr}T${endHourStr}:00` 
    });
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
      setEvents(events.filter(e => e.id !== id));
      setActionMenuEvent(null);
  };

  // --- Views ---

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const weekDays = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8 animate-fade-in">
            {months.map(monthIndex => {
                const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
                const daysInMonth = getDaysInMonth(monthDate);
                const firstDayOfWeek = monthDate.getDay(); 
                const adjustedStartDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                
                return (
                    <div key={monthIndex} className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-black/40 transition-colors group">
                        <h3 className="text-sm font-bold text-cyan-500 mb-4 capitalize text-left tracking-wide pl-1 border-l-2 border-cyan-500/50">
                            {monthDate.toLocaleDateString('pl-PL', { month: 'long' })}
                        </h3>
                        
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map(d => (
                                <div key={d} className="text-[10px] text-slate-600 text-center font-bold">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: adjustedStartDay }).map((_, i) => <div key={`blank-${i}`} />)}
                            
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(currentDate.getFullYear(), monthIndex, day);
                                const dateStr = date.toISOString().split('T')[0];
                                const isToday = isSameDay(new Date(), date);
                                const hasEvents = combinedEvents.some(e => e.start.startsWith(dateStr));
                                const holiday = getHolidayName(date);

                                return (
                                    <div
                                        key={day}
                                        onClick={() => { setCurrentDate(date); setView('day'); }}
                                        className={`aspect-square flex flex-col items-center justify-center text-[10px] rounded-lg cursor-pointer transition-all relative
                                            ${isToday ? 'bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-900/50' : 'text-slate-400 hover:text-white hover:bg-white/10'}
                                            ${holiday && !isToday ? 'text-red-400' : ''}
                                        `}
                                    >
                                        {day}
                                        {hasEvents && !isToday && (
                                            <div className={`w-1 h-1 rounded-full mt-0.5 ${holiday ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
    const daysInMonth = getDaysInMonth(currentDate);
    const blanks = Array.from({ length: startDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[750px] shadow-2xl animate-fade-in">
            <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5">
                {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(day => (
                    <div key={day} className={`py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] ${day === 'Sob' || day === 'Ndz' ? 'text-red-400/70' : 'text-slate-500'}`}>
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-1">
                {blanks.map(i => <div key={`blank-${i}`} className="border-b border-r border-white/5 bg-white/[0.005]" />)}
                
                {days.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = isSameDay(new Date(), date);
                    const holiday = getHolidayName(date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dateStr = date.toISOString().split('T')[0];
                    const dayEvents = combinedEvents.filter(e => e.start.startsWith(dateStr));

                    return (
                        <div 
                            key={day} 
                            onClick={() => handleDayClick(date)}
                            onMouseEnter={(e) => holiday && handleHolidayMouseEnter(e, holiday, date)}
                            onMouseMove={handleEventMouseMove}
                            onMouseLeave={handleEventMouseLeave}
                            className={`border-b border-r border-white/5 p-2 transition-all relative group flex flex-col gap-1 min-h-[120px]
                                ${isToday ? 'bg-cyan-900/5' : isWeekend ? 'bg-black/40' : 'hover:bg-white/[0.02]'}
                            `}
                        >
                            <div className="flex justify-center mb-1">
                                <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                                    ${isToday 
                                        ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110' 
                                        : holiday ? 'text-red-400 bg-red-900/10' : isWeekend ? 'text-slate-500' : 'text-slate-300'
                                    }`
                                }>
                                {day}
                                </span>
                            </div>
                            
                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] scrollbar-none">
                                {dayEvents.slice(0, 4).map((ev, i) => (
                                    <div 
                                        key={i}
                                        onClick={(e) => handleEventClick(e, ev)}
                                        onMouseEnter={(e) => { e.stopPropagation(); handleEventMouseEnter(e, ev); }}
                                        onMouseMove={handleEventMouseMove}
                                        onMouseLeave={handleEventMouseLeave}
                                        className={`text-[10px] px-2 py-1 rounded-md truncate font-medium cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-2 flex items-center gap-1.5
                                            ${ev.isTaskLinked 
                                                ? 'bg-purple-900/20 text-purple-200 border-purple-500 hover:bg-purple-900/40' 
                                                : 'bg-blue-900/20 text-blue-200 border-blue-500 hover:bg-blue-900/40'
                                            }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${ev.isTaskLinked ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                                        <span className="truncate">{ev.title}</span>
                                    </div>
                                ))}
                                {dayEvents.length > 4 && <div className="text-[9px] text-center text-slate-600 font-bold">+{dayEvents.length - 4} więcej</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderTimeGridView = (daysToShow: number) => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days = Array.from({ length: daysToShow }, (_, i) => {
        const d = new Date(view === 'week' ? startOfWeek : currentDate);
        d.setDate(d.getDate() + i);
        return d;
    });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentHour = new Date().getHours();

    return (
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[750px] overflow-hidden animate-fade-in">
             {/* Header Row */}
             <div className="flex border-b border-white/5 bg-white/[0.02]">
                <div className="w-16 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-md z-20"></div>
                {days.map((date, i) => {
                    const isToday = isSameDay(new Date(), date);
                    const holiday = getHolidayName(date);
                    return (
                        <div 
                            key={i} 
                            className={`flex-1 py-4 text-center border-r border-white/5 last:border-r-0 relative
                                ${isToday ? 'bg-gradient-to-b from-cyan-900/20 to-transparent' : ''}
                            `}
                        >
                             <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-cyan-400' : holiday ? 'text-red-400' : 'text-slate-500'}`}>
                                 {date.toLocaleDateString('pl-PL', { weekday: 'short' })}
                             </div>
                             <div className={`text-2xl font-black ${isToday ? 'text-white' : holiday ? 'text-red-200' : 'text-slate-400'}`}>
                                 {date.getDate()}
                             </div>
                        </div>
                    );
                })}
             </div>
             
             {/* Scrollable Area */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                 <div className="flex relative min-h-[1440px]"> 
                    
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-md sticky left-0 z-30 shadow-r-lg">
                        {hours.map(h => (
                            <div key={h} className="h-[60px] border-b border-transparent text-[10px] text-slate-500 font-mono text-right pr-3 pt-2 relative">
                                <span className="-top-3 relative">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {days.map((date, dayIdx) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = combinedEvents.filter(e => e.start.startsWith(dateStr));
                        const isToday = isSameDay(new Date(), date);

                        return (
                            <div key={dayIdx} className="flex-1 border-r border-white/5 relative last:border-r-0">
                                {/* Horizontal Grid Lines */}
                                {hours.map(h => (
                                    <div 
                                        key={h} 
                                        onClick={() => handleDayClick(date, h)}
                                        className="h-[60px] border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                                    />
                                ))}
                                
                                {/* Events */}
                                {dayEvents.map((ev) => {
                                    const start = new Date(ev.start);
                                    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 60*60*1000); 
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                                    
                                    return (
                                        <div 
                                            key={ev.id}
                                            onClick={(e) => handleEventClick(e, ev)}
                                            onMouseEnter={(e) => handleEventMouseEnter(e, ev)}
                                            onMouseMove={handleEventMouseMove}
                                            onMouseLeave={handleEventMouseLeave}
                                            style={{ top: `${startMinutes}px`, height: `${Math.max(durationMinutes, 25)}px` }}
                                            className={`absolute left-1 right-1 rounded-lg px-3 py-1 text-xs border-l-4 overflow-hidden cursor-pointer hover:z-20 transition-all shadow-lg group
                                                ${ev.isTaskLinked 
                                                ? 'bg-gradient-to-r from-purple-900/60 to-purple-900/40 border-purple-500 text-purple-100 hover:brightness-110' 
                                                : 'bg-gradient-to-r from-blue-900/60 to-blue-900/40 border-blue-500 text-blue-100 hover:brightness-110'
                                                }`}
                                        >
                                            <div className="font-bold text-[11px] truncate flex items-center gap-1.5">
                                                <span className="opacity-70 font-mono text-[10px]">
                                                    {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                                </span>
                                                {ev.title}
                                            </div>
                                            {durationMinutes > 45 && (
                                                <div className="text-[10px] opacity-70 truncate mt-0.5">
                                                    {ev.description || (ev.isTaskLinked ? 'Zadanie ToDo' : '')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Current Time Line */}
                                {isToday && (
                                    <div 
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                                        style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}
                                    >
                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5 shadow-[0_0_10px_red]"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
             </div>
        </div>
    );
  };

  const getHeaderLabel = () => {
      if (view === 'year') return currentDate.getFullYear().toString();
      if (view === 'month') return currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      if (view === 'day') return currentDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      if (start.getMonth() === end.getMonth()) {
          return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('pl-PL', { month: 'long' })}`;
      }
      return `${start.getDate()} ${start.toLocaleDateString('pl-PL', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('pl-PL', { month: 'short' })}`;
  };

  return (
    <div className="space-y-6 relative h-full">
       {/* Glass Header */}
       <div className="flex flex-col xl:flex-row justify-between items-center bg-black/40 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/10 gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-6 w-full xl:w-auto">
           <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
               <button onClick={() => navigate('prev')} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                   <ChevronLeft size={18} />
               </button>
               <button onClick={() => {setCurrentDate(new Date())}} className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors">
                   Dziś
               </button>
               <button onClick={() => navigate('next')} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                   <ChevronRight size={18} />
               </button>
           </div>
           
           <h2 className="text-xl font-bold text-white capitalize tracking-tight drop-shadow-md">
             {getHeaderLabel()}
           </h2>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
                {(['year', 'month', 'week', 'day'] as const).map((v) => (
                    <button 
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            view === v 
                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' 
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {v === 'year' ? 'Rok' : v === 'month' ? 'Miesiąc' : v === 'week' ? 'Tydzień' : 'Dzień'}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => { setCurrentEvent({start: new Date().toISOString().slice(0,16)}); setIsModalOpen(true); }}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-cyan-500 hover:to-blue-500 flex items-center gap-2 shadow-lg shadow-cyan-900/20 font-bold transition-all border border-white/10 text-sm"
            >
                <Plus size={18} /> <span className="hidden lg:inline">Dodaj</span>
            </button>
        </div>
      </div>

      <div className="min-h-[600px]">
          {view === 'year' && renderYearView()}
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderTimeGridView(7)}
          {view === 'day' && renderTimeGridView(1)}
      </div>

      {hoveredEvent && (
        <div 
            className="fixed z-[100] bg-[#030712]/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,1)] pointer-events-none min-w-[220px] max-w-[300px] animate-fade-in"
            style={{ left: Math.min(tooltipPos.x, window.innerWidth - 320), top: Math.min(tooltipPos.y, window.innerHeight - 200) }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${hoveredEvent.id === 'holiday-tooltip' ? 'bg-red-500' : hoveredEvent.isTaskLinked ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {hoveredEvent.id === 'holiday-tooltip' ? 'Święto' : 'Wydarzenie'}
                </span>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{hoveredEvent.title}</h4>
            {hoveredEvent.description && (
                <p className="text-slate-400 text-xs mt-2 pt-2 border-t border-white/10">{hoveredEvent.description}</p>
            )}
            {!hoveredEvent.id.includes('holiday') && (
                <div className="mt-2 flex gap-2 text-[10px] font-mono text-slate-500">
                    <Clock size={12} />
                    {new Date(hoveredEvent.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                    - {new Date(hoveredEvent.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
            )}
        </div>
      )}

      {/* Action Choice Modal */}
      <Modal isOpen={!!actionMenuEvent} onClose={() => setActionMenuEvent(null)} title="Zarządzaj Wydarzeniem">
         <div className="space-y-4">
             <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 bg-cyan-500/10 rounded-full blur-xl -mr-5 -mt-5"></div>
                 <h3 className="text-lg font-bold text-white mb-1 relative z-10">{actionMenuEvent?.title}</h3>
                 <p className="text-slate-400 text-sm font-mono relative z-10">
                     {actionMenuEvent?.start && new Date(actionMenuEvent.start).toLocaleString([], {weekday: 'long', day:'numeric', month: 'long', hour:'2-digit', minute:'2-digit'})}
                 </p>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => { setCurrentEvent(actionMenuEvent!); setActionMenuEvent(null); setIsModalOpen(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-cyan-900/20 border border-white/5 hover:border-cyan-500/30 transition-all group"
                 >
                     <Edit size={24} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                     <span className="text-sm font-bold text-slate-300 group-hover:text-white">Edytuj</span>
                 </button>

                 {!actionMenuEvent?.isTaskLinked ? (
                    <button 
                        onClick={() => handleDelete(actionMenuEvent!.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-red-900/20 border border-white/5 hover:border-red-500/30 transition-all group"
                    >
                        <Trash2 size={24} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Usuń</span>
                    </button>
                 ) : (
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                        <AlertCircle size={24} className="text-slate-500" />
                        <span className="text-sm font-bold text-slate-500">Zadanie ToDo</span>
                    </div>
                 )}
             </div>
         </div>
      </Modal>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentEvent.id ? 'Edycja' : 'Nowe Wydarzenie'}>
        <div className="space-y-5">
             {currentEvent.isTaskLinked && (
                 <div className="bg-purple-900/20 text-purple-300 p-4 rounded-xl text-xs font-mono mb-4 border border-purple-500/20 flex items-center gap-2">
                     <AlertCircle size={14} />
                     SYNC: Edycja tego elementu możliwa tylko w module Zadań.
                 </div>
             )}
            
            <div className={`${currentEvent.isTaskLinked ? 'opacity-50 pointer-events-none' : ''} space-y-5`}>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">Tytuł Wydarzenia</label>
                    <input 
                        type="text" 
                        className="w-full p-3.5 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-white transition-all placeholder:text-slate-700 font-medium"
                        value={currentEvent.title || ''}
                        onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                        placeholder="Wpisz nazwę..."
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">Rozpoczęcie</label>
                        <input 
                            type="datetime-local" 
                            className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-xs transition-all font-mono"
                            value={currentEvent.start || ''}
                            onChange={(e) => setCurrentEvent({...currentEvent, start: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">Zakończenie</label>
                        <input 
                            type="datetime-local" 
                            className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 text-xs transition-all font-mono"
                            value={currentEvent.end || ''}
                            onChange={(e) => setCurrentEvent({...currentEvent, end: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">Opis / Lokalizacja</label>
                    <div className="relative">
                        <textarea 
                            className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 h-24 transition-all placeholder:text-slate-700 resize-none"
                            value={currentEvent.description || ''}
                            onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                            placeholder="Dodatkowe informacje..."
                        />
                        <AlignLeft className="absolute right-3 top-3 text-slate-700" size={16} />
                    </div>
                </div>
            </div>

            {!currentEvent.isTaskLinked && (
                <div className="flex justify-end items-center gap-3 pt-6 border-t border-white/10 mt-4">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold border border-transparent hover:border-white/5"
                    >
                        Anuluj
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-cyan-500 hover:to-blue-500 font-bold shadow-lg shadow-cyan-900/20 transition-all border border-white/10 hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-wide"
                    >
                        Zapisz
                    </button>
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
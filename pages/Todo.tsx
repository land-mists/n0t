import React, { useState } from 'react';
import { Task, Priority, Status } from '../types';
import { Modal } from '../components/Modal';
import { Plus, CheckCircle2, Circle, ListTodo, Filter, ChevronDown, Paperclip, Calendar, Clock, Flag, Palette, TrendingUp, ArrowDown } from 'lucide-react';

interface TodoProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TASK_COLORS = [
  '#fef08a', // Yellow (Default)
  '#bae6fd', // Blue
  '#bbf7d0', // Green
  '#fbcfe8', // Pink
  '#e9d5ff', // Purple
  '#fed7aa', // Orange
];

const Todo: React.FC<TodoProps> = ({ tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [sortConfig, setSortConfig] = useState<{key: keyof Task, dir: 'asc' | 'desc'}>({ key: 'dueDate', dir: 'asc' });
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');

  const handleSave = () => {
    if (currentTask.id) {
      setTasks(tasks.map(t => t.id === currentTask.id ? currentTask as Task : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: currentTask.title || 'Nowe Zadanie',
        description: currentTask.description || '',
        dueDate: currentTask.dueDate || '',
        priority: currentTask.priority || 'Medium',
        status: currentTask.status || 'To Do',
        color: currentTask.color || TASK_COLORS[0]
      };
      setTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
    setCurrentTask({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Usunąć to zadanie?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(t => statusFilter === 'All' || t.status === statusFilter);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const valA = a[sortConfig.key] || '';
    const valB = b[sortConfig.key] || '';
    if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  });

  // Helpers for Icons & Colors
  const getPriorityIcon = (p: Priority) => {
    switch(p) {
        case 'High': return <Flag size={14} className="text-red-600 fill-red-600/20" />;
        case 'Medium': return <TrendingUp size={14} className="text-blue-600" />;
        case 'Low': return <ArrowDown size={14} className="text-slate-500" />;
        default: return <Circle size={14} />;
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
        case 'High': return 'text-red-700 bg-red-50 border-red-200/50';
        case 'Medium': return 'text-blue-700 bg-blue-50 border-blue-200/50';
        case 'Low': return 'text-slate-600 bg-slate-50 border-slate-200/50';
        default: return 'text-slate-600';
    }
  };

  const getStatusIcon = (s: Status) => {
    switch(s) {
      case 'Done': return <CheckCircle2 className="text-emerald-600 fill-emerald-100" size={18} />;
      case 'In Progress': return <Clock className="text-blue-600" size={18} />;
      default: return <Circle className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-cyan-900/20 rounded-xl border border-cyan-500/20 shadow-neon-cyan">
                <ListTodo className="text-cyan-400" size={24} /> 
             </div>
             Lista Zadań
           </h2>
           <p className="text-slate-400 mt-1 pl-1">Rejestr operacyjny.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Filter Dropdown */}
            <div className="relative group flex-1 md:flex-none">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Filter size={16} className={`transition-colors ${statusFilter !== 'All' ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
                    className="w-full md:w-48 pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-black/40 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 appearance-none cursor-pointer hover:bg-white/5 transition-all shadow-inner font-medium text-sm"
                >
                    <option value="All">Wszystkie</option>
                    <option value="To Do">Do Zrobienia</option>
                    <option value="In Progress">W Trakcie</option>
                    <option value="Done">Zakończone</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <ChevronDown size={14} />
                </div>
            </div>

            <button 
                onClick={() => { setCurrentTask({ status: 'To Do', priority: 'Medium', color: TASK_COLORS[0] }); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-cyan-600/80 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/30 font-medium border border-cyan-400/20 backdrop-blur-md whitespace-nowrap"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Dodaj Zadanie</span>
            </button>
        </div>
      </div>

      {/* Grid Layout for Sticky Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
        {sortedTasks.map((task, index) => (
            <div 
              key={task.id} 
              className={`relative text-slate-800 p-6 pt-10 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover:z-10 group flex flex-col justify-between min-h-[260px]
              ${index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : 'rotate-2'}
              hover:rotate-0
              `}
              style={{ 
                  backgroundColor: task.color || '#fef08a',
                  borderRadius: '2px 25px 2px 2px' 
              }}
            >
                {/* Paperclip */}
                <div className="absolute -top-3 right-1/2 translate-x-1/2 z-20 drop-shadow-md">
                   <Paperclip className="text-slate-400 w-10 h-10 transform rotate-12" strokeWidth={1.5} />
                </div>

                {/* Main Content */}
                <div>
                   <div className="flex justify-between items-start mb-2">
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getPriorityColor(task.priority)}`}>
                         {getPriorityIcon(task.priority)} 
                         {task.priority === 'Medium' ? 'Med' : task.priority}
                      </div>
                      {task.dueDate && (
                         <div className="text-red-900/60 font-bold text-[10px] font-mono flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
                             <Calendar size={12} /> {task.dueDate}
                         </div>
                      )}
                   </div>

                   <h3 className={`font-bold text-lg mb-3 leading-tight ${task.status === 'Done' ? 'line-through text-slate-500 opacity-60' : ''}`}>
                       {task.title}
                   </h3>
                   
                   <p className={`text-sm font-medium text-slate-700 leading-relaxed font-handwriting line-clamp-4 ${task.status === 'Done' ? 'opacity-50' : ''}`}>
                       {task.description || "Brak dodatkowego opisu."}
                   </p>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-4 border-t border-black/10">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                             {getStatusIcon(task.status)}
                             <span className={`text-xs font-bold uppercase ${task.status === 'Done' ? 'text-emerald-700' : task.status === 'In Progress' ? 'text-blue-700' : 'text-slate-600'}`}>
                                {task.status === 'In Progress' ? 'W Trakcie' : task.status === 'To Do' ? 'Do Zrobienia' : 'Zrobione'}
                             </span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setCurrentTask(task); setIsModalOpen(true); }} className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded text-xs font-bold text-slate-700 transition-colors">
                             Edytuj
                         </button>
                         <button onClick={() => handleDelete(task.id)} className="px-3 py-1.5 bg-red-400/10 hover:bg-red-400/30 rounded text-xs font-bold text-red-800 transition-colors">
                             Usuń
                         </button>
                    </div>
                </div>
            </div>
        ))}

        {sortedTasks.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 border-2 border-dashed border-white/10 rounded-3xl">
                <ListTodo size={48} className="mb-4 opacity-20" />
                <p className="text-lg">Brak karteczek z zadaniami.</p>
           </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTask.id ? 'Edytuj Zadanie' : 'Nowe Zadanie'}>
        <div className="grid grid-cols-1 gap-5">
            {/* Color Picker */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-2">
                    <Palette size={14} /> Kolor Karteczki
                </label>
                <div className="flex gap-3">
                    {TASK_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setCurrentTask({ ...currentTask, color })}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentTask.color === color ? 'border-white shadow-[0_0_10px_white]' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            title="Wybierz kolor"
                        />
                    ))}
                </div>
            </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Tytuł Zadania</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 outline-none text-slate-200 transition-all placeholder:text-slate-700 shadow-inner"
              value={currentTask.title || ''}
              onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
              placeholder="Wpisz nazwę..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Opis</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 outline-none text-slate-200 h-24 transition-all placeholder:text-slate-700 shadow-inner"
              value={currentTask.description || ''}
              onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
              placeholder="Dodatkowe szczegóły..."
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Termin</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
                value={currentTask.dueDate || ''}
                onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Priorytet</label>
              <select
                className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
                value={currentTask.priority || 'Medium'}
                onChange={(e) => setCurrentTask({...currentTask, priority: e.target.value as Priority})}
              >
                <option value="Low">Niski</option>
                <option value="Medium">Standard</option>
                <option value="High">Wysoki</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Status</label>
            <select
              className="w-full p-3 rounded-xl border border-white/10 bg-black/50 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
              value={currentTask.status || 'To Do'}
              onChange={(e) => setCurrentTask({...currentTask, status: e.target.value as Status})}
            >
              <option value="To Do">Do zrobienia</option>
              <option value="In Progress">W trakcie</option>
              <option value="Done">Zrobione</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 border-t border-white/10 mt-2">
            <button onClick={handleSave} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-cyan-500 hover:to-blue-500 font-bold shadow-lg shadow-cyan-900/40 transition-all border border-white/10">Zapisz Zmiany</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Todo;
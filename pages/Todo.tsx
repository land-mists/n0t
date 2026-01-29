import React, { useState } from 'react';
import { Task, Priority, Status } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, CheckCircle, Circle, AlertCircle, ListTodo } from 'lucide-react';

interface TodoProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const Todo: React.FC<TodoProps> = ({ tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [sortConfig, setSortConfig] = useState<{key: keyof Task, dir: 'asc' | 'desc'}>({ key: 'dueDate', dir: 'asc' });

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
        status: currentTask.status || 'To Do'
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

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.dir === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const getPriorityStyle = (p: Priority) => {
    switch(p) {
      case 'High': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Medium': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'Low': return 'text-slate-400 border-slate-700 bg-transparent';
    }
  };

  const getPriorityLabel = (p: Priority) => {
    switch(p) {
        case 'High': return 'Wysoki';
        case 'Medium': return 'Standard';
        case 'Low': return 'Niski';
        default: return p;
    }
  };

  const getStatusLabel = (s: Status) => {
      switch(s) {
          case 'To Do': return 'Do Zrobienia';
          case 'In Progress': return 'W Trakcie';
          case 'Done': return 'Zakończone';
          default: return s;
      }
  };

  const getStatusIcon = (s: Status) => {
    switch(s) {
      case 'Done': return <CheckCircle className="text-green-500" size={18} />;
      case 'In Progress': return <AlertCircle className="text-cyan-400" size={18} />;
      default: return <Circle className="text-slate-500" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <ListTodo className="text-cyan-500" /> Lista Zadań
           </h2>
           <p className="text-slate-400">Rejestr operacyjny.</p>
        </div>
        <button 
          onClick={() => { setCurrentTask({ status: 'To Do', priority: 'Medium' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20 font-medium border border-cyan-400/20"
        >
          <Plus size={20} />
          <span>Dodaj Zadanie</span>
        </button>
      </div>

      <div className="bg-[#050505] rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tytuł</th>
                <th className="px-6 py-4">Termin</th>
                <th className="px-6 py-4">Priorytet</th>
                <th className="px-6 py-4 text-right">Edycja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTasks.map(task => (
                <tr key={task.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      {getStatusIcon(task.status)}
                      <span className={task.status === 'Done' ? 'line-through text-slate-600' : ''}>{getStatusLabel(task.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{task.title}</div>
                    {task.description && <div className="text-xs text-slate-500 truncate max-w-[250px] mt-0.5">{task.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">
                      {task.dueDate ? task.dueDate : <span className="opacity-30">--/--/----</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentTask(task); setIsModalOpen(true); }} className="text-slate-500 hover:text-cyan-400 mr-2 p-2 hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(task.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {sortedTasks.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-600">
                          <CheckCircle className="mx-auto mb-2 opacity-20" size={32} />
                          Brak aktywnych zadań.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTask.id ? 'Edytuj Zadanie' : 'Nowe Zadanie'}>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Tytuł Zadania</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-200 transition-all placeholder:text-slate-700"
              value={currentTask.title || ''}
              onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
              placeholder="Wpisz nazwę..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Opis</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-200 h-24 transition-all placeholder:text-slate-700"
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
                className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
                value={currentTask.dueDate || ''}
                onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Priorytet</label>
              <select
                className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
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
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
              value={currentTask.status || 'To Do'}
              onChange={(e) => setCurrentTask({...currentTask, status: e.target.value as Status})}
            >
              <option value="To Do">Do zrobienia</option>
              <option value="In Progress">W trakcie</option>
              <option value="Done">Zrobione</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 border-t border-white/10 mt-2">
            <button onClick={handleSave} className="bg-cyan-600 text-white px-8 py-3 rounded-xl hover:bg-cyan-500 font-bold shadow-lg shadow-cyan-900/20 transition-all">Zapisz Zmiany</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Todo;
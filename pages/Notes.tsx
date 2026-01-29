import React, { useState } from 'react';
import { Note } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, NotebookPen } from 'lucide-react';

interface NotesProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Note>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSave = () => {
    if (currentNote.id) {
      setNotes(notes.map(n => n.id === currentNote.id ? currentNote as Note : n));
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: currentNote.title || 'Bez tytułu',
        content: currentNote.content || '',
        date: currentNote.date || new Date().toISOString().split('T')[0]
      };
      setNotes([...notes, newNote]);
    }
    setIsModalOpen(false);
    setCurrentNote({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Usunąć tę notatkę?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const filteredNotes = notes
    .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortAsc ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortAsc ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end border-b border-white/10 pb-6">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <NotebookPen className="text-cyan-500" /> Baza Wiedzy
           </h2>
           <p className="text-slate-400">System notatek zaszyfrowanych.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-cyan-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Szukaj frazy..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-white transition-all shadow-sm placeholder:text-slate-600"
            />
          </div>
          <button 
            onClick={() => { setCurrentNote({ date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20 font-medium border border-cyan-400/20"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nowa Notatka</span>
          </button>
        </div>
      </div>

      <div className="bg-[#050505] rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">Data Utworzenia <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => { setSortField('title'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">Tytuł <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => { setSortField('content'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">Treść <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-right">Opcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredNotes.map(note => (
                <tr key={note.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{note.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{note.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">{note.content}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentNote(note); setIsModalOpen(true); }} className="text-slate-500 hover:text-cyan-400 mr-3 p-1.5 hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(note.id)} className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-600">Brak danych w rejestrze.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentNote.id ? 'Edycja Wpisu' : 'Nowy Wpis'}>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Tytuł</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all placeholder:text-slate-700"
              value={currentNote.title || ''}
              onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
              placeholder="Temat wpisu..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Data</label>
            <input 
              type="date" 
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 transition-all"
              value={currentNote.date || ''}
              onChange={(e) => setCurrentNote({...currentNote, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Zawartość</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-white/10 bg-black focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 h-32 transition-all placeholder:text-slate-700"
              value={currentNote.content || ''}
              onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
              placeholder="Treść notatki..."
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-white/10 mt-2">
            <button onClick={handleSave} className="bg-cyan-600 text-white px-8 py-3 rounded-xl hover:bg-cyan-500 font-bold shadow-lg shadow-cyan-900/20 transition-all">Zapisz w Bazie</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Notes;
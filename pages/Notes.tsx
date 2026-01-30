import React, { useState } from 'react';
import { Note } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, NotebookPen, Paperclip, Calendar, Palette } from 'lucide-react';

interface NotesProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
}

const NOTE_COLORS = [
  '#fef08a', // Yellow (Default)
  '#bae6fd', // Blue
  '#bbf7d0', // Green
  '#fbcfe8', // Pink
  '#e9d5ff', // Purple
  '#fed7aa', // Orange
];

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
        date: currentNote.date || new Date().toISOString().split('T')[0],
        color: currentNote.color || NOTE_COLORS[0]
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
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
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
            onClick={() => { setCurrentNote({ date: new Date().toISOString().split('T')[0], color: NOTE_COLORS[0] }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20 font-medium border border-cyan-400/20"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nowa Notatka</span>
          </button>
        </div>
      </div>
        
      {/* Sort Controls (Minimal) */}
      <div className="flex justify-end gap-4 text-xs text-slate-500">
         <button onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
            Data <ArrowUpDown size={12} />
         </button>
         <button onClick={() => { setSortField('title'); setSortAsc(!sortAsc); }} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
            Tytuł <ArrowUpDown size={12} />
         </button>
      </div>

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
          {filteredNotes.map((note, index) => (
              <div 
                key={note.id} 
                className={`relative text-slate-800 p-6 pt-8 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover:z-10 group min-h-[240px] flex flex-col justify-between
                ${index % 2 === 0 ? 'rotate-1 hover:rotate-0' : '-rotate-1 hover:rotate-0'}
                `}
                style={{ 
                    backgroundColor: note.color || '#fef08a',
                    borderRadius: '2px 2px 2px 25px' 
                }}
              >
                  {/* Paperclip */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
                     <Paperclip className="text-slate-400 w-10 h-10 transform -rotate-45" strokeWidth={1.5} />
                  </div>
                  
                  {/* Content */}
                  <div>
                      <h3 className="font-bold text-lg mb-3 leading-tight border-b border-black/10 pb-2">{note.title}</h3>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed font-mono whitespace-pre-wrap line-clamp-6">
                          {note.content}
                      </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-black/10 flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={12} /> {note.date}
                      </span>
                      <div className="flex gap-1">
                          <button onClick={() => { setCurrentNote(note); setIsModalOpen(true); }} className="p-1.5 hover:bg-black/10 rounded transition-colors text-slate-700">
                              <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(note.id)} className="p-1.5 hover:bg-red-400/50 rounded transition-colors text-slate-700 hover:text-red-900">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>
              </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-white/10 rounded-3xl">
                <NotebookPen size={48} className="mb-4 opacity-20" />
                <p>Brak notatek. Dodaj nową, aby przypiąć ją do tablicy.</p>
            </div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentNote.id ? 'Edycja Wpisu' : 'Nowy Wpis'}>
        <div className="space-y-5">
            {/* Color Picker */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-2">
                    <Palette size={14} /> Kolor Karteczki
                </label>
                <div className="flex gap-3">
                    {NOTE_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setCurrentNote({ ...currentNote, color })}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentNote.color === color ? 'border-white shadow-[0_0_10px_white]' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            title="Wybierz kolor"
                        />
                    ))}
                </div>
            </div>

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
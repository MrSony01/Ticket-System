import { useState, useEffect } from 'react';
import { api } from '../api/client';

const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setCategories(await api.get('/categories'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const cat = await api.post('/categories', { name: newName.trim() });
      setCategories(prev => [...prev, cat]);
      setNewName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Categorías</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Organiza los tickets por categoría.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Create form */}
      <div className="bg-[#0f0f18] border border-zinc-800 rounded-xl p-5 mb-6">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Nueva categoría</p>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconPlus />
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-[#0f0f18] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categorías</p>
          <span className="text-xs text-zinc-600">{categories.length} en total</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-zinc-600 px-5 py-8">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
            Cargando...
          </div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 mx-auto mb-3">
              <IconTag />
            </div>
            <p className="text-zinc-500 text-sm">No hay categorías aún.</p>
            <p className="text-zinc-700 text-xs mt-1">Crea la primera usando el formulario de arriba.</p>
          </div>
        ) : (
          <ul>
            {categories.map((cat, i) => (
              <li
                key={cat.id}
                className={`flex items-center justify-between px-5 py-3.5 group ${i > 0 ? 'border-t border-zinc-800' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400 shrink-0"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <IconTag />
                  </div>
                  <span className="text-zinc-200 text-sm font-medium">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                  title="Eliminar"
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

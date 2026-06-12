import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

const STATUS_LABELS = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const STATUS_STYLES = {
  open:        'bg-blue-500/15 text-blue-400 border-blue-500/25',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  resolved:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  closed:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
};
const PRIORITY_DOT = { low: '#71717a', medium: '#60a5fa', high: '#fb923c', critical: '#ef4444' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      // For admin: explicitly filter by their own ID; for tech/user the model already scopes it
      if (user?.role === 'admin') params.set('assignedTo', user.id);
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const data = await api.get(`/tickets?${params}`);
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, user?.id, user?.role]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [status, search]);

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Tickets</p>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
            Mis tickets
            {openCount > 0 && (
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {openCount} activos
              </span>
            )}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Tickets asignados a ti.</p>
        </div>
        <Link to="/tickets/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
          + Nuevo ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Buscar tickets..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              status === s
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }`}>
            {s === '' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Ticket', 'Estado', 'Prioridad', 'Categoría', 'Creado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center">
                <div className="flex justify-center"><div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>
              </td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <p className="text-zinc-600 text-sm">No tienes tickets asignados{status ? ` con estado "${STATUS_LABELS[status]}"` : ''}.</p>
              </td></tr>
            ) : tickets.map((t, i) => (
              <tr key={t.id}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/tickets/${t.id}`} className="text-zinc-200 hover:text-violet-300 font-medium transition-colors leading-tight">
                    {t.title}
                  </Link>
                  <p className="text-zinc-600 text-xs mt-0.5">#{t.id} · {t.creator_name}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_DOT[t.priority] }} />
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{t.category ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-600 text-xs whitespace-nowrap">
                  {new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-zinc-600 text-xs">{total} tickets</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 transition-all">←</button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const n = Math.min(Math.max(page - 2, 1) + i, pages);
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${
                    page === n ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
                  }`}>{n}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 transition-all">→</button>
          </div>
        </div>
      )}
    </div>
  );
}

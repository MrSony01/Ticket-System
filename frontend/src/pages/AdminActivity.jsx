import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

const ACTION_META = {
  ticket_created: { label: 'Ticket creado',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  ticket_updated: { label: 'Ticket actualizado', color: 'text-blue-400',    bg: 'bg-blue-500/10',    dot: 'bg-blue-500' },
  comment_added:  { label: 'Comentario añadido', color: 'text-violet-400',  bg: 'bg-violet-500/10',  dot: 'bg-violet-500' },
  user_created:   { label: 'Usuario creado',     color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    dot: 'bg-cyan-500' },
  user_invited:   { label: 'Usuario invitado',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500' },
  user_deleted:   { label: 'Usuario eliminado',  color: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-500' },
  role_changed:   { label: 'Rol cambiado',       color: 'text-orange-400',  bg: 'bg-orange-500/10',  dot: 'bg-orange-500' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'ticket_created', label: 'Ticket creado' },
  { value: 'ticket_updated', label: 'Ticket actualizado' },
  { value: 'comment_added',  label: 'Comentario añadido' },
  { value: 'user_created',   label: 'Usuario creado' },
  { value: 'user_invited',   label: 'Usuario invitado' },
  { value: 'user_deleted',   label: 'Usuario eliminado' },
  { value: 'role_changed',   label: 'Rol cambiado' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora mismo';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function formatMeta(action, metadata) {
  if (!metadata) return null;
  const m = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  if (action === 'ticket_created') return `"${m.title}" · ${m.priority}`;
  if (action === 'ticket_updated') {
    const parts = [];
    if (m.status)      parts.push(`estado → ${m.status}`);
    if (m.priority)    parts.push(`prioridad → ${m.priority}`);
    if (m.assigned_to !== undefined) parts.push(`asignado → ${m.assigned_to ?? 'sin asignar'}`);
    return parts.join(' · ') || null;
  }
  if (action === 'role_changed') return `nuevo rol: ${m.new_role}`;
  if (action === 'user_created' || action === 'user_invited') return `${m.name} · ${m.email} · ${m.role}`;
  return null;
}

export default function AdminActivity() {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const PAGE_SIZE = 50;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (actionFilter) params.set('action', actionFilter);
      const data = await api.get(`/admin/activity?${params}`);
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [actionFilter]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-zinc-100 text-xl font-bold">Log de actividad</h1>
        <p className="text-zinc-500 text-sm mt-1">Historial completo de eventos del sistema</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-zinc-300 outline-none"
          style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {FILTER_OPTIONS.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#0f0f18' }}>{o.label}</option>
          ))}
        </select>
        <span className="text-zinc-600 text-sm ml-auto">{total} eventos</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="py-16 text-center text-zinc-600">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-sm">No hay eventos registrados</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const meta = ACTION_META[log.action] ?? { label: log.action, color: 'text-zinc-400', bg: 'bg-zinc-500/10', dot: 'bg-zinc-500' };
              const detail = formatMeta(log.action, log.metadata);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/2"
                  style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  {/* Dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>
                        {meta.label}
                      </span>
                      {log.entity_type === 'ticket' && log.entity_id && (
                        <span className="text-zinc-600 text-xs">ticket #{log.entity_id}</span>
                      )}
                    </div>
                    {detail && <p className="text-zinc-500 text-xs mt-1">{detail}</p>}
                  </div>

                  {/* User + time */}
                  <div className="shrink-0 text-right">
                    <p className="text-zinc-400 text-xs">{log.user_name ?? 'Sistema'}</p>
                    <p className="text-zinc-600 text-[11px] mt-0.5">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            ← Anterior
          </button>
          <span className="text-zinc-500 text-xs">{page} / {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

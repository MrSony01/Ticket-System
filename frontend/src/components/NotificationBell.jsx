import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const POLL_INTERVAL = 30_000;

const TYPE_LABELS = {
  ticket_assigned: 'Ticket asignado',
  ticket_updated:  'Ticket actualizado',
  comment_added:   'Nuevo comentario',
};

export default function NotificationBell() {
  const [count, setCount]               = useState(0);
  const [open, setOpen]                 = useState(false);
  const [notifications, setNotifs]      = useState([]);
  const [loading, setLoading]           = useState(false);
  const panelRef                        = useRef(null);
  const navigate                        = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const data = await api.get('/notifications/unread');
      setCount(data.count);
    } catch { /* silent */ }
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/notifications?unreadOnly=false');
      setNotifs(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Poll for unread count
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleOpen() {
    if (!open) await fetchNotifs();
    setOpen(v => !v);
  }

  async function handleMarkAll() {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifs(n => n.map(x => ({ ...x, read_at: new Date().toISOString() })));
      setCount(0);
    } catch { /* silent */ }
  }

  async function handleClick(notif) {
    if (!notif.read_at) {
      try {
        await api.patch(`/notifications/${notif.id}/read`, {});
        setNotifs(n => n.map(x => x.id === notif.id ? { ...x, read_at: new Date().toISOString() } : x));
        setCount(c => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    if (notif.entity_id) navigate(`/tickets/${notif.entity_id}`);
    setOpen(false);
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'ahora';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        aria-label={count > 0 ? `Notificaciones, ${count} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-10 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-zinc-100 text-sm font-semibold">Notificaciones</span>
            {count > 0 && (
              <button onClick={handleMarkAll} className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-zinc-500 text-sm">Cargando...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 mx-auto mb-2" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p className="text-zinc-500 text-sm">Sin notificaciones</p>
              </div>
            )}
            {!loading && notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-white/4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: n.read_at ? 'transparent' : 'rgba(124,58,237,0.06)' }}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read_at ? 'bg-zinc-700' : 'bg-violet-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200 text-xs font-medium leading-tight">{n.title}</p>
                  {n.message && <p className="text-zinc-500 text-[11px] mt-0.5 truncate">{n.message}</p>}
                </div>
                <span className="text-zinc-400 text-[10px] shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

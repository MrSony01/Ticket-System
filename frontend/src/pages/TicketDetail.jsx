import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const SLA_DEFAULTS = {
  low:      { response_hours: 72,  resolution_hours: 168 },
  medium:   { response_hours: 24,  resolution_hours: 72  },
  high:     { response_hours: 8,   resolution_hours: 24  },
  critical: { response_hours: 2,   resolution_hours: 8   },
};

function computeSLA(ticket, slaMap) {
  if (!ticket || ['resolved', 'closed'].includes(ticket.status)) return null;
  const sla = slaMap?.[ticket.priority];
  if (!sla) return null;
  const elapsedHrs = (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000;
  if (elapsedHrs > sla.resolution_hours) return { kind: 'overdue', elapsed: Math.round(elapsedHrs), limit: sla.resolution_hours };
  if (elapsedHrs > sla.response_hours)   return { kind: 'breach',  elapsed: Math.round(elapsedHrs), limit: sla.resolution_hours };
  return null;
}

const STATUS_STYLES = {
  open:        'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  in_progress: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  resolved:    'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  closed:      'bg-zinc-700/40 text-zinc-500 border border-zinc-600/20',
};

const PRIORITY_COLOR = {
  low: '#71717a', medium: '#60a5fa', high: '#fb923c', critical: '#ef4444',
};

const PRIORITY_DOT = {
  low: 'bg-zinc-500', medium: 'bg-blue-400', high: 'bg-orange-400', critical: 'bg-red-500',
};

const ACTIVITY_DOT = {
  ticket_created: 'bg-emerald-500',
  ticket_updated: 'bg-blue-500',
  comment_added:  'bg-violet-500',
};

function describeActivity(entry) {
  const meta = entry.metadata
    ? (typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata)
    : null;

  if (entry.action === 'ticket_created') return 'creó el ticket';
  if (entry.action === 'comment_added')  return 'agregó un comentario';
  if (entry.action === 'ticket_updated' && meta) {
    const parts = [];
    if (meta.status)   parts.push(`estado a "${STATUS_LABELS[meta.status] ?? meta.status}"`);
    if (meta.priority) parts.push(`prioridad a "${PRIORITY_LABELS[meta.priority] ?? meta.priority}"`);
    if (meta.assigned_to !== undefined) parts.push(meta.assigned_to ? 'reasignó el ticket' : 'quitó la asignación');
    if (meta.category_id !== undefined) parts.push('cambió la categoría');
    return parts.length ? `actualizó ${parts.join(', ')}` : 'actualizó el ticket';
  }
  return 'realizó una acción';
}

const selectCls =
  'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-zinc-200'
  + ' bg-transparent border border-zinc-800 hover:border-zinc-700';

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-xs text-zinc-300 font-medium text-right">{value}</span>
    </div>
  );
}

function CommentAvatar({ name, isInternal }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? '?';
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5"
      style={isInternal
        ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }
        : { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }
      }
    >
      {initials}
    </div>
  );
}

export default function TicketDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket,      setTicket]      = useState(null);
  const [activity,    setActivity]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [comment,     setComment]     = useState('');
  const [isInternal,  setIsInternal]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [slaMap,      setSlaMap]      = useState(SLA_DEFAULTS);

  const isAdmin      = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const canUpdate    = isAdmin || isTechnician;

  async function load() {
    try {
      const [data, activityData] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/activity`),
      ]);
      setTicket(data);
      setActivity(activityData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/admin/users')
      .then(users => setTechnicians(users.filter(u => u.role === 'technician' || u.role === 'admin')))
      .catch(() => {});
    api.get('/admin/sla').then(setSlaMap).catch(() => {});
  }, [isAdmin]);

  async function handleStatusChange(e) {
    try {
      await api.patch(`/tickets/${id}`, { status: e.target.value });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssign(e) {
    const val = e.target.value;
    try {
      await api.patch(`/tickets/${id}`, { assigned_to: val ? Number(val) : null });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: comment, is_internal: isInternal });
      setComment('');
      setIsInternal(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-zinc-600">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      Cargando...
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
    </div>
  );

  if (!ticket) return null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-zinc-600 hover:text-zinc-300 text-sm transition-colors mb-6"
      >
        <IconArrow />
        Volver al dashboard
      </button>

      {/* Two-column layout */}
      <div className="lg:grid lg:gap-6" style={{ gridTemplateColumns: '1fr 280px' }}>

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5 min-w-0">

          {/* Ticket header + description */}
          <div className="rounded-2xl p-6" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-start gap-3 mb-5">
              <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-zinc-100 leading-snug flex-1">{ticket.title}</h1>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">
                  Ticket #{ticket.id} · Creado por <span className="text-zinc-400">{ticket.creator_name}</span>
                </p>
              </div>
            </div>

            <div className="pl-5" style={{ borderLeft: '2px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {ticket.description || <span className="text-zinc-600 italic">Sin descripción.</span>}
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
              Comentarios · {ticket.comments.length}
            </p>

            {ticket.comments.length === 0 && (
              <p className="text-sm text-zinc-600 mb-5">Sin comentarios aún.</p>
            )}

            <ul className="space-y-4 mb-5">
              {ticket.comments.map(c => (
                <li key={c.id} className="flex gap-3">
                  <CommentAvatar name={c.user_name} isInternal={c.is_internal} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="rounded-xl px-4 py-3 text-sm"
                      style={c.is_internal
                        ? { background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-200 text-xs">{c.user_name}</span>
                        <span className="text-[10px] text-zinc-600">{c.user_role}</span>
                        {c.is_internal && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded">
                            Nota interna
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600 ml-auto">
                          {new Date(c.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm">{c.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Comment form */}
            <form onSubmit={handleComment} className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Escribe un comentario..."
                className="w-full text-zinc-200 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              <div className="flex items-center justify-between gap-3">
                {canUpdate && (
                  <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="accent-amber-400 w-3.5 h-3.5"
                    />
                    Nota interna
                  </label>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-auto text-white text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {saving ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </form>
          </div>

          {/* History timeline */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
              Historial · {activity.length}
            </p>
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-600">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((entry, i) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`w-2 h-2 rounded-full mt-1 ${ACTIVITY_DOT[entry.action] ?? 'bg-zinc-600'}`} />
                      {i < activity.length - 1 && (
                        <span className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-200">{entry.user_name ?? 'Sistema'}</span>
                        {' '}{describeActivity(entry)}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(entry.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4 mt-5 lg:mt-0">

          {/* Metadata card */}
          <div className="rounded-2xl px-5 py-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Detalles</p>

            {(() => {
              const sla = computeSLA(ticket, slaMap);
              if (!sla) return null;
              const isOverdue = sla.kind === 'overdue';
              return (
                <div
                  className="rounded-lg px-3 py-2 mb-3 flex items-center gap-2"
                  style={isOverdue
                    ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }
                    : { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }
                  }
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOverdue ? '#ef4444' : '#fbbf24'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold" style={{ color: isOverdue ? '#ef4444' : '#fbbf24' }}>
                      {isOverdue ? 'Resolución vencida' : 'Respuesta vencida'}
                    </p>
                    <p className="text-[10px] text-zinc-500">{sla.elapsed}h transcurridas · límite {sla.limit}h</p>
                  </div>
                </div>
              );
            })()}

            <div className="mt-1">
              <MetaRow label="Estado"   value={<span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>} />
              <MetaRow label="Prioridad" value={
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`} />
                  <span style={{ color: PRIORITY_COLOR[ticket.priority] }}>{PRIORITY_LABELS[ticket.priority]}</span>
                </span>
              } />
              <MetaRow label="Creado por" value={ticket.creator_name} />
              {ticket.category && <MetaRow label="Categoría" value={ticket.category} />}
              <MetaRow label="Asignado a" value={ticket.assignee_name ?? <span className="text-zinc-600">Sin asignar</span>} />
              <div className="pt-2.5">
                <MetaRow label="Fecha" value={new Date(ticket.created_at).toLocaleDateString('es', { dateStyle: 'medium' })} />
              </div>
            </div>
          </div>

          {/* Admin/tech actions */}
          {canUpdate && (
            <div className="rounded-2xl px-5 py-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-3">Gestión</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1.5">Estado</label>
                  <select defaultValue={ticket.status} onChange={handleStatusChange} className={selectCls}
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <option value="open">Abierto</option>
                    <option value="in_progress">En progreso</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1.5">Asignado a</label>
                    <select
                      value={ticket.assignee_id ?? ''}
                      onChange={handleAssign}
                      className={selectCls}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <option value="">Sin asignar</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

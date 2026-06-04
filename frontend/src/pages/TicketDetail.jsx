import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const STATUS_STYLES = {
  open:        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  resolved:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  closed:      'bg-slate-700/50 text-slate-400 border border-slate-600/30',
};

const PRIORITY_DOT = {
  low: 'bg-slate-400', medium: 'bg-blue-400', high: 'bg-orange-400', critical: 'bg-red-500',
};

const selectCls =
  'bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

export default function TicketDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket,     setTicket]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [comment,    setComment]    = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving,     setSaving]     = useState(false);

  const isAdmin      = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const canUpdate    = isAdmin || isTechnician;

  async function load() {
    try {
      const data = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

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
    <div className="p-8 flex items-center gap-3 text-slate-500">
      <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
      Cargando...
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
    </div>
  );

  if (!ticket) return null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 transition-colors"
      >
        ← Volver al dashboard
      </button>

      {/* Ticket header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
            <h1 className="text-xl font-bold text-slate-100 leading-snug">{ticket.title}</h1>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>

        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-5">
          {ticket.description}
        </p>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 border-t border-slate-800 pt-4">
          <span>Creado por <span className="text-slate-300 font-medium">{ticket.creator_name}</span></span>
          <span>Prioridad <span className="text-slate-300 font-medium">{PRIORITY_LABELS[ticket.priority]}</span></span>
          {ticket.category      && <span>Categoría <span className="text-slate-300 font-medium">{ticket.category}</span></span>}
          {ticket.assignee_name && <span>Asignado a <span className="text-slate-300 font-medium">{ticket.assignee_name}</span></span>}
          <span className="ml-auto">{new Date(ticket.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}</span>
        </div>
      </div>

      {/* Admin/tech actions */}
      {canUpdate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Gestión</p>
          <div className="flex flex-wrap gap-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Estado</label>
              <select defaultValue={ticket.status} onChange={handleStatusChange} className={selectCls}>
                <option value="open">Abierto</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">ID técnico asignado</label>
                <input
                  type="number"
                  defaultValue={ticket.assignee_id ?? ''}
                  onBlur={handleAssign}
                  placeholder="ID del técnico"
                  className={`${selectCls} w-40`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Comentarios ({ticket.comments.length})
        </p>

        {ticket.comments.length === 0 && (
          <p className="text-sm text-slate-500 mb-5">Sin comentarios aún.</p>
        )}

        <ul className="space-y-3 mb-5">
          {ticket.comments.map(c => (
            <li
              key={c.id}
              className={`rounded-lg px-4 py-3 text-sm ${
                c.is_internal
                  ? 'bg-amber-500/8 border border-amber-500/20'
                  : 'bg-slate-800/60 border border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-slate-200 text-xs">{c.user_name}</span>
                <span className="text-xs text-slate-500">{c.user_role}</span>
                {c.is_internal && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    Nota interna
                  </span>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  {new Date(c.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
            </li>
          ))}
        </ul>

        {/* Comment form */}
        <form onSubmit={handleComment} className="space-y-3 border-t border-slate-800 pt-4">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
          <div className="flex items-center justify-between">
            {canUpdate && (
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={e => setIsInternal(e.target.checked)}
                  className="accent-amber-400"
                />
                Nota interna
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

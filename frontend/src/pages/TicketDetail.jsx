import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const STATUS_STYLES = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
};

export default function TicketDetail() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [saving, setSaving]   = useState(false);

  const canManage = ['admin', 'manager'].includes(user?.role);
  const canUpdate = ['admin', 'manager', 'agent'].includes(user?.role);

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
    try {
      await api.patch(`/tickets/${id}`, { assigned_to: e.target.value || null });
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
      await api.post(`/tickets/${id}/comments`, { body: comment, internal });
      setComment('');
      setInternal(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-gray-500">Cargando...</p>;
  if (error)   return <p className="p-8 text-red-500">{error}</p>;
  if (!ticket) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Cabecera del ticket */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-bold text-gray-800">{ticket.title}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>

        <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">{ticket.description}</p>

        <div className="text-xs text-gray-400 flex flex-wrap gap-4">
          <span>Creado por <strong className="text-gray-600">{ticket.creator_name}</strong></span>
          <span>Prioridad <strong className="text-gray-600">{PRIORITY_LABELS[ticket.priority]}</strong></span>
          {ticket.category && <span>Categoría <strong className="text-gray-600">{ticket.category}</strong></span>}
          <span>{new Date(ticket.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}</span>
        </div>
      </div>

      {/* Acciones para agentes/managers/admins */}
      {canUpdate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cambiar estado</label>
            <select
              defaultValue={ticket.status}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>

          {canManage && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Agente asignado (ID)</label>
              <input
                type="number"
                defaultValue={ticket.agent_id ?? ''}
                onBlur={handleAssign}
                placeholder="ID del agente"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Historial de cambios */}
      {ticket.history.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Historial</h2>
          <ul className="space-y-1.5">
            {ticket.history.map((h, i) => (
              <li key={i} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{h.changed_by}</span>
                {' '}cambió <em>{h.field}</em> de <strong>{h.old_value ?? '—'}</strong> a <strong>{h.new_value}</strong>
                {' · '}{new Date(h.changed_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comentarios */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Comentarios ({ticket.comments.length})
        </h2>

        {ticket.comments.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">Sin comentarios aún.</p>
        )}

        <ul className="space-y-3 mb-5">
          {ticket.comments.map(c => (
            <li
              key={c.id}
              className={`rounded-lg px-4 py-3 text-sm ${c.internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-700">{c.user_name}</span>
                <span className="text-xs text-gray-400">{c.user_role}</span>
                {c.internal && <span className="text-xs bg-yellow-200 text-yellow-700 px-1.5 rounded">Nota interna</span>}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(c.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleComment} className="space-y-3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between">
            {canUpdate && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={e => setInternal(e.target.checked)}
                  className="accent-yellow-500"
                />
                Nota interna
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

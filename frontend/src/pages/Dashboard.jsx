import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const STATUS_STYLES = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado',
};

const PRIORITY_STYLES = {
  low:      'bg-gray-100 text-gray-500',
  medium:   'bg-blue-100 text-blue-600',
  high:     'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

const PRIORITY_LABELS = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica',
};

const ALL_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function Dashboard() {
  const [tickets, setTickets]     = useState([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/tickets')
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter ? tickets.filter(t => t.status === filter) : tickets;

  if (loading) return <p className="p-8 text-gray-500">Cargando tickets...</p>;
  if (error)   return <p className="p-8 text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`text-sm px-3 py-1 rounded-full border transition ${!filter ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-300 hover:border-gray-400'}`}
          >
            Todos
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-sm px-3 py-1 rounded-full border transition ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-300 hover:border-gray-400'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay tickets</p>
          <Link to="/tickets/new" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(ticket => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    #{ticket.id} · {ticket.creator_name}
                    {ticket.assignee_name && ` · Asignado a ${ticket.assignee_name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

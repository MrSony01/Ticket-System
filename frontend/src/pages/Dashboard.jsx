import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const STATUS_STYLES = {
  open:        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  resolved:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  closed:      'bg-slate-700/50 text-slate-400 border border-slate-600/30',
};

const PRIORITY_DOT = {
  low:      'bg-slate-400',
  medium:   'bg-blue-400',
  high:     'bg-orange-400',
  critical: 'bg-red-500',
};

const ALL_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

const ONBOARDING_STEPS = [
  {
    step: '1',
    title: 'Crea los usuarios de tu equipo',
    desc: 'Agrega técnicos y usuarios a tu empresa desde el panel de administración.',
    to: '/admin/usuarios',
    cta: 'Ir a Usuarios →',
    color: 'border-indigo-500/30 bg-indigo-500/5',
    ctaCls: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
  {
    step: '2',
    title: 'Crea las categorías',
    desc: 'Define las áreas de soporte de tu empresa (ej: Facturación, Soporte técnico).',
    to: '/admin/usuarios',
    cta: 'Próximamente',
    color: 'border-cyan-500/30 bg-cyan-500/5',
    ctaCls: 'bg-slate-700 text-slate-400 cursor-not-allowed',
  },
  {
    step: '3',
    title: 'Espera el primer ticket',
    desc: 'Una vez que tu equipo esté listo, los usuarios podrán abrir tickets de soporte.',
    to: null,
    cta: null,
    color: 'border-slate-700/50 bg-slate-800/30',
    ctaCls: '',
  },
];

function AdminOnboarding() {
  return (
    <div className="mb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">AX</span>
          </div>
          <div>
            <p className="text-slate-100 font-bold">¡Bienvenido a AgentX!</p>
            <p className="text-slate-400 text-sm mt-0.5">Tu empresa está lista. Sigue estos pasos para configurar tu espacio.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {ONBOARDING_STEPS.map(s => (
            <div key={s.step} className={`border rounded-xl p-4 ${s.color}`}>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paso {s.step}</span>
              <p className="text-slate-200 font-semibold text-sm mt-2 mb-1">{s.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">{s.desc}</p>
              {s.to && (
                <Link to={s.to} className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${s.ctaCls}`}>
                  {s.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/tickets')
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    open:        tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
    closed:      tickets.filter(t => t.status === 'closed').length,
  };

  const visible = filter ? tickets.filter(t => t.status === filter) : tickets;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Hola, <span className="text-slate-200">{user?.name}</span>
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <span className="text-base leading-none">＋</span>
          Nuevo ticket
        </Link>
      </div>

      {/* Onboarding para admin sin tickets */}
      {!loading && !error && user?.role === 'admin' && tickets.length === 0 && (
        <AdminOnboarding />
      )}

      {/* Stats */}
      {!loading && !error && tickets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Abiertos"     value={counts.open}        color="text-blue-400" />
          <StatCard label="En progreso"  value={counts.in_progress} color="text-amber-400" />
          <StatCard label="Resueltos"    value={counts.resolved}    color="text-emerald-400" />
          <StatCard label="Cerrados"     value={counts.closed}      color="text-slate-400" />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            !filter
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
          }`}
        >
          Todos ({tickets.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              filter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading && (
        <div className="flex items-center gap-3 text-slate-500 py-12">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
          Cargando tickets...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg mb-2">No hay tickets</p>
          <Link to="/tickets/new" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            Crear el primero →
          </Link>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map(ticket => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-5 py-4 transition-colors group"
            >
              {/* Priority dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-100 font-medium text-sm truncate group-hover:text-white transition-colors">
                  {ticket.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  #{ticket.id} · {ticket.creator_name}
                  {ticket.assignee_name && ` · ${ticket.assignee_name}`}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 hidden sm:block">
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

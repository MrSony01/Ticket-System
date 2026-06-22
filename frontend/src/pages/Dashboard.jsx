import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function computeSLAStatus(ticket, slaMap) {
  if (!slaMap || ['resolved', 'closed'].includes(ticket.status)) return null;
  const sla = slaMap[ticket.priority];
  if (!sla) return null;
  const elapsedHrs = (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000;
  if (elapsedHrs > sla.resolution_hours) return 'overdue';
  if (elapsedHrs > sla.response_hours)   return 'breach';
  return null;
}

const STATUS_LABELS = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const STATUS_STYLES = {
  open:        'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  in_progress: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  resolved:    'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  closed:      'bg-zinc-700/40 text-zinc-500 border border-zinc-600/20',
};

const PRIORITY_DOT = {
  low: 'bg-zinc-500', medium: 'bg-blue-400', high: 'bg-orange-400', critical: 'bg-red-500',
};

const FILTER_ACTIVE = {
  '':          'bg-violet-500/15 text-violet-300 border-violet-500/30',
  open:        'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  resolved:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed:      'bg-zinc-700/40 text-zinc-400 border-zinc-600/30',
};

const ALL_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const PAGE_SIZE = 20;

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCircle   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>;
const IconActivity = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconCheck    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconArchive  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const IconPlus     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconChevronL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevronR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IconDownload  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accentColor, glowColor }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: glowColor }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color: accentColor, letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { step: '01', title: 'Crea los usuarios de tu equipo', desc: 'Agrega técnicos y usuarios desde el panel de administración.', to: '/admin/usuarios', cta: 'Ir a Usuarios →', accent: '#7c3aed', border: 'rgba(124,58,237,0.2)', bg: 'rgba(124,58,237,0.05)' },
  { step: '02', title: 'Crea las categorías de soporte', desc: 'Define las áreas de soporte de tu empresa (ej: Facturación, Soporte técnico).', to: '/admin/categorias', cta: 'Ir a Categorías →', accent: '#06b6d4', border: 'rgba(6,182,212,0.2)', bg: 'rgba(6,182,212,0.05)' },
  { step: '03', title: 'Espera el primer ticket', desc: 'Una vez listo tu equipo, los usuarios podrán abrir tickets de soporte.', to: null, cta: null, accent: '#52525b', border: 'rgba(82,82,91,0.2)', bg: 'rgba(255,255,255,0.02)' },
];

function AdminOnboarding() {
  return (
    <div className="mb-8">
      <div className="rounded-2xl p-6" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>AX</div>
          <div>
            <p className="text-zinc-100 font-bold text-sm">¡Bienvenido a AgentX!</p>
            <p className="text-zinc-500 text-xs mt-0.5">Tu empresa está lista. Configura tu espacio en 3 pasos.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {ONBOARDING_STEPS.map(s => (
            <div key={s.step} className="rounded-xl p-4" style={{ border: `1px solid ${s.border}`, background: s.bg }}>
              <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: s.accent }}>Paso {s.step}</span>
              <p className="text-zinc-200 font-semibold text-sm mt-2 mb-1">{s.title}</p>
              <p className="text-zinc-500 text-xs leading-relaxed mb-4">{s.desc}</p>
              {s.to && (
                <Link to={s.to} className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80" style={{ background: s.accent }}>
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

const selectCls = 'text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 transition';

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  const [data,       setData]       = useState({ tickets: [], total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [categories, setCategories] = useState([]);

  // filters
  const [status,     setStatus]     = useState('');
  const [priority,   setPriority]   = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  // summary counts (always all tickets for stat cards)
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [slaMap, setSlaMap] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => {});
    if (user?.role === 'admin') {
      api.get('/admin/sla').then(setSlaMap).catch(() => {});
    }
    api.get('/tickets?limit=0&page=1').then(r => {
      const all = r.tickets ?? [];
      setCounts({
        open:        all.filter(t => t.status === 'open').length,
        in_progress: all.filter(t => t.status === 'in_progress').length,
        resolved:    all.filter(t => t.status === 'resolved').length,
        closed:      all.filter(t => t.status === 'closed').length,
      });
    }).catch(() => {});
  }, []);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (status)     params.set('status',     status);
    if (priority)   params.set('priority',   priority);
    if (categoryId) params.set('categoryId', categoryId);
    if (search)     params.set('search',     search);

    api.get(`/tickets?${params}`)
      .then(r => { setData(r); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, priority, categoryId, search, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [status, priority, categoryId, search]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const hasFilters = status || priority || categoryId || search;

  async function handleExportCSV() {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (status)     params.set('status',     status);
      if (priority)   params.set('priority',   priority);
      if (categoryId) params.set('categoryId', categoryId);
      if (search)     params.set('search',     search);
      const res = await fetch(`/api/tickets/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'tickets.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 text-zinc-400 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors hover:text-zinc-100 disabled:opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              title="Exportar CSV"
            >
              <IconDownload /> {exporting ? 'Exportando...' : 'CSV'}
            </button>
          )}
          <Link
            to="/tickets/new"
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
          >
            <IconPlus /> Nuevo ticket
          </Link>
        </div>
      </div>

      {/* Onboarding */}
      {!loading && !error && user?.role === 'admin' && data.total === 0 && !hasFilters && (
        <AdminOnboarding />
      )}

      {/* Stat cards */}
      {data.total > 0 || hasFilters ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Abiertos"    value={counts.open}        icon={<IconCircle />}   accentColor="#60a5fa" glowColor="#3b82f6" />
          <StatCard label="En progreso" value={counts.in_progress} icon={<IconActivity />} accentColor="#fbbf24" glowColor="#f59e0b" />
          <StatCard label="Resueltos"   value={counts.resolved}    icon={<IconCheck />}    accentColor="#34d399" glowColor="#10b981" />
          <StatCard label="Cerrados"    value={counts.closed}      icon={<IconArchive />}  accentColor="#71717a" glowColor="#52525b" />
        </div>
      ) : null}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tickets..."
            className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2 flex-wrap items-center">
          <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls}>
            <option value="">Prioridad</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>

          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectCls}>
            <option value="">Categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setStatus(''); setPriority(''); setCategoryId(''); setSearch(''); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-2 flex-wrap items-center sm:ml-auto">
          {[{ key: '', label: 'Todos' }, ...ALL_STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s] }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                status === key ? FILTER_ACTIVE[key] : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-zinc-600 py-12">
          <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          Cargando tickets...
        </div>
      )}

      {/* Error */}
      {error && <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Empty */}
      {!loading && !error && data.tickets.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <p className="text-zinc-500 text-sm mb-3">
            {hasFilters ? 'Sin resultados con estos filtros' : 'No hay tickets aún'}
          </p>
          {!hasFilters && (
            <Link to="/tickets/new" className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">
              Crear el primero →
            </Link>
          )}
        </div>
      )}

      {/* Ticket table */}
      {!loading && !error && data.tickets.length > 0 && (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid gap-4 px-5 py-3" style={{ gridTemplateColumns: '52px 1fr 90px 130px 110px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID', 'Título', 'Prioridad', 'Estado', 'Fecha'].map(h => (
                <span key={h} className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            <div>
              {data.tickets.map((ticket, i) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="grid gap-4 px-5 py-3.5 items-center transition-colors group"
                  style={{
                    gridTemplateColumns: '52px 1fr 90px 130px 110px',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="text-xs font-mono text-zinc-600 font-semibold">#{ticket.id}</span>
                  <div className="min-w-0">
                    <p className="text-zinc-200 text-sm font-medium truncate group-hover:text-zinc-100 transition-colors">{ticket.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">
                      {ticket.creator_name}{ticket.assignee_name ? ` · ${ticket.assignee_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                    <span className="text-xs text-zinc-500">{PRIORITY_LABELS[ticket.priority]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    {(() => {
                      const sla = computeSLAStatus(ticket, slaMap);
                      if (sla === 'overdue') return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Vencido</span>;
                      if (sla === 'breach')  return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">SLA</span>;
                      return null;
                    })()}
                  </div>
                  <span className="text-xs text-zinc-600">
                    {new Date(ticket.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-zinc-600">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} de {data.total} tickets
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 transition-colors"
                >
                  <IconChevronL />
                </button>

                {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                  const p = data.pages <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= data.pages - 2 ? data.pages - 4 + i
                    : page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        p === page
                          ? 'bg-violet-600 text-white border border-violet-500'
                          : 'border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 transition-colors"
                >
                  <IconChevronR />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

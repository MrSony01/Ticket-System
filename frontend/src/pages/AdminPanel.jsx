import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS  = { admin: 'Admins', technician: 'Técnicos', user: 'Usuarios' };
const ROLE_COLORS  = {
  admin:      { bg: 'rgba(124,58,237,0.15)', border: 'rgba(139,92,246,0.3)', color: '#a78bfa' },
  technician: { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)',  color: '#67e8f9' },
  user:       { bg: 'rgba(113,113,122,0.15)',border: 'rgba(113,113,122,0.3)',color: '#a1a1aa' },
};

/* ── Icons ────────────────────────────────────────────────────── */
const IconUsers  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconTicket = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
  </svg>
);
const IconCopy  = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accentColor, glowColor, breakdown, linkTo, linkLabel }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 flex flex-col" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none" style={{ background: glowColor }} />
      <div className="mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28`, color: accentColor }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color: accentColor, letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">{label}</p>
      {breakdown && (
        <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {breakdown.map(({ key, count }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">{ROLE_LABELS[key] ?? key}</span>
              <span className="text-[11px] font-semibold text-zinc-400">{count}</span>
            </div>
          ))}
        </div>
      )}
      {linkTo && (
        <Link to={linkTo} className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: accentColor }}>
          {linkLabel} <IconArrow />
        </Link>
      )}
    </div>
  );
}

/* ── User Avatar chip ─────────────────────────────────────────── */
function UserChip({ user }) {
  const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.user;
  const initials = user.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color }}>
        {initials}
      </div>
      <span className="text-xs text-zinc-300 font-medium">{user.name}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>{ROLE_LABELS[user.role]?.slice(0, -1) ?? user.role}</span>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { company }           = useAuth();
  const [stats, setStats]     = useState(null);
  const [groups, setGroups]   = useState([]);
  const [users,  setUsers]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/groups'),
      api.get('/admin/users'),
    ])
      .then(([s, g, u]) => { setStats(s); setGroups(g); setUsers(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function copySlug() {
    navigator.clipboard.writeText(company?.slug ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const membersOf  = (groupId) => users.filter(u => u.group_id === groupId);
  const unassigned = users.filter(u => !u.group_id);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Panel de empresa</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Resumen general de tu organización.</p>
      </div>

      {/* Company card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
            {company?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-zinc-100 tracking-tight truncate">{company?.name ?? '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-zinc-500">{company?.slug ?? '—'}</span>
              <button
                onClick={copySlug}
                className="flex items-center gap-1.5 text-[11px] font-medium transition-colors px-2 py-0.5 rounded-lg"
                style={{ color: copied ? '#34d399' : '#71717a', background: copied ? 'rgba(52,211,153,0.08)' : 'transparent' }}
              >
                <IconCopy />
                {copied ? 'Copiado' : 'Copiar slug'}
              </button>
            </div>
          </div>
          <div className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
            Activa
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-zinc-600 py-8">
          <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          Cargando...
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Miembros" value={stats?.users?.total ?? 0}
              icon={<IconUsers />} accentColor="#a78bfa" glowColor="#7c3aed"
              breakdown={[
                { key: 'admin',      count: stats?.users?.admin ?? 0 },
                { key: 'technician', count: stats?.users?.technician ?? 0 },
                { key: 'user',       count: stats?.users?.user ?? 0 },
              ]}
              linkTo="/admin/usuarios" linkLabel="Gestionar usuarios"
            />
            <StatCard
              label="Grupos" value={stats?.groups ?? 0}
              icon={<IconLayers />} accentColor="#67e8f9" glowColor="#06b6d4"
              linkTo="/admin/grupos" linkLabel="Gestionar grupos"
            />
            <StatCard
              label="Categorías" value={stats?.categories ?? 0}
              icon={<IconTag />} accentColor="#34d399" glowColor="#10b981"
              linkTo="/admin/categorias" linkLabel="Gestionar categorías"
            />
            <StatCard
              label="Tickets" value={stats?.tickets?.total ?? 0}
              icon={<IconTicket />} accentColor="#fbbf24" glowColor="#f59e0b"
              breakdown={[
                { key: 'Abiertos',    count: stats?.tickets?.open ?? 0 },
                { key: 'En progreso', count: stats?.tickets?.in_progress ?? 0 },
                { key: 'Resueltos',   count: stats?.tickets?.resolved ?? 0 },
              ]}
              linkTo="/dashboard" linkLabel="Ver tickets"
            />
          </div>

          {/* Groups + members */}
          {groups.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-300">Grupos y miembros</h2>
                <Link to="/admin/grupos" className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                  Gestionar <IconArrow />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map(g => {
                  const members = membersOf(g.id);
                  return (
                    <div key={g.id} className="rounded-2xl p-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-cyan-400" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                          <IconLayers />
                        </div>
                        <div>
                          <p className="text-zinc-200 text-sm font-bold leading-tight">{g.name}</p>
                          <p className="text-zinc-600 text-[10px]">{members.length} miembro{members.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {members.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {members.map(u => <UserChip key={u.id} user={u} />)}
                        </div>
                      ) : (
                        <p className="text-zinc-700 text-xs italic">Sin miembros asignados.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unassigned users */}
          {unassigned.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Sin grupo asignado</p>
              <div className="flex flex-wrap gap-1.5">
                {unassigned.map(u => <UserChip key={u.id} user={u} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Admin' };

const IconTicket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
  </svg>
);

const IconKanban = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="14" rx="1"/>
  </svg>
);

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
  </svg>
);

const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25 shadow-sm'
            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
        }`
      }
    >
      <span className="shrink-0 opacity-80" aria-hidden="true">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Sidebar({ onSearchOpen, onClose, isOpen }) {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-60 flex flex-col z-30 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      style={{ background: '#0e0e16', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Brand */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            <span className="text-white font-black text-xs tracking-tight">AX</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-zinc-100 font-bold text-sm leading-tight tracking-tight">AgentX</p>
            {company && (
              <p className="text-zinc-400 text-[11px] truncate mt-0.5">{company.name}</p>
            )}
          </div>
          <NotificationBell />
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Ctrl+K search trigger */}
        <button
          onClick={onSearchOpen}
          aria-label="Abrir búsqueda global"
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 text-xs transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav aria-label="Menú principal" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 mb-2.5">
          Principal
        </p>
        <NavItem to="/dashboard"    icon={<IconGrid />}    label="Dashboard" />
        <NavItem to="/kanban"       icon={<IconKanban />}  label="Kanban" />
        <NavItem to="/mis-tickets"  icon={<IconTicket />}  label="Mis tickets" />
        <NavItem to="/tickets/new"  icon={<IconPlus />}    label="Nuevo ticket" />

        {user?.role === 'admin' && (
          <>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 mt-6 mb-2.5">
              Administración
            </p>
            <NavItem to="/admin"             icon={<IconBuilding />} label="Empresa" />
            <NavItem to="/admin/usuarios"  icon={<IconUsers />}    label="Usuarios" />
            <NavItem to="/admin/grupos"    icon={<IconLayers />}   label="Grupos" />
            <NavItem to="/admin/categorias" icon={<IconTag />}       label="Categorías" />
            <NavItem to="/admin/reportes"      icon={<IconBarChart />}  label="Reportes" />
            <NavItem to="/admin/actividad"     icon={<IconActivity />}  label="Actividad" />
            <NavItem to="/admin/sla"           icon={<IconClock />}     label="SLA" />
            <NavItem to="/admin/configuracion" icon={<IconSettings />}  label="Configuración" />
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5 group" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-violet-300 text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-zinc-200 text-xs font-semibold truncate leading-tight group-hover:text-violet-300 transition-colors">{user?.name}</p>
            <p className="text-zinc-400 text-[11px] mt-0.5">{ROLE_LABELS[user?.role] ?? user?.role}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 shrink-0" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <IconLogout />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

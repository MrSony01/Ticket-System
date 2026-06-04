import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Admin' };

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        }`
      }
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">AX</span>
          </div>
          <div>
            <p className="text-slate-100 font-bold text-sm leading-tight">AgentX</p>
            {company && (
              <p className="text-slate-500 text-xs truncate max-w-[120px]">{company.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
          Principal
        </p>
        <NavItem to="/dashboard"      icon="⊞" label="Dashboard" />
        <NavItem to="/tickets/new"    icon="＋" label="Nuevo ticket" />
        {user?.role === 'admin' && (
          <>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mt-4 mb-2">
              Admin
            </p>
            <NavItem to="/admin/usuarios" icon="◎" label="Usuarios" />
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs">{ROLE_LABELS[user?.role] ?? user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <span>⎋</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

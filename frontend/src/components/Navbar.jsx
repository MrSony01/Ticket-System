import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { admin: 'Admin', technician: 'Técnico', user: 'Usuario' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <Link to="/" className="text-lg font-bold tracking-wide">
        TicketSystem
      </Link>

      <div className="flex items-center gap-5 text-sm">
        <Link to="/tickets/new" className="bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-blue-50 transition">
          + Nuevo ticket
        </Link>

        <span className="text-blue-200">
          {user?.name}
          <span className="ml-2 bg-blue-600 rounded px-1.5 py-0.5 text-xs">
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </span>

        <button
          onClick={handleLogout}
          className="text-blue-200 hover:text-white transition"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}

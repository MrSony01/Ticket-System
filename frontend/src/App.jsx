import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import AdminUsers from './pages/AdminUsers';
import AdminPanel from './pages/AdminPanel';
import AdminGroups from './pages/AdminGroups';
import AdminCategories from './pages/AdminCategories';
import AdminReports   from './pages/AdminReports';
import AdminSettings  from './pages/AdminSettings';
import AdminActivity  from './pages/AdminActivity';
import AdminSLA       from './pages/AdminSLA';
import UserProfile    from './pages/UserProfile';
import MyTickets      from './pages/MyTickets';
import Kanban         from './pages/Kanban';
import AcceptInvite   from './pages/AcceptInvite';
import GlobalSearch   from './components/GlobalSearch';
import { useState, useEffect } from 'react';

function AppLayout({ children }) {
  const [searchOpen, setSidebarSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarSearch(v => !v);
      }
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: '#080810' }}>
      {/* Skip link — keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={() => { setSidebarSearch(true); setSidebarOpen(false); }}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 min-h-screen overflow-y-auto md:ml-60 focus:outline-none">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 sticky top-0 z-10" style={{ background: '#080810', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-zinc-100 font-bold text-sm tracking-tight">AgentX</span>
        </div>
        {children}
      </main>

      {searchOpen && <GlobalSearch onClose={() => setSidebarSearch(false)} />}
    </div>
  );
}

function PublicHome() {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<PublicHome />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/perfil" element={
            <ProtectedRoute>
              <AppLayout><UserProfile /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/mis-tickets" element={
            <ProtectedRoute>
              <AppLayout><MyTickets /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/kanban" element={
            <ProtectedRoute>
              <AppLayout><Kanban /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/new" element={
            <ProtectedRoute>
              <AppLayout><CreateTicket /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/:id" element={
            <ProtectedRoute>
              <AppLayout><TicketDetail /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <AppLayout><AdminPanel /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/usuarios" element={
            <AdminRoute>
              <AppLayout><AdminUsers /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/grupos" element={
            <AdminRoute>
              <AppLayout><AdminGroups /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/categorias" element={
            <AdminRoute>
              <AppLayout><AdminCategories /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/reportes" element={
            <AdminRoute>
              <AppLayout><AdminReports /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/configuracion" element={
            <AdminRoute>
              <AppLayout><AdminSettings /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/actividad" element={
            <AdminRoute>
              <AppLayout><AdminActivity /></AppLayout>
            </AdminRoute>
          } />

          <Route path="/admin/sla" element={
            <AdminRoute>
              <AppLayout><AdminSLA /></AppLayout>
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

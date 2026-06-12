import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import UserProfile    from './pages/UserProfile';
import MyTickets      from './pages/MyTickets';
import Kanban         from './pages/Kanban';
import AcceptInvite from './pages/AcceptInvite';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#080810' }}>
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

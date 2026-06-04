import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = ['user', 'technician', 'admin'];
const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Admin' };
const ROLE_STYLES = {
  user:       'bg-slate-700/50 text-slate-300 border-slate-600/40',
  technician: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  admin:      'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

const inputCls  = 'w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
const selectCls = 'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ─── Modal crear usuario ───────────────────────── */
function Modal({ groups, onClose, onCreated, onGroupCreated }) {
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'user', group_id: '' });
  const [newGroup, setNewGroup] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateGroup() {
    if (!newGroup.trim()) return;
    setCreatingGroup(true);
    try {
      const group = await api.post('/admin/groups', { name: newGroup.trim() });
      onGroupCreated(group);
      setForm(prev => ({ ...prev, group_id: String(group.id) }));
      setNewGroup('');
      setShowNewGroup(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
        group_id: form.group_id ? Number(form.group_id) : undefined,
      };
      const user = await api.post('/admin/users', payload);
      onCreated(user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <h2 className="text-slate-100 font-bold">Crear usuario</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Field label="Nombre">
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Juan García" className={inputCls} />
          </Field>

          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="juan@empresa.com" className={inputCls} />
          </Field>

          <Field label="Contraseña">
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rol">
              <select name="role" value={form.role} onChange={handleChange} className={selectCls}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>

            <Field label="Grupo / Área">
              <select
                name="group_id"
                value={form.group_id}
                onChange={handleChange}
                className={selectCls}
              >
                <option value="">Sin grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Crear grupo inline */}
          {!showNewGroup ? (
            <button
              type="button"
              onClick={() => setShowNewGroup(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
            >
              <span className="text-base leading-none">＋</span>
              Crear nuevo grupo
            </button>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo grupo</p>
              <div className="flex gap-2">
                <input
                  value={newGroup}
                  onChange={e => setNewGroup(e.target.value)}
                  placeholder="ej: Soporte técnico"
                  className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateGroup())}
                />
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroup.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {creatingGroup ? '...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewGroup(false); setNewGroup(''); }}
                  className="text-slate-400 hover:text-slate-200 px-2 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 text-slate-400 border border-slate-700 hover:border-slate-600 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────── */
export default function AdminUsers() {
  const { user: me }   = useAuth();
  const [users,  setUsers]  = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState(null);

  async function load() {
    try {
      const [u, g] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/groups'),
      ]);
      setUsers(u);
      setGroups(g);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId, role) {
    setRoleLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setRoleLoading(null);
    }
  }

  async function handleDelete(userId, name) {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  }

  function handleCreated(newUser) {
    setUsers(prev => [...prev, { ...newUser, created_at: new Date().toISOString() }]);
  }

  function handleGroupCreated(group) {
    setGroups(prev => [...prev, group].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Usuarios</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestiona los miembros de tu empresa.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <span className="text-base leading-none">＋</span>
          Nuevo usuario
        </button>
      </div>

      {/* Grupos badge strip */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-slate-500 self-center">Grupos:</span>
          {groups.map(g => (
            <span key={g.id} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
              {g.name} ({users.filter(u => u.group_id === g.id).length})
            </span>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center gap-3 text-slate-500 py-12">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
          Cargando...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1.2fr_120px_120px_100px] gap-4 px-5 py-3 border-b border-slate-800">
            {['Nombre', 'Email', 'Grupo', 'Rol', ''].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-slate-500 text-sm px-5 py-8">No hay usuarios en esta empresa.</p>
          )}

          <ul className="divide-y divide-slate-800">
            {users.map(u => (
              <li key={u.id} className="grid grid-cols-[1fr_1.2fr_120px_120px_100px] gap-4 items-center px-5 py-4">
                {/* Nombre */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <span className="text-indigo-300 text-xs font-bold">{u.name[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">
                      {u.name}
                      {u.id === me?.id && <span className="ml-2 text-xs text-slate-500">(tú)</span>}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <p className="text-slate-400 text-sm truncate">{u.email}</p>

                {/* Grupo */}
                <div>
                  {u.group_name
                    ? <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-full">{u.group_name}</span>
                    : <span className="text-xs text-slate-600">—</span>
                  }
                </div>

                {/* Rol */}
                <div>
                  {u.id === me?.id ? (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_STYLES[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={roleLoading === u.id}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex justify-end">
                  {u.id !== me?.id && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <Modal
          groups={groups}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

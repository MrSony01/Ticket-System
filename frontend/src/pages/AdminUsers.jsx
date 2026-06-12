import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = ['user', 'technician', 'admin'];
const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Admin' };
const ROLE_STYLES = {
  user:       { bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)', color: '#a1a1aa' },
  technician: { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   color: '#67e8f9' },
  admin:      { bg: 'rgba(124,58,237,0.15)',  border: 'rgba(139,92,246,0.3)', color: '#a78bfa' },
};

const inputCls = 'w-full text-zinc-200 placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800 focus:border-violet-500/50';
const inputStyle = { background: 'rgba(255,255,255,0.04)' };

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.user;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

const IconPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconLink   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconCopy   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconClock  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>;
const IconX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconUser  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconCalendar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

/* ─── User Detail Modal ──────────────────────────────────────── */
function UserDetailModal({ user, groups, me, onClose, onRoleChange, onGroupChange, onDelete }) {
  const [role,    setRole]    = useState(user.role);
  const [groupId, setGroupId] = useState(user.group_id ? String(user.group_id) : '');
  const [saving,  setSaving]  = useState(false);
  const isSelf = user.id === me?.id;
  const rs = ROLE_STYLES[user.role] ?? ROLE_STYLES.user;
  const initials = user.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';

  async function saveRole(newRole) {
    if (newRole === role || isSelf) return;
    setSaving(true);
    await onRoleChange(user.id, newRole);
    setRole(newRole);
    setSaving(false);
  }

  async function saveGroup(newGroupId) {
    setGroupId(newGroupId);
    setSaving(true);
    await onGroupChange(user.id, newGroupId ? Number(newGroupId) : null);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-zinc-100 font-bold text-sm">Detalle de usuario</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800">
            <IconX />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0" style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-zinc-100 font-bold text-base truncate">
                {user.name}
                {isSelf && <span className="ml-2 text-xs text-zinc-600 font-normal">(tú)</span>}
              </p>
              <RoleBadge role={user.role} />
            </div>
          </div>

          {/* Info rows */}
          <div className="rounded-xl divide-y" style={{ border: '1px solid rgba(255,255,255,0.07)', divideColor: 'rgba(255,255,255,0.05)' }}>
            {[
              { icon: <IconMail />,     label: 'Email',   value: user.email },
              { icon: <IconUser />,     label: 'Grupo',   value: user.group_name ?? <span className="text-zinc-600 italic">Sin grupo</span> },
              { icon: <IconCalendar />, label: 'Miembro desde', value: new Date(user.created_at).toLocaleDateString('es', { dateStyle: 'medium' }) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-zinc-600 shrink-0">{icon}</span>
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider w-28 shrink-0">{label}</span>
                <span className="text-sm text-zinc-300 truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* Edit controls */}
          {!isSelf && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Editar</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Rol</label>
                  <select value={role} onChange={e => saveRole(e.target.value)} disabled={saving}
                    className={inputCls} style={inputStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Grupo</label>
                  <select value={groupId} onChange={e => saveGroup(e.target.value)} disabled={saving}
                    className={inputCls} style={inputStyle}>
                    <option value="">Sin grupo</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              {saving && <p className="text-[11px] text-zinc-600">Guardando...</p>}
            </div>
          )}

          {/* Delete */}
          {!isSelf && (
            <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { onDelete(user.id, user.name); onClose(); }}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-red-400 transition-colors px-3 py-2 rounded-lg border border-transparent"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <IconTrash /> Eliminar usuario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Invite Modal ───────────────────────────────────────────── */
function InviteModal({ groups, onClose, onCreated }) {
  const [form,    setForm]    = useState({ name: '', email: '', role: 'user', group_id: '' });
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/admin/users/invite', {
        name: form.name, email: form.email, role: form.role,
        group_id: form.group_id ? Number(form.group_id) : undefined,
      });
      const url = `${window.location.origin}/invite/${res.invite_token}`;
      setInviteUrl(url);
      onCreated({ ...res, created_at: new Date().toISOString(), invite_pending: 1 });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copyUrl() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-zinc-100 font-bold text-sm">Invitar usuario</h2>
            <p className="text-zinc-600 text-xs mt-0.5">Se genera un link para que el usuario active su cuenta.</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"><IconX /></button>
        </div>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</div>}
            {[
              { label: 'Nombre completo', name: 'name',  type: 'text',  placeholder: 'Juan García' },
              { label: 'Email',           name: 'email', type: 'email', placeholder: 'juan@empresa.com' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} required placeholder={f.placeholder} className={inputCls} style={inputStyle} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {['role', 'group_id'].map(name => (
                <div key={name}>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{name === 'role' ? 'Rol' : 'Grupo'}</label>
                  <select name={name} value={form[name]} onChange={handleChange} className={inputCls} style={inputStyle}>
                    {name === 'role'
                      ? ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)
                      : <><option value="">Sin grupo</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</>
                    }
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="submit" disabled={loading}
                className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-80 disabled:opacity-40 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                {loading ? 'Generando...' : 'Generar invitación'}
              </button>
              <button type="button" onClick={onClose} className="px-4 text-zinc-400 rounded-xl text-sm border border-zinc-800 hover:border-zinc-700 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p className="text-zinc-100 font-bold text-sm">¡Invitación creada!</p>
                <p className="text-zinc-500 text-xs">Comparte este link con {form.name}.</p>
              </div>
            </div>

            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Link de invitación</p>
              <p className="text-xs font-mono text-violet-400 break-all leading-relaxed">{inviteUrl}</p>
            </div>

            <button
              onClick={copyUrl}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={copied
                ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }
                : { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }
              }
            >
              <IconCopy />
              {copied ? 'Copiado' : 'Copiar link'}
            </button>

            <button onClick={onClose} className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors py-1">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Create User Modal ──────────────────────────────────────── */
function CreateModal({ groups, onClose, onCreated, onGroupCreated }) {
  const [form, setForm]               = useState({ name: '', email: '', password: '', role: 'user', group_id: '' });
  const [newGroup, setNewGroup]       = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleCreateGroup() {
    if (!newGroup.trim()) return;
    setCreatingGroup(true);
    try {
      const group = await api.post('/admin/groups', { name: newGroup.trim() });
      onGroupCreated(group);
      setForm(prev => ({ ...prev, group_id: String(group.id) }));
      setNewGroup(''); setShowNewGroup(false);
    } catch (err) { setError(err.message); }
    finally { setCreatingGroup(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await api.post('/admin/users', {
        name: form.name, email: form.email, password: form.password,
        role: form.role, group_id: form.group_id ? Number(form.group_id) : undefined,
      });
      onCreated(user); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-zinc-100 font-bold text-sm">Crear usuario</h2>
            <p className="text-zinc-600 text-xs mt-0.5">Agrega un nuevo miembro a tu empresa.</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</div>}
          {[
            { label: 'Nombre completo', name: 'name',     type: 'text',     placeholder: 'Juan García' },
            { label: 'Email',           name: 'email',    type: 'email',    placeholder: 'juan@empresa.com' },
            { label: 'Contraseña',      name: 'password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} required placeholder={f.placeholder} className={inputCls} style={inputStyle} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {['role', 'group_id'].map(name => (
              <div key={name}>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{name === 'role' ? 'Rol' : 'Grupo'}</label>
                <select name={name} value={form[name]} onChange={handleChange} className={inputCls} style={inputStyle}>
                  {name === 'role'
                    ? ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)
                    : <><option value="">Sin grupo</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</>
                  }
                </select>
              </div>
            ))}
          </div>
          {!showNewGroup ? (
            <button type="button" onClick={() => setShowNewGroup(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 font-medium transition-colors">
              <IconPlus /> Crear nuevo grupo
            </button>
          ) : (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Nuevo grupo</p>
              <div className="flex gap-2">
                <input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="ej: Soporte técnico"
                  className="flex-1 text-zinc-200 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition border border-zinc-700"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateGroup())} />
                <button type="button" onClick={handleCreateGroup} disabled={creatingGroup || !newGroup.trim()}
                  className="text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-80 disabled:opacity-40" style={{ background: '#7c3aed' }}>
                  {creatingGroup ? '...' : 'Crear'}
                </button>
                <button type="button" onClick={() => { setShowNewGroup(false); setNewGroup(''); }} className="text-zinc-500 hover:text-zinc-300 px-2 transition-colors">
                  <IconX />
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="submit" disabled={loading}
              className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-80 disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-zinc-400 rounded-xl text-sm border border-zinc-800 hover:border-zinc-700 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AdminUsers() {
  const { user: me }  = useAuth();
  const [users,  setUsers]  = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [showInvite, setShowInvite]   = useState(false);
  const [selected,   setSelected]     = useState(null);

  async function load() {
    try {
      const [u, g] = await Promise.all([api.get('/admin/users'), api.get('/admin/groups')]);
      setUsers(u); setGroups(g);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId, role) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) { alert(err.message); }
  }

  async function handleGroupChange(userId, groupId) {
    try {
      await api.patch(`/admin/users/${userId}/group`, { group_id: groupId });
      const groupName = groups.find(g => g.id === groupId)?.name ?? null;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, group_id: groupId, group_name: groupName } : u));
      if (selected?.id === userId) setSelected(prev => ({ ...prev, group_id: groupId, group_name: groupName }));
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(userId, name) {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Usuarios</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{users.length} miembro{users.length !== 1 ? 's' : ''} en tu empresa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 text-violet-300 text-sm font-semibold px-4 py-2.5 rounded-xl border border-violet-500/30 hover:bg-violet-500/10 transition-colors">
            <IconLink /> Invitar
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-85 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            <IconPlus /> Nuevo usuario
          </button>
        </div>
      </div>

      {loading && <div className="flex items-center gap-3 text-zinc-600 py-12"><div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />Cargando...</div>}
      {error   && <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</div>}

      {!loading && !error && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Table header */}
          <div className="grid gap-4 px-5 py-3" style={{ gridTemplateColumns: '1fr 1.2fr 120px 130px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Usuario', 'Email', 'Grupo', 'Rol'].map(h => (
              <span key={h} className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{h}</span>
            ))}
          </div>

          {users.length === 0 && <p className="text-zinc-600 text-sm px-5 py-8">No hay usuarios en esta empresa.</p>}

          <ul>
            {users.map((u, i) => {
              const initials = u.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';
              const rs = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
              return (
                <li key={u.id}
                  className="grid gap-4 items-center px-5 py-4 cursor-pointer transition-colors"
                  style={{ gridTemplateColumns: '1fr 1.2fr 120px 130px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  onClick={() => setSelected(u)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-200 text-sm font-medium truncate">
                          {u.name}{u.id === me?.id && <span className="ml-2 text-[10px] text-zinc-600 font-normal">(tú)</span>}
                        </p>
                        {u.invite_pending === 1 && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                            <IconClock /> Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-600 text-[11px]">{new Date(u.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}</p>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs truncate">{u.email}</p>
                  <div>
                    {u.group_name
                      ? <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>{u.group_name}</span>
                      : <span className="text-zinc-700 text-xs">—</span>}
                  </div>
                  <RoleBadge role={u.role} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selected && (
        <UserDetailModal
          user={selected}
          groups={groups}
          me={me}
          onClose={() => setSelected(null)}
          onRoleChange={handleRoleChange}
          onGroupChange={handleGroupChange}
          onDelete={handleDelete}
        />
      )}

      {showCreate && (
        <CreateModal
          groups={groups}
          onClose={() => setShowCreate(false)}
          onCreated={u => setUsers(prev => [...prev, { ...u, created_at: new Date().toISOString() }])}
          onGroupCreated={g => setGroups(prev => [...prev, g].sort((a, b) => a.name.localeCompare(b.name)))}
        />
      )}

      {showInvite && (
        <InviteModal
          groups={groups}
          onClose={() => setShowInvite(false)}
          onCreated={u => setUsers(prev => [...prev, u])}
        />
      )}
    </div>
  );
}

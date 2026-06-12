import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Admin' };
const ROLE_STYLES = {
  user:       { bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)', color: '#a1a1aa' },
  technician: { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   color: '#67e8f9' },
  admin:      { bg: 'rgba(124,58,237,0.15)',  border: 'rgba(139,92,246,0.3)', color: '#a78bfa' },
};

const IconPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconX      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconLayers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function AdminGroups() {
  const [groups,   setGroups]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [newName,  setNewName]  = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expanded, setExpanded] = useState(null);  // group id currently open
  const [addingTo, setAddingTo] = useState(null);  // group id showing add-member selector

  async function load() {
    try {
      const [g, u] = await Promise.all([api.get('/admin/groups'), api.get('/admin/users')]);
      setGroups(g); setUsers(u);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setCreateError('');
    try {
      const group = await api.post('/admin/groups', { name: newName.trim() });
      setGroups(prev => [...prev, group].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  async function handleDeleteGroup(id, name) {
    if (!confirm(`¿Eliminar el grupo "${name}"? Los usuarios quedarán sin grupo.`)) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      setUsers(prev => prev.map(u => u.group_id === id ? { ...u, group_id: null, group_name: null } : u));
      if (expanded === id) setExpanded(null);
    } catch (err) { alert(err.message); }
  }

  async function handleAddMember(groupId, userId) {
    try {
      await api.patch(`/admin/users/${userId}/group`, { group_id: groupId });
      const groupName = groups.find(g => g.id === groupId)?.name ?? null;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, group_id: groupId, group_name: groupName } : u));
      setAddingTo(null);
    } catch (err) { alert(err.message); }
  }

  async function handleRemoveMember(userId) {
    try {
      await api.patch(`/admin/users/${userId}/group`, { group_id: null });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, group_id: null, group_name: null } : u));
    } catch (err) { alert(err.message); }
  }

  const membersOf     = (groupId) => users.filter(u => u.group_id === groupId);
  const notInGroup    = (groupId) => users.filter(u => u.group_id !== groupId);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Grupos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Organiza tu equipo en áreas de trabajo.</p>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Nuevo grupo</p>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="ej: Soporte técnico, Facturación..."
            className="flex-1 text-zinc-200 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800"
            style={{ background: 'rgba(255,255,255,0.04)' }} />
          <button type="submit" disabled={creating || !newName.trim()}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-80 disabled:opacity-40 shrink-0 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <IconPlus /> Crear
          </button>
        </form>
        {createError && <p className="text-xs mt-2 px-1" style={{ color: '#fca5a5' }}>{createError}</p>}
      </div>

      {loading && <div className="flex items-center gap-3 text-zinc-600 py-8"><div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />Cargando...</div>}
      {error   && <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</div>}

      {!loading && !error && groups.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-zinc-700" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <p className="text-zinc-500 text-sm">No hay grupos aún.</p>
          <p className="text-zinc-700 text-xs mt-1">Crea el primero usando el formulario de arriba.</p>
        </div>
      )}

      {/* Group list */}
      <div className="space-y-3">
        {groups.map(g => {
          const members = membersOf(g.id);
          const available = notInGroup(g.id);
          const isOpen = expanded === g.id;

          return (
            <div key={g.id} className="rounded-2xl overflow-hidden" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>

              {/* Group header — clickeable */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                onClick={() => setExpanded(isOpen ? null : g.id)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-cyan-400" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <IconLayers />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-zinc-100 font-bold text-sm">{g.name}</p>
                  <p className="text-zinc-600 text-[11px] mt-0.5">{members.length} miembro{members.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-zinc-600 mr-2"><IconChevron open={isOpen} /></span>
                {/* Delete — stops propagation */}
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id, g.name); }}
                  className="flex items-center gap-1 text-xs text-zinc-600 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg border border-transparent"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <IconTrash />
                </span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Member list */}
                  {members.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {members.map(u => {
                        const rs = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
                        const initials = u.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';
                        return (
                          <li key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-200 text-sm font-medium truncate">{u.name}</p>
                              <p className="text-zinc-600 text-[11px]">{u.email}</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                              {ROLE_LABELS[u.role]}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(u.id)}
                              title="Quitar del grupo"
                              className="text-zinc-600 hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center rounded-lg shrink-0"
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <IconX />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-zinc-700 text-xs italic mt-4">Sin miembros asignados.</p>
                  )}

                  {/* Add member */}
                  <div className="mt-4">
                    {addingTo === g.id ? (
                      <div className="flex gap-2">
                        <select
                          defaultValue=""
                          onChange={e => e.target.value && handleAddMember(g.id, Number(e.target.value))}
                          className="flex-1 text-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          <option value="">Seleccionar usuario...</option>
                          {available.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>
                          ))}
                        </select>
                        <button onClick={() => setAddingTo(null)}
                          className="text-zinc-600 hover:text-zinc-300 px-3 rounded-xl border border-zinc-800 transition-colors text-xs">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTo(g.id)}
                        disabled={available.length === 0}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors disabled:text-zinc-700 disabled:cursor-not-allowed"
                      >
                        <IconPlus /> Agregar miembro
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

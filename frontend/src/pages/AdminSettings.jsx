import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
  </svg>
);

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-zinc-200 text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function AdminSettings() {
  const { updateCompany } = useAuth();

  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);

  const [newName,   setNewName]   = useState('');
  const [password,  setPassword]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/admin/company')
      .then(data => {
        setInfo(data);
        setNewName(data.name);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newName.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    if (!password) {
      setError('Debes introducir tu contraseña para confirmar el cambio.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/admin/company', { name: newName.trim(), password });
      setInfo(prev => ({ ...prev, name: res.name }));
      setSuccess(res.message);
      setPassword('');
      // Reflect new name in sidebar immediately (no re-login needed)
      updateCompany({ name: res.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isDirty = info && newName.trim() !== info.name;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Configuración</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Gestiona los datos de tu empresa.</p>
      </div>

      {/* Company info card */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-violet-400"><IconBuilding /></span>
          <p className="text-zinc-200 font-bold text-sm">Información de la empresa</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <InfoRow label="Slug (identificador)"  value={info?.slug} />
            <InfoRow label="Miembros"              value={info?.member_count} />
            <InfoRow label="Cuenta creada"         value={info?.created_at ? new Date(info.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
          </div>
        )}
      </div>

      {/* Change name form */}
      <div className="rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-zinc-200 font-bold text-sm mb-1">Cambiar nombre de empresa</p>
        <p className="text-zinc-600 text-xs mb-5">Este nombre es visible para todos los miembros de tu organización.</p>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre de empresa</label>
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setSuccess(''); setError(''); }}
              maxLength={150}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              disabled={loading}
            />
          </div>

          {/* Password confirmation — only shown when name has changed */}
          {isDirty && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400"><IconShield /></span>
                  Confirma tu contraseña para aplicar el cambio
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Tu contraseña actual"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.25)' }}
              />
              <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1">
                <span className="text-amber-500/70"><IconShield /></span>
                Por seguridad, los cambios en el nombre de la empresa requieren verificación.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isDirty ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.06)',
                color: isDirty ? '#fff' : '#52525b',
                boxShadow: isDirty ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

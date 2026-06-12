import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { user: 'Usuario', technician: 'Técnico', admin: 'Administrador' };
const ROLE_COLORS = { user: '#71717a', technician: '#22d3ee', admin: '#a78bfa' };

const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-zinc-200 font-bold text-sm mb-0.5">{title}</p>
      {subtitle && <p className="text-zinc-600 text-xs mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Alert({ type, message }) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return (
    <div className={`border text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2 ${styles[type]}`}>
      {type === 'success' && <IconCheck />}
      {message}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

export default function UserProfile() {
  const { user, login: authLogin, company } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Info form state
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [infoPass, setInfoPass] = useState('');
  const [infoMsg,  setInfoMsg]  = useState(null); // { type, text }
  const [infoSaving, setInfoSaving] = useState(false);

  // Password form state
  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [cfmPass,  setCfmPass]  = useState('');
  const [passMsg,  setPassMsg]  = useState(null);
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(data => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch(err => setInfoMsg({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const emailChanged = profile && email.trim().toLowerCase() !== profile.email;
  const infoChanged  = profile && (name.trim() !== profile.name || emailChanged);

  async function handleInfoSave(e) {
    e.preventDefault();
    setInfoMsg(null);
    setInfoSaving(true);
    try {
      const res = await api.patch('/auth/me', { name, email, currentPassword: infoPass || undefined });
      setProfile(prev => ({ ...prev, name: res.name, email: res.email }));
      setInfoPass('');
      setInfoMsg({ type: 'success', text: res.message });
      // Re-issue token + update auth context
      if (res.token) {
        authLogin(
          { ...user, name: res.name, email: res.email },
          res.token,
          company
        );
      }
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.message });
    } finally {
      setInfoSaving(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPassMsg(null);
    if (newPass !== cfmPass) {
      setPassMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setPassSaving(true);
    try {
      const res = await api.patch('/auth/me/password', { currentPassword: curPass, newPassword: newPass });
      setPassMsg({ type: 'success', text: res.message });
      setCurPass(''); setNewPass(''); setCfmPass('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    } finally {
      setPassSaving(false);
    }
  }

  const initials = profile?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Cuenta</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Mi perfil</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Gestiona tu información personal.</p>
      </div>

      {/* Avatar + role card */}
      <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-violet-200 text-lg font-black"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
          {loading ? '?' : initials}
        </div>
        <div>
          <p className="text-zinc-100 font-bold text-base leading-tight">{profile?.name ?? '—'}</p>
          <p className="text-zinc-500 text-sm">{profile?.email ?? '—'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ROLE_COLORS[profile?.role]}22`, color: ROLE_COLORS[profile?.role], border: `1px solid ${ROLE_COLORS[profile?.role]}44` }}>
              {ROLE_LABELS[profile?.role] ?? profile?.role}
            </span>
            <span className="text-zinc-700 text-xs">{profile?.company_name}</span>
          </div>
        </div>
      </div>

      {/* Info section */}
      <Section title="Información personal" subtitle="Actualiza tu nombre y email.">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleInfoSave} className="space-y-4">
            {infoMsg && <Alert type={infoMsg.type} message={infoMsg.text} />}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre">
                <input type="text" value={name} onChange={e => { setName(e.target.value); setInfoMsg(null); }}
                  className={inputCls} style={inputStyle} maxLength={150} />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setInfoMsg(null); }}
                  className={inputCls} style={inputStyle} maxLength={255} />
              </Field>
            </div>

            {emailChanged && (
              <Field label={<span className="flex items-center gap-1.5 text-amber-400"><IconShield />Confirma tu contraseña para cambiar el email</span>}>
                <input type="password" value={infoPass} onChange={e => { setInfoPass(e.target.value); setInfoMsg(null); }}
                  placeholder="Tu contraseña actual" autoComplete="current-password"
                  className={inputCls} style={{ ...inputStyle, border: '1px solid rgba(251,191,36,0.3)' }} />
              </Field>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={!infoChanged || infoSaving}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: infoChanged ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.06)', color: infoChanged ? '#fff' : '#52525b', boxShadow: infoChanged ? '0 4px 14px rgba(124,58,237,0.3)' : 'none' }}>
                {infoSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* Password section */}
      <Section title="Cambiar contraseña" subtitle="Usa una contraseña segura de al menos 6 caracteres.">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {passMsg && <Alert type={passMsg.type} message={passMsg.text} />}
          <Field label="Contraseña actual">
            <input type="password" value={curPass} onChange={e => { setCurPass(e.target.value); setPassMsg(null); }}
              placeholder="••••••••" autoComplete="current-password"
              className={inputCls} style={inputStyle} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nueva contraseña">
              <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setPassMsg(null); }}
                placeholder="••••••••" autoComplete="new-password"
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Confirmar nueva contraseña">
              <input type="password" value={cfmPass} onChange={e => { setCfmPass(e.target.value); setPassMsg(null); }}
                placeholder="••••••••" autoComplete="new-password"
                className={inputCls} style={{ ...inputStyle, borderColor: cfmPass && cfmPass !== newPass ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)' }} />
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={!curPass || !newPass || !cfmPass || passSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              {passSaving ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}

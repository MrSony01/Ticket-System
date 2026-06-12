import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

const inputCls =
  'w-full text-zinc-200 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800 focus:border-violet-500/50 bg-transparent';

export default function AcceptInvite() {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [info,     setInfo]     = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    api.get(`/auth/invite/${token}`)
      .then(setInfo)
      .catch(() => setNotFound(true));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)  { setError('Mínimo 6 caracteres.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post(`/auth/invite/${token}`, { password });
      navigate('/login?registered=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" style={{ background: '#080810' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <span className="text-white font-black text-base">AX</span>
          </div>
          <h1 className="text-xl font-black text-zinc-100 tracking-tight">Activar cuenta</h1>
          <p className="text-zinc-500 text-sm mt-1 text-center">
            {info ? `Fuiste invitado a ${info.company_name}` : 'Verificando invitación...'}
          </p>
        </div>

        {notFound && (
          <div className="text-center space-y-3">
            <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              Esta invitación no existe o ya fue utilizada.
            </div>
            <Link to="/login" className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">
              Ir al login →
            </Link>
          </div>
        )}

        {info && (
          <>
            <div className="rounded-xl px-4 py-3 mb-5 space-y-1" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <p className="text-xs text-zinc-400"><span className="text-zinc-600 font-semibold">Nombre:</span> {info.name}</p>
              <p className="text-xs text-zinc-400"><span className="text-zinc-600 font-semibold">Email:</span> {info.email}</p>
            </div>

            {error && (
              <div className="text-xs rounded-xl px-3.5 py-2.5 mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repite la contraseña" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40 mt-1"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
              >
                {loading ? 'Activando...' : 'Activar cuenta'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

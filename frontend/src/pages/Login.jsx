import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const inputCls =
  'w-full text-zinc-200 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800 focus:border-violet-500/50 bg-transparent';

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function Login() {
  const { login }      = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', form);
      login(data.user, data.token, data.company);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" style={{ background: '#080810' }}>

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.1) 0%, transparent 70%)' }} />

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <IconArrow />
        Volver al inicio
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <span className="text-white font-black text-base">AX</span>
          </div>
          <h1 className="text-xl font-black text-zinc-100 tracking-tight">
            {justRegistered ? '¡Empresa creada!' : 'Iniciar sesión'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 text-center">
            {justRegistered
              ? 'Tu cuenta está lista. Ingresa con tus credenciales.'
              : 'Accede a tu espacio de trabajo.'}
          </p>
        </div>

        {/* Success banner */}
        {justRegistered && (
          <div className="flex items-center gap-2.5 text-xs rounded-xl px-3.5 py-2.5 mb-5" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Empresa registrada exitosamente.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs rounded-xl px-3.5 py-2.5 mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu@empresa.com" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40 mt-1"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          ¿Empresa nueva?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

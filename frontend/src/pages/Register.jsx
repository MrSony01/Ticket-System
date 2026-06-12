import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const inputCls =
  'w-full text-zinc-200 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition border border-zinc-800 focus:border-violet-500/50 bg-transparent';

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const FEATURES = [
  'Multi-tenant — tu empresa, aislada',
  'Roles: usuario, técnico y admin',
  'Notas internas y trazabilidad completa',
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', company_name: '' });
  const [slug, setSlug]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'company_name') {
      setSlug(value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login?registered=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12" style={{ background: '#080810' }}>

      {/* Background glows */}
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

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <span className="text-white font-black text-base">AX</span>
          </div>
          <h1 className="text-xl font-black text-zinc-100 tracking-tight">Crear empresa</h1>
          <p className="text-zinc-500 text-sm mt-1 text-center">Serás el administrador de tu espacio.</p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-6 p-3.5 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5 text-xs text-zinc-400">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {f}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs rounded-xl px-3.5 py-2.5 mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre de empresa</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} required placeholder="Acme Corp" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
            {slug && (
              <p className="text-[11px] text-zinc-600 mt-1.5 pl-0.5">
                Slug: <span className="font-mono" style={{ color: '#a78bfa' }}>{slug}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Tu nombre</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Juan García" className={inputCls} style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>

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
            {loading ? 'Creando...' : 'Crear empresa y cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

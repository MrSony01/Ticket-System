import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const inputCls =
  'w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-900/50">
            <span className="text-white font-bold text-2xl">AX</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">AgentX</h1>
          <p className="text-slate-400 text-lg max-w-xs">
            Empieza gratis. Tu empresa, tus tickets, tu equipo.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {['Aislamiento multi-tenant total', 'Roles: usuario, técnico y admin', 'Historial y notas internas'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AX</span>
              </div>
              <span className="text-slate-100 font-bold">AgentX</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Crear empresa</h2>
            <p className="text-slate-400 text-sm mt-1">Serás el administrador de tu espacio.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre de empresa">
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
                placeholder="Acme Corp"
                className={inputCls}
              />
              {slug && (
                <p className="text-xs text-slate-500 mt-1">
                  Slug: <span className="text-indigo-400 font-mono">{slug}</span>
                </p>
              )}
            </Field>

            <Field label="Tu nombre">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Juan García"
                className={inputCls}
              />
            </Field>

            <Field label="Email">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="tu@empresa.com"
                className={inputCls}
              />
            </Field>

            <Field label="Contraseña">
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={inputCls}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creando...' : 'Crear empresa y cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

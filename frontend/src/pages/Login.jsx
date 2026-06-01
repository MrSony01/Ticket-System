import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

const inputCls =
  'w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

export default function Login() {
  const { login }        = useAuth();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const justRegistered   = searchParams.get('registered') === '1';

  const [form, setForm]       = useState({ email: '', password: '', company_slug: '' });
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-900/50">
            <span className="text-white font-bold text-2xl">AX</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">AgentX</h1>
          <p className="text-slate-400 text-lg max-w-xs">
            Gestión de tickets inteligente para equipos modernos.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AX</span>
              </div>
              <span className="text-slate-100 font-bold">AgentX</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              {justRegistered ? '¡Empresa creada!' : 'Iniciar sesión'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {justRegistered
                ? 'Tu cuenta está lista. Ingresa con tus credenciales.'
                : 'Ingresa tus credenciales para continuar.'}
            </p>
          </div>

          {justRegistered && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">
              ✓ Empresa registrada exitosamente. Ahora inicia sesión.
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Empresa" hint="slug de tu empresa">
              <input
                name="company_slug"
                value={form.company_slug}
                onChange={handleChange}
                required
                placeholder="mi-empresa"
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
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Empresa nueva?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

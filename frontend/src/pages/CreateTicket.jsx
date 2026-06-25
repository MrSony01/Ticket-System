import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition';

const selectCls =
  'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition';

function Field({ id, label, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CreateTicket() {
  const navigate = useNavigate();

  const [form, setForm]             = useState({ title: '', description: '', priority: 'medium', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        priority:    form.priority,
        categoryId:  form.categoryId ? Number(form.categoryId) : undefined,
      };
      const { id } = await api.post('/tickets', payload);
      navigate(`/tickets/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const priorityConfig = {
    low:      { label: 'Baja',     dot: 'bg-zinc-400' },
    medium:   { label: 'Media',    dot: 'bg-amber-400' },
    high:     { label: 'Alta',     dot: 'bg-orange-400' },
    critical: { label: 'Crítica',  dot: 'bg-red-500' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Nuevo ticket</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Describe el problema con el mayor detalle posible.</p>
      </div>

      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#0f0f18] border border-zinc-800 rounded-xl p-6 space-y-5">
        <Field id="title" label="Título" required>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Describe el problema brevemente"
            className={inputCls}
          />
        </Field>

        <Field id="description" label="Descripción" required>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Explica el problema con detalle: pasos para reproducirlo, qué esperabas, qué ocurrió..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="priority" label="Prioridad">
            <div className="relative">
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={`${selectCls} w-full pl-7`}
              >
                {Object.entries(priorityConfig).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${priorityConfig[form.priority].dot}`} />
            </div>
          </Field>

          <Field id="categoryId" label="Categoría">
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className={`${selectCls} w-full`}
            >
              <option value="">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-3 pt-2 border-t border-zinc-800">
          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {loading ? 'Enviando...' : 'Crear ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-zinc-400 hover:text-zinc-200 px-5 py-2.5 rounded-lg text-sm border border-zinc-700 hover:border-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

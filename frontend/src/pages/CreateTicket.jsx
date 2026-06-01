import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const inputCls =
  'w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

const selectCls =
  'bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
        {label}
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

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Nuevo ticket</h1>
        <p className="text-slate-400 text-sm mt-0.5">Describe el problema con el mayor detalle posible.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <Field label="Título">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Describe el problema brevemente"
            className={inputCls}
          />
        </Field>

        <Field label="Descripción">
          <textarea
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
          <Field label="Prioridad">
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className={`${selectCls} w-full`}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </Field>

          <Field label="Categoría">
            <select
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

        <div className="flex gap-3 pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Crear ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 px-5 py-2.5 rounded-lg text-sm border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

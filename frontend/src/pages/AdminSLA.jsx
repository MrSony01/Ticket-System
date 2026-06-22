import { useState, useEffect } from 'react';
import { api } from '../api/client.js';

const PRIORITIES = [
  { key: 'critical', label: 'Crítica',  color: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-500' },
  { key: 'high',     label: 'Alta',     color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  { key: 'medium',   label: 'Media',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: 'bg-blue-500' },
  { key: 'low',      label: 'Baja',     color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   dot: 'bg-zinc-500' },
];

export default function AdminSLA() {
  const [sla, setSla]       = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({ response_hours: '', resolution_hours: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.get('/admin/sla')
      .then(setSla)
      .catch(() => {});
  }, []);

  function startEdit(priority) {
    const cfg = sla?.[priority] ?? { response_hours: 24, resolution_hours: 72 };
    setForm({ response_hours: cfg.response_hours, resolution_hours: cfg.resolution_hours });
    setEditing(priority);
    setError(null);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await api.patch('/admin/sla', {
        priority: editing,
        response_hours: Number(form.response_hours),
        resolution_hours: Number(form.resolution_hours),
      });
      setSla(prev => ({
        ...prev,
        [editing]: {
          priority: editing,
          response_hours: Number(form.response_hours),
          resolution_hours: Number(form.resolution_hours),
        },
      }));
      setSaved(editing);
      setTimeout(() => setSaved(null), 2000);
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-zinc-100 text-xl font-bold">Configuración SLA</h1>
        <p className="text-zinc-500 text-sm mt-1">Define tiempos de respuesta y resolución por prioridad. Los tickets que superen estos límites aparecerán como vencidos.</p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {PRIORITIES.map(({ key, label, color, bg, dot }) => {
          const cfg = sla?.[key];
          const isEditing = editing === key;

          return (
            <div
              key={key}
              className="rounded-xl p-5"
              style={{ background: '#0f0f18', border: `1px solid ${isEditing ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}` }}
            >
              <div className="flex items-start gap-4">
                {/* Priority badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg} shrink-0`}>
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-zinc-500 text-[11px] font-medium block mb-1">Respuesta (horas)</label>
                        <input
                          type="number"
                          min="1"
                          value={form.response_hours}
                          onChange={e => setForm(f => ({ ...f, response_hours: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-sm text-zinc-100 outline-none focus:border-violet-500/50"
                          style={{ background: '#080810', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[11px] font-medium block mb-1">Resolución (horas)</label>
                        <input
                          type="number"
                          min="1"
                          value={form.resolution_hours}
                          onChange={e => setForm(f => ({ ...f, resolution_hours: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-sm text-zinc-100 outline-none focus:border-violet-500/50"
                          style={{ background: '#080810', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    </div>
                    {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-4 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-4">
                    {cfg ? (
                      <div className="flex gap-6">
                        <div>
                          <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-0.5">Respuesta</p>
                          <p className="text-zinc-200 text-sm font-semibold">{cfg.response_hours}h</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-0.5">Resolución</p>
                          <p className="text-zinc-200 text-sm font-semibold">{cfg.resolution_hours}h</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-sm">Cargando...</p>
                    )}
                    <div className="flex items-center gap-2">
                      {saved === key && (
                        <span className="text-emerald-400 text-xs">✓ Guardado</span>
                      )}
                      <button
                        onClick={() => startEdit(key)}
                        className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 rounded-xl p-4 flex gap-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-violet-300 text-xs leading-relaxed">
          Los tickets abiertos se marcan como <strong>SLA breach</strong> cuando superan el tiempo de respuesta, y como <strong>vencidos</strong> cuando superan el tiempo de resolución. Los tickets resueltos o cerrados no se evalúan.
        </p>
      </div>
    </div>
  );
}

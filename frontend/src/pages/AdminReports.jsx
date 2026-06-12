import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { api } from '../api/client';

const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

const STATUS_COLORS   = { open: '#60a5fa', in_progress: '#fbbf24', resolved: '#34d399', closed: '#71717a' };
const PRIORITY_COLORS = { low: '#71717a', medium: '#60a5fa', high: '#fb923c', critical: '#ef4444' };

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e4e4e7', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

const AXIS_STYLE = { fill: '#52525b', fontSize: 11 };

function ChartCard({ title, subtitle, children, loading }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mb-4">
        <p className="text-zinc-200 font-bold text-sm">{title}</p>
        {subtitle && <p className="text-zinc-600 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-700 py-8 justify-center">
          <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : children}
    </div>
  );
}

function KpiCard({ label, value, color, sub }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-3xl font-black tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>{value ?? '—'}</p>
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-xs text-zinc-700 mt-2">{sub}</p>}
    </div>
  );
}

const CustomDotLabel = ({ cx, cy, value }) => value
  ? <text x={cx} y={cy - 8} fill="#a1a1aa" fontSize={11} textAnchor="middle">{value}</text>
  : null;

export default function AdminReports() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/admin/reports')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalTickets = data?.byStatus?.reduce((s, r) => s + Number(r.count), 0) ?? 0;

  const statusData   = data?.byStatus?.map(r => ({ name: STATUS_LABELS[r.status] ?? r.status, value: Number(r.count), color: STATUS_COLORS[r.status] ?? '#7c3aed' })) ?? [];
  const priorityData = data?.byPriority?.map(r => ({ name: PRIORITY_LABELS[r.priority] ?? r.priority, count: Number(r.count), color: PRIORITY_COLORS[r.priority] ?? '#7c3aed' })) ?? [];
  const categoryData = data?.byCategory?.slice(0, 8).map(r => ({ name: r.category, count: Number(r.count) })) ?? [];
  const techData     = data?.byTechnician?.map(r => ({ name: r.name.split(' ')[0], open: Number(r.open), in_progress: Number(r.in_progress), resolved: Number(r.resolved) })) ?? [];
  const timeData     = data?.overTime?.map(r => ({ date: r.date?.slice(5), count: Number(r.count) })) ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Reportes</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Métricas y tendencias de tu empresa.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total tickets"     value={totalTickets}                         color="#a78bfa" />
        <KpiCard label="Abiertos"          value={data?.byStatus?.find(r => r.status === 'open')?.count ?? 0}        color="#60a5fa" />
        <KpiCard label="Resueltos"         value={data?.byStatus?.find(r => r.status === 'resolved')?.count ?? 0}    color="#34d399" />
        <KpiCard
          label="Tiempo medio resolución"
          value={data?.avgResolutionDays != null ? `${data.avgResolutionDays}d` : '—'}
          color="#fbbf24"
          sub="Desde apertura hasta resolución"
        />
      </div>

      {/* Row 1 — Status donut + Priority bar */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Tickets por estado" loading={loading}>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip {...TOOLTIP_STYLE} formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-zinc-400">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${totalTickets ? (d.value / totalTickets * 100) : 0}%`, background: d.color }} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 w-6 text-right">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-zinc-700 text-sm py-4 text-center">Sin datos</p>}
        </ChartCard>

        <ChartCard title="Tickets por prioridad" loading={loading}>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={priorityData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} label={<CustomDotLabel />}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-700 text-sm py-4 text-center">Sin datos</p>}
        </ChartCard>
      </div>

      {/* Row 2 — Tickets over time */}
      <div className="mb-4">
        <ChartCard title="Tickets creados" subtitle="Últimos 30 días" loading={loading}>
          {timeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip {...TOOLTIP_STYLE} formatter={v => [v, 'Tickets']} />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#a78bfa' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-700 text-sm py-4 text-center">Sin actividad en los últimos 30 días</p>}
        </ChartCard>
      </div>

      {/* Row 3 — Category + Technician workload */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Tickets por categoría" loading={loading}>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, categoryData.length * 36)}>
              <BarChart data={categoryData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={100} />
                <RTooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-700 text-sm py-4 text-center">Sin datos</p>}
        </ChartCard>

        <ChartCard title="Carga por técnico" subtitle="Top 10 técnicos" loading={loading}>
          {techData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, techData.length * 40)}>
              <BarChart data={techData} layout="vertical" barSize={12} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={70} />
                <RTooltip {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', paddingTop: 8 }} />
                <Bar dataKey="open"        name="Abiertos"     fill="#60a5fa" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="in_progress" name="En progreso"  fill="#fbbf24" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="resolved"    name="Resueltos"    fill="#34d399" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-700 text-sm py-4 text-center">Ningún ticket asignado aún</p>}
        </ChartCard>
      </div>
    </div>
  );
}

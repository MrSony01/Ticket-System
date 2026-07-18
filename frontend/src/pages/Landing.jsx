import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─── Scroll reveal ─────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Data ──────────────────────────────────────── */
const TECH = [
  ['React 19',       '#61dafb'],
  ['Express 5',      '#68a063'],
  ['MariaDB',        '#c0855a'],
  ['Docker',         '#2496ed'],
  ['JWT Auth',       '#a78bfa'],
  ['Tailwind CSS',   '#38bdf8'],
  ['@dnd-kit',       '#f97316'],
  ['Recharts',       '#8b5cf6'],
];

const FEATURES = [
  {
    title: 'Multi-tenant real',
    desc: 'Cada empresa vive en un espacio completamente aislado. Un registro crea la compañía y al primer administrador.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    preview: (
      <div className="flex gap-1.5 mt-4 flex-wrap">
        {['Acme Corp', 'TechCo', 'StartupXYZ'].map(c => (
          <span key={c} className="text-[9px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded-md">{c}</span>
        ))}
      </div>
    ),
  },
  {
    title: 'Roles granulares',
    desc: 'Admin, técnico y usuario. Cada rol accede solo a lo que necesita. Sin exposición innecesaria de datos sensibles.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    preview: (
      <div className="flex gap-1.5 mt-4">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/25">Admin</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">Técnico</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">Usuario</span>
      </div>
    ),
  },
  {
    title: 'Board Kanban',
    desc: 'Vista de columnas con drag & drop. Mueve tickets entre estados con un solo gesto, con actualizaciones optimistas.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    preview: (
      <div className="flex gap-1.5 mt-4">
        <div className="flex-1 rounded-lg p-1.5" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)' }}>
          <p className="text-[8px] font-bold text-blue-400 mb-1.5">Abierto</p>
          <div className="space-y-1">
            <div className="h-2.5 rounded-sm" style={{ background: 'rgba(96,165,250,0.15)' }} />
            <div className="h-2.5 rounded-sm" style={{ background: 'rgba(96,165,250,0.15)' }} />
          </div>
        </div>
        <div className="flex-1 rounded-lg p-1.5" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <p className="text-[8px] font-bold text-amber-400 mb-1.5">En progreso</p>
          <div className="h-2.5 rounded-sm" style={{ background: 'rgba(251,191,36,0.15)' }} />
        </div>
        <div className="flex-1 rounded-lg p-1.5" style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <p className="text-[8px] font-bold text-emerald-400 mb-1.5">Resuelto</p>
          <div className="h-2.5 rounded-sm" style={{ background: 'rgba(52,211,153,0.15)' }} />
        </div>
      </div>
    ),
  },
  {
    title: 'SLA por prioridad',
    desc: 'Configura tiempos de respuesta y resolución por nivel de prioridad. Las brechas se marcan automáticamente.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    preview: (
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }}>Vencido</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.25)' }}>SLA breach</span>
        <span className="text-[9px] text-zinc-700">· crítica 2h</span>
      </div>
    ),
  },
  {
    title: 'Notificaciones en tiempo real',
    desc: 'Asignaciones, cambios de estado y comentarios generan notificaciones automáticas. Polling cada 30 segundos.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
    preview: (
      <div className="space-y-1.5 mt-4">
        {[
          ['Ticket #24 asignado a ti', true],
          ['Estado actualizado: Resuelto', false],
        ].map(([msg, unread]) => (
          <div key={msg} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${unread ? 'bg-violet-500' : 'bg-zinc-700'}`} />
            <span className="text-[9px] text-zinc-600 truncate">{msg}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Reportes y analítica',
    desc: 'Gráficas de tickets por estado, prioridad, categoría, técnico y evolución temporal de 30 días con Recharts.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    preview: (
      <div className="flex items-end gap-1 mt-4" style={{ height: '32px' }}>
        {[35, 65, 45, 80, 55, 90, 40, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%`, background: `rgba(124,58,237,${0.15 + i * 0.07})` }}
          />
        ))}
      </div>
    ),
  },
];

const ROLES = [
  {
    role: 'Administrador',
    gradientFrom: 'rgba(124,58,237,0.1)',
    borderColor: 'rgba(124,58,237,0.2)',
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
    check: 'text-violet-400',
    perks: ['Panel de administración completo', 'Asignación de tickets a técnicos', 'Reportes y analíticas avanzadas', 'Configuración de SLA por prioridad', 'Log de actividad de la empresa', 'Gestión de usuarios, grupos y categorías'],
  },
  {
    role: 'Técnico',
    gradientFrom: 'rgba(6,182,212,0.08)',
    borderColor: 'rgba(6,182,212,0.2)',
    badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
    check: 'text-cyan-400',
    perks: ['Vista de tickets asignados', 'Board Kanban propio', 'Cambio de estado del ticket', 'Notas internas privadas del equipo', 'Búsqueda global con Ctrl+K'],
  },
  {
    role: 'Usuario',
    gradientFrom: 'rgba(82,82,91,0.12)',
    borderColor: 'rgba(82,82,91,0.25)',
    badge: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40',
    check: 'text-zinc-400',
    perks: ['Apertura de tickets en segundos', 'Seguimiento del progreso en tiempo real', 'Historial completo de sus tickets', 'Comentarios y actualizaciones'],
  },
];

/* ─── Navbar ─────────────────────────────────────── */
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5" style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            <span className="text-white font-black text-sm">AX</span>
          </div>
          <span className="text-white font-bold tracking-tight">AgentX</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/login" className="text-zinc-500 hover:text-zinc-200 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/4">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
          >
            Crear cuenta →
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero mockup ────────────────────────────────── */
function HeroMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-3xl blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

      {/* Main card */}
      <div className="animate-float relative rounded-2xl overflow-hidden" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <div className="flex-1 mx-3 rounded-md px-3 py-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] text-zinc-600 font-mono">app.agentx.io/dashboard</span>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ height: '290px' }}>
          {/* Sidebar */}
          <div className="w-32 shrink-0 p-3 border-r border-white/5" style={{ background: '#0e0e16' }}>
            <div className="flex items-center gap-1.5 px-1 py-1.5 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                <span className="text-white text-[8px] font-black">AX</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold leading-none">AgentX</p>
                <p className="text-zinc-600 text-[8px] mt-0.5 truncate">Acme Corp</p>
              </div>
            </div>
            <div className="space-y-0.5">
              {[['Dashboard', true], ['Nuevo ticket', false], ['Kanban', false], ['Mis tickets', false]].map(([l, a]) => (
                <div key={l} className={`px-2 py-1.5 rounded-md text-[10px] font-medium ${a ? 'text-violet-300' : 'text-zinc-700'}`} style={a ? { background: 'rgba(124,58,237,0.15)' } : {}}>
                  {l}
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-white/5">
                <p className="text-[8px] text-zinc-700 uppercase tracking-wider px-2 mb-1">Admin</p>
                {['Usuarios', 'Reportes', 'SLA'].map(item => (
                  <div key={item} className="px-2 py-1 text-[9px] text-zinc-700">{item}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Buenos días</p>
                <p className="text-zinc-200 text-[11px] font-bold">Equipo Acme</p>
              </div>
              <div className="relative w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full text-[6px] text-white font-bold flex items-center justify-center">3</span>
              </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[['4','Abiertos','#60a5fa'],['2','En prog.','#fbbf24'],['9','Resueltos','#34d399'],['3','Cerrados','#52525b']].map(([v,l,c]) => (
                <div key={l} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[15px] font-black tabular-nums leading-none" style={{ color: c }}>{v}</p>
                  <p className="text-zinc-600 text-[8px] mt-1 leading-tight">{l}</p>
                </div>
              ))}
            </div>

            {/* Ticket rows */}
            <div className="space-y-0.5">
              {[
                { id: 24, title: 'Error en facturación',  dot: 'bg-red-500',    sla: 'Vencido', badge: 'Abierto',     bc: '#60a5fa' },
                { id: 23, title: 'Acceso portal admin',   dot: 'bg-orange-400', sla: null,      badge: 'En progreso', bc: '#fbbf24' },
                { id: 22, title: 'Consulta de contrato',  dot: 'bg-blue-400',   sla: null,      badge: 'Abierto',     bc: '#60a5fa' },
                { id: 21, title: 'Configuración de SMTP', dot: 'bg-zinc-600',   sla: null,      badge: 'Resuelto',    bc: '#34d399' },
              ].map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.015)' }}>
                  <span className="text-[8px] text-zinc-700 font-mono w-5 shrink-0">#{t.id}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
                  <span className="text-zinc-400 text-[9px] flex-1 truncate">{t.title}</span>
                  {t.sla && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded shrink-0" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {t.sla}
                    </span>
                  )}
                  <span className="text-[9px] font-medium shrink-0" style={{ color: t.bc }}>{t.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification toast */}
      <div
        className="absolute -top-4 -right-4 animate-float-slow rounded-xl p-3 w-52 shadow-2xl"
        style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-200 text-[10px] font-semibold leading-tight">Ticket asignado</p>
            <p className="text-zinc-500 text-[9px] mt-0.5 truncate">El ticket #24 fue asignado a ti</p>
            <p className="text-zinc-700 text-[8px] mt-1.5">Hace un momento</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section label ──────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <span className="w-6 h-px bg-violet-500/40" />
      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{children}</span>
      <span className="w-6 h-px bg-violet-500/40" />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────── */
export default function Landing() {
  useReveal();

  return (
    <div className="min-h-screen text-zinc-100" style={{ backgroundColor: '#080810', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Copy */}
            <div className="flex-1 text-center lg:text-left reveal">
              <div
                className="inline-flex items-center gap-2 text-violet-400 text-[11px] font-semibold px-3.5 py-1.5 rounded-full mb-7"
                style={{ border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(124,58,237,0.08)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Proyecto SaaS · Portafolio
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                El soporte de tu empresa,{' '}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' }}
                >
                  sin el caos.
                </span>
              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0">
                AgentX centraliza la gestión de tickets. Multi-tenant real, roles granulares,
                SLA configurable y analíticas — todo en un solo lugar.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
                >
                  Crear empresa gratis →
                </Link>
                <Link
                  to="/login"
                  className="text-zinc-300 hover:text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  Iniciar sesión
                </Link>
              </div>

              <p className="text-zinc-700 text-xs mt-7">
                Sin tarjeta de crédito · Setup en menos de 1 minuto
              </p>
            </div>

            {/* Mockup */}
            <div className="flex-1 w-full reveal reveal-delay-2">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══ TECH STRIP ══ */}
      <section className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-6">Stack tecnológico</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TECH.map(([name, color]) => (
              <span
                key={name}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-default"
                style={{ color, borderColor: `${color}22`, background: `${color}0f` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.background = `${color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.background = `${color}0f`; }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <SectionLabel>Funcionalidades</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Todo lo que necesitas.
              <span className="text-zinc-600"> Nada de lo que no.</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-lg mx-auto leading-relaxed text-sm">
              Diseñado para equipos que quieren claridad y trazabilidad, sin complejidad innecesaria.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${Math.min(i + 1, 6)} rounded-2xl p-5 cursor-default transition-all duration-300`}
                style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#111120'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0f0f18'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-violet-400 mb-4"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-zinc-100 font-bold text-sm mb-1.5">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
                {f.preview}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <SectionLabel>Cómo funciona</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              En marcha en tres pasos.
            </h2>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute"
              style={{
                top: '28px', left: 'calc(16.66% + 32px)', right: 'calc(16.66% + 32px)',
                height: '1px',
                background: 'linear-gradient(90deg, rgba(124,58,237,0.4), rgba(96,165,250,0.4))',
              }}
            />

            {[
              {
                title: 'Crea tu empresa',
                desc: 'Registra tu organización en segundos. El primer usuario queda como administrador automáticamente.',
                icon: (
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                ),
              },
              {
                title: 'Configura tu equipo',
                desc: 'Invita técnicos por email, define categorías de soporte, crea grupos y ajusta los SLA por prioridad.',
                icon: (
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                ),
              },
              {
                title: 'Gestiona sin fricción',
                desc: 'Los tickets fluyen, se asignan y se resuelven con trazabilidad total y notificaciones en tiempo real.',
                icon: (
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.title} className={`reveal reveal-delay-${i + 1} text-center`}>
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-violet-400"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-zinc-100 font-bold mb-2 text-sm">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROLES ══ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <SectionLabel>Para quién es AgentX</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Un rol para cada integrante del equipo.
            </h2>
            <p className="text-zinc-500 mt-4 max-w-lg mx-auto leading-relaxed text-sm">
              Cada persona accede solo a lo que necesita. Sin solapamiento ni exposición innecesaria de datos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {ROLES.map((r, i) => (
              <div
                key={r.role}
                className={`reveal reveal-delay-${i + 1} rounded-2xl p-7 transition-all duration-300 hover:scale-[1.02] cursor-default`}
                style={{
                  background: `linear-gradient(160deg, ${r.gradientFrom} 0%, transparent 60%)`,
                  border: `1px solid ${r.borderColor}`,
                }}
              >
                <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-5 ${r.badge}`}>
                  {r.role}
                </span>
                <ul className="space-y-3">
                  {r.perks.map(p => (
                    <li key={p} className="flex items-start gap-3 text-sm text-zinc-400">
                      <span className={`mt-0.5 shrink-0 font-bold text-xs ${r.check}`}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="py-28 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-16 text-center reveal"
          style={{ background: 'linear-gradient(135deg, #160d2e 0%, #4c1d95 40%, #160d2e 100%)' }}
        >
          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.25)' }} />

          <div className="relative z-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-xl shadow-violet-900/60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
            >
              <span className="text-white font-extrabold text-2xl">AX</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">
              ¿Listo para ordenar el soporte de tu empresa?
            </h2>
            <p className="text-violet-200/70 mb-10 max-w-lg mx-auto leading-relaxed text-sm">
              Crea tu empresa en segundos. El primer usuario registrado es administrador por defecto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="bg-white hover:bg-zinc-100 text-violet-700 font-bold px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105 shadow-lg"
              >
                Crear empresa gratis →
              </Link>
              <Link
                to="/login"
                className="text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
            >
              <span className="text-white font-bold text-xs">AX</span>
            </div>
            <span className="text-zinc-600 text-xs font-medium">AgentX — Sistema de tickets SaaS multi-tenant</span>
          </div>
          <span className="text-zinc-700 text-xs">React · Node.js · MariaDB · Docker</span>
        </div>
      </footer>
    </div>
  );
}

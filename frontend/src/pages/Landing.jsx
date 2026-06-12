import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─── Hook: scroll reveal ───────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Data ──────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    title: 'Multi-tenant real',
    desc: 'Cada empresa tiene su propio espacio aislado. Los datos de una organización nunca se mezclan con los de otra.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: 'Roles definidos',
    desc: 'Usuario, técnico y administrador. Cada rol ve exactamente lo que necesita, con permisos granulares por función.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    title: 'Trazabilidad total',
    desc: 'Historial completo de comentarios, notas internas para el equipo técnico y seguimiento de estado en tiempo real.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
    title: 'Categorías propias',
    desc: 'Cada empresa define su propia taxonomía. Organiza los tickets según las áreas reales de tu negocio.',
  },
];

const ROLES = [
  {
    role: 'Administrador',
    gradient: 'from-violet-600/20 to-violet-600/5',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    check: 'text-violet-400',
    perks: ['Gestión completa de la empresa', 'Asignación de técnicos a tickets', 'Administración de categorías', 'Vista global de todos los tickets'],
  },
  {
    role: 'Técnico',
    gradient: 'from-cyan-600/20 to-cyan-600/5',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    check: 'text-cyan-400',
    perks: ['Tickets asignados en un solo lugar', 'Cambio de estado del ticket', 'Notas internas privadas del equipo', 'Comunicación directa con el usuario'],
  },
  {
    role: 'Usuario',
    gradient: 'from-zinc-700/30 to-zinc-700/5',
    border: 'border-zinc-600/30',
    badge: 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/40',
    check: 'text-zinc-400',
    perks: ['Apertura de tickets en segundos', 'Seguimiento del progreso en tiempo real', 'Historial completo de sus tickets', 'Comentarios y actualizaciones'],
  },
];

/* ─── Navbar ─────────────────────────────────────── */
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <span className="text-white font-bold text-sm">AX</span>
          </div>
          <span className="text-white font-bold tracking-tight">AgentX</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="text-zinc-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-violet-900/30"
          >
            Crear cuenta →
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero mockup ────────────────────────────────── */
function MockTicket({ title, badge, badgeCls, dot }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/8 rounded-xl hover:bg-white/8 transition-colors">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-zinc-200 text-xs font-medium flex-1 truncate">{title}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeCls}`}>{badge}</span>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="animate-float relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow ambiental */}
      <div className="absolute -inset-6 bg-violet-600/15 rounded-3xl blur-3xl pointer-events-none" />

      <div className="relative bg-[#0f0f18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-3 bg-white/5 border border-white/8 rounded-md px-3 py-1">
            <span className="text-xs text-zinc-500 font-mono">agentx.app/dashboard</span>
          </div>
        </div>

        {/* App shell */}
        <div className="flex h-64">
          {/* Sidebar */}
          <div className="w-40 bg-[#0e0e16] border-r border-white/8 p-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AX</span>
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">AgentX</p>
                <p className="text-zinc-600 text-xs mt-0.5">Acme Corp</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-2 bg-violet-600 rounded-lg">
                <span className="text-white text-xs font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
                <span className="text-zinc-500 text-xs">Nuevo ticket</span>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 p-4 min-w-0 overflow-hidden">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[['4', 'Abiertos', 'text-blue-400'], ['2', 'En progreso', 'text-amber-400'], ['9', 'Resueltos', 'text-emerald-400']].map(([v, l, c]) => (
                <div key={l} className="bg-white/4 border border-white/8 rounded-xl p-2.5">
                  <p className={`text-xl font-bold ${c}`}>{v}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Tickets */}
            <div className="space-y-2">
              <MockTicket title="Error en facturación"  badge="Crítica"      badgeCls="bg-red-500/15 text-red-400 border-red-500/30"       dot="bg-red-500" />
              <MockTicket title="Acceso a portal admin" badge="Alta"         badgeCls="bg-orange-500/15 text-orange-400 border-orange-500/30" dot="bg-orange-400" />
              <MockTicket title="Consulta de contrato"  badge="En progreso"  badgeCls="bg-amber-500/15 text-amber-400 border-amber-500/30"   dot="bg-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section label ──────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span className="w-8 h-px bg-violet-500/50" />
      <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">{children}</span>
      <span className="w-8 h-px bg-violet-500/50" />
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
      <section className="pt-36 pb-28 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Copy */}
          <div className="flex-1 text-center lg:text-left reveal">
            <div className="inline-flex items-center gap-2 border border-violet-500/25 bg-violet-500/8 text-violet-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Plataforma SaaS multi-tenant
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              El soporte de tu empresa,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-300 to-cyan-400">
                sin el caos.
              </span>
            </h1>

            <p className="text-zinc-400 text-lg leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0">
              AgentX centraliza la gestión de tickets en un solo lugar.
              Cada empresa tiene su espacio aislado, sus roles y su visibilidad definida.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/register"
                className="bg-violet-600 hover:bg-violet-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-violet-900/40"
              >
                Crear empresa gratis →
              </Link>
              <Link
                to="/login"
                className="border border-white/10 hover:border-white/20 bg-white/4 hover:bg-white/8 text-zinc-300 hover:text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
              >
                Iniciar sesión
              </Link>
            </div>

            {/* Social proof micro */}
            <p className="text-zinc-600 text-xs mt-7">
              Sin tarjeta de crédito · Setup en menos de 1 minuto
            </p>
          </div>

          {/* Mockup */}
          <div className="flex-1 w-full reveal reveal-delay-2">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <SectionLabel>Funcionalidades</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Todo lo que necesitas.
              <span className="text-zinc-500"> Nada de lo que no.</span>
            </h2>
            <p className="text-zinc-400 mt-4 max-w-lg mx-auto leading-relaxed">
              Diseñado para equipos que quieren claridad y trazabilidad, sin complejidad innecesaria.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${i + 1} group bg-gradient-to-b from-white/6 to-transparent border border-white/8 rounded-2xl p-6 hover:border-violet-500/40 hover:scale-105 transition-all duration-300 cursor-default`}
              >
                <div className="w-11 h-11 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:bg-violet-600/25 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROLES ══ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <SectionLabel>Para quién es AgentX</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Un rol para cada persona del equipo.
            </h2>
            <p className="text-zinc-400 mt-4 max-w-lg mx-auto leading-relaxed">
              Cada integrante accede a lo que necesita según su función. Sin exposición innecesaria de datos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {ROLES.map((r, i) => (
              <div
                key={r.role}
                className={`reveal reveal-delay-${i + 1} group bg-gradient-to-b ${r.gradient} border ${r.border} rounded-2xl p-7 hover:scale-105 transition-all duration-300 cursor-default`}
              >
                <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-5 ${r.badge}`}>
                  {r.role}
                </span>
                <ul className="space-y-3">
                  {r.perks.map(p => (
                    <li key={p} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className={`mt-0.5 shrink-0 font-bold ${r.check}`}>✓</span>
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
      <section className="py-28 px-6 border-t border-white/5">
        <div
          className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-16 text-center reveal"
          style={{ background: 'linear-gradient(135deg, #160d2e 0%, #4c1d95 40%, #160d2e 100%)' }}
        >
          {/* Glow decorativo */}
          <div className="absolute top-1/2 left-1/2 -tranzinc-x-1/2 -tranzinc-y-1/2 w-96 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-7 shadow-xl shadow-violet-900/60">
              <span className="text-white font-extrabold text-2xl">AX</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">
              ¿Listo para ordenar el soporte de tu empresa?
            </h2>
            <p className="text-violet-200 mb-10 max-w-lg mx-auto leading-relaxed">
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
                className="border border-white/20 hover:border-white/40 text-white hover:bg-white/8 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AX</span>
            </div>
            <span className="text-zinc-500 font-medium">AgentX — Sistema de tickets SaaS multi-tenant</span>
          </div>
          <span>Construido con React · Node.js · MariaDB · Docker</span>
        </div>
      </footer>
    </div>
  );
}

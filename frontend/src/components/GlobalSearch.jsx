import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const STATUS_COLORS = {
  open:        'text-blue-400',
  in_progress: 'text-amber-400',
  resolved:    'text-emerald-400',
  closed:      'text-zinc-500',
};

const PRIORITY_DOTS = {
  low:      'bg-zinc-500',
  medium:   'bg-blue-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
};

const ROLE_COLORS = {
  admin:      'text-violet-400',
  technician: 'text-cyan-400',
  user:       'text-zinc-400',
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState({ tickets: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef              = useRef(null);
  const navigate              = useNavigate();
  const debouncedQuery        = useDebounce(query, 250);

  const allItems = [
    ...results.tickets.map(t => ({ ...t, _type: 'ticket' })),
    ...results.users.map(u => ({ ...u, _type: 'user' })),
  ];

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults({ tickets: [], users: [] });
      return;
    }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then(data => { setResults(data); setSelected(0); })
      .catch(() => setResults({ tickets: [], users: [] }))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  function navigate_to(item) {
    if (item._type === 'ticket') navigate(`/tickets/${item.id}`);
    onClose();
  }

  function handleKey(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && allItems[selected]) navigate_to(allItems[selected]);
  }

  const hasResults = results.tickets.length > 0 || results.users.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar tickets, usuarios..."
            className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 outline-none"
          />
          {loading && (
            <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!hasResults && !loading && query.length >= 2 && (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">Sin resultados para "{query}"</div>
          )}
          {!hasResults && !loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-zinc-600 text-xs">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}

          {results.tickets.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tickets</p>
              {results.tickets.map((t, i) => {
                const idx = i;
                return (
                  <button
                    key={t.id}
                    onClick={() => navigate_to({ ...t, _type: 'ticket' })}
                    onMouseEnter={() => setSelected(idx)}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors"
                    style={{ background: selected === idx ? 'rgba(124,58,237,0.12)' : 'transparent' }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOTS[t.priority] ?? 'bg-zinc-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-200 text-xs font-medium truncate">{t.title}</p>
                      <p className="text-zinc-600 text-[10px]">#{t.id} · <span className={STATUS_COLORS[t.status]}>{t.status}</span></p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Usuarios</p>
              {results.users.map((u, i) => {
                const idx = results.tickets.length + i;
                return (
                  <div
                    key={u.id}
                    onMouseEnter={() => setSelected(idx)}
                    className="px-4 py-2.5 flex items-center gap-3 transition-colors"
                    style={{ background: selected === idx ? 'rgba(124,58,237,0.12)' : 'transparent' }}
                  >
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-[10px] font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-zinc-200 text-xs font-medium">{u.name}</p>
                      <p className="text-zinc-600 text-[10px]">{u.email} · <span className={ROLE_COLORS[u.role]}>{u.role}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex gap-4 text-[10px] text-zinc-600" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span><kbd className="bg-zinc-800 px-1 rounded border border-zinc-700">↑↓</kbd> navegar</span>
          <span><kbd className="bg-zinc-800 px-1 rounded border border-zinc-700">↵</kbd> abrir</span>
          <span><kbd className="bg-zinc-800 px-1 rounded border border-zinc-700">ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, closestCenter,
} from '@dnd-kit/core';
import { api } from '../api/client';

const COLUMNS = [
  { id: 'open',        label: 'Abierto',      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
  { id: 'in_progress', label: 'En progreso',  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
  { id: 'resolved',    label: 'Resuelto',     color: '#34d399', bg: 'rgba(52,211,153,0.08)'  },
  { id: 'closed',      label: 'Cerrado',      color: '#71717a', bg: 'rgba(113,113,122,0.08)' },
];

const PRIORITY_DOT    = { low: '#71717a', medium: '#60a5fa', high: '#fb923c', critical: '#ef4444' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

/* ── Ticket card ── */
function TicketCard({ ticket, isDragging }) {
  return (
    <div className={`rounded-xl p-3 select-none transition-shadow ${isDragging ? 'shadow-2xl opacity-90 rotate-1' : 'hover:shadow-lg'}`}
      style={{ background: isDragging ? '#1a1a2e' : '#0f0f18', border: `1px solid ${isDragging ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.07)'}`, cursor: 'grab' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-zinc-200 text-xs font-semibold leading-snug line-clamp-2 flex-1">{ticket.title}</p>
        <span className="shrink-0 w-2 h-2 rounded-full mt-0.5" style={{ background: PRIORITY_DOT[ticket.priority] }} title={PRIORITY_LABELS[ticket.priority]} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {ticket.category && (
            <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {ticket.category}
            </span>
          )}
          <span className="text-[10px] text-zinc-700">#{ticket.id}</span>
        </div>
        {ticket.assignee_name ? (
          <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-bold flex items-center justify-center border border-violet-500/30"
            title={ticket.assignee_name}>
            {initials(ticket.assignee_name)}
          </span>
        ) : (
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-dashed border-zinc-700" title="Sin asignar">
            <span className="text-[9px] text-zinc-700">?</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Draggable wrapper ── */
function DraggableCard({ ticket }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: String(ticket.id) });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <Link to={`/tickets/${ticket.id}`} onClick={e => { if (isDragging) e.preventDefault(); }}>
        <TicketCard ticket={ticket} isDragging={isDragging} />
      </Link>
    </div>
  );
}

/* ── Droppable column ── */
function Column({ col, tickets, isOver }) {
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col min-w-0 flex-1" style={{ minWidth: 240, maxWidth: 340 }}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl"
        style={{ background: col.bg, border: `1px solid ${col.color}22` }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
          <span className="text-xs font-bold" style={{ color: col.color }}>{col.label}</span>
        </div>
        <span className="text-xs font-semibold text-zinc-600 bg-zinc-900/60 px-2 py-0.5 rounded-full">
          {tickets.length}
        </span>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef} className="flex-1 rounded-xl p-2 space-y-2 min-h-32 transition-colors"
        style={{ background: isOver ? `${col.color}08` : 'transparent', border: `2px dashed ${isOver ? col.color + '44' : 'transparent'}` }}>
        {tickets.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20">
            <p className="text-zinc-800 text-xs">Sin tickets</p>
          </div>
        )}
        {tickets.map(t => <DraggableCard key={t.id} ticket={t} />)}
      </div>
    </div>
  );
}

export default function Kanban() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [activeId, setActiveId] = useState(null);
  const [overCol,  setOverCol]  = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/tickets?limit=200&page=1');
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tickets.filter(t => t.status === col.id);
    return acc;
  }, {});

  const activeTicket = activeId ? tickets.find(t => String(t.id) === activeId) : null;

  function handleDragStart({ active }) {
    setActiveId(String(active.id));
  }

  function handleDragOver({ over }) {
    setOverCol(over?.id ?? null);
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    setOverCol(null);
    if (!over) return;

    const ticketId = Number(active.id);
    const newStatus = over.id;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Optimistic update
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/tickets/${ticketId}`, { status: newStatus });
    } catch {
      // Revert on failure
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: ticket.status } : t));
    }
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Tickets</p>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Kanban</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Arrastra para cambiar estado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition-all">
            Vista lista
          </Link>
          <Link to="/tickets/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            + Nuevo ticket
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1" style={{ alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <Column key={col.id} col={col} tickets={grouped[col.id]} isOver={overCol === col.id} />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeTicket && <TicketCard ticket={activeTicket} isDragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

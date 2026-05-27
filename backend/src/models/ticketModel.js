import pool from '../config/db.js';

// Columnas base reutilizadas en listado y detalle
const TICKET_COLS = `
  t.id, t.company_id, t.title, t.description, t.priority, t.status,
  t.created_at, t.updated_at, t.resolved_at,
  c.name  AS category,
  u.id    AS creator_id,   u.name  AS creator_name,
  a.id    AS agent_id,     a.name  AS agent_name
`;

const TICKET_JOINS = `
  FROM tickets t
  LEFT JOIN categories c ON c.id = t.category_id
  JOIN  users u           ON u.id = t.created_by
  LEFT JOIN users a       ON a.id = t.assigned_to
`;

export async function findAll(companyId, userId, role) {
  let whereExtra = '';
  const params = [companyId];

  if (role === 'user') {
    whereExtra = 'AND t.created_by = ?';
    params.push(userId);
  } else if (role === 'agent') {
    whereExtra = 'AND t.assigned_to = ?';
    params.push(userId);
  }
  // manager y admin ven todos los tickets de la empresa

  const [rows] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS}
     WHERE t.company_id = ? ${whereExtra}
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

export async function findById(id, companyId) {
  const [[ticket]] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS}
     WHERE t.id = ? AND t.company_id = ?`,
    [id, companyId]
  );
  if (!ticket) return null;

  const [comments] = await pool.execute(
    `SELECT cm.id, cm.body, cm.internal, cm.created_at,
            u.id AS user_id, u.name AS user_name, r.name AS user_role
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     JOIN roles  r ON r.id = u.role_id
     WHERE cm.ticket_id = ?
     ORDER BY cm.created_at ASC`,
    [id]
  );

  const [history] = await pool.execute(
    `SELECT th.field, th.old_value, th.new_value, th.changed_at,
            u.name AS changed_by
     FROM ticket_history th
     JOIN users u ON u.id = th.changed_by
     WHERE th.ticket_id = ?
     ORDER BY th.changed_at ASC`,
    [id]
  );

  return { ...ticket, comments, history };
}

export async function create({ companyId, categoryId, createdBy, title, description, priority }) {
  const [result] = await pool.execute(
    `INSERT INTO tickets (company_id, category_id, created_by, title, description, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, categoryId ?? null, createdBy, title, description, priority ?? 'medium']
  );
  return result.insertId;
}

export async function update(id, companyId, fields, changedBy) {
  const allowed = ['status', 'priority', 'assigned_to', 'category_id'];
  const updates = [];
  const values  = [];
  const historyRows = [];

  // Obtener valores actuales para el historial
  const [[current]] = await pool.execute(
    'SELECT status, priority, assigned_to, category_id FROM tickets WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  if (!current) return null;

  for (const field of allowed) {
    if (fields[field] === undefined) continue;
    if (String(fields[field]) === String(current[field] ?? '')) continue; // sin cambio real

    updates.push(`${field} = ?`);
    values.push(fields[field]);
    historyRows.push([id, changedBy, field, current[field] ?? null, fields[field]]);
  }

  if (updates.length === 0) return id;

  if (fields.status === 'resolved') {
    updates.push('resolved_at = NOW()');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
      [...values, id, companyId]
    );

    if (historyRows.length > 0) {
      await conn.query(
        'INSERT INTO ticket_history (ticket_id, changed_by, field, old_value, new_value) VALUES ?',
        [historyRows]
      );
    }

    await conn.commit();
    return id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function addComment(ticketId, userId, body, internal = false) {
  const [result] = await pool.execute(
    'INSERT INTO comments (ticket_id, user_id, body, internal) VALUES (?, ?, ?, ?)',
    [ticketId, userId, body, internal]
  );
  return result.insertId;
}

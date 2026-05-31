import pool from '../config/db.js';

const TICKET_COLS = `
  t.id, t.title, t.description, t.status, t.priority,
  t.created_at, t.updated_at,
  c.name  AS category,
  u.id    AS creator_id,  u.name AS creator_name,
  a.id    AS assignee_id, a.name AS assignee_name
`;

const TICKET_JOINS = `
  FROM tickets t
  LEFT JOIN categories c ON c.id = t.category_id
  JOIN  users u          ON u.id = t.user_id
  LEFT JOIN users a      ON a.id = t.assigned_to
`;

export async function findAll(userId, role) {
  let where = 'WHERE 1=1';
  const params = [];

  if (role === 'user') {
    where += ' AND t.user_id = ?';
    params.push(userId);
  } else if (role === 'technician') {
    where += ' AND t.assigned_to = ?';
    params.push(userId);
  }
  // admin ve todos

  const [rows] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS} ${where} ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

export async function findById(id) {
  const [[ticket]] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS} WHERE t.id = ?`,
    [id]
  );
  if (!ticket) return null;

  const [comments] = await pool.execute(
    `SELECT cm.id, cm.content, cm.is_internal, cm.created_at,
            u.id AS user_id, u.name AS user_name, u.role AS user_role
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.ticket_id = ?
     ORDER BY cm.created_at ASC`,
    [id]
  );

  return { ...ticket, comments };
}

export async function create({ title, description, priority, categoryId, userId }) {
  const [result] = await pool.execute(
    'INSERT INTO tickets (title, description, priority, category_id, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, description, priority ?? 'medium', categoryId ?? null, userId]
  );
  return result.insertId;
}

export async function update(id, fields) {
  const allowed = ['status', 'priority', 'assigned_to', 'category_id'];
  const updates = [];
  const values  = [];

  for (const field of allowed) {
    if (fields[field] === undefined) continue;
    updates.push(`${field} = ?`);
    values.push(fields[field]);
  }

  if (updates.length === 0) return id;

  await pool.execute(
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
    [...values, id]
  );
  return id;
}

export async function addComment(ticketId, userId, content, isInternal = false) {
  const [result] = await pool.execute(
    'INSERT INTO comments (ticket_id, user_id, content, is_internal) VALUES (?, ?, ?, ?)',
    [ticketId, userId, content, isInternal]
  );
  return result.insertId;
}

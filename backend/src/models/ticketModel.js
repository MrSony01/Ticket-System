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

export async function findAll(userId, role, companyId, {
  status, priority, categoryId, assignedTo, search,
  page = 1, limit = 20,
} = {}) {
  let where = 'WHERE t.company_id = ?';
  const params = [companyId];

  if (role === 'user') {
    where += ' AND t.user_id = ?';
    params.push(userId);
  } else if (role === 'technician') {
    where += ' AND t.assigned_to = ?';
    params.push(userId);
  }

  if (status)     { where += ' AND t.status = ?';      params.push(status); }
  if (priority)   { where += ' AND t.priority = ?';    params.push(priority); }
  if (categoryId) { where += ' AND t.category_id = ?'; params.push(Number(categoryId)); }
  if (assignedTo) { where += ' AND t.assigned_to = ?'; params.push(Number(assignedTo)); }
  if (search)     { where += ' AND t.title LIKE ?';    params.push(`%${search}%`); }

  const offset   = (Math.max(1, Number(page)) - 1) * Number(limit);
  const pageSize = Math.min(100, Math.max(1, Number(limit)));

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total ${TICKET_JOINS} ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS} ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return { tickets: rows, total: Number(total), page: Number(page), pages: Math.ceil(Number(total) / pageSize) };
}

export async function findById(id, companyId) {
  const [[ticket]] = await pool.execute(
    `SELECT ${TICKET_COLS} ${TICKET_JOINS} WHERE t.id = ? AND t.company_id = ?`,
    [id, companyId]
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

export async function create({ title, description, priority, categoryId, userId, companyId }) {
  const [result] = await pool.execute(
    'INSERT INTO tickets (title, description, priority, category_id, user_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, priority ?? 'medium', categoryId ?? null, userId, companyId]
  );
  return result.insertId;
}

export async function update(id, companyId, fields) {
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
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
    [...values, id, companyId]
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

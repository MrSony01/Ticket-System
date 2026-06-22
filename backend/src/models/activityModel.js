import pool from '../config/db.js';

export async function log({ companyId, userId, action, entityType, entityId, metadata }) {
  try {
    await pool.execute(
      `INSERT INTO activity_log (company_id, user_id, action, entity_type, entity_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, userId ?? null, action, entityType ?? null, entityId ?? null,
       metadata ? JSON.stringify(metadata) : null]
    );
  } catch (e) {
    console.error('[activity:log]', e.message);
  }
}

export async function findAll(companyId, { page = 1, limit = 50, action, entityType } = {}) {
  const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
  const pageSize = Math.min(100, Math.max(1, Number(limit)));
  const conditions = ['a.company_id = ?'];
  const params = [companyId];

  if (action)     { conditions.push('a.action = ?');      params.push(action); }
  if (entityType) { conditions.push('a.entity_type = ?'); params.push(entityType); }

  const where = conditions.join(' AND ');

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM activity_log a WHERE ${where}`, params
  );

  const [rows] = await pool.execute(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
            u.name AS user_name, u.email AS user_email, u.role AS user_role
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE ${where}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return { logs: rows, total: Number(total), page: Number(page), pages: Math.ceil(Number(total) / pageSize) };
}

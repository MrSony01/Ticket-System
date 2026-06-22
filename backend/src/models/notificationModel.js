import pool from '../config/db.js';

export async function create({ userId, companyId, type, title, message, entityId }) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, company_id, type, title, message, entity_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, companyId, type, title, message ?? null, entityId ?? null]
    );
    return result.insertId;
  } catch (e) {
    console.error('[notification:create]', e.message);
  }
}

export async function findForUser(userId, companyId, { unreadOnly = false, limit = 50 } = {}) {
  const extra = unreadOnly ? 'AND read_at IS NULL' : '';
  const [rows] = await pool.execute(
    `SELECT * FROM notifications
     WHERE user_id = ? AND company_id = ? ${extra}
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, companyId, limit]
  );
  return rows;
}

export async function markRead(id, userId) {
  await pool.execute(
    `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL`,
    [id, userId]
  );
}

export async function markAllRead(userId, companyId) {
  await pool.execute(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = ? AND company_id = ? AND read_at IS NULL`,
    [userId, companyId]
  );
}

export async function countUnread(userId, companyId) {
  const [[{ count }]] = await pool.execute(
    `SELECT COUNT(*) AS count FROM notifications
     WHERE user_id = ? AND company_id = ? AND read_at IS NULL`,
    [userId, companyId]
  );
  return Number(count);
}

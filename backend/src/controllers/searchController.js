import pool from '../config/db.js';

export async function globalSearch(req, res) {
  try {
    const { id: userId, role, company_id } = req.user;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ tickets: [], users: [] });
    }

    const term = `%${q.trim()}%`;

    // Tickets — scope by role
    let ticketWhere = 't.company_id = ? AND (t.title LIKE ? OR t.description LIKE ?)';
    const ticketParams = [company_id, term, term];

    if (role === 'user') {
      ticketWhere += ' AND t.user_id = ?';
      ticketParams.push(userId);
    } else if (role === 'technician') {
      ticketWhere += ' AND t.assigned_to = ?';
      ticketParams.push(userId);
    }

    const [tickets] = await pool.execute(
      `SELECT t.id, t.title, t.status, t.priority, t.created_at,
              u.name AS creator_name
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       WHERE ${ticketWhere}
       ORDER BY t.created_at DESC
       LIMIT 10`,
      ticketParams
    );

    // Users — only for admin/technician
    let users = [];
    if (role !== 'user') {
      const [rows] = await pool.execute(
        `SELECT id, name, email, role FROM users
         WHERE company_id = ? AND (name LIKE ? OR email LIKE ?)
         LIMIT 8`,
        [company_id, term, term]
      );
      users = rows;
    }

    res.json({ tickets, users });
  } catch (err) {
    console.error('[search:globalSearch]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

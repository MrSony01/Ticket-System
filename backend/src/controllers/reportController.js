import pool from '../config/db.js';

export async function getReports(req, res) {
  try {
    const { company_id } = req.user;

    const [
      [byStatus],
      [byPriority],
      [byCategory],
      [byTechnician],
      [overTime],
      [[resolutionRow]],
    ] = await Promise.all([

      pool.execute(
        `SELECT status, COUNT(*) AS count
         FROM tickets WHERE company_id = ?
         GROUP BY status`,
        [company_id]
      ),

      pool.execute(
        `SELECT priority, COUNT(*) AS count
         FROM tickets WHERE company_id = ?
         GROUP BY priority`,
        [company_id]
      ),

      pool.execute(
        `SELECT COALESCE(c.name, 'Sin categoría') AS category, COUNT(*) AS count
         FROM tickets t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.company_id = ?
         GROUP BY c.id, c.name
         ORDER BY count DESC`,
        [company_id]
      ),

      pool.execute(
        `SELECT u.name,
                SUM(t.status = 'open')        AS open,
                SUM(t.status = 'in_progress') AS in_progress,
                SUM(t.status = 'resolved')    AS resolved,
                COUNT(*) AS total
         FROM tickets t
         JOIN users u ON u.id = t.assigned_to
         WHERE t.company_id = ?
         GROUP BY u.id, u.name
         ORDER BY total DESC
         LIMIT 10`,
        [company_id]
      ),

      pool.execute(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count
         FROM tickets
         WHERE company_id = ?
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [company_id]
      ),

      pool.execute(
        `SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at) / 24), 1) AS avg_days
         FROM tickets
         WHERE company_id = ? AND status IN ('resolved', 'closed')`,
        [company_id]
      ),
    ]);

    res.json({
      byStatus,
      byPriority,
      byCategory,
      byTechnician,
      overTime,
      avgResolutionDays: resolutionRow?.avg_days ?? null,
    });
  } catch (err) {
    console.error('[reports]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

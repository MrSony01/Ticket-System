import pool from '../config/db.js';

const DEFAULTS = {
  low:      { response_hours: 72,  resolution_hours: 168 },
  medium:   { response_hours: 24,  resolution_hours: 72  },
  high:     { response_hours: 8,   resolution_hours: 24  },
  critical: { response_hours: 2,   resolution_hours: 8   },
};

export async function findByCompany(companyId) {
  const [rows] = await pool.execute(
    `SELECT * FROM sla_configs WHERE company_id = ?`, [companyId]
  );
  const result = {};
  for (const [priority, defaults] of Object.entries(DEFAULTS)) {
    const existing = rows.find(r => r.priority === priority);
    result[priority] = existing
      ? { priority, response_hours: existing.response_hours, resolution_hours: existing.resolution_hours }
      : { priority, ...defaults };
  }
  return result;
}

export async function upsert(companyId, priority, responseHours, resolutionHours) {
  await pool.execute(
    `INSERT INTO sla_configs (company_id, priority, response_hours, resolution_hours)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       response_hours   = VALUES(response_hours),
       resolution_hours = VALUES(resolution_hours)`,
    [companyId, priority, responseHours, resolutionHours]
  );
}

export function computeOverdue(ticket, slaMap) {
  if (['resolved', 'closed'].includes(ticket.status)) return { overdue: false, sla_breach: false };
  const sla = slaMap[ticket.priority];
  if (!sla) return { overdue: false, sla_breach: false };

  const createdMs  = new Date(ticket.created_at).getTime();
  const nowMs      = Date.now();
  const elapsedHrs = (nowMs - createdMs) / 3_600_000;

  return {
    overdue:    elapsedHrs > sla.resolution_hours,
    sla_breach: elapsedHrs > sla.response_hours,
    elapsed_hours: Math.round(elapsedHrs),
    resolution_hours: sla.resolution_hours,
    response_hours:   sla.response_hours,
  };
}

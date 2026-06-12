import pool from '../config/db.js';

export async function findAllUsers(companyId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            g.id AS group_id, g.name AS group_name,
            CASE WHEN u.invite_token IS NOT NULL THEN 1 ELSE 0 END AS invite_pending
     FROM users u
     LEFT JOIN \`groups\` g ON g.id = u.group_id
     WHERE u.company_id = ?
     ORDER BY u.created_at ASC`,
    [companyId]
  );
  return rows;
}

export async function findUserById(id, companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role FROM users WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  return rows[0] ?? null;
}

export async function emailExistsInCompany(email, companyId) {
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE email = ? AND company_id = ?',
    [email, companyId]
  );
  return rows.length > 0;
}

export async function createUser({ name, email, hashedPassword, role, companyId, groupId = null }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role, company_id, group_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role, companyId, groupId]
  );
  return result.insertId;
}

export async function updateUserGroup(id, companyId, groupId) {
  const [result] = await pool.execute(
    'UPDATE users SET group_id = ? WHERE id = ? AND company_id = ?',
    [groupId ?? null, id, companyId]
  );
  return result.affectedRows > 0;
}

export async function updateUserRole(id, companyId, role) {
  const [result] = await pool.execute(
    'UPDATE users SET role = ? WHERE id = ? AND company_id = ?',
    [role, id, companyId]
  );
  return result.affectedRows > 0;
}

export async function deleteUser(id, companyId) {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  return result.affectedRows > 0;
}

export async function getCompany(companyId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.slug, c.created_at,
            COUNT(u.id) AS member_count
     FROM companies c
     LEFT JOIN users u ON u.company_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [companyId]
  );
  return rows[0] ?? null;
}

export async function updateCompanyName(companyId, name) {
  const [result] = await pool.execute(
    'UPDATE companies SET name = ? WHERE id = ?',
    [name, companyId]
  );
  return result.affectedRows > 0;
}

import pool from '../config/db.js';

export async function findAllUsers(companyId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            g.id AS group_id, g.name AS group_name
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

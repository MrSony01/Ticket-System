import pool from '../config/db.js';

export async function findByEmail(email, companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password, role, company_id FROM users WHERE email = ? AND company_id = ?',
    [email, companyId]
  );
  return rows[0] ?? null;
}

export async function findByEmailGlobal(email) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.password, u.invite_token, u.role, u.company_id,
            c.id AS c_id, c.name AS c_name, c.slug AS c_slug
     FROM users u
     JOIN companies c ON c.id = u.company_id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id, companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  return rows[0] ?? null;
}

export async function findAllByCompany(companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE company_id = ? ORDER BY name ASC',
    [companyId]
  );
  return rows;
}

export async function create({ name, email, hashedPassword, role = 'user', companyId }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role, companyId]
  );
  return result.insertId;
}

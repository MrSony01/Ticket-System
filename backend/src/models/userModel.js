import pool from '../config/db.js';

export async function findByEmailAndCompany(email, companySlug) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.company_id, u.name, u.email, u.password, u.active,
            r.id AS role_id, r.name AS role
     FROM users u
     JOIN companies c ON c.id = u.company_id
     JOIN roles r    ON r.id = u.role_id
     WHERE u.email = ? AND c.slug = ?`,
    [email, companySlug]
  );
  return rows[0] ?? null;
}

export async function createCompanyWithAdmin({ companyName, companySlug, name, email, hashedPassword }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [companyResult] = await conn.execute(
      'INSERT INTO companies (name, slug) VALUES (?, ?)',
      [companyName, companySlug]
    );
    const companyId = companyResult.insertId;

    const [roleRows] = await conn.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['admin']
    );
    const adminRoleId = roleRows[0].id;

    const [userResult] = await conn.execute(
      'INSERT INTO users (company_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?)',
      [companyId, adminRoleId, name, email, hashedPassword]
    );

    await conn.commit();
    return { companyId, userId: userResult.insertId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

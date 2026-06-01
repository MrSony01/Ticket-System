import pool from '../config/db.js';

export async function findAll(companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name FROM categories WHERE company_id = ? ORDER BY name ASC',
    [companyId]
  );
  return rows;
}

export async function create(name, companyId) {
  const [result] = await pool.execute(
    'INSERT INTO categories (name, company_id) VALUES (?, ?)',
    [name, companyId]
  );
  return result.insertId;
}

export async function remove(id, companyId) {
  const [result] = await pool.execute(
    'DELETE FROM categories WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  return result.affectedRows > 0;
}

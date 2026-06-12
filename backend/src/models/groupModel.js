import pool from '../config/db.js';

export async function findAll(companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name FROM `groups` WHERE company_id = ? ORDER BY name ASC',
    [companyId]
  );
  return rows;
}

export async function findByName(name, companyId) {
  const [rows] = await pool.execute(
    'SELECT id, name FROM `groups` WHERE name = ? AND company_id = ?',
    [name, companyId]
  );
  return rows[0] ?? null;
}

export async function create(name, companyId) {
  const [result] = await pool.execute(
    'INSERT INTO `groups` (name, company_id) VALUES (?, ?)',
    [name, companyId]
  );
  return result.insertId;
}

export async function remove(id, companyId) {
  const [result] = await pool.execute(
    'DELETE FROM `groups` WHERE id = ? AND company_id = ?',
    [id, companyId]
  );
  return result.affectedRows > 0;
}

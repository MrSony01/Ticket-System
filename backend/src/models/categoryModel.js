import pool from '../config/db.js';

export async function findAll() {
  const [rows] = await pool.execute('SELECT id, name FROM categories ORDER BY name ASC');
  return rows;
}

export async function create(name) {
  const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.insertId;
}

export async function remove(id) {
  const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

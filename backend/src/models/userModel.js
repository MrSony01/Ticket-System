import pool from '../config/db.js';

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password, role FROM users WHERE email = ?',
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

export async function create({ name, email, hashedPassword, role = 'user' }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
  );
  return result.insertId;
}

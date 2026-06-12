import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { findByEmailGlobal, create } from '../models/userModel.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function findCompanyBySlug(slug) {
  const [rows] = await pool.execute(
    'SELECT id, name, slug FROM companies WHERE slug = ?',
    [slug]
  );
  return rows[0] ?? null;
}

async function createCompany(name, slug) {
  const [result] = await pool.execute(
    'INSERT INTO companies (name, slug) VALUES (?, ?)',
    [name, slug]
  );
  return result.insertId;
}

export async function register(req, res) {
  try {
    const { name, email, password, company_name } = req.body;

    if (!name || !email || !password || !company_name) {
      return res.status(400).json({ message: 'Nombre, email, contraseña y nombre de empresa son requeridos.' });
    }

    const slug = slugify(company_name);

    const existingCompany = await findCompanyBySlug(slug);
    if (existingCompany) {
      return res.status(409).json({ message: 'Ya existe una empresa con ese nombre. Usa otro.' });
    }

    const companyId = await createCompany(company_name, slug);

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await create({ name, email, hashedPassword, role: 'admin', companyId });

    res.status(201).json({ message: 'Empresa y cuenta de administrador creadas.', company_slug: slug, id: userId });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ message: 'Error interno del servidor.', detail: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    const user = await findByEmailGlobal(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    if (user.invite_token) {
      return res.status(403).json({ message: 'Debes aceptar tu invitación antes de iniciar sesión.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user:    { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id },
      company: { id: user.c_id, name: user.c_name, slug: user.c_slug },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Error interno del servidor.', detail: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const { id, company_id } = req.user;
    const [[user]] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.created_at, c.name AS company_name
       FROM users u JOIN companies c ON c.id = u.company_id
       WHERE u.id = ? AND u.company_id = ?`,
      [id, company_id]
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function updateMe(req, res) {
  try {
    const { id, company_id } = req.user;
    const { name, email, currentPassword } = req.body;

    const trimName  = name?.trim();
    const trimEmail = email?.trim().toLowerCase();

    if (!trimName)  return res.status(400).json({ message: 'El nombre no puede estar vacío.' });
    if (!trimEmail) return res.status(400).json({ message: 'El email no puede estar vacío.' });

    const [[current]] = await pool.execute(
      'SELECT id, name, email, password FROM users WHERE id = ? AND company_id = ?',
      [id, company_id]
    );
    if (!current) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const emailChanged = trimEmail !== current.email;
    const nameChanged  = trimName  !== current.name;

    if (!emailChanged && !nameChanged) {
      return res.status(400).json({ message: 'No hay cambios que guardar.' });
    }

    if (emailChanged) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Debes confirmar tu contraseña para cambiar el email.' });
      }
      const valid = await bcrypt.compare(currentPassword, current.password);
      if (!valid) return res.status(403).json({ message: 'Contraseña incorrecta.' });

      const [[dup]] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND company_id = ? AND id != ?',
        [trimEmail, company_id, id]
      );
      if (dup) return res.status(409).json({ message: 'Ese email ya está en uso en esta empresa.' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ? AND company_id = ?',
      [trimName, trimEmail, id, company_id]
    );

    const newToken = signToken({ ...req.user, name: trimName, email: trimEmail });
    res.json({ message: 'Perfil actualizado.', token: newToken, name: trimName, email: trimEmail });
  } catch (err) {
    console.error('[updateMe]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function changePassword(req, res) {
  try {
    const { id, company_id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const [[user]] = await pool.execute(
      'SELECT password FROM users WHERE id = ? AND company_id = ?',
      [id, company_id]
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(403).json({ message: 'Contraseña actual incorrecta.' });

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ? AND company_id = ?',
      [hashed, id, company_id]
    );
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function getInvite(req, res) {
  try {
    const { token } = req.params;
    const [rows] = await pool.execute(
      `SELECT u.name, u.email, c.name AS company_name
       FROM users u JOIN companies c ON c.id = u.company_id
       WHERE u.invite_token = ?`,
      [token]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Invitación inválida o ya utilizada.' });
    const { name, email, company_name } = rows[0];
    res.json({ name, email, company_name });
  } catch (err) {
    console.error('[getInvite]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function acceptInvite(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE invite_token = ?', [token]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Invitación inválida o ya utilizada.' });

    const hashed = await bcrypt.hash(password, 12);
    await pool.execute(
      'UPDATE users SET password = ?, invite_token = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );
    res.json({ message: 'Cuenta activada correctamente.' });
  } catch (err) {
    console.error('[acceptInvite]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

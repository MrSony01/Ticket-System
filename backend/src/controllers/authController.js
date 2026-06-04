import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { findByEmail, create } from '../models/userModel.js';

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
    const { email, password, company_slug } = req.body;

    if (!email || !password || !company_slug) {
      return res.status(400).json({ message: 'Email, contraseña y slug de empresa son requeridos.' });
    }

    const company = await findCompanyBySlug(company_slug);
    if (!company) {
      return res.status(401).json({ message: 'Empresa no encontrada.' });
    }

    const user = await findByEmail(email, company.id);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id },
      company: { id: company.id, name: company.name, slug: company.slug },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Error interno del servidor.', detail: err.message });
  }
}

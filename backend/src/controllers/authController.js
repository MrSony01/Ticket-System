import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmailAndCompany, createCompanyWithAdmin } from '../models/userModel.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, company_id: user.company_id, role_id: user.role_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export async function register(req, res) {
  const { companyName, companySlug, name, email, password } = req.body;

  if (!companyName || !companySlug || !name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const { companyId, userId } = await createCompanyWithAdmin({
      companyName,
      companySlug,
      name,
      email,
      hashedPassword,
    });

    res.status(201).json({ message: 'Empresa y administrador creados.', companyId, userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El slug de empresa o el email ya están en uso.' });
    }
    throw err;
  }
}

export async function login(req, res) {
  const { email, password, companySlug } = req.body;

  if (!email || !password || !companySlug) {
    return res.status(400).json({ message: 'Email, contraseña y empresa son requeridos.' });
  }

  const user = await findByEmailAndCompany(email, companySlug);

  if (!user || !user.active) {
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
  });
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, create } from '../models/userModel.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
  }

  const existing = await findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'El email ya está registrado.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = await create({ name, email, hashedPassword });

  res.status(201).json({ message: 'Usuario registrado.', id: userId });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  const user = await findByEmail(email);
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
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

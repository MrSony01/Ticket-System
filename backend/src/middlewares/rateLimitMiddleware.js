import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,                 // máximo 5 intentos por IP en la ventana
  standardHeaders: true,    // headers RateLimit-*
  legacyHeaders: false,     // sin headers X-RateLimit-*
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

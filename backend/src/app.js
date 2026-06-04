import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes     from './routes/authRoutes.js';
import ticketRoutes   from './routes/ticketRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes    from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());                  // Permite peticiones desde el frontend
app.use(express.json());          // Permite leer JSON en el body de las peticiones

// Rutas
app.use('/api/auth',       authRoutes);
app.use('/api/tickets',    ticketRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin',      adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

export default app;
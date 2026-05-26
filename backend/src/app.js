import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());                  // Permite peticiones desde el frontend
app.use(express.json());          // Permite leer JSON en el body de las peticiones

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

export default app;
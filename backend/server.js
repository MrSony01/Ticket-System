import app from './src/app.js';
import pool from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function migrate() {
  try {
    await pool.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) DEFAULT NULL`
    );
  } catch (e) {
    console.error('[migrate]', e.message);
  }
}

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
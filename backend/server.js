import app from './src/app.js';
import pool from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function migrate() {
  const stmts = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) DEFAULT NULL`,
    `CREATE TABLE IF NOT EXISTS activity_log (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      user_id    INT,
      action     VARCHAR(64) NOT NULL,
      entity_type VARCHAR(32),
      entity_id  INT,
      metadata   JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_company (company_id, created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      company_id INT NOT NULL,
      type       VARCHAR(32) NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT,
      entity_id  INT,
      read_at    TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_user (user_id, read_at)
    )`,
    `CREATE TABLE IF NOT EXISTS sla_configs (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      company_id       INT NOT NULL,
      priority         VARCHAR(16) NOT NULL,
      response_hours   INT NOT NULL DEFAULT 24,
      resolution_hours INT NOT NULL DEFAULT 72,
      UNIQUE KEY uq_sla_company_priority (company_id, priority)
    )`,
  ];
  for (const sql of stmts) {
    try { await pool.execute(sql); } catch (e) { console.error('[migrate]', e.message); }
  }
}

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
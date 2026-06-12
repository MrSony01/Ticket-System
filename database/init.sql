CREATE DATABASE IF NOT EXISTS ticketdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticketdb;

CREATE TABLE IF NOT EXISTS companies (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_group (company_id, name),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_category (company_id, name),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  group_id   INT,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  invite_token VARCHAR(64)  DEFAULT NULL,
  role         ENUM('user', 'technician', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_email (company_id, email),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id)   REFERENCES groups(id)   ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  company_id  INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status      ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  priority    ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  category_id INT,
  user_id     INT NOT NULL,
  assigned_to INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_company_status  ON tickets(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_company_created ON tickets(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned        ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_category        ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority        ON tickets(company_id, priority);

CREATE TABLE IF NOT EXISTS comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT NOT NULL,
  user_id     INT NOT NULL,
  content     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);

-- ============================================================
-- TICKET SYSTEM — init.sql
-- Multi-tenant: cada empresa tiene sus propios usuarios y tickets
-- ============================================================

CREATE DATABASE IF NOT EXISTS ticketdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticketdb;

-- ------------------------------------------------------------
-- COMPANIES
-- Raíz del modelo multi-tenant. Todo se aísla por company_id.
-- ------------------------------------------------------------
CREATE TABLE companies (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  slug        VARCHAR(80)   NOT NULL UNIQUE,   -- identificador URL-friendly
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ROLES
-- Tabla de referencia. Los valores se insertan como semilla.
-- ------------------------------------------------------------
CREATE TABLE roles (
  id    TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(30) NOT NULL UNIQUE   -- 'admin' | 'manager' | 'agent' | 'user'
);

INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('agent'), ('user');

-- ------------------------------------------------------------
-- USERS
-- Un usuario pertenece a UNA empresa. El rol determina sus permisos
-- dentro de esa empresa. Email único por empresa, no global.
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED     NOT NULL,
  role_id     TINYINT UNSIGNED NOT NULL,
  name        VARCHAR(100)     NOT NULL,
  email       VARCHAR(150)     NOT NULL,
  password    VARCHAR(255)     NOT NULL,          -- bcrypt hash
  active      BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_email_company (company_id, email),   -- email único POR empresa
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id)    REFERENCES roles(id)
);

-- ------------------------------------------------------------
-- CATEGORIES
-- Clasificación de tickets por empresa (ej: "Facturación", "TI").
-- Cada empresa gestiona las suyas.
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED  NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TICKETS
-- Núcleo del sistema. created_by = usuario que abrió el ticket.
-- assigned_to = agente asignado (NULL si aún no asignado).
-- El aislamiento multi-tenant lo garantiza company_id en cada query.
-- ------------------------------------------------------------
CREATE TABLE tickets (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED    NOT NULL,
  category_id  INT UNSIGNED    NULL,
  created_by   INT UNSIGNED    NOT NULL,
  assigned_to  INT UNSIGNED    NULL,

  title        VARCHAR(200)    NOT NULL,
  description  TEXT            NOT NULL,

  priority     ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status       ENUM('open','in_progress','resolved','closed')  NOT NULL DEFAULT 'open',

  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at  DATETIME        NULL,

  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_company_status   (company_id, status),
  INDEX idx_company_assigned (company_id, assigned_to)
);

-- ------------------------------------------------------------
-- COMMENTS
-- Hilo de conversación dentro de un ticket.
-- internal = TRUE es una nota privada visible solo para agentes/managers/admin.
-- ------------------------------------------------------------
CREATE TABLE comments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  body        TEXT          NOT NULL,
  internal    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)
);

-- ------------------------------------------------------------
-- TICKET_HISTORY
-- Auditoría: registra cada cambio de estado o reasignación.
-- changed_by = quién hizo el cambio.
-- ------------------------------------------------------------
CREATE TABLE ticket_history (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT UNSIGNED  NOT NULL,
  changed_by  INT UNSIGNED  NOT NULL,
  field       VARCHAR(50)   NOT NULL,   -- 'status' | 'assigned_to' | 'priority'
  old_value   VARCHAR(100)  NULL,
  new_value   VARCHAR(100)  NULL,
  changed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ticket_id)  REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

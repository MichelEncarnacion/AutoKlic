-- AutoKlic MySQL schema (cPanel / Namecheap)
-- Import via phpMyAdmin after creating an empty database.
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin','seller','viewer') NOT NULL DEFAULT 'viewer',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profiles_email (email),
  CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_password_resets_token (token),
  KEY idx_password_resets_user (user_id),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cars (
  id CHAR(36) NOT NULL PRIMARY KEY,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  `año` INT NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  kilometraje INT NULL,
  motor VARCHAR(100) NULL,
  transmision VARCHAR(50) NOT NULL,
  combustible VARCHAR(50) NOT NULL,
  color VARCHAR(50) NULL,
  puertas INT NULL,
  traccion VARCHAR(50) NULL,
  aire TINYINT(1) NOT NULL DEFAULT 0,
  infoentretenimiento TEXT NULL,
  descripcion TEXT NULL,
  imagenes JSON NOT NULL,
  status ENUM('available','sold','reserved') NOT NULL DEFAULT 'available',
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cars_visible_created (visible, created_at),
  KEY idx_cars_marca (marca),
  KEY idx_cars_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NULL,
  marca VARCHAR(100) NULL,
  modelo VARCHAR(100) NULL,
  `año` INT NULL,
  kilometraje INT NULL,
  descripcion TEXT NULL,
  status ENUM('pending','reviewing','offer_made','closed') NOT NULL DEFAULT 'pending',
  notas TEXT NULL,
  assigned_to CHAR(36) NULL,
  last_activity_at DATETIME NULL,
  precio_cierre DECIMAL(12,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_leads_status (status),
  KEY idx_leads_assigned (assigned_to),
  KEY idx_leads_created (created_at),
  CONSTRAINT fk_leads_assigned FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  event_type ENUM('status_change','assignment_change','note_added') NOT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_lead_events_lead (lead_id, created_at),
  CONSTRAINT fk_lead_events_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_events_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras (
  id CHAR(36) NOT NULL PRIMARY KEY,
  marca VARCHAR(100) NULL,
  modelo VARCHAR(100) NULL,
  `año` INT NULL,
  color VARCHAR(50) NULL,
  kilometraje DECIMAL(12,2) NULL,
  vin VARCHAR(64) NULL,
  precio_compra DECIMAL(12,2) NOT NULL,
  fecha_compra DATE NOT NULL,
  vendedor_nombre VARCHAR(255) NULL,
  vendedor_telefono VARCHAR(50) NULL,
  forma_pago ENUM('efectivo','transferencia','cheque') NULL,
  doc_factura TINYINT(1) NOT NULL DEFAULT 0,
  doc_tenencia TINYINT(1) NOT NULL DEFAULT 0,
  doc_verificacion TINYINT(1) NOT NULL DEFAULT 0,
  doc_factura_url TEXT NULL,
  doc_tenencia_url TEXT NULL,
  doc_verificacion_url TEXT NULL,
  notas TEXT NULL,
  created_by CHAR(36) NULL,
  car_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_compras_fecha (fecha_compra),
  KEY idx_compras_created_by (created_by),
  CONSTRAINT fk_compras_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_compras_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gastos_compra (
  id CHAR(36) NOT NULL PRIMARY KEY,
  compra_id CHAR(36) NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_gastos_compra (compra_id),
  CONSTRAINT fk_gastos_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (`key`, value)
VALUES ('follow_up_days', '3')
ON DUPLICATE KEY UPDATE value = value;

SET FOREIGN_KEY_CHECKS = 1;

-- After import, create the first admin with sql/seed-admin.sql (edit password/email first).

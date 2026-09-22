-- Seed: single bootstrap admin (clean start — no Supabase import).
-- Run AFTER sql/schema.sql in phpMyAdmin.
--
-- DEFAULT CREDENTIALS (change immediately after first login):
--   Email:    admin@autoclik.michel-encarnacion.dev
--   Password: AdminTemp2026!
--
-- Login at: https://autoclik.michel-encarnacion.dev/login
-- Then go to Perfil and set a new password.

SET @admin_id = 'a0000000-0000-4000-8000-000000000001';

INSERT INTO users (id, email, password_hash)
VALUES (
  @admin_id,
  'admin@autoclik.michel-encarnacion.dev',
  '$2y$10$ewXH0Nj211VsFG5X0UUSqur8xwjl3BW0SHdHQJ60qzterpp0yrtvu'
)
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO profiles (id, nombre, email, role, active)
VALUES (
  @admin_id,
  'Administrador',
  'admin@autoclik.michel-encarnacion.dev',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), role = 'admin', active = 1;

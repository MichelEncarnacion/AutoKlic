-- Seed: single bootstrap admin (clean start — no Supabase import).
-- Run AFTER sql/schema.sql in phpMyAdmin.
--
-- DO NOT commit real passwords here. Generate your own:
--
--   php -r "echo password_hash('YOUR_STRONG_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
--
-- Then replace CHANGE_ME_BCRYPT_HASH below with the output, set the email,
-- import this file once, and store the plaintext password ONLY outside git
-- (e.g. password manager / internal ops notes). Login at /login → Perfil
-- to rotate later.
--
-- Example email (change if needed): admin@autoclik.michel-encarnacion.dev

SET @admin_id = 'a0000000-0000-4000-8000-000000000001';

INSERT INTO users (id, email, password_hash)
VALUES (
  @admin_id,
  'admin@autoclik.michel-encarnacion.dev',
  'CHANGE_ME_BCRYPT_HASH'
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

-- ============================================================
-- 002_admin_cuentas.sql
-- Paste in Supabase SQL editor AFTER running 001_security_rbac.sql
-- ============================================================

-- 1. Add ADMIN_CUENTAS role
INSERT INTO roles (nombre, descripcion)
VALUES ('ADMIN_CUENTAS', 'Registro de nuevas cuentas de estudiantes y docentes')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Remove usuarios:crear from ADMIN_SEGURIDAD
--    (ADMIN_SEGURIDAD manages roles/permissions but does NOT create accounts)
DELETE FROM rol_permisos
WHERE rol_id  = (SELECT id FROM roles   WHERE nombre = 'ADMIN_SEGURIDAD')
  AND permiso_id = (SELECT id FROM permisos WHERE nombre = 'usuarios:crear');

-- 3. Assign ONLY usuarios:crear to ADMIN_CUENTAS
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT
  (SELECT id FROM roles   WHERE nombre = 'ADMIN_CUENTAS'),
  (SELECT id FROM permisos WHERE nombre = 'usuarios:crear')
ON CONFLICT DO NOTHING;

-- 4. Mark existing ADMIN_CUENTAS users as email-verified (if any)
UPDATE usuarios SET email_verificado = TRUE
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'ADMIN_CUENTAS')
  AND (email_verificado = FALSE OR email_verificado IS NULL);

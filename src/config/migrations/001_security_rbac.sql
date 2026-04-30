-- ============================================================
-- 001_security_rbac.sql
-- Paste this entire file in the Supabase SQL editor and run it.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- ============================================================

-- ------------------------------------------------------------
-- 1.1  Roles table — add description & active flag
-- ------------------------------------------------------------
ALTER TABLE roles ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- ------------------------------------------------------------
-- 1.1  Permissions table (resource:action format)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 1.1  Role-Permission pivot
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id     INTEGER REFERENCES roles(id)   ON DELETE CASCADE,
  permiso_id INTEGER REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- ------------------------------------------------------------
-- 1.2  Password-security columns on usuarios
-- ------------------------------------------------------------
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado        BOOLEAN    DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacion      VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacion_expira TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos       INTEGER    DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta         TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_cambiado_en    TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo                  BOOLEAN    DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_hash        VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expira      TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 1.3  Password history table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_passwords (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 1.4  Seed segregated roles
-- ------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
  ('ESTUDIANTE',      'Acceso al catálogo, inscripciones y pagos propios')
  ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('DOCENTE',         'Gestión de sus propios cursos y tareas')
  ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('ADMIN_SEGURIDAD', 'Gestión de usuarios, roles y permisos')
  ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('ADMIN_CURSOS',    'Creación y gestión de cursos y asignación de docentes')
  ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('ADMIN_PAGOS',     'Supervisión de pagos, facturas y cajas')
  ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('ADMIN_REPORTES',  'Acceso a reportes y auditoría del sistema')
  ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- 1.5  Seed permissions
-- ------------------------------------------------------------
INSERT INTO permisos (nombre, descripcion) VALUES
  ('usuarios:leer',           'Ver listado y detalle de usuarios'),
  ('usuarios:crear',          'Crear nuevos usuarios'),
  ('usuarios:editar',         'Editar datos y rol de usuarios'),
  ('usuarios:eliminar',       'Eliminar usuarios'),
  ('roles:leer',              'Ver listado de roles y sus permisos'),
  ('roles:crear',             'Crear nuevos roles'),
  ('roles:editar',            'Editar descripción de roles'),
  ('roles:eliminar',          'Eliminar roles'),
  ('permisos:leer',           'Ver listado de permisos'),
  ('permisos:asignar',        'Asignar / revocar permisos a roles'),
  ('cursos:leer',             'Ver catálogo de cursos'),
  ('cursos:crear',            'Crear nuevos cursos'),
  ('cursos:editar',           'Editar cursos existentes'),
  ('cursos:eliminar',         'Eliminar cursos'),
  ('inscripciones:leer',      'Ver inscripciones'),
  ('inscripciones:crear',     'Inscribirse a un curso'),
  ('inscripciones:cancelar',  'Cancelar una inscripción'),
  ('pagos:leer',              'Ver historial de pagos'),
  ('pagos:crear',             'Realizar un pago'),
  ('pagos:reembolsar',        'Emitir reembolsos'),
  ('facturas:leer',           'Ver facturas'),
  ('facturas:generar',        'Generar y enviar facturas'),
  ('tareas:leer',             'Ver tareas y calificaciones'),
  ('tareas:crear',            'Crear tareas'),
  ('tareas:editar',           'Editar tareas existentes'),
  ('tareas:eliminar',         'Eliminar tareas'),
  ('reportes:leer',           'Ver reportes del sistema'),
  ('auditoria:leer',          'Ver logs de auditoría')
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- 1.5  Assign permissions to roles (by name, no hardcoded IDs)
-- ------------------------------------------------------------
DO $$
DECLARE
  r_estudiante      INTEGER;
  r_docente         INTEGER;
  r_admin_seguridad INTEGER;
  r_admin_cursos    INTEGER;
  r_admin_pagos     INTEGER;
  r_admin_reportes  INTEGER;
BEGIN
  SELECT id INTO r_estudiante      FROM roles WHERE nombre = 'ESTUDIANTE';
  SELECT id INTO r_docente         FROM roles WHERE nombre = 'DOCENTE';
  SELECT id INTO r_admin_seguridad FROM roles WHERE nombre = 'ADMIN_SEGURIDAD';
  SELECT id INTO r_admin_cursos    FROM roles WHERE nombre = 'ADMIN_CURSOS';
  SELECT id INTO r_admin_pagos     FROM roles WHERE nombre = 'ADMIN_PAGOS';
  SELECT id INTO r_admin_reportes  FROM roles WHERE nombre = 'ADMIN_REPORTES';

  -- ESTUDIANTE
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_estudiante, id FROM permisos
    WHERE nombre IN (
      'cursos:leer','inscripciones:crear','inscripciones:cancelar',
      'pagos:crear','facturas:leer','tareas:leer'
    )
  ON CONFLICT DO NOTHING;

  -- DOCENTE
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_docente, id FROM permisos
    WHERE nombre IN (
      'cursos:leer','cursos:editar',
      'tareas:crear','tareas:editar','tareas:eliminar','tareas:leer'
    )
  ON CONFLICT DO NOTHING;

  -- ADMIN_SEGURIDAD — all usuarios:*, roles:*, permisos:*
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_admin_seguridad, id FROM permisos
    WHERE nombre LIKE 'usuarios:%'
       OR nombre LIKE 'roles:%'
       OR nombre LIKE 'permisos:%'
  ON CONFLICT DO NOTHING;

  -- ADMIN_CURSOS — all cursos:* + inscripciones:leer + tareas:leer
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_admin_cursos, id FROM permisos
    WHERE nombre LIKE 'cursos:%'
       OR nombre IN ('inscripciones:leer','tareas:leer')
  ON CONFLICT DO NOTHING;

  -- ADMIN_PAGOS — all pagos:*, facturas:* + inscripciones:leer
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_admin_pagos, id FROM permisos
    WHERE nombre LIKE 'pagos:%'
       OR nombre LIKE 'facturas:%'
       OR nombre = 'inscripciones:leer'
  ON CONFLICT DO NOTHING;

  -- ADMIN_REPORTES — reportes:leer + auditoria:leer + usuarios:leer
  INSERT INTO rol_permisos (rol_id, permiso_id)
    SELECT r_admin_reportes, id FROM permisos
    WHERE nombre IN ('reportes:leer','auditoria:leer','usuarios:leer')
  ON CONFLICT DO NOTHING;
END;
$$;

-- ------------------------------------------------------------
-- Backfill: mark pre-existing users as email-verified so they
-- are not locked out by the new verification check.
-- New registrations (post-migration) go through email verification.
-- ------------------------------------------------------------
UPDATE usuarios SET email_verificado = TRUE
WHERE email_verificado = FALSE OR email_verificado IS NULL;

-- ============================================================
-- 002_simplify_permisos.sql
-- Simplifica los permisos granulares a 8 agrupados.
-- Pegar en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- ------------------------------------------------------------
-- ACCIONES UNIVERSALES (no requieren permiso RBAC)
-- - Cambiar propia contraseña  → PUT /api/autenticacion/cambiar-password
-- - Ver propio perfil          → GET /api/autenticacion/perfil
-- El auto-registro de estudiantes es ruta pública (sin auth).
-- Docentes y otros cargos deben ser registrados por ADMIN_CUENTAS.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- PASO 1 — Limpiar asignaciones y permisos anteriores
-- (no tocamos la tabla roles para no romper FKs con usuarios)
-- ------------------------------------------------------------
DELETE FROM rol_permisos;
DELETE FROM permisos;

-- Reiniciar secuencia de permisos desde 1
ALTER SEQUENCE IF EXISTS permisos_id_seq RESTART WITH 1;

-- Corregir secuencia de roles por si está desincronizada
SELECT setval(
  pg_get_serial_sequence('roles', 'id'),
  COALESCE((SELECT MAX(id) FROM roles), 0) + 1,
  false
);

-- ------------------------------------------------------------
-- PASO 2 — Insertar los 8 nuevos permisos simplificados
-- ------------------------------------------------------------
INSERT INTO permisos (nombre, descripcion) VALUES
  ('usuarios:gestionar',
   'Gestión completa de usuarios: listar, crear cuentas, editar datos, cambiar roles, desbloquear y eliminar.'),

  ('roles:gestionar',
   'Gestión completa de roles y permisos: crear/editar/eliminar roles, asignar y revocar permisos.'),

  ('cursos:gestionar',
   'Gestión completa de cursos: crear, editar, eliminar y asignar docentes.'),

  ('cursos:ver',
   'Acceso de solo lectura al catálogo de cursos del panel administrativo.'),

  ('inscripciones:gestionar',
   'Ver y gestionar inscripciones: cambiar estado académico, exportar listas.'),

  ('pagos:ver',
   'Consultar historial de pagos, comprobantes y estado financiero. Solo lectura.'),

  ('reportes:ver',
   'Generar y descargar reportes del sistema. Solo lectura.'),

  ('auditoria:ver',
   'Consultar el registro de auditoría del sistema. Solo lectura.')

ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- ------------------------------------------------------------
-- PASO 3 — Upsert de roles (crea los que no existen,
--           actualiza descripción de los que ya existen,
--           nunca genera conflicto de PK)
-- ------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
  ('ADMINISTRADOR',   'Administrador general con acceso total al sistema'),
  ('ADMIN_CUENTAS',   'Crea y gestiona cuentas de estudiantes y docentes'),
  ('ADMIN_SEGURIDAD', 'Gestiona usuarios, roles y permisos del sistema'),
  ('ADMIN_CURSOS',    'Crea y administra cursos extraacadémicos y asigna docentes'),
  ('ADMIN_PAGOS',     'Supervisa pagos e inscripciones'),
  ('ADMIN_REPORTES',  'Accede a reportes y auditoría del sistema'),
  ('DOCENTE',         'Gestiona sus propios cursos asignados'),
  ('ESTUDIANTE',      'Acceso al catálogo, inscripciones y pagos propios')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- ------------------------------------------------------------
-- PASO 4 — Asignar permisos a roles
-- ------------------------------------------------------------
DO $$
DECLARE
  r_administrador   INTEGER;
  r_cuentas         INTEGER;
  r_seguridad       INTEGER;
  r_cursos          INTEGER;
  r_pagos           INTEGER;
  r_reportes        INTEGER;

  p_usuarios        INTEGER;
  p_roles           INTEGER;
  p_cursos_g        INTEGER;
  p_cursos_v        INTEGER;
  p_inscripciones   INTEGER;
  p_pagos           INTEGER;
  p_reportes        INTEGER;
  p_auditoria       INTEGER;
BEGIN
  SELECT id INTO r_administrador FROM roles WHERE nombre = 'ADMINISTRADOR';
  SELECT id INTO r_cuentas        FROM roles WHERE nombre = 'ADMIN_CUENTAS';
  SELECT id INTO r_seguridad      FROM roles WHERE nombre = 'ADMIN_SEGURIDAD';
  SELECT id INTO r_cursos         FROM roles WHERE nombre = 'ADMIN_CURSOS';
  SELECT id INTO r_pagos          FROM roles WHERE nombre = 'ADMIN_PAGOS';
  SELECT id INTO r_reportes       FROM roles WHERE nombre = 'ADMIN_REPORTES';

  SELECT id INTO p_usuarios      FROM permisos WHERE nombre = 'usuarios:gestionar';
  SELECT id INTO p_roles         FROM permisos WHERE nombre = 'roles:gestionar';
  SELECT id INTO p_cursos_g      FROM permisos WHERE nombre = 'cursos:gestionar';
  SELECT id INTO p_cursos_v      FROM permisos WHERE nombre = 'cursos:ver';
  SELECT id INTO p_inscripciones FROM permisos WHERE nombre = 'inscripciones:gestionar';
  SELECT id INTO p_pagos         FROM permisos WHERE nombre = 'pagos:ver';
  SELECT id INTO p_reportes      FROM permisos WHERE nombre = 'reportes:ver';
  SELECT id INTO p_auditoria     FROM permisos WHERE nombre = 'auditoria:ver';

  -- ADMINISTRADOR — acceso total
  IF r_administrador IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_administrador, p_usuarios),
      (r_administrador, p_roles),
      (r_administrador, p_cursos_g),
      (r_administrador, p_cursos_v),
      (r_administrador, p_inscripciones),
      (r_administrador, p_pagos),
      (r_administrador, p_reportes),
      (r_administrador, p_auditoria)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ADMIN_CUENTAS — crear y gestionar cuentas de usuario
  IF r_cuentas IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_cuentas, p_usuarios)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ADMIN_SEGURIDAD — usuarios + roles y permisos
  IF r_seguridad IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_seguridad, p_usuarios),
      (r_seguridad, p_roles)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ADMIN_CURSOS — cursos completo + inscripciones
  IF r_cursos IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_cursos, p_cursos_g),
      (r_cursos, p_inscripciones)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ADMIN_PAGOS — ver pagos + inscripciones
  IF r_pagos IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_pagos, p_pagos),
      (r_pagos, p_inscripciones)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ADMIN_REPORTES — reportes + auditoría
  IF r_reportes IS NOT NULL THEN
    INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (r_reportes, p_reportes),
      (r_reportes, p_auditoria)
    ON CONFLICT DO NOTHING;
  END IF;

END;
$$;

-- ------------------------------------------------------------
-- DOCENTE y ESTUDIANTE no reciben permisos RBAC.
-- Sus rutas están protegidas por verificarRol (nombre de rol).
-- Acciones universales (cambiar contraseña, ver perfil propio)
-- están abiertas a cualquier usuario autenticado sin permiso RBAC.
-- ------------------------------------------------------------

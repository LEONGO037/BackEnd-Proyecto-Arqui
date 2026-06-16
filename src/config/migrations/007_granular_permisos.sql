-- ============================================================
-- 007_granular_permisos.sql
-- Divide los permisos "gestionar" de CURSOS y USUARIOS en
-- acciones granulares, tal como pidió la docente
-- (ej: cursos → registrar / modificar / eliminar / ver).
--
-- Estrategia (segura y reversible):
--   1. Crea los permisos granulares.
--   2. A cada rol que tenía 'cursos:gestionar' le otorga los
--      granulares de cursos; ídem para 'usuarios:gestionar'.
--   3. Quita las asignaciones del permiso 'gestionar' legacy.
--   4. Desactiva (activo = FALSE) los permisos 'gestionar' legacy
--      para que desaparezcan de la matriz y de la UI, pero sin
--      borrarlos (las rutas siguen aceptándolos como respaldo).
--
-- Idempotente: seguro para ejecutar más de una vez.
-- Pegar en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- ------------------------------------------------------------
-- PASO 1 — Crear permisos granulares
-- (cursos:ver ya existe desde 002_simplify_permisos)
-- ------------------------------------------------------------
INSERT INTO permisos (nombre, descripcion) VALUES
  ('cursos:registrar', 'Registrar (crear) nuevos cursos en el catálogo.'),
  ('cursos:modificar', 'Modificar cursos existentes: datos, prerrequisitos y asignación de docente.'),
  ('cursos:eliminar',  'Eliminar cursos del catálogo.'),
  ('usuarios:ver',     'Ver el listado y el detalle de usuarios.'),
  ('usuarios:crear',   'Crear nuevas cuentas de usuario (estudiantes, docentes, administrativos).'),
  ('usuarios:editar',  'Editar usuarios: cambiar su rol y desbloquear cuentas.'),
  ('usuarios:eliminar','Eliminar (desactivar) cuentas de usuario.')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion, activo = TRUE;

-- Asegura que cursos:ver esté activo (por si quedó desactivado)
UPDATE permisos SET activo = TRUE WHERE nombre = 'cursos:ver';

-- ------------------------------------------------------------
-- PASO 2 — Otorgar los granulares a los roles que ya tenían
--          el permiso "gestionar" correspondiente.
-- ------------------------------------------------------------
-- CURSOS: registrar / modificar / eliminar / ver
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT rp.rol_id, pg.id
FROM rol_permisos rp
JOIN permisos pc ON pc.id = rp.permiso_id AND pc.nombre = 'cursos:gestionar'
JOIN permisos pg ON pg.nombre IN ('cursos:registrar', 'cursos:modificar', 'cursos:eliminar', 'cursos:ver')
ON CONFLICT DO NOTHING;

-- USUARIOS: ver / crear / editar / eliminar
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT rp.rol_id, pg.id
FROM rol_permisos rp
JOIN permisos pu ON pu.id = rp.permiso_id AND pu.nombre = 'usuarios:gestionar'
JOIN permisos pg ON pg.nombre IN ('usuarios:ver', 'usuarios:crear', 'usuarios:editar', 'usuarios:eliminar')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- PASO 3 — Quitar las asignaciones del permiso "gestionar" legacy
--          (ya reemplazado por los granulares).
-- ------------------------------------------------------------
DELETE FROM rol_permisos
WHERE permiso_id IN (
  SELECT id FROM permisos WHERE nombre IN ('cursos:gestionar', 'usuarios:gestionar')
);

-- ------------------------------------------------------------
-- PASO 4 — Desactivar los permisos "gestionar" legacy.
--          No se borran: las rutas los aceptan como respaldo,
--          pero al estar inactivos no aparecen en la matriz ni
--          en la UI y getRolePermissions (que filtra activo=TRUE)
--          deja de devolverlos → la granularidad es efectiva.
-- ------------------------------------------------------------
UPDATE permisos SET activo = FALSE
WHERE nombre IN ('cursos:gestionar', 'usuarios:gestionar');

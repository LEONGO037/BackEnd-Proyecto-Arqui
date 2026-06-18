-- ============================================================
-- 008_inscripciones_ver.sql
-- Añade granularidad de solo-lectura a INSCRIPCIONES.
--
-- El panel de inscripciones del administrador es de solo lectura
-- (resumen de ocupación). Por eso se separa en dos niveles:
--   inscripciones:ver       → consultar el resumen (solo lectura)
--   inscripciones:gestionar → control total (ya existente)
--
-- A cada rol que ya tenía 'inscripciones:gestionar' se le concede
-- también 'inscripciones:ver' para que conserve el acceso de lectura.
--
-- Idempotente: seguro para ejecutar más de una vez.
-- Pegar en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- PASO 1 — Crear el permiso de solo lectura
INSERT INTO permisos (nombre, descripcion) VALUES
  ('inscripciones:ver', 'Consultar el resumen de inscripciones y ocupación de cursos. Solo lectura.')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion, activo = TRUE;

-- PASO 2 — Otorgar 'inscripciones:ver' a los roles que ya gestionan inscripciones
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT rp.rol_id, pv.id
FROM rol_permisos rp
JOIN permisos pg ON pg.id = rp.permiso_id AND pg.nombre = 'inscripciones:gestionar'
JOIN permisos pv ON pv.nombre = 'inscripciones:ver'
ON CONFLICT DO NOTHING;

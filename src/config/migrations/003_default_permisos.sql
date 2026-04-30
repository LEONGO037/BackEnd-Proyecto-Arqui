-- ============================================================
-- 003_default_permisos.sql
-- Agrega dos permisos estáticos predeterminados:
--   usuario:estudiante  — todas las capacidades del estudiante
--   usuario:docente     — todas las capacidades del docente
-- Asigna cada uno al rol correspondiente.
-- Idempotente: seguro para ejecutar más de una vez.
-- ============================================================

-- Insertar permisos (sin tocar los 8 permisos admin existentes)
INSERT INTO permisos (nombre, descripcion) VALUES
  ('usuario:estudiante',
   'Acceso completo a funcionalidades de estudiante: ver catálogo, inscribirse, ver y realizar pagos, ver calificaciones y cursos propios.'),
  ('usuario:docente',
   'Acceso completo a funcionalidades de docente: gestionar cursos asignados, registrar y ver calificaciones, ver sus estudiantes inscritos.')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- Asignar usuario:estudiante al rol ESTUDIANTE
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'ESTUDIANTE' AND p.nombre = 'usuario:estudiante'
ON CONFLICT DO NOTHING;

-- Asignar usuario:docente al rol DOCENTE
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'DOCENTE' AND p.nombre = 'usuario:docente'
ON CONFLICT DO NOTHING;

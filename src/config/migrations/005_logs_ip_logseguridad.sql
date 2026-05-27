-- ===========================================================================
-- Migración 005 — IP en log_aplicacion + permiso logs:seguridad
--
-- 1) Añade ip y user_agent a log_aplicacion para rastrear origen de eventos.
-- 2) Inserta el permiso 'logs:seguridad' para el nuevo visor de seguridad.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) Columnas ip / user_agent en log_aplicacion
-- ---------------------------------------------------------------------------
ALTER TABLE public.log_aplicacion
  ADD COLUMN IF NOT EXISTS ip         VARCHAR(64),
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_log_aplicacion_ip
  ON public.log_aplicacion(ip);

-- ---------------------------------------------------------------------------
-- 2) Permiso logs:seguridad
-- ---------------------------------------------------------------------------
INSERT INTO public.permisos (nombre, descripcion, activo)
VALUES (
  'logs:seguridad',
  'Ver el historial de eventos de seguridad: inicios de sesión, bloqueos, tokens inválidos y accesos denegados. Solo lectura.',
  true
)
ON CONFLICT (nombre) DO NOTHING;

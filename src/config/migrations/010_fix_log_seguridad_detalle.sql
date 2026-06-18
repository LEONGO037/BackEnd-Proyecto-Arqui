-- ===========================================================================
-- 010_fix_log_seguridad_detalle.sql
-- Agrega columnas faltantes a log_seguridad y log_aplicacion si no existen.
-- Seguro para correr múltiples veces (ADD COLUMN IF NOT EXISTS).
-- ===========================================================================

-- log_seguridad: agregar detalle si no existe
ALTER TABLE public.log_seguridad
  ADD COLUMN IF NOT EXISTS detalle JSONB DEFAULT '{}'::jsonb;

-- log_seguridad: agregar ip y user_agent si no existen
ALTER TABLE public.log_seguridad
  ADD COLUMN IF NOT EXISTS ip         VARCHAR(64),
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS ruta       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS metodo     VARCHAR(10);

-- log_aplicacion: agregar ip y user_agent si no existen
ALTER TABLE public.log_aplicacion
  ADD COLUMN IF NOT EXISTS ip         VARCHAR(64),
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

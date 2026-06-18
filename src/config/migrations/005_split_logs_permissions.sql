-- ===========================================================================
-- 005_split_logs_permissions.sql
-- ===========================================================================

-- 1) Asegurar que las tablas de logs estructurados existan
CREATE TABLE IF NOT EXISTS public.log_aplicacion (
    id              BIGSERIAL PRIMARY KEY,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    nivel           VARCHAR(10) NOT NULL CHECK (nivel IN ('INFO','WARN','ERROR')),
    modulo          VARCHAR(80) NOT NULL,
    evento          VARCHAR(80) NOT NULL,
    mensaje         TEXT,
    usuario_id      INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    detalle         JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_log_aplicacion_fecha    ON public.log_aplicacion(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_nivel    ON public.log_aplicacion(nivel);
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_modulo   ON public.log_aplicacion(modulo);
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_usuario  ON public.log_aplicacion(usuario_id);

CREATE TABLE IF NOT EXISTS public.log_seguridad (
    id              BIGSERIAL PRIMARY KEY,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evento          VARCHAR(60) NOT NULL,
    exito           BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id      INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    email           VARCHAR(150),
    ip              VARCHAR(64),
    user_agent      TEXT,
    ruta            VARCHAR(255),
    metodo          VARCHAR(10),
    detalle         JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_log_seguridad_fecha    ON public.log_seguridad(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_evento   ON public.log_seguridad(evento);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_usuario  ON public.log_seguridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_email    ON public.log_seguridad(email);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_ip       ON public.log_seguridad(ip);

-- 2) Eliminar permisos antiguos y dependencias de la tabla rol_permisos
DO $$
DECLARE
    old_perm_id INTEGER;
BEGIN
    SELECT id INTO old_perm_id FROM public.permisos WHERE nombre = 'auditoria:ver';
    IF old_perm_id IS NOT NULL THEN
        DELETE FROM public.rol_permisos WHERE permiso_id = old_perm_id;
        DELETE FROM public.permisos WHERE id = old_perm_id;
    END IF;
END $$;

-- 3) Insertar nuevos permisos independientes
INSERT INTO public.permisos (nombre, descripcion) VALUES
  ('logs_aplicacion:ver', 'Consultar el registro de eventos de funcionalidades críticas del negocio. Solo lectura.'),
  ('logs_seguridad:ver', 'Consultar el registro de accesos, logins, bloqueos y desbloqueos. Solo lectura.')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 4) Mapear permisos a los roles ADMINISTRADOR y ADMIN_REPORTES
DO $$
DECLARE
  r_admin       INTEGER;
  r_reportes    INTEGER;
  p_logs_app    INTEGER;
  p_logs_sec    INTEGER;
BEGIN
  -- Obtener IDs de Roles
  SELECT id INTO r_admin    FROM public.roles WHERE nombre = 'ADMINISTRADOR';
  SELECT id INTO r_reportes FROM public.roles WHERE nombre = 'ADMIN_REPORTES';

  -- Obtener IDs de los nuevos permisos
  SELECT id INTO p_logs_app FROM public.permisos WHERE nombre = 'logs_aplicacion:ver';
  SELECT id INTO p_logs_sec FROM public.permisos WHERE nombre = 'logs_seguridad:ver';

  -- Asignar a ADMINISTRADOR
  IF r_admin IS NOT NULL THEN
    IF p_logs_app IS NOT NULL THEN
      INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (r_admin, p_logs_app) ON CONFLICT DO NOTHING;
    END IF;
    IF p_logs_sec IS NOT NULL THEN
      INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (r_admin, p_logs_sec) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Asignar a ADMIN_REPORTES
  IF r_reportes IS NOT NULL THEN
    IF p_logs_app IS NOT NULL THEN
      INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (r_reportes, p_logs_app) ON CONFLICT DO NOTHING;
    END If;
    IF p_logs_sec IS NOT NULL THEN
      INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (r_reportes, p_logs_sec) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

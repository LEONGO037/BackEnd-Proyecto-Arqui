-- ===========================================================================
-- Tablas de Logs — Punto 4 (Seguridad de Sistemas)
--
-- 1) log_aplicacion: eventos críticos de funcionalidad
--    (crear usuario, cambiar rol, crear curso, generar factura, etc.)
--
-- 2) log_seguridad: eventos de seguridad y sesión
--    (login, intentos fallidos, bloqueos, desbloqueos, cierre de sesión,
--     accesos denegados, tokens inválidos)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Log de Aplicación
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Log de Seguridad
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.log_seguridad (
    id              BIGSERIAL PRIMARY KEY,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evento          VARCHAR(60) NOT NULL,
    -- Eventos esperados:
    --   LOGIN_EXITOSO, LOGIN_FALLIDO, LOGIN_BLOQUEADO,
    --   CUENTA_BLOQUEADA, CUENTA_DESBLOQUEADA,
    --   CIERRE_SESION,
    --   TOKEN_INVALIDO, TOKEN_EXPIRADO,
    --   ACCESO_DENEGADO, PERMISO_DENEGADO,
    --   CAMBIO_PASSWORD, RESET_PASSWORD_SOLICITADO,
    --   ACTIVIDAD_SOSPECHOSA
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

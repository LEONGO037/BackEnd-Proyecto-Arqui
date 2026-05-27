-- Migración 006: Limpieza y Optimización de Base de Datos
-- 1. Eliminar la tabla obsoleta y redundante login_log
DROP TABLE IF EXISTS public.login_log CASCADE;

-- 2. Crear índices optimizados para la tabla log_seguridad
CREATE INDEX IF NOT EXISTS idx_log_seguridad_usuario_id ON public.log_seguridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_evento_fecha ON public.log_seguridad(evento, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_log_seguridad_email ON public.log_seguridad(email) WHERE email IS NOT NULL;

-- 3. Crear índices optimizados para la tabla log_aplicacion
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_usuario_id ON public.log_aplicacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_modulo_evento ON public.log_aplicacion(modulo, evento);
CREATE INDEX IF NOT EXISTS idx_log_aplicacion_fecha ON public.log_aplicacion(fecha DESC);

-- 4. Crear índices optimizados para la tabla de auditoría (para mejorar renderizado de diffs)
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON public.auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro ON public.auditoria(tabla_afectada, registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria(fecha DESC);

-- 5. Crear índices para búsquedas y verificaciones de tokens de usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON public.usuarios(token_verificacion) WHERE token_verificacion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_reset_token_hash ON public.usuarios(reset_token_hash) WHERE reset_token_hash IS NOT NULL;

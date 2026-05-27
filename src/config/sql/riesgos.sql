-- ===========================================================================
-- Módulo de Gestión de Riesgos — Punto 5 (Seguridad de Sistemas)
--
-- 3 tablas:
--   1) riesgo_catalogo     — Catálogo de los 15 eventos de riesgo del Excel
--   2) riesgo_registro     — Instancias detectadas (manuales o automáticas)
--   3) riesgo_plan_accion  — Planes de mitigación por registro
--
-- Permisos:
--   - riesgos:ver        (visualizar registros y catálogo)
--   - riesgos:gestionar  (crear, actualizar, cerrar registros y planes)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) Catálogo de riesgos (los 15 eventos del Excel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riesgo_catalogo (
    id                   SERIAL PRIMARY KEY,
    codigo               VARCHAR(10) UNIQUE NOT NULL,
    nombre               VARCHAR(200) NOT NULL,
    descripcion          TEXT,
    por_que_sospechoso   TEXT,
    probabilidad         SMALLINT NOT NULL CHECK (probabilidad BETWEEN 1 AND 3),
    impacto              SMALLINT NOT NULL CHECK (impacto BETWEEN 1 AND 3),
    nivel_riesgo         SMALLINT GENERATED ALWAYS AS (probabilidad * impacto) STORED,
    nivel_categoria      VARCHAR(10) NOT NULL CHECK (nivel_categoria IN ('CRITICO','ALTO','MEDIO','BAJO')),
    quien_detecta        VARCHAR(150),
    control_implementar  TEXT,
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riesgo_catalogo_categoria ON public.riesgo_catalogo(nivel_categoria);
CREATE INDEX IF NOT EXISTS idx_riesgo_catalogo_activo    ON public.riesgo_catalogo(activo);

-- ---------------------------------------------------------------------------
-- 2) Registros de riesgo (instancias detectadas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riesgo_registro (
    id                   BIGSERIAL PRIMARY KEY,
    riesgo_catalogo_id   INTEGER NOT NULL REFERENCES public.riesgo_catalogo(id) ON DELETE RESTRICT,
    fecha_deteccion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origen               VARCHAR(20) NOT NULL DEFAULT 'AUTOMATICO'
                         CHECK (origen IN ('AUTOMATICO','MANUAL')),
    usuario_afectado_id  INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    email_afectado       VARCHAR(150),
    ip                   VARCHAR(64),
    estado               VARCHAR(20) NOT NULL DEFAULT 'DETECTADO'
                         CHECK (estado IN ('DETECTADO','EN_REVISION','MITIGADO','CERRADO','FALSO_POSITIVO')),
    detalle              JSONB DEFAULT '{}'::jsonb,
    detectado_por_id     INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    cerrado_por_id       INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha_cierre         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_riesgo_registro_catalogo  ON public.riesgo_registro(riesgo_catalogo_id);
CREATE INDEX IF NOT EXISTS idx_riesgo_registro_fecha     ON public.riesgo_registro(fecha_deteccion DESC);
CREATE INDEX IF NOT EXISTS idx_riesgo_registro_estado    ON public.riesgo_registro(estado);
CREATE INDEX IF NOT EXISTS idx_riesgo_registro_usuario   ON public.riesgo_registro(usuario_afectado_id);

-- ---------------------------------------------------------------------------
-- 3) Plan de acción por registro de riesgo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riesgo_plan_accion (
    id                   BIGSERIAL PRIMARY KEY,
    riesgo_registro_id   BIGINT NOT NULL REFERENCES public.riesgo_registro(id) ON DELETE CASCADE,
    descripcion          TEXT NOT NULL,
    consecuencias        TEXT,
    responsable_id       INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha_limite         DATE,
    fecha_completado     TIMESTAMPTZ,
    estado               VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                         CHECK (estado IN ('PENDIENTE','EN_PROGRESO','COMPLETADO','CANCELADO')),
    observaciones        TEXT,
    creado_por_id        INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riesgo_plan_registro      ON public.riesgo_plan_accion(riesgo_registro_id);
CREATE INDEX IF NOT EXISTS idx_riesgo_plan_estado        ON public.riesgo_plan_accion(estado);
CREATE INDEX IF NOT EXISTS idx_riesgo_plan_responsable   ON public.riesgo_plan_accion(responsable_id);

-- ===========================================================================
-- SEED: Los 15 eventos del catálogo del Excel
-- ===========================================================================
INSERT INTO public.riesgo_catalogo
    (codigo, nombre, descripcion, por_que_sospechoso, probabilidad, impacto, nivel_categoria, quien_detecta, control_implementar)
VALUES
    -- CRÍTICOS
    ('RC-001', '3+ intentos fallidos de login consecutivos',
     'El usuario o un atacante intenta ingresar más de 3 veces seguidas con credenciales inválidas.',
     'Posible ataque de fuerza bruta contra cuentas de usuario',
     3, 3, 'CRITICO',
     'Sistema de autenticación / Middleware de login',
     'Bloquear cuenta al 3er intento, registrar IP, notificar al admin, activar CAPTCHA'),

    ('RC-002', 'Login exitoso desde país/IP completamente diferente al habitual',
     'Inicio de sesión correcto pero desde una ubicación geográfica/IP distinta a la que el usuario usa normalmente.',
     'Credenciales posiblemente robadas y usadas desde otra ubicación',
     2, 3, 'CRITICO',
     'Sistema de sesiones / Módulo de login',
     'Verificar con 2FA, alertar al usuario por email, registrar evento en log de seguridad'),

    ('RC-003', 'Creación de usuario con rol ADMIN fuera de horario laboral (10pm-6am)',
     'Se crea un usuario con privilegios administrativos en horario inusual.',
     'Posible escalada de privilegios no autorizada',
     2, 3, 'CRITICO',
     'Módulo ABM de usuarios / Log de auditoría',
     'Requerir doble aprobación para roles admin, alertar a todos los admins existentes'),

    ('RC-004', 'Acceso a ruta/endpoint sin los permisos correspondientes',
     'Un usuario intenta acceder a un endpoint para el cual no tiene autorización.',
     'Intento de bypass de autorización o escalada horizontal de privilegios',
     3, 3, 'CRITICO',
     'Middleware de autorización / Matriz de roles',
     'Retornar 403, registrar IP y usuario, bloquear si ocurre 5+ veces en 10 min'),

    -- ALTOS
    ('RC-005', 'Token JWT modificado o expirado siendo reutilizado',
     'Se presenta un token cuya firma no valida o que ya está vencido.',
     'Intento de falsificación de sesión o session hijacking',
     2, 3, 'ALTO',
     'Middleware de validación de tokens',
     'Invalidar token, cerrar sesión forzosamente, registrar intento en log'),

    ('RC-006', 'Cambio de rol de usuario sin seguir el flujo de aprobación',
     'Se modifica el rol de un usuario sin pasar por el proceso de aprobación establecido.',
     'Manipulación directa de permisos, posible insider threat',
     2, 2, 'ALTO',
     'Módulo de gestión de roles',
     'Todo cambio de rol debe pasar por aprobación, registrar quién hizo el cambio y cuándo'),

    ('RC-007', 'Error 500 repetido (+3 veces) en el mismo endpoint en menos de 5 min',
     'El mismo endpoint genera errores 500 múltiples veces en poco tiempo.',
     'Posible vulnerabilidad siendo explotada activamente',
     2, 3, 'ALTO',
     'Manejador global de excepciones',
     'Alertar a dev team, revisar logs del endpoint, considerar deshabilitar temporalmente'),

    ('RC-008', 'Upload de archivo con extensión ejecutable (.php, .exe, .sh, .py)',
     'Un usuario intenta subir archivos con extensiones potencialmente peligrosas.',
     'Posible intento de subir webshell o malware al servidor',
     2, 3, 'ALTO',
     'Módulo de carga de archivos',
     'Rechazar extensiones peligrosas, validar MIME type real, escanear con antivirus'),

    ('RC-009', 'Más de 100 peticiones al mismo endpoint en menos de 1 minuto',
     'Un mismo origen genera un volumen inusualmente alto de peticiones.',
     'Posible ataque DDoS, scraping masivo o fuzzing de parámetros',
     2, 2, 'ALTO',
     'Rate limiter / API Gateway',
     'Implementar rate limiting, bloquear IP temporalmente, registrar en log'),

    -- MEDIOS
    ('RC-010', 'Usuario inactivo por 6+ meses que inicia sesión repentinamente',
     'Una cuenta sin actividad reciente se reactiva sin previo aviso.',
     'Cuenta zombie reactivada, posible uso de credenciales antiguas filtradas',
     2, 2, 'MEDIO',
     'Sistema de autenticación / Gestión de sesiones',
     'Forzar cambio de contraseña, verificar identidad, revisar actividad previa'),

    ('RC-011', 'Descarga masiva de registros (+50 registros) en una sola petición',
     'Un usuario solicita una cantidad anormalmente grande de registros.',
     'Posible exfiltración de datos de la base de datos',
     2, 2, 'MEDIO',
     'Controladores de listado / API de datos',
     'Limitar resultados por página, requerir permisos especiales para exportación masiva'),

    ('RC-012', 'Múltiples cambios de perfil en menos de 2 minutos',
     'Un mismo usuario modifica su perfil varias veces en muy poco tiempo.',
     'Comportamiento automatizado o script modificando datos',
     1, 2, 'MEDIO',
     'Módulo de gestión de perfil',
     'Cooldown entre cambios, CAPTCHA si se detecta patrón automatizado'),

    ('RC-013', 'Sesión activa por más de 8 horas sin actividad',
     'Un token válido sigue activo después de muchas horas sin uso.',
     'Token no invalidado, posible sesión abandonada en equipo compartido',
     2, 2, 'MEDIO',
     'Middleware de sesiones',
     'Timeout automático de sesión, invalidar token después de X minutos de inactividad'),

    -- BAJOS
    ('RC-014', 'Login exitoso a las 3am - 5am',
     'Inicio de sesión correcto pero en horario poco común.',
     'Inusual pero no necesariamente malicioso, se monitorea',
     1, 1, 'BAJO',
     'Sistema de autenticación',
     'Registrar en log, generar alerta baja, revisar si se repite el patrón'),

    ('RC-015', 'Cambio de contraseña sin solicitud previa del usuario',
     'Se modifica la contraseña sin que el usuario haya solicitado un reset.',
     'Puede indicar que alguien más tiene acceso a la cuenta',
     1, 2, 'BAJO',
     'Módulo de gestión de contraseñas',
     'Notificar al usuario por email/SMS, ofrecer opción de revertir y bloquear')
ON CONFLICT (codigo) DO NOTHING;

-- ===========================================================================
-- Permisos nuevos
-- ===========================================================================
INSERT INTO public.permisos (nombre, descripcion)
VALUES
    ('riesgos:ver',       'Ver el catálogo de riesgos y los registros detectados'),
    ('riesgos:gestionar', 'Crear, actualizar y cerrar registros y planes de acción de riesgos')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar permisos a los roles que deben tener acceso al módulo de riesgos:
--   - ADMINISTRADOR    → super-admin con acceso total
--   - ADMIN_SEGURIDAD  → rol especializado en seguridad (responsable natural)
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permisos p
WHERE r.nombre IN ('ADMINISTRADOR', 'ADMIN_SEGURIDAD')
  AND p.nombre IN ('riesgos:ver','riesgos:gestionar')
ON CONFLICT DO NOTHING;

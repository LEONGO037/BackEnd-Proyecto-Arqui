-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.auditoria (
  id integer NOT NULL DEFAULT nextval('auditoria_id_seq'::regclass),
  usuario_id integer,
  accion character varying,
  tabla_afectada character varying,
  registro_id integer,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  detalle jsonb,
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.certificados (
  id integer NOT NULL DEFAULT nextval('certificados_id_seq'::regclass),
  estudiante_curso_id integer,
  codigo_certificado character varying NOT NULL UNIQUE,
  fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  archivo_url text,
  CONSTRAINT certificados_pkey PRIMARY KEY (id),
  CONSTRAINT certificados_estudiante_curso_id_fkey FOREIGN KEY (estudiante_curso_id) REFERENCES public.estudiante_curso(id)
);
CREATE TABLE public.curso_prerrequisitos (
  id integer NOT NULL DEFAULT nextval('curso_prerrequisitos_id_seq'::regclass),
  curso_id integer,
  curso_prerrequisito_id integer,
  CONSTRAINT curso_prerrequisitos_pkey PRIMARY KEY (id),
  CONSTRAINT curso_prerrequisitos_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id),
  CONSTRAINT curso_prerrequisitos_curso_prerrequisito_id_fkey FOREIGN KEY (curso_prerrequisito_id) REFERENCES public.cursos(id)
);
CREATE TABLE public.cursos (
  id integer NOT NULL DEFAULT nextval('cursos_id_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion text,
  costo numeric NOT NULL,
  cupo_maximo integer,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  minimo_estudiantes integer NOT NULL DEFAULT 1,
  CONSTRAINT cursos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.docente_curso (
  id integer NOT NULL DEFAULT nextval('docente_curso_id_seq'::regclass),
  usuario_id integer NOT NULL,
  curso_id integer NOT NULL,
  fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  estado character varying DEFAULT 'NO_ACTIVO'::character varying,
  CONSTRAINT docente_curso_pkey PRIMARY KEY (id),
  CONSTRAINT docente_curso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT docente_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id)
);
CREATE TABLE public.estudiante_curso (
  id integer NOT NULL DEFAULT nextval('estudiante_curso_id_seq'::regclass),
  estudiante_id integer,
  curso_id integer,
  inscripcion_id integer,
  estado_academico character varying DEFAULT 'ACTIVO'::character varying,
  nota_final numeric CHECK (nota_final >= 0::numeric AND nota_final <= 100::numeric),
  asistencia_porcentaje numeric CHECK (asistencia_porcentaje >= 0::numeric AND asistencia_porcentaje <= 100::numeric),
  fecha_inicio date,
  fecha_fin date,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT estudiante_curso_pkey PRIMARY KEY (id),
  CONSTRAINT estudiante_curso_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.usuarios(id),
  CONSTRAINT estudiante_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id),
  CONSTRAINT estudiante_curso_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id)
);
CREATE TABLE public.facturas (
  id integer NOT NULL DEFAULT nextval('facturas_id_seq'::regclass),
  pago_id integer,
  codigo_factura character varying NOT NULL UNIQUE,
  nit integer NOT NULL,
  razon_social character varying,
  fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  archivo_url text,
  CONSTRAINT facturas_pkey PRIMARY KEY (id),
  CONSTRAINT facturas_pago_id_fkey FOREIGN KEY (pago_id) REFERENCES public.pagos(id)
);
CREATE TABLE public.historial_passwords (
  id integer NOT NULL DEFAULT nextval('historial_passwords_id_seq'::regclass),
  usuario_id integer NOT NULL,
  password_hash text NOT NULL,
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT historial_passwords_pkey PRIMARY KEY (id),
  CONSTRAINT historial_passwords_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.inscripcion_detalle (
  id integer NOT NULL DEFAULT nextval('inscripcion_detalle_id_seq'::regclass),
  inscripcion_id integer,
  curso_id integer,
  precio_unitario numeric NOT NULL,
  CONSTRAINT inscripcion_detalle_pkey PRIMARY KEY (id),
  CONSTRAINT inscripcion_detalle_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id),
  CONSTRAINT inscripcion_detalle_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id)
);
CREATE TABLE public.inscripciones (
  id integer NOT NULL DEFAULT nextval('inscripciones_id_seq'::regclass),
  estudiante_id integer,
  estado character varying DEFAULT 'PENDIENTE'::character varying,
  total numeric,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT inscripciones_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.log_aplicacion (
  id bigint NOT NULL DEFAULT nextval('log_aplicacion_id_seq'::regclass),
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  nivel character varying NOT NULL CHECK (nivel::text = ANY (ARRAY['INFO'::character varying, 'WARN'::character varying, 'ERROR'::character varying]::text[])),
  modulo character varying NOT NULL,
  evento character varying NOT NULL,
  mensaje text,
  usuario_id integer,
  detalle jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT log_aplicacion_pkey PRIMARY KEY (id),
  CONSTRAINT log_aplicacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.log_seguridad (
  id bigint NOT NULL DEFAULT nextval('log_seguridad_id_seq'::regclass),
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  evento character varying NOT NULL,
  exito boolean NOT NULL DEFAULT false,
  usuario_id integer,
  email character varying,
  ip character varying,
  user_agent text,
  ruta character varying,
  metodo character varying,
  detalle jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT log_seguridad_pkey PRIMARY KEY (id),
  CONSTRAINT log_seguridad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.login_log (
  id integer NOT NULL DEFAULT nextval('login_log_id_seq'::regclass),
  usuario_id integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_log_pkey PRIMARY KEY (id),
  CONSTRAINT login_log_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.metodos_pago (
  id integer NOT NULL DEFAULT nextval('metodos_pago_id_seq'::regclass),
  nombre character varying NOT NULL,
  CONSTRAINT metodos_pago_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pagos (
  id integer NOT NULL DEFAULT nextval('pagos_id_seq'::regclass),
  inscripcion_id integer,
  metodo_pago_id integer,
  monto numeric NOT NULL,
  estado character varying DEFAULT 'PENDIENTE'::character varying,
  referencia character varying,
  fecha_pago timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id),
  CONSTRAINT pagos_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id)
);
CREATE TABLE public.permisos (
  id integer NOT NULL DEFAULT nextval('permisos_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permisos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.riesgo_catalogo (
  id integer NOT NULL DEFAULT nextval('riesgo_catalogo_id_seq'::regclass),
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  descripcion text,
  por_que_sospechoso text,
  probabilidad smallint NOT NULL CHECK (probabilidad >= 1 AND probabilidad <= 3),
  impacto smallint NOT NULL CHECK (impacto >= 1 AND impacto <= 3),
  nivel_riesgo smallint DEFAULT (probabilidad * impacto),
  nivel_categoria character varying NOT NULL CHECK (nivel_categoria::text = ANY (ARRAY['CRITICO'::character varying, 'ALTO'::character varying, 'MEDIO'::character varying, 'BAJO'::character varying]::text[])),
  quien_detecta character varying,
  control_implementar text,
  activo boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT riesgo_catalogo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.riesgo_plan_accion (
  id bigint NOT NULL DEFAULT nextval('riesgo_plan_accion_id_seq'::regclass),
  riesgo_registro_id bigint NOT NULL,
  descripcion text NOT NULL,
  consecuencias text,
  responsable_id integer,
  fecha_limite date,
  fecha_completado timestamp with time zone,
  estado character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'EN_PROGRESO'::character varying, 'COMPLETADO'::character varying, 'CANCELADO'::character varying]::text[])),
  observaciones text,
  creado_por_id integer,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT riesgo_plan_accion_pkey PRIMARY KEY (id),
  CONSTRAINT riesgo_plan_accion_riesgo_registro_id_fkey FOREIGN KEY (riesgo_registro_id) REFERENCES public.riesgo_registro(id),
  CONSTRAINT riesgo_plan_accion_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.usuarios(id),
  CONSTRAINT riesgo_plan_accion_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.riesgo_registro (
  id bigint NOT NULL DEFAULT nextval('riesgo_registro_id_seq'::regclass),
  riesgo_catalogo_id integer NOT NULL,
  fecha_deteccion timestamp with time zone NOT NULL DEFAULT now(),
  origen character varying NOT NULL DEFAULT 'AUTOMATICO'::character varying CHECK (origen::text = ANY (ARRAY['AUTOMATICO'::character varying, 'MANUAL'::character varying]::text[])),
  usuario_afectado_id integer,
  email_afectado character varying,
  ip character varying,
  estado character varying NOT NULL DEFAULT 'DETECTADO'::character varying CHECK (estado::text = ANY (ARRAY['DETECTADO'::character varying, 'EN_REVISION'::character varying, 'MITIGADO'::character varying, 'CERRADO'::character varying, 'FALSO_POSITIVO'::character varying]::text[])),
  detalle jsonb DEFAULT '{}'::jsonb,
  detectado_por_id integer,
  cerrado_por_id integer,
  fecha_cierre timestamp with time zone,
  CONSTRAINT riesgo_registro_pkey PRIMARY KEY (id),
  CONSTRAINT riesgo_registro_riesgo_catalogo_id_fkey FOREIGN KEY (riesgo_catalogo_id) REFERENCES public.riesgo_catalogo(id),
  CONSTRAINT riesgo_registro_usuario_afectado_id_fkey FOREIGN KEY (usuario_afectado_id) REFERENCES public.usuarios(id),
  CONSTRAINT riesgo_registro_detectado_por_id_fkey FOREIGN KEY (detectado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT riesgo_registro_cerrado_por_id_fkey FOREIGN KEY (cerrado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.rol_permisos (
  rol_id integer NOT NULL,
  permiso_id integer NOT NULL,
  CONSTRAINT rol_permisos_pkey PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT rol_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id),
  CONSTRAINT rol_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  activo boolean DEFAULT true,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sincronizaciones (
  id integer NOT NULL DEFAULT nextval('sincronizaciones_id_seq'::regclass),
  tipo character varying,
  estado character varying,
  fecha_intento timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  mensaje_error text,
  CONSTRAINT sincronizaciones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  nombre character varying NOT NULL,
  apellido_paterno character varying NOT NULL,
  apellido_materno character varying,
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  rol_id integer,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  email_verificado boolean DEFAULT false,
  token_verificacion character varying,
  token_verificacion_expira timestamp with time zone,
  intentos_fallidos integer DEFAULT 0,
  bloqueado_hasta timestamp with time zone,
  password_cambiado_en timestamp with time zone DEFAULT now(),
  reset_token_hash character varying,
  reset_token_expira timestamp with time zone,
  debe_cambiar_password boolean DEFAULT false,
  codigo_verificacion character varying,
  codigo_verificacion_expira timestamp with time zone,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id)
);
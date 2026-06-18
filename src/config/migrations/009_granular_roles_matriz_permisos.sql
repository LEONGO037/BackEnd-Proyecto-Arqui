-- 009_granular_roles_matriz_permisos.sql
-- Segregación CRUD de Roles y Matriz de Riesgos
-- ACTION NEEDED: run in Supabase SQL editor

BEGIN;

-- ── 1. Nuevos permisos granulares ─────────────────────────────────────────────
INSERT INTO public.permisos (nombre, descripcion, activo) VALUES
  ('roles:ver',       'Ver el listado de roles y sus permisos asignados. Solo lectura.',              true),
  ('roles:crear',     'Crear nuevos roles en el sistema.',                                            true),
  ('roles:modificar', 'Modificar roles existentes: editar nombre, descripción y asignar permisos.',  true),
  ('roles:eliminar',  'Eliminar (desactivar) roles del sistema.',                                     true),
  ('matriz:ver',      'Ver la matriz de análisis de riesgos de seguridad. Solo lectura.',             true),
  ('matriz:agregar',  'Agregar nuevos activos de información y amenazas a la matriz de riesgos.',     true),
  ('matriz:editar',   'Editar activos e identificaciones de riesgos existentes en la matriz.',        true),
  ('matriz:eliminar', 'Eliminar activos de información de la matriz de riesgos.',                     true)
ON CONFLICT (nombre) DO NOTHING;

-- ── 2. Asignar roles:* a roles que ya tienen roles:gestionar ──────────────────
DO $$
DECLARE
  v_rol_id  INTEGER;
  p_ver     INTEGER;
  p_crear   INTEGER;
  p_mod     INTEGER;
  p_del     INTEGER;
BEGIN
  SELECT id INTO p_ver   FROM public.permisos WHERE nombre = 'roles:ver';
  SELECT id INTO p_crear FROM public.permisos WHERE nombre = 'roles:crear';
  SELECT id INTO p_mod   FROM public.permisos WHERE nombre = 'roles:modificar';
  SELECT id INTO p_del   FROM public.permisos WHERE nombre = 'roles:eliminar';

  FOR v_rol_id IN
    SELECT rp.rol_id
    FROM public.rol_permisos rp
    JOIN public.permisos p ON p.id = rp.permiso_id
    WHERE p.nombre = 'roles:gestionar'
  LOOP
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_ver)   ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_crear) ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_mod)   ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_del)   ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── 3. Asignar matriz:* a roles que ya tienen riesgos:gestionar ───────────────
DO $$
DECLARE
  v_rol_id  INTEGER;
  p_ver     INTEGER;
  p_agr     INTEGER;
  p_edit    INTEGER;
  p_del     INTEGER;
BEGIN
  SELECT id INTO p_ver  FROM public.permisos WHERE nombre = 'matriz:ver';
  SELECT id INTO p_agr  FROM public.permisos WHERE nombre = 'matriz:agregar';
  SELECT id INTO p_edit FROM public.permisos WHERE nombre = 'matriz:editar';
  SELECT id INTO p_del  FROM public.permisos WHERE nombre = 'matriz:eliminar';

  FOR v_rol_id IN
    SELECT rp.rol_id
    FROM public.rol_permisos rp
    JOIN public.permisos p ON p.id = rp.permiso_id
    WHERE p.nombre = 'riesgos:gestionar'
  LOOP
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_ver)  ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_agr)  ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_edit) ON CONFLICT DO NOTHING;
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_del)  ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── 4. Asignar matriz:ver a roles que solo tienen riesgos:ver ─────────────────
DO $$
DECLARE
  v_rol_id INTEGER;
  p_ver    INTEGER;
BEGIN
  SELECT id INTO p_ver FROM public.permisos WHERE nombre = 'matriz:ver';

  FOR v_rol_id IN
    SELECT rp.rol_id
    FROM public.rol_permisos rp
    JOIN public.permisos p ON p.id = rp.permiso_id
    WHERE p.nombre = 'riesgos:ver'
  LOOP
    INSERT INTO public.rol_permisos (rol_id, permiso_id) VALUES (v_rol_id, p_ver) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;

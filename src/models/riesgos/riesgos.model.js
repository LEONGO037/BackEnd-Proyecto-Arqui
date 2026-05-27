import pool from "../../config/db.js";

// ===========================================================================
// Modelo del Módulo de Gestión de Riesgos
//
// Tres entidades:
//   - riesgo_catalogo     → master data (los 15 eventos del Excel)
//   - riesgo_registro     → instancias detectadas
//   - riesgo_plan_accion  → planes de mitigación
// ===========================================================================

// ───── CATÁLOGO ────────────────────────────────────────────────────────────

export const listarCatalogo = async ({ categoria = null, activo = true } = {}) => {
    const params = [activo];
    let where = "WHERE activo = $1";
    if (categoria) {
        params.push(categoria);
        where += ` AND nivel_categoria = $${params.length}`;
    }
    const { rows } = await pool.query(
        `SELECT id, codigo, nombre, descripcion, por_que_sospechoso,
                probabilidad, impacto, nivel_riesgo, nivel_categoria,
                quien_detecta, control_implementar, activo, fecha_creacion
           FROM public.riesgo_catalogo
           ${where}
       ORDER BY nivel_riesgo DESC, codigo ASC`,
        params
    );
    return rows;
};

export const obtenerCatalogoPorCodigo = async (codigo) => {
    const { rows } = await pool.query(
        `SELECT id, codigo, nombre, nivel_categoria, nivel_riesgo
           FROM public.riesgo_catalogo
          WHERE codigo = $1 AND activo = TRUE`,
        [codigo]
    );
    return rows[0] || null;
};

export const obtenerCatalogoPorId = async (id) => {
    const { rows } = await pool.query(
        `SELECT * FROM public.riesgo_catalogo WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
};

// ───── REGISTROS ───────────────────────────────────────────────────────────

export const crearRegistro = async ({
    riesgo_catalogo_id,
    origen = "MANUAL",
    usuario_afectado_id = null,
    email_afectado = null,
    ip = null,
    detalle = {},
    detectado_por_id = null,
}) => {
    const { rows } = await pool.query(
        `INSERT INTO public.riesgo_registro
            (riesgo_catalogo_id, origen, usuario_afectado_id, email_afectado, ip, detalle, detectado_por_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [riesgo_catalogo_id, origen, usuario_afectado_id, email_afectado, ip, detalle, detectado_por_id]
    );
    return rows[0];
};

export const listarRegistros = async ({
    estado = null,
    categoria = null,
    desde = null,
    hasta = null,
    limite = 100,
} = {}) => {
    const params = [];
    let where = "WHERE 1=1";

    if (estado) {
        params.push(estado);
        where += ` AND rr.estado = $${params.length}`;
    }
    if (categoria) {
        params.push(categoria);
        where += ` AND rc.nivel_categoria = $${params.length}`;
    }
    if (desde) {
        params.push(desde);
        where += ` AND rr.fecha_deteccion >= $${params.length}`;
    }
    if (hasta) {
        params.push(hasta);
        where += ` AND rr.fecha_deteccion <= $${params.length}`;
    }
    params.push(Math.min(Number(limite) || 100, 500));

    const { rows } = await pool.query(
        `SELECT rr.id, rr.fecha_deteccion, rr.origen, rr.email_afectado, rr.ip,
                rr.estado, rr.detalle, rr.fecha_cierre,
                rc.codigo AS catalogo_codigo,
                rc.nombre AS catalogo_nombre,
                rc.nivel_categoria,
                rc.nivel_riesgo,
                u.email AS usuario_afectado_email
           FROM public.riesgo_registro rr
           JOIN public.riesgo_catalogo rc ON rc.id = rr.riesgo_catalogo_id
      LEFT JOIN public.usuarios u ON u.id = rr.usuario_afectado_id
           ${where}
       ORDER BY rr.fecha_deteccion DESC
          LIMIT $${params.length}`,
        params
    );
    return rows;
};

export const obtenerRegistroPorId = async (id) => {
    const { rows: registros } = await pool.query(
        `SELECT rr.*, rc.codigo AS catalogo_codigo, rc.nombre AS catalogo_nombre,
                rc.descripcion AS catalogo_descripcion,
                rc.por_que_sospechoso, rc.nivel_categoria, rc.nivel_riesgo,
                rc.quien_detecta, rc.control_implementar,
                u.email AS usuario_afectado_email,
                d.email AS detectado_por_email,
                c.email AS cerrado_por_email
           FROM public.riesgo_registro rr
           JOIN public.riesgo_catalogo rc ON rc.id = rr.riesgo_catalogo_id
      LEFT JOIN public.usuarios u ON u.id = rr.usuario_afectado_id
      LEFT JOIN public.usuarios d ON d.id = rr.detectado_por_id
      LEFT JOIN public.usuarios c ON c.id = rr.cerrado_por_id
          WHERE rr.id = $1`,
        [id]
    );
    if (!registros[0]) return null;

    const { rows: planes } = await pool.query(
        `SELECT pa.*, u.email AS responsable_email
           FROM public.riesgo_plan_accion pa
      LEFT JOIN public.usuarios u ON u.id = pa.responsable_id
          WHERE pa.riesgo_registro_id = $1
       ORDER BY pa.fecha_creacion DESC`,
        [id]
    );

    return { ...registros[0], planes };
};

export const actualizarEstadoRegistro = async (id, estado, usuario_id) => {
    const cerrado = ["MITIGADO", "CERRADO", "FALSO_POSITIVO"].includes(estado);
    const { rows } = await pool.query(
        `UPDATE public.riesgo_registro
            SET estado = $1,
                cerrado_por_id = CASE WHEN $2::boolean THEN $3 ELSE cerrado_por_id END,
                fecha_cierre   = CASE WHEN $2::boolean THEN NOW() ELSE fecha_cierre END
          WHERE id = $4
      RETURNING *`,
        [estado, cerrado, usuario_id, id]
    );
    return rows[0] || null;
};

// Evita duplicados: si ya hay un registro DETECTADO/EN_REVISION del mismo
// catálogo + usuario en la ventana indicada, retorna ese en lugar de crear otro.
export const existeRegistroReciente = async ({
    riesgo_catalogo_id,
    usuario_afectado_id,
    email_afectado,
    ip,
    ventanaMinutos = 5,
}) => {
    const { rows } = await pool.query(
        `SELECT id
           FROM public.riesgo_registro
          WHERE riesgo_catalogo_id = $1
            AND estado IN ('DETECTADO','EN_REVISION')
            AND fecha_deteccion >= NOW() - ($2::int * INTERVAL '1 minute')
            AND (
                  ($3::int IS NOT NULL AND usuario_afectado_id = $3)
               OR ($4::text IS NOT NULL AND email_afectado = $4)
               OR ($5::text IS NOT NULL AND ip = $5)
            )
       ORDER BY fecha_deteccion DESC
          LIMIT 1`,
        [riesgo_catalogo_id, ventanaMinutos, usuario_afectado_id, email_afectado, ip]
    );
    return rows[0] || null;
};

// ───── PLANES DE ACCIÓN ────────────────────────────────────────────────────

export const crearPlanAccion = async ({
    riesgo_registro_id,
    descripcion,
    consecuencias = null,
    responsable_id = null,
    fecha_limite = null,
    creado_por_id = null,
}) => {
    const { rows } = await pool.query(
        `INSERT INTO public.riesgo_plan_accion
            (riesgo_registro_id, descripcion, consecuencias, responsable_id, fecha_limite, creado_por_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [riesgo_registro_id, descripcion, consecuencias, responsable_id, fecha_limite, creado_por_id]
    );
    return rows[0];
};

export const actualizarPlanAccion = async (id, { estado, observaciones, fecha_completado }) => {
    const completar = estado === "COMPLETADO";
    const { rows } = await pool.query(
        `UPDATE public.riesgo_plan_accion
            SET estado          = COALESCE($1, estado),
                observaciones   = COALESCE($2, observaciones),
                fecha_completado = CASE WHEN $3::boolean THEN COALESCE($4::timestamptz, NOW()) ELSE fecha_completado END
          WHERE id = $5
      RETURNING *`,
        [estado, observaciones, completar, fecha_completado, id]
    );
    return rows[0] || null;
};

// ───── DASHBOARD / ESTADÍSTICAS ────────────────────────────────────────────

export const obtenerResumen = async () => {
    const { rows: porCategoria } = await pool.query(
        `SELECT rc.nivel_categoria,
                COUNT(rr.id)::int AS total,
                COUNT(*) FILTER (WHERE rr.estado IN ('DETECTADO','EN_REVISION'))::int AS abiertos,
                COUNT(*) FILTER (WHERE rr.estado IN ('MITIGADO','CERRADO','FALSO_POSITIVO'))::int AS cerrados
           FROM public.riesgo_catalogo rc
      LEFT JOIN public.riesgo_registro rr ON rr.riesgo_catalogo_id = rc.id
          WHERE rc.activo = TRUE
       GROUP BY rc.nivel_categoria
       ORDER BY CASE rc.nivel_categoria
                  WHEN 'CRITICO' THEN 1
                  WHEN 'ALTO'    THEN 2
                  WHEN 'MEDIO'   THEN 3
                  WHEN 'BAJO'    THEN 4
                END`
    );

    const { rows: ultimos } = await pool.query(
        `SELECT rr.id, rr.fecha_deteccion, rr.estado, rr.email_afectado, rr.ip,
                rc.codigo, rc.nombre, rc.nivel_categoria
           FROM public.riesgo_registro rr
           JOIN public.riesgo_catalogo rc ON rc.id = rr.riesgo_catalogo_id
       ORDER BY rr.fecha_deteccion DESC
          LIMIT 10`
    );

    const { rows: planesPendientes } = await pool.query(
        `SELECT COUNT(*)::int AS total
           FROM public.riesgo_plan_accion
          WHERE estado IN ('PENDIENTE','EN_PROGRESO')`
    );

    return {
        por_categoria: porCategoria,
        ultimos_registros: ultimos,
        planes_pendientes: planesPendientes[0]?.total ?? 0,
    };
};

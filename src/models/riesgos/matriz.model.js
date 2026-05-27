import pool from "../../config/db.js";

// ===========================================================================
// Modelo de persistencia para la Matriz de Análisis de Riesgos
// ===========================================================================

export const listarMatriz = async () => {
    const { rows } = await pool.query(
        `SELECT * FROM public.riesgos_matriz ORDER BY id ASC`
    );
    return rows;
};

export const obtenerMatrizPorId = async (id) => {
    const { rows } = await pool.query(
        `SELECT * FROM public.riesgos_matriz WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
};

export const crearItemMatriz = async ({
    activo_informacion,
    amenaza_vulnerabilidad,
    consecuencia_riesgo,
    probabilidad_inherente,
    impacto_inherente,
    riesgo_inherente,
    nivel_riesgo_inherente,
    tratamiento_riesgo,
    controles_implementar,
    control_tipo,
    control_nivel,
    control_frecuencia,
    probabilidad_residual,
    impacto_residual,
    riesgo_residual,
    nivel_riesgo_residual,
    responsable_nombre = null,
}) => {
    const { rows } = await pool.query(
        `INSERT INTO public.riesgos_matriz (
            activo_informacion, amenaza_vulnerabilidad, consecuencia_riesgo,
            probabilidad_inherente, impacto_inherente, riesgo_inherente, nivel_riesgo_inherente,
            tratamiento_riesgo, controles_implementar, control_tipo, control_nivel, control_frecuencia,
            probabilidad_residual, impacto_residual, riesgo_residual, nivel_riesgo_residual,
            responsable_nombre
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [
            activo_informacion,
            amenaza_vulnerabilidad,
            consecuencia_riesgo,
            probabilidad_inherente,
            impacto_inherente,
            riesgo_inherente,
            nivel_riesgo_inherente,
            tratamiento_riesgo,
            controles_implementar,
            control_tipo,
            control_nivel,
            control_frecuencia,
            probabilidad_residual,
            impacto_residual,
            riesgo_residual,
            nivel_riesgo_residual,
            responsable_nombre,
        ]
    );
    return rows[0];
};

export const actualizarItemMatriz = async (id, {
    activo_informacion,
    amenaza_vulnerabilidad,
    consecuencia_riesgo,
    probabilidad_inherente,
    impacto_inherente,
    riesgo_inherente,
    nivel_riesgo_inherente,
    tratamiento_riesgo,
    controles_implementar,
    control_tipo,
    control_nivel,
    control_frecuencia,
    probabilidad_residual,
    impacto_residual,
    riesgo_residual,
    nivel_riesgo_residual,
    responsable_nombre,
}) => {
    const { rows } = await pool.query(
        `UPDATE public.riesgos_matriz
            SET activo_informacion = COALESCE($1, activo_informacion),
                amenaza_vulnerabilidad = COALESCE($2, amenaza_vulnerabilidad),
                consecuencia_riesgo = COALESCE($3, consecuencia_riesgo),
                probabilidad_inherente = COALESCE($4, probabilidad_inherente),
                impacto_inherente = COALESCE($5, impacto_inherente),
                riesgo_inherente = COALESCE($6, riesgo_inherente),
                nivel_riesgo_inherente = COALESCE($7, nivel_riesgo_inherente),
                tratamiento_riesgo = COALESCE($8, tratamiento_riesgo),
                controles_implementar = COALESCE($9, controles_implementar),
                control_tipo = COALESCE($10, control_tipo),
                control_nivel = COALESCE($11, control_nivel),
                control_frecuencia = COALESCE($12, control_frecuencia),
                probabilidad_residual = COALESCE($13, probabilidad_residual),
                impacto_residual = COALESCE($14, impacto_residual),
                riesgo_residual = COALESCE($15, riesgo_residual),
                nivel_riesgo_residual = COALESCE($16, nivel_riesgo_residual),
                responsable_nombre = COALESCE($17, responsable_nombre)
          WHERE id = $18
      RETURNING *`,
        [
            activo_informacion,
            amenaza_vulnerabilidad,
            consecuencia_riesgo,
            probabilidad_inherente,
            impacto_inherente,
            riesgo_inherente,
            nivel_riesgo_inherente,
            tratamiento_riesgo,
            controles_implementar,
            control_tipo,
            control_nivel,
            control_frecuencia,
            probabilidad_residual,
            impacto_residual,
            riesgo_residual,
            nivel_riesgo_residual,
            responsable_nombre,
            id,
        ]
    );
    return rows[0] || null;
};

export const eliminarItemMatriz = async (id) => {
    const { rowCount } = await pool.query(
        `DELETE FROM public.riesgos_matriz WHERE id = $1`,
        [id]
    );
    return rowCount > 0;
};

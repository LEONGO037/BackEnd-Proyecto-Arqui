import pool from "../../config/db.js";

// ===========================================================================
// Modelo de persistencia para la Matriz de Análisis de Riesgos (Granular JSONB)
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
    amenazas = [],
}) => {
    const { rows } = await pool.query(
        `INSERT INTO public.riesgos_matriz (
            activo_informacion, amenazas
         ) VALUES ($1, $2)
         RETURNING *`,
        [activo_informacion, JSON.stringify(amenazas)]
    );
    return rows[0];
};

export const actualizarItemMatriz = async (id, {
    activo_informacion,
    amenazas,
}) => {
    const { rows } = await pool.query(
        `UPDATE public.riesgos_matriz
            SET activo_informacion = COALESCE($1, activo_informacion),
                amenazas = COALESCE($2, amenazas)
          WHERE id = $3
      RETURNING *`,
        [activo_informacion, JSON.stringify(amenazas), id]
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

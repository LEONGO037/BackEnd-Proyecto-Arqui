import pool from "../../config/db.js";

export const CursosModel = {
    /**
     * Obtiene todos los cursos activos.
     */
    getAll: async () => {
        const { rows } = await pool.query(
            `SELECT id, nombre, descripcion, costo, cupo_maximo FROM public.cursos WHERE activo = true ORDER BY id`
        );
        return rows;
    },

    /**
     * Crea un nuevo curso y sus prerrequisitos en una transacción.
     */
    create: async (datos) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const { nombre, descripcion, costo, cupo_maximo, prerrequisitos = [] } = datos;

            // 1. Insertar el curso
            const queryCurso = `
        INSERT INTO public.cursos (nombre, descripcion, costo, cupo_maximo)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
            const valuesCurso = [nombre, descripcion, costo, cupo_maximo];
            const { rows: rowsCurso } = await client.query(queryCurso, valuesCurso);
            const cursoCreado = rowsCurso[0];

            // 2. Insertar prerrequisitos si existen
            if (prerrequisitos && prerrequisitos.length > 0) {
                const queryPrerrequisito = `
          INSERT INTO public.curso_prerrequisitos (curso_id, curso_prerrequisito_id)
          VALUES ($1, $2);
        `;
                for (const idPrerrequisito of prerrequisitos) {
                    await client.query(queryPrerrequisito, [cursoCreado.id, idPrerrequisito]);
                }
            }

            await client.query("COMMIT");
            return cursoCreado;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },
    /**
     * Obtiene los cursos que no tienen un docente asignado.
     */
    getCursosSinDocente: async () => {
        const query = `
            SELECT c.id, c.nombre, c.descripcion, c.costo, c.cupo_maximo
            FROM public.cursos c
            LEFT JOIN public.docente_curso dc ON c.id = dc.curso_id
            WHERE dc.curso_id IS NULL AND c.activo = true
            ORDER BY c.id;
        `;
        const { rows } = await pool.query(query);
        return rows;
    },
   validarPrerrequisitos: async (estudiante_id, curso_id) => {

    const prerreq = await pool.query(
        `SELECT cp.curso_prerrequisito_id, c.nombre
         FROM public.curso_prerrequisitos cp
         JOIN public.cursos c
           ON c.id = cp.curso_prerrequisito_id
         WHERE cp.curso_id = $1`,
        [curso_id]
    );

    if (prerreq.rows.length === 0) {
        return { permitido: true };
    }

    for (const pr of prerreq.rows) {

        const aprobado = await pool.query(
            `SELECT nota_final
             FROM public.estudiante_curso
             WHERE estudiante_id = $1
             AND curso_id = $2
             AND nota_final >= 51`,
            [estudiante_id, pr.curso_prerrequisito_id]
        );

        if (aprobado.rows.length === 0) {
            return {
                permitido: false,
                curso_faltante: pr.nombre
            };
        }
    }

    return { permitido: true };
},
};


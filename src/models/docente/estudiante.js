import pool from "../../config/db.js";

export const obtenerEstudiantesCurso = async (docente_id, curso_id) => {

  const resultado = await pool.query(
    `SELECT 
        u.id,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.ci_nit,
        ec.nota_final
     FROM estudiante_curso ec
     JOIN usuarios u ON u.id = ec.estudiante_id
     JOIN docente_curso dc ON dc.curso_id = ec.curso_id
     WHERE dc.usuario_id = $1
     AND dc.curso_id = $2`,
    [docente_id, curso_id]
  );

  return resultado.rows;
};

export const actualizarNotaFinal = async (
  docente_id,
  estudiante_id,
  curso_id,
  nota
) => {

  const resultado = await pool.query(
    `UPDATE estudiante_curso ec
     SET nota_final = $1
     FROM docente_curso dc
     WHERE ec.estudiante_id = $2
     AND ec.curso_id = $3
     AND dc.usuario_id = $4
     AND dc.curso_id = ec.curso_id
      RETURNING 
     ec.estudiante_id,
     ec.curso_id,
     ec.nota_final`,
  [nota, estudiante_id, curso_id, docente_id]
  );

  return resultado.rows[0];
};
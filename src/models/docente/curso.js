import pool from "../../config/db.js";

export const obtenerCursosPorDocente = async (usuario_id) => {
  const resultado = await pool.query(
    `SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        dc.activo
     FROM docente_curso dc
     JOIN cursos c ON c.id = dc.curso_id
     WHERE dc.usuario_id = $1`,
    [usuario_id]
  );

  return resultado.rows;
};

export const actualizarEstadoCursoDocente = async (usuario_id, curso_id, estado) => {
  const resultado = await pool.query(
    `UPDATE docente_curso
     SET estado = $1
     WHERE usuario_id = $2 AND curso_id = $3
     RETURNING *`,
    [estado, usuario_id, curso_id]
  );

  return resultado.rows[0];
};

export const obtenerEstadoActual = async (usuario_id, curso_id) => {
  const resultado = await pool.query(
    `SELECT estado
     FROM docente_curso
     WHERE usuario_id = $1 AND curso_id = $2`,
    [usuario_id, curso_id]
  );

  return resultado.rows[0];
};
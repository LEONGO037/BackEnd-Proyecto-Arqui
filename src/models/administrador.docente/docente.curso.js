import pool from "../../config/db.js";

export const asignarCurso = async (usuario_id, curso_id) => {

  const resultado = await pool.query(
    `INSERT INTO docente_curso (usuario_id, curso_id)
     VALUES ($1, $2)
     RETURNING *`,
    [usuario_id, curso_id]
  );

  return resultado.rows[0];
};
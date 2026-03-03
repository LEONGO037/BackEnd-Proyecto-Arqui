import pool from "../../config/db.js";

export const asignarCurso = async (usuario_id, curso_id) => {

  const resultado = await pool.query(
    `INSERT INTO docente_curso (usuario_id, curso_id, activo)
     VALUES ($1, $2, FALSE)
     RETURNING *`,
    [usuario_id, curso_id]
  );

  return resultado.rows[0];
};
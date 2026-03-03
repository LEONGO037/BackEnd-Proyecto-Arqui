import pool from "../../config/db.js";

// cantidad cursos activos
export const contarCursosActivos = async (usuario_id) => {
  const resultado = await pool.query(
    `SELECT COUNT(*) 
     FROM docente_curso
     WHERE usuario_id = $1
     AND estado = 'ACTIVO'`,
    [usuario_id]
  );

  return resultado.rows[0].count;
};

// cantidad estudiantes en cursos activos
export const contarEstudiantesCursosActivos = async (usuario_id) => {
  const resultado = await pool.query(
    `SELECT COUNT(ec.id)
     FROM estudiante_curso ec
     JOIN docente_curso dc ON dc.curso_id = ec.curso_id
     WHERE dc.usuario_id = $1
     AND dc.estado = 'ACTIVO'`,
    [usuario_id]
  );

  return resultado.rows[0].count;
};
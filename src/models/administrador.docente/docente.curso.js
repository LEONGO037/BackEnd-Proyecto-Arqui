import pool from "../../config/db.js";

export const asignarCurso = async (usuario_id, curso_id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Eliminamos cualquier docente previamente asignado a este curso 
    //    para evitar duplicados y permitir el cambio de docente.
    await client.query(
      'DELETE FROM docente_curso WHERE curso_id = $1',
      [curso_id]
    );

    // 2. Insertamos la nueva asignación
    const resultado = await client.query(
      `INSERT INTO docente_curso (usuario_id, curso_id, estado)
       VALUES ($1, $2, 'NO_ACTIVO')
       RETURNING *`,
      [usuario_id, curso_id]
    );

    await client.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
// src/models/inscripcion/inscripcion.model.js
import pool from "../../config/db.js";

export const obtenerCursosDeEstudiante = async (estudianteId) => {
  const { rows } = await pool.query(
    `SELECT
       ec.id           AS estudiante_curso_id,
       ec.curso_id,
       ec.estado_academico,
       ec.asistencia_porcentaje,
       c.nombre,
       c.descripcion,
       c.costo
     FROM estudiante_curso ec
     JOIN cursos c ON c.id = ec.curso_id
     WHERE ec.estudiante_id = $1
     ORDER BY ec.fecha_registro DESC`,
    [estudianteId]
  );
  return rows;
};

export const inscribirEstudianteEnCurso = async (estudianteId, cursoId) => {
  // Verificar duplicado
  const { rows: existe } = await pool.query(
    `SELECT id FROM estudiante_curso WHERE estudiante_id = $1 AND curso_id = $2`,
    [estudianteId, cursoId]
  );
  if (existe.length > 0) throw new Error("Ya estás inscrito en este curso");

  // Obtener costo
  const { rows: cursoRows } = await pool.query(
    `SELECT costo FROM cursos WHERE id = $1 AND activo = true`,
    [cursoId]
  );
  if (cursoRows.length === 0) throw new Error("Curso no encontrado o inactivo");

  // Crear inscripcion padre
  const { rows: inscRows } = await pool.query(
    `INSERT INTO inscripciones (estudiante_id, estado, total) VALUES ($1, 'activo', $2) RETURNING id`,
    [estudianteId, cursoRows[0].costo]
  );

  // Crear detalle
  const { rows: ecRows } = await pool.query(
    `INSERT INTO estudiante_curso (estudiante_id, curso_id, inscripcion_id, estado_academico, asistencia_porcentaje)
     VALUES ($1, $2, $3, 'cursando', 0) RETURNING *`,
    [estudianteId, cursoId, inscRows[0].id]
  );
  return ecRows[0];
};

export const desinscribirEstudianteDeCurso = async (estudianteId, cursoId) => {
  const { rows } = await pool.query(
    `DELETE FROM estudiante_curso WHERE estudiante_id = $1 AND curso_id = $2 RETURNING inscripcion_id`,
    [estudianteId, cursoId]
  );
  if (rows.length === 0) throw new Error("No existe esa inscripción");

  if (rows[0].inscripcion_id) {
    await pool.query(`DELETE FROM inscripciones WHERE id = $1`, [rows[0].inscripcion_id]);
  }
  return { eliminado: true };
};

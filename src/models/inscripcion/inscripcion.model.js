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
    `SELECT id FROM estudiante_curso 
     WHERE estudiante_id = $1 AND curso_id = $2`,
    [estudianteId, cursoId]
  );
  if (existe.length > 0) 
    throw new Error("Ya estás inscrito en este curso");

  // Obtener costo
  const { rows: cursoRows } = await pool.query(
    `SELECT costo FROM cursos 
     WHERE id = $1 AND activo = true`,
    [cursoId]
  );
  if (cursoRows.length === 0) 
    throw new Error("Curso no encontrado o inactivo");

  const costo = cursoRows[0].costo;

  // Crear inscripción individual
  const { rows: inscRows } = await pool.query(
    `INSERT INTO inscripciones (estudiante_id, estado, total)
     VALUES ($1, 'activo', $2)
     RETURNING id`,
    [estudianteId, costo]
  );

  const inscripcionId = inscRows[0].id;

  // Crear estudiante_curso
  const { rows: ecRows } = await pool.query(
    `INSERT INTO estudiante_curso 
     (estudiante_id, curso_id, inscripcion_id, estado_academico, asistencia_porcentaje)
     VALUES ($1, $2, $3, 'cursando', 0)
     RETURNING *`,
    [estudianteId, cursoId, inscripcionId]
  );

  return ecRows[0];
};


/**
 * Inscribir estudiante en múltiples cursos
 * Cada curso tendrá su propia inscripción independiente
 */
export const inscribirEstudianteEnCursos = async (estudianteId, cursoIds) => {

  const inscripciones = [];
  const errores = [];

  for (const cursoId of cursoIds) {

    try {

      // Verificar duplicado
      const { rows: existe } = await pool.query(
        `SELECT id FROM estudiante_curso 
         WHERE estudiante_id = $1 AND curso_id = $2`,
        [estudianteId, cursoId]
      );

      if (existe.length > 0) {
        errores.push({ cursoId, error: "Ya estás inscrito en este curso" });
        continue;
      }

      // Obtener costo
      const { rows: cursoRows } = await pool.query(
        `SELECT costo FROM cursos 
         WHERE id = $1 AND activo = true`,
        [cursoId]
      );

      if (cursoRows.length === 0) {
        errores.push({ cursoId, error: "Curso no encontrado o inactivo" });
        continue;
      }

      const costo = cursoRows[0].costo;

      // Crear inscripción INDIVIDUAL
      const { rows: inscRows } = await pool.query(
        `INSERT INTO inscripciones (estudiante_id, estado, total)
         VALUES ($1, 'activo', $2)
         RETURNING id`,
        [estudianteId, costo]
      );

      const inscripcionId = inscRows[0].id;

      // Crear estudiante_curso
      const { rows: ecRows } = await pool.query(
        `INSERT INTO estudiante_curso 
         (estudiante_id, curso_id, inscripcion_id, estado_academico, asistencia_porcentaje)
         VALUES ($1, $2, $3, 'cursando', 0)
         RETURNING *`,
        [estudianteId, cursoId, inscripcionId]
      );

      inscripciones.push(ecRows[0]);

    } catch (err) {
      errores.push({ cursoId, error: err.message });
    }
  }

  return { inscripciones, errores };
};


export const desinscribirEstudianteDeCurso = async (estudianteId, cursoId) => {

  const { rows } = await pool.query(
    `DELETE FROM estudiante_curso 
     WHERE estudiante_id = $1 AND curso_id = $2 
     RETURNING inscripcion_id`,
    [estudianteId, cursoId]
  );

  if (rows.length === 0) 
    throw new Error("No existe esa inscripción");

  const inscripcionId = rows[0].inscripcion_id;

  if (inscripcionId) {
    await pool.query(
      `DELETE FROM inscripciones WHERE id = $1`,
      [inscripcionId]
    );
  }

  return { eliminado: true };
};
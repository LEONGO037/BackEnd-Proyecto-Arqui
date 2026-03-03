// src/models/tareas/tareas.model.js
import pool from "../../config/db.js";

// Obtener todas las evaluaciones/tareas de un curso
export const obtenerEvaluacionesPorCurso = async (cursoId) => {
  const { rows } = await pool.query(
    `SELECT id, curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden
     FROM configuracion_evaluacion
     WHERE curso_id = $1
     ORDER BY orden ASC`,
    [cursoId]
  );
  return rows;
};

// Obtener una evaluación/tarea específica
export const obtenerEvaluacionPorId = async (evaluacionId) => {
  const { rows } = await pool.query(
    `SELECT id, curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden
     FROM configuracion_evaluacion
     WHERE id = $1`,
    [evaluacionId]
  );
  return rows[0];
};

// Crear una nueva evaluación/tarea
export const crearEvaluacion = async (datosEvaluacion) => {
  const { curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden } = datosEvaluacion;

  if (!curso_id || !nombre) {
    throw new Error("curso_id y nombre son requeridos");
  }

  // Obtener el próximo orden si no se proporciona
  let proximoOrden = orden;
  if (!proximoOrden) {
    const { rows: maxOrden } = await pool.query(
      `SELECT MAX(orden) as max_orden FROM configuracion_evaluacion WHERE curso_id = $1`,
      [curso_id]
    );
    proximoOrden = (maxOrden[0]?.max_orden || 0) + 1;
  }

  const { rows } = await pool.query(
    `INSERT INTO configuracion_evaluacion (curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden`,
    [curso_id, nombre, descripcion, porcentaje || 0, tipo, fecha_vencimiento, proximoOrden]
  );
  return rows[0];
};

// Actualizar una evaluación/tarea
export const actualizarEvaluacion = async (evaluacionId, datosEvaluacion) => {
  const { nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden } = datosEvaluacion;

  const { rows } = await pool.query(
    `UPDATE configuracion_evaluacion
     SET nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         porcentaje = COALESCE($3, porcentaje),
         tipo = COALESCE($4, tipo),
         fecha_vencimiento = COALESCE($5, fecha_vencimiento),
         orden = COALESCE($6, orden)
     WHERE id = $7
     RETURNING id, curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden`,
    [nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden, evaluacionId]
  );

  if (rows.length === 0) {
    throw new Error("Evaluación no encontrada");
  }

  return rows[0];
};

// Eliminar una evaluación/tarea
export const eliminarEvaluacion = async (evaluacionId) => {
  // Primero eliminar todas las notas asociadas
  await pool.query(
    `DELETE FROM notas WHERE configuracion_evaluacion_id = $1`,
    [evaluacionId]
  );

  // Luego eliminar la evaluación
  const { rows } = await pool.query(
    `DELETE FROM configuracion_evaluacion
     WHERE id = $1
     RETURNING id`,
    [evaluacionId]
  );

  if (rows.length === 0) {
    throw new Error("Evaluación no encontrada");
  }

  return { eliminado: true };
};

// Asignar calificación a un estudiante en una evaluación/tarea
export const asignarCalificacionEvaluacion = async (datosCalificacion) => {
  const { configuracion_evaluacion_id, estudiante_curso_id, nota } = datosCalificacion;

  if (!configuracion_evaluacion_id || !estudiante_curso_id || nota === undefined) {
    throw new Error("configuracion_evaluacion_id, estudiante_curso_id y nota son requeridos");
  }

  // Validar que la evaluación existe
  const evaluacionExiste = await obtenerEvaluacionPorId(configuracion_evaluacion_id);
  if (!evaluacionExiste) {
    throw new Error("Evaluación no encontrada");
  }

  // Validar que el estudiante está inscrito en el curso
  const { rows: estudianteRows } = await pool.query(
    `SELECT id FROM estudiante_curso
     WHERE id = $1 AND curso_id = (SELECT curso_id FROM configuracion_evaluacion WHERE id = $2)`,
    [estudiante_curso_id, configuracion_evaluacion_id]
  );

  if (estudianteRows.length === 0) {
    throw new Error("El estudiante no está inscrito en este curso");
  }

  // Verificar si ya existe una nota para esta evaluación y estudiante
  const { rows: existente } = await pool.query(
    `SELECT id FROM notas
     WHERE configuracion_evaluacion_id = $1 AND estudiante_curso_id = $2`,
    [configuracion_evaluacion_id, estudiante_curso_id]
  );

  if (existente.length > 0) {
    // Actualizar nota existente
    const { rows } = await pool.query(
      `UPDATE notas
       SET nota = $1, fecha_registro = CURRENT_TIMESTAMP
       WHERE configuracion_evaluacion_id = $2 AND estudiante_curso_id = $3
       RETURNING id, estudiante_curso_id, configuracion_evaluacion_id, nota, fecha_registro`,
      [nota, configuracion_evaluacion_id, estudiante_curso_id]
    );
    return rows[0];
  } else {
    // Crear nueva nota
    const { rows } = await pool.query(
      `INSERT INTO notas (estudiante_curso_id, configuracion_evaluacion_id, nota)
       VALUES ($1, $2, $3)
       RETURNING id, estudiante_curso_id, configuracion_evaluacion_id, nota, fecha_registro`,
      [estudiante_curso_id, configuracion_evaluacion_id, nota]
    );
    return rows[0];
  }
};

// Obtener calificaciones de una evaluación/tarea
export const obtenerCalificacionesPorEvaluacion = async (evaluacionId) => {
  const { rows } = await pool.query(
    `SELECT n.id, n.estudiante_curso_id, n.configuracion_evaluacion_id, n.nota, n.fecha_registro,
            u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
            ec.estado_academico, ec.asistencia_porcentaje
     FROM notas n
     JOIN estudiante_curso ec ON ec.id = n.estudiante_curso_id
     JOIN usuarios u ON u.id = ec.estudiante_id
     WHERE n.configuracion_evaluacion_id = $1
     ORDER BY u.apellido_paterno, u.apellido_materno`,
    [evaluacionId]
  );
  return rows;
};

// Obtener calificaciones de un estudiante en un curso
export const obtenerCalificacionesEstudiantePorCurso = async (estudianteCursoId) => {
  const { rows } = await pool.query(
    `SELECT n.id, n.configuracion_evaluacion_id, n.nota, n.fecha_registro,
            ce.nombre, ce.descripcion, ce.tipo, ce.fecha_vencimiento, ce.porcentaje, ce.orden
     FROM notas n
     JOIN configuracion_evaluacion ce ON ce.id = n.configuracion_evaluacion_id
     WHERE n.estudiante_curso_id = $1
     ORDER BY ce.orden ASC`,
    [estudianteCursoId]
  );
  return rows;
};

// Eliminar una nota/calificación
export const eliminarCalificacion = async (notaId) => {
  const { rows } = await pool.query(
    `DELETE FROM notas
     WHERE id = $1
     RETURNING id`,
    [notaId]
  );

  if (rows.length === 0) {
    throw new Error("Nota no encontrada");
  }

  return { eliminado: true };
};

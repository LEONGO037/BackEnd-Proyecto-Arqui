import pool from "../../config/db.js";

export const obtenerCursosPorDocente = async (usuario_id) => {
  const resultado = await pool.query(
    `SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        c.costo,
        c.minimo_estudiantes,
        dc.estado as estado_curso,
        dc.fecha_asignacion,
        COUNT(DISTINCT ec.estudiante_id) as alumnos,
        COALESCE(ROUND(AVG(ec.nota_final), 1), 0) as calificacion
     FROM docente_curso dc
     JOIN cursos c ON c.id = dc.curso_id
     LEFT JOIN estudiante_curso ec ON ec.curso_id = c.id
     WHERE dc.usuario_id = $1
     GROUP BY c.id, c.nombre, c.descripcion, c.costo, c.minimo_estudiantes, dc.estado, dc.fecha_asignacion
     ORDER BY c.nombre`,
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

export const obtenerDatosMinimosInicio = async (usuario_id, curso_id) => {
  const resultado = await pool.query(
    `SELECT
        c.id AS curso_id,
        c.minimo_estudiantes,
        COUNT(DISTINCT ec.estudiante_id) AS inscritos
     FROM docente_curso dc
     JOIN cursos c ON c.id = dc.curso_id
     LEFT JOIN estudiante_curso ec ON ec.curso_id = c.id
     WHERE dc.usuario_id = $1 AND dc.curso_id = $2
     GROUP BY c.id, c.minimo_estudiantes`,
    [usuario_id, curso_id]
  );

  return resultado.rows[0] || null;
};

export const obtenerEstudiantesPorCurso = async (usuario_id, curso_id) => {
  const resultado = await pool.query(
    `SELECT 
        ec.id,
        u.id as estudiante_id,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', COALESCE(u.apellido_materno, '')) as nombre,
        ec.asistencia_porcentaje as asistencia,
        ec.nota_final as nota_final,
        ec.estado_academico as estado
     FROM estudiante_curso ec
     JOIN usuarios u ON u.id = ec.estudiante_id
     JOIN docente_curso dc ON dc.curso_id = ec.curso_id
     WHERE dc.usuario_id = $1 AND ec.curso_id = $2
     ORDER BY u.nombre`,
    [usuario_id, curso_id]
  );

  return resultado.rows;
};

export const actualizarNotasEstudiantes = async (usuario_id, curso_id, notas) => {
  // notas es un array de { estudiante_curso_id, nota_final }
  const resultados = [];
  
  for (const { estudiante_curso_id, nota_final } of notas) {
    const resultado = await pool.query(
      `UPDATE estudiante_curso ec
       SET nota_final = $1
       FROM docente_curso dc
       WHERE ec.id = $2 
         AND ec.curso_id = dc.curso_id
         AND dc.usuario_id = $3
       RETURNING ec.id, ec.nota_final`,
      [nota_final, estudiante_curso_id, usuario_id]
    );
    
    if (resultado.rows.length > 0) {
      resultados.push(resultado.rows[0]);
    }
  }
  
  return resultados;
};

export const obtenerMetricasCurso = async (usuario_id, curso_id) => {
  const resultado = await pool.query(
    `SELECT 
        COUNT(DISTINCT ec.estudiante_id) as total_estudiantes,
        COALESCE(ROUND(AVG(ec.nota_final), 1), 0) as promedio_curso,
        COALESCE(ROUND(AVG(ec.asistencia_porcentaje), 1), 0) as asistencia_promedio,
        COUNT(CASE WHEN ec.nota_final >= 51 THEN 1 END)::float / 
          NULLIF(COUNT(CASE WHEN ec.nota_final IS NOT NULL THEN 1 END), 0) * 100 as tasa_aprobacion
     FROM estudiante_curso ec
     JOIN docente_curso dc ON dc.curso_id = ec.curso_id
     WHERE dc.usuario_id = $1 AND ec.curso_id = $2`,
    [usuario_id, curso_id]
  );

  return resultado.rows[0] || { total_estudiantes: 0, promedio_curso: 0, asistencia_promedio: 0, tasa_aprobacion: 0 };
};
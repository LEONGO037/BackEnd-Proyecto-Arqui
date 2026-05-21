// src/models/reportes/reportes.model.js
import pool from "../../config/db.js";

/**
 * Reporte completo de inscripciones con datos de pago asociado.
 * Cada fila = un estudiante inscrito en un curso.
 */
export const obtenerReporteInscripciones = async ({ desde, hasta, curso_id } = {}) => {
  const condiciones = ["c.activo = true"];
  const valores = [];
  let idx = 1;

  if (desde) {
    condiciones.push(`ec.fecha_registro >= $${idx}`);
    valores.push(desde);
    idx++;
  }
  if (hasta) {
    condiciones.push(`ec.fecha_registro <= $${idx}`);
    valores.push(hasta);
    idx++;
  }
  if (curso_id) {
    condiciones.push(`c.id = $${idx}`);
    valores.push(Number(curso_id));
    idx++;
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT
       ec.id                                                       AS inscripcion_id,
       ec.fecha_registro,
       ec.estado_academico,
       ec.asistencia_porcentaje,
       ec.nota_final,

       -- Estudiante
       u.id                                                        AS estudiante_id,
       u.nombre                                                    AS estudiante_nombre,
       u.apellido_paterno                                          AS estudiante_apellido,
       u.email                                                     AS estudiante_email,

       -- Curso
       c.id                                                        AS curso_id,
       c.nombre                                                    AS curso_nombre,
       c.costo                                                     AS costo_bs,
       ROUND(c.costo / 7.0, 2)                                     AS costo_usd,

       -- Pago asociado (puede ser NULL si el pago aún no se registró)
       p.id                                                        AS pago_id,
       p.monto                                                     AS monto_pagado_bs,
       p.referencia                                                AS referencia_paypal,
       p.estado                                                    AS estado_pago,
       p.fecha_pago

     FROM estudiante_curso ec
     JOIN usuarios  u  ON u.id  = ec.estudiante_id
     JOIN cursos    c  ON c.id  = ec.curso_id
     LEFT JOIN pagos p ON p.inscripcion_id = ec.inscripcion_id
     ${where}
     ORDER BY ec.fecha_registro DESC`,
    valores
  );
  return rows;
};

/**
 * Reporte de pagos confirmados (estado = 'COMPLETADO').
 */
export const obtenerReportePagos = async ({ desde, hasta } = {}) => {
  const condiciones = ["p.estado = 'COMPLETADO'"];
  const valores = [];
  let idx = 1;

  if (desde) {
    condiciones.push(`p.fecha_pago >= $${idx}`);
    valores.push(desde);
    idx++;
  }
  if (hasta) {
    condiciones.push(`p.fecha_pago <= $${idx}`);
    valores.push(hasta);
    idx++;
  }

  const where = `WHERE ${condiciones.join(" AND ")}`;

  const { rows } = await pool.query(
    `SELECT
       p.id                                  AS pago_id,
       p.monto                               AS monto_bs,
       ROUND(p.monto / 7.0, 2)               AS monto_usd,
       p.referencia                          AS referencia_paypal,
       p.estado,
       p.fecha_pago,

       -- Estudiante
       u.nombre                              AS estudiante_nombre,
       u.apellido_paterno                    AS estudiante_apellido,
       u.email                              AS estudiante_email,

       -- Curso
       c.nombre                              AS curso_nombre,
       c.costo                               AS precio_curso_bs,

       -- Método de pago
       mp.nombre                             AS metodo_pago

     FROM pagos p
     JOIN inscripciones   i   ON i.id  = p.inscripcion_id
     JOIN usuarios        u   ON u.id  = i.estudiante_id
     JOIN estudiante_curso ec ON ec.inscripcion_id = i.id
     JOIN cursos          c   ON c.id  = ec.curso_id
     JOIN metodos_pago    mp  ON mp.id = p.metodo_pago_id
     ${where}
     ORDER BY p.fecha_pago DESC`,
    valores
  );
  return rows;
};

/**
 * Estadísticas de resumen para el encabezado del dashboard de reportes.
 */
export const obtenerResumenEstadisticas = async () => {
  const { rows: [stats] } = await pool.query(
    `SELECT
       COUNT(DISTINCT ec.id)                                          AS total_inscripciones,
       COUNT(DISTINCT ec.estudiante_id)                               AS total_estudiantes,
       COUNT(DISTINCT c.id)                                           AS total_cursos_activos,
       COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'COMPLETADO'), 0) AS ingresos_totales_bs,
       COALESCE(
         ROUND(SUM(p.monto) FILTER (WHERE p.estado = 'COMPLETADO') / 7.0, 2),
         0
       )                                                              AS ingresos_totales_usd,
       COUNT(p.id) FILTER (WHERE p.estado = 'COMPLETADO')            AS pagos_completados

     FROM estudiante_curso ec
     JOIN cursos c ON c.id = ec.curso_id AND c.activo = true
     LEFT JOIN pagos p ON p.inscripcion_id = ec.inscripcion_id`
  );
  return stats;
};

/**
 * Resumen de inscripciones agrupado por curso.
 */
export const obtenerInscripcionesPorCurso = async () => {
  const { rows } = await pool.query(
    `SELECT
       c.id                               AS curso_id,
       c.nombre                           AS curso_nombre,
       c.costo                            AS costo_bs,
       COUNT(ec.id)                       AS total_inscritos,
       COUNT(p.id) FILTER (WHERE p.estado = 'COMPLETADO') AS pagos_confirmados,
       COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'COMPLETADO'), 0) AS ingresos_bs

     FROM cursos c
     LEFT JOIN estudiante_curso ec ON ec.curso_id = c.id
     LEFT JOIN pagos p ON p.inscripcion_id = ec.inscripcion_id
     WHERE c.activo = true
     GROUP BY c.id, c.nombre, c.costo
     ORDER BY total_inscritos DESC`
  );
  return rows;
};

/**
 * Obtiene registros de auditoria del sistema para el panel administrativo.
 * @param {Object} filtros
 * @param {number} [filtros.limite=100] - Maximo de registros a devolver.
 * @param {string} [filtros.accion] - Filtro por tipo de accion.
 * @param {string} [filtros.usuario] - Filtro por nombre/apellido/email de usuario.
 * @param {Date} [filtros.desde] - Fecha inicial.
 * @param {Date} [filtros.hasta] - Fecha final.
 */
export const obtenerRegistrosAuditoria = async ({
  limite = 100,
  accion,
  usuario,
  desde,
  hasta,
} = {}) => {
  const condiciones = [];
  const valores = [];
  let idx = 1;

  if (accion) {
    condiciones.push(`UPPER(a.accion) = UPPER($${idx})`);
    valores.push(accion);
    idx++;
  }

  if (usuario) {
    condiciones.push(`(
      u.nombre ILIKE $${idx}
      OR u.apellido_paterno ILIKE $${idx}
      OR COALESCE(u.apellido_materno, '') ILIKE $${idx}
      OR u.email ILIKE $${idx}
    )`);
    valores.push(`%${usuario}%`);
    idx++;
  }

  if (desde) {
    condiciones.push(`a.fecha >= $${idx}`);
    valores.push(desde);
    idx++;
  }

  if (hasta) {
    condiciones.push(`a.fecha <= $${idx}`);
    valores.push(hasta);
    idx++;
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  valores.push(Number(limite));

  const { rows } = await pool.query(
    `SELECT
      a.id,
      a.usuario_id,
      CONCAT(u.nombre, ' ', u.apellido_paterno, COALESCE(' ' || u.apellido_materno, '')) AS usuario,
      u.email AS usuario_email,
      a.accion,
      a.tabla_afectada,
      a.registro_id,
      a.fecha,
      a.detalle
    FROM public.auditoria a
    LEFT JOIN public.usuarios u ON u.id = a.usuario_id
    ${where}
    ORDER BY a.fecha DESC
    LIMIT $${idx}`,
    valores
  );

  return rows;
};

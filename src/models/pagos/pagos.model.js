// src/models/pagos/pagos.model.js
import pool from "../../config/db.js";

/**
 * Obtener detalles de cursos por una lista de IDs
 */
export const obtenerCursosPorIds = async (ids) => {
    const { rows } = await pool.query(
        "SELECT id, nombre, costo FROM cursos WHERE id = ANY($1) AND activo = true",
        [ids]
    );
    return rows;
};

/**
 * Registra un pago en la base de datos.
 * El metodo_pago_id para PayPal es 1.
 */
export const registrarPago = async ({
    inscripcionId,
    monto,
    referencia
}) => {
    const { rows } = await pool.query(
        `INSERT INTO pagos 
     (inscripcion_id, metodo_pago_id, monto, estado, referencia, fecha_pago)
     VALUES ($1, 1, $2, 'COMPLETADO', $3, CURRENT_TIMESTAMP)
     RETURNING id`,
        [inscripcionId, monto, referencia]
    );
    return rows[0];
};

/**
 * Obtener todos los pagos con paginación (Vista Admin)
 */
export const obtenerTodosLosPagos = async (limit = 10, offset = 0) => {
    const { rows } = await pool.query(
        `SELECT 
      p.id AS pago_id,
      p.monto,
      p.estado,
      p.referencia,
      p.fecha_pago,
      u.nombre AS estudiante_nombre,
      u.apellido_paterno AS estudiante_apellido,
      u.email AS estudiante_email,
      mp.nombre AS metodo_pago
    FROM pagos p
    JOIN inscripciones i ON p.inscripcion_id = i.id
    JOIN usuarios u ON i.estudiante_id = u.id
    JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
    ORDER BY p.fecha_pago DESC
    LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    const { rows: countRows } = await pool.query("SELECT COUNT(*) FROM pagos");

    return {
        data: rows,
        total: parseInt(countRows[0].count),
        limit,
        offset
    };
};

/**
 * Obtener todos los pagos de un usuario específico
 */
export const obtenerPagosPorUsuario = async (estudianteId) => {
    const { rows } = await pool.query(
        `SELECT 
      p.id AS pago_id,
      p.monto,
      p.estado,
      p.referencia,
      p.fecha_pago,
      mp.nombre AS metodo_pago
    FROM pagos p
    JOIN inscripciones i ON p.inscripcion_id = i.id
    JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
    WHERE i.estudiante_id = $1
    ORDER BY p.fecha_pago DESC`,
        [estudianteId]
    );
    return rows;
};

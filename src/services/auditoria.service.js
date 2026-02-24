import pool from "../config/db.js";

/**
 * Registra un evento en la tabla de auditoría.
 * 
 * @param {Object} params - Datos de la auditoría.
 * @param {number} params.usuario_id - ID del usuario que realiza la acción.
 * @param {string} params.accion - Tipo de acción (CREATE, UPDATE, DELETE, etc.).
 * @param {string} params.tabla_afectada - Nombre de la tabla sobre la que se realiza la acción.
 * @param {number} [params.registro_id] - ID del registro afectado (opcional).
 * @param {Object} [params.detalle] - Información adicional de la acción (opcional).
 * @returns {Promise<Object>} El registro insertado.
 */
export const registrarAuditoria = async ({ usuario_id, accion, tabla_afectada, registro_id = null, detalle = {} }) => {
    const query = `
    INSERT INTO public.auditoria (usuario_id, accion, tabla_afectada, registro_id, detalle)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
    const values = [usuario_id, accion, tabla_afectada, registro_id, detalle];

    try {
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        console.error("Error al registrar auditoría:", error);
        // Lanzar un error descriptivo para que el endpoint pueda manejarlo
        throw new Error(`Error en el servicio de auditoría: ${error.message}`);
    }
};

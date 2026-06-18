import pool from "../config/db.js";
import { logger } from "./logger.service.js";

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
        logger.error("Error al registrar auditoría", error);
        // Lanzar un error descriptivo para que el endpoint pueda manejarlo
        throw new Error(`Error en el servicio de auditoría: ${error.message}`);
    }
};

/**
 * Registra auditoria sin interrumpir el flujo principal si ocurre un error.
 */
export const registrarAuditoriaSegura = async (payload) => {
    try {
        return await registrarAuditoria(payload);
    } catch (error) {
        logger.warn("Auditoria no registrada (continuando flujo)", error.message);
        return null;
    }
};

/**
 * Compara dos objetos y retorna las diferencias detalladas en un formato estructurado.
 * Excluye campos sensibles o repetitivos como contraseñas o tokens.
 *
 * @param {Object} anterior - Estado anterior del objeto/fila.
 * @param {Object} nuevo - Nuevo estado del objeto/fila.
 * @returns {Object} Diferencias encontradas { anterior: {}, nuevo: {}, cambios: [] }
 */
export const diffObjetos = (anterior = {}, nuevo = {}) => {
  const diffAnterior = {};
  const diffNuevo = {};
  const cambios = [];
  
  const ignoreKeys = [
    'password_hash', 'password', 'token_verificacion', 'token_verificacion_expira',
    'reset_token_hash', 'reset_token_expira', 'codigo_verificacion', 'codigo_verificacion_expira',
    'created_at', 'fecha_creacion', 'fecha_registro'
  ];

  const keys = new Set([...Object.keys(anterior || {}), ...Object.keys(nuevo || {})]);

  for (const key of keys) {
    if (ignoreKeys.includes(key)) continue;

    const valAnt = anterior ? anterior[key] : undefined;
    const valNue = nuevo ? nuevo[key] : undefined;

    // Normalizar null, undefined y strings vacíos para evitar falsos positivos
    const normAnt = (valAnt === undefined || valAnt === null) ? '' : String(valAnt).trim();
    const normNue = (valNue === undefined || valNue === null) ? '' : String(valNue).trim();

    if (normAnt !== normNue) {
      diffAnterior[key] = valAnt;
      diffNuevo[key] = valNue;
      cambios.push({
        campo: key,
        anterior: valAnt,
        nuevo: valNue
      });
    }
  }

  return {
    anterior: diffAnterior,
    nuevo: diffNuevo,
    cambios
  };
};

// src/services/logService.js
// Wrappers fire-and-forget sobre logAplicacion y logSeguridad.
// Los controladores importan desde aquí para no repetir .catch(() => {}).
//
// logApp  → eventos de negocio / aplicación   → tabla log_aplicacion
// logSeg  → eventos de seguridad / sesión      → tabla log_seguridad

import { logAplicacion, logSeguridad } from './logger.service.js';

/**
 * Registra un evento de aplicación sin interrumpir el flujo.
 * @param {Object} params - Igual que logAplicacion: { nivel, modulo, evento, mensaje, usuario_id, detalle, req }
 */
export const logApp = (params) => logAplicacion(params).catch(() => {});

/**
 * Registra un evento de seguridad sin interrumpir el flujo.
 * @param {Object} params - Igual que logSeguridad: { evento, exito, usuario_id, email, req, detalle }
 */
export const logSeg = (params) => logSeguridad(params).catch(() => {});

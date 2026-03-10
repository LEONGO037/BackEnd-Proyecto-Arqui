// src/services/emisionFactura.service.js
import { obtenerCursosPorIds } from '../../models/factura/factura.model.js';
import { generarFacturaPDF } from './factura.service.js';
import { enviarFacturaPorCorreo } from './email.service.js';

/**
 * Orquesta todo el flujo de facturación: consulta DB, genera PDF y envía el correo.
 * @param {Object} payload - Datos recibidos desde el cliente
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const procesarFacturacion = async ({ nombre, email, nit, curso_ids, transaccionId }) => {
  // 1. Obtener la información de los cursos usando el modelo
  const cursos = await obtenerCursosPorIds(curso_ids);

  if (cursos.length === 0) {
    throw new Error('CURSOS_NO_ENCONTRADOS');
  }

  // 2. Calcular el total
  const totalBs = cursos.reduce((sum, c) => sum + Number(c.costo), 0);

  // 3. Preparar el objeto de datos unificado
  const datosFactura = {
    cliente: {
      nombre,
      email,
      nit: nit || 'S/N', 
    },
    cursos: cursos.map(c => ({ 
      nombre: c.nombre, 
      costo: Number(c.costo), 
      cantidad: 1 
    })),
    totalBs,
    transaccionId,
  };

  // 4. Generar el PDF usando el servicio de factura
  const pdfBuffer = await generarFacturaPDF(datosFactura);

  // 5. Enviar el correo usando el servicio de email
  await enviarFacturaPorCorreo(email, pdfBuffer, datosFactura);

  // Retornamos algunos detalles útiles si el controlador los necesita
  return {
    destinatario: email,
    totalPagado: totalBs,
    transaccion: transaccionId
  };
};
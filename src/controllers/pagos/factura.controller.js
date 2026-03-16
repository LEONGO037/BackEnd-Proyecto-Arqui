// src/controllers/pagos/factura.controller.js
import { procesarFacturacion } from '../../services/factura/emisionFactura.service.js';
import { registrarAuditoriaSegura } from '../../services/auditoria.service.js';

export const postGenerarYEnviarFactura = async (req, res) => {
  try {
    // 1. Extraemos y validamos el usuario autenticado (Seguridad)
    const estudianteId = req.usuario?.id;

    if (!estudianteId) {
      return res.status(401).json({ 
        error: 'No autorizado. Se requiere una sesión activa para solicitar facturas.' 
      });
    }

    const { nombre, email, nit, curso_ids, transaccionId } = req.body;

    // 2. Validar que la petición HTTP tenga lo mínimo necesario
    if (!nombre || !email || !curso_ids || !Array.isArray(curso_ids) || curso_ids.length === 0 || !transaccionId) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: nombre, email, curso_ids (array) o transaccionId.' 
      });
    }

    // 3. Delegar toda la lógica de negocio al Servicio
    // Enviamos también el estudianteId por si decides implementar un historial de facturas en la BD más adelante
    const detalles = await procesarFacturacion({ 
      estudianteId,
      nombre, 
      email, 
      nit, 
      curso_ids, 
      transaccionId 
    });

    await registrarAuditoriaSegura({
      usuario_id: estudianteId,
      accion: 'CREATE',
      tabla_afectada: 'facturas',
      detalle: {
        evento: 'GENERAR_ENVIAR_FACTURA',
        nit,
        cursos: curso_ids,
        transaccion_id: transaccionId,
      },
    });

    // 4. Responder éxito al cliente
    res.status(200).json({
      mensaje: 'Factura generada y enviada correctamente por correo electrónico.',
      detalles
    });

  } catch (err) {
    console.error('Error en postGenerarYEnviarFactura:', err.message);
    
    // Manejo de errores específicos lanzados por el servicio
    if (err.message === 'CURSOS_NO_ENCONTRADOS') {
      return res.status(404).json({ error: 'No se encontraron los cursos especificados.' });
    }

    // Error genérico del servidor
    res.status(500).json({ error: 'Hubo un problema al procesar y enviar la factura.' });
  }
};
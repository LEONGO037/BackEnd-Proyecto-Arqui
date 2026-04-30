// src/controllers/pagos/factura.controller.js
import { procesarFacturacion } from '../../services/factura/emisionFactura.service.js';
import { registrarAuditoriaSegura } from '../../services/auditoria.service.js';

export const postGenerarYEnviarFactura = async (req, res, next) => {
  try {
    const estudianteId = req.usuario?.id;
    if (!estudianteId) {
      return res.status(401).json({ error: "No autorizado. Se requiere una sesión activa." });
    }

    const { nombre, email, nit, curso_ids, transaccionId } = req.body;
    if (!nombre || !email || !curso_ids || !Array.isArray(curso_ids) || curso_ids.length === 0 || !transaccionId) {
      return res.status(400).json({ error: "Faltan datos requeridos: nombre, email, curso_ids (array) o transaccionId." });
    }

    const detalles = await procesarFacturacion({ estudianteId, nombre, email, nit, curso_ids, transaccionId });

    await registrarAuditoriaSegura({
      usuario_id: estudianteId,
      accion: "CREATE",
      tabla_afectada: "facturas",
      detalle: { evento: "GENERAR_ENVIAR_FACTURA", nit, cursos: curso_ids, transaccion_id: transaccionId },
    });

    res.status(200).json({ mensaje: "Factura generada y enviada correctamente por correo electrónico.", detalles });
  } catch (err) {
    if (err.message === "CURSOS_NO_ENCONTRADOS") {
      return res.status(404).json({ error: "No se encontraron los cursos especificados." });
    }
    next(err);
  }
};
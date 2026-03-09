// src/controllers/pagos/pagos.controller.js
import { crearOrden, capturarOrden } from '../../services/paypal.service.js';
import { inscribirEstudianteEnCurso, inscribirEstudianteEnCursos } from '../../models/inscripcion/inscripcion.model.js';
import * as PagosModel from '../../models/pagos/pagos.model.js';

export const getConfig = (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};

export const postCrearOrden = async (req, res) => {
  try {
    const { curso_ids, curso_id } = req.body;

    // Soportar tanto array (nuevo) como single ID (retrocompatibilidad)
    const ids = curso_ids || [curso_id];

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'curso_ids o curso_id es requerido' });
    }

    // Obtener datos de los cursos desde el modelo
    const rows = await PagosModel.obtenerCursosPorIds(ids);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron cursos' });
    }

    // Calcular total
    const totalCosto = rows.reduce((sum, curso) => sum + Number(curso.costo), 0);
    const montoUSD = (totalCosto / 7).toFixed(2);

    // Descripción según cantidad de cursos
    const descripcion = rows.length === 1
      ? `Inscripción: ${rows[0].nombre}`
      : `Inscripción a ${rows.length} cursos`;

    const orden = await crearOrden(
      Number(montoUSD),
      descripcion,
      ids.join(',') // Guardar IDs como string para referencia
    );

    res.json({
      orderID: orden.id,
      monto: montoUSD,
      cursos: rows.map(r => r.nombre),
      cantidad: rows.length
    });
  } catch (err) {
    console.error('Error crear-orden:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const postCapturarOrden = async (req, res) => {
  try {
    const { orderID, curso_ids, curso_id, nit, razon_social } = req.body;

    // Soportar tanto array (nuevo) como single ID (retrocompatibilidad)
    const ids = curso_ids || [curso_id];

    if (!orderID || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'orderID y curso_ids (o curso_id) son requeridos'
      });
    }

    const captura = await capturarOrden(orderID);

    if (captura.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'El pago no fue completado',
        detalle: captura.status
      });
    }

    const estudianteId = req.usuario.id;

    // 1. Ejecutar inscripción (desde el modelo de inscripciones)
    let resultadoInscripcion;
    if (ids.length === 1) {
      const inscripcion = await inscribirEstudianteEnCurso(estudianteId, Number(ids[0]));
      resultadoInscripcion = {
        inscripciones: [inscripcion],
        errores: [],
        cantidad: 1
      };
    } else {
      resultadoInscripcion = await inscribirEstudianteEnCursos(
        estudianteId,
        ids.map(id => Number(id))
      );
    }

    // 2. Por cada inscripción exitosa, registrar Pago y Factura (desde el modelo de pagos)
    const detallesPago = [];
    for (const insc of resultadoInscripcion.inscripciones) {
      // Necesitamos el costo del curso para el pago, podemos obtenerlo de la inscripción o del curso
      // En este caso, buscaremos el costo del curso de nuevo o lo pasamos si lo tenemos.
      // Pero mejor, el modelo de pagos puede encargarse si le pasamos la info necesaria.

      // Obtener costo del curso de nuevo (mantenemos el aislamiento de modelos)
      const cursosData = await PagosModel.obtenerCursosPorIds([insc.curso_id]);
      if (cursosData.length > 0) {
        const pagoFactura = await PagosModel.crearPagoYFactura({
          inscripcionId: insc.id || insc.inscripcion_id, // Depende de lo que retorne el modelo de inscripción
          monto: cursosData[0].costo,
          referencia: captura.id,
          nit: nit || req.usuario.ci_nit || 'S/N',
          razonSocial: razon_social || `${req.usuario.nombre} ${req.usuario.apellido_paterno}`
        });
        detallesPago.push(pagoFactura);
      }
    }

    res.json({
      mensaje: ids.length === 1
        ? '¡Pago exitoso! Ya estás inscrito en el curso.'
        : `¡Pago exitoso! Ya estás inscrito en ${resultadoInscripcion.inscripciones.length} cursos.`,
      transaccion: captura.id,
      inscripciones: resultadoInscripcion.inscripciones,
      pago_factura: detallesPago,
      errores: resultadoInscripcion.errores.length > 0 ? resultadoInscripcion.errores : undefined,
    });

  } catch (err) {
    console.error('Error capturar-orden:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const getTodosLosPagos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const pagos = await PagosModel.obtenerTodosLosPagos(limit, offset);
    res.json(pagos);
  } catch (err) {
    console.error('Error obtener-todos-los-pagos:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getPagosUsuario = async (req, res) => {
  try {
    const estudianteId = req.usuario.id;
    const pagos = await PagosModel.obtenerPagosPorUsuario(estudianteId);
    res.json(pagos);
  } catch (err) {
    console.error('Error obtener-pagos-usuario:', err.message);
    res.status(500).json({ error: err.message });
  }
};

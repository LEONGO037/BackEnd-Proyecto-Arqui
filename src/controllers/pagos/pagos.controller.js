// src/controllers/pagos/pagos.controller.js
import { crearOrden, capturarOrden } from '../../services/paypal.service.js';
import { inscribirEstudianteEnCurso, inscribirEstudianteEnCursos } from '../../models/inscripcion/inscripcion.model.js';
import * as PagosModel from '../../models/pagos/pagos.model.js';
import { registrarAuditoriaSegura } from '../../services/auditoria.service.js';

export const getConfig = (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};

export const postCrearOrden = async (req, res) => {
  try {
    const { curso_ids, curso_id } = req.body;

    const ids = curso_ids || [curso_id];

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'curso_ids o curso_id es requerido' });
    }

    const rows = await PagosModel.obtenerCursosPorIds(ids);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron cursos' });
    }

    const totalCosto = rows.reduce((sum, curso) => sum + Number(curso.costo), 0);
    const montoUSD = (totalCosto / 7).toFixed(2);

    const descripcion = rows.length === 1
      ? `Inscripción: ${rows[0].nombre}`
      : `Inscripción a ${rows.length} cursos`;

    const orden = await crearOrden(
      Number(montoUSD),
      descripcion,
      ids.join(',')
    );

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: 'CREATE',
      tabla_afectada: 'pagos',
      detalle: {
        evento: 'CREAR_ORDEN_PAYPAL',
        order_id: orden.id,
        cursos: ids,
        monto_usd: Number(montoUSD),
      },
    });

    res.json({
      orderID: orden.id,
      monto: montoUSD,
      cursos: rows.map(r => r.nombre),
      cantidad: rows.length
    });

  } catch (err) { next(err); }
};

export const postCapturarOrden = async (req, res) => {
  try {
    const { orderID, curso_ids, curso_id } = req.body;

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

    const detallesPago = [];

    for (const insc of resultadoInscripcion.inscripciones) {
      const cursosData = await PagosModel.obtenerCursosPorIds([insc.curso_id]);

      if (cursosData.length > 0) {
        const pago = await PagosModel.registrarPago({
          inscripcionId: insc.inscripcion_id,
          monto: cursosData[0].costo,
          referencia: captura.id
        });

        detallesPago.push(pago);
      }
    }

    await registrarAuditoriaSegura({
      usuario_id: estudianteId,
      accion: 'CREATE',
      tabla_afectada: 'pagos',
      detalle: {
        evento: 'CAPTURA_PAGO_PAYPAL',
        transaccion: captura.id,
        cursos: ids,
        pagos_registrados: detallesPago.length,
      },
    });

    res.json({
      mensaje: ids.length === 1
        ? '¡Pago exitoso! Ya estás inscrito en el curso.'
        : `¡Pago exitoso! Ya estás inscrito en ${resultadoInscripcion.inscripciones.length} cursos.`,
      transaccion: captura.id,
      inscripciones: resultadoInscripcion.inscripciones,
      pagos: detallesPago,
      errores: resultadoInscripcion.errores.length > 0 ? resultadoInscripcion.errores : undefined,
    });

  } catch (err) { next(err); }
};

export const getTodosLosPagos = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const pagos = await PagosModel.obtenerTodosLosPagos(limit, offset);
    res.json(pagos);
  } catch (err) { next(err); }
};

export const getPagosUsuario = async (req, res, next) => {
  try {
    const targetId = req.params.id ? parseInt(req.params.id) : req.usuario.id;
    const { getRolePermissions } = await import("../../models/permiso.modelo.js");
    const permisos = await getRolePermissions(req.usuario.rol_id);
    const esAdmin = permisos.includes("pagos:ver");
    if (!esAdmin && targetId !== req.usuario.id) {
      return res.status(403).json({ error: "No puede acceder a datos de otro usuario" });
    }
    const pagos = await PagosModel.obtenerPagosPorUsuario(targetId);
    res.json(pagos);
  } catch (err) { next(err); }
};
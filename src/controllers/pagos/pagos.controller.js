// src/controllers/pagos/pagos.controller.js
import { crearOrden, capturarOrden } from '../../services/paypal.service.js';
import { inscribirEstudianteEnCurso, inscribirEstudianteEnCursos } from '../../models/inscripcion/inscripcion.model.js';
import pool from '../../config/db.js';

export const getConfig = (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};

export const postCrearOrden = async (req, res) => {
  try {
    const { curso_ids, curso_id, total_bs } = req.body;
    
    // Soportar tanto array (nuevo) como single ID (retrocompatibilidad)
    const ids = curso_ids || [curso_id];
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'curso_ids o curso_id es requerido' });
    }

    // Obtener datos de los cursos
    const { rows } = await pool.query(
      `SELECT id, nombre, costo FROM cursos WHERE id = ANY($1) AND activo = true`,
      [ids]
    );
    
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
    const { orderID, curso_ids, curso_id } = req.body;
    
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
    
    // Usar la función de inscripción múltiple si hay más de un curso
    let resultado;
    if (ids.length === 1) {
      const inscripcion = await inscribirEstudianteEnCurso(estudianteId, Number(ids[0]));
      resultado = { 
        inscripciones: [inscripcion], 
        errores: [],
        cantidad: 1 
      };
    } else {
      resultado = await inscribirEstudianteEnCursos(
        estudianteId, 
        ids.map(id => Number(id))
      );
    }

    res.json({
      mensaje: ids.length === 1 
        ? '¡Pago exitoso! Ya estás inscrito en el curso.'
        : `¡Pago exitoso! Ya estás inscrito en ${resultado.inscripciones.length} cursos.`,
      transaccion: captura.id,
      inscripciones: resultado.inscripciones,
      errores: resultado.errores.length > 0 ? resultado.errores : undefined,
    });

  } catch (err) {
    console.error('Error capturar-orden:', err.message);
    res.status(400).json({ error: err.message });
  }
};

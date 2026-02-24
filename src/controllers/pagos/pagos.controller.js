import { crearOrden, capturarOrden } from '../../services/paypal.service.js';
import { inscribirEstudianteEnCurso } from '../../models/inscripcion/inscripcion.model.js';
import pool from '../../config/db.js';

export const getConfig = (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};

export const postCrearOrden = async (req, res) => {
  try {
    const { curso_id } = req.body;
    if (!curso_id) return res.status(400).json({ error: 'curso_id es requerido' });

    // Obtener datos del curso
    const { rows } = await pool.query(
      `SELECT id, nombre, costo FROM cursos WHERE id = $1 AND activo = true`,
      [curso_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Curso no encontrado' });

    const curso = rows[0];
    const montoUSD = (Number(curso.costo) / 7).toFixed(2);

    const orden = await crearOrden(
      Number(montoUSD),
      `Inscripción: ${curso.nombre}`,
      curso.id
    );

    res.json({ orderID: orden.id, monto: montoUSD, curso: curso.nombre });
  } catch (err) {
    console.error('Error crear-orden:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const postCapturarOrden = async (req, res) => {
  try {
    const { orderID, curso_id } = req.body;
    if (!orderID || !curso_id) {
      return res.status(400).json({ error: 'orderID y curso_id son requeridos' });
    }

    const captura = await capturarOrden(orderID);

    if (captura.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'El pago no fue completado', detalle: captura.status });
    }

    const estudianteId = req.usuario.id;
    const resultado = await inscribirEstudianteEnCurso(estudianteId, Number(curso_id));

    res.json({
      mensaje: '¡Pago exitoso! Ya estás inscrito en el curso.',
      transaccion: captura.id,
      inscripcion: resultado,
    });

  } catch (err) {
    console.error('Error capturar-orden:', err.message);
    res.status(400).json({ error: err.message });
  }
};
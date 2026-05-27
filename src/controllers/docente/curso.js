import {
  listarCursosDocente,
  cambiarEstadoCurso,
  obtenerEstudiantes,
  guardarNotas,
  obtenerMetricas
} from "../../services/docente/curso.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";
import { logAplicacion } from "../../services/logger.service.js";

export const verMisCursos = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;

    const cursos = await listarCursosDocente(usuario_id);

    res.json(cursos);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarEstado = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;
    const { curso_id, estado } = req.body;

    const resultado = await cambiarEstadoCurso(
      usuario_id,
      curso_id,
      estado
    );

    await registrarAuditoria({
      usuario_id,
      accion: "UPDATE",
      tabla_afectada: "docente_curso",
      registro_id: resultado?.id || null,
      detalle: {
        evento: "CAMBIO_ESTADO_CURSO_DOCENTE",
        curso_id: Number(curso_id),
        estado_anterior: resultado?.estado_anterior || null,
        estado_nuevo: resultado?.estado || estado,
      },
    });

    logAplicacion({
      nivel: "INFO",
      modulo: "docente",
      evento: "CAMBIO_ESTADO_CURSO_DOCENTE",
      mensaje: `Estado de curso ${curso_id} actualizado a ${estado}`,
      usuario_id,
      detalle: {
        curso_id: Number(curso_id),
        estado_anterior: resultado?.estado_anterior || null,
        estado_nuevo: resultado?.estado || estado,
      },
    }).catch(() => {});

    res.json({
      mensaje: "Estado actualizado correctamente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerAlumnosCurso = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;
    const { curso_id } = req.params;

    const estudiantes = await obtenerEstudiantes(usuario_id, parseInt(curso_id));

    res.json(estudiantes);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarNotas = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;
    const { curso_id } = req.params;
    const { notas } = req.body; // Array de { estudiante_curso_id, nota_final }

    const resultado = await guardarNotas(usuario_id, parseInt(curso_id), notas);

    logAplicacion({
      nivel: "INFO",
      modulo: "docente",
      evento: "NOTAS_ACTUALIZADAS",
      mensaje: `Notas actualizadas en curso ${curso_id}`,
      usuario_id,
      detalle: { curso_id: Number(curso_id), cantidad: notas?.length },
    }).catch(() => {});

    res.json({
      mensaje: "Calificaciones guardadas correctamente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerMetricasCurso = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;
    const { curso_id } = req.params;

    const metricas = await obtenerMetricas(usuario_id, parseInt(curso_id));

    res.json(metricas);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
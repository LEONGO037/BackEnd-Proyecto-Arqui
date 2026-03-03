// src/controllers/tareas/tareas.controller.js
import {
  obtenerEvaluacionesPorCurso,
  obtenerEvaluacionPorId,
  crearEvaluacion,
  actualizarEvaluacion,
  eliminarEvaluacion,
  asignarCalificacionEvaluacion,
  obtenerCalificacionesPorEvaluacion,
  obtenerCalificacionesEstudiantePorCurso,
  eliminarCalificacion,
} from "../../models/tareas/tareas.model.js";

// GET /api/tareas/curso/:cursoId — obtener todas las evaluaciones/tareas de un curso
export const getTareasPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const evaluaciones = await obtenerEvaluacionesPorCurso(Number(cursoId));
    res.json(evaluaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tareas/:tareaId — obtener una evaluación/tarea específica
export const getTareaPorId = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const evaluacion = await obtenerEvaluacionPorId(Number(tareaId));
    if (!evaluacion) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }
    res.json(evaluacion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tareas — crear una nueva evaluación/tarea (solo docentes)
export const postCrearTarea = async (req, res) => {
  try {
    const { curso_id, nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden } = req.body;

    const evaluacion = await crearEvaluacion({
      curso_id: Number(curso_id),
      nombre,
      descripcion,
      porcentaje: porcentaje ? Number(porcentaje) : 0,
      tipo,
      fecha_vencimiento,
      orden: orden ? Number(orden) : null,
    });

    res.status(201).json({
      mensaje: "Evaluación creada exitosamente",
      data: evaluacion,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/tareas/:tareaId — actualizar una evaluación/tarea (solo docentes)
export const putActualizarTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const { nombre, descripcion, porcentaje, tipo, fecha_vencimiento, orden } = req.body;

    const evaluacion = await actualizarEvaluacion(Number(tareaId), {
      nombre,
      descripcion,
      porcentaje: porcentaje ? Number(porcentaje) : undefined,
      tipo,
      fecha_vencimiento,
      orden: orden ? Number(orden) : undefined,
    });

    res.json({
      mensaje: "Evaluación actualizada exitosamente",
      data: evaluacion,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/tareas/:tareaId — eliminar una evaluación/tarea (solo docentes)
export const deleteEliminarTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    await eliminarEvaluacion(Number(tareaId));
    res.json({ mensaje: "Evaluación eliminada exitosamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/tareas/:tareaId/calificaciones — asignar nota a un estudiante (solo docentes)
export const postAsignarCalificacion = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const { estudiante_curso_id, nota } = req.body;

    const resultado = await asignarCalificacionEvaluacion({
      configuracion_evaluacion_id: Number(tareaId),
      estudiante_curso_id: Number(estudiante_curso_id),
      nota: Number(nota),
    });

    res.status(201).json({
      mensaje: "Nota asignada exitosamente",
      data: resultado,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/tareas/:tareaId/calificaciones — obtener todas las notas de una evaluación (solo docentes)
export const getCalificacionesPorTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const calificaciones = await obtenerCalificacionesPorEvaluacion(Number(tareaId));
    res.json(calificaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tareas/estudiante/:estudianteCursoId — obtener notas de un estudiante en un curso
export const getCalificacionesEstudiante = async (req, res) => {
  try {
    const { estudianteCursoId } = req.params;
    const calificaciones = await obtenerCalificacionesEstudiantePorCurso(Number(estudianteCursoId));
    res.json(calificaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tareas/notas/:notaId — eliminar una nota/calificación (solo docentes)
export const deleteCalificacion = async (req, res) => {
  try {
    const { notaId } = req.params;
    await eliminarCalificacion(Number(notaId));
    res.json({ mensaje: "Nota eliminada exitosamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

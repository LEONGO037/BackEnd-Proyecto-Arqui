// src/controllers/inscripcion/inscripcion.controller.js
import {
  obtenerCursosDeEstudiante,
  inscribirEstudianteEnCurso,
  desinscribirEstudianteDeCurso,
  obtenerResumenCursosConInscritos,
} from "../../models/inscripcion/inscripcion.model.js";

// GET /api/inscripciones/mis-inscripciones
export const getMisInscripciones = async (req, res) => {
  try {
    const data = await obtenerCursosDeEstudiante(req.usuario.id);
    // Devolver solo los curso_id para que el frontend sepa cuáles están marcados
    res.json(data.map(r => ({ curso_id: r.curso_id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/inscripciones/inscribir  — body: { curso_id }
export const postInscribir = async (req, res) => {
  try {
    const { curso_id } = req.body;
    if (!curso_id) return res.status(400).json({ error: "curso_id es requerido" });
    const resultado = await inscribirEstudianteEnCurso(req.usuario.id, Number(curso_id));
    res.status(201).json({ mensaje: "Inscripción exitosa", data: resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/inscripciones/desinscribir/:cursoId
export const deleteDesinscribir = async (req, res) => {
  try {
    await desinscribirEstudianteDeCurso(req.usuario.id, Number(req.params.cursoId));
    res.json({ mensaje: "Baja exitosa" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ============================================================================
// ADMINISTRACIÓN / INFORMES
// ============================================================================

/**
 * GET /api/inscripciones/resumen
 * Devuelve todos los cursos con su lista de inscritos (utilizado por el
 * panel de gestión de inscripciones en el frontend). Sólo accesible para
 * usuarios con rol ADMIN.
 */
export const getResumenCursos = async (req, res) => {
  try {
    const cursos = await obtenerResumenCursosConInscritos();
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

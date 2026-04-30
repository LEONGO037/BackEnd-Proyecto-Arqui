// src/controllers/inscripcion/inscripcion.controller.js
import {
  obtenerCursosDeEstudiante,
  inscribirEstudianteEnCurso,
  desinscribirEstudianteDeCurso,
  obtenerResumenCursosConInscritos,
} from "../../models/inscripcion/inscripcion.model.js";
import { registrarAuditoriaSegura } from "../../services/auditoria.service.js";

// GET /api/inscripciones/mis-inscripciones
export const getMisInscripciones = async (req, res, next) => {
  try {
    const data = await obtenerCursosDeEstudiante(req.usuario.id);
    res.json(data.map(r => ({ curso_id: r.curso_id })));
  } catch (err) { next(err); }
};

// POST /api/inscripciones/inscribir  — body: { curso_id }
export const postInscribir = async (req, res, next) => {
  try {
    const { curso_id } = req.body;
    if (!curso_id) return res.status(400).json({ error: "curso_id es requerido" });
    const resultado = await inscribirEstudianteEnCurso(req.usuario.id, Number(curso_id));

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "CREATE",
      tabla_afectada: "estudiante_curso",
      registro_id: resultado.id,
      detalle: {
        evento: "INSCRIPCION_CURSO",
        curso_id: Number(curso_id),
        inscripcion_id: resultado.inscripcion_id,
      },
    });

    res.status(201).json({ mensaje: "Inscripción exitosa", data: resultado });
  } catch (err) { next(err); }
};

// DELETE /api/inscripciones/desinscribir/:cursoId
export const deleteDesinscribir = async (req, res, next) => {
  try {
    const cursoId = Number(req.params.cursoId);
    await desinscribirEstudianteDeCurso(req.usuario.id, cursoId);

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "DELETE",
      tabla_afectada: "estudiante_curso",
      detalle: { evento: "DESINSCRIPCION_CURSO", curso_id: cursoId },
    });

    res.json({ mensaje: "Baja exitosa" });
  } catch (err) { next(err); }
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
export const getResumenCursos = async (req, res, next) => {
  try {
    const cursos = await obtenerResumenCursosConInscritos();
    res.json(cursos);
  } catch (err) { next(err); }
};

// src/controllers/cursos/cursos.controller.js
import { CursosModel } from "../../models/cursos/cursos.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";

/**
 * GET /api/cursos
 * Lista todos los cursos activos.
 */
export const getCursos = async (req, res) => {
  try {
    const cursos = await CursosModel.getAll();
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/cursos
 * Crea un curso nuevo con sus prerrequisitos.
 */
export const createCurso = async (req, res) => {
  try {
    const { nombre, descripcion, costo, cupo_maximo, prerrequisitos } = req.body;

    // Validaciones básicas
    if (!nombre || !costo) {
      return res.status(400).json({ error: "Nombre y costo son obligatorios" });
    }

    // Llamada al modelo
    const nuevoCurso = await CursosModel.create({
      nombre,
      descripcion,
      costo,
      cupo_maximo,
      prerrequisitos,
    });

    // Auditoría
    // Se asume que el ID del usuario viene en req.usuario.id desde el middleware verificarToken
    if (req.usuario && req.usuario.id) {
      await registrarAuditoria({
        usuario_id: req.usuario.id,
        accion: "CREATE",
        tabla_afectada: "cursos",
        registro_id: nuevoCurso.id,
        detalle: {
          nombre: nuevoCurso.nombre,
          tiene_prerrequisitos: !!(prerrequisitos && prerrequisitos.length > 0)
        },
      });
    }

    res.status(201).json(nuevoCurso);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/cursos/sin-docente
 * Lista los cursos que no tienen docente asignado.
 */
export const getCursosSinDocente = async (req, res) => {
  try {
    const cursos = await CursosModel.getCursosSinDocente();
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

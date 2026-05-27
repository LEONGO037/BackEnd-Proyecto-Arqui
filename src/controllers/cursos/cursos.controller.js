// src/controllers/cursos/cursos.controller.js
import { CursosModel } from "../../models/cursos/cursos.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";
import { logAplicacion } from "../../services/logger.service.js";

/**
 * GET /api/cursos
 * Lista todos los cursos activos.
 */
export const getAllCursosAdmin = async (req, res) => {
  try {
    const cursos = await CursosModel.getAllAdmin();
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCursoController = async (req, res) => {
  try {
    const { id } = req.params;
    await CursosModel.deleteCurso(id);
    if (req.usuario?.id) {
      await registrarAuditoria({
        usuario_id: req.usuario.id,
        accion: 'DELETE',
        tabla_afectada: 'cursos',
        registro_id: id,
        detalle: {},
      });
    }
    logAplicacion({ nivel: "WARN", modulo: "cursos", evento: "CURSO_ELIMINADO",
      mensaje: `Curso ${id} eliminado`, usuario_id: req.usuario?.id,
      detalle: { curso_id: id }, req }).catch(() => {});
    res.json({ mensaje: 'Curso eliminado correctamente' });
  } catch (err) {
    res.status(err.message === 'Curso no encontrado' ? 404 : 500).json({ error: err.message });
  }
};

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
    const { nombre, descripcion, costo, cupo_maximo, minimo_estudiantes, prerrequisitos } = req.body;

    // Validaciones básicas
    if (!nombre || !costo) {
      return res.status(400).json({ error: "Nombre y costo son obligatorios" });
    }

    if (minimo_estudiantes !== undefined) {
      const minimo = Number(minimo_estudiantes);
      if (!Number.isInteger(minimo) || minimo < 1) {
        return res.status(400).json({ error: "El mínimo de estudiantes debe ser un entero mayor o igual a 1" });
      }

      if (cupo_maximo !== undefined && cupo_maximo !== null) {
        const cupo = Number(cupo_maximo);
        if (Number.isFinite(cupo) && minimo > cupo) {
          return res.status(400).json({ error: "El mínimo de estudiantes no puede ser mayor al cupo máximo" });
        }
      }
    }

    // Llamada al modelo
    const nuevoCurso = await CursosModel.create({
      nombre,
      descripcion,
      costo,
      cupo_maximo,
      minimo_estudiantes,
      prerrequisitos,
    });

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
    logAplicacion({ nivel: "INFO", modulo: "cursos", evento: "CURSO_CREADO",
      mensaje: `Curso creado: ${nuevoCurso.nombre}`, usuario_id: req.usuario?.id,
      detalle: { curso_id: nuevoCurso.id, nombre: nuevoCurso.nombre, costo }, req }).catch(() => {});

    res.status(201).json(nuevoCurso);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/cursos/:id/minimo-estudiantes
 * Define o actualiza el mínimo de estudiantes requeridos para un curso.
 */
export const actualizarMinimoEstudiantesCurso = async (req, res) => {
  try {
    const cursoId = Number(req.params.id);
    const minimo = Number(req.body.minimo_estudiantes);

    if (!Number.isInteger(cursoId) || cursoId <= 0) {
      return res.status(400).json({ error: "ID de curso inválido" });
    }

    if (!Number.isInteger(minimo) || minimo < 1) {
      return res.status(400).json({ error: "El mínimo de estudiantes debe ser un entero mayor o igual a 1" });
    }

    const cursoActualizado = await CursosModel.updateMinimoEstudiantes(cursoId, minimo);

    if (!cursoActualizado) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    if (req.usuario && req.usuario.id) {
      await registrarAuditoria({
        usuario_id: req.usuario.id,
        accion: "UPDATE",
        tabla_afectada: "cursos",
        registro_id: cursoActualizado.id,
        detalle: { minimo_estudiantes: cursoActualizado.minimo_estudiantes },
      });
    }
    logAplicacion({ nivel: "INFO", modulo: "cursos", evento: "MINIMO_ESTUDIANTES_ACTUALIZADO",
      mensaje: `Curso ${cursoId}: mínimo ajustado a ${minimo}`, usuario_id: req.usuario?.id,
      detalle: { curso_id: cursoId, minimo_estudiantes: minimo }, req }).catch(() => {});

    res.json(cursoActualizado);
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
export const validarInscripcionCurso = async (req, res) => {
  try {

    const estudiante_id = req.usuario.id;
    const { curso_id } = req.params;

    const resultado = await CursosModel.validarPrerrequisitos(
  estudiante_id,
  curso_id
);

    if (!resultado.permitido) {
  return res.status(403).json({
    mensaje: `Debes aprobar primero el curso: ${resultado.curso_faltante}`
  });
}

    res.json({
      mensaje: "Prerrequisitos cumplidos. Puedes inscribirte."
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const updateCurso = async (req, res) => {

  try {

    const { id } = req.params;

    const cursoActualizado = await CursosModel.update(id, req.body);

    await registrarAuditoria({
      usuario_id: req.usuario.id,
      accion: "UPDATE",
      tabla_afectada: "cursos",
      registro_id: id,
      detalle: req.body
    });
    logAplicacion({ nivel: "INFO", modulo: "cursos", evento: "CURSO_ACTUALIZADO",
      mensaje: `Curso ${id} actualizado`, usuario_id: req.usuario?.id,
      detalle: { curso_id: id, cambios: req.body }, req }).catch(() => {});

    res.json({
      mensaje: "Curso actualizado correctamente",
      data: cursoActualizado
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updatePrerrequisitos = async (req,res)=>{

  try{

    const { id } = req.params;
    const { prerrequisitos } = req.body;

    const resultado = await CursosModel.updatePrerrequisitos(
      id,
      prerrequisitos
    );

    await registrarAuditoria({
      usuario_id: req.usuario.id,
      accion: "UPDATE",
      tabla_afectada: "curso_prerrequisitos",
      registro_id: id,
      detalle: { prerrequisitos }
    });
    logAplicacion({ nivel: "INFO", modulo: "cursos", evento: "PRERREQUISITOS_ACTUALIZADOS",
      mensaje: `Prerrequisitos del curso ${id} actualizados`, usuario_id: req.usuario?.id,
      detalle: { curso_id: id, prerrequisitos }, req }).catch(() => {});

    res.json({
      mensaje: "Prerrequisitos actualizados",
      data: resultado
    });

  }catch(err){
    res.status(400).json({ error: err.message });
  }

};
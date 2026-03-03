import {
  obtenerCursosPorDocente,
  actualizarEstadoCursoDocente,
  obtenerEstadoActual
} from "../../models/docente/curso.js";

export const listarCursosDocente = async (usuario_id) => {

  if (!usuario_id) {
    throw new Error("Usuario inválido");
  }

  return await obtenerCursosPorDocente(usuario_id);
};

export const cambiarEstadoCurso = async (usuario_id, curso_id, nuevoEstado) => {

  const estadosValidos = ["NO_ACTIVO", "ACTIVO", "FINALIZADO"];

  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error("Estado inválido");
  }

  const estadoActualObj = await obtenerEstadoActual(usuario_id, curso_id);

  if (!estadoActualObj) {
    throw new Error("Curso no encontrado o no pertenece al docente");
  }

  const estadoActual = estadoActualObj.estado;

  // REGLAS DE TRANSICIÓN
  if (estadoActual === "FINALIZADO") {
    throw new Error("Curso ya finalizado, no puede modificarse");
  }

  if (estadoActual === "NO_ACTIVO" && nuevoEstado === "FINALIZADO") {
    throw new Error("Debe activarse antes de finalizarse");
  }

  const resultado = await actualizarEstadoCursoDocente(
    usuario_id,
    curso_id,
    nuevoEstado
  );

  return resultado;
};
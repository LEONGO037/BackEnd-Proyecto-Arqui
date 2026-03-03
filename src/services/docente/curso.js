import {
  obtenerCursosPorDocente,
  actualizarEstadoCursoDocente
} from "../../models/docente/curso.js";

export const listarCursosDocente = async (usuario_id) => {

  if (!usuario_id) {
    throw new Error("Usuario inválido");
  }

  return await obtenerCursosPorDocente(usuario_id);
};

export const cambiarEstadoCurso = async (usuario_id, curso_id, activo) => {

  if (activo !== true && activo !== false) {
    throw new Error("Estado inválido");
  }

  const resultado = await actualizarEstadoCursoDocente(
    usuario_id,
    curso_id,
    activo
  );

  if (!resultado) {
    throw new Error("Curso no encontrado o no pertenece al docente");
  }

  return resultado;
};
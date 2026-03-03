import {
  obtenerCursosPorDocente,
  actualizarEstadoCursoDocente,
  obtenerEstudiantesPorCurso,
  actualizarNotasEstudiantes,
  obtenerMetricasCurso
} from "../../models/docente/curso.js";

export const listarCursosDocente = async (usuario_id) => {

  if (!usuario_id) {
    throw new Error("Usuario inválido");
  }

  return await obtenerCursosPorDocente(usuario_id);
};

export const cambiarEstadoCurso = async (usuario_id, curso_id, estado_curso) => {

  const estadosValidos = ['NO ACTIVO', 'ACTIVO', 'FINALIZADO'];
  
  if (!estadosValidos.includes(estado_curso)) {
    throw new Error("Estado inválido. Debe ser: NO ACTIVO, ACTIVO, FINALIZADO");
  }

  const resultado = await actualizarEstadoCursoDocente(
    usuario_id,
    curso_id,
    estado_curso
  );

  if (!resultado) {
    throw new Error("Curso no encontrado o no pertenece al docente");
  }

  return resultado;
};

export const obtenerEstudiantes = async (usuario_id, curso_id) => {

  if (!usuario_id || !curso_id) {
    throw new Error("Parámetros inválidos");
  }

  return await obtenerEstudiantesPorCurso(usuario_id, curso_id);
};

export const guardarNotas = async (usuario_id, curso_id, notas) => {

  if (!usuario_id || !curso_id || !Array.isArray(notas)) {
    throw new Error("Parámetros inválidos");
  }

  // Validar cada nota
  for (const nota of notas) {
    if (typeof nota.estudiante_curso_id !== "number") {
      throw new Error("Formato de notas inválido: falta estudiante_curso_id");
    }

    if (nota.nota_final === undefined) {
      throw new Error(`Nota faltante para estudiante ${nota.estudiante_curso_id}`);
    }

    if (nota.nota_final !== null && (nota.nota_final < 0 || nota.nota_final > 100)) {
      throw new Error(`Nota inválida para estudiante ${nota.estudiante_curso_id}`);
    }
  }

  return await actualizarNotasEstudiantes(usuario_id, curso_id, notas);
};

export const obtenerMetricas = async (usuario_id, curso_id) => {

  if (!usuario_id || !curso_id) {
    throw new Error("Parámetros inválidos");
  }

  return await obtenerMetricasCurso(usuario_id, curso_id);
};
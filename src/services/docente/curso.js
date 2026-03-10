import {
  obtenerCursosPorDocente,
  actualizarEstadoCursoDocente,
  obtenerEstadoActual,
  obtenerDatosMinimosInicio
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

  if (estadoActual === "NO_ACTIVO" && nuevoEstado === "ACTIVO") {
    const datosInicio = await obtenerDatosMinimosInicio(usuario_id, curso_id);

    if (!datosInicio) {
      throw new Error("Curso no encontrado o no pertenece al docente");
    }

    const inscritos = Number(datosInicio.inscritos || 0);
    const minimoEstudiantes = Number(datosInicio.minimo_estudiantes || 1);

    if (inscritos < minimoEstudiantes) {
      throw new Error(`No se puede iniciar el curso. Inscritos actuales: ${inscritos}. Mínimo requerido: ${minimoEstudiantes}.`);
    }
  }

  const resultado = await actualizarEstadoCursoDocente(
    usuario_id,
    curso_id,
    nuevoEstado
  );

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
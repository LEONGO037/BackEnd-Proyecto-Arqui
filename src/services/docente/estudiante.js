import { obtenerEstudiantesCurso,actualizarNotaFinal } from "../../models/docente/estudiante.js";

export const listarEstudiantesCurso = async (docente_id, curso_id) => {

  if (!curso_id) {
    throw new Error("Curso inválido");
  }

  return await obtenerEstudiantesCurso(docente_id, curso_id);
};

export const registrarNotaFinal = async (
  docente_id,
  estudiante_id,
  curso_id,
  nota
) => {

  if (nota < 0 || nota > 100) {
    throw new Error("Nota debe estar entre 0 y 100");
  }

  const resultado = await actualizarNotaFinal(
    docente_id,
    estudiante_id,
    curso_id,
    nota
  );

  if (!resultado) {
    throw new Error("No autorizado o estudiante no pertenece al curso");
  }

  return resultado;
};
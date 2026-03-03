import {
  contarCursosActivos,
  contarEstudiantesCursosActivos
} from "../../models/docente/curso.estudiante.js";

export const obtenerCantidadCursosActivos = async (usuario_id) => {
  return await contarCursosActivos(usuario_id);
};

export const obtenerCantidadEstudiantes = async (usuario_id) => {
  return await contarEstudiantesCursosActivos(usuario_id);
};
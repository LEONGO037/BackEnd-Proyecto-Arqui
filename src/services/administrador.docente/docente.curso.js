import { asignarCurso } from "../../models/administrador.docente/docente.curso.js";

export const asignarCursoDocente = async (usuario_id, curso_id) => {
  return await asignarCurso(usuario_id, curso_id);
};
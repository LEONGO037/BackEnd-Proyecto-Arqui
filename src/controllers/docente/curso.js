import {
  listarCursosDocente,
  cambiarEstadoCurso
} from "../../services/docente/curso.js";

export const verMisCursos = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;

    const cursos = await listarCursosDocente(usuario_id);

    res.json(cursos);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarEstado = async (req, res) => {
  try {

    const usuario_id = req.usuario.id;
    const { curso_id, estado } = req.body;

    const resultado = await cambiarEstadoCurso(
      usuario_id,
      curso_id,
      estado
    );

    res.json({
      mensaje: "Estado actualizado correctamente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
import { asignarCursoDocente } from "../../services/administrador.docente/docente.curso.js";

export const asignarCursoAdmin = async (req, res) => {
  try {

    const { usuario_id, curso_id } = req.body;

    const resultado = await asignarCursoDocente(usuario_id, curso_id);

    res.status(201).json({
      mensaje: "Curso asignado al docente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
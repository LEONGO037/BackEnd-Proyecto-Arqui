import { listarEstudiantesCurso,registrarNotaFinal } from "../../services/docente/estudiante.js";
import { registrarAuditoriaSegura } from "../../services/auditoria.service.js";

export const verEstudiantesCurso = async (req, res) => {

  try {

    const docente_id = req.usuario.id;
    const { curso_id } = req.params;

    const estudiantes = await listarEstudiantesCurso(
      docente_id,
      curso_id
    );

    res.json(estudiantes);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const registrarNota = async (req, res) => {

  try {

    const docente_id = req.usuario.id;
    const { curso_id, estudiante_id } = req.params;
    const { nota } = req.body;

    const resultado = await registrarNotaFinal(
      docente_id,
      estudiante_id,
      curso_id,
      nota
    );

    await registrarAuditoriaSegura({
      usuario_id: docente_id,
      accion: "UPDATE",
      tabla_afectada: "estudiante_curso",
      registro_id: resultado.id,
      detalle: {
        evento: "REGISTRO_NOTA_FINAL_DOCENTE",
        curso_id: Number(curso_id),
        estudiante_id: Number(estudiante_id),
        nota: Number(nota),
      },
    });

    res.json({
      mensaje: "Nota registrada correctamente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
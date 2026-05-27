import { asignarCursoDocente } from "../../services/administrador.docente/docente.curso.js";
import { registrarAuditoriaSegura } from "../../services/auditoria.service.js";
import { logApp } from "../../services/logService.js";

export const asignarCursoAdmin = async (req, res) => {
  try {

    const { usuario_id, curso_id } = req.body;

    const resultado = await asignarCursoDocente(usuario_id, curso_id);

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "CREATE",
      tabla_afectada: "docente_curso",
      registro_id: resultado.id,
      detalle: {
        evento: "ASIGNAR_CURSO_DOCENTE",
        docente_id: Number(usuario_id),
        curso_id: Number(curso_id),
      },
    });
    logApp({ nivel: "INFO", modulo: "admin.docentes", evento: "CURSO_ASIGNADO_DOCENTE",
      mensaje: `Curso ${curso_id} asignado al docente ${usuario_id}`, usuario_id: req.usuario.id,
      detalle: { docente_id: Number(usuario_id), curso_id: Number(curso_id) }, req });

    res.status(201).json({
      mensaje: "Curso asignado al docente",
      resultado
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
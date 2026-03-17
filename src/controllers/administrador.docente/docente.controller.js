import {
  registrarDocente,
  listarDocentes,
  actualizarDocentePorAdmin,
} from "../../services/administrador.docente/docente.service.js";
import { registrarAuditoriaSegura } from "../../services/auditoria.service.js";

export const crearDocenteAdmin = async (req, res) => {
  try {

    const docente = await registrarDocente(req.body);

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "CREATE",
      tabla_afectada: "usuarios",
      registro_id: docente.id,
      detalle: {
        evento: "CREAR_DOCENTE",
        docente_email: docente.email,
      },
    });

    res.status(201).json({
      mensaje: "Docente creado correctamente",
      docente
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const verDocentes = async (req, res) => {

  try {

    const docentes = await listarDocentes();

    res.json(docentes);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarDocenteAdmin = async (req, res) => {
  try {
    const docenteId = Number(req.params.id);

    if (Number.isNaN(docenteId)) {
      return res.status(400).json({ error: "ID de docente inválido" });
    }

    const docenteActualizado = await actualizarDocentePorAdmin(docenteId, req.body);

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "UPDATE",
      tabla_afectada: "usuarios",
      registro_id: docenteId,
      detalle: {
        evento: "ACTUALIZAR_DOCENTE",
        docente_id: docenteId,
      },
    });

    res.json({
      mensaje: "Docente actualizado correctamente",
      docente: docenteActualizado,
    });
  } catch (error) {
    const status = error.message.includes("no encontrado") ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};
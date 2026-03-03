import { registrarDocente,listarDocentes } from "../../services/administrador.docente/docente.service.js";

export const crearDocenteAdmin = async (req, res) => {
  try {

    const docente = await registrarDocente(req.body);

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
import {
    obtenerCantidadCursosActivos,obtenerCantidadEstudiantes 
} from "../../services/docente/curso.estudiante.js";
export const cantidadCursosActivos = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const cantidad = await obtenerCantidadCursosActivos(usuario_id);

    res.json({ cantidad: Number(cantidad) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cantidadEstudiantesActivos = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const cantidad = await obtenerCantidadEstudiantes(usuario_id);

    res.json({ cantidad_estudiantes: Number(cantidad) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
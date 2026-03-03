import bcrypt from "bcrypt";
import { obtenerRolDocente, crearDocente } from "../../models/administrador.docente/docente.modelo.js";

export const registrarDocente = async (datos) => {

  const rol = await obtenerRolDocente();

  if (!rol) {
    throw new Error("Rol DOCENTE no existe");
  }

  const passwordEncriptado = await bcrypt.hash(datos.password, 10);

  return await crearDocente({
    ...datos,
    password_hash: passwordEncriptado,
    rol_id: rol.id
  });
};
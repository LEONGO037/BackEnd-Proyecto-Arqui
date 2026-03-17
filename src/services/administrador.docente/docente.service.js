import bcrypt from "bcrypt";
import {
  obtenerRolDocente,
  crearDocente,
  obtenerDocentes,
  actualizarDocente,
} from "../../models/administrador.docente/docente.modelo.js";

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
export const listarDocentes = async () => {
  return await obtenerDocentes();
};

export const actualizarDocentePorAdmin = async (docenteId, datos) => {
  const payload = {
    nombre: (datos.nombre || "").trim(),
    apellido_paterno: (datos.apellido_paterno || "").trim(),
    apellido_materno: (datos.apellido_materno || "").trim(),
    ci_nit: (datos.ci_nit || "").trim(),
    email: (datos.email || "").trim(),
    telefono: (datos.telefono || "").trim(),
    direccion: (datos.direccion || "").trim(),
  };

  if (!payload.nombre || !payload.apellido_paterno || !payload.ci_nit || !payload.email) {
    throw new Error("Nombre, apellido paterno, C.I./NIT y correo son obligatorios");
  }

  return await actualizarDocente(docenteId, payload);
};
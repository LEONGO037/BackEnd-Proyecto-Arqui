import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  obtenerRolDocente,
  crearDocente,
  obtenerDocentes,
  actualizarDocente,
} from "../../models/administrador.docente/docente.modelo.js";
import {
  enviarEmail,
  emailDocenteBienvenida,
} from "../email.service.js";

const hashCodigo = (codigo) =>
  crypto.createHash("sha256").update(codigo).digest("hex");

const generarCodigo6 = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generarPasswordDefault = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const registrarDocente = async (datos) => {
  const rol = await obtenerRolDocente();
  if (!rol) throw new Error("Rol DOCENTE no existe");

  const passwordDefault = generarPasswordDefault();
  const passwordHash = await bcrypt.hash(passwordDefault, 12);

  const codigo = generarCodigo6();
  const codigoHash = hashCodigo(codigo);
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h para que el admin tenga tiempo

  const docente = await crearDocente({
    ...datos,
    password_hash: passwordHash,
    rol_id: rol.id,
    codigo_verificacion: codigoHash,
    codigo_verificacion_expira: expira,
  });

  // Enviar correo con OTP + contraseña temporal
  enviarEmail({
    to: datos.email,
    subject: "Tu cuenta de docente — College X Nexus",
    html: emailDocenteBienvenida({
      nombre: datos.nombre,
      email: datos.email,
      codigo,
      passwordDefault,
    }),
  }).catch(() => {});

  return docente;
};

export const listarDocentes = async () => obtenerDocentes();

export const actualizarDocentePorAdmin = async (docenteId, datos) => {
  const payload = {
    nombre: (datos.nombre || "").trim(),
    apellido_paterno: (datos.apellido_paterno || "").trim(),
    apellido_materno: (datos.apellido_materno || "").trim(),
    email: (datos.email || "").trim(),
  };

  if (!payload.nombre || !payload.apellido_paterno || !payload.email) {
    throw new Error("Nombre, apellido paterno y correo son obligatorios");
  }

  return await actualizarDocente(docenteId, payload);
};

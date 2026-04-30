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

export const generarPasswordDefault = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@#$!%*?&_-";
  const allChars = upper + lower + numbers + special;

  // Asegurar al menos uno de cada tipo
  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Rellenar hasta 12
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

export const registrarDocente = async (datos) => {
  const rol = await obtenerRolDocente();
  if (!rol) throw new Error("Rol DOCENTE no existe");

  const passwordDefault = generarPasswordDefault();
  const passwordHash = await bcrypt.hash(passwordDefault, 12);

  const docente = await crearDocente({
    ...datos,
    password_hash: passwordHash,
    rol_id: rol.id,
  });

  // Enviar correo con OTP + contraseña temporal
  enviarEmail({
    to: datos.email,
    subject: "Tu cuenta de docente — College X Nexus",
    html: emailDocenteBienvenida({
      nombre: datos.nombre,
      email: datos.email,
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

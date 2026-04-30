import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  obtenerUsuarioPorEmailConRol,
  obtenerRolPorNombre,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorIdConRol,
  actualizarPasswordUsuario,
  incrementarIntentosFallidos,
  resetearIntentosFallidos,
  obtenerHistorialPasswords,
  insertarHistorialPassword,
  crearUsuarioConVerificacion,
  verificarCodigoOTP,
  obtenerUsuarioPorResetToken,
  guardarResetToken,
  limpiarResetToken,
  registrarLoginExitoso,
  contarLoginsRecientes,
} from "../models/usuario.modelo.js";
import {
  validarCredencialesLogin,
  validarRegistroEstudiante,
  validarCambioPassword,
  validarPasswordFuerte,
} from "../validators/autenticacion.validator.js";
import { getRolePermissions } from "../models/permiso.modelo.js";
import {
  enviarEmail,
  emailVerificacionCodigo,
  emailActividadSospechosa,
  emailResetPassword,
  emailResetPasswordCodigo,
} from "./email.service.js";

const SALT_ROUNDS = 12;

const hashCodigo = (codigo) =>
  crypto.createHash("sha256").update(codigo).digest("hex");

const generarCodigo6 = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const firmarToken = (usuario, permisos) =>
  jwt.sign(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol_nombre || usuario.rol,
      rol_id: usuario.rol_id,
      permisos,
      debe_cambiar_password: !!usuario.debe_cambiar_password,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h", audience: "college-x-nexus", issuer: "ucb-api" }
  );

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const iniciarSesion = async (email, password) => {
  validarCredencialesLogin({ email, password });

  // Delay anti-timing
  await new Promise((r) => setTimeout(r, 300));

  const usuario = await obtenerUsuarioPorEmailConRol(email);
  if (!usuario) throw new Error("Credenciales inválidas");

  // Cuenta bloqueada (5+ intentos fallidos)
  if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
    throw new Error(
      "Tu cuenta está bloqueada. Contacta al administrador para el desbloqueo o espera 24 horas."
    );
  }

  // Email no verificado
  if (!usuario.email_verificado) {
    throw new Error(
      "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
    );
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    await incrementarIntentosFallidos(usuario.id);
    throw new Error("Credenciales inválidas");
  }

  // Contraseña vencida (90 días)
  const diasDesdeCambio =
    (Date.now() - new Date(usuario.password_cambiado_en)) / 86400000;
  if (diasDesdeCambio > 90) {
    // Devolvemos token pero marcamos expirada
    const permisos = await getRolePermissions(usuario.rol_id);
    const token = firmarToken({ ...usuario, debe_cambiar_password: true }, permisos);
    await resetearIntentosFallidos(usuario.id);
    return {
      expirada: true,
      debe_cambiar: true,
      mensaje: "Tu contraseña ha vencido (más de 90 días). Debes cambiarla.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol_nombre,
        rol_id: usuario.rol_id,
      },
    };
  }

  await resetearIntentosFallidos(usuario.id);

  // Registrar login y detectar actividad sospechosa
  await registrarLoginExitoso(usuario.id);
  const loginsRecientes = await contarLoginsRecientes(usuario.id, 15);
  if (loginsRecientes >= 3) {
    const fecha = new Date().toLocaleString("es-BO", { timeZone: "America/La_Paz" });
    enviarEmail({
      to: usuario.email,
      subject: "⚠️ Actividad sospechosa — College X Nexus",
      html: emailActividadSospechosa({ nombre: usuario.nombre, email: usuario.email, fecha }),
    }).catch(() => {});
  }

  const permisos = await getRolePermissions(usuario.rol_id);

  // Si debe cambiar contraseña (docentes nuevos)
  if (usuario.debe_cambiar_password) {
    const token = firmarToken(usuario, permisos);
    return {
      debe_cambiar: true,
      mensaje: "Debes cambiar tu contraseña antes de continuar.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol_nombre,
        rol_id: usuario.rol_id,
      },
    };
  }

  const token = firmarToken(usuario, permisos);

  return {
    mensaje: "Inicio de sesión exitoso",
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol_nombre,
      rol_id: usuario.rol_id,
    },
  };
};

// ─── REGISTRO ESTUDIANTE ──────────────────────────────────────────────────────

export const registrarEstudiante = async (datos) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    ci_nit, telefono, direccion, email, password,
  } = datos;

  validarRegistroEstudiante({ nombre, apellido_paterno, email, password });

  const usuarioExistente = await obtenerUsuarioPorEmail(email);
  if (usuarioExistente) throw new Error("El correo electrónico ya está registrado");

  const rol = await obtenerRolPorNombre("ESTUDIANTE");
  if (!rol) throw new Error("El rol ESTUDIANTE no existe en la base de datos");

  const passwordEncriptado = await bcrypt.hash(password, SALT_ROUNDS);

  const codigo = generarCodigo6();
  const codigoHash = hashCodigo(codigo);
  const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  const nuevoUsuario = await crearUsuarioConVerificacion({
    nombre,
    apellido_paterno,
    apellido_materno: apellido_materno || "",
    ci_nit: ci_nit || null,
    telefono: telefono || null,
    direccion: direccion || null,
    email,
    password_hash: passwordEncriptado,
    rol_id: rol.id,
    codigo_verificacion: codigoHash,
    codigo_verificacion_expira: expira,
  });

  await enviarEmail({
    to: email,
    subject: "Verifica tu correo — College X Nexus",
    html: emailVerificacionCodigo({ nombre, codigo }),
  });

  return {
    mensaje:
      "Registro exitoso. Ingresa el código de 6 dígitos que enviamos a tu correo para verificar tu cuenta.",
    usuario: nuevoUsuario,
  };
};

// ─── VERIFICAR CODIGO OTP ─────────────────────────────────────────────────────

export const verificarCodigoEmail = async (email, codigo) => {
  if (!email || !codigo) throw new Error("Correo y código son requeridos");
  const codigoHash = hashCodigo(String(codigo).trim());
  const usuario = await verificarCodigoOTP(email, codigoHash);
  if (!usuario) throw new Error("Código inválido o expirado");
  return { mensaje: "Correo verificado correctamente. Ya puedes iniciar sesión." };
};

// ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────────────────────

export const cambiarPassword = async (usuarioId, passwordActual, nuevaPassword) => {
  validarCambioPassword({
    password_actual: passwordActual,
    nueva_password: nuevaPassword,
  });

  const usuario = await obtenerUsuarioPorIdConRol(usuarioId);
  if (!usuario) throw new Error("Usuario no encontrado");

  const passwordValido = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValido) throw new Error("La contraseña actual es incorrecta");

  const historial = await obtenerHistorialPasswords(usuarioId, 5);
  for (const hash of historial) {
    if (await bcrypt.compare(nuevaPassword, hash)) {
      throw new Error("No puede reutilizar una de sus últimas 5 contraseñas");
    }
  }

  const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  const usuarioActualizado = await actualizarPasswordUsuario(usuarioId, nuevoHash);
  if (!usuarioActualizado) throw new Error("No se pudo actualizar la contraseña");

  await insertarHistorialPassword(usuarioId, nuevoHash);

  // Emitir nuevo JWT sin el flag debe_cambiar_password
  const permisos = await getRolePermissions(usuarioActualizado.rol_id);
  const token = firmarToken(
    { ...usuarioActualizado, rol_nombre: usuario.rol_nombre, debe_cambiar_password: false },
    permisos
  );

  return {
    usuario: {
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      email: usuarioActualizado.email,
      rol: usuario.rol_nombre,
      rol_id: usuarioActualizado.rol_id,
    },
    token,
  };
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export const solicitarResetPassword = async (email) => {
  const GENERIC_MSG =
    "Si el correo existe, recibirás el código en tu correo electrónico.";

  await new Promise((r) => setTimeout(r, 300));

  const usuario = await obtenerUsuarioPorEmail(email);
  if (!usuario) return { mensaje: GENERIC_MSG };

  const codigo = generarCodigo6();
  const codigoHash = hashCodigo(codigo);
  const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await guardarResetToken(usuario.id, codigoHash, expira);

  enviarEmail({
    to: email,
    subject: "Código para restablecer contraseña — College X Nexus",
    html: emailResetPasswordCodigo({ nombre: usuario.nombre, codigo }),
  }).catch(() => {});

  return { mensaje: GENERIC_MSG };
};

export const verificarCodigoReset = async (email, codigo) => {
  if (!email || !codigo) throw new Error("Correo y código son requeridos");

  const codigoHash = hashCodigo(String(codigo).trim());
  const usuario = await obtenerUsuarioPorResetToken(codigoHash);
  if (!usuario || usuario.email !== email)
    throw new Error("Código inválido o expirado");

  // Código correcto: emitir token temporal para el paso final de nueva contraseña
  const tokenPlano = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");
  const expira = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await guardarResetToken(usuario.id, tokenHash, expira);

  return { token: tokenPlano };
};

export const resetPassword = async (tokenPlano, nuevaPassword) => {
  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");
  const usuario = await obtenerUsuarioPorResetToken(tokenHash);
  if (!usuario) throw new Error("Token inválido o expirado");

  validarPasswordFuerte(nuevaPassword);

  const historial = await obtenerHistorialPasswords(usuario.id, 5);
  for (const hash of historial) {
    if (await bcrypt.compare(nuevaPassword, hash)) {
      throw new Error("No puede reutilizar una de sus últimas 5 contraseñas");
    }
  }

  const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  await actualizarPasswordUsuario(usuario.id, nuevoHash);
  await insertarHistorialPassword(usuario.id, nuevoHash);
  await limpiarResetToken(usuario.id);

  return { mensaje: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." };
};
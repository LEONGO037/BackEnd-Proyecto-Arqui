import {
  registrarEstudiante,
  iniciarSesion,
  cambiarPassword as cambiarPasswordServicio,
  verificarCodigoEmail,
  solicitarResetPassword,
  verificarCodigoReset as verificarCodigoResetServicio,
  resetPassword,
} from "../services/autenticacion.servicio.js";
import { registrarAuditoriaSegura } from "../services/auditoria.service.js";
import { getRolePermissions } from "../models/permiso.modelo.js";

export const registrar = async (req, res, next) => {
  try {
    const resultado = await registrarEstudiante(req.body);
    await registrarAuditoriaSegura({
      usuario_id: resultado.usuario?.id || null,
      accion: "CREATE",
      tabla_afectada: "usuarios",
      registro_id: resultado.usuario?.id || null,
      detalle: { evento: "REGISTRO_USUARIO", email: resultado.usuario?.email },
    });
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const resultado = await iniciarSesion(email, password);

    if (resultado.expirada || resultado.debe_cambiar) {
      return res.status(200).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    const msg = error.message || "Credenciales inválidas";
    const status =
      msg.includes("bloqueada") ? 423 :
        msg.includes("verificar") ? 403 : 401;
    res.status(status).json({ error: msg });
  }
};

export const verificarCodigo = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;
    const resultado = await verificarCodigoEmail(email, codigo);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cambiarPassword = async (req, res, next) => {
  try {
    const { password_actual, nueva_password } = req.body;
    const resultado = await cambiarPasswordServicio(
      req.usuario.id,
      password_actual,
      nueva_password
    );
    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "UPDATE",
      tabla_afectada: "usuarios",
      registro_id: req.usuario.id,
      detalle: { evento: "CAMBIO_PASSWORD", rol: req.usuario.rol },
    });
    res.json({
      mensaje: "Contraseña actualizada correctamente",
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    const status = error.message === "La contraseña actual es incorrecta" ? 401 : 400;
    res.status(status).json({ error: error.message });
  }
};

export const solicitarReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    const resultado = await solicitarResetPassword(email);
    res.json(resultado);
  } catch (error) {
    console.error("Error al solicitar reset de contraseña:", error);
    res.status(500).json({ error: "No se pudo enviar el correo de restablecimiento. Intenta nuevamente." });
  }
};

export const verificarCodigoReset = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) return res.status(400).json({ error: "Email y código son requeridos" });
    const resultado = await verificarCodigoResetServicio(email, codigo);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resetearPassword = async (req, res, next) => {
  try {
    const { token, nueva_password } = req.body;
    if (!token || !nueva_password) {
      return res.status(400).json({ error: "Token y nueva_password son requeridos" });
    }
    const resultado = await resetPassword(token, nueva_password);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const perfil = async (req, res, next) => {
  try {
    const permisos = await getRolePermissions(req.usuario.rol_id);
    res.json({
      usuario: {
        id: req.usuario.id,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol,
        rol_id: req.usuario.rol_id,
      },
      permisos,
    });
  } catch (error) {
    next(error);
  }
};
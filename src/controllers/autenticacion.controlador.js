import {
  registrarEstudiante,
  iniciarSesion,
  cambiarPassword as cambiarPasswordServicio,
  verificarCodigoEmail,
  solicitarResetPassword,
  verificarCodigoReset as verificarCodigoResetServicio,
  resetPassword,
  reenviarCodigoVerificacion,
  verificarTokenEmail,
} from "../services/autenticacion.servicio.js";
import { registrarAuditoriaSegura } from "../services/auditoria.service.js";
import { logSeguridad } from "../services/logger.service.js";
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

    // El registro de usuario se audita en log_seguridad (evento de sesión/acceso)
    logSeguridad({
      evento: "USUARIO_REGISTRADO",
      exito: true,
      usuario_id: resultado.usuario?.id || null,
      email: resultado.usuario?.email || null,
      req,
      detalle: { email: resultado.usuario?.email },
    }).catch(() => { });

    res.status(201).json(resultado);
  } catch (error) {
    logSeguridad({
      evento: "REGISTRO_FALLIDO",
      exito: false,
      email: req.body?.email || null,
      req,
      detalle: { razon: error.message },
    }).catch(() => { });

    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const resultado = await iniciarSesion(email, password);

    if (resultado.expirada || resultado.debe_cambiar) {
      logSeguridad({
        evento: "LOGIN_EXITOSO_CAMBIO_PASSWORD",
        exito: true,
        usuario_id: resultado.usuario?.id || null,
        email,
        req,
        detalle: { motivo: resultado.expirada ? "PASSWORD_EXPIRADO" : "PRIMER_LOGIN" },
      }).catch(() => { });

      return res.status(200).json(resultado);
    }

    logSeguridad({
      evento: "LOGIN_EXITOSO",
      exito: true,
      usuario_id: resultado.usuario?.id || null,
      email,
      req,
    }).catch(() => { });

    res.json(resultado);
  } catch (error) {
    const msg = error.message || "Credenciales inválidas";
    const status =
      msg.includes("bloqueada") ? 423 :
        msg.includes("verificar") ? 403 : 401;

    logSeguridad({
      evento: status === 423 ? "LOGIN_BLOQUEADO" : "LOGIN_FALLIDO",
      exito: false,
      email,
      req,
      detalle: { motivo: msg },
    }).catch(() => { });

    res.status(status).json({ error: msg });
  }
};

export const verificarCodigo = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;
    const resultado = await verificarCodigoEmail(email, codigo);

    logSeguridad({
      evento: "EMAIL_VERIFICADO",
      exito: true,
      email,
      req,
    }).catch(() => { });

    res.json(resultado);
  } catch (error) {
    logSeguridad({
      evento: "EMAIL_VERIFICACION_FALLIDA",
      exito: false,
      email: req.body?.email,
      req,
      detalle: { motivo: error.message },
    }).catch(() => { });

    res.status(400).json({ error: error.message });
  }
};

export const verificarTokenLink = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "El token de verificación es requerido" });
    }
    const resultado = await verificarTokenEmail(token);

    logSeguridad({
      evento: "EMAIL_VERIFICADO_LINK",
      exito: true,
      req,
      detalle: { token }
    }).catch(() => { });

    res.json(resultado);
  } catch (error) {
    logSeguridad({
      evento: "EMAIL_VERIFICACION_LINK_FALLIDA",
      exito: false,
      req,
      detalle: { token: req.query?.token, motivo: error.message },
    }).catch(() => { });

    res.status(400).json({ error: error.message });
  }
};

export const reenviarCodigo = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    const resultado = await reenviarCodigoVerificacion(email);
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

    logSeguridad({
      evento: "CAMBIO_PASSWORD",
      exito: true,
      usuario_id: req.usuario.id,
      email: req.usuario.email,
      req,
    }).catch(() => { });

    res.json({
      mensaje: "Contraseña actualizada correctamente",
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    const status = error.message === "La contraseña actual es incorrecta" ? 401 : 400;

    logSeguridad({
      evento: "CAMBIO_PASSWORD_FALLIDO",
      exito: false,
      usuario_id: req.usuario?.id,
      email: req.usuario?.email,
      req,
      detalle: { motivo: error.message },
    }).catch(() => { });

    res.status(status).json({ error: error.message });
  }
};

export const solicitarReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    const resultado = await solicitarResetPassword(email);

    logSeguridad({
      evento: "RESET_PASSWORD_SOLICITADO",
      exito: true,
      email,
      req,
    }).catch(() => { });

    res.json(resultado);
  } catch (error) {
    logSeguridad({
      evento: "RESET_PASSWORD_ERROR",
      exito: false,
      email: req.body?.email || null,
      req,
      detalle: { error: error.message },
    }).catch(() => { });

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

    logSeguridad({
      evento: "RESET_PASSWORD_COMPLETADO",
      exito: true,
      req,
    }).catch(() => { });

    res.json(resultado);
  } catch (error) {
    logSeguridad({
      evento: "RESET_PASSWORD_FALLIDO",
      exito: false,
      req,
      detalle: { motivo: error.message },
    }).catch(() => { });

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

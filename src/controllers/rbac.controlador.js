import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  getAllRoles,
  getAllPermisos,
  createRole,
  updateRole,
  deleteRole,
  createPermiso,
  assignPermisoToRol,
  removePermisoFromRol,
  getAccessMatrix,
  getUserRol,
  getUsuarioDetalle as getUsuarioDetalleModel,
  updateUserRol,
  getAllUsuariosConRol,
  deleteUsuarioById,
} from "../models/permiso.modelo.js";
import { desbloquearUsuario, crearUsuarioConVerificacion } from "../models/usuario.modelo.js";
import { enviarEmail } from "../services/email.service.js";
import { logAplicacion, logSeguridad } from "../services/logger.service.js";

export const getRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (err) { next(err); }
};

export const postRol = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: "nombre es requerido" });
    const rol = await createRole(nombre, descripcion);

    logAplicacion({ nivel: "INFO", modulo: "rbac", evento: "ROL_CREADO",
      mensaje: `Rol creado: ${nombre}`, usuario_id: req.usuario?.id,
      detalle: { rol_id: rol.id, nombre }, req }).catch(() => {});

    res.status(201).json(rol);
  } catch (err) { next(err); }
};

export const putRol = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const rol = await updateRole(req.params.id, nombre, descripcion);
    if (!rol) return res.status(404).json({ error: "Rol no encontrado" });

    logAplicacion({ nivel: "INFO", modulo: "rbac", evento: "ROL_ACTUALIZADO",
      mensaje: `Rol ${req.params.id} actualizado`, usuario_id: req.usuario?.id,
      detalle: { rol_id: req.params.id, nombre }, req }).catch(() => {});

    res.json(rol);
  } catch (err) { next(err); }
};

export const deleteRol = async (req, res, next) => {
  try {
    await deleteRole(req.params.id);

    logAplicacion({ nivel: "WARN", modulo: "rbac", evento: "ROL_ELIMINADO",
      mensaje: `Rol ${req.params.id} eliminado`, usuario_id: req.usuario?.id,
      detalle: { rol_id: req.params.id }, req }).catch(() => {});

    res.json({ mensaje: "Rol eliminado" });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

export const getPermisos = async (req, res, next) => {
  try {
    const permisos = await getAllPermisos();
    res.json(permisos);
  } catch (err) { next(err); }
};

export const postPermiso = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: "nombre es requerido" });
    const permiso = await createPermiso(nombre, descripcion);

    logAplicacion({ nivel: "INFO", modulo: "rbac", evento: "PERMISO_CREADO",
      mensaje: `Permiso creado: ${nombre}`, usuario_id: req.usuario?.id,
      detalle: { permiso_id: permiso.id, nombre }, req }).catch(() => {});

    res.status(201).json(permiso);
  } catch (err) { next(err); }
};

export const postAsignarPermiso = async (req, res, next) => {
  try {
    const { permisoId } = req.body;
    await assignPermisoToRol(req.params.id, permisoId);

    logAplicacion({ nivel: "WARN", modulo: "rbac", evento: "PERMISO_ASIGNADO_A_ROL",
      mensaje: `Permiso ${permisoId} asignado al rol ${req.params.id}`,
      usuario_id: req.usuario?.id,
      detalle: { rol_id: req.params.id, permiso_id: permisoId }, req }).catch(() => {});

    res.json({ mensaje: "Permiso asignado" });
  } catch (err) { next(err); }
};

export const deletePermisoDeRol = async (req, res, next) => {
  try {
    await removePermisoFromRol(req.params.id, req.params.pid);

    logAplicacion({ nivel: "WARN", modulo: "rbac", evento: "PERMISO_REMOVIDO_DE_ROL",
      mensaje: `Permiso ${req.params.pid} removido del rol ${req.params.id}`,
      usuario_id: req.usuario?.id,
      detalle: { rol_id: req.params.id, permiso_id: req.params.pid }, req }).catch(() => {});

    res.json({ mensaje: "Permiso removido" });
  } catch (err) { next(err); }
};

export const getUsuarioRol = async (req, res, next) => {
  try {
    const data = await getUserRol(req.params.id);
    if (!data) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(data);
  } catch (err) { next(err); }
};

export const getUsuarioDetalle = async (req, res, next) => {
  try {
    const data = await getUsuarioDetalleModel(req.params.id);
    if (!data) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(data);
  } catch (err) { next(err); }
};

export const putUsuarioRol = async (req, res, next) => {
  try {
    const { rol_id } = req.body;
    if (!rol_id) return res.status(400).json({ error: "rol_id es requerido" });
    const usuario = await updateUserRol(req.params.id, rol_id);

    logAplicacion({ nivel: "WARN", modulo: "rbac", evento: "USUARIO_ROL_ACTUALIZADO",
      mensaje: `Rol del usuario ${req.params.id} cambiado a ${rol_id}`,
      usuario_id: req.usuario?.id,
      detalle: { usuario_afectado_id: req.params.id, nuevo_rol_id: rol_id }, req }).catch(() => {});

    res.json(usuario);
  } catch (err) { next(err); }
};

export const getMatriz = async (req, res, next) => {
  try {
    const matriz = await getAccessMatrix();
    res.json(matriz);
  } catch (err) { next(err); }
};

export const getUsuarios = async (req, res, next) => {
  try {
    const includeInactive = String(req.query.include_inactive).toLowerCase() === 'true';
    const usuarios = await getAllUsuariosConRol(includeInactive);
    res.json(usuarios);
  } catch (err) { next(err); }
};

export const postDesbloquearUsuario = async (req, res, next) => {
  try {
    await desbloquearUsuario(req.params.id);

    logSeguridad({ evento: "CUENTA_DESBLOQUEADA", exito: true,
      usuario_id: req.usuario?.id, req,
      detalle: { usuario_desbloqueado_id: req.params.id } }).catch(() => {});

    res.json({ mensaje: "Usuario desbloqueado correctamente" });
  } catch (err) { next(err); }
};

export const deleteUsuario = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.usuario.id)) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
    }
    await deleteUsuarioById(req.params.id);

    logAplicacion({ nivel: "WARN", modulo: "rbac", evento: "USUARIO_ELIMINADO",
      mensaje: `Usuario ${req.params.id} eliminado`,
      usuario_id: req.usuario?.id,
      detalle: { usuario_eliminado_id: req.params.id }, req }).catch(() => {});

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) { next(err); }
};

const generarPasswordDefault = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const postCrearUsuario = async (req, res, next) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, email, rol_id } = req.body;
    if (!nombre || !apellido_paterno || !email || !rol_id) {
      return res.status(400).json({ error: "nombre, apellido_paterno, email y rol_id son requeridos" });
    }

    const passwordDefault = generarPasswordDefault();
    const password_hash = await bcrypt.hash(passwordDefault, 12);
    const codigo_verificacion = crypto.createHash("sha256").update(crypto.randomBytes(32).toString("hex")).digest("hex");
    const codigo_verificacion_expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const usuario = await crearUsuarioConVerificacion({
      nombre, apellido_paterno, apellido_materno, email,
      password_hash, rol_id, codigo_verificacion, codigo_verificacion_expira,
      debe_cambiar_password: true,
    });

    enviarEmail({
      to: email,
      subject: "Tu cuenta en College X Nexus",
      html: `<p>Hola <b>${nombre}</b>,</p>
             <p>Tu cuenta ha sido creada. Tu contraseña temporal es: <b>${passwordDefault}</b></p>
             <p>Deberás cambiarla al iniciar sesión por primera vez.</p>`,
    }).catch(() => {});

    logAplicacion({ nivel: "INFO", modulo: "rbac", evento: "USUARIO_CREADO",
      mensaje: `Usuario creado por admin: ${email}`,
      usuario_id: req.usuario?.id,
      detalle: { nuevo_usuario_id: usuario.id, email, rol_id }, req }).catch(() => {});

    res.status(201).json({ mensaje: "Usuario creado correctamente", usuario });
  } catch (err) { next(err); }
};

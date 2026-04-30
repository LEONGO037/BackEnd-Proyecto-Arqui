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
  updateUserRol,
  getAllUsuariosConRol,
  deleteUsuarioById,
} from "../models/permiso.modelo.js";
import { desbloquearUsuario } from "../models/usuario.modelo.js";

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
    res.status(201).json(rol);
  } catch (err) { next(err); }
};

export const putRol = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const rol = await updateRole(req.params.id, nombre, descripcion);
    if (!rol) return res.status(404).json({ error: "Rol no encontrado" });
    res.json(rol);
  } catch (err) { next(err); }
};

export const deleteRol = async (req, res, next) => {
  try {
    await deleteRole(req.params.id);
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
    res.status(201).json(permiso);
  } catch (err) { next(err); }
};

export const postAsignarPermiso = async (req, res, next) => {
  try {
    const { permisoId } = req.body;
    await assignPermisoToRol(req.params.id, permisoId);
    res.json({ mensaje: "Permiso asignado" });
  } catch (err) { next(err); }
};

export const deletePermisoDeRol = async (req, res, next) => {
  try {
    await removePermisoFromRol(req.params.id, req.params.pid);
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

export const putUsuarioRol = async (req, res, next) => {
  try {
    const { rol_id } = req.body;
    if (!rol_id) return res.status(400).json({ error: "rol_id es requerido" });
    const usuario = await updateUserRol(req.params.id, rol_id);
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
    const usuarios = await getAllUsuariosConRol();
    res.json(usuarios);
  } catch (err) { next(err); }
};

export const postDesbloquearUsuario = async (req, res, next) => {
  try {
    await desbloquearUsuario(req.params.id);
    res.json({ mensaje: "Usuario desbloqueado correctamente" });
  } catch (err) { next(err); }
};

export const deleteUsuario = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.usuario.id)) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
    }
    await deleteUsuarioById(req.params.id);
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) { next(err); }
};

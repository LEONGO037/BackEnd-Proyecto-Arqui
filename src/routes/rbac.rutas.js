import express from "express";
import { verificarToken } from "../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../middlewares/roles.middleware.js";
import {
  getRoles,
  postRol,
  putRol,
  deleteRol,
  getPermisos,
  postPermiso,
  postAsignarPermiso,
  deletePermisoDeRol,
  getUsuarioRol,
  getUsuarioDetalle,
  putUsuarioRol,
  getMatriz,
  getUsuarios,
  postDesbloquearUsuario,
  deleteUsuario,
  postCrearUsuario,
} from "../controllers/rbac.controlador.js";
const router = express.Router();
router.use(verificarToken);

router.get("/usuarios/:id/detalle",        verificarPermiso("usuarios:ver", "usuarios:gestionar"), getUsuarioDetalle);
// Roles — all managed under roles:gestionar (los admin de cuentas también
// necesitan leer roles para el selector de alta de usuarios).
router.get("/roles",                       verificarPermiso("roles:gestionar", "usuarios:ver", "usuarios:crear", "usuarios:gestionar"),    getRoles);
router.post("/roles",                      verificarPermiso("roles:gestionar"),    postRol);
router.put("/roles/:id",                   verificarPermiso("roles:gestionar"),    putRol);
router.delete("/roles/:id",                verificarPermiso("roles:gestionar"),    deleteRol);

// Permissions — also under roles:gestionar (same admin manages both)
router.get("/permisos",                    verificarPermiso("roles:gestionar"),    getPermisos);
router.post("/permisos",                   verificarPermiso("roles:gestionar"),    postPermiso);

// Assign / revoke permission on a role
router.post("/roles/:id/permisos",         verificarPermiso("roles:gestionar"),    postAsignarPermiso);
router.delete("/roles/:id/permisos/:pid",  verificarPermiso("roles:gestionar"),    deletePermisoDeRol);

// Users — permisos granulares (con "usuarios:gestionar" legacy como respaldo)
router.get("/usuarios",                    verificarPermiso("usuarios:ver", "usuarios:gestionar"), getUsuarios);
router.post("/usuarios",                   verificarPermiso("usuarios:crear", "usuarios:gestionar"), postCrearUsuario);
router.get("/usuarios/:id/rol",            verificarPermiso("usuarios:ver", "usuarios:gestionar"), getUsuarioRol);
router.put("/usuarios/:id/rol",            verificarPermiso("usuarios:editar", "usuarios:gestionar"), putUsuarioRol);
router.post("/usuarios/:id/desbloquear",   verificarPermiso("usuarios:editar", "usuarios:gestionar"), postDesbloquearUsuario);
router.delete("/usuarios/:id",             verificarPermiso("usuarios:eliminar", "usuarios:gestionar"), deleteUsuario);

// Access matrix — needs roles:gestionar to be useful
router.get("/matriz",                      verificarPermiso("roles:gestionar"),    getMatriz);

export default router;

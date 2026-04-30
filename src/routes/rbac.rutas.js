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
  putUsuarioRol,
  getMatriz,
  getUsuarios,
  postDesbloquearUsuario,
  deleteUsuario,
} from "../controllers/rbac.controlador.js";

const router = express.Router();
router.use(verificarToken);

// Roles — all managed under roles:gestionar
router.get("/roles",                       verificarPermiso("roles:gestionar"),    getRoles);
router.post("/roles",                      verificarPermiso("roles:gestionar"),    postRol);
router.put("/roles/:id",                   verificarPermiso("roles:gestionar"),    putRol);
router.delete("/roles/:id",                verificarPermiso("roles:gestionar"),    deleteRol);

// Permissions — also under roles:gestionar (same admin manages both)
router.get("/permisos",                    verificarPermiso("roles:gestionar"),    getPermisos);
router.post("/permisos",                   verificarPermiso("roles:gestionar"),    postPermiso);

// Assign / revoke permission on a role
router.post("/roles/:id/permisos",         verificarPermiso("roles:gestionar"),    postAsignarPermiso);
router.delete("/roles/:id/permisos/:pid",  verificarPermiso("roles:gestionar"),    deletePermisoDeRol);

// Users — all managed under usuarios:gestionar
router.get("/usuarios",                    verificarPermiso("usuarios:gestionar"), getUsuarios);
router.get("/usuarios/:id/rol",            verificarPermiso("usuarios:gestionar"), getUsuarioRol);
router.put("/usuarios/:id/rol",            verificarPermiso("usuarios:gestionar"), putUsuarioRol);
router.post("/usuarios/:id/desbloquear",   verificarPermiso("usuarios:gestionar"), postDesbloquearUsuario);
router.delete("/usuarios/:id",             verificarPermiso("usuarios:gestionar"), deleteUsuario);

// Access matrix — needs roles:gestionar to be useful
router.get("/matriz",                      verificarPermiso("roles:gestionar"),    getMatriz);

export default router;

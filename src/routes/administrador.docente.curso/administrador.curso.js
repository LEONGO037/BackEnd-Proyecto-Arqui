import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import {
  crearDocenteAdmin,
  verDocentes,
  actualizarDocenteAdmin,
} from "../../controllers/administrador.docente/docente.controller.js";
import { asignarCursoAdmin } from "../../controllers/administrador.docente/docente.curso.js";

const router = express.Router();

// Solo ADMIN_CUENTAS puede crear docentes
router.post(
  "/crear-docente",
  verificarToken,
  verificarPermiso("usuarios:gestionar"),
  crearDocenteAdmin
);

router.post(
  "/asignar-curso",
  verificarToken,
  verificarPermiso("cursos:gestionar"),
  asignarCursoAdmin
);

router.get(
  "/docentes",
  verificarToken,
  verificarPermiso("cursos:gestionar"),
  verDocentes
);

router.put(
  "/docentes/:id",
  verificarToken,
  verificarPermiso("usuarios:gestionar"),
  actualizarDocenteAdmin
);

export default router;

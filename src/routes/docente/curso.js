import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
  verMisCursos,
  actualizarEstado
} from "../../controllers/docente/curso.js";

const router = express.Router();

router.get(
  "/mis-cursos",
  verificarToken,
  verificarRol("DOCENTE"),
  verMisCursos
);

router.put(
  "/estado-curso",
  verificarToken,
  verificarRol("DOCENTE"),
  actualizarEstado
);

export default router;
import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
  verMisCursos,
  actualizarEstado,
  obtenerAlumnosCurso,
  actualizarNotas,
  obtenerMetricasCurso
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

router.get(
  "/:curso_id/estudiantes",
  verificarToken,
  verificarRol("DOCENTE"),
  obtenerAlumnosCurso
);

router.put(
  "/:curso_id/notas",
  verificarToken,
  verificarRol("DOCENTE"),
  actualizarNotas
);

router.get(
  "/:curso_id/metricas",
  verificarToken,
  verificarRol("DOCENTE"),
  obtenerMetricasCurso
);

export default router;
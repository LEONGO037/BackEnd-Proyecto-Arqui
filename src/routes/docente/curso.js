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
import {
    cantidadCursosActivos,cantidadEstudiantesActivos
} from "../../controllers/docente/curso.estudiante.js";
import { verEstudiantesCurso, registrarNota } from "../../controllers/docente/estudiante.js";
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
  "/cursos-activos/cantidad",
  verificarToken,
  verificarRol("DOCENTE"),
  cantidadCursosActivos
);

router.get(
  "/estudiantes-activos/cantidad",
  verificarToken,
  verificarRol("DOCENTE"),
  cantidadEstudiantesActivos
);

router.get(
  "/curso/:curso_id/estudiantes",
  verificarToken,
  verificarRol("DOCENTE"),
  verEstudiantesCurso
);

router.post(
  "/curso/:curso_id/estudiante/:estudiante_id/nota",
  verificarToken,
  verificarRol("DOCENTE"),
  registrarNota
);

router.get(
  "/curso/:curso_id/metricas",
  verificarToken,
  verificarRol("DOCENTE"),
  obtenerMetricasCurso
);
export default router;
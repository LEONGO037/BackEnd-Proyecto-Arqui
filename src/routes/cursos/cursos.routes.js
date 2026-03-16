import express from "express";
import {
  getCursos,
  createCurso,
  getCursosSinDocente,
  actualizarMinimoEstudiantesCurso,
  validarInscripcionCurso
} from "../../controllers/cursos/cursos.controller.js";

import { verificarToken } from "../../middlewares/autenticacion.middleware.js";

const router = express.Router();

router.get("/", getCursos);  // público, no requiere token
router.get("/sin-docente", verificarToken, getCursosSinDocente); // requiere token
router.post("/crear", verificarToken, createCurso); // requiere token de administrador/usuario

// actualizar mínimo de estudiantes
router.patch(
  "/:id/minimo-estudiantes",
  verificarToken,
  actualizarMinimoEstudiantesCurso
);

// validar inscripción de un estudiante a un curso
router.get(
  "/validar-inscripcion/:curso_id",
  verificarToken,
  validarInscripcionCurso
);

export default router;
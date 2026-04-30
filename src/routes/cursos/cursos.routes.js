import express from "express";
import {
  getCursos,
  getAllCursosAdmin,
  createCurso,
  getCursosSinDocente,
  actualizarMinimoEstudiantesCurso,
  validarInscripcionCurso,
  updateCurso,
  updatePrerrequisitos,
  deleteCursoController,
} from "../../controllers/cursos/cursos.controller.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";

const router = express.Router();

router.get("/", getCursos);  // público
router.get("/admin",       verificarToken, verificarPermiso("cursos:gestionar"), getAllCursosAdmin);
router.get("/sin-docente", verificarToken, getCursosSinDocente);
router.post("/crear",      verificarToken, verificarPermiso("cursos:gestionar"), createCurso);

router.patch("/:id/minimo-estudiantes", verificarToken, actualizarMinimoEstudiantesCurso);

router.get("/validar-inscripcion/:curso_id", verificarToken, validarInscripcionCurso);

router.put("/:id",               verificarToken, verificarPermiso("cursos:gestionar"), updateCurso);
router.put("/:id/prerrequisitos",verificarToken, verificarPermiso("cursos:gestionar"), updatePrerrequisitos);
router.delete("/:id",            verificarToken, verificarPermiso("cursos:gestionar"), deleteCursoController);

export default router;

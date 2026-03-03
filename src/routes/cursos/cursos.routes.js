import express from "express";
import { getCursos, createCurso, getCursosSinDocente } from "../../controllers/cursos/cursos.controller.js";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";

const router = express.Router();

router.get("/", getCursos);  // público, no requiere token
router.get("/sin-docente", verificarToken, getCursosSinDocente); // requiere token
router.post("/crear", verificarToken, createCurso); // requiere token de administrador/usuario

export default router;

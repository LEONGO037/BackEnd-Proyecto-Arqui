import express from "express";
import { getCursos } from "../../controllers/cursos/cursos.controller.js";

const router = express.Router();
router.get("/", getCursos);  // público, no requiere token
export default router;

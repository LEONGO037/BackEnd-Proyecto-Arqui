import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
  getMisInscripciones,
  postInscribir,
  deleteDesinscribir,
  getResumenCursos,
} from "../../controllers/inscripcion/inscripcion.controller.js";

const router = express.Router();

// Todas las rutas requieren token JWT
router.use(verificarToken);

router.get("/mis-inscripciones", getMisInscripciones);
router.post("/inscribir", postInscribir);
router.delete("/desinscribir/:cursoId", deleteDesinscribir);

// Rutas de administración (requieren rol ADMIN)
router.get(
  "/resumen",
  verificarRol("ADMINISTRADOR"),
  getResumenCursos
);

export default router;

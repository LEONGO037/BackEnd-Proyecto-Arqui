import express from "express";
import { body, param } from "express-validator";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
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

router.post(
  "/inscribir",
  body("curso_id").isInt({ min: 1 }).withMessage("curso_id debe ser un número entero válido"),
  validarCampos,
  postInscribir
);

router.delete(
  "/desinscribir/:cursoId",
  param("cursoId").isInt({ min: 1 }).withMessage("cursoId debe ser un número entero válido"),
  validarCampos,
  deleteDesinscribir
);

// Rutas de administración. El resumen es de solo lectura → basta con
// 'inscripciones:ver' (o el 'inscripciones:gestionar' de control total).
router.get(
  "/resumen",
  verificarPermiso("inscripciones:ver", "inscripciones:gestionar"),
  getResumenCursos
);

export default router;

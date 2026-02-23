import express from "express";
import { registrarEstudiante } from "../../controllers/estudiante/estudiante.controller.js";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";

const router = express.Router();

/**
 * Ruta para registrar un nuevo estudiante.
 * Requiere token de autenticación.
 */
router.post("/registrar", verificarToken, registrarEstudiante);

export default router;

import express from "express";
import { registrarEstudiante } from "../../controllers/estudiante/estudiante.controller.js";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";

const router = express.Router();

// Registrar estudiante por un administrador = crear usuario
router.post("/registrar", verificarToken, verificarPermiso("usuarios:crear", "usuarios:gestionar"), registrarEstudiante);

export default router;

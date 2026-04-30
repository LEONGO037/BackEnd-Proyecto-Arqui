import express from "express";
import { registrarEstudiante } from "../../controllers/estudiante/estudiante.controller.js";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";

const router = express.Router();

router.post("/registrar", verificarToken, verificarPermiso("usuarios:gestionar"), registrarEstudiante);

export default router;

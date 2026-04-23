import express from "express";
import { registrar, login, cambiarPassword } from "../controllers/autenticacion.controlador.js";
import { verificarToken } from "../middlewares/autenticacion.middleware.js";

const router = express.Router();

router.post("/registrar", registrar);
router.post("/login", login);
router.put("/cambiar-password", verificarToken, cambiarPassword);
export default router;

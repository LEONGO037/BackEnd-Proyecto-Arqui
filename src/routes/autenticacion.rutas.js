import express from "express";
import rateLimit from "express-rate-limit";
import {
  registrar,
  login,
  cambiarPassword,
  verificarCodigo,
  solicitarReset,
  resetearPassword,
  perfil,
} from "../controllers/autenticacion.controlador.js";
import { verificarToken } from "../middlewares/autenticacion.middleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos. Intente en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/registrar", registrar);
router.post("/login", loginLimiter, login);
router.post("/verificar-codigo", verificarCodigo);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.post("/solicitar-reset", solicitarReset);
router.post("/reset-password", resetearPassword);
router.get("/perfil", verificarToken, perfil);

export default router;

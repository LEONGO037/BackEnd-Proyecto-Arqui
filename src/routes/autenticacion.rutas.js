import express from "express";
import rateLimit from "express-rate-limit";
import {
  registrar,
  login,
  cambiarPassword,
  verificarCodigo,
  verificarTokenLink,
  solicitarReset,
  verificarCodigoReset,
  resetearPassword,
  perfil,
  reenviarCodigo,
} from "../controllers/autenticacion.controlador.js";
import { verificarToken } from "../middlewares/autenticacion.middleware.js";
import { logSeguridad } from "../services/logger.service.js";
import { validarCampos } from "../middlewares/validation.middleware.js";
import {
  validacionRegistro,
  validacionLogin,
  validacionReset,
  validacionNuevaPassword
} from "../middlewares/validaciones.auth.js";

const router = express.Router();

// En producción: 10 intentos cada 15 minutos.
// En desarrollo/test: 100 intentos cada 1 minuto (para no bloquear pruebas locales).
const esProduccion = process.env.NODE_ENV === "production";
const loginLimiter = rateLimit({
  windowMs: esProduccion ? 15 * 60 * 1000 : 60 * 1000,
  max: esProduccion ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Cuando el rate-limit bloquea, registramos el evento de seguridad
  // y devolvemos la respuesta. Esto alimenta la detección automática de RC-001.
  handler: (req, res) => {
    logSeguridad({
      evento: "LOGIN_BLOQUEADO_RATE_LIMIT",
      exito: false,
      email: req.body?.email || null,
      req,
      detalle: { motivo: "Excedió el límite de intentos" },
    }).catch(() => { });

    res.status(429).json({
      error: esProduccion
        ? "Demasiados intentos. Intente en 15 minutos."
        : "Demasiados intentos. Intente en 1 minuto.",
    });
  },
});

router.post("/registrar", validacionRegistro, validarCampos, registrar);
router.post("/login", loginLimiter, validacionLogin, validarCampos, login);
router.post("/verificar-codigo", verificarCodigo);
router.get("/verificar-token", verificarTokenLink);
router.post("/reenviar-codigo", reenviarCodigo);
router.put("/cambiar-password", verificarToken, validacionNuevaPassword, validarCampos, cambiarPassword);
router.post("/solicitar-reset", validacionReset, validarCampos, solicitarReset);
router.post("/verificar-codigo-reset", verificarCodigoReset);
router.post("/reset-password", validacionNuevaPassword, validarCampos, resetearPassword);
router.get("/perfil", verificarToken, perfil);

export default router;

import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
    cambiarPassword,
    verificarPasswordDefault,
} from "../../controllers/docente/docenteValidacion.controller.js";

const router = express.Router();

/**
 * GET /api/docente-password/:id/es-default
 * Verifica si el docente aún tiene la contraseña por defecto.
 * Útil para detectar primer inicio de sesión y redirigir al formulario de cambio.
 */
router.get(
    "/:id/es-default",
    verificarToken,
    verificarRol("DOCENTE"),
    verificarPasswordDefault
);

/**
 * PUT /api/docente-password/:id/cambiar
 * Cambia la contraseña del docente. Incluye todas las validaciones internamente:
 * - Verifica contraseña actual
 * - Valida formato de la nueva (mayúsculas, minúsculas, números, carácter especial, mín. 8 caracteres)
 * - Verifica que sea diferente a la contraseña por defecto y a la actual
 */
router.put(
    "/:id/cambiar",
    verificarToken,
    verificarRol("DOCENTE"),
    cambiarPassword
);

export default router;

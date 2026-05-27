import { validationResult } from "express-validator";

/**
 * Middleware genérico que intercepta los errores generados por las
 * reglas de express-validator. Si hay errores de formato, tipo o rango,
 * responde con un 400 Bad Request conteniendo los errores de forma uniforme.
 */
export const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            error: "Errores de validación en los datos de entrada",
            detalles: errores.array().map(err => ({
                campo: err.path,
                mensaje: err.msg,
                valor_recibido: err.value
            }))
        });
    }
    next();
};

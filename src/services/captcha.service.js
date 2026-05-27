// ===========================================================================
// Servicio de verificación de CAPTCHA (Google reCAPTCHA v2) — Punto 1.4
//
// reCAPTCHA v2 muestra el checkbox "No soy un robot" en el frontend.
// Cuando el usuario lo marca (y opcionalmente resuelve un challenge),
// Google entrega un token al cliente.
//
// El cliente envía ese token al backend, que llama a Google para verificar.
// A diferencia de v3, NO hay score ni action — solo `success: true/false`.
//
// Configuración (.env):
//   RECAPTCHA_SECRET_KEY=...     (clave secreta de Google)
//
// Si RECAPTCHA_SECRET_KEY NO está configurada:
//   - En producción: rechaza con error (fail-safe)
//   - En desarrollo:  se omite la validación (loguea WARN)
// ===========================================================================

import { logger, logSeguridad } from "./logger.service.js";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const obtenerConfig = () => ({
    secret: process.env.RECAPTCHA_SECRET_KEY || "",
    esProduccion: process.env.NODE_ENV === "production",
});

/**
 * Verifica un token de reCAPTCHA v2 contra Google.
 *
 * @param {string} token   - Token recibido del cliente
 * @param {string} ip      - IP del cliente (opcional, mejora la verificación)
 * @returns {Promise<{ valido: boolean, motivo?: string, errorCodes?: string[] }>}
 */
export const verificarCaptcha = async (token, ip = null) => {
    const { secret, esProduccion } = obtenerConfig();

    // Sin clave configurada
    if (!secret) {
        if (esProduccion) {
            logger.error("RECAPTCHA_SECRET_KEY no configurada en producción");
            return { valido: false, motivo: "CAPTCHA no configurado" };
        }
        // En dev permitimos pasar para no bloquear desarrollo
        logger.warn("CAPTCHA omitido — RECAPTCHA_SECRET_KEY no configurada (modo dev)");
        return { valido: true, motivo: "DEV_BYPASS" };
    }

    if (!token || typeof token !== "string") {
        return { valido: false, motivo: "Token CAPTCHA ausente" };
    }

    try {
        const params = new URLSearchParams({ secret, response: token });
        if (ip) params.set("remoteip", ip);

        const respuesta = await fetch(RECAPTCHA_VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await respuesta.json();

        if (!data.success) {
            return {
                valido: false,
                motivo: "Token CAPTCHA inválido",
                errorCodes: data["error-codes"],
            };
        }

        return { valido: true };
    } catch (error) {
        logger.error("Error consultando reCAPTCHA", error.message);
        // En caso de error de red, no bloqueamos en dev pero sí registramos.
        if (esProduccion) return { valido: false, motivo: "Error verificando CAPTCHA" };
        return { valido: true, motivo: "DEV_BYPASS_ERROR" };
    }
};

/**
 * Middleware Express que valida el CAPTCHA en `req.body.captcha_token`
 * y registra el resultado en log_seguridad si falla.
 *
 * @param {string} contexto - Etiqueta del flujo (login, registro, reset) para logs
 */
export const exigirCaptcha = (contexto) => async (req, res, next) => {
    const token = req.body?.captcha_token;
    const ip = req.ip;
    const resultado = await verificarCaptcha(token, ip);

    if (!resultado.valido) {
        logSeguridad({
            evento: "CAPTCHA_FALLIDO",
            exito: false,
            email: req.body?.email,
            req,
            detalle: {
                contexto,
                motivo: resultado.motivo,
                errorCodes: resultado.errorCodes,
            },
        }).catch(() => { });

        return res.status(400).json({
            error: "Verificación de seguridad fallida. Marca el checkbox \"No soy un robot\" e intenta de nuevo.",
        });
    }

    req.captcha = { contexto };
    next();
};

import pool from "../config/db.js";
import fs from "fs";
import path from "path";

// ===========================================================================
// Logger central de la aplicación — Punto 3 + 4 (Seguridad de Sistemas)
//
// Dos canales:
//   - logAplicacion: eventos críticos de funcionalidad
//   - logSeguridad : eventos de seguridad y sesión
//
// Reglas:
//   - Nunca interrumpe el flujo (todas las funciones son "seguras").
//   - En producción NO escribe a consola (evita filtrar info sensible).
//   - Si la BD falla, hace fallback a archivo local (logs/fallback.log).
//   - Sanitiza datos sensibles (password, token) antes de guardar.
// ===========================================================================

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";

const LOG_DIR = path.resolve("logs");
const FALLBACK_FILE = path.join(LOG_DIR, "fallback.log");

const CAMPOS_SENSIBLES = [
    "password", "password_actual", "nueva_password", "password_hash",
    "token", "codigo", "codigo_verificacion", "reset_token",
];

const sanitizar = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const copia = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const clave of Object.keys(copia)) {
        if (CAMPOS_SENSIBLES.includes(clave.toLowerCase())) {
            copia[clave] = "[REDACTED]";
        } else if (typeof copia[clave] === "object" && copia[clave] !== null) {
            copia[clave] = sanitizar(copia[clave]);
        }
    }
    return copia;
};

const escribirFallback = (registro) => {
    try {
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(FALLBACK_FILE, JSON.stringify(registro) + "\n", "utf8");
    } catch {
        // Si ni siquiera el fallback funciona, no hay nada más que hacer.
    }
};

const consolaSeguro = (nivel, mensaje, detalle) => {
    if (IS_PROD || IS_TEST) return;
    const ts = new Date().toISOString();
    const linea = `[${ts}] [${nivel}] ${mensaje}`;
    if (nivel === "ERROR") console.error(linea, detalle ?? "");
    else if (nivel === "WARN") console.warn(linea, detalle ?? "");
    else console.log(linea, detalle ?? "");
};

// ---------------------------------------------------------------------------
// Log de Aplicación
// ---------------------------------------------------------------------------
/**
 * Registra un evento de aplicación (no de seguridad).
 *
 * @param {Object} params
 * @param {"INFO"|"WARN"|"ERROR"} params.nivel
 * @param {string} params.modulo   - Nombre del módulo (ej: "cursos", "pagos")
 * @param {string} params.evento   - Nombre corto del evento (ej: "CURSO_CREADO")
 * @param {string} [params.mensaje]
 * @param {number} [params.usuario_id]
 * @param {Object} [params.detalle]
 */
export const logAplicacion = async ({
    nivel = "INFO",
    modulo,
    evento,
    mensaje = null,
    usuario_id = null,
    detalle = {},
    req = null,
}) => {
    const ip = req ? (req.ip || req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || null) : null;
    const userAgent = req?.headers?.["user-agent"] || null;

    const detalleSanitizado = sanitizar(detalle);

    consolaSeguro(nivel, `[${modulo}/${evento}] ${mensaje || ""}`, detalleSanitizado);

    try {
        await pool.query(
            `INSERT INTO public.log_aplicacion
                (nivel, modulo, evento, mensaje, usuario_id, detalle, ip, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [nivel, modulo, evento, mensaje, usuario_id, detalleSanitizado, ip, userAgent]
        );
    } catch (err) {
        escribirFallback({
            tipo: "log_aplicacion",
            fecha: new Date().toISOString(),
            nivel, modulo, evento, mensaje, usuario_id,
            detalle: detalleSanitizado,
            ip, user_agent: userAgent,
            error_bd: err.message,
        });
    }
};

// ---------------------------------------------------------------------------
// Log de Seguridad
// ---------------------------------------------------------------------------
/**
 * Registra un evento de seguridad o sesión.
 *
 * @param {Object} params
 * @param {string}  params.evento     - Ej: "LOGIN_EXITOSO", "LOGIN_FALLIDO"
 * @param {boolean} [params.exito]
 * @param {number}  [params.usuario_id]
 * @param {string}  [params.email]
 * @param {Object}  [params.req]      - Request de Express (extrae ip, ua, ruta)
 * @param {Object}  [params.detalle]
 */
export const logSeguridad = async ({
    evento,
    exito = false,
    usuario_id = null,
    email = null,
    req = null,
    detalle = {},
}) => {
    const ip = req ? (req.ip || req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || null) : null;
    const userAgent = req?.headers?.["user-agent"] || null;
    const ruta = req?.originalUrl || req?.path || null;
    const metodo = req?.method || null;

    const detalleSanitizado = sanitizar(detalle);

    consolaSeguro(
        exito ? "INFO" : "WARN",
        `[SEGURIDAD/${evento}] email=${email || "-"} ip=${ip || "-"}`,
        detalleSanitizado
    );

    try {
        await pool.query(
            `INSERT INTO public.log_seguridad
                (evento, exito, usuario_id, email, ip, user_agent, ruta, metodo, detalle)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [evento, exito, usuario_id, email, ip, userAgent, ruta, metodo, detalleSanitizado]
        );
    } catch (err) {
        escribirFallback({
            tipo: "log_seguridad",
            fecha: new Date().toISOString(),
            evento, exito, usuario_id, email, ip, userAgent, ruta, metodo,
            detalle: detalleSanitizado,
            error_bd: err.message,
        });
    }
};

// ---------------------------------------------------------------------------
// Logger "estilo consola" para reemplazar console.log/error en el resto del código.
// No depende de la BD: solo escribe a consola en dev y a fallback en prod
// si el nivel es ERROR. Sirve para logs internos no estructurados.
// ---------------------------------------------------------------------------
export const logger = {
    info: (msg, extra) => consolaSeguro("INFO", msg, extra),
    warn: (msg, extra) => consolaSeguro("WARN", msg, extra),
    error: (msg, extra) => {
        consolaSeguro("ERROR", msg, extra);
        if (IS_PROD) {
            escribirFallback({
                tipo: "logger.error",
                fecha: new Date().toISOString(),
                mensaje: msg,
                extra: extra instanceof Error
                    ? { name: extra.name, message: extra.message, stack: extra.stack }
                    : extra,
            });
        }
    },
};

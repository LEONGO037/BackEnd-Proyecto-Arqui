// ===========================================================================
// Middleware de Sanitización de Entrada — Punto 1.2
//
// Aplica saneamiento defensivo a TODAS las cadenas presentes en req.body,
// req.query y req.params antes de que lleguen a los controladores.
//
// Operaciones:
//   1. trim()                              → elimina espacios al inicio/fin
//   2. Eliminación de null bytes (\0)      → previene null-byte injection
//   3. Eliminación de caracteres de control → previene CRLF injection
//   4. Escape de etiquetas HTML básicas    → previene XSS reflejado
//      (Solo se hace para campos texto comunes; campos password se
//       dejan tal cual porque pueden contener < > & legítimos)
//
// Lo que NO hace (a propósito):
//   - No valida tipos ni formato — eso es trabajo de los validadores
//     específicos de cada controlador.
//   - No toca campos password, token, codigo, password_hash, ni el
//     contenido HTML de plantillas internas.
//   - No modifica objetos profundos más allá de 5 niveles (evita ataques
//     de deeply-nested objects que consumen CPU).
// ===========================================================================

const CAMPOS_NO_ESCAPAR_HTML = new Set([
    "password",
    "password_actual",
    "nueva_password",
    "password_hash",
    "confirmar_password",
    "confirmacion_password",
    "token",
    "codigo",
    "codigo_verificacion",
    "reset_token",
    "captcha",
    "captcha_token",
    "html",          // plantillas internas de email
    "descripcion",   // textos largos donde se permite contenido formateado
    "consecuencias",
    "mensaje",
    "observaciones",
]);

const MAX_DEPTH = 5;

const escaparHTML = (str) =>
    str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");

const limpiarString = (valor, nombreCampo) => {
    if (typeof valor !== "string") return valor;

    let limpio = valor
        .replace(/\0/g, "")           // null bytes
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars (excepto \t \n \r)
        .trim();

    // No escapar campos que naturalmente pueden tener < > &
    if (CAMPOS_NO_ESCAPAR_HTML.has(nombreCampo)) {
        return limpio;
    }

    return escaparHTML(limpio);
};

const sanitizar = (obj, depth = 0) => {
    if (depth > MAX_DEPTH || obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizar(item, depth + 1));
    }

    if (typeof obj === "object") {
        const limpio = {};
        for (const [clave, valor] of Object.entries(obj)) {
            if (typeof valor === "string") {
                limpio[clave] = limpiarString(valor, clave.toLowerCase());
            } else if (typeof valor === "object" && valor !== null) {
                limpio[clave] = sanitizar(valor, depth + 1);
            } else {
                limpio[clave] = valor;
            }
        }
        return limpio;
    }

    return obj;
};

// ===========================================================================
// Sanitización de SALIDA — Punto 1.3
//
// Wrapper sobre res.json que elimina campos sensibles de TODA respuesta
// JSON antes de enviarla al cliente. Defensa en profundidad para evitar
// fugas accidentales (ej. un controller que olvida hacer SELECT solo de
// campos seguros).
// ===========================================================================

const CAMPOS_SENSIBLES_SALIDA = new Set([
    "password",
    "password_hash",
    "password_actual",
    "nueva_password",
    "codigo_verificacion",
    "codigo_verificacion_expira",
    "reset_token",
    "reset_token_expira",
]);

const filtrarSalida = (obj, depth = 0) => {
    if (depth > MAX_DEPTH || obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => filtrarSalida(item, depth + 1));
    }

    if (typeof obj === "object") {
        const limpio = {};
        for (const [clave, valor] of Object.entries(obj)) {
            if (CAMPOS_SENSIBLES_SALIDA.has(clave)) continue; // omitir
            if (typeof valor === "object" && valor !== null) {
                limpio[clave] = filtrarSalida(valor, depth + 1);
            } else {
                limpio[clave] = valor;
            }
        }
        return limpio;
    }

    return obj;
};

export const sanitizarSalida = (_req, res, next) => {
    const jsonOriginal = res.json.bind(res);
    res.json = (body) => jsonOriginal(filtrarSalida(body));
    next();
};

export const sanitizarEntrada = (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizar(req.body);
    }
    if (req.query && typeof req.query === "object") {
        // req.query es read-only en Express 5; mutamos en lugar de reasignar
        for (const clave of Object.keys(req.query)) {
            const valor = req.query[clave];
            if (typeof valor === "string") {
                req.query[clave] = limpiarString(valor, clave.toLowerCase());
            }
        }
    }
    if (req.params && typeof req.params === "object") {
        for (const clave of Object.keys(req.params)) {
            const valor = req.params[clave];
            if (typeof valor === "string") {
                req.params[clave] = limpiarString(valor, clave.toLowerCase());
            }
        }
    }
    next();
};

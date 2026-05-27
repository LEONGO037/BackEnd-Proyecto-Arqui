import { verificarToken } from "./autenticacion.middleware.js";

// Lista blanca de endpoints que NO requieren token por ser públicos o flujos de auth
const EXCLUSIONES = [
    { ruta: /^\/$/, metodo: "GET" },
    { ruta: /^\/api\/autenticacion\/registrar$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/login$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/verificar-codigo$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/reenviar-codigo$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/solicitar-reset$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/verificar-codigo-reset$/, metodo: "POST" },
    { ruta: /^\/api\/autenticacion\/reset-password$/, metodo: "POST" },
    { ruta: /^\/api\/cursos$/, metodo: "GET" },
    { ruta: /^\/api\/pagos\/config$/, metodo: "GET" },
    { ruta: /^\/api\/riesgos\/reportar-denegacion-frontend$/, metodo: "POST" },
    { ruta: /^\/api\/dev\/simular-error-500$/, metodo: "GET" }
];

/**
 * Middleware que bloquea todos los endpoints de la API por defecto
 * obligando a la autenticación mediante token, a menos que el endpoint
 * esté registrado explícitamente en la lista blanca de exclusiones.
 */
export const secureByDefault = (req, res, next) => {
    const pathSinQuery = req.path;
    const metodo = req.method.toUpperCase();

    // Comprobar si coincide con alguna de las exclusiones
    const esExcluido = EXCLUSIONES.some(exc => {
        const coincideRuta = exc.ruta.test(pathSinQuery);
        const coincideMetodo = exc.metodo ? exc.metodo === metodo : true;
        return coincideRuta && coincideMetodo;
    });

    if (esExcluido) {
        return next();
    }

    // Si no está excluido, se exige token por defecto
    return verificarToken(req, res, next);
};

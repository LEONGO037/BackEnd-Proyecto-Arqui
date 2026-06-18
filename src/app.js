import express from "express";
import cors from "cors";
import helmet from "helmet";
import rutasAutenticacion from "./routes/autenticacion.rutas.js";
import rutasAdmin         from "./routes/admin.rutas.js";
import rutasEstudiante    from "./routes/estudiante/estudiante.routes.js";
import rutasInscripciones from "./routes/inscripcion/inscripcion.routes.js";
import rutasCursos        from "./routes/cursos/cursos.routes.js";
import rutasPagos         from "./routes/pagos/pagos.routes.js";
import rutasTareas        from "./routes/tareas/tareas.routes.js";
import rutasdocentecurso  from "./routes/administrador.docente.curso/administrador.curso.js";
import rutasDocente       from "./routes/docente/curso.js";
import rutasFactura       from "./routes/pagos/factura.routes.js";
import rutasReportes      from "./routes/reportes/reportes.routes.js";
import rutasDocentePassword from "./routes/docente/docenteValdacion.routes.js";
import rutasRbac          from "./routes/rbac.rutas.js";
import rutasRiesgos       from "./routes/riesgos/riesgos.routes.js";
import { logger, logAplicacion } from "./services/logger.service.js";
import { sanitizarEntrada, sanitizarSalida } from "./middlewares/sanitizacion.middleware.js";
import { secureByDefault } from "./middlewares/secureByDefault.middleware.js";

const app = express();

// ---------------------------------------------------------------------------
// Helmet — Headers de seguridad por defecto (Punto 1.1)
//
// Configura cabeceras HTTP para mitigar ataques comunes:
//   - HSTS: fuerza HTTPS por 1 año (con preload)
//   - X-Frame-Options: DENY → previene clickjacking
//   - X-Content-Type-Options: nosniff → previene MIME-type sniffing
//   - Referrer-Policy: no-referrer → no filtra URLs en navegación
//   - Cross-Origin-Resource-Policy: cross-origin → la API es consumida por el SPA
//   - Content-Security-Policy: deshabilitado (es API JSON, no sirve HTML)
//
// Más info: https://helmetjs.github.io/
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // API JSON — no necesitamos CSP
    crossOriginResourcePolicy: { policy: "cross-origin" }, // el SPA consume esto
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Oculta el header "X-Powered-By: Express" (no da info útil al atacante)
app.disable("x-powered-by");

// CORS restringido al frontend (configurable por env).
// - En desarrollo: además del FRONTEND_URL, aceptamos cualquier localhost.
// - Tolera trailing slash en la config.
const NORMALIZAR = (u) => (u || "").trim().replace(/\/+$/, "");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const orígenesPermitidos = FRONTEND_URL.split(",").map(NORMALIZAR).filter(Boolean);
const esDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite herramientas tipo curl/postman (sin origin)
      if (!origin) return callback(null, true);

      const origenNorm = NORMALIZAR(origin);

      // Match contra los orígenes configurados
      if (orígenesPermitidos.includes(origenNorm)) return callback(null, true);

      // En desarrollo: aceptar cualquier puerto de localhost / 127.0.0.1
      if (esDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origenNorm)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Límite de tamaño del body — previene ataques de payload masivo
app.use(express.json({ limit: "1mb" }));

// Sanitización global de entrada (Punto 1.2) — limpia body, query y params
// antes de que lleguen a los controladores.
app.use(sanitizarEntrada);

// Sanitización global de salida (Punto 1.3) — filtra campos sensibles
// (password_hash, tokens, códigos) de TODA respuesta JSON.
app.use(sanitizarSalida);

// Seguridad por Defecto — Exige token de forma global excepto lista blanca
app.use(secureByDefault);

// Confianza en proxy para que req.ip refleje la IP real detrás de reverse-proxy
app.set("trust proxy", 1);

// Logger de requests solo en desarrollo (nunca en producción para no filtrar info)
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  app.use((req, _res, next) => {
    logger.info(`[${req.method}] ${req.path}`);
    next();
  });
}

app.use("/api/autenticacion",       rutasAutenticacion);
app.use("/api/admin",               rutasAdmin);
app.use("/api/estudiante",          rutasEstudiante);
app.use("/api/inscripciones",       rutasInscripciones);
app.use("/api/cursos",              rutasCursos);
app.use("/api/pagos",               rutasPagos);
app.use("/api/tareas",              rutasTareas);
app.use("/api/admin-docente-curso", rutasdocentecurso);
app.use("/api/docente",             rutasDocente);
app.use("/api/facturas",            rutasFactura);
app.use("/api/reportes",            rutasReportes);
app.use("/api/docente-password",    rutasDocentePassword);
app.use("/api/rbac",                rutasRbac);
app.use("/api/riesgos",             rutasRiesgos);

app.get("/", (_req, res) => res.json({ message: "API funcionando correctamente" }));

// ---------------------------------------------------------------------------
// Endpoint de simulación de error (solo en desarrollo)
//
// Permite probar la detección automática del riesgo RC-007
// ("error 500 repetido en el mismo endpoint"). En producción NO existe.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  app.get("/api/dev/simular-error-500", (_req, _res) => {
    throw new Error("Error simulado para pruebas de detección RC-007");
  });
}

// ---------------------------------------------------------------------------
// 404 handler — respuesta uniforme, no expone rutas internas
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// ---------------------------------------------------------------------------
// Manejador global de errores — Punto 3
//
// Reglas:
//   - Nunca expone stack traces en producción.
//   - Nunca imprime errores crudos en consola en producción.
//   - Toda excepción no manejada queda registrada en log_aplicacion.
//   - El cliente recibe un mensaje genérico cuando es un 5xx.
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const esErrorServidor = statusCode >= 500;

  // Registrar en log de aplicación solo si es un error crítico del servidor (>= 500)
  if (esErrorServidor) {
    logAplicacion({
      nivel: "ERROR",
      modulo: "express",
      evento: "ERROR_NO_MANEJADO",
      mensaje: err.message || "Error desconocido",
      usuario_id: req.usuario?.id || null,
      detalle: {
        status: statusCode,
        ruta: req.originalUrl,
        metodo: req.method,
        ip: req.ip,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      },
    }).catch(() => { });
  }

  // Respuesta al cliente — sin stack, sin detalles internos
  const respuesta = {
    error: esErrorServidor
      ? "Error interno del servidor"
      : (err.message || "Error en la solicitud"),
  };

  // Solo en desarrollo añadimos el stack para depuración
  if (process.env.NODE_ENV === "development") {
    respuesta.stack = err.stack;
  }

  res.status(statusCode).json(respuesta);
});

export default app;

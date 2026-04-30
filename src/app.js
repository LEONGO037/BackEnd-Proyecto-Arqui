import express from "express";
import cors from "cors";
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

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.path}`);
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

app.get("/", (_req, res) => res.json({ message: "API funcionando correctamente" }));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// Global error handler — never expose stack traces in production
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);
  res.status(statusCode).json({
    error:
      statusCode >= 500
        ? "Error interno del servidor"
        : err.message || "Error en la solicitud",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;

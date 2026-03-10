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
import rutasReportes      from "./routes/reportes/reportes.routes.js";  // ← NUEVO

const app = express();
app.use(cors());
app.use(express.json());

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
app.use("/api/reportes",            rutasReportes);  // ← NUEVO

app.get("/", (req, res) => res.json({ message: "API funcionando correctamente" }));

export default app;
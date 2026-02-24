import express from "express";
import cors from "cors";
import rutasAutenticacion  from "./routes/autenticacion.rutas.js";
import rutasAdmin          from "./routes/admin.rutas.js";
import rutasInscripciones  from "./routes/inscripcion/inscripcion.routes.js";
import rutasCursos         from "./routes/cursos/cursos.routes.js";
import rutasPagos          from "./routes/pagos/pagos.routes.js";
import rutasAutenticacion from "./routes/autenticacion.rutas.js";
import rutasAdmin from "./routes/admin.rutas.js";
import rutasEstudiante from "./routes/estudiante/estudiante.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/autenticacion", rutasAutenticacion);
app.use("/api/admin", rutasAdmin);
app.use("/api/estudiante", rutasEstudiante);

app.use("/api/autenticacion",  rutasAutenticacion);
app.use("/api/admin",          rutasAdmin);
app.use("/api/inscripciones",  rutasInscripciones);
app.use("/api/cursos",         rutasCursos);
app.use("/api/pagos",          rutasPagos);

app.get("/", (req, res) => res.json({ message: "API funcionando correctamente" }));

export default app;
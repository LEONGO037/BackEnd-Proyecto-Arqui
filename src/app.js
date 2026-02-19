import express from "express";
import cors from "cors";
import rutasAutenticacion from "./routes/autenticacion.rutas.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/autenticacion", rutasAutenticacion);

app.get("/", (req, res) => {
  res.json({ message: "API funcionando correctamente " });
});

export default app;

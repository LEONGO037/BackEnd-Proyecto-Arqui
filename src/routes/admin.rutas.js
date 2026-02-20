import express from "express";
import { verificarToken } from "../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../middlewares/roles.middleware.js";

const router = express.Router();

router.get(
  "/panel",
  verificarToken,
  verificarRol("ADMINISTRADORCAJAS"),
  (req, res) => {
    res.json({
      mensaje: "Bienvenido al panel de administrador",
      usuario: req.usuario
    });
  }
);

export default router;

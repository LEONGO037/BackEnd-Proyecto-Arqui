import express from "express";
// Le agregamos un ../ extra a todos para llegar a 'src'
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import { 
  crearDocenteAdmin, 
} from "../../controllers/administrador.docente/docente.controller.js";
import { asignarCursoAdmin } from "../../controllers/administrador.docente/docente.curso.js";
const router = express.Router();

router.post(
  "/crear-docente",
  verificarToken,
  verificarRol("ADMINISTRADOR"),
  crearDocenteAdmin
);

router.post(
  "/asignar-curso",
  verificarToken,
  verificarRol("ADMINISTRADOR"),
  asignarCursoAdmin
);



export default router;
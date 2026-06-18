import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import {
  crearDocenteAdmin,
  verDocentes,
  actualizarDocenteAdmin,
} from "../../controllers/administrador.docente/docente.controller.js";
import { asignarCursoAdmin } from "../../controllers/administrador.docente/docente.curso.js";

const router = express.Router();

// Crear docentes = crear usuario
router.post(
  "/crear-docente",
  verificarToken,
  verificarPermiso("usuarios:crear", "usuarios:gestionar"),
  crearDocenteAdmin
);

// Asignar docente a un curso = modificar curso
router.post(
  "/asignar-curso",
  verificarToken,
  verificarPermiso("cursos:modificar", "cursos:gestionar"),
  asignarCursoAdmin
);

// Listar docentes para asignación = ver cursos
router.get(
  "/docentes",
  verificarToken,
  verificarPermiso("cursos:ver", "cursos:modificar", "cursos:gestionar"),
  verDocentes
);

// Editar datos de un docente = editar usuario
router.put(
  "/docentes/:id",
  verificarToken,
  verificarPermiso("usuarios:editar", "usuarios:gestionar"),
  actualizarDocenteAdmin
);

export default router;

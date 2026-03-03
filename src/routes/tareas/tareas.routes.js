// src/routes/tareas/tareas.routes.js
import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
  getTareasPorCurso,
  getTareaPorId,
  postCrearTarea,
  putActualizarTarea,
  deleteEliminarTarea,
  postAsignarCalificacion,
  getCalificacionesPorTarea,
  getCalificacionesEstudiante,
  deleteCalificacion,
} from "../../controllers/tareas/tareas.controller.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas públicas para estudiantes (obtener evaluaciones y calificaciones)
router.get("/curso/:cursoId", getTareasPorCurso);
router.get("/estudiante/:estudianteCursoId", getCalificacionesEstudiante);
router.get("/:tareaId", getTareaPorId);

// Rutas solo para docentes
router.post("/", verificarRol("DOCENTE"), postCrearTarea);
router.put("/:tareaId", verificarRol("DOCENTE"), putActualizarTarea);
router.delete("/:tareaId", verificarRol("DOCENTE"), deleteEliminarTarea);
router.post("/:tareaId/calificaciones", verificarRol("DOCENTE"), postAsignarCalificacion);
router.get("/:tareaId/calificaciones", verificarRol("DOCENTE"), getCalificacionesPorTarea);
router.delete("/notas/:notaId", verificarRol("DOCENTE"), deleteCalificacion);

export default router;

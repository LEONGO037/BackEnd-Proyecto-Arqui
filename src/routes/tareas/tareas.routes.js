// src/routes/tareas/tareas.routes.js
import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
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
router.post("/", verificarPermiso("usuario:docente"), postCrearTarea);
router.put("/:tareaId", verificarPermiso("usuario:docente"), putActualizarTarea);
router.delete("/:tareaId", verificarPermiso("usuario:docente"), deleteEliminarTarea);
router.post("/:tareaId/calificaciones", verificarPermiso("usuario:docente"), postAsignarCalificacion);
router.get("/:tareaId/calificaciones", verificarPermiso("usuario:docente"), getCalificacionesPorTarea);
router.delete("/notas/:notaId", verificarPermiso("usuario:docente"), deleteCalificacion);

export default router;

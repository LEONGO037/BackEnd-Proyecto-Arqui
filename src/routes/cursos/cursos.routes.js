import express from "express";
import { body } from "express-validator";
import {
  getCursos,
  getAllCursosAdmin,
  createCurso,
  getCursosSinDocente,
  actualizarMinimoEstudiantesCurso,
  validarInscripcionCurso,
  updateCurso,
  updatePrerrequisitos,
  deleteCursoController,
} from "../../controllers/cursos/cursos.controller.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";

const router = express.Router();

// Reglas estrictas de validación de entrada (Tolerancia a errores)
const reglasCurso = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del curso es obligatorio")
    .isString().withMessage("El nombre debe ser una cadena de texto"),
  body("costo")
    .isFloat({ min: 0 }).withMessage("El costo debe ser un número decimal mayor o igual a 0"),
  body("cupo_maximo")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("El cupo máximo debe ser un entero mayor o igual a 1"),
  body("minimo_estudiantes")
    .optional()
    .isInt({ min: 1 }).withMessage("El mínimo de estudiantes debe ser un entero mayor o igual a 1")
    .custom((value, { req }) => {
      if (req.body.cupo_maximo !== undefined && req.body.cupo_maximo !== null) {
        if (Number(value) > Number(req.body.cupo_maximo)) {
          throw new Error("El mínimo de estudiantes no puede ser mayor al cupo máximo");
        }
      }
      return true;
    }),
  validarCampos
];

// Rutas Cursos
// NOTA: verificarToken ya NO se agrega manualmente porque secureByDefault lo aplica globalmente.
router.get("/", getCursos);  // público (agregado en lista blanca)
// Permisos granulares de cursos (con "cursos:gestionar" legacy como respaldo).
router.get("/admin",       verificarPermiso("cursos:ver", "cursos:registrar", "cursos:modificar", "cursos:eliminar", "cursos:gestionar"), getAllCursosAdmin);
router.get("/sin-docente", getCursosSinDocente);
router.post("/crear",      verificarPermiso("cursos:registrar", "cursos:gestionar"), reglasCurso, createCurso);

router.patch("/:id/minimo-estudiantes",
  body("minimo_estudiantes").isInt({ min: 1 }).withMessage("El mínimo de estudiantes debe ser un entero mayor o igual a 1"),
  validarCampos,
  actualizarMinimoEstudiantesCurso
);

router.get("/validar-inscripcion/:curso_id", validarInscripcionCurso);

router.put("/:id",               verificarPermiso("cursos:modificar", "cursos:gestionar"), reglasCurso, updateCurso);
router.put("/:id/prerrequisitos",verificarPermiso("cursos:modificar", "cursos:gestionar"), updatePrerrequisitos);
router.delete("/:id",            verificarPermiso("cursos:eliminar", "cursos:gestionar"), deleteCursoController);

export default router;

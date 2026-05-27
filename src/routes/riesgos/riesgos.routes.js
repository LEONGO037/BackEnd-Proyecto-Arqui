import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import {
    getCatalogo,
    getRegistros,
    getRegistroPorId,
    postRegistroManual,
    putEstadoRegistro,
    postPlanAccion,
    putPlanAccion,
    getResumen,
    postEjecutarDeteccion,
    postReportarDenegacionFrontend,
} from "../../controllers/riesgos/riesgos.controller.js";

// ===========================================================================
// Rutas del Módulo de Gestión de Riesgos
//
// Prefijo:  /api/riesgos
// Permisos:
//   - riesgos:ver        → consultar catálogo, registros, resumen
//   - riesgos:gestionar  → crear/actualizar registros y planes; ejecutar detección
// ===========================================================================

const router = express.Router();

router.use(verificarToken);

// ───── Endpoint abierto a cualquier autenticado ────────────────────────────
// Permite que el frontend reporte bloqueos de ruta sin necesidad de permiso.
router.post("/reportar-denegacion-frontend", postReportarDenegacionFrontend);

// ───── Consulta (solo lectura) ─────────────────────────────────────────────
router.get("/catalogo",       verificarPermiso("riesgos:ver"), getCatalogo);
router.get("/resumen",        verificarPermiso("riesgos:ver"), getResumen);
router.get("/registros",      verificarPermiso("riesgos:ver"), getRegistros);
router.get("/registros/:id",  verificarPermiso("riesgos:ver"), getRegistroPorId);

// ───── Gestión (escritura) ─────────────────────────────────────────────────
router.post("/registros",                       verificarPermiso("riesgos:gestionar"), postRegistroManual);
router.put ("/registros/:id/estado",            verificarPermiso("riesgos:gestionar"), putEstadoRegistro);
router.post("/registros/:id/planes",            verificarPermiso("riesgos:gestionar"), postPlanAccion);
router.put ("/planes/:planId",                  verificarPermiso("riesgos:gestionar"), putPlanAccion);
router.post("/deteccion/ejecutar",              verificarPermiso("riesgos:gestionar"), postEjecutarDeteccion);

export default router;

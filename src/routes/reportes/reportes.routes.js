// src/routes/reportes/reportes.routes.js
import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarRol } from "../../middlewares/roles.middleware.js";
import {
  getResumenReporte,
  getReporteInscripciones,
  getReportePagos,
  getReporteAuditoria,
  descargarPDFInscripciones,
  descargarPDFPagos,
} from "../../controllers/reportes/reportes.controller.js";

const router = express.Router();

// Todas las rutas requieren autenticación + rol ADMINISTRADOR
router.use(verificarToken, verificarRol("ADMINISTRADOR"));

/**
 * GET /api/reportes/resumen
 * Estadísticas generales: totales, ingresos, inscripciones por curso.
 */
router.get("/resumen", getResumenReporte);

/**
 * GET /api/reportes/inscripciones
 * JSON con todas las inscripciones (con estado de pago).
 * Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&curso_id=N
 */
router.get("/inscripciones", getReporteInscripciones);

/**
 * GET /api/reportes/pagos
 * JSON con todos los pagos confirmados.
 * Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
router.get("/pagos", getReportePagos);

/**
 * GET /api/reportes/auditoria
 * JSON con el historial de acciones registradas en auditoria.
 */
router.get("/auditoria", getReporteAuditoria);

/**
 * GET /api/reportes/inscripciones/pdf
 * Descarga PDF del reporte de inscripciones.
 * Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&curso_id=N
 */
router.get("/inscripciones/pdf", descargarPDFInscripciones);

/**
 * GET /api/reportes/pagos/pdf
 * Descarga PDF del reporte de pagos.
 * Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
router.get("/pagos/pdf", descargarPDFPagos);

export default router;
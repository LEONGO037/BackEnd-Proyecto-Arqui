import express from "express";
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";
import { verificarPermiso } from "../../middlewares/roles.middleware.js";
import {
  getResumenReporte,
  getReporteInscripciones,
  getReportePagos,
  getReporteAuditoria,
  descargarPDFInscripciones,
  descargarPDFPagos,
} from "../../controllers/reportes/reportes.controller.js";

const router = express.Router();
router.use(verificarToken);

router.get("/resumen",           verificarPermiso("reportes:ver"),   getResumenReporte);
router.get("/inscripciones",     verificarPermiso("reportes:ver"),   getReporteInscripciones);
router.get("/pagos",             verificarPermiso("reportes:ver"),   getReportePagos);
router.get("/auditoria",         verificarPermiso("auditoria:ver"),  getReporteAuditoria);
router.get("/inscripciones/pdf", verificarPermiso("reportes:ver"),   descargarPDFInscripciones);
router.get("/pagos/pdf",         verificarPermiso("reportes:ver"),   descargarPDFPagos);

export default router;

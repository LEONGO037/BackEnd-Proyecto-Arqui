// src/controllers/reportes/reportes.controller.js
import {
  obtenerReporteInscripciones,
  obtenerReportePagos,
  obtenerResumenEstadisticas,
  obtenerInscripcionesPorCurso,
  obtenerRegistrosAuditoria,
  obtenerLogsAplicacion,
  obtenerLogsSeguridad,
} from "../../models/reportes/reportes.model.js";
import {
  generarPDFInscripciones,
  generarPDFPagos,
} from "../../services/reportes/reportes.pdf.service.js";
import { registrarAuditoriaSegura } from "../../services/auditoria.service.js";
import { logger } from "../../services/logger.service.js";
import { logApp } from "../../services/logService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrae y valida los filtros de fecha del query string.
 * Acepta: ?desde=2024-01-01&hasta=2024-12-31
 */
const parseFiltros = (query) => {
  const { desde, hasta, curso_id } = query;
  return {
    desde: desde ? new Date(desde) : undefined,
    hasta: hasta ? new Date(hasta + "T23:59:59") : undefined,
    curso_id: curso_id ? Number(curso_id) : undefined,
  };
};

const parseFiltrosAuditoria = (query) => {
  const limiteNum = Number(query.limite);
  const limite = Number.isInteger(limiteNum) && limiteNum > 0
    ? Math.min(limiteNum, 500)
    : 100;

  return {
    limite,
    accion: query.accion || undefined,
    usuario: query.usuario || undefined,
    desde: query.desde ? new Date(query.desde) : undefined,
    hasta: query.hasta ? new Date(query.hasta + "T23:59:59") : undefined,
  };
};

// ─── Endpoints JSON ───────────────────────────────────────────────────────────

/**
 * GET /api/reportes/resumen
 * Estadísticas generales para el panel de reportes.
 */
export const getResumenReporte = async (req, res) => {
  try {
    const [estadisticas, porCurso] = await Promise.all([
      obtenerResumenEstadisticas(),
      obtenerInscripcionesPorCurso(),
    ]);

    res.json({
      estadisticas,
      inscripciones_por_curso: porCurso,
    });
  } catch (err) {
    logger.error("Error getResumenReporte:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/inscripciones
 * Lista detallada de inscripciones con estado de pago.
 */
export const getReporteInscripciones = async (req, res) => {
  try {
    const filtros = parseFiltros(req.query);
    const datos = await obtenerReporteInscripciones(filtros);

    res.json({ total: datos.length, datos });
  } catch (err) {
    logger.error("Error getReporteInscripciones:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/pagos
 * Lista de pagos confirmados con detalle completo.
 */
export const getReportePagos = async (req, res) => {
  try {
    const filtros = parseFiltros(req.query);
    const datos = await obtenerReportePagos(filtros);

    res.json({ total: datos.length, datos });
  } catch (err) {
    logger.error("Error getReportePagos:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/auditoria
 * Lista de actividad relevante del sistema para administradores.
 */
export const getReporteAuditoria = async (req, res) => {
  try {
    const filtros = parseFiltrosAuditoria(req.query);
    const datos = await obtenerRegistrosAuditoria(filtros);

    res.json({
      total: datos.length,
      datos,
    });

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "READ",
      tabla_afectada: "auditoria",
      detalle: {
        evento: "CONSULTA_REPORTE_AUDITORIA",
        total: datos.length,
      },
    });
  } catch (err) {
    logger.error("Error getReporteAuditoria:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/logs-aplicacion
 * Eventos del log de aplicación con IP (requiere auditoria:ver).
 */
export const getLogsAplicacion = async (req, res) => {
  try {
    const limiteNum = Number(req.query.limite);
    const limite = Number.isInteger(limiteNum) && limiteNum > 0
      ? Math.min(limiteNum, 500) : 100;

    const filtros = {
      limite,
      nivel: req.query.nivel || undefined,
      modulo: req.query.modulo || undefined,
      evento: req.query.evento || undefined,
      desde: req.query.desde ? new Date(req.query.desde) : undefined,
      hasta: req.query.hasta ? new Date(req.query.hasta + "T23:59:59") : undefined,
    };

    const datos = await obtenerLogsAplicacion(filtros);
    res.json({ total: datos.length, datos });
  } catch (err) {
    logger.error("Error getLogsAplicacion:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/logs-seguridad
 * Eventos del log de seguridad con IP (requiere logs:seguridad).
 */
export const getLogsSeguridad = async (req, res) => {
  try {
    const limiteNum = Number(req.query.limite);
    const limite = Number.isInteger(limiteNum) && limiteNum > 0
      ? Math.min(limiteNum, 500) : 100;

    const filtros = {
      limite,
      evento: req.query.evento || undefined,
      exito: req.query.exito !== undefined ? req.query.exito : undefined,
      ip: req.query.ip || undefined,
      email: req.query.email || undefined,
      desde: req.query.desde ? new Date(req.query.desde) : undefined,
      hasta: req.query.hasta ? new Date(req.query.hasta + "T23:59:59") : undefined,
    };

    const datos = await obtenerLogsSeguridad(filtros);
    res.json({ total: datos.length, datos });
  } catch (err) {
    logger.error("Error getLogsSeguridad:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─── Endpoints PDF ────────────────────────────────────────────────────────────

/**
 * GET /api/reportes/inscripciones/pdf
 * Descarga el reporte de inscripciones en PDF.
 */
export const descargarPDFInscripciones = async (req, res) => {
  try {
    const filtros = parseFiltros(req.query);
    const [datos, resumen] = await Promise.all([
      obtenerReporteInscripciones(filtros),
      obtenerResumenEstadisticas(),
    ]);

    const pdfBuffer = await generarPDFInscripciones(datos, resumen);

    const fecha = new Date().toISOString().slice(0, 10);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte_inscripciones_${fecha}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    logApp({ nivel: "INFO", modulo: "reportes", evento: "PDF_INSCRIPCIONES_DESCARGADO",
      mensaje: "Reporte de inscripciones PDF descargado",
      usuario_id: req.usuario?.id, detalle: { filtros }, req });
    res.send(pdfBuffer);
  } catch (err) {
    logger.error("Error descargarPDFInscripciones:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * GET /api/reportes/pagos/pdf
 * Descarga el reporte de pagos en PDF.
 */
export const descargarPDFPagos = async (req, res) => {
  try {
    const filtros = parseFiltros(req.query);
    const [datos, resumen] = await Promise.all([
      obtenerReportePagos(filtros),
      obtenerResumenEstadisticas(),
    ]);

    const pdfBuffer = await generarPDFPagos(datos, resumen);

    const fecha = new Date().toISOString().slice(0, 10);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte_pagos_${fecha}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    logApp({ nivel: "INFO", modulo: "reportes", evento: "PDF_PAGOS_DESCARGADO",
      mensaje: "Reporte de pagos PDF descargado",
      usuario_id: req.usuario?.id, detalle: { filtros }, req });
    res.send(pdfBuffer);
  } catch (err) {
    logger.error("Error descargarPDFPagos:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
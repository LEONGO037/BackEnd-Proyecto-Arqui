// src/controllers/reportes/reportes.controller.js
import {
  obtenerReporteInscripciones,
  obtenerReportePagos,
  obtenerResumenEstadisticas,
  obtenerInscripcionesPorCurso,
} from "../../models/reportes/reportes.model.js";
import {
  generarPDFInscripciones,
  generarPDFPagos,
} from "../../services/reportes/reportes.pdf.service.js";

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
    console.error("Error getResumenReporte:", err.message);
    res.status(500).json({ error: err.message });
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
    console.error("Error getReporteInscripciones:", err.message);
    res.status(500).json({ error: err.message });
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
    console.error("Error getReportePagos:", err.message);
    res.status(500).json({ error: err.message });
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
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error descargarPDFInscripciones:", err.message);
    res.status(500).json({ error: err.message });
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
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error descargarPDFPagos:", err.message);
    res.status(500).json({ error: err.message });
  }
};
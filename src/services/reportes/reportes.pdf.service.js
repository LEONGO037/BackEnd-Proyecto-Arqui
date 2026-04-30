// src/services/reportes/reportes.pdf.service.js
import PDFDocument from "pdfkit";

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLOR_PRIMARIO  = "#003366";
const COLOR_ACENTO    = "#0369a1";
const COLOR_FONDO_TH  = "#e0eaf4";
const COLOR_FILA_PAR  = "#f8fafc";
const COLOR_TEXTO      = "#1e293b";
const COLOR_GRIS       = "#64748b";
const COLOR_LINEA      = "#cbd5e1";

// Dimensiones landscape A4
const PAGE_W = 841;
const PAGE_H = 595;
const MARGIN  = 50;
const CONTENT_W = PAGE_W - MARGIN * 2; // 741

// ─── Utilidades ───────────────────────────────────────────────────────────────
const formatFecha = (fecha) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const formatMonto = (monto) =>
  Number(monto || 0).toFixed(2);

/**
 * Encabezado compartido para todos los PDFs de reporte.
 * FIX: usa PAGE_W para cubrir todo el ancho landscape.
 */
const dibujarEncabezado = (doc, titulo, subtitulo) => {
  // Barra azul superior — ancho completo landscape
  doc.fillColor(COLOR_PRIMARIO).rect(0, 0, PAGE_W, 70).fill();

  // Título izquierda
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("X College Nexus", MARGIN, 18, { align: "left" });

  doc
    .fontSize(11)
    .font("Helvetica")
    .text("Sistema de Gestión de Cursos", MARGIN, 40, { align: "left" });

  // Título del reporte (derecha)
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(titulo, 0, 22, { align: "right", width: PAGE_W - MARGIN });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(subtitulo, 0, 40, { align: "right", width: PAGE_W - MARGIN });

  // Posicionar cursor debajo del encabezado
  doc.y = 85;
};

/**
 * Pie de página con número de página.
 * FIX: usa coordenadas landscape correctas (PAGE_H ≈ 595).
 */
const dibujarPie = (doc) => {
  const pageCount = doc.bufferedPageRange().count;
  const footerY = PAGE_H - 30;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .moveTo(MARGIN, footerY - 5)
      .lineTo(PAGE_W - MARGIN, footerY - 5)
      .strokeColor(COLOR_LINEA)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(COLOR_GRIS)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generado el ${new Date().toLocaleString("es-BO")}   ·   Página ${i + 1} de ${pageCount}`,
        MARGIN, footerY, { align: "center", width: CONTENT_W }
      );
  }
};

/**
 * Dibuja una fila de tabla con celdas alineadas.
 */
const dibujarFila = (doc, y, cols, opciones = {}) => {
  const { esCabecera = false, esPar = false } = opciones;
  const altoFila = 18;

  if (esCabecera) {
    doc.fillColor(COLOR_FONDO_TH).rect(MARGIN, y - 4, CONTENT_W, altoFila).fill();
  } else if (esPar) {
    doc.fillColor(COLOR_FILA_PAR).rect(MARGIN, y - 4, CONTENT_W, altoFila).fill();
  }

  doc
    .fillColor(esCabecera ? COLOR_PRIMARIO : COLOR_TEXTO)
    .font(esCabecera ? "Helvetica-Bold" : "Helvetica")
    .fontSize(esCabecera ? 8 : 7.5);

  cols.forEach(({ x, w, text, align = "left" }) => {
    doc.text(String(text ?? "—"), x, y, { width: w, align, lineBreak: false });
  });

  // Línea inferior
  doc
    .moveTo(MARGIN, y + altoFila - 4)
    .lineTo(PAGE_W - MARGIN, y + altoFila - 4)
    .strokeColor(COLOR_LINEA)
    .lineWidth(0.3)
    .stroke();

  return y + altoFila;
};

/**
 * Dibuja 4 tarjetas KPI en una sola fila horizontal.
 * FIX: captura tarjY UNA vez antes del forEach para que todas queden al mismo nivel.
 */
const dibujarTarjetas = (doc, tarjetas) => {
  const tarjW = Math.floor((CONTENT_W - 30) / 4); // 4 tarjetas con 10px de gap
  const tarjH = 48;
  const tarjY = doc.y; // ← capturado UNA vez, fuera del loop

  tarjetas.forEach((t, i) => {
    const tx = MARGIN + i * (tarjW + 10);
    // todas usan tarjY fijo
    doc.fillColor(COLOR_ACENTO).roundedRect(tx, tarjY, tarjW, tarjH, 4).fill();
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(String(t.valor), tx + 8, tarjY + 7, { width: tarjW - 16, align: "center", lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(t.label, tx + 8, tarjY + 27, { width: tarjW - 16, align: "center", lineBreak: false });
  });

  // Avanzar cursor manualmente debajo de las tarjetas
  doc.y = tarjY + tarjH + 20;
};

// ─── PDF: Reporte de Inscripciones ───────────────────────────────────────────
export const generarPDFInscripciones = (datos, resumen) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true, layout: "landscape" });
      const buffers = [];

      doc.on("data", (b) => buffers.push(b));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      dibujarEncabezado(
        doc,
        "REPORTE DE INSCRIPCIONES",
        `Total registros: ${datos.length}`
      );

      // ── Tarjetas de resumen (todas en la misma fila) ──────────────────────
      dibujarTarjetas(doc, [
        { label: "Total inscritos",   valor: resumen.total_inscripciones },
        { label: "Estudiantes únicos", valor: resumen.total_estudiantes },
        { label: "Pagos confirmados", valor: resumen.pagos_completados },
        { label: "Ingresos totales",  valor: `Bs ${formatMonto(resumen.ingresos_totales_bs)}` },
      ]);

      // ── Tabla ─────────────────────────────────────────────────────────────
      // Columnas ajustadas al ancho landscape (741 usable)
      const COLS = [
        { key: "fecha",   label: "Fecha",           x: 50,   w: 60  },
        { key: "nombre",  label: "Estudiante",       x: 113,  w: 210 },
        { key: "curso",   label: "Curso",            x: 329,  w: 150 },
        { key: "costo",   label: "Costo (Bs)",       x: 482,  w: 60, align: "right" },
        { key: "estado",  label: "Estado Académico", x: 545,  w: 80 },
        { key: "pago",    label: "Estado Pago",      x: 628,  w: 70 },
        { key: "ref",     label: "Ref. PayPal",      x: 701,  w: 90 },
      ];

      let y = doc.y;
      y = dibujarFila(doc, y, COLS.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.align })), { esCabecera: true });

      const MAX_Y = PAGE_H - 50;

      datos.forEach((row, i) => {
        if (y > MAX_Y) {
          doc.addPage({ layout: "landscape" });
          dibujarEncabezado(doc, "REPORTE DE INSCRIPCIONES", "(continuación)");
          y = doc.y;
          y = dibujarFila(doc, y, COLS.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.align })), { esCabecera: true });
        }

        y = dibujarFila(doc, y, [
          { x: 50,  w: 60,  text: formatFecha(row.fecha_registro) },
          { x: 113, w: 210, text: `${row.estudiante_nombre} ${row.estudiante_apellido}` },
          { x: 329, w: 150, text: row.curso_nombre },
          { x: 482, w: 60,  text: formatMonto(row.costo_bs), align: "right" },
          { x: 545, w: 80,  text: row.estado_academico || "—" },
          { x: 628, w: 70,  text: row.estado_pago || "PENDIENTE" },
          { x: 701, w: 90,  text: row.referencia_paypal ? row.referencia_paypal.slice(0, 14) + "…" : "—" },
        ], { esPar: i % 2 === 0 });
      });

      dibujarPie(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── PDF: Reporte de Pagos ────────────────────────────────────────────────────
export const generarPDFPagos = (datos, resumen) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true, layout: "landscape" });
      const buffers = [];

      doc.on("data", (b) => buffers.push(b));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      dibujarEncabezado(
        doc,
        "REPORTE DE PAGOS",
        `Total pagos confirmados: ${datos.length}`
      );

      // ── Tarjetas (todas en la misma fila) ─────────────────────────────────
      dibujarTarjetas(doc, [
        { label: "Pagos confirmados",  valor: resumen.pagos_completados },
        { label: "Ingresos (Bs)",      valor: `Bs ${formatMonto(resumen.ingresos_totales_bs)}` },
        { label: "Ingresos (USD)",     valor: `$ ${formatMonto(resumen.ingresos_totales_usd)}` },
        { label: "Estudiantes únicos", valor: resumen.total_estudiantes },
      ]);

      // ── Tabla ─────────────────────────────────────────────────────────────
      const COLS = [
        { label: "Fecha Pago",        x: 50,   w: 65 },
        { label: "Estudiante",        x: 118,  w: 220 },
        { label: "Curso",             x: 344,  w: 155 },
        { label: "Monto (Bs)",        x: 502,  w: 60,  align: "right" },
        { label: "Monto (USD)",       x: 565,  w: 55,  align: "right" },
        { label: "Método",            x: 623,  w: 55 },
        { label: "Referencia PayPal", x: 681,  w: 110 },
      ];

      let y = doc.y;
      y = dibujarFila(doc, y, COLS.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.align })), { esCabecera: true });

      const MAX_Y = PAGE_H - 50;

      datos.forEach((row, i) => {
        if (y > MAX_Y) {
          doc.addPage({ layout: "landscape" });
          dibujarEncabezado(doc, "REPORTE DE PAGOS", "(continuación)");
          y = doc.y;
          y = dibujarFila(doc, y, COLS.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.align })), { esCabecera: true });
        }

        y = dibujarFila(doc, y, [
          { x: 50,  w: 65,  text: formatFecha(row.fecha_pago) },
          { x: 118, w: 220, text: `${row.estudiante_nombre} ${row.estudiante_apellido}` },
          { x: 344, w: 155, text: row.curso_nombre },
          { x: 502, w: 60,  text: formatMonto(row.monto_bs), align: "right" },
          { x: 565, w: 55,  text: formatMonto(row.monto_usd), align: "right" },
          { x: 623, w: 55,  text: row.metodo_pago || "PayPal" },
          { x: 681, w: 110, text: row.referencia_paypal || "—" },
        ], { esPar: i % 2 === 0 });
      });

      dibujarPie(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
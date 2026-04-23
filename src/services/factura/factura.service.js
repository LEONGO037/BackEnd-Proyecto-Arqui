// src/services/factura.service.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Genera un buffer PDF con la factura del pago
 * @param {Object} datos - Información para la factura
 * @param {Object} datos.cliente - { nombre, email, nit (opcional) }
 * @param {Array} datos.cursos - Lista de cursos [{ nombre, costo, cantidad: 1 }]
 * @param {number} datos.totalBs - Total en bolivianos
 * @param {string} datos.transaccionId - ID de la transacción PayPal
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
export const generarFacturaPDF = (datos) => {
  return new Promise((resolve, reject) => {
    try {
      // El tamaño A4 tiene 595.28 puntos de ancho. Con márgenes de 50, nos quedan 495 de ancho usable.
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      const anchoUsable = 495; 

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Agregar el Logo ---
      const logoPath = path.resolve('src/assets/logo.png'); 
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 130 }); 
      }

      // --- Encabezado ---
      doc.fontSize(20).font('Helvetica-Bold').text('FACTURA', { align: 'center', width: anchoUsable });
      
      if (doc.y < 120) {
        doc.y = 120;
      } else {
        doc.moveDown();
      }

      // Datos del emisor
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`X College Nexus`); 
      doc.font('Helvetica');
      doc.text(`NIT: 1020141023`);
      doc.text(`Fecha y hora: ${new Date().toLocaleString('es-BO')}`);
      doc.moveDown(1.5);

      // Datos del cliente
      doc.font('Helvetica-Bold').text('Datos del Cliente:');
      doc.font('Helvetica');
      doc.text(`Razón Social/Nombre: ${datos.cliente.nombre}`);
      doc.text(`Email: ${datos.cliente.email}`);
      if (datos.cliente.nit) doc.text(`NIT/CI: ${datos.cliente.nit}`);
      doc.moveDown(2);

      // --- Tabla de productos ---
      const tableTop = doc.y;
      
      // Coordenadas X para las columnas
      const colNro = 60;
      const colNombre = 100;
      const colCant = 320;
      const colPrecio = 380;
      const colSubtotal = 460;

      // 1. Dibujar el fondo del encabezado de la tabla (Gris claro)
      doc.fillColor('#f1f5f9').rect(50, tableTop - 5, anchoUsable, 20).fill();

      // 2. Textos del encabezado
      doc.fillColor('#003366').font('Helvetica-Bold');
      doc.text('N°', colNro, tableTop);
      doc.text('Descripción del Curso', colNombre, tableTop);
      doc.text('Cant.', colCant, tableTop);
      doc.text('P/U (Bs)', colPrecio, tableTop);
      doc.text('Subtotal', colSubtotal, tableTop);

      // Línea inferior del encabezado
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // 3. Filas de la tabla
      doc.fillColor('#333333').font('Helvetica');
      let y = tableTop + 25;
      let total = 0;

      datos.cursos.forEach((curso, index) => {
        const cantidad = curso.cantidad || 1;
        const precioUnitario = curso.costo;
        const subtotal = cantidad * precioUnitario;
        total += subtotal;

        doc.text((index + 1).toString(), colNro, y);
        // Le damos un ancho máximo al nombre para que si es muy largo, baje a la siguiente línea
        doc.text(curso.nombre, colNombre, y, { width: 200 }); 
        
        // Ajustamos la altura de 'y' por si el texto del curso usó más de una línea
        const currentY = doc.y; 
        
        // Regresamos la posición Y a la original para alinear el resto de columnas
        doc.text(cantidad.toString(), colCant, y);
        doc.text(precioUnitario.toFixed(2), colPrecio, y);
        doc.text(subtotal.toFixed(2), colSubtotal, y);
        
        // Actualizamos 'y' a la posición más baja que alcanzó el texto
        y = Math.max(currentY, y + 15);

        // Dibujar línea separadora sutil debajo de cada ítem
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        
        y += 10; // Espaciado para la siguiente fila
      });

      // --- Línea de Total ---
      doc.moveDown(1.5);
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12);
      // Usamos el width completo para alinear a la derecha perfectamente
      doc.text(`TOTAL: ${total.toFixed(2)} Bs`, 50, doc.y, { width: anchoUsable, align: 'right' });

      doc.font('Helvetica').fontSize(10);
      doc.text(`Monto pagado: ${total.toFixed(2)} Bs`, { width: anchoUsable, align: 'right' });
      doc.text('Cambio: 0.0 Bs', { width: anchoUsable, align: 'right' });
      doc.moveDown(3);

      // --- Leyendas obligatorias ---
      // Forzamos el uso del anchoUsable (495) para que centre usando toda la página
      doc.fontSize(8).fillColor('#666666');
      
      const textoLeyenda1 = 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY';
      doc.text(textoLeyenda1, 50, doc.y, { width: anchoUsable, align: 'center' });
      doc.moveDown(0.5);
      
      const textoLeyenda2 = 'Ley N° 453: El proveedor debe exhibir certificaciones de habilitación o documentos que acrediten las capacidades u ofertas de servicios especializados.';
      doc.text(textoLeyenda2, 50, doc.y, { width: anchoUsable, align: 'center' });
      doc.moveDown(0.5);
      
      const textoLeyenda3 = 'Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una modalidad de facturación fuera de línea.';
      doc.text(textoLeyenda3, 50, doc.y, { width: anchoUsable, align: 'center' });
      
      doc.moveDown(2);
      doc.fontSize(8).text(`Transacción PayPal: ${datos.transaccionId}`, 50, doc.y, { width: anchoUsable, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
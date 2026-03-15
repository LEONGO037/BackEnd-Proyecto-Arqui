import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Genera un certificado de aprobación en PDF
 * @param {Object} datos
 * @param {string} datos.nombreCompleto - Nombre completo del estudiante
 * @param {string} datos.cursoNombre - Nombre del curso
 * @param {number} datos.nota - Nota final obtenida
 * @returns {Promise<Buffer>}
 */
export const generarCertificadoPDF = (datos) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const buffers = [];
      const anchoUsable = 475;

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Logo
      const logoPath = path.resolve('src/assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 60, 50, { width: 110 });
      }

      // Encabezado
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#0369a1')
        .text('X College Nexus', 60, 55, { align: 'right', width: anchoUsable });

      doc.moveDown(4);

      // Borde decorativo superior
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#003366').lineWidth(2).stroke();
      doc.moveDown(1.5);

      // Título
      doc
        .fontSize(26)
        .font('Helvetica-Bold')
        .fillColor('#003366')
        .text('CERTIFICADO DE APROBACIÓN', 60, doc.y, { align: 'center', width: anchoUsable });

      doc.moveDown(2);

      // Cuerpo del certificado
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text('X College Nexus certifica que:', 60, doc.y, { align: 'center', width: anchoUsable });

      doc.moveDown(1.5);

      // Nombre del estudiante
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#003366')
        .text(datos.nombreCompleto, 60, doc.y, { align: 'center', width: anchoUsable });

      doc.moveDown(1.5);

      // Texto descriptivo
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text('ha aprobado satisfactoriamente el curso:', 60, doc.y, {
          align: 'center',
          width: anchoUsable,
        });

      doc.moveDown(1);

      // Nombre del curso
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0369a1')
        .text(datos.cursoNombre, 60, doc.y, { align: 'center', width: anchoUsable });

      doc.moveDown(1.5);

      // Nota obtenida
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text(`Nota final obtenida: ${datos.nota}/100`, 60, doc.y, {
          align: 'center',
          width: anchoUsable,
        });

      doc.moveDown(2);

      // Borde decorativo inferior
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#003366').lineWidth(2).stroke();

      doc.moveDown(2);

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Emitido el ${fechaEmision}`, 60, doc.y, { align: 'center', width: anchoUsable });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

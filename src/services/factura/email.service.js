// src/services/email.service.js
import nodemailer from 'nodemailer';

// Configuración del transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un correo con la factura adjunta
 * @param {string} destinatario - Correo del destinatario
 * @param {Buffer} pdfBuffer - Buffer del PDF generado
 * @param {Object} datosPago - Datos del pago (para el texto del correo)
 * @returns {Promise} - Resultado del envío
 */
export const enviarFacturaPorCorreo = async (destinatario, pdfBuffer, datosPago) => {
  const cursosLista = datosPago.cursos.map(c => `- ${c.nombre}`).join('\n');
  const mailOptions = {
    from: `"Taller de Grado UCB" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: `Factura de pago - Inscripción a cursos`,
    text: `Hola ${datosPago.cliente.nombre},\n\nAdjuntamos la factura correspondiente a tu pago por los siguientes cursos:\n${cursosLista}\n\nMonto total: ${datosPago.totalBs} Bs.\n\nGracias por tu inscripción.\n\nSaludos,\nTX College Nexus`,
    attachments: [
      {
        filename: `factura_${Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};
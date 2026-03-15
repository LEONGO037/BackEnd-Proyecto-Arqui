import nodemailer from 'nodemailer';
import { generarCertificadoPDF } from './certificado.pdf.service.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const NOTA_MINIMA_APROBACION = 51;

/**
 * Envía el correo correspondiente al resultado final del estudiante.
 * Si aprueba, adjunta el certificado en PDF. Si reprueba, notifica sin adjunto.
 *
 * @param {string} email - Correo del estudiante
 * @param {string} nombreCompleto - Nombre completo del estudiante
 * @param {string} cursoNombre - Nombre del curso
 * @param {number} nota - Nota final registrada
 */
export const enviarNotificacionResultado = async (email, nombreCompleto, cursoNombre, nota) => {
  const aprobo = nota >= NOTA_MINIMA_APROBACION;

  if (aprobo) {
    const pdfBuffer = await generarCertificadoPDF({ nombreCompleto, cursoNombre, nota });

    const mailOptions = {
      from: `"X College Nexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `¡Felicitaciones! Aprobaste el curso: ${cursoNombre}`,
      text:
        `Hola ${nombreCompleto},\n\n` +
        `Nos complace informarte que has aprobado el curso "${cursoNombre}" con una nota final de ${nota}/100.\n\n` +
        `Adjunto encontrarás tu certificado de aprobación.\n\n` +
        `¡Felicitaciones por tu esfuerzo!\n\nX College Nexus`,
      attachments: [
        {
          filename: `certificado_${cursoNombre.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    return await transporter.sendMail(mailOptions);
  } else {
    const mailOptions = {
      from: `"X College Nexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Resultado final: ${cursoNombre}`,
      text:
        `Hola ${nombreCompleto},\n\n` +
        `Te informamos que tu nota final en el curso "${cursoNombre}" fue de ${nota}/100, ` +
        `lo cual no alcanza la nota mínima de aprobación (${NOTA_MINIMA_APROBACION}/100).\n\n` +
        `Si tienes consultas sobre tu calificación, comunícate con tu docente.\n\n` +
        `Atentamente,\nX College Nexus`,
    };

    return await transporter.sendMail(mailOptions);
  }
};

import { enviarEmail } from '../email.service.js';
import { generarCertificadoPDF } from './certificado.pdf.service.js';

const NOTA_MINIMA_APROBACION = 51;

export const enviarNotificacionResultado = async (email, nombreCompleto, cursoNombre, nota) => {
  const aprobo = nota >= NOTA_MINIMA_APROBACION;

  if (aprobo) {
    const pdfBuffer = await generarCertificadoPDF({ nombreCompleto, cursoNombre, nota });
    await enviarEmail({
      to: email,
      subject: `¡Felicitaciones! Aprobaste el curso: ${cursoNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem">
          <h2 style="color:#003366">College X Nexus</h2>
          <p>Hola <strong>${nombreCompleto}</strong>,</p>
          <p>Nos complace informarte que aprobaste el curso <strong>"${cursoNombre}"</strong>
             con una nota final de <strong>${nota}/100</strong>.</p>
          <p>Adjunto encontrarás tu certificado de aprobación.</p>
          <p>¡Felicitaciones por tu esfuerzo!</p>
        </div>
      `,
      attachments: [
        {
          filename: `certificado_${cursoNombre.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } else {
    await enviarEmail({
      to: email,
      subject: `Resultado final: ${cursoNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem">
          <h2 style="color:#003366">College X Nexus</h2>
          <p>Hola <strong>${nombreCompleto}</strong>,</p>
          <p>Tu nota final en el curso <strong>"${cursoNombre}"</strong> fue de
             <strong>${nota}/100</strong>, que no alcanza la nota mínima
             de aprobación (${NOTA_MINIMA_APROBACION}/100).</p>
          <p>Si tienes consultas sobre tu calificación, comunícate con tu docente.</p>
        </div>
      `,
    });
  }
};

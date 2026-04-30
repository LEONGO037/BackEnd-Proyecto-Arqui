import { enviarEmail } from '../email.service.js';

export const enviarFacturaPorCorreo = async (destinatario, pdfBuffer, datosPago) => {
  const cursosLista = datosPago.cursos.map(c => `<li>${c.nombre}</li>`).join('');
  await enviarEmail({
    to: destinatario,
    subject: 'Factura de pago — Inscripción a cursos',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem">
        <h2 style="color:#003366">College X Nexus</h2>
        <p>Hola <strong>${datosPago.cliente.nombre}</strong>,</p>
        <p>Adjuntamos la factura correspondiente a tu pago por los siguientes cursos:</p>
        <ul>${cursosLista}</ul>
        <p><strong>Monto total:</strong> ${datosPago.totalBs} Bs.</p>
        <p>Gracias por tu inscripción.</p>
      </div>
    `,
    attachments: [
      {
        filename: `factura_${Date.now()}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

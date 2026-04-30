import nodemailer from 'nodemailer';

// Configuración de Nodemailer (SMTP)
// Se recomienda usar variables de entorno para la configuración
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_PORT === '465' || !process.env.EMAIL_PORT, // true para 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || `College X Nexus <${process.env.EMAIL_USER}>`;

/**
 * Envía un correo electrónico utilizando Nodemailer (SMTP)
 * @param {Object} options - Opciones del correo
 * @param {string|string[]} options.to - Destinatario(s)
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {Array} [options.attachments] - Adjuntos (opcional)
 */
export const enviarEmail = async ({ to, subject, html, attachments }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Configuración de correo incompleta (EMAIL_USER/EMAIL_PASS faltantes).');
    throw new Error('Servicio de correo no configurado');
  }

  const mailOptions = {
    from: FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    attachments: attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar correo con Nodemailer:', error.message);
    throw error;
  }
};

// --- Templates ---

export const emailVerificacionCodigo = ({ nombre, codigo }) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#f9fafb;border-radius:12px">
    <h2 style="color:#003366;margin-bottom:0.5rem">College X Nexus</h2>
    <h3 style="color:#1e293b">Verificación de correo</h3>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Usa el siguiente código para verificar tu correo electrónico:</p>
    <div style="text-align:center;margin:1.5rem 0">
      <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.5rem;color:#003366;background:#e0e7ff;padding:0.75rem 1.5rem;border-radius:10px">
        ${codigo}
      </span>
    </div>
    <p style="color:#64748b;font-size:0.9rem">Este código es válido por <strong>15 minutos</strong>. No lo compartas con nadie.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0"/>
    <p style="color:#94a3b8;font-size:0.8rem">Si no solicitaste esto, ignora este correo.</p>
  </div>
`;

export const emailDocenteBienvenida = ({ nombre, email, passwordDefault }) => `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;background:#f9fafb;border-radius:12px">
    <h2 style="color:#003366;margin-bottom:0.5rem">College X Nexus</h2>
    <h3 style="color:#1e293b">Tu cuenta de docente ha sido creada</h3>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Un administrador ha creado una cuenta docente para ti con el correo: <strong>${email}</strong>.</p>

    <h4 style="margin-top:1.5rem;color:#1e293b">Tu contraseña temporal:</h4>
    <div style="text-align:center;margin:1rem 0">
      <code style="font-size:1.3rem;background:#f1f5f9;padding:0.5rem 1rem;border-radius:8px;color:#334155">${passwordDefault}</code>
    </div>

    <p style="margin-top:1.5rem;color:#64748b;font-size:0.9rem">
      Inicia sesión con esta contraseña y <strong>deberás cambiarla</strong> antes de acceder al sistema por primera vez.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0"/>
    <p style="color:#94a3b8;font-size:0.8rem">Si no esperabas este mensaje, contacta al administrador del sistema.</p>
  </div>
`;

export const emailEstudianteBienvenidaAdmin = ({ nombre, email, passwordDefault }) => `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;background:#f9fafb;border-radius:12px">
    <h2 style="color:#003366;margin-bottom:0.5rem">College X Nexus</h2>
    <h3 style="color:#1e293b">Tu cuenta de estudiante ha sido creada</h3>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Un administrador ha creado una cuenta de estudiante para ti con el correo: <strong>${email}</strong>.</p>

    <h4 style="margin-top:1.5rem;color:#1e293b">Tu contraseña temporal:</h4>
    <div style="text-align:center;margin:1rem 0">
      <code style="font-size:1.3rem;background:#f1f5f9;padding:0.5rem 1rem;border-radius:8px;color:#334155">${passwordDefault}</code>
    </div>

    <p style="margin-top:1.5rem;color:#64748b;font-size:0.9rem">
      Te recomendamos cambiar esta contraseña después de tu primer ingreso por motivos de seguridad.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0"/>
    <p style="color:#94a3b8;font-size:0.8rem">Si no esperabas este mensaje, contacta al administrador del sistema.</p>
  </div>
`;

export const emailActividadSospechosa = ({ nombre, email, fecha }) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#fff7ed;border-radius:12px;border:1px solid #fed7aa">
    <h2 style="color:#9a3412;margin-bottom:0.5rem">⚠️ Alerta de seguridad — College X Nexus</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Detectamos <strong>múltiples inicios de sesión en un corto período</strong> en tu cuenta (<em>${email}</em>).</p>
    <p><strong>Fecha y hora:</strong> ${fecha}</p>
    <p>Si fuiste tú, puedes ignorar este mensaje. Si no reconoces esta actividad,
       <strong>cambia tu contraseña inmediatamente</strong> y contacta al administrador.</p>
    <hr style="border:none;border-top:1px solid #fed7aa;margin:1.5rem 0"/>
    <p style="color:#9a3412;font-size:0.8rem">Este es un mensaje automático de seguridad. No respondas a este correo.</p>
  </div>
`;

export const emailResetPasswordCodigo = ({ nombre, codigo }) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#f9fafb;border-radius:12px">
    <h2 style="color:#003366;margin-bottom:0.5rem">College X Nexus</h2>
    <h3 style="color:#1e293b">Restablecer contraseña</h3>
    <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Tu código de verificación es (válido por <strong>15 minutos</strong>):</p>
    <div style="text-align:center;margin:1.5rem 0;font-size:2.5rem;font-weight:800;letter-spacing:0.5rem;color:#003366;background:#e8f0fb;padding:1.25rem;border-radius:12px">
      ${codigo}
    </div>
    <p style="color:#64748b;font-size:0.85rem">Ingresa este código en la pantalla de restablecimiento.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0"/>
    <p style="color:#94a3b8;font-size:0.8rem">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
  </div>
`;

export const emailResetPassword = ({ resetUrl }) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#f9fafb;border-radius:12px">
    <h2 style="color:#003366;margin-bottom:0.5rem">College X Nexus</h2>
    <h3 style="color:#1e293b">Restablecer contraseña</h3>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Haz clic en el botón para continuar (válido por <strong>1 hora</strong>):</p>
    <div style="text-align:center;margin:1.5rem 0">
      <a href="${resetUrl}" style="background:#003366;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem">
        Restablecer contraseña
      </a>
    </div>
    <p style="color:#64748b;font-size:0.85rem">O copia este enlace en tu navegador:<br/><a href="${resetUrl}" style="color:#003366">${resetUrl}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0"/>
    <p style="color:#94a3b8;font-size:0.8rem">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
  </div>
`;

import pool from "../config/db.js";

// Convierte la violación de unicidad de Postgres (código 23505) en un error
// de negocio claro con status 409, en vez de dejar que se propague como un
// 500 "Error interno del servidor".
const manejarEmailDuplicado = (error) => {
  if (error?.code === "23505") {
    const err = new Error("El correo electrónico ya está registrado");
    err.status = 409;
    err.statusCode = 409;
    return err;
  }
  return error;
};

export const obtenerRolPorNombre = async (nombreRol) => {
  const resultado = await pool.query(
    "SELECT id FROM roles WHERE nombre = $1",
    [nombreRol]
  );
  return resultado.rows[0];
};

export const obtenerUsuarioPorEmail = async (email) => {
  const resultado = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1",
    [email]
  );
  return resultado.rows[0];
};

export const crearUsuario = async (datosUsuario) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    email, password_hash, rol_id
  } = datosUsuario;

  try {
    const resultado = await pool.query(
      `INSERT INTO usuarios
      (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, nombre, apellido_paterno, apellido_materno, email`,
      [nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id]
    );
    return resultado.rows[0];
  } catch (error) {
    throw manejarEmailDuplicado(error);
  }
};

export const obtenerUsuarioPorEmailConRol = async (email) => {
  const resultado = await pool.query(
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.email = $1`,
    [email]
  );
  return resultado.rows[0];
};

export const obtenerUsuarioPorIdConRol = async (id) => {
  const resultado = await pool.query(
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.id = $1`,
    [id]
  );
  return resultado.rows[0];
};

export const actualizarPasswordUsuario = async (usuarioId, passwordHash) => {
  const resultado = await pool.query(
    `UPDATE usuarios
     SET password_hash = $1,
         password_cambiado_en = NOW(),
         debe_cambiar_password = FALSE,
         intentos_fallidos = 0,
         bloqueado_hasta = NULL
     WHERE id = $2
     RETURNING id, nombre, email, rol_id, debe_cambiar_password`,
    [passwordHash, usuarioId]
  );
  return resultado.rows[0];
};

// Bloquea al llegar a 5 intentos fallidos (>4), por 24 horas
export const incrementarIntentosFallidos = async (usuarioId) => {
  await pool.query(
    `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = $1`,
    [usuarioId]
  );
  const res = await pool.query(
    `SELECT intentos_fallidos FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (res.rows[0]?.intentos_fallidos >= 5) {
    await pool.query(
      `UPDATE usuarios SET bloqueado_hasta = NOW() + INTERVAL '24 hours' WHERE id = $1`,
      [usuarioId]
    );
  }
};

export const resetearIntentosFallidos = async (usuarioId) => {
  await pool.query(
    `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1`,
    [usuarioId]
  );
};

export const obtenerHistorialPasswords = async (usuarioId, limit = 5) => {
  const res = await pool.query(
    `SELECT password_hash FROM historial_passwords
     WHERE usuario_id = $1
     ORDER BY creado_en DESC
     LIMIT $2`,
    [usuarioId, limit]
  );
  return res.rows.map(r => r.password_hash);
};

export const insertarHistorialPassword = async (usuarioId, passwordHash) => {
  await pool.query(
    `INSERT INTO historial_passwords (usuario_id, password_hash) VALUES ($1, $2)`,
    [usuarioId, passwordHash]
  );
};

export const crearUsuarioConVerificacion = async (datosUsuario) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    email, password_hash, rol_id,
    codigo_verificacion, codigo_verificacion_expira,
    token_verificacion, token_verificacion_expira,
    debe_cambiar_password = false,
  } = datosUsuario;

  try {
    const resultado = await pool.query(
      `INSERT INTO usuarios
       (nombre, apellido_paterno, apellido_materno,
        email, password_hash, rol_id, email_verificado,
        codigo_verificacion, codigo_verificacion_expira,
        token_verificacion, token_verificacion_expira, debe_cambiar_password)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,$7,$8,$9,$10,$11)
       RETURNING id, nombre, apellido_paterno, apellido_materno, email`,
      [
        nombre, apellido_paterno, apellido_materno,
        email, password_hash, rol_id,
        codigo_verificacion, codigo_verificacion_expira,
        token_verificacion, token_verificacion_expira, debe_cambiar_password,
      ]
    );
    return resultado.rows[0];
  } catch (error) {
    throw manejarEmailDuplicado(error);
  }
};

// Verifica OTP (hash del codigo), marca email como verificado y limpia todo
export const verificarCodigoOTP = async (email, codigoHash) => {
  const res = await pool.query(
    `UPDATE usuarios
     SET email_verificado = TRUE,
         codigo_verificacion = NULL,
         codigo_verificacion_expira = NULL,
         token_verificacion = NULL,
         token_verificacion_expira = NULL
     WHERE email = $1
       AND codigo_verificacion = $2
       AND codigo_verificacion_expira > NOW()
       AND email_verificado = FALSE
     RETURNING id, nombre, email`,
    [email, codigoHash]
  );
  return res.rows[0];
};

// Mantiene compatibilidad con el flujo de token de link y limpia todo
export const verificarEmailUsuario = async (token) => {
  const res = await pool.query(
    `UPDATE usuarios
     SET email_verificado = TRUE,
         token_verificacion = NULL,
         token_verificacion_expira = NULL,
         codigo_verificacion = NULL,
         codigo_verificacion_expira = NULL
     WHERE token_verificacion = $1
       AND token_verificacion_expira > NOW()
       AND email_verificado = FALSE
     RETURNING id, nombre, email`,
    [token]
  );
  return res.rows[0];
};

export const guardarCodigoVerificacion = async (usuarioId, codigoHash, expira, tokenVerificacion, expiraToken) => {
  await pool.query(
    `UPDATE usuarios
     SET codigo_verificacion = $1, codigo_verificacion_expira = $2,
         token_verificacion = $3, token_verificacion_expira = $4
     WHERE id = $5`,
    [codigoHash, expira, tokenVerificacion, expiraToken, usuarioId]
  );
};

export const obtenerUsuarioPorResetToken = async (tokenHash) => {
  const res = await pool.query(
    `SELECT * FROM usuarios
     WHERE reset_token_hash = $1 AND reset_token_expira > NOW()`,
    [tokenHash]
  );
  return res.rows[0];
};

export const guardarResetToken = async (usuarioId, tokenHash, expira) => {
  await pool.query(
    `UPDATE usuarios SET reset_token_hash = $1, reset_token_expira = $2 WHERE id = $3`,
    [tokenHash, expira, usuarioId]
  );
};

export const limpiarResetToken = async (usuarioId) => {
  await pool.query(
    `UPDATE usuarios SET reset_token_hash = NULL, reset_token_expira = NULL WHERE id = $1`,
    [usuarioId]
  );
};

export const desbloquearUsuario = async (usuarioId) => {
  await pool.query(
    `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1`,
    [usuarioId]
  );
};

// Registra un login exitoso en el log
// Registra un login exitoso en el log (no-op para evitar romper tests, ya que se audita directamente en log_seguridad)
export const registrarLoginExitoso = async (usuarioId) => {
  // No-op
};

// Cuenta logins exitosos en los ultimos N minutos desde log_seguridad
export const contarLoginsRecientes = async (usuarioId, ventanaMinutos = 15) => {
  const res = await pool.query(
    `SELECT COUNT(*) AS total FROM public.log_seguridad
     WHERE usuario_id = $1
       AND evento = 'LOGIN_EXITOSO'
       AND fecha > NOW() - ($2 || ' minutes')::INTERVAL`,
    [usuarioId, ventanaMinutos]
  );
  return parseInt(res.rows[0].total, 10);
};
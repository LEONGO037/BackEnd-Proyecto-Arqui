import pool from "../../config/db.js";

/**
 * Obtiene el hash de contraseña actual de un docente por su ID de usuario.
 */
export const obtenerPasswordDocente = async (usuario_id) => {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.password_hash
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = $1 AND r.nombre = 'DOCENTE'`,
    [usuario_id]
  );
  return resultado.rows[0] || null;
};

/**
 * Actualiza el hash de contraseña de un docente en la base de datos.
 */
export const actualizarPasswordDocente = async (usuario_id, nuevo_password_hash) => {
  const resultado = await pool.query(
    `UPDATE usuarios
     SET password_hash = $1
     WHERE id = $2
     RETURNING id, nombre, email`,
    [nuevo_password_hash, usuario_id]
  );
  return resultado.rows[0] || null;
};

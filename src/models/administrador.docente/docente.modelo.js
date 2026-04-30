import pool from "../../config/db.js";

export const obtenerRolDocente = async () => {
  const resultado = await pool.query(
    "SELECT id FROM roles WHERE nombre = 'DOCENTE'"
  );
  return resultado.rows[0];
};

export const crearDocente = async (datos) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    email, password_hash, rol_id,
  } = datos;

  const resultado = await pool.query(
    `INSERT INTO usuarios
    (nombre, apellido_paterno, apellido_materno, email, password_hash,
     rol_id,
     email_verificado, debe_cambiar_password)
    VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE)
    RETURNING id, nombre, email`,
    [
      nombre, apellido_paterno, apellido_materno,
      email, password_hash, rol_id
    ]
  );
  return resultado.rows[0];
};

export const obtenerDocentes = async () => {
  const resultado = await pool.query(
    `SELECT
        u.id, u.nombre, u.apellido_paterno, u.apellido_materno,
        u.email
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = 'DOCENTE'
     ORDER BY u.id DESC`
  );
  return resultado.rows;
};

export const actualizarDocente = async (docenteId, datos) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    email,
  } = datos;

  const resultado = await pool.query(
    `UPDATE usuarios u
     SET nombre = $1, apellido_paterno = $2, apellido_materno = $3,
         email = $4
     FROM roles r
     WHERE u.rol_id = r.id
       AND r.nombre = 'DOCENTE'
       AND u.id = $5
     RETURNING u.id, u.nombre, u.apellido_paterno, u.apellido_materno,
               u.email`,
    [nombre, apellido_paterno, apellido_materno || null,
     email, docenteId]
  );

  if (resultado.rows.length === 0) throw new Error("Docente no encontrado");
  return resultado.rows[0];
};

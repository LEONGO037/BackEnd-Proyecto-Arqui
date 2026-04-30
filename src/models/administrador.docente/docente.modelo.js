import pool from "../../config/db.js";

export const obtenerRolDocente = async () => {
  const resultado = await pool.query(
    "SELECT id FROM roles WHERE nombre = 'DOCENTE'"
  );
  return resultado.rows[0];
};

export const crearDocente = async (datos) => {
  const {
    nombre, apellido_paterno, apellido_materno, ci_nit,
    email, password_hash, telefono, direccion, rol_id,
    codigo_verificacion, codigo_verificacion_expira,
  } = datos;

  const resultado = await pool.query(
    `INSERT INTO usuarios
    (nombre, apellido_paterno, apellido_materno, ci_nit, email, password_hash,
     telefono, direccion, rol_id,
     email_verificado, debe_cambiar_password,
     codigo_verificacion, codigo_verificacion_expira)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, FALSE, TRUE, $10,$11)
    RETURNING id, nombre, email`,
    [
      nombre, apellido_paterno, apellido_materno, ci_nit,
      email, password_hash, telefono, direccion, rol_id,
      codigo_verificacion, codigo_verificacion_expira,
    ]
  );
  return resultado.rows[0];
};

export const obtenerDocentes = async () => {
  const resultado = await pool.query(
    `SELECT
        u.id, u.nombre, u.apellido_paterno, u.apellido_materno,
        u.ci_nit, u.email, u.telefono, u.direccion
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = 'DOCENTE'
     ORDER BY u.id DESC`
  );
  return resultado.rows;
};

export const actualizarDocente = async (docenteId, datos) => {
  const {
    nombre, apellido_paterno, apellido_materno, ci_nit,
    email, telefono, direccion,
  } = datos;

  const resultado = await pool.query(
    `UPDATE usuarios u
     SET nombre = $1, apellido_paterno = $2, apellido_materno = $3,
         ci_nit = $4, email = $5, telefono = $6, direccion = $7
     FROM roles r
     WHERE u.rol_id = r.id
       AND r.nombre = 'DOCENTE'
       AND u.id = $8
     RETURNING u.id, u.nombre, u.apellido_paterno, u.apellido_materno,
               u.ci_nit, u.email, u.telefono, u.direccion`,
    [nombre, apellido_paterno, apellido_materno || null,
     ci_nit, email, telefono || null, direccion || null, docenteId]
  );

  if (resultado.rows.length === 0) throw new Error("Docente no encontrado");
  return resultado.rows[0];
};

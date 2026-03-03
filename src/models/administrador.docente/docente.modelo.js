import pool from "../../config/db.js";

export const obtenerRolDocente = async () => {
  const resultado = await pool.query(
    "SELECT id FROM roles WHERE nombre = 'DOCENTE'"
  );
  return resultado.rows[0];
};

export const crearDocente = async (datos) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    ci_nit,
    email,
    password_hash,
    telefono,
    direccion,
    rol_id
  } = datos;

  const resultado = await pool.query(
    `INSERT INTO usuarios 
    (nombre, apellido_paterno, apellido_materno, ci_nit, email, password_hash, telefono, direccion, rol_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, nombre, email`,
    [
      nombre,
      apellido_paterno,
      apellido_materno,
      ci_nit,
      email,
      password_hash,
      telefono,
      direccion,
      rol_id
    ]
  );

  return resultado.rows[0];
};
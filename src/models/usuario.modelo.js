import pool from "../config/db.js";

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
    nombre,
    apellido_paterno,
    apellido_materno,
    ci_nit,
    telefono,
    direccion,
    email,
    password_hash,
    rol_id
  } = datosUsuario;

  const resultado = await pool.query(
    `INSERT INTO usuarios 
    (nombre, apellido_paterno, apellido_materno, ci_nit, telefono, direccion, email, password_hash, rol_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, nombre, apellido_paterno, apellido_materno, email`,
    [
      nombre,
      apellido_paterno,
      apellido_materno,
      ci_nit,
      telefono,
      direccion,
      email,
      password_hash,
      rol_id
    ]
  );

  return resultado.rows[0];
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

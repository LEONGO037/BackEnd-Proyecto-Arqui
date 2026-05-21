import pool from "../../config/db.js";

export const crearEstudiante = async (datosEstudiante) => {
    const {
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
        password_hash,
        rol_id
    } = datosEstudiante;

    const query = `
    INSERT INTO public.usuarios
    (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, activo)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, nombre, apellido_paterno, email, rol_id;
  `;

    const values = [
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
        password_hash,
        rol_id
    ];

    try {
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        console.error("Error en crearEstudiante model:", error);
        throw error;
    }
};

export const buscarUsuarioPorEmailOCI = async (email) => {
    const query = `
    SELECT id, email
    FROM public.usuarios
    WHERE email = $1
    LIMIT 1;
  `;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
};

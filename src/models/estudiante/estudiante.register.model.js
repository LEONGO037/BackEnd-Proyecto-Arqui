import pool from "../../config/db.js";

/**
 * Crea un nuevo registro de usuario con rol de estudiante.
 * Según la estructura de la tabla 'usuarios'.
 * 
 * @param {Object} datosEstudiante - Objeto con la información del estudiante.
 * @returns {Promise<Object>} El usuario/estudiante creado.
 */
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
    (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, activo, email_verificado)
    VALUES ($1, $2, $3, $4, $5, $6, true, true)
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

/**
 * Busca un usuario por su email.
 * Utilizado para validación previa al registro.
 * 
 * @param {string} email 
 * @returns {Promise<Object|null>} El usuario encontrado o null.
 */
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

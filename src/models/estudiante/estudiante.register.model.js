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
        ci_nit,
        email,
        password_hash,
        telefono,
        direccion,
        rol_id
    } = datosEstudiante;

    const query = `
    INSERT INTO public.usuarios 
    (nombre, apellido_paterno, apellido_materno, ci_nit, email, password_hash, telefono, direccion, rol_id, activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
    RETURNING id, nombre, apellido_paterno, email, rol_id;
  `;

    const values = [
        nombre,
        apellido_paterno,
        apellido_materno,
        ci_nit,
        email,
        password_hash,
        telefono,
        direccion,
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
 * Busca un usuario por su email o su CI_NIT.
 * Utilizado para validación previa al registro.
 * 
 * @param {string} email 
 * @param {string} ci_nit 
 * @returns {Promise<Object|null>} El usuario encontrado o null.
 */
export const buscarUsuarioPorEmailOCI = async (email, ci_nit) => {
    const query = `
    SELECT id, email, ci_nit 
    FROM public.usuarios 
    WHERE email = $1 OR ci_nit = $2
    LIMIT 1;
  `;
    const { rows } = await pool.query(query, [email, ci_nit]);
    return rows[0] || null;
};

import pool from "../../config/db.js";

/**
 * Crea un nuevo registro de estudiante en la base de datos.
 * 
 * @param {Object} datosEstudiante - Objeto con la información del estudiante.
 * @returns {Promise<Object>} El estudiante creado.
 */
export const crearEstudiante = async (datosEstudiante) => {
    const {
        nombre,
        apellido_paterno,
        apellido_materno,
        ci,
        email,
        telefono,
        direccion,
        carrera
    } = datosEstudiante;

    const query = `
    INSERT INTO estudiantes 
    (nombre, apellido_paterno, apellido_materno, ci, email, telefono, direccion, carrera)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

    const values = [
        nombre,
        apellido_paterno,
        apellido_materno,
        ci,
        email,
        telefono,
        direccion,
        carrera
    ];

    try {
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        console.error("Error en crearEstudiante model:", error);
        throw error;
    }
};

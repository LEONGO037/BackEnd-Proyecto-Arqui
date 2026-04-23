// src/models/factura/factura.model.js
import pool from '../../config/db.js';

export const obtenerCursosPorIds = async (cursoIds) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, costo FROM cursos WHERE id = ANY($1)',
      [cursoIds]
    );
    return result.rows;
  } catch (error) {
    console.error('Error en modelo obtenerCursosPorIds:', error.message);
    throw new Error('Error al consultar los cursos en la base de datos');
  }
};
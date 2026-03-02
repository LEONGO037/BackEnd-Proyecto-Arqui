// src/controllers/cursos/cursos.controller.js
import pool from "../../config/db.js";

// GET /api/cursos  — lista todos los cursos activos
export const getCursos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, costo, cupo_maximo FROM cursos WHERE activo = true ORDER BY id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

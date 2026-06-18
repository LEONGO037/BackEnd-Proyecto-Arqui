// crear_tabla_evaluacion.js
// Script de un solo uso: crea la tabla `configuracion_evaluacion`
// usando la MISMA conexión del backend (no requiere acceso al panel de Supabase).
// Uso:  node crear_tabla_evaluacion.js
import pool from "./src/config/db.js";

const sql = `
CREATE TABLE IF NOT EXISTS public.configuracion_evaluacion (
  id                SERIAL PRIMARY KEY,
  curso_id          INTEGER NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  porcentaje        NUMERIC(10,2) DEFAULT 0,
  tipo              VARCHAR(100),
  fecha_vencimiento TIMESTAMP,
  orden             INTEGER
);
`;

(async () => {
  try {
    await pool.query(sql);
    console.log("✅ Tabla 'configuracion_evaluacion' creada correctamente (o ya existía).");
  } catch (err) {
    console.error("❌ Error al crear la tabla:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pkg;

// ---------------------------------------------------------------------------
// Normalizar fechas de PostgreSQL a ISO 8601 completo
//
// Por defecto el driver `pg` serializa TIMESTAMPTZ como:
//   "2026-05-27 09:31:52.578332+00"   ← espacio + offset sin ":"
// Eso hace que new Date() falle en algunos entornos del navegador.
// Aquí forzamos el formato ISO 8601 estándar:
//   "2026-05-27T09:31:52.578Z"
// ---------------------------------------------------------------------------
const parseTstz = (val) => {
  if (!val) return null;
  // Convertir "2026-05-27 09:31:52.578332+00" → Date → .toISOString()
  // Primero reemplazamos el espacio por T para que Date lo reconozca
  const normalized = val.replace(" ", "T");
  // Convertir "+00" al final a "+00:00" si no tiene ":"
  const fixed = normalized.replace(/([+-]\d{2})$/, "$1:00");
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? val : d.toISOString();
};

types.setTypeParser(1184, parseTstz); // timestamptz
types.setTypeParser(1114, parseTstz); // timestamp without time zone


const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Forzamos IPv4 para evitar el ETIMEDOUT
  family: 4,
  // Supabase requiere SSL
  ssl: {
    rejectUnauthorized: false,
  },
});

// Validamos conexión sin importar el logger (evita import circular).
pool.query("SELECT 1")
  .then(() => {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.log("Conectado a Supabase (PostgreSQL)");
    }
  })
  .catch(() => {
    // Solo informa que falló sin imprimir el error completo en consola
    if (process.env.NODE_ENV !== "production") {
      console.error("Error de conexión a la base de datos");
    }
  });

// Errores del pool en runtime (idle clients, etc.)
pool.on("error", () => {
  if (process.env.NODE_ENV !== "production") {
    console.error("Error inesperado en cliente inactivo del pool");
  }
});

export default pool;

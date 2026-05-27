import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

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

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
  // 👇 CORRECCIÓN 1: Forzamos IPv4 para evitar el ETIMEDOUT
  family: 4,
  // 👇 CORRECCIÓN 2: Supabase requiere SSL (conexión segura)
  ssl: {
    rejectUnauthorized: false, // Esto permite conectar aunque el certificado no esté verificado localmente
  },
});

pool.query("SELECT 1")
  .then(() => console.log("✅ Conectado a Supabase (PostgreSQL)"))
  .catch(err => console.error("❌ Error conexión BD:", err));

export default pool;
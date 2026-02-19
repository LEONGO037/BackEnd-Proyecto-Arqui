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
});

pool.query("SELECT 1")
  .then(() => console.log("Conectado a PostgreSQL"))
  .catch(err => console.error("Error conexión BD:", err));

export default pool;

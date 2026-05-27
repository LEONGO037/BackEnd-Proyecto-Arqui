import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from backend directory .env
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

const migrationFile = path.resolve('src/config/migrations/006_optimize_auditoria_login_cleanup.sql');

async function run() {
  console.log('Iniciando migración desde:', migrationFile);
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('Conectándose a Supabase...');
    const client = await pool.connect();
    console.log('Ejecutando SQL...');
    await client.query(sql);
    console.log('Migración completada exitosamente.');
    client.release();
  } catch (err) {
    console.error('Error al ejecutar migración:', err);
  } finally {
    await pool.end();
  }
}

run();

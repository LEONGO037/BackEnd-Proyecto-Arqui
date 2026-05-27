import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env
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

async function run() {
  console.log('Conectándose a Supabase para saneamiento integral de logs...');
  try {
    const client = await pool.connect();
    console.log('Ejecutando script de depuración en public.log_aplicacion...');
    
    // Contar cuántos registros calificarían para ser eliminados
    const countRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.log_aplicacion 
      WHERE (
        modulo = 'express' 
        AND (
          nivel = 'WARN' 
          OR (detalle->>'status')::int < 500 
          OR mensaje LIKE '%Token no proporcionado%' 
          OR mensaje LIKE '%Token inválido%'
        )
      ) OR modulo = 'riesgos'
        OR evento LIKE 'MATRIZ_%';
    `);
    const count = countRes.rows[0].count;
    console.log(`Registros encontrados para eliminar (advertencias de Express + eventos de Riesgos): ${count}`);

    if (count > 0) {
      const deleteRes = await client.query(`
        DELETE FROM public.log_aplicacion 
        WHERE (
          modulo = 'express' 
          AND (
            nivel = 'WARN' 
            OR (detalle->>'status')::int < 500 
            OR mensaje LIKE '%Token no proporcionado%' 
            OR mensaje LIKE '%Token inválido%'
          )
        ) OR modulo = 'riesgos'
          OR evento LIKE 'MATRIZ_%';
      `);
      console.log(`Depuración finalizada. Filas eliminadas: ${deleteRes.rowCount}`);
    } else {
      console.log('No se encontraron registros de ruido o riesgos para depurar.');
    }

    client.release();
  } catch (err) {
    console.error('Error al depurar la base de datos:', err);
  } finally {
    await pool.end();
  }
}

run();

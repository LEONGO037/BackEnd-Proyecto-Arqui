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

// Módulos críticos de negocio que SÍ deben aparecer en log_aplicacion
const MODULOS_PERMITIDOS = ['cursos', 'inscripciones', 'pagos', 'facturas'];

async function run() {
  console.log('Conectándose a Supabase para saneamiento integral de logs de aplicación...');
  try {
    const client = await pool.connect();
    console.log('✅ Conectado. Ejecutando purga de log_aplicacion...\n');
    
    // 1. Contar registros fuera de módulos críticos
    const countRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.log_aplicacion 
      WHERE modulo NOT IN (${MODULOS_PERMITIDOS.map((_, i) => `$${i + 1}`).join(', ')})
    `, MODULOS_PERMITIDOS);
    
    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`📊 Registros encontrados fuera de módulos críticos [${MODULOS_PERMITIDOS.join(', ')}]: ${count}`);

    if (count > 0) {
      // 2. Listar módulos afectados para referencia
      const modulosRes = await client.query(`
        SELECT modulo, COUNT(*) as total
        FROM public.log_aplicacion
        WHERE modulo NOT IN (${MODULOS_PERMITIDOS.map((_, i) => `$${i + 1}`).join(', ')})
        GROUP BY modulo
        ORDER BY total DESC
      `, MODULOS_PERMITIDOS);
      
      console.log('\n📋 Desglose por módulo a eliminar:');
      modulosRes.rows.forEach(row => {
        console.log(`   - ${row.modulo}: ${row.total} registros`);
      });

      // 3. Eliminar los registros fuera de módulos críticos
      const deleteRes = await client.query(`
        DELETE FROM public.log_aplicacion 
        WHERE modulo NOT IN (${MODULOS_PERMITIDOS.map((_, i) => `$${i + 1}`).join(', ')})
      `, MODULOS_PERMITIDOS);
      
      console.log(`\n✅ Depuración finalizada. Filas eliminadas: ${deleteRes.rowCount}`);
    } else {
      console.log('✅ No se encontraron registros de módulos no críticos para depurar.');
    }

    // 4. Mostrar cuántos registros quedan después de la purga
    const remainingRes = await client.query(
      'SELECT COUNT(*) as count FROM public.log_aplicacion'
    );
    console.log(`\n📊 Registros en log_aplicacion después de la purga: ${remainingRes.rows[0].count}`);

    client.release();
  } catch (err) {
    console.error('❌ Error al depurar la base de datos:', err);
  } finally {
    await pool.end();
  }
}

run();

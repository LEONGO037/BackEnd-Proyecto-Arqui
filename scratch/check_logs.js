import pool from '../src/config/db.js';

async function checkLogs() {
  try {
    const resApp = await pool.query('SELECT * FROM public.log_aplicacion ORDER BY id DESC LIMIT 1');
    console.log('Ultimo log de aplicacion:', resApp.rows[0]);

    const resSec = await pool.query('SELECT * FROM public.log_seguridad ORDER BY id DESC LIMIT 1');
    console.log('Ultimo log de seguridad:', resSec.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLogs();

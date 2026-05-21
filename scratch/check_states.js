import pool from '../src/config/db.js';

async function checkStates() {
  try {
    const res = await pool.query('SELECT DISTINCT estado FROM docente_curso');
    console.log('Current states in docente_curso:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStates();

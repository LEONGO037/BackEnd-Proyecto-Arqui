import pool from '../src/config/db.js';

async function fixStates() {
  try {
    const res = await pool.query("UPDATE docente_curso SET estado = 'NO_ACTIVO' WHERE estado = 'activo'");
    console.log('Normalized', res.rowCount, 'records.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixStates();
